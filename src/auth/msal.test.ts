import { describe, expect, it } from 'vitest';
import {
  conditionalAccessDetailScopes,
  createAdminConsentUrl,
  createMsalConfig,
  graphReadScopes,
  loginRequest,
  missingRequiredEnvVars,
  msalAuthority,
  signInLogScopes,
  tenantGraphAppScopes,
} from './msal';

describe('missingRequiredEnvVars', () => {
  it('reports the required MSAL environment variables that are not configured', () => {
    expect(
      missingRequiredEnvVars({
        VITE_AAD_CLIENT_ID: 'client-id',
        VITE_REDIRECT_URI: 'http://localhost:5173',
      }),
    ).toEqual(['VITE_AAD_TENANT_ID']);
  });
});

describe('createMsalConfig', () => {
  it('uses the Microsoft Entra organizations authority', () => {
    expect(msalAuthority).toBe('https://login.microsoftonline.com/organizations');
    expect(createMsalConfig().auth.authority).toBe(msalAuthority);
  });
});

describe('loginRequest', () => {
  it('requests the full Tenant Graph app scope set during sign-in', () => {
    const requiredScopes = [
      ...graphReadScopes,
      ...signInLogScopes,
      ...conditionalAccessDetailScopes,
    ];
    const uniqueRequiredScopes = new Set(requiredScopes);

    expect(loginRequest.scopes).toEqual(tenantGraphAppScopes);
    expect(loginRequest.scopes).toEqual(expect.arrayContaining(requiredScopes));
    expect(loginRequest.scopes).toHaveLength(uniqueRequiredScopes.size);
  });
});

describe('createAdminConsentUrl', () => {
  it('builds a v2 admin-consent URL for the configured app', () => {
    const url = new URL(
      createAdminConsentUrl({
        clientId: 'client-id',
        redirectUri: 'https://tenantgraph.com',
      }),
    );

    expect(url.origin + url.pathname).toBe('https://login.microsoftonline.com/organizations/v2.0/adminconsent');
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('redirect_uri')).toBe('https://tenantgraph.com');
    expect(url.searchParams.get('scope')).toBe('https://graph.microsoft.com/.default');
  });

  it('does not emit an admin-consent URL until client and redirect are configured', () => {
    expect(createAdminConsentUrl({ clientId: 'client-id' })).toBe('');
  });
});
