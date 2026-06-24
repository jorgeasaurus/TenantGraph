import type { GraphObject } from '../graph/adapters';
import type { GraphSignIn } from '../graph/signInLogAdapter';
import { sampleAppIconSources, sampleAppIcons, type SampleAppIconKey } from './sampleAppIcons';

export const sampleCurrentUserId = 'user-mark-scout';

export const sampleUsers: GraphObject[] = [
  user('user-mark-scout', 'Mark Scout', 'mark.scout@lumon.example', 'Macrodata refiner', 'Macrodata Refinement'),
  user('user-helly-riggs', 'Helly Riggs', 'helly.riggs@lumon.example', 'Macrodata refiner', 'Macrodata Refinement'),
  user('user-irving-bailiff', 'Irving Bailiff', 'irving.bailiff@lumon.example', 'Macrodata refiner', 'Macrodata Refinement'),
  user('user-dylan-george', 'Dylan George', 'dylan.george@lumon.example', 'Macrodata refiner', 'Macrodata Refinement'),
  user('user-seth-milchick', 'Seth Milchick', 'seth.milchick@lumon.example', 'Severed floor manager', 'Severed Floor Operations'),
  user('user-harmony-cobel', 'Harmony Cobel', 'harmony.cobel@lumon.example', 'Floor administrator', 'Executive Administration'),
  user('user-ms-casey', 'Ms. Casey', 'ms.casey@lumon.example', 'Wellness counselor', 'Wellness'),
  user('user-burt-goodman', 'Burt Goodman', 'burt.goodman@lumon.example', 'Optics and Design lead', 'Optics and Design'),
  user('user-felicia', 'Felicia', 'felicia@lumon.example', 'Optics and Design specialist', 'Optics and Design'),
  user('user-devon-scout-hale', 'Devon Scout-Hale', 'devon.scout-hale@lumon.example', 'Outie liaison', 'External Relations'),
  user('user-ricken-hale', 'Ricken Hale', 'ricken.hale@lumon.example', 'Author liaison', 'External Relations'),
  user('user-natalie-kalen', 'Natalie Kalen', 'natalie.kalen@lumon.example', 'Board communications', 'Executive Office'),
  user('user-doug-graner', 'Doug Graner', 'doug.graner@lumon.example', 'Security chief', 'Security'),
  user('user-reghabi', 'Reghabi', 'reghabi@lumon.example', 'Testing floor researcher', 'Research Containment'),
  user('user-jame-eagan', 'Jame Eagan', 'jame.eagan@lumon.example', 'Chief executive', 'Eagan Executive Circle'),
  user('user-kier-eagan', 'Kier Eagan Archive', 'kier.archive@lumon.example', 'Founder archive account', 'Perpetuity Wing'),
  user('user-ambrose-eagan', 'Ambrose Eagan Archive', 'ambrose.archive@lumon.example', 'Archive docent', 'Perpetuity Wing'),
  user('user-myrtle-eagan', 'Myrtle Eagan Archive', 'myrtle.archive@lumon.example', 'Archive docent', 'Perpetuity Wing'),
  user('user-dieter-eagan', 'Dieter Eagan Archive', 'dieter.archive@lumon.example', 'Archive docent', 'Perpetuity Wing'),
  user('user-goat-attendant', 'Mammalians Nurturable Attendant', 'goat.attendant@lumon.example', 'Livestock attendant', 'Mammalians Nurturable'),
  user('user-board-voice', 'The Board', 'board.voice@lumon.example', 'Board voice relay', 'Board Communications'),
  user('user-break-glass', 'Break Glass Overtime Override', 'breakglass@lumon.example', 'Emergency access', 'Identity'),
  user('user-cold-harbor-tech', 'Cold Harbor Technician', 'cold.harbor.tech@lumon.example', 'Project technician', 'Cold Harbor'),
  user('user-waffle-host', 'Waffle Party Host', 'waffle.host@lumon.example', 'Culture events', 'Employee Experience'),
];

export const sampleGroups: GraphObject[] = [
  group('group-severed-floor', 'Severed Floor', 'severed-floor', true),
  group('group-mdr', 'Macrodata Refinement', 'macrodata-refinement', true),
  group('group-od', 'Optics and Design', 'optics-design', true),
  group('group-wellness', 'Wellness Suite', 'wellness-suite', true),
  group('group-security', 'Security Office', 'security-office', true),
  group('group-perpetuity', 'Perpetuity Wing Stewards', 'perpetuity-wing', true),
  group('group-executive', 'Eagan Executive Circle', 'eagan-executive', true),
  group('group-overtime', 'Overtime Contingency Operators', 'overtime-contingency', true),
  group('group-break-room', 'Break Room Reviewers', 'break-room-reviewers', true),
  group('group-goats', 'Mammalians Nurturable', 'mammalians-nurturable', true),
  group('group-cold-harbor', 'Cold Harbor Project', 'cold-harbor-project', true),
  group('group-kier-compliance', 'Kier Compliance Committee', 'kier-compliance', true),
  group('group-field-devices', 'Lumon Field Devices', 'lumon-field-devices', true),
  group('group-outie-review', 'Outie Access Review', 'outie-access-review', true),
  group('group-innie-ipad', 'Innies iPad Pilot', 'innies-ipad-pilot', true),
  group('group-waffle-party', 'Waffle Party Committee', 'waffle-party', true),
  group('group-defiant-jazz', 'Defiant Jazz Response', 'defiant-jazz-response', true),
  group('group-board-comms', 'Board Communications', 'board-comms', true),
  group('group-testing-floor', 'Testing Floor Quarantine', 'testing-floor-quarantine', true),
  group('group-kier-chronicle', 'Kier Chronicle Readers', 'kier-chronicle', true),
];

