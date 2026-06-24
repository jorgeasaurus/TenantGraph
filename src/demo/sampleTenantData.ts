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
  user('user-nora', 'Nora Kim', 'nora@contoso.example', 'Security Operations Lead', 'Security'),
  user('user-ethan', 'Ethan Brooks', 'ethan@contoso.example', 'Sales Director', 'Sales'),
  user('user-sofia', 'Sofia Martinez', 'sofia@contoso.example', 'HR Generalist', 'People'),
  user('user-jamal', 'Jamal Reed', 'jamal@contoso.example', 'Field Technician', 'Operations'),
  user('user-lena', 'Lena Fischer', 'lena@contoso.example', 'Marketing Manager', 'Marketing'),
  user('user-omar', 'Omar Hassan', 'omar@contoso.example', 'External Consultant', 'Contractors'),
  user('user-grace', 'Grace Lee', 'grace@contoso.example', 'Cloud Engineer', 'IT'),
  user('user-marcus', 'Marcus Chen', 'marcus@contoso.example', 'Executive Assistant', 'Executive Office'),
  user('user-olivia', 'Olivia Brown', 'olivia@contoso.example', 'Legal Counsel', 'Legal'),
  user('user-daniel', 'Daniel Park', 'daniel@contoso.example', 'Data Analyst', 'Finance'),
  user('user-hana', 'Hana Ito', 'hana@contoso.example', 'Product Designer', 'Product'),
  user('user-irina', 'Irina Petrova', 'irina@contoso.example', 'Procurement Specialist', 'Procurement'),
  user('user-theo', 'Theo Wilson', 'theo@contoso.example', 'Support Manager', 'Customer Success'),
  user('user-mei', 'Mei Tan', 'mei@contoso.example', 'Research Scientist', 'Research'),
];

export const sampleGroups: GraphObject[] = [
  group('group-intune-admins', 'Intune Administrators', 'intune-admins', true),
  group('group-all-windows', 'All Windows 365 devices', 'all-windows-365', true),
  group('group-ios-pilot', 'iOS pilot users', 'ios-pilot', true),
  group('group-finance', 'Finance application users', 'finance-apps', true),
  group('group-frontline', 'Frontline shared device users', 'frontline-shared', true),
  group('group-executives', 'Executive staff', 'executive-staff', true),
  group('group-engineering-workstations', 'Engineering workstations', 'engineering-workstations', true),
  group('group-marketing-apps', 'Marketing app users', 'marketing-apps', true),
  group('group-sales-mobile', 'Sales mobile users', 'sales-mobile', true),
  group('group-security-ops', 'Security operations', 'security-ops', true),
  group('group-contractors', 'Contractor limited access', 'contractors', true),
  group('group-macos-pilot', 'macOS pilot users', 'macos-pilot', true),
  group('group-android-pilot', 'Android pilot users', 'android-pilot', true),
  group('group-procurement-apps', 'Procurement app users', 'procurement-apps', true),
  group('group-research-devices', 'Research lab devices', 'research-devices', true),
];

export const sampleDirectoryRoles: GraphObject[] = [
  directoryRole('role-intune-admin', 'Intune Administrator', 'Manages Intune workloads.', 'template-intune-admin'),
  directoryRole('role-security-reader', 'Security Reader', 'Reads security and Conditional Access reports.', 'template-security-reader'),
  directoryRole('role-global-reader', 'Global Reader', 'Reads tenant-wide directory configuration.', 'template-global-reader'),
  directoryRole('role-ca-admin', 'Conditional Access Administrator', 'Manages Conditional Access policy configuration.', 'template-ca-admin'),
];

