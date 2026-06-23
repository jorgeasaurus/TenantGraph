import type { TenantEdge, TenantGraph, TenantGraphResult, TenantNode } from '../models/tenantGraph';
import { emptyTenantGraph } from '../models/tenantGraph';
import {
  graphText,
  isExpandableNode,
  isVirtualTenantGroup,
  mergeTenantGraphs,
  metadataText,
  nodeApiId,
} from '../utils/graphUtils';
import {
  assignmentsToGraph,
  connectRelated,
  detectedAppsToGraph,
  directoryObjectsToGraph,
  directoryRolesToGraph,
  edge,
  managedDevicesToGraph,
  usersToGraph,
  type GraphObject,
} from './adapters';
import { GraphError, type GraphClient } from './client';
import { collectGraphs } from './graphCalls';
import { hydrateResultMedia } from './mediaEnrichment';
import { odataString } from './query';
import { directoryRolesListPath } from './tenantGraphSources';

const maxExpansionFanout = 20;

export async function expandTenantNode(
  client: GraphClient,
  node: TenantNode,
  depth: number,
): Promise<TenantGraphResult> {
  return hydrateResultMedia(client, await expandTenantNodeGraph(client, node, depth));
}

async function expandTenantNodeGraph(
  client: GraphClient,
  node: TenantNode,
  depth: number,
): Promise<TenantGraphResult> {
  let graph = emptyTenantGraph;
  const warnings: string[] = [];
  let permissionError: string | undefined;
  let next = [node];
  const seen = new Set([node.id]);

  for (let level = 0; level < depth && next.length > 0; level += 1) {
    const result = await collectGraphs(
      next.slice(0, maxExpansionFanout).map((current) => ({
        label: current.label,
        run: () => expandOne(client, current),
      })),
    );

    graph = mergeTenantGraphs(graph, result.graph);
    warnings.push(...result.warnings);
    permissionError ??= result.permissionError;

    next = result.graph.nodes.filter((expanded) => {
      if (seen.has(expanded.id) || !isExpandableNode(expanded)) {
        return false;
      }
      seen.add(expanded.id);
      return true;
    });
  }

  return { graph, warnings, permissionError };
}

async function expandOne(client: GraphClient, node: TenantNode): Promise<TenantGraph> {
  const id = encodeURIComponent(nodeApiId(node));

  switch (node.type) {
    case 'device':
      return expandDevice(client, node, id);
    case 'user':
      return expandUser(client, node, id);
    case 'group':
      return expandGroup(client, node, id);
    case 'directoryRole':
      return expandDirectoryRole(client, node, id);
    case 'app':
      return expandAssignments(client, node, `/deviceAppManagement/mobileApps/${id}/assignments?$top=50`);
    case 'compliancePolicy':
      return expandAssignments(client, node, `/deviceManagement/deviceCompliancePolicies/${id}/assignments?$top=50`);
    case 'deviceConfigurationProfile':
      return expandAssignments(client, node, `/deviceManagement/deviceConfigurations/${id}/assignments?$top=50`);
    case 'settingsCatalogPolicy':
      return expandAssignments(client, node, `/deviceManagement/configurationPolicies/${id}/assignments?$top=50`, 'beta');
    case 'enrollmentProfile':
      return expandAssignments(
        client,
        node,
        `/deviceManagement/windowsAutopilotDeploymentProfiles/${id}/assignments?$top=50`,
        'beta',
      );
    default:
      return emptyTenantGraph;
  }
}

async function expandDevice(client: GraphClient, node: TenantNode, id: string): Promise<TenantGraph> {
  const [users, apps] = await Promise.all([
    optionalManagedDeviceGraph(
      client
        .getPaged<GraphObject>(
          `/deviceManagement/managedDevices/${id}/users?$top=25&$select=id,displayName,userPrincipalName,mail,jobTitle,department`,
        )
        .then((items) => connectRelated(node, usersToGraph(items), 'primaryUser', 'Primary user', 'toOwner')),
    ),
    optionalManagedDeviceGraph(
      client
        .getPaged<GraphObject>(`/deviceManagement/managedDevices/${id}/detectedApps?$top=25`)
        .then((items) => detectedAppsToGraph(items, node)),
    ),
  ]);

  return mergeTenantGraphs(users, apps);
}