export const sampleDirectoryRoles: GraphObject[] = [
  directoryRole('role-kier-tenant-admin', 'Kier Tenant Administrator', 'Manages Lumon endpoint and directory guardrails.', 'template-kier-admin'),
  directoryRole('role-overtime-admin', 'Overtime Contingency Administrator', 'Manages emergency identity controls.', 'template-overtime-admin'),
  directoryRole('role-security-reader', 'Security Reader', 'Reads security and Conditional Access reports.', 'template-security-reader'),
  directoryRole('role-ca-admin', 'Conditional Access Administrator', 'Manages Conditional Access policy configuration.', 'template-ca-admin'),
  directoryRole('role-board-reader', 'Board Global Reader', 'Reads tenant-wide directory configuration for the Board.', 'template-board-reader'),
];

export const sampleManagedDevices: GraphObject[] = [
  device('device-mdr-mark-win11', 'MDR-MARK-WIN11', 'user-mark-scout', 'Windows', 'compliant', 'Dell', 'OptiPlex MDR Terminal', 'aad-mdr-mark-win11'),
  device('device-mark-outie-iphone', 'MARK-OUTIE-iPhone', 'user-mark-scout', 'iOS', 'noncompliant', 'Apple', 'iPhone 15', 'aad-mark-outie-iphone'),
  device('device-mdr-helly-win11', 'MDR-HELLY-WIN11', 'user-helly-riggs', 'Windows', 'compliant', 'Dell', 'OptiPlex MDR Terminal', 'aad-mdr-helly-win11'),
  device('device-helly-orientation-ipad', 'HELLY-ORIENTATION-iPad', 'user-helly-riggs', 'iPadOS', 'compliant', 'Apple', 'iPad Air', 'aad-helly-orientation-ipad'),
  device('device-mdr-irving-win11', 'MDR-IRVING-WIN11', 'user-irving-bailiff', 'Windows', 'compliant', 'Dell', 'OptiPlex MDR Terminal', 'aad-mdr-irving-win11'),
  device('device-od-irving-ipad', 'OD-IRVING-iPad', 'user-irving-bailiff', 'iPadOS', 'compliant', 'Apple', 'iPad 10', 'aad-od-irving-ipad'),
  device('device-mdr-dylan-win11', 'MDR-DYLAN-WIN11', 'user-dylan-george', 'Windows', 'compliant', 'Dell', 'OptiPlex MDR Terminal', 'aad-mdr-dylan-win11'),
  device('device-dylan-reward-iphone', 'DYLAN-REWARD-iPhone', 'user-dylan-george', 'iOS', 'compliant', 'Apple', 'iPhone 14', 'aad-dylan-reward-iphone'),
  device('device-sec-milchick-surface', 'SEC-MILCHICK-SURFACE', 'user-seth-milchick', 'Windows', 'compliant', 'Microsoft', 'Surface Laptop Studio', 'aad-sec-milchick-surface'),
  device('device-milchick-floor-iphone', 'MILCHICK-FLOOR-iPhone', 'user-seth-milchick', 'iOS', 'compliant', 'Apple', 'iPhone 15 Pro', 'aad-milchick-floor-iphone'),
  device('device-exec-cobel-w365', 'EXEC-COBEL-W365', 'user-harmony-cobel', 'Windows', 'compliant', 'Microsoft', 'Cloud PC Enterprise', 'aad-exec-cobel-w365'),
  device('device-cobel-surface', 'COBEL-SURFACE', 'user-harmony-cobel', 'Windows', 'compliant', 'Microsoft', 'Surface Pro 10', 'aad-cobel-surface'),
  device('device-wellness-casey-ipad', 'WELLNESS-CASEY-iPad', 'user-ms-casey', 'iPadOS', 'compliant', 'Apple', 'iPad Pro', 'aad-wellness-casey-ipad'),
  device('device-wellness-room-kiosk', 'WELLNESS-ROOM-KIOSK', 'user-ms-casey', 'Windows', 'compliant', 'Lenovo', 'ThinkCentre Tiny', 'aad-wellness-room-kiosk'),
  device('device-od-burt-mac', 'OD-BURT-MAC', 'user-burt-goodman', 'macOS', 'compliant', 'Apple', 'MacBook Air', 'aad-od-burt-mac'),
  device('device-od-burt-ipad', 'OD-BURT-iPad', 'user-burt-goodman', 'iPadOS', 'compliant', 'Apple', 'iPad Air', 'aad-od-burt-ipad'),
  device('device-od-felicia-win11', 'OD-FELICIA-WIN11', 'user-felicia', 'Windows', 'compliant', 'HP', 'EliteBook 840', 'aad-od-felicia-win11'),
  device('device-devon-mac', 'OUTIE-DEVON-MAC', 'user-devon-scout-hale', 'macOS', 'unknown', 'Apple', 'MacBook Pro', 'aad-devon-mac'),
  device('device-ricken-mac', 'OUTIE-RICKEN-MAC', 'user-ricken-hale', 'macOS', 'unknown', 'Apple', 'MacBook Air', 'aad-ricken-mac'),
  device('device-board-natalie-surface', 'BOARD-NATALIE-SURFACE', 'user-natalie-kalen', 'Windows', 'compliant', 'Microsoft', 'Surface Laptop 6', 'aad-board-natalie-surface'),
  device('device-sec-graner-tactical', 'SEC-GRANER-TACTICAL', 'user-doug-graner', 'Windows', 'compliant', 'Panasonic', 'Toughbook', 'aad-sec-graner-tactical'),
  device('device-testing-reghabi-mac', 'TESTING-REGHABI-MAC', 'user-reghabi', 'macOS', 'noncompliant', 'Apple', 'Mac Studio', 'aad-testing-reghabi-mac'),
  device('device-exec-jame-w365', 'EXEC-JAME-W365', 'user-jame-eagan', 'Windows', 'compliant', 'Microsoft', 'Cloud PC Enterprise', 'aad-exec-jame-w365'),
  device('device-perpetuity-kier-kiosk', 'PERPETUITY-KIER-KIOSK', 'user-kier-eagan', 'Windows', 'compliant', 'Dell', 'Kiosk 5000', 'aad-perpetuity-kier-kiosk'),
  device('device-perpetuity-ambrose-kiosk', 'PERPETUITY-AMBROSE-KIOSK', 'user-ambrose-eagan', 'Windows', 'compliant', 'Dell', 'Kiosk 5000', 'aad-perpetuity-ambrose-kiosk'),
  device('device-perpetuity-myrtle-ipad', 'PERPETUITY-MYRTLE-iPad', 'user-myrtle-eagan', 'iPadOS', 'compliant', 'Apple', 'iPad 10', 'aad-perpetuity-myrtle-ipad'),
  device('device-perpetuity-dieter-win', 'PERPETUITY-DIETER-WIN', 'user-dieter-eagan', 'Windows', 'compliant', 'Lenovo', 'ThinkCentre Tiny', 'aad-perpetuity-dieter-win'),
  device('device-goat-room-ipad-01', 'GOAT-RM-iPad-01', 'user-goat-attendant', 'iPadOS', 'compliant', 'Apple', 'iPad 10', 'aad-goat-room-ipad-01'),
  device('device-goat-room-ipad-02', 'GOAT-RM-iPad-02', 'user-goat-attendant', 'iPadOS', 'compliant', 'Apple', 'iPad 10', 'aad-goat-room-ipad-02'),
  device('device-board-voice-relay', 'BOARD-VOICE-RELAY', 'user-board-voice', 'Windows', 'compliant', 'Microsoft', 'Teams Rooms Console', 'aad-board-voice-relay'),
  device('device-breakglass-yubikey', 'BREAKGLASS-OVERTIME-WIN', 'user-break-glass', 'Windows', 'compliant', 'Microsoft', 'Surface Go', 'aad-breakglass-yubikey'),
  device('device-cold-harbor-01', 'COLD-HARBOR-WIN-01', 'user-cold-harbor-tech', 'Windows', 'compliant', 'Dell', 'Precision Compact', 'aad-cold-harbor-01'),
  device('device-cold-harbor-02', 'COLD-HARBOR-WIN-02', 'user-cold-harbor-tech', 'Windows', 'noncompliant', 'Dell', 'Precision Compact', 'aad-cold-harbor-02'),
  device('device-waffle-party-ipad', 'WAFFLE-PARTY-iPad', 'user-waffle-host', 'iPadOS', 'compliant', 'Apple', 'iPad Air', 'aad-waffle-party-ipad'),
  device('device-breakroom-kiosk-01', 'BREAKROOM-KIOSK-01', undefined, 'Windows', 'unknown', 'Dell', 'OptiPlex Kiosk', 'aad-breakroom-kiosk-01'),
  device('device-security-cam-console', 'SECURITY-CAM-CONSOLE', undefined, 'Windows', 'compliant', 'Lenovo', 'ThinkStation', 'aad-security-cam-console'),
  device('device-mdr-spare-terminal-01', 'MDR-SPARE-TERMINAL-01', undefined, 'Windows', 'unknown', 'Dell', 'OptiPlex MDR Terminal', 'aad-mdr-spare-terminal-01'),
  device('device-elevator-display', 'ELEVATOR-DISPLAY-09', undefined, 'Windows', 'compliant', 'LG', 'Digital Signage', 'aad-elevator-display'),
];

