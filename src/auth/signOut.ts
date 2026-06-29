export function signOutWithMicrosoft(
  instance: { logoutRedirect: () => Promise<unknown> | unknown },
  onError: (error: unknown) => void = reportSignOutFailure,
): void {
  try {
    void Promise.resolve(instance.logoutRedirect()).catch(onError);
  } catch (error) {
    onError(error);
  }
}

function reportSignOutFailure(error: unknown): void {
  console.error('Microsoft sign-out failed.', error);
}
