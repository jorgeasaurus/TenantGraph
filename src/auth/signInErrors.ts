export function signInErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const errorCode =
    typeof error === 'object' && error !== null && 'errorCode' in error
      ? String((error as { errorCode?: unknown }).errorCode ?? '')
      : '';
  const normalized = `${errorCode} ${message}`.toLowerCase();

  if (normalized.includes('user_cancelled')) {
    return 'Sign-in was canceled. Use Sign in with Microsoft when you are ready.';
  }

  return 'Sign-in failed. Check popup settings and try again.';
}