export const sampleManagedDevices: GraphObject[] = [
  device('device-w365-adele', 'W365-ADELE-01', 'adele@contoso.example', 'user-adele', 'Windows', 'compliant', 'Microsoft', 'Cloud PC Enterprise', 'aad-w365-adele'),
  device('device-surface-miguel', 'SURFACE-MIGUEL', 'miguel@contoso.example', 'user-miguel', 'Windows', 'noncompliant', 'Microsoft', 'Surface Laptop 6', 'aad-surface-miguel'),
  device('device-iphone-priya', 'PRIYA-iPhone', 'priya@contoso.example', 'user-priya', 'iOS', 'compliant', 'Apple', 'iPhone 15', 'aad-iphone-priya'),
  device('device-ipad-frontline', 'FRONTLINE-iPad-04', 'priya@contoso.example', 'user-priya', 'iPadOS', 'compliant', 'Apple', 'iPad 10', 'aad-ipad-frontline'),
  device('device-kiosk', 'KIOSK-LOBBY-02', '', '00000000-0000-0000-0000-000000000000', 'Windows', 'unknown', 'Dell', 'OptiPlex', 'aad-kiosk-lobby'),
  device('device-w365-grace', 'W365-GRACE-02', 'grace@contoso.example', 'user-grace', 'Windows', 'compliant', 'Microsoft', 'Cloud PC Enterprise', 'aad-w365-grace'),
  device('device-surface-nora', 'SURFACE-NORA', 'nora@contoso.example', 'user-nora', 'Windows', 'compliant', 'Microsoft', 'Surface Laptop Studio 2', 'aad-surface-nora'),
  device('device-mac-lena', 'MAC-LENA-01', 'lena@contoso.example', 'user-lena', 'macOS', 'compliant', 'Apple', 'MacBook Air', 'aad-mac-lena'),
  device('device-iphone-ethan', 'ETHAN-iPhone', 'ethan@contoso.example', 'user-ethan', 'iOS', 'compliant', 'Apple', 'iPhone 15 Pro', 'aad-iphone-ethan'),
  device('device-android-jamal', 'JAMAL-Android', 'jamal@contoso.example', 'user-jamal', 'Android', 'noncompliant', 'Samsung', 'Galaxy S24', 'aad-android-jamal'),
  device('device-thinkpad-daniel', 'THINKPAD-DANIEL', 'daniel@contoso.example', 'user-daniel', 'Windows', 'compliant', 'Lenovo', 'ThinkPad X1 Carbon', 'aad-thinkpad-daniel'),
  device('device-ipad-sales', 'SALES-iPad-07', 'marcus@contoso.example', 'user-marcus', 'iPadOS', 'compliant', 'Apple', 'iPad Air', 'aad-ipad-sales'),
  device('device-mac-omar', 'MAC-OMAR-BYOD', 'omar@contoso.example', 'user-omar', 'macOS', 'unknown', 'Apple', 'MacBook Pro', 'aad-mac-omar'),
  device('device-surface-sofia', 'SURFACE-SOFIA', 'sofia@contoso.example', 'user-sofia', 'Windows', 'compliant', 'Microsoft', 'Surface Pro 10', 'aad-surface-sofia'),
  device('device-w365-hana', 'W365-HANA-03', 'hana@contoso.example', 'user-hana', 'Windows', 'compliant', 'Microsoft', 'Cloud PC Enterprise', 'aad-w365-hana'),
  device('device-win-kai', 'WIN11-KAI-HELPDESK', 'kai@contoso.example', 'user-kai', 'Windows', 'compliant', 'HP', 'EliteBook 840', 'aad-win-kai'),
  device('device-surface-irina', 'SURFACE-IRINA', 'irina@contoso.example', 'user-irina', 'Windows', 'compliant', 'Microsoft', 'Surface Laptop 6', 'aad-surface-irina'),
  device('device-android-theo', 'THEO-Android', 'theo@contoso.example', 'user-theo', 'Android', 'compliant', 'Google', 'Pixel 9', 'aad-android-theo'),
  device('device-mac-mei', 'MAC-MEI-LAB', 'mei@contoso.example', 'user-mei', 'macOS', 'compliant', 'Apple', 'Mac Studio', 'aad-mac-mei'),
];

export const sampleMobileApps: GraphObject[] = [
  app('app-company-portal', 'Intune Company Portal', 'Microsoft Corporation', true, 'companyPortal'),
  app('app-edge', 'Microsoft Edge', 'Microsoft Corporation', true, 'edge'),
  app('app-defender', 'Microsoft Defender', 'Microsoft Corporation', true, 'defender'),
  app('app-windows-app-mobile', 'Windows App Mobile', 'Microsoft Corporation', true, 'windowsAppMobile'),
  app('app-sap-concur', 'SAP Concur', 'Concur', true, 'sapConcur'),
  app('app-outlook-ios', 'Microsoft Outlook', 'Microsoft Corporation', true, 'outlook'),
  app('app-teams', 'Microsoft Teams', 'Microsoft Corporation', true, 'teams'),
  app('app-onedrive', 'Microsoft OneDrive', 'Microsoft Corporation', true, 'onedrive'),
  app('app-zoom', 'Zoom Workplace', 'Zoom Video Communications', true, 'zoom'),
  app('app-adobe-acrobat', 'Adobe Acrobat Reader', 'Adobe', true, 'adobeAcrobat'),
  app('app-servicenow-agent', 'ServiceNow Agent', 'ServiceNow', true, 'serviceNow'),
  app('app-salesforce', 'Salesforce', 'Salesforce', true, 'salesforce'),
  app('app-slack', 'Slack', 'Slack Technologies', true, 'slack'),
  app('app-power-bi', 'Microsoft Power BI', 'Microsoft Corporation', true, 'powerBi'),
  app('app-planner', 'Microsoft Planner', 'Microsoft Corporation', true, 'planner'),
  app('app-loop', 'Microsoft Loop', 'Microsoft Corporation', true, 'loop'),
];

