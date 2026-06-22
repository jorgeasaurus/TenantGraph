import { describe, expect, it } from 'vitest';
import { signInErrorMessage } from '../../auth/signInErrors';

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
