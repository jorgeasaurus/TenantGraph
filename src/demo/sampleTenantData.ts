import type { GraphObject } from '../graph/adapters';
import type { GraphSignIn } from '../graph/signInLogAdapter';
import { sampleAppIconSources, sampleAppIcons, type SampleAppIconKey } from './sampleAppIcons';

export const sampleCurrentUserId = 'user-adele';

export const sampleUsers: GraphObject[] = [
  user('user-adele', 'Adele Vance', 'adele@contoso.example', 'Endpoint Engineering Lead', 'IT'),
  user('user-miguel', 'Miguel Silva', 'miguel@contoso.example', 'Finance Manager', 'Finance'),
  user('user-priya', 'Priya Shah', 'priya@contoso.example', 'Field Operations', 'Operations'),
  user('user-kai', 'Kai Jordan', 'kai@contoso.example', 'Helpdesk Analyst', 'IT'),
  user('user-breakglass', 'Break Glass Emergency Access', 'breakglass@contoso.example', 'Emergency access', 'Identity'),
];

export const sampleGroups: GraphObject[] = [
  group('group-intune-admins', 'Intune Administrators', 'intune-admins', true),
  group('group-all-windows', 'All Windows 365 devices', 'all-windows-365', true),
  group('group-ios-pilot', 'iOS pilot users', 'ios-pilot', true),
  group('group-finance', 'Finance application users', 'finance-apps', true),
  group('group-frontline', 'Frontline shared device users', 'frontline-shared', true),
];

export const sampleDirectoryRoles: GraphObject[] = [
  directoryRole('role-intune-admin', 'Intune Administrator', 'Manages Intune workloads.', 'template-intune-admin'),
  directoryRole('role-security-reader', 'Security Reader', 'Reads security and Conditional Access reports.', 'template-security-reader'),
];

export const sampleManagedDevices: GraphObject[] = [
  device('device-w365-adele', 'W365-ADELE-01', 'adele@contoso.example', 'user-adele', 'Windows', 'compliant', 'Microsoft', 'Cloud PC Enterprise', 'aad-w365-adele'),
  device('device-surface-miguel', 'SURFACE-MIGUEL', 'miguel@contoso.example', 'user-miguel', 'Windows', 'noncompliant', 'Microsoft', 'Surface Laptop 6', 'aad-surface-miguel'),
  device('device-iphone-priya', 'PRIYA-iPhone', 'priya@contoso.example', 'user-priya', 'iOS', 'compliant', 'Apple', 'iPhone 15', 'aad-iphone-priya'),
  device('device-ipad-frontline', 'FRONTLINE-iPad-04', 'priya@contoso.example', 'user-priya', 'iPadOS', 'compliant', 'Apple', 'iPad 10', 'aad-ipad-frontline'),
  device('device-kiosk', 'KIOSK-LOBBY-02', '', '00000000-0000-0000-0000-000000000000', 'Windows', 'unknown', 'Dell', 'OptiPlex', 'aad-kiosk-lobby'),
];

export const sampleMobileApps: GraphObject[] = [
  app('app-company-portal', 'Intune Company Portal', 'Microsoft Corporation', true, 'companyPortal'),
  app('app-edge', 'Microsoft Edge', 'Microsoft Corporation', true, 'edge'),
  app('app-defender', 'Microsoft Defender', 'Microsoft Corporation', true, 'defender'),
  app('app-windows-app-mobile', 'Windows App Mobile', 'Microsoft Corporation', true, 'windowsAppMobile'),
  app('app-sap-concur', 'SAP Concur', 'Concur', true, 'sapConcur'),
  app('app-outlook-ios', 'Microsoft Outlook', 'Microsoft Corporation', true, 'outlook'),
];

export const sampleCompliancePolicies: GraphObject[] = [
  policy('policy-win-compliance', 'Windows compliance baseline', 'Requires BitLocker, Defender, and a healthy device.', 'windows10', ['scope-executive']),
  policy('policy-ios-compliance', 'iOS compliance baseline', 'Requires passcode and current OS for mobile access.', 'iOS', ['scope-frontline']),
];

export const sampleDeviceConfigurations: GraphObject[] = [
  policy('config-firewall', 'Defender Firewall baseline', 'Keeps firewall enabled across corporate Windows devices.', 'windows10', ['scope-executive']),
  policy('config-ios-wifi', 'Field Wi-Fi profile', 'Deploys Wi-Fi settings for field iOS devices.', 'iOS', ['scope-frontline']),
];

