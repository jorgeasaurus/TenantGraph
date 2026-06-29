export function signOutWithMicrosoft(instance: { logoutRedirect: () => Promise<unknown> | unknown }): void {
  void instance.logoutRedirect();
}
