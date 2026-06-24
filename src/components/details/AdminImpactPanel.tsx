import { Clipboard, Save, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AdminImpactAnalysis, AdminFinding } from '../../utils/adminInsights';

type AdminImpactPanelProps = {
  analysis: AdminImpactAnalysis;
  investigationSummary: string;
  selectedLabel?: string;
};

type SavedInvestigation = {
  id: string;
  savedAt: string;
  subject: string;
  summary: string;
};

const savedInvestigationsKey = 'tenantGraph.savedInvestigations';
const savedInvestigationDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function AdminImpactPanel({
  analysis,
  investigationSummary,
  selectedLabel,
}: AdminImpactPanelProps) {
  const [copied, setCopied] = useState(false);
  const [savedInvestigations, setSavedInvestigations] = useState<SavedInvestigation[]>(readSavedInvestigations);
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

  function saveInvestigation() {
    const nextSaved = [
      {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        subject: selectedLabel ?? 'Tenant hygiene',
        summary: investigationSummary,
      },
      ...savedInvestigations,
    ].slice(0, 6);

    setSavedInvestigations(nextSaved);
    writeSavedInvestigations(nextSaved);
  }

  function removeInvestigation(id: string) {
    const nextSaved = savedInvestigations.filter((investigation) => investigation.id !== id);
    setSavedInvestigations(nextSaved);
    writeSavedInvestigations(nextSaved);
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
          {copied ? 'Copied' : 'Copy evidence'}
        </button>
        <button className="secondary-action compact-action" type="button" onClick={saveInvestigation}>
          <Save size={15} />
          Save view
        </button>
      </div>

      {savedInvestigations.length > 0 && (
        <div className="saved-investigations">
          <h3>Saved investigations</h3>
          {savedInvestigations.map((investigation) => (
            <div key={investigation.id} className="saved-investigation">
              <span>
                <strong>{investigation.subject}</strong>
                <small>{formatSavedAt(investigation.savedAt)}</small>
              </span>
              <button
                aria-label={`Remove saved investigation for ${investigation.subject}`}
                type="button"
                onClick={() => removeInvestigation(investigation.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
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

function readSavedInvestigations(): SavedInvestigation[] {
  try {
    const stored = window.localStorage.getItem(savedInvestigationsKey);
    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isSavedInvestigation).slice(0, 6) : [];
  } catch {
    return [];
  }
}

function writeSavedInvestigations(investigations: SavedInvestigation[]): void {
  try {
    window.localStorage.setItem(savedInvestigationsKey, JSON.stringify(investigations));
  } catch {
    // Saving investigation shortcuts should never block graph exploration.
  }
}

function isSavedInvestigation(value: unknown): value is SavedInvestigation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.savedAt === 'string' &&
    typeof candidate.subject === 'string' &&
    typeof candidate.summary === 'string'
  );
}

function formatSavedAt(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return savedInvestigationDateFormatter.format(timestamp);
}
