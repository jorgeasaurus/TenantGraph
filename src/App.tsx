import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { useMemo, useState } from 'react';
import { useGraphToken } from './auth/useGraphToken';
import { MissingConfigScreen, SignInScreen } from './components/auth/SignInScreen';
import { AppShell } from './components/layout/AppShell';
import { adminConsentUrl, hasMsalConfig, missingEnvVars } from './auth/msal';
import { signOutWithMicrosoft } from './auth/signOut';
import { createGraphClient } from './graph/client';
import { sampleTenantClient } from './demo/sampleTenantClient';

export default function App() {
  const [sampleMode, setSampleMode] = useState(() => sampleTenantRequested());
  const openSampleTenant = () => {
    setSampleTenantUrlState(true);
    setSampleMode(true);
  };
  const closeSampleTenant = () => {
    setSampleTenantUrlState(false);
    setSampleMode(false);
  };

  if (sampleMode) {
    return (
      <AppShell
        accountName="Sample tenant / Lumon"
        client={sampleTenantClient}
        isSampleTenant
        onSignOut={closeSampleTenant}
      />
    );
  }

  if (!hasMsalConfig) {
    return (
      <MissingConfigScreen
        adminConsentUrl={adminConsentUrl}
        missing={missingEnvVars}
        onOpenSampleTenant={openSampleTenant}
      />
    );
  }

  return (
    <>
      <AuthenticatedTemplate>
        <LiveAppShell />
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <SignInScreen adminConsentUrl={adminConsentUrl} onOpenSampleTenant={openSampleTenant} />
      </UnauthenticatedTemplate>
    </>
  );
}

function sampleTenantRequested(): boolean {
  return new URLSearchParams(window.location.search).get('sampleTenant') === '1';
}

function setSampleTenantUrlState(enabled: boolean): void {
  const url = new URL(window.location.href);
  if (enabled) {
    url.searchParams.set('sampleTenant', '1');
  } else {
    url.searchParams.delete('sampleTenant');
  }
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function LiveAppShell() {
  const { instance } = useMsal();
  const { account, getAccessToken } = useGraphToken();
  const client = useMemo(() => createGraphClient(getAccessToken), [getAccessToken]);

  return (
    <AppShell
      accountName={account?.name ?? account?.username ?? 'Signed in'}
      client={client}
      onSignOut={() => signOutWithMicrosoft(instance)}
    />
  );
}
