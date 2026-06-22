import type { TenantNode, TenantNodeType } from '../models/tenantGraph';
import { metadataText } from './graphUtils';
import { policyNodeTypes } from './typePresentation';

export type ReadableBadge = {
  label: string;
  tone: 'info' | 'success' | 'warning';
};

export type ReadableGlossaryItem = {
  term: string;
  definition: string;
};

type NodeSummaryContext = {
  compliance?: string;
  objectType: string;
  platform?: string;
};

type BadgeContext = NodeSummaryContext & {
  edgeCount: number;
  node: TenantNode;
};

type ReadableNodeTypeConfig = {
  badges?: (context: BadgeContext) => ReadableBadge[];
  glossary: string[];
  nextStep: string;
  objectType: string;
  pathTargets: readonly TenantNodeType[];
  summary: (context: NodeSummaryContext) => string;
};

const glossaryDefinitions: Record<string, string> = {
  Assignment: 'A rule that sends an app or policy to users, devices, or groups.',
  'Assignment filter': 'A rule that narrows an assignment to devices that match specific properties.',
  'Cloud app': 'An Entra sign-in resource such as Azure Portal, SharePoint, or another cloud service.',
  'Compliance policy': 'A policy that decides whether a device meets the organization rules.',
  'Detected app': 'An app found on a managed device during inventory.',
  'Directory role': 'An Entra admin role that grants elevated permissions to assigned users.',
  Group: 'A collection of users or devices often used as the target for apps and policies.',
  'Primary user': 'The person Intune associates most closely with a managed device.',
  'Scope tag': 'An admin boundary that controls who can see or manage an Intune object.',
  'Settings catalog policy': 'A Windows settings policy built from Microsoft Intune settings catalog controls.',
};

const defaultPathTargets = ['user', 'device', 'group', 'directoryRole', 'app', 'cloudApp', 'appAssignment', ...policyNodeTypes] as const satisfies readonly TenantNodeType[];

