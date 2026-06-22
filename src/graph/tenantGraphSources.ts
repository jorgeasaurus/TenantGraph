import { loginRequest } from '../auth/msal';
import type { TenantGraph, TenantGraphResult, TenantNodeType } from '../models/tenantGraph';
import { emptyTenantGraph } from '../models/tenantGraph';
import {
  assignmentFiltersToGraph,
  directoryRolesToGraph,
  groupsToGraph,
  managedDevicesToGraph,
  mobileAppsToGraph,
  policiesToGraph,
  scopeTagsToGraph,
  usersToGraph,
  userToNode,
  type GraphObject,
} from './adapters';
import { GraphError, type GraphClient, type GraphVersion } from './client';
import { collectGraphs } from './graphCalls';
import { hydrateResultMedia } from './mediaEnrichment';
import { localMatch, odataFilter } from './query';

export const directoryRolesListPath = '/directoryRoles?$select=id,displayName,description,roleTemplateId';

const overviewSources = [
  {
    label: 'signed-in user',
    run: async (client: GraphClient) => ({
      nodes: [
        userToNode(
          await client.get<GraphObject>(
            '/me?$select=id,displayName,userPrincipalName,mail,jobTitle,department',
            loginRequest.scopes,
          ),
        ),
      ],
      edges: [],
    }),
  },
  {
    label: 'managed devices',
    run: async (client: GraphClient) =>
      managedDevicesToGraph(
        await client.getPaged<GraphObject>(
          '/deviceManagement/managedDevices?$top=50&$select=id,deviceName,userPrincipalName,userId,operatingSystem,complianceState,managementAgent,manufacturer,model,azureADDeviceId',
        ),
      ),
  },
  {
    label: 'mobile apps',
    run: async (client: GraphClient) =>
      mobileAppsToGraph(
        await mobileAppObjects(
          client,
          '/deviceAppManagement/mobileApps?$top=50&$select=id,displayName,publisher',
          '/deviceAppManagement/mobileApps?$top=50',
        ),
      ),
  },
  policySource('compliance policies', 'compliancePolicy', '/deviceManagement/deviceCompliancePolicies?$top=50'),
  policySource(
    'device configuration profiles',
    'deviceConfigurationProfile',
    '/deviceManagement/deviceConfigurations?$top=50',
  ),
  policySource(
    'settings catalog policies',
    'settingsCatalogPolicy',
    '/deviceManagement/configurationPolicies?$top=50',
    'beta',
  ),
  policySource(
    'enrollment profiles',
    'enrollmentProfile',
    '/deviceManagement/windowsAutopilotDeploymentProfiles?$top=50',
    'beta',
  ),
  {
    label: 'assignment filters',
    run: async (client: GraphClient) =>
      assignmentFiltersToGraph(
        await client.getPaged<GraphObject>(
          '/deviceManagement/assignmentFilters?$top=50',
          undefined,
          'beta',
        ),
      ),
  },
  {
    label: 'scope tags',
    run: async (client: GraphClient) =>
      scopeTagsToGraph(
        await client.getPaged<GraphObject>(
          '/deviceManagement/roleScopeTags?$top=50',
          undefined,
          'beta',
        ),
      ),
  },
] satisfies SourceDefinition[];

function tenantOverviewCalls(client: GraphClient): SourceCall[] {
  return overviewSources.map((source) => bindSource(client, source));
}

export async function loadTenantOverview(client: GraphClient): Promise<TenantGraphResult> {
  return hydrateResultMedia(client, await collectGraphs(tenantOverviewCalls(client)));
}

function tenantSearchCalls(client: GraphClient, query: string, types: string[]): SourceCall[] {
  const term = query.trim();
  const selected = new Set(types);

  return searchSources(term)
    .filter((source) => selected.has(source.type))
    .map((source) => bindSource(client, source));
}

export async function searchTenantObjects(
  client: GraphClient,
  query: string,
  types: string[],
): Promise<TenantGraphResult> {
  if (!query.trim()) {
    return { graph: emptyTenantGraph, warnings: [] };
  }

  return hydrateResultMedia(client, await collectGraphs(tenantSearchCalls(client, query, types)));
}

type SourceDefinition = {
  label: string;
  run: (client: GraphClient) => Promise<TenantGraph>;
};

type SourceCall = {
  label: string;
  run: () => Promise<TenantGraph>;
};

type SearchSourceDefinition = SourceDefinition & {
  type: TenantNodeType;
};

