import type { Configuration } from '@azure/msal-browser';
import graphPermissions from './graphPermissions.json';

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

export const graphReadScopes = [...graphPermissions.graphReadScopes];

export const signInLogScopes = [...graphPermissions.signInLogScopes];

export const conditionalAccessDetailScopes = [...graphPermissions.conditionalAccessDetailScopes];

export const tenantGraphAppScopes = uniqueScopes([
  ...graphReadScopes,
  ...signInLogScopes,
  ...conditionalAccessDetailScopes,
]);

export const loginRequest = {
  scopes: tenantGraphAppScopes,
};

function uniqueScopes(scopes: readonly string[]): string[] {
  return [...new Set(scopes)];
}

export function createAdminConsentUrl(source: {
  clientId?: string;
  redirectUri?: string;
}): string {
  const { clientId, redirectUri } = source;

  if (!clientId || !redirectUri) {
    return '';
  }

  const url = new URL(`${msalAuthority}/v2.0/adminconsent`);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'https://graph.microsoft.com/.default');
  return url.toString();
}

export const adminConsentUrl = createAdminConsentUrl({
  clientId: env.VITE_AAD_CLIENT_ID,
  redirectUri: configuredRedirectUri,
});

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
