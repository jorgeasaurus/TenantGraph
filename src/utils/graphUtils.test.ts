import { describe, expect, it } from 'vitest';
import { mockTenantGraph } from '../test/mockGraph';
import { assignmentsToGraph, directoryObjectsToGraph, mobileAppToNode } from '../graph/adapters';
import { GraphError } from '../graph/client';
import { expandTenantNode } from '../graph/tenantGraphExpansion';
import { loadTenantOverview, searchTenantObjects } from '../graph/tenantGraphSources';
import type { TenantGraph } from '../models/tenantGraph';
import { mockGraphClient } from '../test/mockGraphClient';
import {
  filterNodesByVisibleTypes,
  filterTenantGraph,
  isExpandableNode,
  isVirtualTenantGroup,
  limitTenantGraph,
  mergeTenantGraphs,
  nodeExpansionState,
  searchLocalNodes,
} from './graphUtils';
import {
  describeReadableRelationship,
  explainReadablePath,
  readablePathCandidates,
  summarizeReadableClusters,
  summarizeReadableNode,
} from './readableGraph';

describe('graph utils', () => {
  it('merges nodes and filters hidden relationships', () => {
    const graph = mergeTenantGraphs(mockTenantGraph, {
      nodes: [{ id: 'device:surface-01', type: 'device', label: 'SURFACE-01 updated' }],
      edges: [],
    });

    expect(graph.nodes.find((node) => node.id === 'device:surface-01')?.label).toBe('SURFACE-01 updated');

    const filtered = filterTenantGraph(
      graph,
      new Set(['device', 'user']),
      new Set(['primaryUser']),
    );

    expect(filtered.nodes).toHaveLength(2);
    expect(filtered.edges).toHaveLength(1);
  });

  it('limits displayed graph nodes while keeping selected context first', () => {
    const graph: TenantGraph = {
      nodes: [
        { id: 'node:a', type: 'user', label: 'A' },
        { id: 'node:b', type: 'device', label: 'B' },
        { id: 'node:c', type: 'group', label: 'C' },
        { id: 'node:d', type: 'app', label: 'D' },
        { id: 'node:e', type: 'app', label: 'E' },
      ],
      edges: [
        { id: 'a-b', source: 'node:a', target: 'node:b', type: 'member' },
        { id: 'a-c', source: 'node:a', target: 'node:c', type: 'member' },
        { id: 'd-e', source: 'node:d', target: 'node:e', type: 'member' },
      ],
    };

    const result = limitTenantGraph(graph, 3, 'node:a');

    expect(result.totalNodeCount).toBe(5);
    expect(result.hiddenNodeCount).toBe(2);
    expect(result.graph.nodes.map((node) => node.id)).toEqual(['node:a', 'node:b', 'node:c']);
    expect(result.graph.edges.map((edge) => edge.id)).toEqual(['a-b', 'a-c']);
  });

  it('returns all local search matches so the UI owns result paging', () => {
    const graph: TenantGraph = {
      nodes: Array.from({ length: 45 }, (_, index) => ({
        id: `user:${index}`,
        type: 'user',
        label: `User ${index}`,
      })),
      edges: [],
    };

    expect(searchLocalNodes(graph, '')).toHaveLength(45);
    expect(searchLocalNodes(graph, 'User 4')).toHaveLength(6);
  });

  it('filters remote search results by the active object type filters', () => {
    const nodes: TenantGraph['nodes'] = [
      { id: 'assignmentFilter:ios', type: 'assignmentFilter', label: 'iOS filter' },
      { id: 'compliancePolicy:ios', type: 'compliancePolicy', label: 'iOS compliance' },
      { id: 'user:ios-admin', type: 'user', label: 'iOS Admin' },
    ];

    expect(filterNodesByVisibleTypes(nodes, new Set(['assignmentFilter', 'compliancePolicy']))).toEqual([
      nodes[0],
      nodes[1],
    ]);
    expect(filterNodesByVisibleTypes(nodes, new Set())).toEqual([]);
  });

  it('describes whether selected nodes can expand', () => {
    expect(isExpandableNode({ type: 'settingsCatalogPolicy' })).toBe(true);
    expect(isExpandableNode({ type: 'directoryRole' })).toBe(true);
    expect(isExpandableNode({ type: 'appAssignment' })).toBe(false);
    expect(isExpandableNode({ id: 'group:all-users', type: 'group', label: 'All users' })).toBe(false);
    expect(isVirtualTenantGroup({ id: 'group:all-devices', type: 'group', label: 'All devices' })).toBe(true);

    expect(nodeExpansionState({ type: 'settingsCatalogPolicy' }, 1, 0)).toMatchObject({
      canExpand: true,
      label: 'Expand',
    });

    expect(nodeExpansionState({ type: 'settingsCatalogPolicy' }, 1, 1)).toMatchObject({
      canExpand: false,
      label: 'Expanded depth 1',
      helpText: 'Increase relationship depth to expand farther.',
    });

    expect(nodeExpansionState({ type: 'assignmentFilter' }, 1, 0)).toMatchObject({
      canExpand: false,
      label: 'No expansion',
    });

    expect(nodeExpansionState({ id: 'group:all-users', type: 'group', label: 'All users' }, 1, 0)).toMatchObject({
      canExpand: false,
      label: 'No expansion',
      helpText: 'This tenant-wide assignment target is not a real Entra group.',
    });
  });

  it('summarizes nodes and relationships in plain English', () => {
    const user = mockTenantGraph.nodes.find((node) => node.id === 'user:me');
    const summary = summarizeReadableNode(mockTenantGraph, user);

    expect(summary?.objectType).toBe('person account');
    expect(summary?.summary).toContain('Follow groups and devices');
    expect(summary?.impact).toContain('1 device');
    expect(summary?.impact).toContain('1 group');

    const edge = mockTenantGraph.edges.find((candidate) => candidate.type === 'memberOf');
    const group = mockTenantGraph.nodes.find((node) => node.id === 'group:intune-admins');

    expect(edge).toBeDefined();
    expect(describeReadableRelationship(edge!, user, group).sentence).toBe(
      'Adele Vance is a member of Intune Admin Devices.',
    );
  });

  it('summarizes visible graph clusters for readable mode', () => {
    const summaries = summarizeReadableClusters(mockTenantGraph);

    expect(summaries.map((summary) => summary.id)).toEqual([
      'people',
      'devices',
      'groups',
      'apps',
      'policies',
    ]);
    expect(summaries.find((summary) => summary.id === 'devices')).toMatchObject({
      count: 1,
      detail: '1 Windows',
    });
    expect(summaries.find((summary) => summary.id === 'policies')).toMatchObject({
      count: 1,
      detail: '1 compliance',
    });
  });

  it('adds readable impact badges for assignment and broad target signals', () => {
    const graph: TenantGraph = {
      nodes: [
        {
          id: 'app:portal',
          type: 'app',
          label: 'Company Portal',
          metadata: { assigned: true, modified: new Date().toISOString() },
        },
        {
          id: 'appAssignment:portal-required',
          type: 'appAssignment',
          label: 'required',
          metadata: { intent: 'required' },
        },
        {
          id: 'group:all-devices',
          type: 'group',
          label: 'All devices',
        },
      ],
      edges: [],
    };

    expect(summarizeReadableNode(graph, graph.nodes[0])?.badges.map((badge) => badge.label)).toEqual([
      'Has assignments',
      'Recently changed',
    ]);
    expect(summarizeReadableNode(graph, graph.nodes[1])?.badges.map((badge) => badge.label)).toContain(
      'Required delivery',
    );
    expect(summarizeReadableNode(graph, graph.nodes[2])?.badges.map((badge) => badge.label)).toContain(
      'Broad target',
    );
  });

  it('explains why a selected object is connected to an app or policy', () => {
    const result = explainReadablePath(mockTenantGraph, 'user:me', 'app:company-portal');
    const user = mockTenantGraph.nodes.find((node) => node.id === 'user:me');
    const candidates = readablePathCandidates(mockTenantGraph, user);

    expect(result?.summary).toBe('Company Portal is connected to Adele Vance through 2 relationships.');
    expect(result?.steps.map((step) => step.relationship.sentence)).toEqual([
      'Adele Vance is a member of Intune Admin Devices.',
      'Intune Admin Devices has an assignment rule that leads to Company Portal.',
    ]);
    expect(candidates.map((candidate) => candidate.id)).toContain('app:company-portal');
    expect(explainReadablePath(mockTenantGraph, 'user:me', 'missing')).toBeUndefined();
  });

  it('marks all-users assignment targets as virtual non-expandable nodes', () => {
    const graph = assignmentsToGraph(
      { id: 'app:portal', type: 'app', label: 'Company Portal' },
      [
        {
          id: 'assignment:all-users',
          intent: 'required',
          target: {
            '@odata.type': '#microsoft.graph.allLicensedUsersAssignmentTarget',
          },
        },
      ],
    );
    const target = graph.nodes.find((node) => node.id === 'group:all-users');

    expect(target).toMatchObject({
      label: 'All users',
      metadata: { target: 'allLicensedUsers', virtual: true },
    });
    expect(isVirtualTenantGroup(target)).toBe(true);
    expect(isExpandableNode(target)).toBe(false);
  });

  it('labels directory role memberships with display names', () => {
    const graph = directoryObjectsToGraph([
      {
        '@odata.type': '#microsoft.graph.directoryRole',
        id: 'role-id',
        displayName: 'Global Administrator',
        description: 'Can manage all aspects of Entra ID and Microsoft services.',
        roleTemplateId: 'template-id',
      },
    ]);

    expect(graph.nodes[0]).toMatchObject({
      id: 'directoryRole:role-id',
      type: 'directoryRole',
      label: 'Global Administrator',
      subtitle: 'Directory role',
      metadata: { roleTemplateId: 'template-id' },
    });
  });

  it('normalizes mobile app largeIcon content into a renderer-only icon field', () => {
    const node = mobileAppToNode({
      id: 'app-id',
      displayName: 'Company Portal',
      publisher: 'Microsoft',
      largeIcon: {
        type: 'image/png',
        value: 'aWNvbg==',
      },
    });

    expect(node.iconDataUrl).toBe('data:image/png;base64,aWNvbg==');
    expect(node.metadata).toMatchObject({ publisher: 'Microsoft' });
    expect(node.metadata).not.toHaveProperty('iconDataUrl');
    expect(node.raw).toMatchObject({
      largeIcon: {
        type: 'image/png',
        value: '[base64 icon omitted]',
      },
    });
  });

  it('falls back to the default app glyph when largeIcon content is missing or not an image', () => {
    expect(
      mobileAppToNode({
        id: 'app-id',
        displayName: 'Company Portal',
        largeIcon: {
          type: 'text/plain',
          value: 'not-image',
        },
      }).iconDataUrl,
    ).toBeUndefined();

    expect(
      mobileAppToNode({
        id: 'app-id',
        displayName: 'Company Portal',
        largeIcon: {
          type: 'image/png',
          value: '',
        },
      }).iconDataUrl,
    ).toBeUndefined();
  });

  it('searches mobile apps with a safe list query and hydrates icons separately', async () => {
    const requestedPagedPaths: string[] = [];
    const requestedGetPaths: string[] = [];
    const client = mockGraphClient({
      async get<T>(path: string): Promise<T> {
        requestedGetPaths.push(path);

        return {
          id: 'app-id',
          largeIcon: {
            type: 'image/png',
            value: 'aWNvbg==',
          },
        } as T;
      },
      async getPaged<T>(path: string): Promise<T[]> {
        requestedPagedPaths.push(path);

        if (path.includes('largeIcon')) {
          throw new Error('Unsafe mobile app list query');
        }

        return [
          {
            id: 'app-id',
            displayName: 'Company Portal',
            publisher: 'Microsoft',
          },
        ] as T[];
      },
    });

    const result = await searchTenantObjects(client, 'company', ['app']);
    const app = result.graph.nodes.find((node) => node.id === 'app:app-id');

    expect(result.warnings).toEqual([]);
    expect(requestedPagedPaths).toEqual([
      '/deviceAppManagement/mobileApps?$top=100&$select=id,displayName,publisher',
    ]);
    expect(requestedGetPaths).toEqual(['/deviceAppManagement/mobileApps/app-id?$select=id,largeIcon']);
    expect(app?.iconDataUrl).toBe('data:image/png;base64,aWNvbg==');
  });

  it('loads overview mobile apps with a safe collection query', async () => {
    const requestedPagedPaths: string[] = [];
    const client = mockGraphClient({
      async get<T>(path: string): Promise<T> {
        if (path.startsWith('/deviceAppManagement/mobileApps/')) {
          throw new Error('Icon unavailable');
        }

        return {
          id: 'signed-in-user',
          displayName: 'Signed In User',
        } as T;
      },
      async getPaged<T>(path: string): Promise<T[]> {
        requestedPagedPaths.push(path);

        if (path.includes('largeIcon')) {
          throw new Error('Unsafe mobile app list query');
        }

        if (path.startsWith('/deviceAppManagement/mobileApps?')) {
          return [
            {
              id: 'app-id',
              displayName: 'Company Portal',
              publisher: 'Microsoft',
            },
          ] as T[];
        }

        return [];
      },
    });

    const result = await loadTenantOverview(client);
    const app = result.graph.nodes.find((node) => node.id === 'app:app-id');

    expect(result.warnings).toEqual([]);
    expect(requestedPagedPaths).toContain(
      '/deviceAppManagement/mobileApps?$top=50&$select=id,displayName,publisher',
    );
    expect(app?.label).toBe('Company Portal');
    expect(app?.iconDataUrl).toBeUndefined();
  });

  it('hydrates loaded user profile photos with a fixed-size Graph request', async () => {
    const requestedPhotoPaths: string[] = [];
    const client = mockGraphClient({
      async get<T>(): Promise<T> {
        return {
          id: 'user-id',
          displayName: 'Adele Vance',
          userPrincipalName: 'adele@example.com',
        } as T;
      },
      async getPaged<T>(): Promise<T[]> {
        return [];
      },
      async getDataUrl(path: string): Promise<string> {
        requestedPhotoPaths.push(path);
        return 'data:image/jpeg;base64,cGhvdG8=';
      },
    });

    const result = await loadTenantOverview(client);
    const user = result.graph.nodes.find((node) => node.id === 'user:user-id');

    expect(result.warnings).toEqual([]);
    expect(requestedPhotoPaths).toEqual(['/users/user-id/photos/48x48/$value']);
    expect(user?.iconDataUrl).toBe('data:image/jpeg;base64,cGhvdG8=');
  });

  it('keeps user graph usable when profile photos are missing', async () => {
    const requestedPhotoPaths: string[] = [];
    const client = mockGraphClient({
      async get<T>(): Promise<T> {
        throw new Error('Unexpected Graph get call');
      },
      async getPaged<T>(): Promise<T[]> {
        return [
          {
            id: 'user-id',
            displayName: 'Adele Vance',
            userPrincipalName: 'adele@example.com',
          },
        ] as T[];
      },
      async getDataUrl(path: string): Promise<string> {
        requestedPhotoPaths.push(path);
        throw new GraphError(404, 'Not Found', 'ErrorItemNotFound');
      },
    });

    const result = await searchTenantObjects(client, 'adele', ['user']);
    const user = result.graph.nodes.find((node) => node.id === 'user:user-id');

    expect(result.warnings).toEqual([]);
    expect(requestedPhotoPaths).toEqual(['/users/user-id/photos/48x48/$value']);
    expect(user?.iconDataUrl).toBeUndefined();
  });

  it('caps user photo enrichment for larger loaded user sets', async () => {
    const requestedPhotoPaths: string[] = [];
    const client = mockGraphClient({
      async get<T>(): Promise<T> {
        throw new Error('Unexpected Graph get call');
      },
      async getPaged<T>(): Promise<T[]> {
        return Array.from({ length: 40 }, (_, index) => ({
          id: `user-${index}`,
          displayName: `User ${index}`,
          userPrincipalName: `user${index}@example.com`,
        })) as T[];
      },
      async getDataUrl(path: string): Promise<string> {
        requestedPhotoPaths.push(path);
        return 'data:image/jpeg;base64,cGhvdG8=';
      },
    });

    const result = await searchTenantObjects(client, 'user', ['user']);

    expect(result.warnings).toEqual([]);
    expect(requestedPhotoPaths).toHaveLength(32);
    expect(result.graph.nodes.filter((node) => node.iconDataUrl).length).toBe(32);
  });

  it('falls back when overview mobile app selected fields are rejected', async () => {
    const requestedPagedPaths: string[] = [];
    const client = mockGraphClient({
      async get<T>(path: string): Promise<T> {
        if (path.startsWith('/deviceAppManagement/mobileApps/')) {
          throw new Error('Icon unavailable');
        }

        return {
          id: 'signed-in-user',
          displayName: 'Signed In User',
        } as T;
      },
      async getPaged<T>(path: string): Promise<T[]> {
        requestedPagedPaths.push(path);

        if (path === '/deviceAppManagement/mobileApps?$top=50&$select=id,displayName,publisher') {
          throw new GraphError(400, 'Bad Request', 'BadRequest');
        }

        if (path === '/deviceAppManagement/mobileApps?$top=50') {
          return [
            {
              id: 'app-id',
              displayName: 'Company Portal',
              publisher: 'Microsoft',
            },
          ] as T[];
        }

        return [];
      },
    });

    const result = await loadTenantOverview(client);

    expect(result.warnings).toEqual([]);
    expect(requestedPagedPaths).toEqual(
      expect.arrayContaining([
        '/deviceAppManagement/mobileApps?$top=50&$select=id,displayName,publisher',
        '/deviceAppManagement/mobileApps?$top=50',
      ]),
    );
    expect(result.graph.nodes).toContainEqual(
      expect.objectContaining({
        id: 'app:app-id',
        label: 'Company Portal',
      }),
    );
  });

  it('falls back when mobile app search selected fields are rejected', async () => {
    const requestedPagedPaths: string[] = [];
    const client = mockGraphClient({
      async get<T>(): Promise<T> {
        throw new Error('Icon unavailable');
      },
      async getDataUrl(): Promise<string> {
        throw new Error('Photo unavailable');
      },
      async getPaged<T>(path: string): Promise<T[]> {
        requestedPagedPaths.push(path);

        if (path === '/deviceAppManagement/mobileApps?$top=100&$select=id,displayName,publisher') {
          throw new GraphError(400, 'Bad Request', 'BadRequest');
        }

        if (path === '/deviceAppManagement/mobileApps?$top=100') {
          return [
            {
              id: 'app-id',
              displayName: 'Company Portal',
              publisher: 'Microsoft',
            },
          ] as T[];
        }

        return [];
      },
    });

    const result = await searchTenantObjects(client, 'company', ['app']);

    expect(result.warnings).toEqual([]);
    expect(requestedPagedPaths).toEqual([
      '/deviceAppManagement/mobileApps?$top=100&$select=id,displayName,publisher',
      '/deviceAppManagement/mobileApps?$top=100',
    ]);
    expect(result.graph.nodes).toContainEqual(
      expect.objectContaining({
        id: 'app:app-id',
        label: 'Company Portal',
      }),
    );
  });

  it('keeps mobile app search usable when icon hydration fails', async () => {
    const requestedGetPaths: string[] = [];
    const client = mockGraphClient({
      async get<T>(path: string): Promise<T> {
        requestedGetPaths.push(path);
        throw new Error('Icon unavailable');
      },
      async getPaged<T>(path: string): Promise<T[]> {
        if (path.includes('largeIcon')) {
          throw new Error('Unsafe mobile app list query');
        }

        return [
          {
            id: 'app-id',
            displayName: 'Company Portal',
            publisher: 'Microsoft',
          },
        ] as T[];
      },
    });

    const result = await searchTenantObjects(client, 'company', ['app']);
    const app = result.graph.nodes.find((node) => node.id === 'app:app-id');

    expect(result.warnings).toEqual([]);
    expect(requestedGetPaths).toEqual(['/deviceAppManagement/mobileApps/app-id?$select=id,largeIcon']);
    expect(app?.label).toBe('Company Portal');
    expect(app?.iconDataUrl).toBeUndefined();
  });

  it('hydrates memberOf directory role IDs from directory role enumeration', async () => {
    const requestedPaths: string[] = [];
    const client = mockGraphClient({
      async get<T>(): Promise<T> {
        throw new Error('Unexpected Graph get call');
      },
      async getPaged<T>(path: string): Promise<T[]> {
        requestedPaths.push(path);

        if (path.startsWith('/users/user-id/memberOf')) {
          return [
            {
              '@odata.type': '#microsoft.graph.directoryRole',
              id: 'role-id',
              roleTemplateId: 'template-id',
            },
          ] as T[];
        }

        if (path.startsWith('/directoryRoles?')) {
          return [
            {
              id: 'role-id',
              displayName: 'Global Administrator',
              description: 'Can manage all aspects of Entra ID and Microsoft services.',
              roleTemplateId: 'template-id',
            },
          ] as T[];
        }

        return [];
      },
      async getDataUrl(): Promise<string> {
        throw new Error('Photo unavailable');
      },
    });

    const result = await expandTenantNode(client, { id: 'user:user-id', type: 'user', label: 'Alex Wilber' }, 1);
    const role = result.graph.nodes.find((node) => node.id === 'directoryRole:role-id');

    expect(requestedPaths).toContain('/directoryRoles?$select=id,displayName,description,roleTemplateId');
    expect(role?.label).toBe('Global Administrator');
    expect(result.graph.edges).toContainEqual(
      expect.objectContaining({
        source: 'user:user-id',
        target: 'directoryRole:role-id',
        type: 'memberOf',
      }),
    );
  });

  it('searches directory roles without unsupported top query parameters', async () => {
    const requestedPaths: string[] = [];
    const client = mockGraphClient({
      async get<T>(): Promise<T> {
        throw new Error('Unexpected Graph get call');
      },
      async getPaged<T>(path: string): Promise<T[]> {
        requestedPaths.push(path);

        if (path.includes('$top')) {
          throw new Error('Unsupported directoryRoles query');
        }

        return [
          {
            id: 'role-id',
            displayName: 'Global Administrator',
            description: 'Can manage all aspects of Entra ID and Microsoft services.',
            roleTemplateId: 'template-id',
          },
        ] as T[];
      },
      async getDataUrl(): Promise<string> {
        throw new Error('Photo unavailable');
      },
    });

    const result = await searchTenantObjects(client, 'global', ['directoryRole']);

    expect(result.warnings).toEqual([]);
    expect(requestedPaths).toEqual(['/directoryRoles?$select=id,displayName,description,roleTemplateId']);
    expect(result.graph.nodes).toContainEqual(
      expect.objectContaining({
        id: 'directoryRole:role-id',
        label: 'Global Administrator',
      }),
    );
  });

  it('keeps device expansion usable when an optional managed-device child query returns 400', async () => {
    const requestedPaths: string[] = [];
    const client = mockGraphClient({
      async getPaged<T>(path: string): Promise<T[]> {
        requestedPaths.push(path);

        if (path.endsWith('/users?$top=25&$select=id,displayName,userPrincipalName,mail,jobTitle,department')) {
          throw new GraphError(400, 'Bad Request', 'BadRequest');
        }

        if (path.endsWith('/detectedApps?$top=25')) {
          return [
            {
              id: 'detected-app-id',
              displayName: 'Company Portal',
              version: '5.0',
            },
          ] as T[];
        }

        return [];
      },
      async getDataUrl(): Promise<string> {
        throw new Error('Photo unavailable');
      },
    });

    const result = await expandTenantNode(client, { id: 'device:managed-device-id', type: 'device', label: 'JRGSRS763' }, 1);

    expect(result.warnings).toEqual([]);
    expect(requestedPaths).toEqual([
      '/deviceManagement/managedDevices/managed-device-id/users?$top=25&$select=id,displayName,userPrincipalName,mail,jobTitle,department',
      '/deviceManagement/managedDevices/managed-device-id/detectedApps?$top=25',
    ]);
    expect(result.graph.nodes).toContainEqual(
      expect.objectContaining({
        id: 'app:detected-detected-app-id',
        label: 'Company Portal',
      }),
    );
    expect(result.graph.edges).toContainEqual(
      expect.objectContaining({
        source: 'device:managed-device-id',
        target: 'app:detected-detected-app-id',
        type: 'detectedApp',
      }),
    );
  });

  it('still surfaces device expansion permission errors', async () => {
    const client = mockGraphClient({
      async getPaged<T>(path: string): Promise<T[]> {
        if (path.endsWith('/users?$top=25&$select=id,displayName,userPrincipalName,mail,jobTitle,department')) {
          throw new GraphError(403, 'Forbidden', 'Authorization_RequestDenied');
        }

        return [] as T[];
      },
      async getDataUrl(): Promise<string> {
        throw new Error('Photo unavailable');
      },
    });

    const result = await expandTenantNode(client, { id: 'device:managed-device-id', type: 'device', label: 'JRGSRS763' }, 1);

    expect(result.warnings).toEqual(['JRGSRS763: 403 Authorization_RequestDenied']);
    expect(result.permissionError).toBe('JRGSRS763: 403 Authorization_RequestDenied');
  });

});