function searchSources(term: string): SearchSourceDefinition[] {
  return [
    {
      type: 'user',
      label: 'users',
      run: async (client) =>
        usersToGraph(
          await client.getPaged<GraphObject>(
            `/users?$top=25&$select=id,displayName,userPrincipalName,mail,jobTitle,department&$filter=${odataFilter(
              ['displayName', 'userPrincipalName', 'mail'],
              term,
            )}`,
          ),
        ),
    },
    {
      type: 'group',
      label: 'groups',
      run: async (client) =>
        groupsToGraph(
          await client.getPaged<GraphObject>(
            `/groups?$top=25&$select=id,displayName,mailNickname,securityEnabled,groupTypes&$filter=${odataFilter(
              ['displayName', 'mailNickname'],
              term,
            )}`,
          ),
        ),
    },
    {
      type: 'directoryRole',
      label: 'directory roles',
      run: async (client) =>
        directoryRolesToGraph(
          localMatch(await client.getPaged<GraphObject>(directoryRolesListPath), term, [
            'displayName',
            'description',
            'roleTemplateId',
          ]),
        ),
    },
    {
      type: 'device',
      label: 'managed devices',
      run: async (client) =>
        managedDevicesToGraph(
          localMatch(
            await client.getPaged<GraphObject>(
              '/deviceManagement/managedDevices?$top=100&$select=id,deviceName,userPrincipalName,userId,operatingSystem,complianceState,managementAgent,manufacturer,model,azureADDeviceId',
            ),
            term,
            ['deviceName', 'userPrincipalName', 'operatingSystem'],
          ),
        ),
    },
    {
      type: 'app',
      label: 'mobile apps',
      run: async (client) =>
        mobileAppsToGraph(
          localMatch(
            await mobileAppObjects(
              client,
              '/deviceAppManagement/mobileApps?$top=100&$select=id,displayName,publisher',
              '/deviceAppManagement/mobileApps?$top=100',
            ),
            term,
            ['displayName', 'publisher'],
          ),
        ),
    },
    searchPolicySource('compliancePolicy', 'compliance policies', '/deviceManagement/deviceCompliancePolicies?$top=100', term),
    searchPolicySource(
      'deviceConfigurationProfile',
      'device configuration profiles',
      '/deviceManagement/deviceConfigurations?$top=100',
      term,
    ),
    searchPolicySource(
      'settingsCatalogPolicy',
      'settings catalog policies',
      '/deviceManagement/configurationPolicies?$top=100',
      term,
      'beta',
    ),
    searchPolicySource(
      'enrollmentProfile',
      'enrollment profiles',
      '/deviceManagement/windowsAutopilotDeploymentProfiles?$top=100',
      term,
      'beta',
    ),
    {
      type: 'assignmentFilter',
      label: 'assignment filters',
      run: async (client) =>
        assignmentFiltersToGraph(
          localMatch(
            await client.getPaged<GraphObject>(
              '/deviceManagement/assignmentFilters?$top=100',
              undefined,
              'beta',
            ),
            term,
            ['displayName', 'platform', 'rule'],
          ),
        ),
    },
    {
      type: 'scopeTag',
      label: 'scope tags',
      run: async (client) =>
        scopeTagsToGraph(
          localMatch(
            await client.getPaged<GraphObject>(
              '/deviceManagement/roleScopeTags?$top=100',
              undefined,
              'beta',
            ),
            term,
            ['displayName', 'description'],
          ),
        ),
    },
  ];
}

function policySource(
  label: string,
  type: TenantNodeType,
  path: string,
  version: GraphVersion = 'v1.0',
): SourceDefinition {
  return {
    label,
    run: async (client) =>
      policiesToGraph(await client.getPaged<GraphObject>(path, undefined, version), type),
  };
}

function searchPolicySource(
  type: TenantNodeType,
  label: string,
  path: string,
  term: string,
  version: GraphVersion = 'v1.0',
): SearchSourceDefinition {
  return {
    type,
    label,
    run: async (client) =>
      policiesToGraph(
        localMatch(await client.getPaged<GraphObject>(path, undefined, version), term, [
          'displayName',
          'name',
          'description',
        ]),
        type,
      ),
  };
}

function bindSource(client: GraphClient, source: SourceDefinition): SourceCall {
  return {
    label: source.label,
    run: () => source.run(client),
  };
}

async function mobileAppObjects(
  client: GraphClient,
  path: string,
  fallbackPath: string,
  version: GraphVersion = 'v1.0',
): Promise<GraphObject[]> {
  try {
    return await client.getPaged<GraphObject>(path, undefined, version);
  } catch (error) {
    if (!(error instanceof GraphError) || error.status !== 400) {
      throw error;
    }

    return client.getPaged<GraphObject>(fallbackPath, undefined, version);
  }
}
