import { useState } from 'react';
import { AlertTriangle, ExternalLink, Filter, GitBranch, Loader2, ShieldCheck } from 'lucide-react';
import type { GraphClient } from '../../graph/client';
import type { ConditionalAccessPolicyGraphFilter } from '../../graph/signInLogs';
import type {
  ConditionalAccessFilter,
  SignInEvent,
  SignInResultFilter,
} from '../../models/signInLog';
import type { TenantNode } from '../../models/tenantGraph';
import { metadataText } from '../../utils/graphUtils';
import { useSignInInvestigation } from './useSignInInvestigation';

type SignInInvestigationProps = {
  client: GraphClient;
  node?: TenantNode;
  onProjectEvent: (event: SignInEvent, policyFilter: ConditionalAccessPolicyGraphFilter) => void;
};

export function SignInInvestigation({ client, node, onProjectEvent }: SignInInvestigationProps) {
  const { actions, selectedEvent, state, summary, supported } = useSignInInvestigation(client, node);

  if (!supported) {
    return (
      <div className="signins-empty">
        <p>Sign-in logs are available for users, devices, Intune apps, cloud apps, and projected sign-in resources.</p>
      </div>
    );
  }

  return (
    <div className="signins-panel">
      <div className="signins-context">
        <ShieldCheck size={15} />
        <span>{contextLabel(node)}</span>
      </div>

      <div className="signin-filters" aria-label="Sign-in log filters">
        <label>
          Range
          <select value={state.rangeDays} onChange={(event) => actions.setRangeDays(Number(event.target.value))}>
            <option value={1}>24h</option>
            <option value={7}>7d</option>
            <option value={30}>30d</option>
          </select>
        </label>
        <label>
          CA
          <select value={state.caFilter} onChange={(event) => actions.setCaFilter(event.target.value as ConditionalAccessFilter)}>
            <option value="all">All</option>
            <option value="applied">Applied</option>
            <option value="failed">Failed</option>
            <option value="notApplied">Not applied</option>
            <option value="reportOnly">Report-only</option>
            <option value="missingDetails">Missing detail</option>
          </select>
        </label>
        <label>
          Result
          <select value={state.resultFilter} onChange={(event) => actions.setResultFilter(event.target.value as SignInResultFilter)}>
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </label>
        <button type="button" onClick={actions.resetAndLoad} disabled={state.loading}>
          {state.loading ? <Loader2 size={14} /> : <Filter size={14} />}
          Load
        </button>
      </div>

      <label className="signin-detail-toggle">
        <input
          checked={state.includePolicyDetails}
          type="checkbox"
          onChange={(event) => actions.setIncludePolicyDetails(event.target.checked)}
        />
        <span>Request CA policy names and controls</span>
      </label>

      {state.error && (
        <div className="signin-warning" role="alert">
          <AlertTriangle size={14} />
          <span>{state.error}</span>
        </div>
      )}

      {state.events.length > 0 && (
        <>
          <AccessDecisionStrip event={selectedEvent} />
          <div className="signin-summary-grid" aria-label="Sign-in summary">
            <Metric label="Events" value={summary.total} />
            <Metric label="Failures" value={summary.failures} tone={summary.failures > 0 ? 'danger' : undefined} />
            <Metric label="CA failed" value={summary.caFailures} tone={summary.caFailures > 0 ? 'danger' : undefined} />
            <Metric label="Report-only" value={summary.reportOnly} />
          </div>

          <div className="signin-event-list" aria-label="Sign-in events">
            {state.events.map((event) => (
              <button
                key={event.id}
                className={event.id === selectedEvent?.id ? 'active' : ''}
                type="button"
                onClick={() => actions.selectEvent(event.id)}
              >
                <span className={`ca-badge tone-${event.ca.tone}`}>{event.ca.label}</span>
                <strong>{event.appDisplayName || event.resourceDisplayName || 'Unknown app'}</strong>
                <small>{eventLine(event)}</small>
              </button>
            ))}
          </div>

          {state.nextLink && (
            <button className="load-more-button" type="button" onClick={() => void actions.load('append')} disabled={state.loading}>
              Load more sign-ins
            </button>
          )}

          {selectedEvent && (
            <SignInDetail
              event={selectedEvent}
              policyDetailsEnabled={state.includePolicyDetails}
              onProjectEvent={onProjectEvent}
            />
          )}
        </>
      )}

      {!state.loading && !state.error && state.events.length === 0 && (
        <p className="muted">
          {state.hasLoaded
            ? 'No sign-ins matched this object and filter set.'
            : 'Load recent sign-ins to see whether Conditional Access applied to this object.'}
        </p>
      )}
    </div>
  );
}

function AccessDecisionStrip({ event }: { event?: SignInEvent }) {
  if (!event) {
    return null;
  }

  return (
    <div className={`access-decision tone-${event.ca.tone}`}>
      <span>{signInResultLabel(event)}</span>
      <strong>{event.ca.label}</strong>
      <small>{event.ca.summary}</small>
    </div>
  );
}

