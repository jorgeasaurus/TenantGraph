import { describe, expect, it } from 'vitest';
import { scrubAnalyticsUrl } from './analyticsUrl';

describe('scrubAnalyticsUrl', () => {
  it('removes Microsoft Entra callback parameters and URL fragments', () => {
    expect(
      scrubAnalyticsUrl(
        'https://tenantgraph.com/?code=auth-code&state=opaque-state&session_state=session-id&sampleTenant=1#token-fragment',
      ),
    ).toBe('https://tenantgraph.com/?sampleTenant=1');
  });

  it('keeps ordinary product URLs unchanged', () => {
    const url = 'https://tenantgraph.com/?sampleTenant=1';

    expect(scrubAnalyticsUrl(url)).toBe(url);
  });
});
