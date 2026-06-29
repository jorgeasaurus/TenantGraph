import { describe, expect, it, vi } from 'vitest';
import { signOutWithMicrosoft } from './auth/signOut';

describe('signOutWithMicrosoft', () => {
  it('delegates live tenant sign-out to MSAL logoutRedirect', () => {
    const logoutRedirect = vi.fn();

    signOutWithMicrosoft({ logoutRedirect });

    expect(logoutRedirect).toHaveBeenCalledTimes(1);
  });

  it('handles rejected MSAL logout redirects', async () => {
    const signOutError = new Error('popup blocked');
    const onError = vi.fn();

    signOutWithMicrosoft({ logoutRedirect: () => Promise.reject(signOutError) }, onError);
    await Promise.resolve();

    expect(onError).toHaveBeenCalledWith(signOutError);
  });
});
