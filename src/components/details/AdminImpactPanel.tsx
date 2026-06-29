import { Clipboard, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AdminImpactAnalysis, AdminFinding } from '../../utils/adminInsights';

type AdminImpactPanelProps = {
  analysis: AdminImpactAnalysis;
  investigationSummary: string;
  selectedLabel?: string;
};

export function AdminImpactPanel({
  analysis,
  investigationSummary,
  selectedLabel,
}: AdminImpactPanelProps) {
  const [copied, setCopied] = useState(false);
  const copyResetTimer = useRef<number | undefined>(undefined);
  const title = selectedLabel ? 'Impact analyzer' : 'Tenant hygiene';

  useEffect(() => () => {
    if (copyResetTimer.current !== undefined) {
      window.clearTimeout(copyResetTimer.current);
    }
  }, []);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(investigationSummary);
      if (copyResetTimer.current !== undefined) {
        window.clearTimeout(copyResetTimer.current);
      }
      setCopied(true);
      copyResetTimer.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimer.current = undefined;
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="sidebar-section admin-impact-panel" aria-label={title}>
      <div className="section-title">
        <ShieldCheck size={15} />
        {title}
      </div>
      <p>{analysis.summary}</p>
      <div className="blast-radius-grid" aria-label="Loaded blast radius">
        <ImpactCount label="users" value={analysis.blastRadius.users} />
        <ImpactCount label="devices" value={analysis.blastRadius.devices} />
        <ImpactCount label="groups" value={analysis.blastRadius.groups} />
        <ImpactCount label="apps" value={analysis.blastRadius.apps} />
        <ImpactCount label="policies" value={analysis.blastRadius.policies} />
        <ImpactCount label="filters" value={analysis.blastRadius.filters} />
      </div>

      <InsightList findings={analysis.findings} title="Review signals" />
      <InsightList findings={analysis.recentChanges} title="Recent changes" emptyText="No recent change signals in the loaded graph." />

      <div className="admin-action-row">
        <button className="secondary-action compact-action" type="button" onClick={() => void copySummary()}>
          <Clipboard size={15} />
          {copied ? 'Evidence Copied' : 'Copy Evidence'}
        </button>
      </div>
    </section>
  );
}

function ImpactCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function InsightList({
  emptyText = 'No review signals in the loaded graph.',
  findings,
  title,
}: {
  emptyText?: string;
  findings: AdminFinding[];
  title: string;
}) {
  return (
    <div className="admin-insight-list">
      <h3>{title}</h3>
      {findings.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        findings.map((finding) => (
          <div key={finding.id} className={`admin-finding ${finding.severity}`}>
            <TriangleAlert size={14} aria-hidden="true" />
            <span>
              <strong>{finding.title}</strong>
              <small>{finding.detail}</small>
            </span>
          </div>
        ))
      )}
    </div>
  );
}