export const sampleMobileApps: GraphObject[] = [
  app('app-kier-keeper', 'Kier Keeper', 'Lumon Industries', true, 'kierKeeper'),
  app('app-macrodata-refiner', 'Macrodata Refiner', 'Lumon Industries', true, 'macrodataRefiner'),
  app('app-waffle-planner', 'Waffle Party Planner', 'Lumon Industries', true, 'wafflePlanner'),
  app('app-compunction-studio', 'Compunction Statement Studio', 'Lumon Industries', true, 'compunctionStudio'),
  app('app-perpetuity-guide', 'Perpetuity Wing Guide', 'Lumon Industries', true, 'perpetuityGuide'),
  app('app-defiant-jazz-detector', 'Defiant Jazz Detector', 'Lumon Industries', true, 'defiantJazzDetector'),
  app('app-egg-bar-scheduler', 'Egg Bar Scheduler', 'Lumon Industries', true, 'eggBarScheduler'),
  app('app-break-room-recorder', 'Break Room Recorder', 'Lumon Industries', true, 'breakRoomRecorder'),
  app('app-wellness-memory-viewer', 'Wellness Memory Viewer', 'Lumon Industries', true, 'wellnessMemoryViewer'),
  app('app-goat-ledger', 'Goat Ledger', 'Lumon Industries', true, 'goatLedger'),
  app('app-overtime-console', 'Overtime Contingency Console', 'Lumon Industries', true, 'overtimeConsole'),
  app('app-lumon-handbook', 'Lumon Handbook', 'Lumon Industries', true, 'lumonHandbook'),
  app('app-eagan-bingo', 'Eagan Bingo', 'Lumon Industries', true, 'eaganBingo'),
  app('app-cold-harbor-tracker', 'Cold Harbor Tracker', 'Lumon Industries', true, 'coldHarborTracker'),
  app('app-optics-catalog', 'Optics Design Catalog', 'Lumon Industries', true, 'opticsCatalog'),
  app('app-severed-mail', 'Severed Mail', 'Lumon Industries', true, 'severedMail'),
  app('app-melon-bar-inventory', 'Melon Bar Inventory', 'Lumon Industries', true, 'melonBarInventory'),
  app('app-security-desk', 'Security Desk Console', 'Lumon Industries', true, 'securityDesk'),
];

