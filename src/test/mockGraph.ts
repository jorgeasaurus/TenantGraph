import type { TenantGraph } from '../models/tenantGraph';

export const mockTenantGraph: TenantGraph = {
  nodes: [
    {
      id: 'user:me',
      type: 'user',
      label: 'Adele Vance',
      subtitle: 'Global Endpoint Admin',
      metadata: { upn: 'adele@example.com' },
    },
    {
      id: 'device:surface-01',
      type: 'device',
      label: 'SURFACE-01',
      subtitle: 'Windows compliant',
      metadata: { os: 'Windows', compliance: 'compliant' },
    },
    {
      id: 'group:intune-admins',
      type: 'group',
      label: 'Intune Admin Devices',
      subtitle: 'Security group',
    },
    {
      id: 'app:company-portal',
      type: 'app',
      label: 'Company Portal',
      subtitle: 'Microsoft Store app',
    },
    {
      id: 'compliancePolicy:windows-baseline',
      type: 'compliancePolicy',
      label: 'Windows compliance baseline',
      subtitle: 'Assigned',
    },
  ],
  edges: [
    {
      id: 'user:me->device:surface-01:primaryUser',
      source: 'user:me',
      target: 'device:surface-01',
      type: 'primaryUser',
      label: 'Primary user',
    },
    {
      id: 'user:me->group:intune-admins:memberOf',
      source: 'user:me',
      target: 'group:intune-admins',
      type: 'memberOf',
      label: 'Member of',
    },
    {
      id: 'group:intune-admins->app:company-portal:assignment',
      source: 'group:intune-admins',
      target: 'app:company-portal',
      type: 'assignment',
      label: 'Required',
    },
    {
      id: 'group:intune-admins->compliancePolicy:windows-baseline:assignment',
      source: 'group:intune-admins',
      target: 'compliancePolicy:windows-baseline',
      type: 'assignment',
      label: 'Assigned',
    },
  ],
};
