import {
  relationshipTypeLabels,
  tenantNodeTypes,
  tenantRelationshipTypes,
  type TenantEdge,
  type TenantGraph,
  type TenantNode,
  type TenantNodeType,
  type TenantRelationshipType,
} from '../models/tenantGraph';
export { nodeColors } from './typePresentation';

export type ImpactMetric = {
  label: string;
  value: number;
};

export type NodeExpansionState = {
  canExpand: boolean;
  helpText?: string;
  label: string;
};

export type GraphLimitResult = {
  graph: TenantGraph;
  hiddenNodeCount: number;
  totalNodeCount: number;
};

type ExpandableNodeCandidate = Pick<TenantNode, 'type'> &
  Partial<Pick<TenantNode, 'id' | 'label' | 'metadata'>>;

const expandableNodeTypes = new Set<TenantNodeType>([
  'app',
  'compliancePolicy',
  'device',
  'deviceConfigurationProfile',
  'directoryRole',
  'enrollmentProfile',
  'group',
  'settingsCatalogPolicy',
  'user',
]);

export const edgeColors: Record<TenantRelationshipType, string> = {
  primaryUser: '#fbbf24',
  memberOf: '#14f195',
  member: '#14f195',
  assignment: '#ff7a18',
  target: '#ff3366',
  filteredBy: '#ff2bd6',
  scopeTag: '#fde047',
  detectedApp: '#ff3366',
  signedIn: '#38bdf8',
  accessed: '#60a5fa',
  evaluatedPolicy: '#a78bfa',
  blockedBy: '#ff3366',
  grantedBy: '#14f195',
};

export function mergeTenantGraphs(...graphs: TenantGraph[]): TenantGraph {
  const nodes = new Map<string, TenantNode>();
  const edges = new Map<string, TenantEdge>();

  for (const graph of graphs) {
    for (const node of graph.nodes) {
      nodes.set(node.id, { ...nodes.get(node.id), ...node });
    }
    for (const edge of graph.edges) {
      edges.set(edge.id, edge);
    }
  }

  return {
    nodes: [...nodes.values()],
    edges: [...edges.values()],
  };
}

export function focusTenantGraph(graph: TenantGraph, nodeId: string | undefined, depth: number): TenantGraph {
  if (!nodeId || depth <= 0 || !graph.nodes.some((node) => node.id === nodeId)) {
    return graph;
  }

  const adjacency = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    addNeighbor(adjacency, edge.source, edge.target);
    addNeighbor(adjacency, edge.target, edge.source);
  }

  const visible = new Set([nodeId]);
  let frontier = new Set([nodeId]);
  for (let level = 0; level < depth; level += 1) {
    const next = new Set<string>();
    for (const current of frontier) {
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visible.has(neighbor)) {
          visible.add(neighbor);
          next.add(neighbor);
        }
      }
    }
    frontier = next;
  }

  return {
    nodes: graph.nodes.filter((node) => visible.has(node.id)),
    edges: graph.edges.filter((edge) => visible.has(edge.source) && visible.has(edge.target)),
  };
}

export function relatedEdges(graph: TenantGraph, nodeId: string | undefined): TenantEdge[] {
  if (!nodeId) {
    return [];
  }

  return graph.edges.filter((edge) => edge.source === nodeId || edge.target === nodeId);
}

export function relationshipLabel(edge: Pick<TenantEdge, 'label' | 'type'>): string {
  return edge.label || relationshipTypeLabels[edge.type] || edge.type;
}

export function isVirtualTenantGroup(node: ExpandableNodeCandidate | undefined): boolean {
  if (!node || node.type !== 'group') {
    return false;
  }

  const label = node.label?.toLowerCase();
  return (
    node.metadata?.virtual === true ||
    node.id === 'group:all-users' ||
    node.id === 'group:all-devices' ||
    label === 'all users' ||
    label === 'all devices'
  );
}

export function isExpandableNode(node: ExpandableNodeCandidate | undefined): boolean {
  return Boolean(node && expandableNodeTypes.has(node.type) && !isVirtualTenantGroup(node));
}

export function nodeExpansionState(
  node: ExpandableNodeCandidate | undefined,
  requestedDepth: number,
  expandedDepth = 0,
): NodeExpansionState {
  const depth = Math.max(1, Math.floor(requestedDepth));

  if (!node) {
    return {
      canExpand: false,
      label: 'Expand',
      helpText: 'Select an object to expand relationships.',
    };
  }

  if (!isExpandableNode(node)) {
    return {
      canExpand: false,
      label: 'No expansion',
      helpText: isVirtualTenantGroup(node)
        ? 'This tenant-wide assignment target is not a real Entra group.'
        : 'This object type has no expandable Graph relationships.',
    };
  }

  if (expandedDepth >= depth) {
    return {
      canExpand: false,
      label: `Expanded depth ${depth}`,
      helpText: 'Increase relationship depth to expand farther.',
    };
  }

  return {
    canExpand: true,
    label: depth > 1 ? `Expand to depth ${depth}` : 'Expand',
  };
}

