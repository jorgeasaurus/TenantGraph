import { Analytics, type BeforeSendEvent } from '@vercel/analytics/react';
import type { ReactNode } from 'react';
import { scrubAnalyticsUrl } from './analyticsUrl';

function beforeSend(event: BeforeSendEvent): BeforeSendEvent {
  return {
    ...event,
    url: scrubAnalyticsUrl(event.url),
  };
}

export function VercelAnalytics(): ReactNode {
  return <Analytics beforeSend={beforeSend} />;
}
