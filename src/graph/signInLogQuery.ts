import type { ConditionalAccessFilter, SignInEvent, SignInResultFilter } from '../models/signInLog';
import type { TenantNode } from '../models/tenantGraph';
import { metadataText, nodeApiId } from '../utils/graphUtils';
import { odataString } from './query';

const signInLogSubjectTypes = new Set<TenantNode['type']>([
  'app',
  'cloudApp',
  'device',
  'networkLocation',
  'signInEvent',
  'user',
]);

type SignInLogSubjectNode = TenantNode & {
  type: 'app' | 'cloudApp' | 'device' | 'networkLocation' | 'signInEvent' | 'user';
};

export type SignInLogQuery = {
  caFilter: ConditionalAccessFilter;
  includePolicyDetails: boolean;
  node?: SignInLogSubjectNode;
  rangeDays: number;
  resultFilter: SignInResultFilter;
  top: number;
};

export function signInLogPath(query: SignInLogQuery): string {
  const rangeDays = Math.min(30, Math.max(1, Math.floor(query.rangeDays)));
  const top = Math.min(50, Math.max(5, Math.floor(query.top)));
  const end = new Date();
  const start = new Date(end.getTime() - rangeDays * 24 * 60 * 60 * 1000);
  const filter = signInFilter(query, start, end);

  return `/auditLogs/signIns?$top=${top}&$filter=${encodeURIComponent(filter)}`;
}

function isSignInLogSubjectNode(node: TenantNode | undefined): node is SignInLogSubjectNode {
  return Boolean(node && signInLogSubjectTypes.has(node.type));
}

export function signInLogSubject(node: TenantNode | undefined): SignInLogSubjectNode | undefined {
  return isSignInLogSubjectNode(node) ? node : undefined;
}

export function eventMatchesNode(event: SignInEvent, node: SignInLogSubjectNode | undefined): boolean {
  if (!node) {
    return true;
  }

  switch (node.type) {
    case 'device': {
      const deviceId = String(node.metadata?.azureADDeviceId ?? node.metadata?.deviceId ?? nodeApiId(node)).toLowerCase();
      const deviceName = node.label.toLowerCase();
      return (
        event.deviceDetail?.deviceId?.toLowerCase() === deviceId ||
        event.deviceDetail?.displayName?.toLowerCase() === deviceName
      );
    }
    case 'app':
    case 'cloudApp':
      return [event.appDisplayName, event.resourceDisplayName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(node.label.toLowerCase()));
    case 'networkLocation': {
      const nodeLabel = node.label.toLowerCase();
      const nodeIp = String(node.subtitle ?? '').toLowerCase();
      return (
        (Boolean(nodeIp) && event.ipAddress?.toLowerCase() === nodeIp) ||
        eventLocationText(event).toLowerCase().includes(nodeLabel)
      );
    }
    case 'signInEvent': {
      const userId = metadataText(node, 'userId')?.toLowerCase();
      const upn = metadataText(node, 'userPrincipalName')?.toLowerCase();

      if (userId || upn) {
        return event.userId?.toLowerCase() === userId || event.userPrincipalName?.toLowerCase() === upn;
      }

      return event.id === nodeApiId(node);
    }
    case 'user':
      return event.userId === nodeApiId(node) || event.userPrincipalName === (node.metadata?.upn ?? node.subtitle);
  }

  return false;
}

export function eventMatchesResult(event: SignInEvent, filter: SignInResultFilter): boolean {
  if (filter === 'all') {
    return true;
  }
  const succeeded = event.status.errorCode === 0;
  return filter === 'success' ? succeeded : !succeeded;
}

export function eventMatchesCa(event: SignInEvent, filter: ConditionalAccessFilter): boolean {
  return filter === 'all' || event.ca.state === filter || (filter === 'missingDetails' && event.ca.missingDetails);
}

function signInFilter(query: SignInLogQuery, start: Date, end: Date): string {
  const clauses = [
    `createdDateTime ge ${start.toISOString()}`,
    `createdDateTime le ${end.toISOString()}`,
  ];
  const context = contextFilter(query.node);
  const caStatus = graphCaStatus(query.caFilter);

  if (context) {
    clauses.push(context);
  }
  if (caStatus) {
    clauses.push(`conditionalAccessStatus eq '${caStatus}'`);
  }

  return clauses.join(' and ');
}

function contextFilter(node: SignInLogSubjectNode | undefined): string | undefined {
  if (!node) {
    return undefined;
  }

  const apiId = odataString(nodeApiId(node));
  if (node.type === 'user') {
    return userContextFilter(apiId, odataString(String(node.metadata?.upn ?? node.subtitle ?? '')));
  }

  if (node.type === 'app') {
    return `startsWith(appDisplayName,'${odataString(node.label)}')`;
  }

  if (node.type === 'cloudApp') {
    const appId = metadataText(node, 'appId');
    if (appId) {
      return `appId eq '${odataString(appId)}'`;
    }

    return `startsWith(appDisplayName,'${odataString(metadataText(node, 'appDisplayName') ?? node.label)}')`;
  }

  if (node.type === 'signInEvent') {
    const userId = odataString(metadataText(node, 'userId') ?? '');
    const upn = odataString(metadataText(node, 'userPrincipalName') ?? '');

    return userContextFilter(userId, upn) ?? `id eq '${apiId}'`;
  }

  return undefined;
}

function userContextFilter(userId: string, upn: string): string | undefined {
  if (userId && upn) {
    return `(userId eq '${userId}' or userPrincipalName eq '${upn}')`;
  }
  if (userId) {
    return `userId eq '${userId}'`;
  }
  if (upn) {
    return `userPrincipalName eq '${upn}'`;
  }

  return undefined;
}

function graphCaStatus(filter: ConditionalAccessFilter): string | undefined {
  switch (filter) {
    case 'applied':
      return 'success';
    case 'failed':
      return 'failure';
    case 'notApplied':
      return 'notApplied';
    default:
      return undefined;
  }
}

function eventLocationText(event: SignInEvent): string {
  return [event.location?.city, event.location?.state, event.location?.countryOrRegion, event.ipAddress]
    .filter(Boolean)
    .join(', ');
}