export const sampleCompliancePolicies: GraphObject[] = [
  policy('policy-severed-windows-compliance', 'Severed Floor Windows Compliance', 'Requires encryption, Defender health, and approved floor network.', 'windows10', ['scope-severed-floor', 'scope-mdr']),
  policy('policy-wellness-ipad-compliance', 'Wellness iPad Compliance', 'Requires passcode, current iPadOS, and managed app profile.', 'iOS', ['scope-wellness']),
  policy('policy-od-mac-compliance', 'O&D Mac Compliance', 'Requires FileVault, firewall, and approved design storage.', 'macOS', ['scope-od']),
  policy('policy-security-tactical-compliance', 'Security Tactical Device Compliance', 'Requires compliant dedicated security hardware.', 'windows10', ['scope-security']),
  policy('policy-exec-cloudpc-compliance', 'Executive Cloud PC Compliance', 'Requires Cloud PC health before Board resources open.', 'windows10', ['scope-executive']),
  policy('policy-outie-byod-compliance', 'Outie BYOD Compliance', 'Allows limited app access only from registered personal devices.', 'macOS', ['scope-testing-floor']),
  policy('policy-goat-shared-compliance', 'Goat Room Shared Device Compliance', 'Requires supervised iPadOS and local network restrictions.', 'iOS', ['scope-severed-floor']),
];

export const sampleDeviceConfigurations: GraphObject[] = [
  policy('config-mdr-desktop', 'MDR Desktop Restrictions', 'Locks MDR terminals to approved refiners, apps, and peripherals.', 'windows10', ['scope-mdr']),
  policy('config-break-room-kiosk', 'Break Room Kiosk Lockdown', 'Runs statement capture in single-app kiosk mode.', 'windows10', ['scope-security']),
  policy('config-wellness-ipad', 'Wellness Room iPad Profile', 'Deploys room Wi-Fi, wallpaper, and managed app configuration.', 'iOS', ['scope-wellness']),
  policy('config-od-display', 'Optics and Design Display Profile', 'Applies display calibration and storage rules for O&D devices.', 'macOS', ['scope-od']),
  policy('config-security-camera', 'Security Camera Desk Profile', 'Restricts camera-console access to security operators.', 'windows10', ['scope-security']),
  policy('config-perpetuity-browser', 'Perpetuity Kiosk Browser', 'Runs the founder archive as a locked browser experience.', 'windows10', ['scope-perpetuity']),
  policy('config-goat-room-wifi', 'Goat Room Wi-Fi Profile', 'Deploys hidden SSID and network isolation for goat room devices.', 'iOS', ['scope-severed-floor']),
];

export const sampleSettingsCatalogPolicies: GraphObject[] = [
  settingsPolicy('settings-kier-browser', 'Kier Handbook Browser Hardening', 'Blocks unapproved extensions and pins handbook resources.', 'windows10', ['scope-severed-floor']),
  settingsPolicy('settings-overtime-baseline', 'Overtime Contingency Windows Baseline', 'Hardens emergency access workstations and session controls.', 'windows10', ['scope-security', 'scope-executive']),
  settingsPolicy('settings-mdr-usb', 'Macrodata USB Restrictions', 'Blocks removable storage and unauthorized print paths.', 'windows10', ['scope-mdr']),
  settingsPolicy('settings-defiant-jazz-audio', 'Defiant Jazz Audio Controls', 'Disables unapproved audio devices on severed-floor endpoints.', 'windows10', ['scope-severed-floor']),
  settingsPolicy('settings-eagan-wallpaper', 'Eagan Desktop Wallpaper Standard', 'Applies the approved Eagan visual standard to corporate endpoints.', 'windows10', ['scope-perpetuity']),
  settingsPolicy('settings-cold-harbor-asr', 'Cold Harbor Attack Surface Rules', 'Enforces advanced attack surface reduction for project systems.', 'windows10', ['scope-testing-floor']),
  settingsPolicy('settings-board-camera', 'Board Meeting Camera Controls', 'Locks camera and microphone controls for Board communications.', 'windows10', ['scope-executive']),
  settingsPolicy('settings-severed-update-ring', 'Severed Floor Update Ring', 'Controls restart windows for floor devices.', 'windows10', ['scope-severed-floor']),
];

export const sampleEnrollmentProfiles: GraphObject[] = [
  policy('enroll-severed-autopilot', 'Severed Floor Autopilot', 'User-driven Autopilot profile for MDR, security, and floor terminals.', 'windows10', ['scope-severed-floor']),
  policy('enroll-wellness-shared-ipad', 'Wellness Shared iPad Enrollment', 'Supervised iPad enrollment for Wellness and session rooms.', 'iOS', ['scope-wellness']),
  policy('enroll-od-mac', 'O&D Mac Enrollment', 'Automated device enrollment for Optics and Design Macs.', 'macOS', ['scope-od']),
  policy('enroll-security-surface', 'Security Surface Deployment', 'Dedicated Windows enrollment for security operators.', 'windows10', ['scope-security']),
  policy('enroll-perpetuity-kiosk', 'Perpetuity Kiosk Enrollment', 'Self-deploying kiosk profile for founder archive displays.', 'windows10', ['scope-perpetuity']),
];

export const sampleAssignmentFilters: GraphObject[] = [
  filter('filter-severed-windows', 'Severed floor Windows terminals', 'windows10AndLater', '(device.deviceName -startsWith "MDR-") or (device.deviceName -startsWith "SEC-")'),
  filter('filter-wellness-ipads', 'Wellness iPads', 'iOS', '(device.deviceName -startsWith "WELLNESS-")'),
  filter('filter-od-macs', 'Optics Macs', 'macOS', '(device.deviceName -startsWith "OD-") and (device.operatingSystem -contains "macOS")'),
  filter('filter-security-tactical', 'Security tactical devices', 'windows10AndLater', '(device.deviceName -startsWith "SEC-") or (device.deviceName -contains "BREAKGLASS")'),
  filter('filter-outie-byod', 'Outie BYOD devices', 'macOS', '(device.deviceOwnership -eq "Personal") or (device.deviceName -startsWith "OUTIE-")'),
  filter('filter-perpetuity-kiosks', 'Perpetuity kiosks', 'windows10AndLater', '(device.deviceName -startsWith "PERPETUITY-")'),
  filter('filter-goat-room', 'Goat room shared devices', 'iOS', '(device.deviceName -startsWith "GOAT-RM-")'),
  filter('filter-executive-cloudpc', 'Executive cloud PCs', 'windows10AndLater', '(device.deviceName -startsWith "EXEC-") or (device.model -contains "Cloud PC")'),
];