function SignInDetail({
  event,
  policyDetailsEnabled,
  onProjectEvent,
}: {
  event: SignInEvent;
  policyDetailsEnabled: boolean;
  onProjectEvent: (event: SignInEvent, policyFilter: ConditionalAccessPolicyGraphFilter) => void;
}) {
  const [policyGraphFilter, setPolicyGraphFilter] = useState<ConditionalAccessPolicyGraphFilter>('all');

  return (
    <div className="signin-detail">
      <div className="signin-detail-heading">
        <div>
          <strong>Event detail</strong>
          <span>{formatDate(event.createdDateTime)}</span>
        </div>
        <div className="signin-detail-actions">
          <label>
            Graph policies
            <select
              value={policyGraphFilter}
              onChange={(changeEvent) =>
                setPolicyGraphFilter(changeEvent.target.value as ConditionalAccessPolicyGraphFilter)
              }
            >
              <option value="all">All</option>
              <option value="blocked">Blocked</option>
              <option value="evaluated">Evaluated</option>
            </select>
          </label>
          <button type="button" onClick={() => onProjectEvent(event, policyGraphFilter)}>
            <GitBranch size={13} />
            Show on graph
          </button>
        </div>
      </div>

      <dl className="inspector-dl">
        <dt>User</dt>
        <dd>{event.userDisplayName || event.userPrincipalName || 'Unknown'}</dd>
        <dt>App</dt>
        <dd>{event.appDisplayName || 'Unknown'}</dd>
        <dt>Resource</dt>
        <dd>{event.resourceDisplayName || 'Unknown'}</dd>
        <dt>Failure reason</dt>
        <dd>{event.status.failureReason || event.status.additionalDetails || 'None'}</dd>
        <dt>Client</dt>
        <dd>{event.clientAppUsed || event.deviceDetail?.browser || 'Unknown'}</dd>
        <dt>Device</dt>
        <dd>{deviceLabel(event)}</dd>
        <dt>Location</dt>
        <dd>{locationLabel(event)}</dd>
        <dt>Risk</dt>
        <dd>{[event.riskState, event.riskLevelDuringSignIn, event.riskDetail].filter(Boolean).join(' / ') || 'None'}</dd>
        <dt>Correlation ID</dt>
        <dd>{event.correlationId || 'Unavailable'}</dd>
      </dl>

      {event.ca.missingDetails && (
        <div className="signin-warning">
          <AlertTriangle size={14} />
          <span>
            {policyDetailsEnabled
              ? 'CA policy names were omitted. Confirm Policy.Read.ConditionalAccess and a role such as Security Reader or Conditional Access Administrator.'
              : 'CA policy names are not requested. Enable policy names to request Policy.Read.ConditionalAccess.'}
          </span>
        </div>
      )}

      <div className="ca-policy-groups">
        <PolicyGroup title="Blocking" policies={event.ca.blockingPolicies} />
        <PolicyGroup title="Applied" policies={event.ca.appliedPolicies} />
        <PolicyGroup title="Report-only" policies={event.ca.reportOnlyPolicies} />
        <PolicyGroup title="Not applied" policies={event.ca.notAppliedPolicies} />
      </div>

      <a
        className="entra-link"
        href="https://entra.microsoft.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/SignIns"
        target="_blank"
        rel="noreferrer"
      >
        <ExternalLink size={13} />
        Open sign-in logs in Entra
      </a>
    </div>
  );
}

function PolicyGroup({ policies, title }: { policies: SignInEvent['ca']['policies']; title: string }) {
  if (policies.length === 0) {
    return null;
  }

  return (
    <section>
      <h3>{title}</h3>
      {policies.map((policy) => (
        <article key={`${policy.id}:${policy.result}`}>
          <strong>{policy.displayName}</strong>
          <span>{policy.result}</span>
          {(policy.enforcedGrantControls.length > 0 || policy.enforcedSessionControls.length > 0) && (
            <small>
              {[...policy.enforcedGrantControls, ...policy.enforcedSessionControls].join(', ')}
            </small>
          )}
        </article>
      ))}
    </section>
  );
}

function Metric({ label, tone, value }: { label: string; tone?: 'danger'; value: number }) {
  return (
    <div className={tone ? `metric ${tone}` : 'metric'}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function contextLabel(node: TenantNode | undefined): string {
  if (!node) {
    return 'No object selected';
  }
  if (node.type === 'device') {
    return `Device sign-ins for ${node.label}`;
  }
  if (node.type === 'app') {
    return `Intune app sign-ins for ${node.label}`;
  }
  if (node.type === 'cloudApp') {
    return `Cloud app sign-ins for ${node.label}`;
  }
  if (node.type === 'signInEvent') {
    return `Related sign-ins for ${
      metadataText(node, 'userPrincipalName') ?? metadataText(node, 'userDisplayName') ?? 'projected event user'
    }`;
  }
  return `User sign-ins for ${metadataText(node, 'upn') ?? node.subtitle ?? node.label}`;
}

function signInResultLabel(event: SignInEvent): string {
  return event.status.errorCode === 0 ? 'Success' : 'Failure';
}

function eventLine(event: SignInEvent): string {
  return [formatDate(event.createdDateTime), signInResultLabel(event), locationLabel(event)]
    .filter(Boolean)
    .join(' / ');
}

function deviceLabel(event: SignInEvent): string {
  return [event.deviceDetail?.displayName, event.deviceDetail?.operatingSystem, event.deviceDetail?.browser]
    .filter(Boolean)
    .join(' / ') || 'Unknown';
}

function locationLabel(event: SignInEvent): string {
  return [event.location?.city, event.location?.state, event.location?.countryOrRegion, event.ipAddress]
    .filter(Boolean)
    .join(', ') || 'Unknown';
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
