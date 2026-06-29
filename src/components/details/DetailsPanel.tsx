import { PlusCircle } from 'lucide-react';
import type { TenantNode, TenantNodeType } from '../../models/tenantGraph';
import type { ImpactMetric, NodeExpansionState } from '../../utils/graphUtils';
import { nodeColors } from '../../utils/graphUtils';
import type { ReadableNodeSummary } from '../../utils/readableGraph';

type DetailsPanelProps = {
  busy: boolean;
  expansion: NodeExpansionState;
  impactMetrics: ImpactMetric[];
  node?: TenantNode;
  readableSummary?: ReadableNodeSummary;
  onExpand: () => void;
};

export function DetailsPanel({
  busy,
  expansion,
  impactMetrics,
  node,
  readableSummary,
  onExpand,
}: DetailsPanelProps) {
  if (!node) {
    return (
      <section className="sidebar-section details-panel">
        <div className="section-title">Selection</div>
        <p className="muted">Select an object to explain it.</p>
      </section>
    );
  }

  const metadata = Object.entries(node.metadata ?? {}).filter(([, value]) => value !== undefined && value !== null);
  const nodeColor = nodeColors[node.type] ?? '#64748b';

  return (
    <section className="sidebar-section details-panel">
      <div className="section-title">Selection</div>
      <div className="details-heading">
        <span className="node-dot large" style={{ background: nodeColor, color: nodeColor }} />
        <div>
          <h2>{node.label}</h2>
          <p>{node.subtitle || node.type}</p>
        </div>
      </div>
      <button className="secondary-action" type="button" onClick={onExpand} disabled={busy || !expansion.canExpand}>
        <PlusCircle size={16} />
        {busy ? 'Expanding…' : expansion.label}
      </button>
      {expansion.helpText && <p className="details-action-hint">{expansion.helpText}</p>}
      {readableSummary && <ReadableSummary summary={readableSummary} />}
      <div className="impact-preview">
        {impactMetrics.length > 0 ? (
          impactMetrics.map((metric) => (
            <div key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))
        ) : (
          <p className="muted">No direct impact in the current graph.</p>
        )}
      </div>
      <details className="technical-details">
        <summary>Technical details</summary>
        <MetadataList metadata={metadata} type={node.type} />
      </details>
    </section>
  );
}

function ReadableSummary({ summary }: { summary: ReadableNodeSummary }) {
  return (
    <div className="readable-summary">
      <div className="readable-kicker">{summary.objectType}</div>
      <p>{summary.summary}</p>
      <p>{summary.impact}</p>
      <p>{summary.nextStep}</p>
      {summary.badges.length > 0 && (
        <div className="readable-badges" aria-label="Object signals">
          {summary.badges.map((badge) => (
            <span key={badge.label} className={`readable-badge ${badge.tone}`}>
              {badge.label}
            </span>
          ))}
        </div>
      )}
      {summary.glossary.length > 0 && (
        <div className="glossary-list">
          {summary.glossary.map((item) => (
            <div key={item.term}>
              <strong>{item.term}</strong>
              <span>{item.definition}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetadataList({
  metadata,
  type,
}: {
  metadata: [string, string | number | boolean | null | undefined][];
  type: TenantNodeType;
}) {
  return (
    <dl className="metadata-list">
      <div>
        <dt>Type</dt>
        <dd>{type}</dd>
      </div>
      {metadata.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