export const sampleScopeTags: GraphObject[] = [
  { id: 'scope-severed-floor', displayName: 'Severed Floor', description: 'Core severed-floor endpoint administration.' },
  { id: 'scope-mdr', displayName: 'Macrodata Refinement', description: 'MDR terminals, users, and app assignments.' },
  { id: 'scope-od', displayName: 'Optics and Design', description: 'O&D Macs, iPads, and gallery systems.' },
  { id: 'scope-wellness', displayName: 'Wellness', description: 'Wellness suite iPads and session room devices.' },
  { id: 'scope-security', displayName: 'Security', description: 'Security operators, break room systems, and emergency access.' },
  { id: 'scope-executive', displayName: 'Eagan Executive', description: 'Board and executive endpoint scope.' },
  { id: 'scope-perpetuity', displayName: 'Perpetuity Wing', description: 'Founder archive kiosks and exhibits.' },
  { id: 'scope-testing-floor', displayName: 'Testing Floor', description: 'Cold Harbor and restricted testing systems.' },
];

export const sampleDetectedAppsByDeviceId: Record<string, GraphObject[]> = {
  'device-mdr-mark-win11': detected('device-mdr-mark-win11', ['app-macrodata-refiner', 'app-kier-keeper', 'app-severed-mail']),
  'device-mdr-helly-win11': detected('device-mdr-helly-win11', ['app-macrodata-refiner', 'app-compunction-studio']),
  'device-mdr-irving-win11': detected('device-mdr-irving-win11', ['app-macrodata-refiner', 'app-optics-catalog', 'app-defiant-jazz-detector']),
  'device-mdr-dylan-win11': detected('device-mdr-dylan-win11', ['app-macrodata-refiner', 'app-waffle-planner', 'app-egg-bar-scheduler']),
  'device-sec-milchick-surface': detected('device-sec-milchick-surface', ['app-security-desk', 'app-overtime-console', 'app-break-room-recorder']),
  'device-exec-cobel-w365': detected('device-exec-cobel-w365', ['app-overtime-console', 'app-security-desk', 'app-lumon-handbook']),
  'device-wellness-casey-ipad': detected('device-wellness-casey-ipad', ['app-wellness-memory-viewer', 'app-lumon-handbook']),
  'device-od-burt-mac': detected('device-od-burt-mac', ['app-optics-catalog', 'app-severed-mail']),
  'device-goat-room-ipad-01': detected('device-goat-room-ipad-01', ['app-goat-ledger', 'app-melon-bar-inventory']),
  'device-cold-harbor-01': detected('device-cold-harbor-01', ['app-cold-harbor-tracker', 'app-overtime-console']),
  'device-breakroom-kiosk-01': detected('device-breakroom-kiosk-01', ['app-break-room-recorder', 'app-compunction-studio']),
};

const sampleGroupMemberIds = {
  'group-severed-floor': ['user-mark-scout', 'user-helly-riggs', 'user-irving-bailiff', 'user-dylan-george', 'user-seth-milchick', 'user-harmony-cobel', 'user-ms-casey', 'user-burt-goodman', 'user-felicia', 'user-doug-graner'],
  'group-mdr': ['user-mark-scout', 'user-helly-riggs', 'user-irving-bailiff', 'user-dylan-george'],
  'group-od': ['user-burt-goodman', 'user-felicia', 'user-irving-bailiff'],
  'group-wellness': ['user-ms-casey', 'user-harmony-cobel'],
  'group-security': ['user-seth-milchick', 'user-doug-graner', 'user-harmony-cobel'],
  'group-perpetuity': ['user-kier-eagan', 'user-ambrose-eagan', 'user-myrtle-eagan', 'user-dieter-eagan', 'user-natalie-kalen'],
  'group-executive': ['user-jame-eagan', 'user-harmony-cobel', 'user-natalie-kalen', 'user-board-voice'],
  'group-overtime': ['user-seth-milchick', 'user-harmony-cobel', 'user-doug-graner', 'user-break-glass'],
  'group-break-room': ['user-seth-milchick', 'user-doug-graner', 'user-harmony-cobel'],
  'group-goats': ['user-goat-attendant', 'user-seth-milchick'],
  'group-cold-harbor': ['user-cold-harbor-tech', 'user-reghabi', 'user-harmony-cobel'],
  'group-kier-compliance': ['user-mark-scout', 'user-seth-milchick', 'user-harmony-cobel', 'user-natalie-kalen'],
  'group-field-devices': ['user-seth-milchick', 'user-doug-graner', 'user-goat-attendant', 'user-cold-harbor-tech'],
  'group-outie-review': ['user-devon-scout-hale', 'user-ricken-hale', 'user-mark-scout', 'user-reghabi'],
  'group-innie-ipad': ['user-helly-riggs', 'user-irving-bailiff', 'user-ms-casey', 'user-burt-goodman'],
  'group-waffle-party': ['user-dylan-george', 'user-waffle-host', 'user-seth-milchick'],
  'group-defiant-jazz': ['user-irving-bailiff', 'user-seth-milchick', 'user-doug-graner'],
  'group-board-comms': ['user-natalie-kalen', 'user-board-voice', 'user-jame-eagan'],
  'group-testing-floor': ['user-reghabi', 'user-cold-harbor-tech', 'user-break-glass'],
  'group-kier-chronicle': ['user-mark-scout', 'user-helly-riggs', 'user-irving-bailiff', 'user-dylan-george', 'user-burt-goodman', 'user-felicia'],
} as const satisfies Record<string, readonly string[]>;

