import { EventType, PublicClientApplication, type AuthenticationResult } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppRoot } from './AppRoot';
import { configuredRedirectOrigin, createMsalConfig, hasMsalConfig } from './auth/msal';
import './styles.css';

const root = createRoot(document.getElementById('root') as HTMLElement);

if (!hasMsalConfig) {
  root.render(
    <StrictMode>
      <AppRoot>
        <App />
      </AppRoot>
    </StrictMode>,
  );
} else {
  if (configuredRedirectOrigin && window.location.origin !== configuredRedirectOrigin) {
    window.location.replace(
      `${configuredRedirectOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  } else {
    const msalInstance = new PublicClientApplication(createMsalConfig());

    msalInstance.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const authResult = event.payload as AuthenticationResult;
        msalInstance.setActiveAccount(authResult.account);
      }
    });

    await msalInstance.initialize();

    const existingAccount = msalInstance.getAllAccounts()[0];
    if (existingAccount && !msalInstance.getActiveAccount()) {
      msalInstance.setActiveAccount(existingAccount);
    }

    root.render(
      <StrictMode>
        <AppRoot>
          <MsalProvider instance={msalInstance}>
            <App />
          </MsalProvider>
        </AppRoot>
      </StrictMode>,
    );
  }
}
