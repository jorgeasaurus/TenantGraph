import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { GraphClient } from '../../graph/client';
import type { ConditionalAccessPolicyGraphFilter } from '../../graph/signInLogs';
import { expandTenantNode } from '../../graph/tenantGraphExpansion';
import { loadTenantOverview, searchTenantObjects } from '../../graph/tenantGraphSources';
import type { SignInEvent } from '../../models/signInLog';
import type { TenantNode, TenantNodeType, TenantRelationshipType } from '../../models/tenantGraph';
import { nodeExpansionState } from '../../utils/graphUtils';
import { initialWorkspaceState, workspaceReducer } from './workspaceReducer';
import { selectWorkspaceDerived } from './workspaceSelectors';

export { initialWorkspaceState, workspaceReducer } from './workspaceReducer';

export function useTenantGraphWorkspace(client: GraphClient) {
  const initialLoadStarted = useRef(false);
  const [state, dispatch] = useReducer(workspaceReducer, undefined, initialWorkspaceState);
  const derived = useMemo(() => selectWorkspaceDerived(state), [state]);

  const loadGraph = useCallback(async () => {
    dispatch({ type: 'startOverview' });

    try {
      dispatch({ type: 'overviewLoaded', result: await loadTenantOverview(client) });
    } catch (loadError) {
      dispatch({
        type: 'overviewFailed',
        error: loadError instanceof Error ? loadError.message : 'Unable to load Microsoft Graph data.',
      });
    }
  }, [client]);

  useEffect(() => {
    if (initialLoadStarted.current) {
      return;
    }

    initialLoadStarted.current = true;
    void loadGraph();
  }, [loadGraph]);

  const expandNode = useCallback(
    async (node: TenantNode) => {
      const expansion = nodeExpansionState(node, state.depth, state.expandedDepthByNode[node.id] ?? 0);
      if (!expansion.canExpand) {
        return;
      }

      dispatch({ type: 'startExpand', nodeId: node.id });

      try {
        dispatch({
          type: 'expandLoaded',
          nodeId: node.id,
          depth: state.depth,
          result: await expandTenantNode(client, node, state.depth),
        });
      } catch (expandError) {
        dispatch({
          type: 'expandFailed',
          error: expandError instanceof Error ? expandError.message : 'Unable to expand node.',
        });
      }
    },
    [client, state.depth, state.expandedDepthByNode],
  );

  const selectNode = useCallback(
    (nodeId: string) => {
      const node = state.graph.nodes.find((candidate) => candidate.id === nodeId);
      if (!node) {
        return;
      }

      dispatch({ type: 'selectNode', nodeId });
      void expandNode(node);
    },
    [expandNode, state.graph.nodes],
  );

  const runSearch = useCallback(async () => {
    if (!state.searchTerm.trim()) {
      return;
    }

    dispatch({ type: 'startSearch' });

    try {
      dispatch({
        type: 'searchLoaded',
        result: await searchTenantObjects(client, state.searchTerm, [...derived.visibleTypes]),
      });
    } catch (searchError) {
      dispatch({
        type: 'searchFailed',
        error: searchError instanceof Error ? searchError.message : 'Search failed.',
      });
    }
  }, [client, derived.visibleTypes, state.searchTerm]);

  return {
    actions: {
      closeInspector: () => dispatch({ type: 'closeInspector' }),
      expandNode,
      loadGraph,
      projectSignInEvent: (event: SignInEvent, policyFilter: ConditionalAccessPolicyGraphFilter) =>
        dispatch({ type: 'projectSignInEvent', event, policyFilter }),
      runSearch,
      selectCluster: (zoneId: string) => dispatch({ type: 'selectCluster', zoneId }),
      selectEdge: (edgeId: string) => dispatch({ type: 'selectEdge', edgeId }),
      selectNode,
      setDepth: (depth: number) => dispatch({ type: 'setDepth', depth }),
      setFocusDepth: (focusDepth: number) => dispatch({ type: 'setFocusDepth', focusDepth }),
      setPathTarget: (targetId: string) => dispatch({ type: 'setPathTarget', targetId }),
      setSearchTerm: (searchTerm: string) => dispatch({ type: 'setSearchTerm', searchTerm }),
      showMoreGraphObjects: () =>
        dispatch({ type: 'showMoreGraph', total: derived.graphLimitResult.totalNodeCount }),
      showMoreResults: () => dispatch({ type: 'showMoreResults', total: derived.searchResults.length }),
      toggleRelationship: (relationshipType: TenantRelationshipType) =>
        dispatch({ type: 'toggleRelationship', relationshipType }),
      toggleType: (nodeType: TenantNodeType) => dispatch({ type: 'toggleType', nodeType }),
    },
    derived,
    state,
  };
}
