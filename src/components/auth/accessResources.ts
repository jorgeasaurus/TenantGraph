export const tenantGraphGitHubUrl = 'https://github.com/jorgeasaurus/TenantGraph';

export const accessRequirementItems = [
  'Microsoft Entra app registration configured as a SPA with this site as a redirect URI.',
  'Delegated Microsoft Graph consent for Intune, directory, role, and sign-in log reads.',
  'A signed-in account with permission to read Intune objects; sign-in logs require Reports Reader or Security Reader.',
  'Conditional Access policy names and controls require Policy.Read.ConditionalAccess.',
] as const;
