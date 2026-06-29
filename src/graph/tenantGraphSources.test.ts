import { describe, expect, it } from 'vitest';
import { loginRequest } from '../auth/msal';
import { mockGraphClient } from '../test/mockGraphClient';
import { loadTenantOverview } from './tenantGraphSources';
import type { GraphVersion } from './client';

describe('loadTenantOverview', () => {
  it('loads the signed-in user and capped default Intune/Entra overview sources', async () => {
    const getCalls: string[] = [];
    const pagedCalls: Array<{ path: string; version: GraphVersion | undefined }> = [];
    const mediaCalls: string[] = [];

    const client = mockGraphClient({
      async get<T>(path: string, scopes?: string[]): Promise<T> {
        getCalls.push(path);
        expect(scopes).toBe(loginRequest.scopes);
        return {
          id: 'user-me',
          displayName: 'Signed In User',
          userPrincipalName: 'signed.in@example.com',
        } as T;
      },
      async getDataUrl(path: string): Promise<string> {
        mediaCalls.push(path);
        return 'data:image/jpeg;base64,cGhvdG8=';
      },
      async getPaged<T>(
        path: string,
        _scopes?: string[],
        version?: GraphVersion,
      ): Promise<T[]> {
        pagedCalls.push({ path, version });
        return [] as T[];
      },
    });

    const result = await loadTenantOverview(client);

    expect(result.warnings).toEqual([]);
    expect(getCalls).toEqual(['/me?$select=id,displayName,userPrincipalName,mail,jobTitle,department']);
    expect(mediaCalls).toEqual(['/users/user-me/photos/48x48/$value']);
    expect(pagedCalls).toEqual([
      {
        path: '/deviceManagement/managedDevices?$top=50&$select=id,deviceName,userPrincipalName,userId,operatingSystem,complianceState,managementAgent,manufacturer,model,azureADDeviceId',
        version: undefined,
      },
      {
        path: '/groups?$top=25&$select=id,displayName,mailNickname,securityEnabled,groupTypes',
        version: undefined,
      },
      {
        path: '/deviceAppManagement/mobileApps?$top=50&$select=id,displayName,publisher',
        version: 'v1.0',
      },
      {
        path: '/deviceManagement/deviceCompliancePolicies?$top=50',
        version: 'v1.0',
      },
      {
        path: '/deviceManagement/deviceConfigurations?$top=50',
        version: 'v1.0',
      },
      {
        path: '/deviceManagement/configurationPolicies?$top=50',
        version: 'beta',
      },
      {
        path: '/deviceManagement/windowsAutopilotDeploymentProfiles?$top=50',
        version: 'beta',
      },
      {
        path: '/deviceManagement/assignmentFilters?$top=50',
        version: 'beta',
      },
      {
        path: '/deviceManagement/roleScopeTags?$top=50',
        version: 'beta',
      },
    ]);
    expect(result.graph.nodes).toContainEqual(
      expect.objectContaining({
        id: 'user:user-me',
        label: 'Signed In User',
      }),
    );
  });
});
