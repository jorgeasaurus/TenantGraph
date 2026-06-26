import { useMsal } from '@azure/msal-react';
import { ExternalLink, Github, Info, Network, PlayCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { loginRequest } from '../../auth/msal';
import { signInErrorMessage } from '../../auth/signInErrors';
import { accessRequirementItems, tenantGraphGitHubUrl } from './accessResources';
import { VantaNetBackground } from './VantaNetBackground';

type AuthScreenProps = {
  adminConsentUrl: string;
  onOpenSampleTenant: () => void;
};

export function MissingConfigScreen({
  adminConsentUrl,
  missing,
  onOpenSampleTenant,
}: {
  adminConsentUrl: string;
  missing: readonly string[];
  onOpenSampleTenant: () => void;
}) {
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
        <div className="landing-action-stack">
          <button className="secondary-action" type="button" onClick={onOpenSampleTenant}>
            <PlayCircle size={18} />
            Sample tenant
          </button>
          <GitHubRepositoryLink />
        </div>
        <AccessResources adminConsentUrl={adminConsentUrl} />
      </section>
    </main>
  );
}

export function SignInScreen({ adminConsentUrl, onOpenSampleTenant }: AuthScreenProps) {
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
        <div className="landing-action-stack">
          <button className="primary-action" type="button" onClick={() => void signIn()}>
            <ShieldCheck size={18} />
            Sign in
          </button>
          <button className="secondary-action" type="button" onClick={onOpenSampleTenant}>
            <PlayCircle size={18} />
            Sample tenant
          </button>
          <GitHubRepositoryLink />
        </div>
        <AccessResources adminConsentUrl={adminConsentUrl} />
        {authError && (
          <p className="auth-error" role="alert">
            {authError}
          </p>
        )}
      </section>
    </main>
  );
}

function GitHubRepositoryLink() {
  return (
    <a className="github-action" href={tenantGraphGitHubUrl} target="_blank" rel="noreferrer">
      <Github size={18} />
      GitHub repository
    </a>
  );
}

function AccessResources({ adminConsentUrl }: { adminConsentUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="access-resources">
      <button className="ghost-action" type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <Info size={17} />
        Access requirements
      </button>
      {open && (
        <div className="access-requirements">
          <p>To connect a live tenant, Tenant Graph needs:</p>
          <ul>
            {accessRequirementItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <a href={tenantGraphGitHubUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={15} />
            GitHub repository
          </a>
          {adminConsentUrl && (
            <a href={adminConsentUrl} target="_blank" rel="noreferrer">
              <ShieldCheck size={15} />
              Grant admin consent
            </a>
          )}
        </div>
      )}
    </div>
  );
}
