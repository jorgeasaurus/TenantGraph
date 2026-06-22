export const tenantNodeTypes = [
  'device',
  'user',
  'group',
  'directoryRole',
  'app',
  'cloudApp',
  'appAssignment',
  'compliancePolicy',
  'settingsCatalogPolicy',
  'deviceConfigurationProfile',
  'enrollmentProfile',
  'assignmentFilter',
  'scopeTag',
  'signInEvent',
  'conditionalAccessPolicy',
  'networkLocation',
] as const;

export const tenantRelationshipTypes = [
  'primaryUser',
  'memberOf',
  'member',
  'assignment',
  'target',
  'filteredBy',
  'scopeTag',
  'detectedApp',
  'signedIn',
  'accessed',
  'evaluatedPolicy',
  'blockedBy',
  'grantedBy',
] as const;

export type TenantNodeType = (typeof tenantNodeTypes)[number];
export type TenantRelationshipType = (typeof tenantRelationshipTypes)[number];

export type TenantNode = {
  id: string;
  iconDataUrl?: string;
  type: TenantNodeType;
  label: string;
  subtitle?: string;
  raw?: unknown;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export type TenantEdge = {
  id: string;
  source: string;
  target: string;
  type: TenantRelationshipType;
  label?: string;
};

export type TenantGraph = {
  nodes: TenantNode[];
  edges: TenantEdge[];
};

export type TenantGraphResult = {
  graph: TenantGraph;
  warnings: string[];
  permissionError?: string;
};

export const emptyTenantGraph: TenantGraph = {
  nodes: [],
  edges: [],
};

export const relationshipTypeLabels: Record<TenantRelationshipType, string> = {
  primaryUser: 'Primary user',
  memberOf: 'Member of',
  member: 'Member',
  assignment: 'Assignment',
  target: 'Target',
  filteredBy: 'Filtered by',
  scopeTag: 'Scope tag',
  detectedApp: 'Detected app',
  signedIn: 'Signed in',
  accessed: 'Accessed',
  evaluatedPolicy: 'Evaluated policy',
  blockedBy: 'Blocked by',
  grantedBy: 'Granted by',
};
