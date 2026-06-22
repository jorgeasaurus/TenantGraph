import { tenantNodeTypes, type TenantNodeType } from '../models/tenantGraph';

export type GraphZoneId =
  | 'access'
  | 'apps'
  | 'context'
  | 'devices'
  | 'groups'
  | 'guardrails'
  | 'people'
  | 'policies';

export type GraphZoneDefinition = {
  color: string;
  id: GraphZoneId;
  label: string;
  order: number;
};

export type TenantTypePresentation = {
  color: string;
  label: string;
  zoneId: GraphZoneId;
};

export const graphZoneDefinitions: Record<GraphZoneId, GraphZoneDefinition> = {
  access: { id: 'access', label: 'Privileged access', color: '#f59e0b', order: 5 },
  apps: { id: 'apps', label: 'Apps', color: '#ff3366', order: 3 },
  context: { id: 'context', label: 'Tenant context', color: '#64748b', order: 99 },
  devices: { id: 'devices', label: 'Devices', color: '#3fd1ff', order: 1 },
  groups: { id: 'groups', label: 'Groups', color: '#14f195', order: 2 },
  guardrails: { id: 'guardrails', label: 'Filters and scope', color: '#ff2bd6', order: 6 },
  people: { id: 'people', label: 'People', color: '#fbbf24', order: 0 },
  policies: { id: 'policies', label: 'Policies', color: '#a78bfa', order: 4 },
};

export const policyNodeTypes = [
  'compliancePolicy',
  'deviceConfigurationProfile',
  'enrollmentProfile',
  'settingsCatalogPolicy',
] as const satisfies readonly TenantNodeType[];

export const tenantTypePresentation: Record<TenantNodeType, TenantTypePresentation> = {
  app: { color: '#ff3366', label: 'Intune apps', zoneId: 'apps' },
  appAssignment: { color: '#ff7a18', label: 'App assignments', zoneId: 'apps' },
  assignmentFilter: { color: '#ff2bd6', label: 'Assignment filters', zoneId: 'guardrails' },
  cloudApp: { color: '#38bdf8', label: 'Cloud apps', zoneId: 'apps' },
  compliancePolicy: { color: '#a78bfa', label: 'Compliance policies', zoneId: 'policies' },
  conditionalAccessPolicy: { color: '#f59e0b', label: 'Conditional Access policies', zoneId: 'guardrails' },
  device: { color: '#3fd1ff', label: 'Devices', zoneId: 'devices' },
  deviceConfigurationProfile: { color: '#60a5fa', label: 'Device profiles', zoneId: 'policies' },
  directoryRole: { color: '#f59e0b', label: 'Directory roles', zoneId: 'access' },
  enrollmentProfile: { color: '#f97316', label: 'Enrollment profiles', zoneId: 'policies' },
  group: { color: '#14f195', label: 'Groups', zoneId: 'groups' },
  networkLocation: { color: '#94a3b8', label: 'Locations', zoneId: 'people' },
  scopeTag: { color: '#fde047', label: 'Scope tags', zoneId: 'guardrails' },
  settingsCatalogPolicy: { color: '#2dd4bf', label: 'Settings catalog', zoneId: 'policies' },
  signInEvent: { color: '#38bdf8', label: 'Sign-in events', zoneId: 'people' },
  user: { color: '#fbbf24', label: 'Users', zoneId: 'people' },
};

export const nodeColors = Object.fromEntries(
  tenantNodeTypes.map((type) => [type, tenantTypePresentation[type].color]),
) as Record<TenantNodeType, string>;

export const nodeTypeLabels = Object.fromEntries(
  tenantNodeTypes.map((type) => [type, tenantTypePresentation[type].label]),
) as Record<TenantNodeType, string>;

export const graphZoneNodeTypes = buildZoneNodeTypes();

export const sidebarTypeSections = [
  zoneSection('people'),
  zoneSection('devices'),
  zoneSection('groups'),
  zoneSection('apps'),
  zoneSection('policies'),
  zoneSection('access'),
  zoneSection('guardrails'),
];

function buildZoneNodeTypes(): Record<GraphZoneId, readonly TenantNodeType[]> {
  const zoneNodeTypes: Record<GraphZoneId, TenantNodeType[]> = {
    access: [],
    apps: [],
    context: [],
    devices: [],
    groups: [],
    guardrails: [],
    people: [],
    policies: [],
  };

  for (const type of tenantNodeTypes) {
    zoneNodeTypes[tenantTypePresentation[type].zoneId].push(type);
  }

  return zoneNodeTypes;
}

function zoneSection(zoneId: GraphZoneId): {
  id: GraphZoneId;
  label: string;
  nodeTypes: readonly TenantNodeType[];
} {
  return {
    id: zoneId,
    label: graphZoneDefinitions[zoneId].label,
    nodeTypes: graphZoneNodeTypes[zoneId],
  };
}
