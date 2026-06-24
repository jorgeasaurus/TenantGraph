import type { ReactNode } from 'react';
import { VercelAnalytics } from './analytics/VercelAnalytics';

export function AppRoot({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      {children}
      <VercelAnalytics />
    </>
  );
}
