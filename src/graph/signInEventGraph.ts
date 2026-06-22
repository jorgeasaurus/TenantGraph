import type { SignInEvent } from '../models/signInLog';
import type { TenantGraph, TenantNode, TenantRelationshipType } from '../models/tenantGraph';
import { mergeTenantGraphs, stableHash } from '../utils/graphUtils';

export type ConditionalAccessPolicyGraphFilter = 'all' | 'blocked' | 'evaluated';

export function signInEventToGraph(
  event: SignInEvent,
  policyFilter: ConditionalAccessPolicyGraphFilter = 'all',
): TenantGraph {
  const nodes = new Map<string, TenantNode>();
  const edges: TenantGraph['edges'] = [];
  const eventNodeId = signInEventNodeId(event);
  const resourceKey = event.resourceId || event.appId || stableHash(event.appDisplayName || event.id).toString(16);

  nodes.set(eventNodeId, {
    id: eventNodeId,
    type: 'signInEvent',
    label: `${signInResultLabel(event)} / ${event.appDisplayName || event.resourceDisplayName || 'Sign-in'}`,
    subtitle: event.createdDateTime,
    raw: event.raw,
    metadata: {
      ca: event.ca.label,
      result: signInResultLabel(event),
      time: event.createdDateTime,
      userDisplayName: event.userDisplayName,
      userId: event.userId,
      userPrincipalName: event.userPrincipalName,
    },
  });

  if (event.userId || event.userPrincipalName) {
    const userId = `user:${event.userId || event.userPrincipalName}`;
    nodes.set(userId, {
      id: userId,
      type: 'user',
      label: event.userDisplayName || event.userPrincipalName || 'User',
      subtitle: event.userPrincipalName,
    });
    edges.push({
      id: `${userId}->${eventNodeId}:signedIn`,
      source: userId,
      target: eventNodeId,
      type: 'signedIn',
      label: 'Signed in',
    });
  }

  const resourceNodeId = `cloudApp:${resourceKey}`;
  nodes.set(resourceNodeId, {
    id: resourceNodeId,
    type: 'cloudApp',
    label: event.resourceDisplayName || event.appDisplayName || 'Resource',
    subtitle: event.appDisplayName,
    metadata: {
      appDisplayName: event.appDisplayName,
      appId: event.appId,
      resourceDisplayName: event.resourceDisplayName,
      resourceId: event.resourceId,
    },
  });
  edges.push({
    id: `${eventNodeId}->${resourceNodeId}:accessed`,
    source: eventNodeId,
    target: resourceNodeId,
    type: 'accessed',
    label: 'Accessed',
  });

  if (event.location && (event.location.city || event.location.countryOrRegion || event.ipAddress)) {
    const locationLabel = [event.location.city, event.location.countryOrRegion].filter(Boolean).join(', ') || event.ipAddress || 'Location';
    const locationNodeId = `networkLocation:${stableHash(`${locationLabel}:${event.ipAddress ?? ''}`).toString(16)}`;
    nodes.set(locationNodeId, {
      id: locationNodeId,
      type: 'networkLocation',
      label: locationLabel,
      subtitle: event.ipAddress,
    });
    edges.push({
      id: `${locationNodeId}->${eventNodeId}:signedIn`,
      source: locationNodeId,
      target: eventNodeId,
      type: 'signedIn',
      label: 'From location',
    });
  }

  for (const policy of event.ca.policies) {
    const edgeType = policyRelationshipType(policy.result);
    if (!policyMatchesGraphFilter(edgeType, policyFilter)) {
      continue;
    }

    const policyNodeId = `conditionalAccessPolicy:${policy.id || stableHash(policy.displayName).toString(16)}`;
    nodes.set(policyNodeId, {
      id: policyNodeId,
      type: 'conditionalAccessPolicy',
      label: policy.displayName || 'Conditional Access policy',
      subtitle: policy.result,
      metadata: {
        grantControls: policy.enforcedGrantControls.join(', '),
        sessionControls: policy.enforcedSessionControls.join(', '),
        result: policy.result,
      },
    });
    edges.push({
      id: `${eventNodeId}->${policyNodeId}:${edgeType}`,
      source: eventNodeId,
      target: policyNodeId,
      type: edgeType,
      label: edgeType === 'blockedBy' ? 'Blocked by' : edgeType === 'grantedBy' ? 'Granted by' : 'Evaluated policy',
    });
  }

  return { nodes: [...nodes.values()], edges };
}

export function replaceSignInEventProjection(
  graph: TenantGraph,
  event: SignInEvent,
  policyFilter: ConditionalAccessPolicyGraphFilter = 'all',
): TenantGraph {
  const eventNodeId = signInEventNodeId(event);
  const connectedProjectionIds = new Set([eventNodeId]);
  const retainedEdges = graph.edges.filter((edge) => {
    const connectsToEvent = edge.source === eventNodeId || edge.target === eventNodeId;
    if (connectsToEvent) {
      connectedProjectionIds.add(edge.source);
      connectedProjectionIds.add(edge.target);
    }
    return !connectsToEvent;
  });
  const retainedEdgeNodeIds = new Set<string>();
  for (const edge of retainedEdges) {
    retainedEdgeNodeIds.add(edge.source);
    retainedEdgeNodeIds.add(edge.target);
  }
  const retainedNodes = graph.nodes.filter((node) => {
    if (!connectedProjectionIds.has(node.id)) {
      return true;
    }
    if (node.id === eventNodeId) {
      return false;
    }
    if (
      (node.type === 'cloudApp' || node.type === 'conditionalAccessPolicy' || node.type === 'networkLocation') &&
      !retainedEdgeNodeIds.has(node.id)
    ) {
      return false;
    }
    return true;
  });

  return mergeTenantGraphs({ nodes: retainedNodes, edges: retainedEdges }, signInEventToGraph(event, policyFilter));
}

function policyMatchesGraphFilter(
  edgeType: TenantRelationshipType,
  policyFilter: ConditionalAccessPolicyGraphFilter,
): boolean {
  if (policyFilter === 'blocked') {
    return edgeType === 'blockedBy';
  }
  if (policyFilter === 'evaluated') {
    return edgeType === 'evaluatedPolicy';
  }

  return true;
}

function policyRelationshipType(result: string): TenantRelationshipType {
  const normalized = result.toLowerCase();
  if (normalized.startsWith('reportonly') || normalized.includes('notapplied') || normalized.includes('notenabled')) {
    return 'evaluatedPolicy';
  }
  if (normalized.includes('failure')) {
    return 'blockedBy';
  }
  if (normalized.includes('success')) {
    return 'grantedBy';
  }
  return 'evaluatedPolicy';
}

function signInResultLabel(event: SignInEvent): string {
  return event.status.errorCode === 0 ? 'Success' : 'Failure';
}

export function signInEventNodeId(event: Pick<SignInEvent, 'id'>): string {
  return `signInEvent:${event.id}`;
}
