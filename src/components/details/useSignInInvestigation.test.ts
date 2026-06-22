import { describe, expect, it } from 'vitest';
import { GraphError } from '../../graph/client';
import { signInErrorMessage } from './useSignInInvestigation';

describe('signInErrorMessage', () => {
  it('explains missing audit-log and Conditional Access permissions', () => {
    expect(signInErrorMessage(new GraphError(403, 'Forbidden', 'Authorization_RequestDenied'))).toBe(
      'Missing sign-in log access. Grant AuditLog.Read.All and use an account with Reports Reader or Security Reader. CA details also require Policy.Read.ConditionalAccess.',
    );
  });
});