export function summarizeNodeImpact(graph: TenantGraph, node: TenantNode | undefined): ImpactMetric[] {
  if (!node) {
    return [];
  }

  const edges = relatedEdges(graph, node.id);
  const neighborIds = new Set(edges.map((edge) => (edge.source === node.id ? edge.target : edge.source)));
  const neighborTypes = new Map<string, number>();

  for (const candidate of graph.nodes) {
    if (neighborIds.has(candidate.id)) {
      neighborTypes.set(candidate.type, (neighborTypes.get(candidate.type) ?? 0) + 1);
    }
  }

  return [
    { label: 'relationships', value: edges.length },
    { label: 'devices', value: neighborTypes.get('device') ?? 0 },
    { label: 'users', value: neighborTypes.get('user') ?? 0 },
    { label: 'groups', value: neighborTypes.get('group') ?? 0 },
    { label: 'roles', value: neighborTypes.get('directoryRole') ?? 0 },
    { label: 'apps', value: neighborTypes.get('app') ?? 0 },
    {
      label: 'assignments',
      value: edges.filter((edge) => edge.type === 'assignment' || edge.type === 'target').length,
    },
  ].filter((metric) => metric.value > 0);
}

export function filterTenantGraph(
  graph: TenantGraph,
  visibleTypes: Set<string>,
  visibleRelationships: Set<string>,
): TenantGraph {
  const nodes = graph.nodes.filter((node) => visibleTypes.has(node.type));
  const nodeIds = new Set(nodes.map((node) => node.id));

  return {
    nodes,
    edges: graph.edges.filter(
      (edge) =>
        visibleRelationships.has(edge.type) &&
        nodeIds.has(edge.source) &&
        nodeIds.has(edge.target),
    ),
  };
}

export function limitTenantGraph(
  graph: TenantGraph,
  maxNodes: number,
  pinnedNodeId?: string,
): GraphLimitResult {
  const limit = Math.max(1, Math.floor(maxNodes));
  if (graph.nodes.length <= limit) {
    return {
      graph,
      hiddenNodeCount: 0,
      totalNodeCount: graph.nodes.length,
    };
  }

  const orderedIds: string[] = [];
  const included = new Set<string>();
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const add = (nodeId: string | undefined) => {
    if (nodeId && !included.has(nodeId) && nodeIds.has(nodeId)) {
      included.add(nodeId);
      orderedIds.push(nodeId);
    }
  };

  add(pinnedNodeId);

  for (const edge of graph.edges) {
    if (edge.source === pinnedNodeId) {
      add(edge.target);
    } else if (edge.target === pinnedNodeId) {
      add(edge.source);
    }
  }

  for (const node of graph.nodes) {
    add(node.id);
  }

  const visibleIds = new Set(orderedIds.slice(0, limit));

  return {
    graph: {
      nodes: graph.nodes.filter((node) => visibleIds.has(node.id)),
      edges: graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)),
    },
    hiddenNodeCount: graph.nodes.length - visibleIds.size,
    totalNodeCount: graph.nodes.length,
  };
}

export function searchLocalNodes(graph: TenantGraph, query: string): TenantNode[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return graph.nodes;
  }

  return graph.nodes.filter((node) =>
    [node.label, node.subtitle, node.type].some((value) =>
      value?.toLowerCase().includes(normalized),
    ),
  );
}

export function filterNodesByVisibleTypes(
  nodes: TenantNode[],
  visibleTypes: Set<string>,
): TenantNode[] {
  return nodes.filter((node) => visibleTypes.has(node.type));
}

export function defaultTypeFilter(): Record<string, boolean> {
  return Object.fromEntries(tenantNodeTypes.map((type) => [type, true]));
}

export function defaultRelationshipFilter(): Record<string, boolean> {
  return Object.fromEntries(tenantRelationshipTypes.map((type) => [type, true]));
}

export function enabledKeys(filter: Record<string, boolean>): Set<string> {
  const enabledKeys = new Set<string>();
  for (const [key, enabled] of Object.entries(filter)) {
    if (enabled) {
      enabledKeys.add(key);
    }
  }
  return enabledKeys;
}

export function nodeApiId(node: TenantNode): string {
  const colon = node.id.indexOf(':');
  return colon === -1 ? node.id : node.id.slice(colon + 1);
}

export function graphText(source: unknown, key: string): string | undefined {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  const value = (source as Record<string, unknown>)[key];
  return typeof value === 'string' && value ? value : undefined;
}

export function metadataText(node: Pick<TenantNode, 'metadata'>, key: string): string | undefined {
  const value = node.metadata?.[key];
  return value === undefined || value === null ? undefined : String(value);
}

export function stableHash(value: string): number {
  let output = 0;
  for (let index = 0; index < value.length; index += 1) {
    output = (output * 31 + value.charCodeAt(index)) >>> 0;
  }
  return output;
}

function addNeighbor(adjacency: Map<string, Set<string>>, source: string, target: string): void {
  const neighbors = adjacency.get(source) ?? new Set<string>();
  neighbors.add(target);
  adjacency.set(source, neighbors);
}