export const sampleCompliancePolicies: GraphObject[] = [
  policy('policy-win-compliance', 'Windows compliance baseline', 'Requires BitLocker, Defender, and a healthy device.', 'windows10', ['scope-executive']),
  policy('policy-ios-compliance', 'iOS compliance baseline', 'Requires passcode and current OS for mobile access.', 'iOS', ['scope-frontline']),
  policy('policy-macos-compliance', 'macOS compliance baseline', 'Requires FileVault, firewall, and current macOS security updates.', 'macOS', ['scope-corporate-it']),
  policy('policy-android-compliance', 'Android work profile compliance', 'Requires work profile, encryption, and Play Protect.', 'android', ['scope-frontline']),
  policy('policy-admin-compliance', 'Privileged admin device compliance', 'Requires compliant dedicated admin devices for admin portals.', 'windows10', ['scope-executive', 'scope-corporate-it']),
];

export const sampleDeviceConfigurations: GraphObject[] = [
  policy('config-firewall', 'Defender Firewall baseline', 'Keeps firewall enabled across corporate Windows devices.', 'windows10', ['scope-executive']),
  policy('config-ios-wifi', 'Field Wi-Fi profile', 'Deploys Wi-Fi settings for field iOS devices.', 'iOS', ['scope-frontline']),
  policy('config-macos-filevault', 'macOS FileVault profile', 'Enforces FileVault recovery key escrow for macOS pilot devices.', 'macOS', ['scope-corporate-it']),
  policy('config-android-work-profile', 'Android work profile restrictions', 'Separates corporate data and restricts copy/paste from work apps.', 'android', ['scope-frontline']),
  policy('config-always-on-vpn', 'Always On VPN profile', 'Deploys VPN settings for field and executive mobile devices.', 'windows10', ['scope-sales-operations']),
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
  {
    ...policy('settings-security-baseline', 'Windows security baseline', 'Applies Defender, credential protection, and local security authority hardening.', 'windows10', ['scope-corporate-it']),
    technologies: 'mdm',
  },
  {
    ...policy('settings-update-ring', 'Windows Update ring - Broad', 'Controls feature update deferral and active hours for standard Windows devices.', 'windows10', ['scope-corporate-it']),
    technologies: 'mdm',
  },
  {
    ...policy('settings-attack-surface', 'Attack surface reduction rules', 'Blocks Office child processes and common ransomware behaviors.', 'windows10', ['scope-corporate-it']),
    technologies: 'mdm',
  },
];

export const sampleEnrollmentProfiles: GraphObject[] = [
  policy('enroll-autopilot-standard', 'Autopilot standard user-driven', 'Standard Autopilot enrollment for corporate Windows devices.', 'windows10', ['scope-executive']),
  policy('enroll-apple-user-enrollment', 'Apple User Enrollment', 'User enrollment profile for personal iOS and iPadOS devices.', 'iOS', ['scope-frontline']),
  policy('enroll-android-fully-managed', 'Android Enterprise fully managed', 'Enrollment profile for corporate-owned Android field devices.', 'android', ['scope-frontline']),
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
  {
    id: 'filter-macos-corporate',
    displayName: 'macOS corporate devices',
    platform: 'macOS',
    rule: '(device.deviceOwnership -eq "Corporate") and (device.operatingSystem -contains "macOS")',
  },
  {
    id: 'filter-frontline-shared',
    displayName: 'Frontline shared devices',
    platform: 'windows10AndLater',
    rule: '(device.deviceCategory -eq "Frontline") or (device.deviceName -startsWith "KIOSK")',
  },
  {
    id: 'filter-executive-windows',
    displayName: 'Executive Windows devices',
    platform: 'windows10AndLater',
    rule: '(device.deviceOwnership -eq "Corporate") and (device.enrollmentProfileName -contains "Executive")',
  },
  {
    id: 'filter-contractor-byod',
    displayName: 'Contractor BYOD devices',
    platform: 'macOS',
    rule: '(device.deviceOwnership -eq "Personal") and (device.deviceCategory -eq "Contractor")',
  },
];

