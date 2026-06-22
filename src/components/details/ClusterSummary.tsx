import {
  AppWindow,
  Cloud,
  FileCheck2,
  GitBranch,
  Monitor,
  Network,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ReadableClusterSummary } from '../../utils/readableGraph';

type ClusterSummaryProps = {
  summaries: ReadableClusterSummary[];
};

const clusterIcons: Record<string, LucideIcon> = {
  apps: AppWindow,
  assignments: GitBranch,
  cloudApps: Cloud,
  devices: Monitor,
  groups: Network,
  guardrails: ShieldCheck,
  people: Users,
  policies: FileCheck2,
  roles: ShieldCheck,
};

export function ClusterSummary({ summaries }: ClusterSummaryProps) {
  return (
    <section className="sidebar-section cluster-summary" aria-label="Readable graph summary">
      <div className="section-title">At a glance</div>
      {summaries.length > 0 ? (
        <div className="cluster-summary-grid">
          {summaries.map((summary) => {
            const Icon = clusterIcons[summary.id] ?? Network;

            return (
              <article key={summary.id} className={`cluster-item tone-${summary.tone}`}>
                <div className="cluster-item-heading">
                  <Icon size={16} aria-hidden="true" />
                  <span>{summary.label}</span>
                  <strong>{summary.count}</strong>
                </div>
                <p>{summary.description}</p>
                {summary.detail && <small>{summary.detail}</small>}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="muted">No visible objects in the current view.</p>
      )}
    </section>
  );
}
