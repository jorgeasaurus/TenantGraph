const authCallbackParams = new Set([
  'client_info',
  'code',
  'error',
  'error_description',
  'session_state',
  'state',
]);

export function scrubAnalyticsUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    let changed = false;

    for (const param of authCallbackParams) {
      if (parsedUrl.searchParams.has(param)) {
        parsedUrl.searchParams.delete(param);
        changed = true;
      }
    }

    if (parsedUrl.hash) {
      parsedUrl.hash = '';
      changed = true;
    }

    return changed ? parsedUrl.toString() : url;
  } catch {
    return url;
  }
}
