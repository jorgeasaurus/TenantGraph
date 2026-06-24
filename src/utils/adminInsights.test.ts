import { describe, expect, it } from 'vitest';
import type { TenantGraph } from '../models/tenantGraph';
import { analyzeAdminImpact, investigationSummaryText } from './adminInsights';

const graph: TenantGraph = {
  nodes: [
    { id: 'user:adele', type: 'user', label: 'Adele Vance' },
    { id: 'device:surface', type: 'device', label: 'SURFACE-01', metadata: { compliance: 'noncompliant' } },
    { id: 'group:all-users', type: 'group', label: 'All users', metadata: { virtual: true } },
    { id: 'app:portal', type: 'app', label: 'Company Portal' },
    { id: 'appAssignment:portal-required', type: 'appAssignment', label: 'required', metadata: { intent: 'required' } },
    {
      id: 'settingsCatalogPolicy:security',
      type: 'settingsCatalogPolicy',
      label: 'Windows security baseline',
      metadata: { modified: new Date().toISOString() },
    },
  ],
  edges: [
    { id: 'user-device', source: 'user:adele', target: 'device:surface', type: 'primaryUser' },
    { id: 'app-assignment', source: 'app:portal', target: 'appAssignment:portal-required', type: 'assignment' },
    { id: 'assignment-target', source: 'appAssignment:portal-required', target: 'group:all-users', type: 'target' },
    { id: 'policy-target', source: 'settingsCatalogPolicy:security', target: 'group:all-users', type: 'assignment' },
  ],
};

describe('admin insights', () => {
  it('summarizes tenant hygiene and broad assignment findings', () => {
    const analysis = analyzeAdminImpact(graph, undefined);

    expect(analysis.blastRadius).toMatchObject({
      apps: 1,
      devices: 1,
      groups: 1,
      policies: 1,
      users: 1,
    });
    expect(analysis.findings.map((finding) => finding.title)).toEqual(
      expect.arrayContaining([
        'SURFACE-01 is noncompliant',
        'All users assignment target',
        'required assignment needs review',
      ]),
    );
    expect(analysis.recentChanges[0]?.title).toBe('Windows security baseline changed recently');
  });

  it('scopes blast radius to the selected object neighborhood', () => {
    const selected = graph.nodes.find((node) => node.id === 'app:portal');
    const analysis = analyzeAdminImpact(graph, selected);

    expect(analysis.summary).toContain('Company Portal currently touches');
    expect(analysis.blastRadius).toMatchObject({
      apps: 1,
      groups: 1,
      policies: 1,
      users: 0,
    });
    expect(analysis.findings.map((finding) => finding.title)).toContain('required assignment needs review');
  });

  it('does not let out-of-neighborhood nodes affect selected object findings', () => {
    const selected = graph.nodes.find((node) => node.id === 'app:portal');
    const analysis = analyzeAdminImpact(
      {
        nodes: [
          ...graph.nodes,
          { id: 'app:boundary', type: 'app', label: 'Boundary app' },
          { id: 'group:outside', type: 'group', label: 'All outside users', metadata: { virtual: true } },
        ],
        edges: [
          ...graph.edges,
          { id: 'group-boundary', source: 'group:all-users', target: 'app:boundary', type: 'assignment' },
          { id: 'boundary-outside', source: 'app:boundary', target: 'group:outside', type: 'assignment' },
        ],
      },
      selected,
    );

    expect(analysis.blastRadius.apps).toBe(2);
    expect(analysis.blastRadius.groups).toBe(1);
    expect(analysis.findings.map((finding) => finding.title)).not.toContain('All outside users assignment target');
  });

  it('exports a concise investigation summary', () => {
    const selected = graph.nodes.find((node) => node.id === 'app:portal');
    const analysis = analyzeAdminImpact(graph, selected);
    const text = investigationSummaryText(graph, selected, analysis);

    expect(text).toContain('Tenant Graph investigation: Company Portal (app)');
    expect(text).toContain('Blast radius: 0 users, 0 devices, 1 groups, 1 apps, 1 policies');
    expect(text).toContain('[warning] required assignment needs review');
  });
});