async function optionalManagedDeviceGraph(promise: Promise<TenantGraph>): Promise<TenantGraph> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof GraphError && error.status === 400) {
      return emptyTenantGraph;
    }

    throw error;
  }
}

async function expandUser(client: GraphClient, node: TenantNode, id: string): Promise<TenantGraph> {
  const userPrincipalName = graphText(node.raw, 'userPrincipalName') ?? metadataText(node, 'upn') ?? node.subtitle;
  const devicesPromise = userPrincipalName
    ? client
        .getPaged<GraphObject>(
          `/deviceManagement/managedDevices?$top=25&$filter=${encodeURIComponent(
            `userPrincipalName eq '${odataString(userPrincipalName)}'`,
          )}`,
        )
        .then((items) => primaryUserDevicesToGraph(node, items))
    : Promise.resolve(emptyTenantGraph);

  const [groups, devices] = await Promise.all([
    client
      .getPaged<GraphObject>(
        `/users/${id}/memberOf?$top=25&$select=id,displayName,mailNickname,securityEnabled,groupTypes,description,roleTemplateId`,
      )
      .then((items) => directoryMembershipsToGraph(client, node, items)),
    devicesPromise,
  ]);

  return mergeTenantGraphs(groups, devices);
}

async function expandGroup(client: GraphClient, node: TenantNode, id: string): Promise<TenantGraph> {
  if (isVirtualTenantGroup(node)) {
    return emptyTenantGraph;
  }

  return client
    .getPaged<GraphObject>(`/groups/${id}/members?$top=25&$select=id,displayName,userPrincipalName,mail`)
    .then((items) => connectRelated(node, directoryObjectsToGraph(items), 'member', 'Member'));
}

async function expandDirectoryRole(client: GraphClient, node: TenantNode, id: string): Promise<TenantGraph> {
  return client
    .getPaged<GraphObject>(
      `/directoryRoles/${id}/members?$top=25&$select=id,displayName,userPrincipalName,mail,mailNickname,securityEnabled,groupTypes`,
    )
    .then((items) => connectRelated(node, directoryObjectsToGraph(items), 'member', 'Member'));
}

async function expandAssignments(
  client: GraphClient,
  node: TenantNode,
  path: string,
  version: 'v1.0' | 'beta' = 'v1.0',
): Promise<TenantGraph> {
  return client.getPaged<GraphObject>(path, undefined, version).then((items) => assignmentsToGraph(node, items));
}

function primaryUserDevicesToGraph(node: TenantNode, devices: GraphObject[]): TenantGraph {
  const deviceGraph = managedDevicesToGraph(devices);
  const primaryUserEdges: TenantEdge[] = [];
  for (const deviceNode of deviceGraph.nodes) {
    if (deviceNode.type === 'device') {
      primaryUserEdges.push(edge(node.id, deviceNode.id, 'primaryUser', 'Primary user'));
    }
  }

  return {
    nodes: deviceGraph.nodes,
    edges: [...deviceGraph.edges, ...primaryUserEdges],
  };
}

async function directoryMembershipsToGraph(
  client: GraphClient,
  owner: TenantNode,
  objects: GraphObject[],
): Promise<TenantGraph> {
  const graph = directoryObjectsToGraph(objects);
  const roleIds = new Set<string>();
  let allRolesHaveFriendlyNames = true;
  for (const node of graph.nodes) {
    if (node.type !== 'directoryRole') {
      continue;
    }
    roleIds.add(node.id);
    if (!hasFriendlyRoleName(node)) {
      allRolesHaveFriendlyNames = false;
    }
  }

  if (roleIds.size === 0 || allRolesHaveFriendlyNames) {
    return connectRelated(owner, graph, 'memberOf', 'Member of');
  }

  try {
    const roleNames = directoryRolesToGraph(await client.getPaged<GraphObject>(directoryRolesListPath));
    const matchingRoles: TenantGraph = {
      nodes: roleNames.nodes.filter((role) => roleIds.has(role.id)),
      edges: [],
    };

    return connectRelated(owner, mergeTenantGraphs(graph, matchingRoles), 'memberOf', 'Member of');
  } catch {
    return connectRelated(owner, graph, 'memberOf', 'Member of');
  }
}

function hasFriendlyRoleName(node: TenantNode): boolean {
  const apiId = nodeApiId(node);
  const roleTemplateId = metadataText(node, 'roleTemplateId');
  return node.label !== apiId && node.label !== roleTemplateId;
}
