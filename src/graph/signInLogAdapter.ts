import type {
  AppliedConditionalAccessPolicy,
  SignInDeviceDetail,
  SignInEvent,
  SignInLocation,
  SignInStatus,
} from '../models/signInLog';
import { stableHash } from '../utils/graphUtils';
import { classifyConditionalAccess } from './conditionalAccessEvaluation';

export type GraphSignIn = Record<string, unknown> & {
  appliedConditionalAccessPolicies?: unknown[];
  conditionalAccessStatus?: string;
  createdDateTime?: string;
  id?: string;
  status?: Record<string, unknown>;
};

export function signInEventFromGraph(item: GraphSignIn): SignInEvent {
  const policies = Array.isArray(item.appliedConditionalAccessPolicies)
    ? item.appliedConditionalAccessPolicies.map(policyFromGraph)
    : undefined;
  const status = statusFromGraph(item.status);
  const event: Omit<SignInEvent, 'ca'> = {
    appDisplayName: text(item, 'appDisplayName'),
    appId: text(item, 'appId'),
    appliedConditionalAccessPolicies: policies,
    clientAppUsed: text(item, 'clientAppUsed'),
    conditionalAccessStatus: item.conditionalAccessStatus,
    correlationId: text(item, 'correlationId'),
    createdDateTime: item.createdDateTime ?? new Date(0).toISOString(),
    deviceDetail: deviceFromGraph(item.deviceDetail),
    id: item.id ?? stableHash(JSON.stringify(item)).toString(16),
    ipAddress: text(item, 'ipAddress'),
    isInteractive: bool(item, 'isInteractive'),
    location: locationFromGraph(item.location),
    raw: item,
    resourceDisplayName: text(item, 'resourceDisplayName'),
    resourceId: text(item, 'resourceId'),
    riskDetail: text(item, 'riskDetail'),
    riskEventTypes: arrayText(item, 'riskEventTypes_v2') ?? arrayText(item, 'riskEventTypes') ?? [],
    riskLevelAggregated: text(item, 'riskLevelAggregated'),
    riskLevelDuringSignIn: text(item, 'riskLevelDuringSignIn'),
    riskState: text(item, 'riskState'),
    status,
    userDisplayName: text(item, 'userDisplayName'),
    userId: text(item, 'userId'),
    userPrincipalName: text(item, 'userPrincipalName'),
  };

  return { ...event, ca: classifyConditionalAccess(event.conditionalAccessStatus, policies) };
}

function policyFromGraph(value: unknown): AppliedConditionalAccessPolicy {
  const policy = object(value);
  return {
    displayName: text(policy, 'displayName') ?? 'Conditional Access policy',
    enforcedGrantControls: arrayText(policy, 'enforcedGrantControls') ?? [],
    enforcedSessionControls: arrayText(policy, 'enforcedSessionControls') ?? [],
    id: text(policy, 'id') ?? stableHash(JSON.stringify(value)).toString(16),
    result: text(policy, 'result') ?? 'unknown',
  };
}

function statusFromGraph(value: unknown): SignInStatus {
  const status = object(value);
  const errorCode = number(status, 'errorCode') ?? 0;
  return {
    additionalDetails: text(status, 'additionalDetails'),
    errorCode,
    failureReason: text(status, 'failureReason'),
  };
}

function deviceFromGraph(value: unknown): SignInDeviceDetail | undefined {
  const device = object(value);
  if (!device) {
    return undefined;
  }

  return {
    browser: text(device, 'browser'),
    deviceId: text(device, 'deviceId'),
    displayName: text(device, 'displayName'),
    isCompliant: bool(device, 'isCompliant'),
    isManaged: bool(device, 'isManaged'),
    operatingSystem: text(device, 'operatingSystem'),
    trustType: text(device, 'trustType'),
  };
}

function locationFromGraph(value: unknown): SignInLocation | undefined {
  const location = object(value);
  if (!location) {
    return undefined;
  }

  return {
    city: text(location, 'city'),
    countryOrRegion: text(location, 'countryOrRegion'),
    state: text(location, 'state'),
  };
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function text(source: unknown, key: string): string | undefined {
  const value = object(source)?.[key];
  return typeof value === 'string' && value ? value : undefined;
}

function number(source: unknown, key: string): number | undefined {
  const value = object(source)?.[key];
  return typeof value === 'number' ? value : undefined;
}

function bool(source: unknown, key: string): boolean | undefined {
  const value = object(source)?.[key];
  return typeof value === 'boolean' ? value : undefined;
}

function arrayText(source: unknown, key: string): string[] | undefined {
  const value = object(source)?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}