const sampleDirectoryRoleMemberIds = {
  'role-kier-tenant-admin': ['user-harmony-cobel', 'user-seth-milchick'],
  'role-overtime-admin': ['user-seth-milchick', 'user-break-glass'],
  'role-security-reader': ['user-doug-graner', 'user-natalie-kalen'],
  'role-ca-admin': ['user-harmony-cobel', 'user-doug-graner'],
  'role-board-reader': ['user-board-voice', 'user-jame-eagan', 'user-natalie-kalen'],
} as const satisfies Record<string, readonly string[]>;

export const sampleMembersByGroupId: Record<string, GraphObject[]> = mapGroupMembers(sampleGroupMemberIds);

export const sampleMembershipsByUserId: Record<string, GraphObject[]> = buildMembershipsByUserId(
  sampleGroupMemberIds,
  sampleDirectoryRoleMemberIds,
);

export const sampleMembersByDirectoryRoleId: Record<string, GraphObject[]> = mapRoleMembers(sampleDirectoryRoleMemberIds);

export const sampleAssignmentsByOwnerId: Record<string, GraphObject[]> = {
  'app-kier-keeper': [assignment('assign-kier-keeper-all-users', 'required', allUsersTarget())],
  'app-macrodata-refiner': [assignment('assign-mdr-refiner', 'required', groupTarget('group-mdr', 'filter-severed-windows', 'include'))],
  'app-waffle-planner': [assignment('assign-waffle-party', 'available', groupTarget('group-waffle-party'))],
  'app-compunction-studio': [assignment('assign-compunction-breakroom', 'required', groupTarget('group-break-room', 'filter-security-tactical', 'include'))],
  'app-perpetuity-guide': [assignment('assign-perpetuity-guide', 'required', groupTarget('group-perpetuity', 'filter-perpetuity-kiosks', 'include'))],
  'app-defiant-jazz-detector': [assignment('assign-defiant-jazz', 'available', groupTarget('group-defiant-jazz'))],
  'app-egg-bar-scheduler': [assignment('assign-egg-bar', 'available', groupTarget('group-waffle-party'))],
  'app-break-room-recorder': [assignment('assign-break-room-recorder', 'required', groupTarget('group-break-room', 'filter-security-tactical', 'include'))],
  'app-wellness-memory-viewer': [assignment('assign-wellness-memory', 'required', groupTarget('group-wellness', 'filter-wellness-ipads', 'include'))],
  'app-goat-ledger': [assignment('assign-goat-ledger', 'required', groupTarget('group-goats', 'filter-goat-room', 'include'))],
  'app-overtime-console': [assignment('assign-overtime-console', 'required', groupTarget('group-overtime', 'filter-security-tactical', 'include'))],
  'app-lumon-handbook': [assignment('assign-lumon-handbook', 'required', allUsersTarget())],
  'app-eagan-bingo': [assignment('assign-eagan-bingo', 'available', groupTarget('group-kier-chronicle'))],
  'app-cold-harbor-tracker': [assignment('assign-cold-harbor', 'required', groupTarget('group-cold-harbor'))],
  'app-optics-catalog': [assignment('assign-optics-catalog', 'required', groupTarget('group-od', 'filter-od-macs', 'include'))],
  'app-severed-mail': [assignment('assign-severed-mail', 'required', groupTarget('group-severed-floor'))],
  'app-melon-bar-inventory': [assignment('assign-melon-bar', 'available', groupTarget('group-waffle-party'))],
  'app-security-desk': [assignment('assign-security-desk', 'required', groupTarget('group-security', 'filter-security-tactical', 'include'))],
  'policy-severed-windows-compliance': [assignment('assign-severed-windows-compliance', 'required', groupTarget('group-severed-floor', 'filter-severed-windows', 'include'))],
  'policy-wellness-ipad-compliance': [assignment('assign-wellness-ipad-compliance', 'required', groupTarget('group-wellness', 'filter-wellness-ipads', 'include'))],
  'policy-od-mac-compliance': [assignment('assign-od-mac-compliance', 'required', groupTarget('group-od', 'filter-od-macs', 'include'))],
  'policy-security-tactical-compliance': [assignment('assign-security-tactical-compliance', 'required', groupTarget('group-security', 'filter-security-tactical', 'include'))],
  'policy-exec-cloudpc-compliance': [assignment('assign-exec-cloudpc-compliance', 'required', groupTarget('group-executive', 'filter-executive-cloudpc', 'include'))],
  'policy-outie-byod-compliance': [assignment('assign-outie-byod-compliance', 'required', groupTarget('group-outie-review', 'filter-outie-byod', 'include'))],
  'policy-goat-shared-compliance': [assignment('assign-goat-shared-compliance', 'required', groupTarget('group-goats', 'filter-goat-room', 'include'))],
  'config-mdr-desktop': [assignment('assign-mdr-desktop', 'required', groupTarget('group-mdr', 'filter-severed-windows', 'include'))],
  'config-break-room-kiosk': [assignment('assign-break-room-kiosk', 'required', groupTarget('group-break-room', 'filter-security-tactical', 'include'))],
  'config-wellness-ipad': [assignment('assign-wellness-ipad-profile', 'required', groupTarget('group-wellness', 'filter-wellness-ipads', 'include'))],
  'config-od-display': [assignment('assign-od-display', 'required', groupTarget('group-od', 'filter-od-macs', 'include'))],
  'config-security-camera': [assignment('assign-security-camera', 'required', groupTarget('group-security'))],
  'config-perpetuity-browser': [assignment('assign-perpetuity-browser', 'required', groupTarget('group-perpetuity', 'filter-perpetuity-kiosks', 'include'))],
  'config-goat-room-wifi': [assignment('assign-goat-room-wifi', 'required', groupTarget('group-goats', 'filter-goat-room', 'include'))],
  'settings-kier-browser': [assignment('assign-kier-browser', 'required', allDevicesTarget())],
  'settings-overtime-baseline': [assignment('assign-overtime-baseline', 'required', groupTarget('group-overtime', 'filter-security-tactical', 'include'))],
  'settings-mdr-usb': [assignment('assign-mdr-usb', 'required', groupTarget('group-mdr', 'filter-severed-windows', 'include'))],
  'settings-defiant-jazz-audio': [assignment('assign-defiant-jazz-audio', 'required', groupTarget('group-severed-floor'))],
  'settings-eagan-wallpaper': [assignment('assign-eagan-wallpaper', 'required', groupTarget('group-perpetuity'))],
  'settings-cold-harbor-asr': [assignment('assign-cold-harbor-asr', 'required', groupTarget('group-cold-harbor'))],
  'settings-board-camera': [assignment('assign-board-camera', 'required', groupTarget('group-board-comms', 'filter-executive-cloudpc', 'include'))],
  'settings-severed-update-ring': [assignment('assign-severed-update-ring', 'required', groupTarget('group-severed-floor', 'filter-severed-windows', 'include'))],
  'enroll-severed-autopilot': [assignment('assign-severed-autopilot', 'required', groupTarget('group-severed-floor'))],
  'enroll-wellness-shared-ipad': [assignment('assign-wellness-shared-ipad', 'required', groupTarget('group-wellness', 'filter-wellness-ipads', 'include'))],
  'enroll-od-mac': [assignment('assign-od-mac', 'required', groupTarget('group-od', 'filter-od-macs', 'include'))],
  'enroll-security-surface': [assignment('assign-security-surface', 'required', groupTarget('group-security', 'filter-security-tactical', 'include'))],
  'enroll-perpetuity-kiosk': [assignment('assign-perpetuity-kiosk', 'required', groupTarget('group-perpetuity', 'filter-perpetuity-kiosks', 'include'))],
};