export const sampleScopeTags: GraphObject[] = [
  { id: 'scope-executive', displayName: 'Executive devices', description: 'Tier 0 and executive endpoint scope.' },
  { id: 'scope-frontline', displayName: 'Frontline operations', description: 'Shared and field device administration.' },
  { id: 'scope-corporate-it', displayName: 'Corporate IT', description: 'Core endpoint administration for managed corporate devices.' },
  { id: 'scope-finance-regulated', displayName: 'Finance regulated', description: 'Finance apps and regulated data access.' },
  { id: 'scope-sales-operations', displayName: 'Sales operations', description: 'Mobile sales and field productivity device scope.' },
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
  'device-w365-grace': [
    detectedApp('detected-teams-grace', 'Microsoft Teams', 'Microsoft', '24215.1007'),
    detectedApp('detected-powershell', 'PowerShell 7', 'Microsoft', '7.5.1'),
    detectedApp('detected-azure-cli', 'Azure CLI', 'Microsoft', '2.73.0'),
  ],
  'device-surface-nora': [
    detectedApp('detected-defender-nora', 'Microsoft Defender', 'Microsoft Corporation', '102.2505'),
    detectedApp('detected-kql', 'Kusto Explorer', 'Microsoft', '1.0.14'),
  ],
  'device-mac-lena': [
    detectedApp('detected-slack', 'Slack', 'Slack Technologies', '4.42.0'),
    detectedApp('detected-acrobat', 'Adobe Acrobat Reader', 'Adobe', '24.005'),
  ],
  'device-iphone-ethan': [
    detectedApp('detected-salesforce', 'Salesforce', 'Salesforce', '246.040'),
    detectedApp('detected-teams-ios', 'Microsoft Teams', 'Microsoft', '6.10'),
  ],
  'device-android-jamal': [
    detectedApp('detected-servicenow', 'ServiceNow Agent', 'ServiceNow', '18.2.0'),
  ],
  'device-thinkpad-daniel': [
    detectedApp('detected-powerbi', 'Microsoft Power BI', 'Microsoft Corporation', '2.137'),
    detectedApp('detected-onedrive', 'Microsoft OneDrive', 'Microsoft Corporation', '24.108'),
  ],
  'device-mac-omar': [
    detectedApp('detected-zoom', 'Zoom Workplace', 'Zoom Video Communications', '6.1.5'),
  ],
  'device-surface-irina': [
    detectedApp('detected-planner', 'Microsoft Planner', 'Microsoft Corporation', '1.0'),
    detectedApp('detected-acrobat-irina', 'Adobe Acrobat Reader', 'Adobe', '24.005'),
  ],
  'device-android-theo': [
    detectedApp('detected-teams-theo', 'Microsoft Teams', 'Microsoft', '6.10'),
    detectedApp('detected-servicenow-theo', 'ServiceNow Agent', 'ServiceNow', '18.2.0'),
  ],
  'device-mac-mei': [
    detectedApp('detected-loop-mei', 'Microsoft Loop', 'Microsoft Corporation', '1.0'),
    detectedApp('detected-slack-mei', 'Slack', 'Slack Technologies', '4.42.0'),
  ],
};

