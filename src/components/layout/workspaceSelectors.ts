import type { TenantGraph, TenantNode } from '../../models/tenantGraph';
import {
  enabledKeys,
  filterNodesByVisibleTypes,
  filterTenantGraph,
  focusTenantGraph,
  limitTenantGraph,
  nodeExpansionState,
  searchLocalNodes,
  summarizeNodeImpact,
} from '../../utils/graphUtils';
import {
  explainReadablePath,
  readablePathCandidates as buildReadablePathCandidates,
  summarizeReadableClusters,
  summarizeReadableNode,
} from '../../utils/readableGraph';
import type { WorkspaceState } from './workspaceReducer';

export function selectWorkspaceDerived(state: WorkspaceState) {
  const visibleTypes = enabledKeys(state.typeFilter);
  const visibleRelationships = enabledKeys(state.relationshipFilter);
  const uncappedVisibleGraph = focusTenantGraph(
    filterTenantGraph(state.graph, visibleTypes, visibleRelationships),
    state.selectedNodeId,
    state.focusDepth,
  );
  const graphLimitResult = limitTenantGraph(uncappedVisibleGraph, state.graphObjectLimit, state.selectedNodeId);
  const visibleGraph = graphLimitResult.graph;
  const selectedNode = state.graph.nodes.find((node) => node.id === state.selectedNodeId);
  const selectedEdge = visibleGraph.edges.find((edge) => edge.id === state.selectedEdgeId);
  const readablePathTargetCandidates = buildReadablePathCandidates(visibleGraph, selectedNode);
  const resolvedPathTargetId = readablePathTargetCandidates.some((candidate) => candidate.id === state.pathTargetId)
    ? state.pathTargetId
    : readablePathTargetCandidates[0]?.id;
  const localResults = searchLocalNodes(state.graph, state.searchTerm).filter((node) => visibleTypes.has(node.type));
  const filteredRemoteResults = filterNodesByVisibleTypes(state.remoteResults, visibleTypes);
  const searchResults = prioritizeSearchResults(
    state.remoteResults.length > 0 ? filteredRemoteResults : localResults,
    state.searchTerm,
    selectedNode,
    state.graph,
  );

  return {
    graphLimitResult,
    readableClusterSummaries: summarizeReadableClusters(visibleGraph),
    readablePath: explainReadablePath(visibleGraph, selectedNode?.id, resolvedPathTargetId),
    readablePathTargetCandidates,
    resolvedPathTargetId,
    searchResults,
    selectedEdge,
    selectedExpansion: nodeExpansionState(
      selectedNode,
      state.depth,
      selectedNode ? state.expandedDepthByNode[selectedNode.id] ?? 0 : 0,
    ),
    selectedImpact: summarizeNodeImpact(state.graph, selectedNode),
    selectedNode,
    selectedReadableSummary: summarizeReadableNode(state.graph, selectedNode),
    uncappedVisibleGraph,
    visibleGraph,
    visibleRelationships,
    visibleTypes,
  };
}

function prioritizeSearchResults(
  nodes: TenantNode[],
  query: string,
  selectedNode: TenantNode | undefined,
  graph: TenantGraph,
): TenantNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  const relatedIds = new Set<string>();

  if (selectedNode) {
    for (const edge of graph.edges) {
      if (edge.source === selectedNode.id) {
        relatedIds.add(edge.target);
      }
      if (edge.target === selectedNode.id) {
        relatedIds.add(edge.source);
      }
    }
  }

  return nodes.toSorted((first, second) => {
    const firstRank = searchResultRank(first, normalizedQuery, selectedNode, relatedIds);
    const secondRank = searchResultRank(second, normalizedQuery, selectedNode, relatedIds);
    return firstRank - secondRank || first.label.localeCompare(second.label);
  });
}

function searchResultRank(
  node: TenantNode,
  normalizedQuery: string,
  selectedNode: TenantNode | undefined,
  relatedIds: Set<string>,
): number {
  let rank = 100;
  const normalizedLabel = node.label.toLowerCase();

  if (normalizedQuery && normalizedLabel === normalizedQuery) {
    rank -= 70;
  } else if (normalizedQuery && normalizedLabel.startsWith(normalizedQuery)) {
    rank -= 48;
  }

  if (selectedNode && node.type === selectedNode.type) {
    rank -= 22;
  }

  if (relatedIds.has(node.id)) {
    rank -= 16;
  }

  return rank;
}
