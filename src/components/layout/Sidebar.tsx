import { AlertTriangle, ChevronRight, Filter, Search, ShieldAlert } from 'lucide-react';
import {
  relationshipTypeLabels,
  tenantRelationshipTypes,
  type TenantNode,
  type TenantNodeType,
  type TenantRelationshipType,
} from '../../models/tenantGraph';
import { nodeColors, type ImpactMetric, type NodeExpansionState } from '../../utils/graphUtils';
import {
  readableObjectType,
  type ReadableClusterSummary,
  type ReadableNodeSummary,
  type ReadablePathCandidate,
  type ReadablePathResult,
} from '../../utils/readableGraph';
import { sidebarTypeSections } from '../../utils/graphZones';
import { nodeTypeLabels } from '../../utils/typePresentation';
import { ClusterSummary } from '../details/ClusterSummary';
import { DetailsPanel } from '../details/DetailsPanel';
import { PathFinder } from '../details/PathFinder';

type SidebarProps = {
  busyNodeId?: string;
  clusterSummaries: ReadableClusterSummary[];
  edgeCount: number;
  expansion: NodeExpansionState;
  graphHiddenNodeCount: number;
  graphObjectLimit: number;
  graphNodeCount: number;
  graphTotalNodeCount: number;
  impactMetrics: ImpactMetric[];
  path?: ReadablePathResult;
  pathCandidates: ReadablePathCandidate[];
  permissionError?: string;
  relationshipFilter: Record<string, boolean>;
  resultLimit: number;
  resultTotalCount: number;
  results: TenantNode[];
  searchTerm: string;
  searching: boolean;
  selectedNode?: TenantNode;
  selectedPathTargetId?: string;
  selectedReadableSummary?: ReadableNodeSummary;
  typeFilter: Record<string, boolean>;
  warnings: string[];
  onExpandSelected: () => void;
  onLoadMoreGraphObjects: () => void;
  onLoadMoreResults: () => void;
  onPathTargetChange: (targetId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onToggleRelationship: (type: TenantRelationshipType) => void;
  onToggleType: (type: TenantNodeType) => void;
};

export function Sidebar({
  busyNodeId,
  clusterSummaries,
  edgeCount,
  expansion,
  graphHiddenNodeCount,
  graphObjectLimit,
  graphNodeCount,
  graphTotalNodeCount,
  impactMetrics,
  path,
  pathCandidates,
  permissionError,
  relationshipFilter,
  resultLimit,
  resultTotalCount,
  results,
  searchTerm,
  searching,
  selectedNode,
  selectedPathTargetId,
  selectedReadableSummary,
  typeFilter,
  warnings,
  onExpandSelected,
  onLoadMoreGraphObjects,
  onLoadMoreResults,
  onPathTargetChange,
  onSelectNode,
  onToggleRelationship,
  onToggleType,
}: SidebarProps) {
  const visibleResults = results.slice(0, resultLimit);
  const hiddenResultCount = Math.max(0, resultTotalCount - visibleResults.length);
  const showDataConfidence = Boolean(permissionError) || warnings.length > 0;

  return (
    <aside className="sidebar" data-guide="sidebar">
      <section className="sidebar-section summary-row">
        <div>
          <span className="metric-value">{graphNodeCount}</span>
          <span className="metric-label">objects</span>
        </div>
        <div>
          <span className="metric-value">{edgeCount}</span>
          <span className="metric-label">relationships</span>
        </div>
      </section>

      {graphHiddenNodeCount > 0 && (
        <section className="sidebar-section display-limit">
          <div>
            <strong>{graphNodeCount} shown</strong>
            <span>{graphHiddenNodeCount} hidden from {graphTotalNodeCount} loaded objects.</span>
            <small>Display limit: {graphObjectLimit}</small>
          </div>
          <button type="button" onClick={onLoadMoreGraphObjects}>
            Load more
          </button>
        </section>
      )}

      <ClusterSummary summaries={clusterSummaries} />
      {showDataConfidence && (
        <section className="sidebar-section data-confidence" aria-label="Data confidence">
          <div className="section-title">
            <ShieldAlert size={15} />
            Data confidence
          </div>
          <div className="readable-badges" aria-label="Data confidence signals">
            {permissionError && <span className="readable-badge warning">Missing permission</span>}
            {warnings.length > 0 && <span className="readable-badge warning">Partial data</span>}
          </div>
          <p>
            {permissionError
              ? 'Some relationships may be hidden until the app has the required Microsoft Graph permission.'
              : 'Some Graph calls returned warnings, so this view may not include every relationship.'}
          </p>
          {warnings.length > 0 && (
            <small>
              <AlertTriangle size={12} aria-hidden="true" />
              {warnings.length} warning{warnings.length === 1 ? '' : 's'} available below
            </small>
          )}
        </section>
      )}

      <section className="sidebar-section" data-guide="results">
        <div className="section-title">
          <Search size={15} />
          Results
        </div>
        {searching && <p className="muted">Searching Microsoft Graph.</p>}
        <div className="result-list">
          {visibleResults.map((node) => {
            const color = nodeColors[node.type] ?? '#64748b';
            return (
              <button
                key={node.id}
                className="result-item"
                type="button"
                onClick={() => onSelectNode(node.id)}
              >
                <span className="node-dot" style={{ background: color, color }} />
                <span>
                  <strong>{node.label}</strong>
                  <small>{readableObjectType(node)}</small>
                </span>
                <ChevronRight size={14} />
              </button>
            );
          })}
          {results.length === 0 && <p className="muted">{searchTerm.trim() ? 'No matches.' : 'Type in the toolbar to search.'}</p>}
          {hiddenResultCount > 0 && (
            <button className="load-more-button" type="button" onClick={onLoadMoreResults}>
              Load {Math.min(30, hiddenResultCount)} more results
            </button>
          )}
        </div>
      </section>

      <section className="sidebar-section" data-guide="object-types">
        <div className="section-title">
          <Filter size={15} />
          Object types
        </div>
        <div className="check-grid">
          {sidebarTypeSections.map((section) => (
            <details key={section.id} className="type-filter-section">
              <summary>
                <span>{section.label}</span>
                <small>{enabledCount(section.nodeTypes, typeFilter)} on</small>
              </summary>
              <div className="type-filter-options">
                {section.nodeTypes.map((type) => (
                  <label key={type} className="check-row">
                    <input checked={Boolean(typeFilter[type])} type="checkbox" onChange={() => onToggleType(type)} />
                    <span className="node-dot" style={{ background: nodeColors[type], color: nodeColors[type] }} />
                    {nodeTypeLabels[type]}
                  </label>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="sidebar-section" data-guide="relationships">
        <div className="section-title">Relationships</div>
        <div className="check-grid compact">
          {tenantRelationshipTypes.map((type) => (
            <label key={type} className="check-row">
              <input
                checked={Boolean(relationshipFilter[type])}
                type="checkbox"
                onChange={() => onToggleRelationship(type)}
              />
              {relationshipTypeLabels[type]}
            </label>
          ))}
        </div>
      </section>

      <div data-guide="details">
        <DetailsPanel
          busy={selectedNode?.id === busyNodeId}
          expansion={expansion}
          impactMetrics={impactMetrics}
          node={selectedNode}
          readableSummary={selectedReadableSummary}
          onExpand={onExpandSelected}
        />
      </div>

      <div data-guide="path-finder">
        <PathFinder
          candidates={pathCandidates}
          path={path}
          selectedNode={selectedNode}
          selectedTargetId={selectedPathTargetId}
          onSelectNode={onSelectNode}
          onTargetChange={onPathTargetChange}
        />
      </div>

      {warnings.length > 0 && (
        <section className="sidebar-section warning-list">
          <div className="section-title">Graph warnings</div>
          {warnings.slice(-4).map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </section>
      )}
    </aside>
  );
}

function enabledCount(nodeTypes: readonly TenantNodeType[], typeFilter: Record<string, boolean>): number {
  return nodeTypes.filter((type) => typeFilter[type]).length;
}