export const sampleMembersByGroupId: Record<string, GraphObject[]> = {
  'group-intune-admins': [directoryUser('user-adele'), directoryUser('user-kai'), directoryUser('user-grace')],
  'group-all-windows': [
    directoryUser('user-adele'),
    directoryUser('user-miguel'),
    directoryUser('user-nora'),
    directoryUser('user-grace'),
    directoryUser('user-sofia'),
    directoryUser('user-daniel'),
    directoryUser('user-hana'),
    directoryUser('user-kai'),
  ],
  'group-ios-pilot': [directoryUser('user-priya'), directoryUser('user-ethan'), directoryUser('user-marcus')],
  'group-finance': [directoryUser('user-miguel'), directoryUser('user-olivia'), directoryUser('user-daniel')],
  'group-frontline': [directoryUser('user-priya'), directoryUser('user-jamal'), directoryUser('user-kai')],
  'group-executives': [directoryUser('user-adele'), directoryUser('user-ethan'), directoryUser('user-marcus')],
  'group-engineering-workstations': [directoryUser('user-adele'), directoryUser('user-grace'), directoryUser('user-nora'), directoryUser('user-daniel'), directoryUser('user-hana')],
  'group-marketing-apps': [directoryUser('user-lena'), directoryUser('user-hana')],
  'group-sales-mobile': [directoryUser('user-ethan'), directoryUser('user-marcus')],
  'group-security-ops': [directoryUser('user-nora'), directoryUser('user-kai'), directoryUser('user-grace')],
  'group-contractors': [directoryUser('user-omar')],
  'group-macos-pilot': [directoryUser('user-lena'), directoryUser('user-omar'), directoryUser('user-hana')],
  'group-android-pilot': [directoryUser('user-jamal'), directoryUser('user-theo')],
  'group-procurement-apps': [directoryUser('user-irina'), directoryUser('user-olivia')],
  'group-research-devices': [directoryUser('user-mei'), directoryUser('user-hana')],
};

export const sampleMembershipsByUserId: Record<string, GraphObject[]> = {
  'user-adele': [
    directoryGroup('group-intune-admins'),
    directoryGroup('group-all-windows'),
    directoryGroup('group-executives'),
    directoryGroup('group-engineering-workstations'),
    directoryRoleRef('role-intune-admin'),
    directoryRoleRef('role-security-reader'),
    directoryRoleRef('role-ca-admin'),
  ],
  'user-miguel': [directoryGroup('group-all-windows'), directoryGroup('group-finance')],
  'user-priya': [directoryGroup('group-ios-pilot'), directoryGroup('group-frontline')],
  'user-kai': [directoryGroup('group-intune-admins'), directoryGroup('group-frontline'), directoryGroup('group-security-ops')],
  'user-breakglass': [directoryRoleRef('role-security-reader'), directoryRoleRef('role-global-reader')],
  'user-nora': [directoryGroup('group-all-windows'), directoryGroup('group-security-ops'), directoryGroup('group-engineering-workstations'), directoryRoleRef('role-security-reader'), directoryRoleRef('role-ca-admin')],
  'user-ethan': [directoryGroup('group-ios-pilot'), directoryGroup('group-executives'), directoryGroup('group-sales-mobile')],
  'user-sofia': [directoryGroup('group-all-windows')],
  'user-jamal': [directoryGroup('group-frontline'), directoryGroup('group-android-pilot')],
  'user-lena': [directoryGroup('group-marketing-apps'), directoryGroup('group-macos-pilot')],
  'user-omar': [directoryGroup('group-contractors'), directoryGroup('group-macos-pilot')],
  'user-grace': [directoryGroup('group-intune-admins'), directoryGroup('group-all-windows'), directoryGroup('group-security-ops'), directoryGroup('group-engineering-workstations'), directoryRoleRef('role-intune-admin')],
  'user-marcus': [directoryGroup('group-ios-pilot'), directoryGroup('group-executives'), directoryGroup('group-sales-mobile')],
  'user-olivia': [directoryGroup('group-finance'), directoryRoleRef('role-global-reader')],
  'user-daniel': [directoryGroup('group-all-windows'), directoryGroup('group-finance'), directoryGroup('group-engineering-workstations')],
  'user-hana': [directoryGroup('group-all-windows'), directoryGroup('group-marketing-apps'), directoryGroup('group-engineering-workstations'), directoryGroup('group-macos-pilot')],
  'user-irina': [directoryGroup('group-all-windows'), directoryGroup('group-procurement-apps')],
  'user-theo': [directoryGroup('group-android-pilot')],
  'user-mei': [directoryGroup('group-macos-pilot'), directoryGroup('group-research-devices')],
};

export const sampleMembersByDirectoryRoleId: Record<string, GraphObject[]> = {
  'role-intune-admin': [directoryUser('user-adele'), directoryUser('user-kai'), directoryUser('user-grace')],
  'role-security-reader': [directoryUser('user-adele'), directoryUser('user-breakglass'), directoryUser('user-nora')],
  'role-global-reader': [directoryUser('user-breakglass'), directoryUser('user-olivia'), directoryUser('user-nora')],
  'role-ca-admin': [directoryUser('user-adele'), directoryUser('user-nora')],
};

