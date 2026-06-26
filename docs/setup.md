# Tenant Graph Setup

Run Tenant Graph locally against a Microsoft Entra tenant with Intune data.

## Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- Microsoft Entra tenant with Intune data
- Azure app registration configured as a single-page application

## Local Install

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

Sample tenant mode does not require Entra sign-in:

```bash
open "http://localhost:5173/?sampleTenant=1"
```

## Environment

Set these values in `.env`:

```bash
VITE_AAD_CLIENT_ID=<app-registration-client-id>
VITE_AAD_TENANT_ID=<tenant-id>
VITE_REDIRECT_URI=http://localhost:5173
```

Tenant Graph signs users in through `https://login.microsoftonline.com/organizations`. `VITE_REDIRECT_URI` must exactly match a SPA redirect URI on the Entra app registration. Do not add or use `/auth/popup-callback.html`.

## Azure App Registration

Fast path:

```powershell
./New-TenantGraphAppRegistration.ps1 `
  -TenantId <tenant-id> `
  -SpaRedirectUri http://localhost:5173 `
  -GrantAdminConsent `
  -InstallMissingModules
```

Manual setup:

- Platform: Single-page application
- Redirect URI: `http://localhost:5173`
- Supported account type: accounts in any organizational directory
- Client secret: not required
- API permissions: delegated Microsoft Graph permissions

Required delegated scopes are defined in `src/auth/graphPermissions.json`. The app registration script reads that same file so sign-in, setup, and documentation stay aligned.

Grant admin consent so Tenant Graph can read tenant-wide Intune, directory, Conditional Access, and sign-in data. The signed-in user still needs an Entra role that can read sign-in logs, such as Reports Reader or Security Reader.

For a new tenant, sign in with an account that can grant admin consent, or open the generated admin consent URL from `New-TenantGraphAppRegistration.ps1`. The URL uses `https://graph.microsoft.com/.default` so it grants the Microsoft Graph delegated permissions configured on the app registration.

## Development

```bash
npm run lint
npm run test
npm run build
npm run preview
```

`npm run build` runs TypeScript first, then creates the Vite production build.

## Troubleshooting

- Redirect mismatch: add the exact `VITE_REDIRECT_URI` value as a SPA redirect URI.
- Sign-in popup blocked: allow popups for `localhost:5173`.
- Empty graph: confirm Intune data exists and admin consent was granted.
- Permission banner: grant the listed Microsoft Graph permission, then sign out and sign in again.
- New tenant only consents to `User.Read`: confirm the app registration has the required API permissions, then use the admin consent URL.
- Directory roles show IDs: confirm `RoleManagement.Read.Directory` is granted.
- Sign-in logs fail: grant `AuditLog.Read.All` and use an account with Reports Reader or Security Reader.
- CA policy names are missing: grant `Policy.Read.ConditionalAccess`, enable policy names in the Sign-ins panel, and use an account that can read Conditional Access.
- User photo `404`: expected when no profile photo exists; Tenant Graph falls back to the user icon.

## Security Notes

- No client IDs, tenant IDs, secrets, or tokens should be committed.
- This is a browser-only SPA; it does not require a client secret.
- MSAL stores auth state in `sessionStorage`.
- Microsoft Graph access is delegated to the signed-in user and granted scopes.
