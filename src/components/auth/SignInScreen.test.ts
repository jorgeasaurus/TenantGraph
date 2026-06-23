import { describe, expect, it } from 'vitest';
import { signInErrorMessage } from '../../auth/signInErrors';
import { accessRequirementItems, tenantGraphGitHubUrl } from './accessResources';

describe('signInErrorMessage', () => {
  it('shows a retry-safe message when the popup is canceled', () => {
    expect(signInErrorMessage(new Error('user_cancelled: user closed the popup'))).toBe(
      'Sign-in was canceled. Use Sign in when you are ready.',
    );
  });

  it('keeps popup guidance for other sign-in failures', () => {
    expect(signInErrorMessage(new Error('popup blocked'))).toBe(
      'Sign-in failed. Check popup settings and try again.',
    );
  });
});

describe('landing access resources', () => {
  it('documents live-tenant access requirements and the project repository', () => {
    expect(tenantGraphGitHubUrl).toBe('https://github.com/jorgeasaurus/TenantGraph');
    expect(accessRequirementItems).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Microsoft Entra app registration'),
        expect.stringContaining('Microsoft Graph consent'),
        expect.stringContaining('Reports Reader or Security Reader'),
        expect.stringContaining('Policy.Read.ConditionalAccess'),
      ]),
    );
  });
});
