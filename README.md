# Tenant Graph

Visualize Intune and Entra relationships as an interactive Three.js graph.

![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![Vite](https://img.shields.io/badge/Vite-8-646cff)
![Microsoft Graph](https://img.shields.io/badge/Microsoft%20Graph-Intune%20%2B%20Entra-00a4ef)

![Tenant Graph workspace](docs/tenant-graph-screenshot.png)

Tenant Graph helps tenant admins, endpoint engineers, and security reviewers understand Microsoft Intune impact. Sign in with Microsoft Entra ID, search for a user, device, app, group, role, or policy, then explore related assignments and dependencies in an Obsidian-style graph.

## Install

Prerequisites:

- Node.js `^20.19.0` or `>=22.12.0`
- Microsoft Entra tenant with Intune data
- Azure app registration configured as a single-page application

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Configuration

Set these values in `.env`:

```bash
VITE_AAD_CLIENT_ID=<app-registration-client-id>
VITE_AAD_TENANT_ID=<tenant-id>
VITE_REDIRECT_URI=http://localhost:5173
```

`VITE_REDIRECT_URI` must exactly match a SPA redirect URI on the Entra app registration. Do not add or use `/auth/popup-callback.html`.

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
- Supported account type: single tenant
- Client secret: not required
- API permissions: delegated Microsoft Graph permissions

Required delegated scopes:

```text
User.Read
User.Read.All
Group.Read.All
GroupMember.Read.All
RoleManagement.Read.Directory
AuditLog.Read.All
Policy.Read.ConditionalAccess
DeviceManagementManagedDevices.Read.All
DeviceManagementApps.Read.All
DeviceManagementConfiguration.Read.All
DeviceManagementServiceConfig.Read.All
DeviceManagementRBAC.Read.All
```

Grant admin consent so Tenant Graph can read tenant-wide Intune, directory, and sign-in data. `AuditLog.Read.All` powers sign-in status; `Policy.Read.ConditionalAccess` is requested only when CA policy names and controls are enabled in the Sign-ins panel. The signed-in user still needs an Entra role that can read sign-in logs, such as Reports Reader or Security Reader.

## Usage

```bash
npm run dev
```

Then:

1. Sign in with Microsoft Entra ID.
2. Search for an Intune or Entra object.
3. Select a node to pin details.
4. Click `Expand` to load related objects.
5. Use focus, filters, depth, and friendly-name controls to reduce noise.

Expected result: a responsive dark workspace with a Three.js graph, semantic clusters, relationship styling, object icons, profile/app images when available, and permission warnings when Graph access is incomplete.

## Features

- Map Intune impact across people, devices, groups, apps, policies, filters, scope tags, and roles.
- Expand relationships progressively so large tenants stay usable.
- Cap large object lists by default and load more on demand.
- Highlight selected-object constellations with readable relationship context.
- Investigate recent sign-ins and whether Conditional Access applied, blocked, or stayed report-only.
- Show app icons and user profile photos when Microsoft Graph provides them.
- Fall back cleanly when permissions, photos, or optional Intune data are unavailable.
- Keep Microsoft Graph response details behind typed adapters.

## Data Model

Graph adapters normalize Microsoft Graph responses before UI rendering:

```ts
type TenantNode = {
  id: string;
  type: string;
  label: string;
  subtitle?: string;
  raw?: unknown;
};

type TenantEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
};

type TenantGraph = {
  nodes: TenantNode[];
  edges: TenantEdge[];
};
```

## Project Layout

```text
src/auth/              MSAL setup and token helpers
src/graph/             Microsoft Graph client, adapters, expansion, media hydration
src/models/            Tenant graph types
src/components/graph/  Three.js canvas, graph objects, overlays
src/components/layout/ Workspace shell, toolbar, sidebar
src/components/details/Readable details, evidence, path panels
src/utils/             Graph transforms and readable summaries
```

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
- Directory roles show IDs: confirm `RoleManagement.Read.Directory` is granted.
- Sign-in logs fail: grant `AuditLog.Read.All` and use an account with Reports Reader or Security Reader.
- CA policy names are missing: grant `Policy.Read.ConditionalAccess`, enable policy names in the Sign-ins panel, and use an account that can read Conditional Access.
- User photo `404`: expected when no profile photo exists; Tenant Graph falls back to the user icon.

## Security Notes

- No client IDs, tenant IDs, secrets, or tokens should be committed.
- This is a browser-only SPA; it does not require a client secret.
- MSAL stores auth state in `sessionStorage`.
- Microsoft Graph access is delegated to the signed-in user and granted scopes.

## License

No license file is currently included.
