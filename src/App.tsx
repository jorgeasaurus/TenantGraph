import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { MissingConfigScreen, SignInScreen } from './components/auth/SignInScreen';
import { AppShell } from './components/layout/AppShell';
import { hasMsalConfig, missingEnvVars } from './auth/msal';

export default function App() {
  if (!hasMsalConfig) {
    return <MissingConfigScreen missing={missingEnvVars} />;
  }

  return (
    <>
      <AuthenticatedTemplate>
        <AppShell />
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <SignInScreen />
      </UnauthenticatedTemplate>
    </>
  );
}