export const sampleSignIns: GraphSignIn[] = [
  signIn('signin-mark-refiner-success', '2026-06-23T14:21:00Z', sampleObject(sampleUsers, 'user-mark-scout'), 'Macrodata Refiner', 'Macrodata Refiner', 'app-macrodata-refiner-resource', 'success', 0, [
    caPolicy('ca-severed-floor-compliant', 'Require compliant severed-floor device', 'success', ['compliantDevice'], []),
    caPolicy('ca-block-outie-byod', 'Block outie BYOD for MDR', 'notApplied', [], []),
  ], sampleObject(sampleManagedDevices, 'device-mdr-mark-win11'), 'Kier', 'PE', 'US', '198.51.100.18'),
  signIn('signin-mark-outie-blocked', '2026-06-23T13:52:00Z', sampleObject(sampleUsers, 'user-mark-scout'), 'Macrodata Refiner', 'Macrodata Refiner', 'app-macrodata-refiner-resource', 'failure', 53003, [
    caPolicy('ca-block-outie-byod', 'Block outie BYOD for MDR', 'failure', ['block'], []),
    caPolicy('ca-severed-floor-compliant', 'Require compliant severed-floor device', 'notApplied', [], []),
  ], sampleObject(sampleManagedDevices, 'device-mark-outie-iphone'), 'Kier', 'PE', 'US', '203.0.113.91'),
  signIn('signin-helly-breakroom-blocked', '2026-06-23T12:08:00Z', sampleObject(sampleUsers, 'user-helly-riggs'), 'Break Room Recorder', 'Break Room Recorder', 'app-break-room-recorder-resource', 'failure', 53003, [
    caPolicy('ca-breakroom-security-only', 'Block Break Room Recorder outside security', 'failure', ['block'], []),
  ], sampleObject(sampleManagedDevices, 'device-mdr-helly-win11'), 'Kier', 'PE', 'US', '198.51.100.44'),
  signIn('signin-irving-optics-report', '2026-06-22T19:34:00Z', sampleObject(sampleUsers, 'user-irving-bailiff'), 'Optics Design Catalog', 'Optics Design Catalog', 'app-optics-catalog-resource', 'reportOnlySuccess', 0, [
    caPolicy('ca-report-od-crossfloor', 'Report-only cross-floor O&D access', 'reportOnlySuccess', ['mfa'], ['signInFrequency']),
  ], sampleObject(sampleManagedDevices, 'device-od-irving-ipad'), 'Kier', 'PE', 'US', '198.51.100.72'),
  signIn('signin-dylan-waffle-success', '2026-06-23T10:30:00Z', sampleObject(sampleUsers, 'user-dylan-george'), 'Waffle Party Planner', 'Waffle Party Planner', 'app-waffle-planner-resource', 'success', 0, [
    caPolicy('ca-waffle-mfa', 'Require MFA for culture rewards', 'success', ['mfa'], []),
  ], sampleObject(sampleManagedDevices, 'device-dylan-reward-iphone'), 'Kier', 'PE', 'US', '198.51.100.63'),
  signIn('signin-milchick-overtime-success', '2026-06-23T11:46:00Z', sampleObject(sampleUsers, 'user-seth-milchick'), 'Overtime Contingency Console', 'Overtime Contingency Console', 'app-overtime-console-resource', 'success', 0, [
    caPolicy('ca-overtime-admin-mfa', 'Require MFA for Overtime Contingency', 'success', ['mfa'], []),
    caPolicy('ca-security-compliant', 'Require security device compliance', 'success', ['compliantDevice'], []),
  ], sampleObject(sampleManagedDevices, 'device-sec-milchick-surface'), 'Kier', 'PE', 'US', '198.51.100.25'),
  signIn('signin-cobel-overtime-failed', '2026-06-23T09:18:00Z', sampleObject(sampleUsers, 'user-harmony-cobel'), 'Overtime Contingency Console', 'Overtime Contingency Console', 'app-overtime-console-resource', 'failure', 53003, [
    caPolicy('ca-board-trusted-location', 'Require trusted location for executive override', 'failure', ['block'], []),
  ], sampleObject(sampleManagedDevices, 'device-cobel-surface'), 'Ganz', 'PE', 'US', '203.0.113.84'),
  signIn('signin-casey-wellness-success', '2026-06-22T21:11:00Z', sampleObject(sampleUsers, 'user-ms-casey'), 'Wellness Memory Viewer', 'Wellness Memory Viewer', 'app-wellness-memory-viewer-resource', 'success', 0, [
    caPolicy('ca-wellness-ipad', 'Require managed Wellness iPad', 'success', ['compliantDevice'], []),
  ], sampleObject(sampleManagedDevices, 'device-wellness-casey-ipad'), 'Kier', 'PE', 'US', '198.51.100.92'),
  signIn('signin-burt-optics-success', '2026-06-22T17:02:00Z', sampleObject(sampleUsers, 'user-burt-goodman'), 'Optics Design Catalog', 'Optics Design Catalog', 'app-optics-catalog-resource', 'success', 0, [
    caPolicy('ca-od-filevault', 'Require FileVault for O&D catalog', 'success', ['compliantDevice'], []),
  ], sampleObject(sampleManagedDevices, 'device-od-burt-mac'), 'Kier', 'PE', 'US', '198.51.100.120'),
  signIn('signin-goat-ledger-success', '2026-06-22T15:42:00Z', sampleObject(sampleUsers, 'user-goat-attendant'), 'Goat Ledger', 'Goat Ledger', 'app-goat-ledger-resource', 'success', 0, [
    caPolicy('ca-goat-room-ipad', 'Require goat room supervised iPad', 'success', ['compliantDevice'], []),
  ], sampleObject(sampleManagedDevices, 'device-goat-room-ipad-01'), 'Kier', 'PE', 'US', '198.51.100.140'),
  signIn('signin-cold-harbor-blocked', '2026-06-22T14:20:00Z', sampleObject(sampleUsers, 'user-cold-harbor-tech'), 'Cold Harbor Tracker', 'Cold Harbor Tracker', 'app-cold-harbor-tracker-resource', 'failure', 53003, [
    caPolicy('ca-cold-harbor-compliant', 'Require compliant Cold Harbor device', 'failure', ['compliantDevice'], []),
  ], sampleObject(sampleManagedDevices, 'device-cold-harbor-02'), 'Kier', 'PE', 'US', '198.51.100.151'),
  signIn('signin-breakglass-notapplied', '2026-06-22T08:10:00Z', sampleObject(sampleUsers, 'user-break-glass'), 'Overtime Contingency Console', 'Overtime Contingency Console', 'app-overtime-console-resource', 'notApplied', 0, [
    caPolicy('ca-breakglass-exclusion-review', 'Break glass exclusion review', 'notApplied', [], []),
  ], sampleObject(sampleManagedDevices, 'device-breakglass-yubikey'), 'Kier', 'PE', 'US', '203.0.113.7'),
];