export const sampleSettingsCatalogPolicies: GraphObject[] = [
  {
    ...policy('settings-oib', 'Win365 Device Security - Connectivity Settings', 'Settings catalog baseline imported from Intune Hydration Kit.', 'windows10', ['scope-executive']),
    technologies: 'mdm',
  },
  {
    ...policy('settings-edge-security', 'Edge security recommendations', 'Hardens browser sign-in and extension controls.', 'windows10', ['scope-executive']),
    technologies: 'mdm',
  },
];

export const sampleEnrollmentProfiles: GraphObject[] = [
  policy('enroll-autopilot-standard', 'Autopilot standard user-driven', 'Standard Autopilot enrollment for corporate Windows devices.', 'windows10', ['scope-executive']),
];

export const sampleAssignmentFilters: GraphObject[] = [
  {
    id: 'filter-windows-corporate',
    displayName: 'Windows corporate devices',
    platform: 'windows10AndLater',
    rule: '(device.deviceOwnership -eq "Corporate") and (device.operatingSystem -contains "Windows")',
  },
  {
    id: 'filter-ios-byod',
    displayName: 'iOS BYOD devices',
    platform: 'iOS',
    rule: '(device.deviceOwnership -eq "Personal") and (device.operatingSystem -contains "iOS")',
  },
];

export const sampleScopeTags: GraphObject[] = [
  { id: 'scope-executive', displayName: 'Executive devices', description: 'Tier 0 and executive endpoint scope.' },
  { id: 'scope-frontline', displayName: 'Frontline operations', description: 'Shared and field device administration.' },
];

export const sampleDetectedAppsByDeviceId: Record<string, GraphObject[]> = {
  'device-w365-adele': [
    detectedApp('detected-teams', 'Microsoft Teams', 'Microsoft', '24215.1007'),
    detectedApp('detected-vscode', 'Visual Studio Code', 'Microsoft', '1.101.0'),
  ],
  'device-surface-miguel': [
    detectedApp('detected-sap-concur', 'SAP Concur', 'Concur', '10.31.0'),
    detectedApp('detected-edge', 'Microsoft Edge', 'Microsoft Corporation', '126.0'),
  ],
  'device-iphone-priya': [
    detectedApp('detected-outlook-ios', 'Microsoft Outlook', 'Microsoft Corporation', '4.2420'),
  ],
};

export const sampleMembersByGroupId: Record<string, GraphObject[]> = {
  'group-intune-admins': [directoryObject(sampleUsers[0], 'user'), directoryObject(sampleUsers[3], 'user')],
  'group-all-windows': [directoryObject(sampleUsers[0], 'user'), directoryObject(sampleUsers[1], 'user')],
  'group-ios-pilot': [directoryObject(sampleUsers[2], 'user')],
  'group-finance': [directoryObject(sampleUsers[1], 'user')],
  'group-frontline': [directoryObject(sampleUsers[2], 'user'), directoryObject(sampleUsers[3], 'user')],
};

export const sampleMembershipsByUserId: Record<string, GraphObject[]> = {
  'user-adele': [
    directoryObject(sampleGroups[0], 'group'),
    directoryObject(sampleGroups[1], 'group'),
    directoryObject(sampleDirectoryRoles[0], 'directoryRole'),
    directoryObject(sampleDirectoryRoles[1], 'directoryRole'),
  ],
  'user-miguel': [directoryObject(sampleGroups[1], 'group'), directoryObject(sampleGroups[3], 'group')],
  'user-priya': [directoryObject(sampleGroups[2], 'group'), directoryObject(sampleGroups[4], 'group')],
  'user-kai': [directoryObject(sampleGroups[0], 'group'), directoryObject(sampleGroups[4], 'group')],
  'user-breakglass': [directoryObject(sampleDirectoryRoles[1], 'directoryRole')],
};

export const sampleMembersByDirectoryRoleId: Record<string, GraphObject[]> = {
  'role-intune-admin': [directoryObject(sampleUsers[0], 'user'), directoryObject(sampleUsers[3], 'user')],
  'role-security-reader': [directoryObject(sampleUsers[0], 'user'), directoryObject(sampleUsers[4], 'user')],
};