export const sampleAssignmentsByOwnerId: Record<string, GraphObject[]> = {
  'app-company-portal': [
    assignment('assign-company-all-users', 'required', allUsersTarget()),
  ],
  'app-edge': [
    assignment('assign-edge-windows', 'required', groupTarget('group-all-windows', 'filter-windows-corporate', 'include')),
  ],
  'app-defender': [
    assignment('assign-defender-windows', 'required', groupTarget('group-all-windows', 'filter-windows-corporate', 'include')),
    assignment('assign-defender-security', 'available', groupTarget('group-security-ops')),
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
  'app-teams': [
    assignment('assign-teams-all-users', 'required', allUsersTarget()),
  ],
  'app-onedrive': [
    assignment('assign-onedrive-all-users', 'required', allUsersTarget()),
  ],
  'app-zoom': [
    assignment('assign-zoom-contractors', 'available', groupTarget('group-contractors', 'filter-contractor-byod', 'include')),
    assignment('assign-zoom-marketing', 'available', groupTarget('group-marketing-apps')),
  ],
  'app-adobe-acrobat': [
    assignment('assign-acrobat-finance', 'required', groupTarget('group-finance')),
    assignment('assign-acrobat-marketing', 'available', groupTarget('group-marketing-apps')),
  ],
  'app-servicenow-agent': [
    assignment('assign-servicenow-frontline', 'required', groupTarget('group-frontline', 'filter-frontline-shared', 'include')),
  ],
  'app-salesforce': [
    assignment('assign-salesforce-sales', 'required', groupTarget('group-sales-mobile')),
  ],
  'app-slack': [
    assignment('assign-slack-marketing', 'required', groupTarget('group-marketing-apps')),
    assignment('assign-slack-contractors', 'available', groupTarget('group-contractors', 'filter-contractor-byod', 'include')),
  ],
  'app-power-bi': [
    assignment('assign-powerbi-finance', 'required', groupTarget('group-finance')),
  ],
  'app-planner': [
    assignment('assign-planner-procurement', 'required', groupTarget('group-procurement-apps')),
  ],
  'app-loop': [
    assignment('assign-loop-research', 'available', groupTarget('group-research-devices')),
  ],
  'policy-win-compliance': [
    assignment('assign-win-compliance', 'required', groupTarget('group-all-windows', 'filter-windows-corporate', 'include')),
  ],
  'policy-ios-compliance': [
    assignment('assign-ios-compliance', 'required', groupTarget('group-ios-pilot', 'filter-ios-byod', 'include')),
  ],
  'policy-macos-compliance': [
    assignment('assign-macos-compliance', 'required', groupTarget('group-macos-pilot', 'filter-macos-corporate', 'include')),
  ],
  'policy-android-compliance': [
    assignment('assign-android-compliance', 'required', groupTarget('group-android-pilot')),
  ],
  'policy-admin-compliance': [
    assignment('assign-admin-compliance', 'required', groupTarget('group-intune-admins', 'filter-executive-windows', 'include')),
  ],
  'config-firewall': [
    assignment('assign-firewall', 'required', allDevicesTarget()),
  ],
  'config-ios-wifi': [
    assignment('assign-ios-wifi', 'required', groupTarget('group-frontline')),
  ],
  'config-macos-filevault': [
    assignment('assign-macos-filevault', 'required', groupTarget('group-macos-pilot', 'filter-macos-corporate', 'include')),
  ],
  'config-android-work-profile': [
    assignment('assign-android-work-profile', 'required', groupTarget('group-android-pilot')),
  ],
  'config-always-on-vpn': [
    assignment('assign-always-on-vpn', 'required', groupTarget('group-sales-mobile')),
  ],
  'settings-oib': [
    assignment('assign-settings-oib', 'required', groupTarget('group-all-windows', 'filter-windows-corporate', 'include')),
  ],
  'settings-edge-security': [
    assignment('assign-edge-security', 'required', groupTarget('group-all-windows')),
  ],
  'settings-security-baseline': [
    assignment('assign-security-baseline', 'required', groupTarget('group-all-windows', 'filter-windows-corporate', 'include')),
  ],
  'settings-update-ring': [
    assignment('assign-update-ring', 'required', groupTarget('group-all-windows', 'filter-windows-corporate', 'include')),
  ],
  'settings-attack-surface': [
    assignment('assign-attack-surface', 'required', groupTarget('group-security-ops')),
  ],
  'enroll-autopilot-standard': [
    assignment('assign-autopilot-standard', 'required', groupTarget('group-all-windows')),
  ],
  'enroll-apple-user-enrollment': [
    assignment('assign-apple-user-enrollment', 'available', groupTarget('group-ios-pilot', 'filter-ios-byod', 'include')),
  ],
  'enroll-android-fully-managed': [
    assignment('assign-android-fully-managed', 'required', groupTarget('group-android-pilot')),
  ],
};

export const sampleSignIns: GraphSignIn[] = [
  signIn('signin-adele-portal-success', '2026-06-23T14:21:00Z', sampleObject(sampleUsers, 'user-adele'), 'Azure Portal', 'Microsoft Azure Management', '00000002-0000-0000-c000-000000000000', 'success', 0, [
    caPolicy('ca-require-mfa-admins', 'Require MFA for admins', 'success', ['mfa'], []),
    caPolicy('ca-block-legacy', 'Block legacy authentication', 'notApplied', [], []),
  ], sampleObject(sampleManagedDevices, 'device-w365-adele'), 'Seattle', 'WA', 'US', '198.51.100.18'),
  signIn('signin-adele-portal-blocked', '2026-06-23T13:52:00Z', sampleObject(sampleUsers, 'user-adele'), 'Azure Portal', 'Microsoft Azure Management', '00000002-0000-0000-c000-000000000000', 'failure', 53003, [
    caPolicy('ca-block-external-admin', 'Block admin access outside trusted locations', 'failure', ['block'], []),
    caPolicy('ca-require-compliant-device', 'Require compliant device for admin portals', 'notApplied', [], []),
  ], sampleObject(sampleManagedDevices, 'device-w365-adele'), 'Portland', 'OR', 'US', '203.0.113.91'),
  signIn('signin-miguel-concur-blocked', '2026-06-23T12:08:00Z', sampleObject(sampleUsers, 'user-miguel'), 'SAP Concur', 'SAP Concur', 'app-sap-concur-resource', 'failure', 53003, [
    caPolicy('ca-require-compliant-device', 'Require compliant device for finance apps', 'failure', ['compliantDevice'], []),
  ], sampleObject(sampleManagedDevices, 'device-surface-miguel'), 'Chicago', 'IL', 'US', '198.51.100.44'),
  signIn('signin-priya-outlook-report', '2026-06-22T19:34:00Z', sampleObject(sampleUsers, 'user-priya'), 'Microsoft Outlook', 'Microsoft 365 Exchange Online', '00000002-0000-0ff1-ce00-000000000000', 'reportOnlySuccess', 0, [
    caPolicy('ca-report-ios-risk', 'Report-only iOS risk policy', 'reportOnlySuccess', ['mfa'], ['signInFrequency']),
  ], sampleObject(sampleManagedDevices, 'device-iphone-priya'), 'Austin', 'TX', 'US', '198.51.100.72'),
  signIn('signin-breakglass-notapplied', '2026-06-22T08:10:00Z', sampleObject(sampleUsers, 'user-breakglass'), 'Azure Portal', 'Microsoft Azure Management', '00000002-0000-0000-c000-000000000000', 'notApplied', 0, [
    caPolicy('ca-breakglass-exclusion-review', 'Break glass exclusion review', 'notApplied', [], []),
  ], undefined, 'Redmond', 'WA', 'US', '203.0.113.7'),
  signIn('signin-nora-defender-success', '2026-06-23T11:46:00Z', sampleObject(sampleUsers, 'user-nora'), 'Microsoft Defender', 'Microsoft Defender XDR', 'app-defender-resource', 'success', 0, [
    caPolicy('ca-security-admin-mfa', 'Require MFA for security operations', 'success', ['mfa'], []),
    caPolicy('ca-require-compliant-device', 'Require compliant device for security portals', 'success', ['compliantDevice'], []),
  ], sampleObject(sampleManagedDevices, 'device-surface-nora'), 'Seattle', 'WA', 'US', '198.51.100.25'),
  signIn('signin-ethan-salesforce-success', '2026-06-23T10:30:00Z', sampleObject(sampleUsers, 'user-ethan'), 'Salesforce', 'Salesforce', 'app-salesforce-resource', 'success', 0, [
    caPolicy('ca-sales-mobile-mfa', 'Require MFA for sales apps', 'success', ['mfa'], []),
  ], sampleObject(sampleManagedDevices, 'device-iphone-ethan'), 'Denver', 'CO', 'US', '198.51.100.63'),
  signIn('signin-jamal-servicenow-blocked', '2026-06-23T09:18:00Z', sampleObject(sampleUsers, 'user-jamal'), 'ServiceNow Agent', 'ServiceNow', 'app-servicenow-resource', 'failure', 53003, [
    caPolicy('ca-block-noncompliant-frontline', 'Block noncompliant frontline devices', 'failure', ['block'], []),
  ], sampleObject(sampleManagedDevices, 'device-android-jamal'), 'Phoenix', 'AZ', 'US', '203.0.113.84'),
  signIn('signin-lena-slack-success', '2026-06-22T21:11:00Z', sampleObject(sampleUsers, 'user-lena'), 'Slack', 'Slack', 'app-slack-resource', 'success', 0, [
    caPolicy('ca-marketing-session-control', 'Limit marketing app sessions', 'success', [], ['signInFrequency']),
  ], sampleObject(sampleManagedDevices, 'device-mac-lena'), 'San Francisco', 'CA', 'US', '198.51.100.92'),
  signIn('signin-omar-zoom-report', '2026-06-22T17:02:00Z', sampleObject(sampleUsers, 'user-omar'), 'Zoom Workplace', 'Zoom', 'app-zoom-resource', 'reportOnlySuccess', 0, [
    caPolicy('ca-report-contractor-byod', 'Report-only contractor BYOD review', 'reportOnlySuccess', ['mfa'], ['signInFrequency']),
  ], sampleObject(sampleManagedDevices, 'device-mac-omar'), 'Toronto', 'ON', 'CA', '198.51.100.120'),
  signIn('signin-daniel-powerbi-success', '2026-06-22T15:42:00Z', sampleObject(sampleUsers, 'user-daniel'), 'Microsoft Power BI', 'Power BI Service', 'app-powerbi-resource', 'success', 0, [
    caPolicy('ca-finance-compliant-device', 'Require compliant device for finance analytics', 'success', ['compliantDevice'], []),
  ], sampleObject(sampleManagedDevices, 'device-thinkpad-daniel'), 'Charlotte', 'NC', 'US', '198.51.100.140'),
  signIn('signin-irina-planner-success', '2026-06-22T14:20:00Z', sampleObject(sampleUsers, 'user-irina'), 'Microsoft Planner', 'Microsoft Planner', 'app-planner-resource', 'success', 0, [
    caPolicy('ca-procurement-managed-device', 'Require managed device for procurement apps', 'success', ['compliantDevice'], []),
  ], sampleObject(sampleManagedDevices, 'device-surface-irina'), 'New York', 'NY', 'US', '198.51.100.151'),
  signIn('signin-mei-loop-success', '2026-06-22T13:35:00Z', sampleObject(sampleUsers, 'user-mei'), 'Microsoft Loop', 'Microsoft Loop', 'app-loop-resource', 'success', 0, [
    caPolicy('ca-research-session-controls', 'Require session controls for research data', 'success', [], ['persistentBrowser']),
  ], sampleObject(sampleManagedDevices, 'device-mac-mei'), 'Boston', 'MA', 'US', '198.51.100.177'),
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

function directoryUser(id: string): GraphObject {
  return directoryObject(sampleObject(sampleUsers, id), 'user');
}

function directoryGroup(id: string): GraphObject {
  return directoryObject(sampleObject(sampleGroups, id), 'group');
}

function directoryRoleRef(id: string): GraphObject {
  return directoryObject(sampleObject(sampleDirectoryRoles, id), 'directoryRole');
}

function sampleObject(items: GraphObject[], id: string): GraphObject {
  const object = items.find((candidate) => candidate.id === id);
  if (!object) {
    throw new Error(`Sample tenant object ${id} was not found.`);
  }

  return object;
}

function assignment(id: string, intent: string, target: GraphObject): GraphObject {
  return { id, intent, source: 'direct', target };
}

function allDevicesTarget(): GraphObject {
  return { '@odata.type': '#microsoft.graph.allDevicesAssignmentTarget' };
}

function allUsersTarget(): GraphObject {
  return { '@odata.type': '#microsoft.graph.allLicensedUsersAssignmentTarget' };
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
