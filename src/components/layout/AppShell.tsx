import { useMemo, useRef, useState } from 'react';
import { Filter, Network, Search, ShieldCheck } from 'lucide-react';
import type { GraphClient } from '../../graph/client';
import { SampleTenantGuide } from '../demo/SampleTenantGuide';
import { GraphOverlays } from '../graph/GraphOverlays';
import { RelationshipInspector } from '../graph/RelationshipInspector';
import { TenantGraphCanvas, type TenantGraphCanvasHandle } from '../graph/TenantGraphCanvas';
import { Sidebar } from './Sidebar';
import { Toolbar } from './Toolbar';
import { useTenantGraphWorkspace } from './useTenantGraphWorkspace';

type AppShellProps = {
  accountName: string;
  client: GraphClient;
  isSampleTenant?: boolean;
  onSignOut: () => void;
};

export function AppShell({ accountName, client, isSampleTenant = false, onSignOut }: AppShellProps) {
  const canvasRef = useRef<TenantGraphCanvasHandle>(null);
  const [sampleGuideDismissed, setSampleGuideDismissed] = useState(false);
  const { actions, derived, state } = useTenantGraphWorkspace(client);
  const guideOpen = isSampleTenant && !sampleGuideDismissed;
  const resetGraph = () => {
    void actions.loadGraph().finally(() => {
      canvasRef.current?.resetView();
    });
  };
  const graphLimitOverlay = useMemo(
    () =>
      derived.graphLimitResult.hiddenNodeCount > 0 ? (
        <div className="state-banner graph-limit-state">
          Showing {derived.visibleGraph.nodes.length} of {derived.graphLimitResult.totalNodeCount} loaded objects.
          <button type="button" onClick={actions.showMoreGraphObjects}>
            Load more
          </button>
        </div>
      ) : null,
    [
      actions.showMoreGraphObjects,
      derived.graphLimitResult.hiddenNodeCount,
      derived.graphLimitResult.totalNodeCount,
      derived.visibleGraph.nodes.length,
    ],
  );

  return (
    <div className="app-shell">
      <Toolbar
        accountName={accountName}
        depth={state.depth}
        focusDepth={state.focusDepth}
        isSampleTenant={isSampleTenant}
        loading={Boolean(state.loading || state.busyNodeId)}
        searchTerm={state.searchTerm}
        onDepthChange={actions.setDepth}
        onFitGraph={() => canvasRef.current?.fitView()}
        onFocusDepthChange={actions.setFocusDepth}
        onResetGraph={resetGraph}
        onResetView={() => canvasRef.current?.resetView()}
        onOpenGuide={isSampleTenant ? () => setSampleGuideDismissed(false) : undefined}
        onSearch={actions.runSearch}
        onSearchTermChange={actions.setSearchTerm}
        onSignOut={onSignOut}
      />
      <nav className="mobile-workspace-nav" aria-label="Workspace sections">
        <button type="button" onClick={() => scrollToWorkspaceTarget('[data-guide="graph-canvas"]')}>
          <Network size={15} />
          Graph
        </button>
        <button type="button" onClick={() => scrollToWorkspaceTarget('[data-guide="results"]')}>
          <Search size={15} />
          Results
        </button>
        <button type="button" onClick={() => scrollToWorkspaceTarget('[data-guide="object-types"]')}>
          <Filter size={15} />
          Types
        </button>
        <button
          type="button"
          onClick={() => scrollToWorkspaceTarget('[data-guide="signins"]', '[data-guide="details"]')}
        >
          <ShieldCheck size={15} />
          Access
        </button>
      </nav>
      <div className="workspace">
        <Sidebar
          adminImpact={derived.adminImpact}
          busyNodeId={state.busyNodeId}
          clusterSummaries={derived.readableClusterSummaries}
          edgeCount={derived.visibleGraph.edges.length}
          expansion={derived.selectedExpansion}
          graphHiddenNodeCount={derived.graphLimitResult.hiddenNodeCount}
          graphNodeCount={derived.visibleGraph.nodes.length}
          graphObjectLimit={state.graphObjectLimit}
          graphTotalNodeCount={derived.graphLimitResult.totalNodeCount}
          impactMetrics={derived.selectedImpact}
          investigationSummary={derived.investigationSummary}
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
              data-guide="graph-canvas"
              focusedZoneId={state.focusedZoneId}
              graph={derived.visibleGraph}
              selectedEdgeId={state.selectedEdgeId}
              selectedNodeId={state.selectedNodeId}
              onSelectCluster={actions.selectCluster}
              onSelectEdge={actions.selectEdge}
              onSelectNode={actions.selectNode}
            />
            <GraphOverlays leftStackTop={graphLimitOverlay} />
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
      {isSampleTenant && <SampleTenantGuide open={guideOpen} onClose={() => setSampleGuideDismissed(true)} />}
    </div>
  );
}

function scrollToWorkspaceTarget(selector: string, fallbackSelector?: string): void {
  const target =
    document.querySelector<HTMLElement>(selector) ??
    (fallbackSelector ? document.querySelector<HTMLElement>(fallbackSelector) : null);

  if (!target) {
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
    inline: 'nearest',
  });
}
