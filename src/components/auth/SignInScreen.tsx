import { useMsal } from '@azure/msal-react';
import { Network, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { loginRequest } from '../../auth/msal';
import { signInErrorMessage } from '../../auth/signInErrors';
import { VantaNetBackground } from './VantaNetBackground';

export function MissingConfigScreen({ missing }: { missing: readonly string[] }) {
  return (
    <main className="signin-screen">
      <VantaNetBackground />
      <section className="signin-panel">
        <div className="brand-mark">
          <Network size={28} />
        </div>
        <h1>Tenant Graph</h1>
        <p>Set the required MSAL environment variables before signing in.</p>
        <div className="env-list">
          {missing.map((key) => (
            <code key={key}>{key}</code>
          ))}
        </div>
      </section>
    </main>
  );
}

export function SignInScreen() {
  const { instance } = useMsal();
  const [authError, setAuthError] = useState('');

  const signIn = async () => {
    setAuthError('');

    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      setAuthError(signInErrorMessage(error));
    }
  };

  return (
    <main className="signin-screen">
      <VantaNetBackground />
      <section className="signin-panel">
        <div className="brand-mark">
          <Network size={30} />
        </div>
        <p className="eyebrow">Microsoft Intune relationship map</p>
        <h1>Tenant Graph</h1>
        <p>Sign in with Microsoft Entra ID to inspect Intune objects and their assignments.</p>
        <button className="primary-action" type="button" onClick={() => void signIn()}>
          <ShieldCheck size={18} />
          Sign in
        </button>
        {authError && (
          <p className="auth-error" role="alert">
            {authError}
          </p>
        )}
      </section>
    </main>
  );
}
