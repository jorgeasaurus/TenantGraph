import { GitBranch, SearchX } from 'lucide-react';
import type { TenantNode } from '../../models/tenantGraph';
import type { ReadablePathCandidate, ReadablePathResult } from '../../utils/readableGraph';

type PathFinderProps = {
  candidates: ReadablePathCandidate[];
  path?: ReadablePathResult;
  selectedNode?: TenantNode;
  selectedTargetId?: string;
  onSelectNode: (nodeId: string) => void;
  onTargetChange: (targetId: string) => void;
};

export function PathFinder({
  candidates,
  path,
  selectedNode,
  selectedTargetId,
  onSelectNode,
  onTargetChange,
}: PathFinderProps) {
  return (
    <section className="sidebar-section path-finder" aria-label="Why does this apply">
      <div className="section-title">
        <GitBranch size={15} />
        Why does this apply?
      </div>

      {!selectedNode && <p className="muted">Select an object to trace its connection path.</p>}

      {selectedNode && candidates.length === 0 && (
        <div className="path-empty">
          <SearchX size={16} aria-hidden="true" />
          <p>Expand this object or increase depth to load an explainable path.</p>
        </div>
      )}

      {selectedNode && candidates.length > 0 && (
        <>
          <label className="path-target-control">
            Explain connection to
            <select
              value={selectedTargetId ?? candidates[0]?.id ?? ''}
              onChange={(event) => onTargetChange(event.target.value)}
            >
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label} - {candidate.objectType}
                </option>
              ))}
            </select>
          </label>

          {path ? (
            <div className="path-result">
              <p>{path.summary}</p>
              <ol>
                {path.steps.map((step) => (
                  <li key={step.id}>
                    <div className="path-step-nodes">
                      <button type="button" onClick={() => onSelectNode(step.from.id)}>
                        {step.from.label}
                      </button>
                      <span>{step.relationship.label}</span>
                      <button type="button" onClick={() => onSelectNode(step.to.id)}>
                        {step.to.label}
                      </button>
                    </div>
                    <small>{step.relationship.sentence}</small>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="path-empty">
              <SearchX size={16} aria-hidden="true" />
              <p>No loaded path connects these objects yet.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
