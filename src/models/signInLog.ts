type ConditionalAccessState =
  | 'applied'
  | 'failed'
  | 'missingDetails'
  | 'notApplied'
  | 'reportOnly'
  | 'unknown';

type ConditionalAccessTone = 'danger' | 'info' | 'muted' | 'success' | 'warning';

export type AppliedConditionalAccessPolicy = {
  displayName: string;
  enforcedGrantControls: string[];
  enforcedSessionControls: string[];
  id: string;
  result: string;
};

export type ConditionalAccessEvaluation = {
  appliedPolicies: AppliedConditionalAccessPolicy[];
  blockingPolicies: AppliedConditionalAccessPolicy[];
  label: string;
  missingDetails: boolean;
  notAppliedPolicies: AppliedConditionalAccessPolicy[];
  policies: AppliedConditionalAccessPolicy[];
  reportOnlyPolicies: AppliedConditionalAccessPolicy[];
  state: ConditionalAccessState;
  summary: string;
  tone: ConditionalAccessTone;
};

export type SignInStatus = {
  additionalDetails?: string;
  errorCode: number;
  failureReason?: string;
};

export type SignInDeviceDetail = {
  browser?: string;
  deviceId?: string;
  displayName?: string;
  isCompliant?: boolean;
  isManaged?: boolean;
  operatingSystem?: string;
  trustType?: string;
};

export type SignInLocation = {
  city?: string;
  countryOrRegion?: string;
  state?: string;
};

export type SignInEvent = {
  appDisplayName?: string;
  appId?: string;
  appliedConditionalAccessPolicies?: AppliedConditionalAccessPolicy[];
  ca: ConditionalAccessEvaluation;
  clientAppUsed?: string;
  conditionalAccessStatus?: string;
  correlationId?: string;
  createdDateTime: string;
  deviceDetail?: SignInDeviceDetail;
  id: string;
  ipAddress?: string;
  isInteractive?: boolean;
  location?: SignInLocation;
  raw?: unknown;
  resourceDisplayName?: string;
  resourceId?: string;
  riskDetail?: string;
  riskEventTypes: string[];
  riskLevelAggregated?: string;
  riskLevelDuringSignIn?: string;
  riskState?: string;
  status: SignInStatus;
  userDisplayName?: string;
  userId?: string;
  userPrincipalName?: string;
};

export type SignInQueryResult = {
  events: SignInEvent[];
  nextLink?: string;
};

export type ConditionalAccessFilter = 'all' | 'applied' | 'failed' | 'missingDetails' | 'notApplied' | 'reportOnly';
export type SignInResultFilter = 'all' | 'failure' | 'success';
