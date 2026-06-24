import type { TenantEdge, TenantGraph, TenantNode, TenantNodeType, TenantRelationshipType } from '../models/tenantGraph';
import { mergeTenantGraphs } from '../utils/graphUtils';

export type GraphObject = Record<string, unknown>;

export function userToNode(user: GraphObject): TenantNode {
  const id = requiredId(user);
  const upn = text(user, 'userPrincipalName') ?? text(user, 'mail');

  return {
    id: nodeId('user', id),
    type: 'user',
    label: text(user, 'displayName') ?? upn ?? id,
    subtitle: upn,
    raw: user,
    metadata: compactMetadata({
      upn,
      mail: text(user, 'mail'),
      jobTitle: text(user, 'jobTitle'),
      department: text(user, 'department'),
    }),
  };
}

function groupToNode(group: GraphObject): TenantNode {
  const id = requiredId(group);
  const groupTypes = arrayText(group, 'groupTypes');

  return {
    id: nodeId('group', id),
    type: 'group',
    label: text(group, 'displayName') ?? id,
    subtitle: groupTypes.includes('Unified') ? 'Microsoft 365 group' : 'Security group',
    raw: group,
    metadata: compactMetadata({
      mailNickname: text(group, 'mailNickname'),
      securityEnabled: bool(group, 'securityEnabled'),
    }),
  };
}

function directoryRoleToNode(role: GraphObject): TenantNode {
  const id = requiredId(role);
  const roleTemplateId = text(role, 'roleTemplateId');

  return {
    id: nodeId('directoryRole', id),
    type: 'directoryRole',
    label: text(role, 'displayName') ?? roleTemplateId ?? id,
    subtitle: 'Directory role',
    raw: role,
    metadata: compactMetadata({
      description: text(role, 'description'),
      roleTemplateId,
    }),
  };
}

function managedDeviceToNode(device: GraphObject): TenantNode {
  const id = requiredId(device);

  return {
    id: nodeId('device', id),
    type: 'device',
    label: text(device, 'deviceName') ?? text(device, 'azureADDeviceId') ?? id,
    subtitle: [text(device, 'operatingSystem'), text(device, 'complianceState')]
      .filter(Boolean)
      .join(' / '),
    raw: device,
    metadata: compactMetadata({
      user: text(device, 'userPrincipalName'),
      os: text(device, 'operatingSystem'),
      compliance: text(device, 'complianceState'),
      managementAgent: text(device, 'managementAgent'),
      manufacturer: text(device, 'manufacturer'),
      model: text(device, 'model'),
    }),
  };
}

export function mobileAppToNode(app: GraphObject): TenantNode {
  const id = requiredId(app);
  const iconDataUrl = mimeContentDataUrl(app['largeIcon']);

  return {
    id: nodeId('app', id),
    iconDataUrl,
    type: 'app',
    label: text(app, 'displayName') ?? id,
    subtitle: text(app, 'publisher') ?? text(app, '@odata.type'),
    raw: mobileAppRawWithoutIconContent(app),
    metadata: compactMetadata({
      publisher: text(app, 'publisher'),
      assigned: bool(app, 'isAssigned'),
      availability: text(app, 'appAvailability'),
    }),
  };
}

function detectedAppToNode(app: GraphObject): TenantNode {
  const id = requiredId(app);

  return {
    id: nodeId('app', `detected-${id}`),
    type: 'app',
    label: text(app, 'displayName') ?? id,
    subtitle: text(app, 'version') ?? 'Detected app',
    raw: app,
    metadata: compactMetadata({
      publisher: text(app, 'publisher'),
      version: text(app, 'version'),
    }),
  };
}

function policyToNode(policy: GraphObject, type: TenantNodeType): TenantNode {
  const id = requiredId(policy);

  return {
    id: nodeId(type, id),
    type,
    label: text(policy, 'displayName') ?? text(policy, 'name') ?? id,
    subtitle: text(policy, 'description'),
    raw: policy,
    metadata: compactMetadata({
      platform: text(policy, 'platforms') ?? text(policy, 'platform'),
      technologies: text(policy, 'technologies'),
      created: text(policy, 'createdDateTime'),
      modified: text(policy, 'lastModifiedDateTime'),
    }),
  };
}

function assignmentFilterToNode(filter: GraphObject): TenantNode {
  const id = requiredId(filter);

  return {
    id: nodeId('assignmentFilter', id),
    type: 'assignmentFilter',
    label: text(filter, 'displayName') ?? id,
    subtitle: text(filter, 'platform'),
    raw: filter,
    metadata: compactMetadata({
      platform: text(filter, 'platform'),
      rule: text(filter, 'rule'),
    }),
  };
}

