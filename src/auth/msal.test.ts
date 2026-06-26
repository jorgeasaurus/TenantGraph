import { describe, expect, it } from 'vitest';
import { createMsalConfig, missingRequiredEnvVars, msalAuthority } from './msal';

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