export const sampleAssignmentsByOwnerId: Record<string, GraphObject[]> = {
  'app-company-portal': [
    assignment('assign-company-all-devices', 'required', allDevicesTarget()),
  ],
  'app-edge': [
    assignment('assign-edge-windows', 'required', groupTarget('group-all-windows', 'filter-windows-corporate', 'include')),
  ],
  'app-defender': [
    assignment('assign-defender-frontline', 'required', groupTarget('group-frontline')),
  ],
  'app-windows-app-mobile': [
    assignment('assign-windows-app-mobile', 'available', groupTarget('group-all-windows', 'filter-windows-corporate', 'include')),
  ],
  'app-sap-concur': [
    assignment('assign-sap-concur', 'required', groupTarget('group-finance')),
  ],
  'app-outlook-ios': [
    assignment('assign-outlook-ios', 'required', groupTarget('group-ios-pilot', 'filter-ios-byod', 'include')),
  ],
  'policy-win-compliance': [
    assignment('assign-win-compliance', 'required', groupTarget('group-all-windows', 'filter-windows-corporate', 'include')),
  ],
  'policy-ios-compliance': [
    assignment('assign-ios-compliance', 'required', groupTarget('group-ios-pilot', 'filter-ios-byod', 'include')),
  ],
  'config-firewall': [
    assignment('assign-firewall', 'required', allDevicesTarget()),
  ],
  'config-ios-wifi': [
    assignment('assign-ios-wifi', 'required', groupTarget('group-frontline')),
  ],
  'settings-oib': [
    assignment('assign-settings-oib', 'required', groupTarget('group-all-windows', 'filter-windows-corporate', 'include')),
  ],
  'settings-edge-security': [
    assignment('assign-edge-security', 'required', groupTarget('group-all-windows')),
  ],
  'enroll-autopilot-standard': [
    assignment('assign-autopilot-standard', 'required', groupTarget('group-all-windows')),
  ],
};

export const sampleSignIns: GraphSignIn[] = [
  signIn('signin-adele-portal-success', '2026-06-23T14:21:00Z', sampleUsers[0], 'Azure Portal', 'Microsoft Azure Management', '00000002-0000-0000-c000-000000000000', 'success', 0, [
    caPolicy('ca-require-mfa-admins', 'Require MFA for admins', 'success', ['mfa'], []),
    caPolicy('ca-block-legacy', 'Block legacy authentication', 'notApplied', [], []),
  ], sampleManagedDevices[0], 'Seattle', 'WA', 'US', '198.51.100.18'),
  signIn('signin-adele-portal-blocked', '2026-06-23T13:52:00Z', sampleUsers[0], 'Azure Portal', 'Microsoft Azure Management', '00000002-0000-0000-c000-000000000000', 'failure', 53003, [
    caPolicy('ca-block-external-admin', 'Block admin access outside trusted locations', 'failure', ['block'], []),
    caPolicy('ca-require-compliant-device', 'Require compliant device for admin portals', 'notApplied', [], []),
  ], sampleManagedDevices[0], 'Portland', 'OR', 'US', '203.0.113.91'),
  signIn('signin-miguel-concur-blocked', '2026-06-23T12:08:00Z', sampleUsers[1], 'SAP Concur', 'SAP Concur', 'app-sap-concur-resource', 'failure', 53003, [
    caPolicy('ca-require-compliant-device', 'Require compliant device for finance apps', 'failure', ['compliantDevice'], []),
  ], sampleManagedDevices[1], 'Chicago', 'IL', 'US', '198.51.100.44'),
  signIn('signin-priya-outlook-report', '2026-06-22T19:34:00Z', sampleUsers[2], 'Microsoft Outlook', 'Microsoft 365 Exchange Online', '00000002-0000-0ff1-ce00-000000000000', 'reportOnlySuccess', 0, [
    caPolicy('ca-report-ios-risk', 'Report-only iOS risk policy', 'reportOnlySuccess', ['mfa'], ['signInFrequency']),
  ], sampleManagedDevices[2], 'Austin', 'TX', 'US', '198.51.100.72'),
  signIn('signin-breakglass-notapplied', '2026-06-22T08:10:00Z', sampleUsers[4], 'Azure Portal', 'Microsoft Azure Management', '00000002-0000-0000-c000-000000000000', 'notApplied', 0, [
    caPolicy('ca-breakglass-exclusion-review', 'Break glass exclusion review', 'notApplied', [], []),
  ], undefined, 'Redmond', 'WA', 'US', '203.0.113.7'),
];