function scopeTagToNode(scopeTag: GraphObject): TenantNode {
  const id = requiredId(scopeTag);

  return {
    id: nodeId('scopeTag', id),
    type: 'scopeTag',
    label: text(scopeTag, 'displayName') ?? id,
    subtitle: text(scopeTag, 'description'),
    raw: scopeTag,
  };
}

export function usersToGraph(users: GraphObject[]): TenantGraph {
  return { nodes: users.map(userToNode), edges: [] };
}

export function groupsToGraph(groups: GraphObject[]): TenantGraph {
  return { nodes: groups.map(groupToNode), edges: [] };
}

export function directoryRolesToGraph(roles: GraphObject[]): TenantGraph {
  return { nodes: roles.map(directoryRoleToNode), edges: [] };
}

export function managedDevicesToGraph(devices: GraphObject[]): TenantGraph {
  const nodes: TenantNode[] = [];
  const edges: TenantEdge[] = [];

  for (const device of devices) {
    const deviceNode = managedDeviceToNode(device);
    nodes.push(deviceNode);

    const userId = text(device, 'userId');
    if (userId && userId !== '00000000-0000-0000-0000-000000000000') {
      const upn = text(device, 'userPrincipalName');
      const displayName = text(device, 'userDisplayName');
      const userNode: TenantNode = {
        id: nodeId('user', userId),
        type: 'user',
        label: displayName ?? upn ?? 'Primary user',
        subtitle: upn,
        metadata: compactMetadata({ upn }),
      };
      nodes.push(userNode);
      edges.push(edge(userNode.id, deviceNode.id, 'primaryUser', 'Primary user'));
    }
  }

  return { nodes, edges };
}

export function mobileAppsToGraph(apps: GraphObject[]): TenantGraph {
  return { nodes: apps.map(mobileAppToNode), edges: [] };
}

export function detectedAppsToGraph(apps: GraphObject[], owner: TenantNode): TenantGraph {
  const nodes = apps.map(detectedAppToNode);

  return {
    nodes,
    edges: nodes.map((app) => edge(owner.id, app.id, 'detectedApp', 'Detected app')),
  };
}

export function policiesToGraph(policies: GraphObject[], type: TenantNodeType): TenantGraph {
  const nodes: TenantNode[] = [];
  const edges: TenantEdge[] = [];

  for (const policy of policies) {
    const policyNode = policyToNode(policy, type);
    nodes.push(policyNode);

    for (const scopeTagId of arrayText(policy, 'roleScopeTagIds')) {
      const scopeNode: TenantNode = {
        id: nodeId('scopeTag', scopeTagId),
        type: 'scopeTag',
        label: `Scope tag ${scopeTagId}`,
      };
      nodes.push(scopeNode);
      edges.push(edge(policyNode.id, scopeNode.id, 'scopeTag', 'Scope tag'));
    }
  }

  return { nodes, edges };
}

export function assignmentFiltersToGraph(filters: GraphObject[]): TenantGraph {
  return { nodes: filters.map(assignmentFilterToNode), edges: [] };
}

export function scopeTagsToGraph(scopeTags: GraphObject[]): TenantGraph {
  return { nodes: scopeTags.map(scopeTagToNode), edges: [] };
}

export function directoryObjectsToGraph(objects: GraphObject[]): TenantGraph {
  const nodes = objects.map((object) => {
    const odataType = text(object, '@odata.type') ?? '';
    if (odataType.includes('group')) {
      return groupToNode(object);
    }
    if (odataType.includes('user')) {
      return userToNode(object);
    }
    if (odataType.includes('directoryRole')) {
      return directoryRoleToNode(object);
    }

    const id = requiredId(object);
    return {
      id: nodeId('group', id),
      type: 'group',
      label: text(object, 'displayName') ?? id,
      subtitle: odataType.replace('#microsoft.graph.', ''),
      raw: object,
    } satisfies TenantNode;
  });

  return { nodes, edges: [] };
}

export function assignmentsToGraph(owner: TenantNode, assignments: GraphObject[]): TenantGraph {
  const graphs = assignments.map((assignment) => assignmentToGraph(owner, assignment));
  return mergeTenantGraphs(...graphs);
}

export function connectRelated(
  owner: TenantNode,
  related: TenantGraph,
  type: TenantRelationshipType,
  label: string,
  direction: 'fromOwner' | 'toOwner' = 'fromOwner',
): TenantGraph {
  return {
    nodes: related.nodes,
    edges: related.nodes.map((node) =>
      direction === 'fromOwner' ? edge(owner.id, node.id, type, label) : edge(node.id, owner.id, type, label),
    ),
  };
}