const readableNodeConfigs: Partial<Record<TenantNodeType, ReadableNodeTypeConfig>> = {
  app: {
    objectType: 'managed app',
    glossary: ['Assignment', 'Group'],
    pathTargets: ['user', 'device', 'group'],
    nextStep: 'Open the connected assignment or target to trace the impact path.',
    summary: ({ objectType }) =>
      `This is a ${objectType}. It can be assigned as required, available, or uninstall to people or devices.`,
    badges: ({ node }) => (metadataText(node, 'assigned') === 'true' ? [{ label: 'Has assignments', tone: 'info' }] : []),
  },
  appAssignment: {
    objectType: 'app assignment',
    glossary: ['Assignment', 'Group', 'Assignment filter'],
    pathTargets: ['user', 'device', 'group'],
    nextStep: 'Open the target to see the people or devices that can receive this app.',
    summary: ({ objectType }) =>
      `This is a ${objectType}. It explains how an app is delivered and which target receives it.`,
    badges: ({ node }) => [assignmentBadge(metadataText(node, 'intent') ?? node.label)],
  },
  cloudApp: {
    objectType: 'cloud app resource',
    glossary: ['Cloud app'],
    pathTargets: ['user', 'networkLocation', 'signInEvent', 'conditionalAccessPolicy'],
    nextStep: 'Open a related sign-in event to see whether Conditional Access allowed, blocked, or evaluated access.',
    summary: ({ objectType }) =>
      `This is a ${objectType}. It appears in Entra sign-in logs as the service or resource the user tried to access.`,
  },
  assignmentFilter: {
    objectType: 'assignment filter',
    glossary: ['Assignment filter', 'Assignment'],
    pathTargets: defaultPathTargets,
    nextStep: 'Open the connected assignment to see where this filter is used.',
    summary: ({ objectType }) => `This is an ${objectType}. It narrows an assignment so only matching devices receive it.`,
    badges: () => [{ label: 'Narrows assignment', tone: 'info' }],
  },
  compliancePolicy: {
    objectType: 'compliance policy',
    glossary: ['Compliance policy', 'Assignment', 'Group'],
    pathTargets: ['user', 'device', 'group'],
    nextStep: 'Open the connected assignment or target to trace the impact path.',
    summary: ({ objectType }) => `This is a ${objectType}. It decides whether affected devices meet the organization rules.`,
  },
  device: {
    objectType: 'managed device',
    glossary: ['Primary user', 'Detected app'],
    pathTargets: ['app', 'cloudApp', 'appAssignment', 'directoryRole', ...policyNodeTypes],
    nextStep: 'Open the primary user or detected apps to understand this device context.',
    summary: ({ compliance, objectType, platform }) =>
      `This is a ${platform ? `${platform} ` : ''}${objectType}${compliance ? ` with ${compliance} compliance` : ''}. It connects a person to apps and policies found in Intune.`,
    badges: ({ compliance }) => (compliance ? [complianceBadge(compliance)] : []),
  },
  deviceConfigurationProfile: {
    objectType: 'device configuration profile',
    glossary: ['Assignment', 'Group'],
    pathTargets: ['user', 'device', 'group'],
    nextStep: 'Open the connected assignment or target to trace the impact path.',
    summary: ({ objectType, platform }) =>
      `This is a ${platform ? `${platform} ` : ''}${objectType}. It changes device settings for assigned targets.`,
  },
  directoryRole: {
    objectType: 'directory role',
    glossary: ['Directory role'],
    pathTargets: ['user', 'group'],
    nextStep: 'Open connected people to see who receives this role.',
    summary: ({ objectType }) => `This is a ${objectType}. It grants elevated Entra permissions to assigned people.`,
  },
  enrollmentProfile: {
    objectType: 'enrollment profile',
    glossary: ['Assignment', 'Group'],
    pathTargets: ['user', 'device', 'group'],
    nextStep: 'Open the connected assignment or target to trace the impact path.',
    summary: ({ objectType }) => `This is an ${objectType}. It controls how new devices are prepared during enrollment.`,
  },
  group: {
    objectType: 'targeting group',
    glossary: ['Group', 'Assignment'],
    pathTargets: ['app', 'cloudApp', 'appAssignment', 'directoryRole', 'user', 'device', ...policyNodeTypes],
    nextStep: 'Open connected assignments to see what this group receives.',
    summary: ({ objectType }) => `This is a ${objectType}. Apps and policies often reach people or devices through groups.`,
  },
  scopeTag: {
    objectType: 'scope tag',
    glossary: ['Scope tag'],
    pathTargets: defaultPathTargets,
    nextStep: 'Open the connected assignment or target to trace the impact path.',
    summary: ({ objectType }) =>
      `This is a ${objectType}. It affects which admins can see or manage connected Intune objects.`,
    badges: () => [{ label: 'Admin visibility', tone: 'info' }],
  },
  settingsCatalogPolicy: {
    objectType: 'settings catalog policy',
    glossary: ['Settings catalog policy', 'Assignment', 'Group'],
    pathTargets: ['user', 'device', 'group'],
    nextStep: 'Open the connected assignment or target to trace the impact path.',
    summary: ({ objectType, platform }) =>
      `This is a ${platform ? `${platform} ` : ''}${objectType}. It changes device settings for assigned targets.`,
  },
  user: {
    objectType: 'person account',
    glossary: ['Primary user', 'Group'],
    pathTargets: ['app', 'cloudApp', 'appAssignment', 'directoryRole', ...policyNodeTypes],
    nextStep: 'Open groups and devices to trace why this person receives apps or policies.',
    summary: ({ objectType }) =>
      `This is a ${objectType}. Follow groups and devices to understand why apps or policies may affect this person.`,
  },
};

export function readableConfig(type: TenantNodeType): ReadableNodeTypeConfig {
  return (
    readableNodeConfigs[type] ?? {
      objectType: type,
      glossary: [],
      pathTargets: defaultPathTargets,
      nextStep: 'Open the connected assignment or target to trace the impact path.',
      summary: ({ objectType }) => `This is a ${objectType}. Its relationships explain how it fits into the tenant.`,
    }
  );
}

export function glossaryForConfig(config: ReadableNodeTypeConfig): ReadableGlossaryItem[] {
  return config.glossary
    .map((term) => ({ term, definition: glossaryDefinitions[term] }))
    .filter((item): item is ReadableGlossaryItem => Boolean(item.definition));
}

function assignmentBadge(intent: string): ReadableBadge {
  const normalized = intent.toLowerCase();

  if (normalized.includes('required')) {
    return { label: 'Required delivery', tone: 'warning' };
  }
  if (normalized.includes('uninstall')) {
    return { label: 'Uninstall delivery', tone: 'warning' };
  }
  if (normalized.includes('available')) {
    return { label: 'Available install', tone: 'info' };
  }

  return { label: 'Assignment rule', tone: 'info' };
}

function complianceBadge(compliance: string): ReadableBadge {
  const normalized = compliance.toLowerCase();

  return {
    label: normalized.includes('compliant') && !normalized.includes('noncompliant') ? 'Compliant' : 'Needs review',
    tone: normalized.includes('noncompliant') ? 'warning' : 'success',
  };
}
