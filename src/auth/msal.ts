import type { Configuration } from '@azure/msal-browser';

const env = import.meta.env;

const requiredEnvVars = [
  'VITE_AAD_CLIENT_ID',
  'VITE_AAD_TENANT_ID',
  'VITE_REDIRECT_URI',
] as const;

export function missingRequiredEnvVars(source: Record<string, string | undefined>): string[] {
  return requiredEnvVars.filter((key) => !source[key]);
}

export const missingEnvVars = missingRequiredEnvVars(env);
export const hasMsalConfig = missingEnvVars.length === 0;
const configuredRedirectUri = env.VITE_REDIRECT_URI || '';
export const configuredRedirectOrigin = configuredRedirectUri
  ? new URL(configuredRedirectUri).origin
  : '';
export const msalAuthority = 'https://login.microsoftonline.com/organizations';

export const loginRequest = {
  scopes: ['User.Read'],
};

export const graphReadScopes = [
  'User.Read',
  'User.Read.All',
  'Group.Read.All',
  'GroupMember.Read.All',
  'RoleManagement.Read.Directory',
  'DeviceManagementManagedDevices.Read.All',
  'DeviceManagementApps.Read.All',
  'DeviceManagementConfiguration.Read.All',
  'DeviceManagementServiceConfig.Read.All',
  'DeviceManagementRBAC.Read.All',
];

export const signInLogScopes = [
  'AuditLog.Read.All',
];

export const conditionalAccessDetailScopes = [
  'Policy.Read.ConditionalAccess',
];

export function createMsalConfig(): Configuration {
  return {
    auth: {
      clientId: env.VITE_AAD_CLIENT_ID,
      authority: msalAuthority,
      redirectUri: configuredRedirectUri,
      postLogoutRedirectUri: configuredRedirectUri,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  };
}