export function edge(source: string, target: string, type: TenantRelationshipType, label?: string): TenantEdge {
  return {
    id: `${source}->${target}:${type}`,
    source,
    target,
    type,
    label,
  };
}

function nodeId(type: TenantNodeType, id: string): string {
  return `${type}:${id}`;
}

function assignmentToGraph(owner: TenantNode, assignment: GraphObject): TenantGraph {
  const id = text(assignment, 'id') ?? crypto.randomUUID();
  const assignmentNode: TenantNode = {
    id: nodeId('appAssignment', `${owner.id}:${id}`),
    type: 'appAssignment',
    label: text(assignment, 'intent') ?? 'Assignment',
    subtitle: owner.label,
    raw: assignment,
    metadata: compactMetadata({
      intent: text(assignment, 'intent'),
      source: text(assignment, 'source'),
    }),
  };
  const target = object(assignment, 'target');
  const nodes: TenantNode[] = [assignmentNode];
  const edges: TenantEdge[] = [edge(owner.id, assignmentNode.id, 'assignment', 'Assignment')];

  const targetNode = targetToNode(target);
  if (targetNode) {
    nodes.push(targetNode);
    edges.push(edge(assignmentNode.id, targetNode.id, 'target', 'Target'));
  }

  const filterId = text(target, 'deviceAndAppManagementAssignmentFilterId');
  if (filterId) {
    const filterNode: TenantNode = {
      id: nodeId('assignmentFilter', filterId),
      type: 'assignmentFilter',
      label: `Assignment filter ${filterId}`,
      metadata: {
        mode: text(target, 'deviceAndAppManagementAssignmentFilterType'),
      },
    };
    nodes.push(filterNode);
    edges.push(edge(assignmentNode.id, filterNode.id, 'filteredBy', 'Filtered by'));
  }

  return { nodes, edges };
}

function targetToNode(target: GraphObject): TenantNode | undefined {
  const groupId = text(target, 'groupId');
  if (groupId) {
    return {
      id: nodeId('group', groupId),
      type: 'group',
      label: `Group ${groupId.slice(0, 8)}`,
      subtitle: 'Assignment target',
    };
  }

  const type = text(target, '@odata.type') ?? '';
  if (type.includes('allDevices')) {
    return {
      id: nodeId('group', 'all-devices'),
      type: 'group',
      label: 'All devices',
      subtitle: 'Broad assignment target',
      metadata: { target: 'allDevices', virtual: true },
    };
  }
  if (type.includes('allLicensedUsers')) {
    return {
      id: nodeId('group', 'all-users'),
      type: 'group',
      label: 'All users',
      subtitle: 'Broad assignment target',
      metadata: { target: 'allLicensedUsers', virtual: true },
    };
  }

  return undefined;
}

function requiredId(value: GraphObject): string {
  const id = text(value, 'id');
  if (!id) {
    throw new Error('Microsoft Graph object did not include an id.');
  }

  return id;
}

function text(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const next = (value as GraphObject)[key];
  return typeof next === 'string' && next.length > 0 ? next : undefined;
}

function bool(value: GraphObject, key: string): boolean | undefined {
  const next = value[key];
  return typeof next === 'boolean' ? next : undefined;
}

function object(value: GraphObject, key: string): GraphObject {
  const next = value[key];
  return next && typeof next === 'object' && !Array.isArray(next) ? (next as GraphObject) : {};
}

function arrayText(value: GraphObject, key: string): string[] {
  const next = value[key];
  return Array.isArray(next) ? next.filter((item): item is string => typeof item === 'string') : [];
}

function compactMetadata(
  value: Record<string, string | number | boolean | null | undefined>,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(value).filter(([, metadataValue]) => metadataValue !== undefined && metadataValue !== null),
  ) as Record<string, string | number | boolean>;
}

function mimeContentDataUrl(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const mimeContent = value as GraphObject;
  const content = text(mimeContent, 'value');
  if (!content?.trim()) {
    return undefined;
  }

  const mimeType = text(mimeContent, 'type') ?? 'image/png';
  if (!mimeType.startsWith('image/')) {
    return undefined;
  }

  return `data:${mimeType};base64,${content}`;
}

function mobileAppRawWithoutIconContent(app: GraphObject): GraphObject {
  const largeIcon = object(app, 'largeIcon');
  if (!text(largeIcon, 'value')) {
    return app;
  }

  return {
    ...app,
    largeIcon: {
      ...largeIcon,
      value: '[base64 icon omitted]',
    },
  };
}
