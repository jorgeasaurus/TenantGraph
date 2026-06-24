import { describe, expect, it } from 'vitest';
import { loadSignInLogs } from '../graph/signInLogs';
import { expandTenantNode } from '../graph/tenantGraphExpansion';
import { loadTenantOverview, searchTenantObjects } from '../graph/tenantGraphSources';
import { tenantNodeTypes } from '../models/tenantGraph';
import { sampleGuideSteps } from '../components/demo/sampleGuideSteps';
import { sampleAppIconSources } from './sampleAppIcons';
import { sampleGroups, sampleManagedDevices, sampleMobileApps } from './sampleTenantData';
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
    expect(result.graph.nodes.length).toBeGreaterThanOrEqual(80);
    expect(result.graph.nodes.filter((node) => node.type === 'user')).toHaveLength(primaryUserIds.size);
    expect(result.graph.nodes.filter((node) => node.type === 'device')).toHaveLength(sampleManagedDevices.length);
    expect(result.graph.nodes.filter((node) => node.type === 'app')).toHaveLength(sampleMobileApps.length);
    expect([...types]).toEqual(
      expect.arrayContaining([
        'app',
        'assignmentFilter',
        'compliancePolicy',
        'device',
        'deviceConfigurationProfile',
        'enrollmentProfile',
        'scopeTag',
        'settingsCatalogPolicy',
        'user',
      ]),
    );
  });

  it('supports sample search across directory and Intune object families', async () => {
    const result = await searchTenantObjects(sampleTenantClient, 'Intune', [...tenantNodeTypes]);
    const labels = result.graph.nodes.map((node) => node.label);
    const groupResult = await searchTenantObjects(sampleTenantClient, 'users', [...tenantNodeTypes]);
    const groupLabels = groupResult.graph.nodes.filter((node) => node.type === 'group').map((node) => node.label);

    expect(labels).toEqual(expect.arrayContaining(['Intune Company Portal', 'Intune Administrators', 'Intune Administrator']));
    expect(groupLabels.length).toBeGreaterThanOrEqual(6);
    expect(groupLabels).toEqual(expect.arrayContaining(['Finance application users', 'Procurement app users', 'Android pilot users']));
    expect(sampleGroups.length).toBeGreaterThanOrEqual(15);
  });

  it('uses real sample apps with distinct large icons', async () => {
    const result = await loadTenantOverview(sampleTenantClient);
    const apps = result.graph.nodes.filter((node) => node.type === 'app');
    const labels = apps.map((node) => node.label);
    const iconDataUrls = apps.map((node) => node.iconDataUrl);

    expect(labels).toEqual(
      expect.arrayContaining([
        'Intune Company Portal',
        'Microsoft Edge',
        'Microsoft Defender',
        'Windows App Mobile',
        'SAP Concur',
        'Microsoft Outlook',
        'Microsoft Teams',
        'Microsoft OneDrive',
        'Zoom Workplace',
        'Adobe Acrobat Reader',
        'ServiceNow Agent',
        'Salesforce',
        'Slack',
        'Microsoft Power BI',
        'Microsoft Planner',
        'Microsoft Loop',
      ]),
    );
    expect(labels.join(' ')).not.toMatch(/\[IHD]|Device Security|Connectivity Settings|policy/i);
    expect(iconDataUrls.every((iconDataUrl) => iconDataUrl?.startsWith('data:image/'))).toBe(true);
    expect(new Set(iconDataUrls).size).toBe(apps.length);
    expect(Object.values(sampleAppIconSources).map((source) => source.sourceUrl)).toEqual(
      expect.arrayContaining([
        'https://apps.apple.com/us/app/intune-company-portal/id719171358',
        'https://apps.apple.com/us/app/windows-app-mobile/id714464092',
        'https://apps.apple.com/us/app/sap-concur/id335023774',
      ]),
    );
  });

  it('expands a sample user into groups, roles, and devices', async () => {
    const overview = await loadTenantOverview(sampleTenantClient);
    const user = overview.graph.nodes.find((node) => node.id === 'user:user-adele');

    if (!user || user.type !== 'user') {
      throw new Error('Sample signed-in user was not loaded.');
    }
    const result = await expandTenantNode(sampleTenantClient, user, 2);
    const labels = result.graph.nodes.map((node) => node.label);
    const relationshipTypes = result.graph.edges.map((edge) => edge.type);

    expect(labels).toEqual(
      expect.arrayContaining(['Intune Administrators', 'Intune Administrator', 'W365-ADELE-01']),
    );
    expect(relationshipTypes).toEqual(expect.arrayContaining(['memberOf', 'primaryUser']));
  });

  it('serves Conditional Access sample sign-ins with policy details', async () => {
    const overview = await loadTenantOverview(sampleTenantClient);
    const user = overview.graph.nodes.find((node) => node.id === 'user:user-adele');

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
