import { describe, expect, it, vi } from 'vitest';
import { signOutWithMicrosoft } from './auth/signOut';

describe('signOutWithMicrosoft', () => {
  it('delegates live tenant sign-out to MSAL logoutRedirect', () => {
    const logoutRedirect = vi.fn();

    signOutWithMicrosoft({ logoutRedirect });

    expect(logoutRedirect).toHaveBeenCalledTimes(1);
  });
});