const sampleUserPhotoUrls: Record<string, string> = {
  'user-dylan-george': '/sample-users/dylan-george.png',
  'user-helly-riggs': '/sample-users/helly-riggs.png',
  'user-irving-bailiff': '/sample-users/irving-bailiff.png',
  'user-mark-scout': '/sample-users/mark-scout.png',
  'user-seth-milchick': '/sample-users/seth-milchick.png',
};

export function sampleUserPhotoDataUrl(userId: string): string {
  const photoUrl = sampleUserPhotoUrls[userId];
  if (photoUrl) {
    return photoUrl;
  }

  const userObject = sampleUsers.find((candidate) => candidate.id === userId);
  const name = String(userObject?.displayName ?? 'Sample User');
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
  userId: string | undefined,
  operatingSystem: string,
  complianceState: string,
  manufacturer: string,
  model: string,
  azureADDeviceId: string,
): GraphObject {
  const primaryUser = userId ? sampleObject(sampleUsers, userId) : undefined;

  return {
    id,
    azureADDeviceId,
    complianceState,
    deviceName,
    managementAgent: 'mdm',
    manufacturer,
    model,
    operatingSystem,
    userDisplayName: primaryUser?.displayName,
    userId: userId ?? '00000000-0000-0000-0000-000000000000',
    userPrincipalName: primaryUser?.userPrincipalName ?? '',
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

function settingsPolicy(id: string, displayName: string, description: string, platform: string, roleScopeTagIds: string[]): GraphObject {
  return {
    ...policy(id, displayName, description, platform, roleScopeTagIds),
    technologies: 'mdm',
  };
}

function filter(id: string, displayName: string, platform: string, rule: string): GraphObject {
  return { id, displayName, platform, rule };
}

function detected(deviceId: string, appIds: string[]): GraphObject[] {
  return appIds.map((appId) => {
    const appObject = sampleObject(sampleMobileApps, appId);
    return detectedApp(`detected-${deviceId}-${appId}`, String(appObject.displayName), String(appObject.publisher), '2026.6');
  });
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

function mapGroupMembers(memberIdsByGroupId: Record<string, readonly string[]>): Record<string, GraphObject[]> {
  return Object.fromEntries(
    Object.entries(memberIdsByGroupId).map(([groupId, userIds]) => [groupId, userIds.map(directoryUser)]),
  );
}

function mapRoleMembers(memberIdsByRoleId: Record<string, readonly string[]>): Record<string, GraphObject[]> {
  return Object.fromEntries(
    Object.entries(memberIdsByRoleId).map(([roleId, userIds]) => [roleId, userIds.map(directoryUser)]),
  );
}

function buildMembershipsByUserId(
  memberIdsByGroupId: Record<string, readonly string[]>,
  memberIdsByRoleId: Record<string, readonly string[]>,
): Record<string, GraphObject[]> {
  const memberships = new Map(sampleUsers.map((item) => [String(item.id), [] as GraphObject[]]));

  for (const [groupId, userIds] of Object.entries(memberIdsByGroupId)) {
    for (const userId of userIds) {
      memberships.get(userId)?.push(directoryGroup(groupId));
    }
  }

  for (const [roleId, userIds] of Object.entries(memberIdsByRoleId)) {
    for (const userId of userIds) {
      memberships.get(userId)?.push(directoryRoleRef(roleId));
    }
  }

  return Object.fromEntries([...memberships.entries()].filter(([, values]) => values.length > 0));
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
