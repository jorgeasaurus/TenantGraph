import { describe, expect, it } from 'vitest';
import { loadSignInLogs } from '../graph/signInLogs';
import { expandTenantNode } from '../graph/tenantGraphExpansion';
import { loadTenantOverview, searchTenantObjects } from '../graph/tenantGraphSources';
import { tenantNodeTypes } from '../models/tenantGraph';
import { sampleGuideSteps } from '../components/demo/sampleGuideSteps';
import { sampleAppIconSources } from './sampleAppIcons';
import { sampleGroups, sampleManagedDevices, sampleMobileApps, sampleUserPhotoDataUrl } from './sampleTenantData';
import { sampleTenantClient } from './sampleTenantClient';

describe('sample tenant client', () => {
  it('loads a representative overview without Microsoft Graph', async () => {
    const result = await loadTenantOverview(sampleTenantClient);
    const types = new Set(result.graph.nodes.map((node) => node.type));
    const primaryUserIds = new Set(
      sampleManagedDevices
        .map((device) => device.userId)
        .filter((userId): userId is string => typeof userId === 'string' && userId !== '00000000-0000-0000-0000-000000000000'),
    );

    expect(result.warnings).toEqual([]);
    expect(result.graph.nodes.length).toBeGreaterThanOrEqual(120);
    expect(result.graph.nodes.filter((node) => node.type === 'user')).toHaveLength(primaryUserIds.size);
    expect(result.graph.nodes.filter((node) => node.type === 'device')).toHaveLength(sampleManagedDevices.length);
    expect(result.graph.nodes.filter((node) => node.type === 'group')).toHaveLength(sampleGroups.length);
    expect(result.graph.nodes.filter((node) => node.type === 'app')).toHaveLength(sampleMobileApps.length);
    expect(result.graph.nodes.map((node) => node.label)).toEqual(
      expect.arrayContaining(['Severed Floor', 'Macrodata Refinement', 'Optics and Design']),
    );
    expect(result.graph.edges.map((edge) => edge.type)).not.toEqual(expect.arrayContaining(['member', 'memberOf']));
    expect([...types]).toEqual(
      expect.arrayContaining([
        'app',
        'assignmentFilter',
        'compliancePolicy',
        'device',
        'deviceConfigurationProfile',
        'enrollmentProfile',
        'group',
        'scopeTag',
        'settingsCatalogPolicy',
        'user',
      ]),
    );
  });

  it('supports sample search across directory and Intune object families', async () => {
    const result = await searchTenantObjects(sampleTenantClient, 'Kier', [...tenantNodeTypes]);
    const labels = result.graph.nodes.map((node) => node.label);
    const groupResult = await searchTenantObjects(sampleTenantClient, 'Severed', [...tenantNodeTypes]);
    const groupLabels = groupResult.graph.nodes.filter((node) => node.type === 'group').map((node) => node.label);

    expect(labels).toEqual(expect.arrayContaining(['Kier Keeper', 'Kier Compliance Committee', 'Kier Tenant Administrator']));
    expect(groupLabels.length).toBeGreaterThanOrEqual(1);
    expect(groupLabels).toEqual(expect.arrayContaining(['Severed Floor']));
    expect(sampleGroups.length).toBeGreaterThanOrEqual(20);
  });

  it('uses Lumon sample apps with distinct large icons', async () => {
    const result = await loadTenantOverview(sampleTenantClient);
    const apps = result.graph.nodes.filter((node) => node.type === 'app');
    const labels = apps.map((node) => node.label);
    const iconDataUrls = apps.map((node) => node.iconDataUrl);

    expect(labels).toEqual(
      expect.arrayContaining([
        'Kier Keeper',
        'Macrodata Refiner',
        'Waffle Party Planner',
        'Compunction Statement Studio',
        'Perpetuity Wing Guide',
        'Defiant Jazz Detector',
        'Egg Bar Scheduler',
        'Break Room Recorder',
        'Wellness Memory Viewer',
        'Goat Ledger',
        'Overtime Contingency Console',
        'Lumon Handbook',
        'Eagan Bingo',
        'Cold Harbor Tracker',
        'Optics Design Catalog',
        'Severed Mail',
        'Melon Bar Inventory',
        'Security Desk Console',
      ]),
    );
    expect(labels.join(' ')).not.toMatch(/\[IHD]|Device Security|Connectivity Settings|policy/i);
    expect(iconDataUrls.every((iconDataUrl) => iconDataUrl?.startsWith('data:image/'))).toBe(true);
    expect(new Set(iconDataUrls).size).toBe(apps.length);
    expect(Object.values(sampleAppIconSources).map((source) => source.sourceUrl)).toEqual(
      expect.arrayContaining([
        'https://lumon.example/apps/kier-keeper',
        'https://lumon.example/apps/overtime-contingency-console',
        'https://lumon.example/apps/macrodata-refiner',
      ]),
    );
  });

  it('uses provided profile photos for key Lumon sample users', async () => {
    const result = await loadTenantOverview(sampleTenantClient);
    const mark = result.graph.nodes.find((node) => node.id === 'user:user-mark-scout');

    expect(sampleUserPhotoDataUrl('user-mark-scout')).toBe('/sample-users/mark-scout.png');
    expect(sampleUserPhotoDataUrl('user-helly-riggs')).toBe('/sample-users/helly-riggs.png');
    expect(sampleUserPhotoDataUrl('user-irving-bailiff')).toBe('/sample-users/irving-bailiff.png');
    expect(sampleUserPhotoDataUrl('user-dylan-george')).toBe('/sample-users/dylan-george.png');
    expect(sampleUserPhotoDataUrl('user-seth-milchick')).toBe('/sample-users/seth-milchick.png');
    expect(sampleUserPhotoDataUrl('user-harmony-cobel')).toMatch(/^data:image\/svg\+xml,/);
    expect(mark?.iconDataUrl).toBe('/sample-users/mark-scout.png');
  });

  it('expands a sample user into groups, roles, and devices', async () => {
    const overview = await loadTenantOverview(sampleTenantClient);
    const user = overview.graph.nodes.find((node) => node.id === 'user:user-harmony-cobel');

    if (!user || user.type !== 'user') {
      throw new Error('Sample signed-in user was not loaded.');
    }
    const result = await expandTenantNode(sampleTenantClient, user, 2);
    const labels = result.graph.nodes.map((node) => node.label);
    const relationshipTypes = result.graph.edges.map((edge) => edge.type);

    expect(labels).toEqual(
      expect.arrayContaining(['Eagan Executive Circle', 'Kier Tenant Administrator', 'EXEC-COBEL-W365']),
    );
    expect(relationshipTypes).toEqual(expect.arrayContaining(['memberOf', 'primaryUser']));
  });

  it('serves Conditional Access sample sign-ins with policy details', async () => {
    const overview = await loadTenantOverview(sampleTenantClient);
    const user = overview.graph.nodes.find((node) => node.id === 'user:user-mark-scout');

    if (!user || user.type !== 'user') {
      throw new Error('Sample signed-in user was not loaded.');
    }
    const signInNode = { ...user, type: 'user' as const };

    const result = await loadSignInLogs(sampleTenantClient, {
      caFilter: 'all',
      includePolicyDetails: true,
      node: signInNode,
      rangeDays: 7,
      resultFilter: 'all',
      top: 25,
    });

    expect(result.events.map((event) => event.ca.state)).toEqual(expect.arrayContaining(['applied', 'failed']));
    expect(result.events.map((event) => event.appDisplayName)).toEqual(expect.arrayContaining(['Macrodata Refiner']));
    expect(result.events.some((event) => event.ca.policies.length > 0)).toBe(true);
  });
});

describe('sample tenant guide', () => {
  it('covers the core sample workflow surfaces', () => {
    expect(sampleGuideSteps.map((step) => step.target)).toEqual(
      expect.arrayContaining([
        '[data-guide="toolbar-search"]',
        '[data-guide="object-types"]',
        '[data-guide="relationships"]',
        '[data-guide="graph-canvas"]',
        '[data-guide="details"]',
        '[data-guide="path-finder"]',
        '[data-guide="signins"]',
      ]),
    );
  });

  it('scrolls every referenced guide target into view', () => {
    const targetedSteps = sampleGuideSteps.filter((step) => step.target);

    expect(targetedSteps).toHaveLength(sampleGuideSteps.length);
    for (const step of targetedSteps) {
      expect(step.scrollBlock).toBe('center');
    }
  });
});
