import { useMsal } from '@azure/msal-react';
import { useMemo, useRef } from 'react';
import { useGraphToken } from '../../auth/useGraphToken';
import { createGraphClient } from '../../graph/client';
import { GraphOverlays } from '../graph/GraphOverlays';
import { RelationshipInspector } from '../graph/RelationshipInspector';
import { TenantGraphCanvas, type TenantGraphCanvasHandle } from '../graph/TenantGraphCanvas';
import { Sidebar } from './Sidebar';
import { Toolbar } from './Toolbar';
import { useTenantGraphWorkspace } from './useTenantGraphWorkspace';

export function AppShell() {
  const { instance } = useMsal();
  const { account, getAccessToken } = useGraphToken();
  const client = useMemo(() => createGraphClient(getAccessToken), [getAccessToken]);
  const canvasRef = useRef<TenantGraphCanvasHandle>(null);
  const { actions, derived, state } = useTenantGraphWorkspace(client);

  return (
    <div className="app-shell">
      <Toolbar
        accountName={account?.name ?? account?.username ?? 'Signed in'}
        depth={state.depth}
        focusDepth={state.focusDepth}
        loading={Boolean(state.loading || state.busyNodeId)}
        searchTerm={state.searchTerm}
        onDepthChange={actions.setDepth}
        onFitGraph={() => canvasRef.current?.fitView()}
        onFocusDepthChange={actions.setFocusDepth}
        onResetGraph={actions.loadGraph}
        onResetView={() => canvasRef.current?.resetView()}
        onSearch={actions.runSearch}
        onSearchTermChange={actions.setSearchTerm}
        onSignOut={() => instance.logoutRedirect()}
      />
      <div className="workspace">
        <Sidebar
          busyNodeId={state.busyNodeId}
          clusterSummaries={derived.readableClusterSummaries}
          edgeCount={derived.visibleGraph.edges.length}
          expansion={derived.selectedExpansion}
          graphHiddenNodeCount={derived.graphLimitResult.hiddenNodeCount}
          graphNodeCount={derived.visibleGraph.nodes.length}
          graphObjectLimit={state.graphObjectLimit}
          graphTotalNodeCount={derived.graphLimitResult.totalNodeCount}
          impactMetrics={derived.selectedImpact}
          path={derived.readablePath}
          pathCandidates={derived.readablePathTargetCandidates}
          permissionError={state.permissionError}
          relationshipFilter={state.relationshipFilter}
          resultLimit={state.resultLimit}
          resultTotalCount={derived.searchResults.length}
          results={derived.searchResults}
          searching={state.searching}
          searchTerm={state.searchTerm}
          selectedNode={derived.selectedNode}
          selectedPathTargetId={derived.resolvedPathTargetId}
          selectedReadableSummary={derived.selectedReadableSummary}
          typeFilter={state.typeFilter}
          warnings={state.warnings}
          onExpandSelected={() => derived.selectedNode && void actions.expandNode(derived.selectedNode)}
          onLoadMoreGraphObjects={actions.showMoreGraphObjects}
          onLoadMoreResults={actions.showMoreResults}
          onPathTargetChange={actions.setPathTarget}
          onSelectNode={actions.selectNode}
          onToggleRelationship={actions.toggleRelationship}
          onToggleType={actions.toggleType}
        />
        <main className={`graph-stage ${state.inspectorOpen ? 'has-inspector' : ''}`}>
          <div className="graph-viewport">
            {state.permissionError && (
              <div className="state-banner permission-state">
                Missing permission or Intune access: {state.permissionError}
              </div>
            )}
            {state.error && <div className="state-banner error-state">{state.error}</div>}
            {!state.loading && derived.visibleGraph.nodes.length === 0 && (
              <div className="empty-state">
                <h2>No graph data</h2>
                <p>Search for an Intune object or adjust filters.</p>
              </div>
            )}
            <TenantGraphCanvas
              ref={canvasRef}
              centralNodeId={state.centralNodeId}
              graph={derived.visibleGraph}
              selectedEdgeId={state.selectedEdgeId}
              selectedNodeId={state.selectedNodeId}
              onSelectCluster={actions.selectCluster}
              onSelectEdge={actions.selectEdge}
              onSelectNode={actions.selectNode}
            />
            <GraphOverlays
              leftStackTop={
                derived.graphLimitResult.hiddenNodeCount > 0 ? (
                  <div className="state-banner graph-limit-state">
                    Showing {derived.visibleGraph.nodes.length} of {derived.graphLimitResult.totalNodeCount} loaded
                    objects.
                    <button type="button" onClick={actions.showMoreGraphObjects}>
                      Load more
                    </button>
                  </div>
                ) : null
              }
            />
            {state.loading && <div className="loading-state">{state.loading}</div>}
          </div>
          {state.inspectorOpen && (
            <RelationshipInspector
              client={client}
              edge={derived.selectedEdge}
              graph={derived.visibleGraph}
              selectedNode={derived.selectedNode}
              onClose={actions.closeInspector}
              onProjectSignInEvent={actions.projectSignInEvent}
              onSelectNode={actions.selectNode}
            />
          )}
        </main>
      </div>
    </div>
  );
}