export function sampleUserPhotoDataUrl(userId: string): string {
  const user = sampleUsers.find((candidate) => candidate.id === userId);
  const name = String(user?.displayName ?? 'Sample User');
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const hue = Math.abs([...userId].reduce((total, char) => total + char.charCodeAt(0), 0)) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="24" fill="hsl(${hue} 75% 28%)"/><text x="48" y="58" text-anchor="middle" font-size="34" font-family="Segoe UI,Arial" font-weight="700" fill="white">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function user(id: string, displayName: string, upn: string, jobTitle: string, department: string): GraphObject {
  return { id, displayName, userPrincipalName: upn, mail: upn, jobTitle, department };
}

function group(id: string, displayName: string, mailNickname: string, securityEnabled: boolean): GraphObject {
  return { id, displayName, mailNickname, securityEnabled, groupTypes: [] };
}

function directoryRole(id: string, displayName: string, description: string, roleTemplateId: string): GraphObject {
  return { id, displayName, description, roleTemplateId };
}

function device(
  id: string,
  deviceName: string,
  userPrincipalName: string,
  userId: string,
  operatingSystem: string,
  complianceState: string,
  manufacturer: string,
  model: string,
  azureADDeviceId: string,
): GraphObject {
  return {
    id,
    azureADDeviceId,
    complianceState,
    deviceName,
    managementAgent: 'mdm',
    manufacturer,
    model,
    operatingSystem,
    userId,
    userPrincipalName,
  };
}

function app(id: string, displayName: string, publisher: string, isAssigned: boolean, iconKey: SampleAppIconKey): GraphObject {
  const iconSource = sampleAppIconSources[iconKey];

  return {
    id,
    appAvailability: 'global',
    displayName,
    informationUrl: iconSource.sourceUrl,
    isAssigned,
    largeIcon: sampleAppIcons[iconKey],
    publisher,
  };
}

function policy(id: string, displayName: string, description: string, platform: string, roleScopeTagIds: string[]): GraphObject {
  return {
    id,
    createdDateTime: '2026-05-26T11:37:00Z',
    description,
    displayName,
    lastModifiedDateTime: '2026-06-18T17:42:00Z',
    platform,
    platforms: platform,
    roleScopeTagIds,
  };
}

function detectedApp(id: string, displayName: string, publisher: string, version: string): GraphObject {
  return { id, displayName, publisher, version };
}

function directoryObject(object: GraphObject, type: 'directoryRole' | 'group' | 'user'): GraphObject {
  return {
    ...object,
    '@odata.type': `#microsoft.graph.${type}`,
  };
}

function assignment(id: string, intent: string, target: GraphObject): GraphObject {
  return { id, intent, source: 'direct', target };
}

function allDevicesTarget(): GraphObject {
  return { '@odata.type': '#microsoft.graph.allDevicesAssignmentTarget' };
}

function groupTarget(groupId: string, filterId?: string, filterType?: string): GraphObject {
  return {
    '@odata.type': '#microsoft.graph.groupAssignmentTarget',
    deviceAndAppManagementAssignmentFilterId: filterId,
    deviceAndAppManagementAssignmentFilterType: filterType,
    groupId,
  };
}

function caPolicy(
  id: string,
  displayName: string,
  result: string,
  enforcedGrantControls: string[],
  enforcedSessionControls: string[],
): GraphObject {
  return { id, displayName, enforcedGrantControls, enforcedSessionControls, result };
}

function signIn(
  id: string,
  createdDateTime: string,
  userObject: GraphObject,
  appDisplayName: string,
  resourceDisplayName: string,
  resourceId: string,
  conditionalAccessStatus: string,
  errorCode: number,
  appliedConditionalAccessPolicies: GraphObject[],
  deviceObject: GraphObject | undefined,
  city: string,
  state: string,
  countryOrRegion: string,
  ipAddress: string,
): GraphSignIn {
  return {
    id,
    appDisplayName,
    appId: resourceId,
    appliedConditionalAccessPolicies,
    clientAppUsed: 'Browser',
    conditionalAccessStatus,
    correlationId: `${id}-correlation`,
    createdDateTime,
    deviceDetail: deviceObject
      ? {
          browser: 'Edge',
          deviceId: deviceObject.azureADDeviceId,
          displayName: deviceObject.deviceName,
          isCompliant: deviceObject.complianceState === 'compliant',
          isManaged: true,
          operatingSystem: deviceObject.operatingSystem,
          trustType: 'Azure AD joined',
        }
      : undefined,
    ipAddress,
    isInteractive: true,
    location: { city, countryOrRegion, state },
    resourceDisplayName,
    resourceId,
    riskDetail: 'none',
    riskEventTypes_v2: [],
    riskLevelAggregated: 'none',
    riskLevelDuringSignIn: 'none',
    riskState: 'none',
    status: {
      additionalDetails: errorCode === 0 ? 'MFA satisfied' : 'Access blocked by Conditional Access',
      errorCode,
      failureReason: errorCode === 0 ? undefined : 'Access has been blocked due to Conditional Access policies.',
    },
    userDisplayName: userObject.displayName,
    userId: userObject.id,
    userPrincipalName: userObject.userPrincipalName,
  };
}
