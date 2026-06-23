import type { GraphObject } from '../graph/adapters';
import { GraphError, type GraphClient, type GraphPage } from '../graph/client';
import type { GraphSignIn } from '../graph/signInLogAdapter';
import {
  sampleAssignmentFilters,
  sampleAssignmentsByOwnerId,
  sampleCompliancePolicies,
  sampleCurrentUserId,
  sampleDetectedAppsByDeviceId,
  sampleDeviceConfigurations,
  sampleDirectoryRoles,
  sampleEnrollmentProfiles,
  sampleGroups,
  sampleManagedDevices,
  sampleMembersByDirectoryRoleId,
  sampleMembersByGroupId,
  sampleMembershipsByUserId,
  sampleMobileApps,
  sampleScopeTags,
  sampleSettingsCatalogPolicies,
  sampleSignIns,
  sampleUserPhotoDataUrl,
  sampleUsers,
} from './sampleTenantData';

type SampleRoute = {
  pathname: string;
  searchParams: URLSearchParams;
};

export const sampleTenantClient = createSampleTenantClient();

function createSampleTenantClient(): GraphClient {
  return {
    async get<T>(path: string): Promise<T> {
      const route = parseRoute(path);
      if (route.pathname === '/me') {
        return clone(findById(sampleUsers, sampleCurrentUserId)) as T;
      }

      const mobileAppDetail = route.pathname.match(/^\/deviceAppManagement\/mobileApps\/([^/]+)$/);
      if (mobileAppDetail) {
        return clone(findById(sampleMobileApps, decodeURIComponent(mobileAppDetail[1]))) as T;
      }

      throw new GraphError(404, `Sample tenant has no object route for ${path}`, 'NotFound');
    },

    async getDataUrl(path: string): Promise<string> {
      const route = parseRoute(path);
      const userPhoto = route.pathname.match(/^\/users\/([^/]+)\/photos\/48x48\/\$value$/);
      if (userPhoto) {
        return sampleUserPhotoDataUrl(decodeURIComponent(userPhoto[1]));
      }

      throw new GraphError(404, `Sample tenant has no media route for ${path}`, 'NotFound');
    },

    async getPage<T>(
      path: string,
    ): Promise<GraphPage<T>> {
      const route = parseRoute(path);
      if (route.pathname === '/auditLogs/signIns') {
        return { value: clone(sampleSignIns) as T[] };
      }

      return { value: clone(routePaged(route)) as T[] };
    },

    async getPaged<T>(
      path: string,
    ): Promise<T[]> {
      return clone(routePaged(parseRoute(path))) as T[];
    },
  };
}

function routePaged(route: SampleRoute): GraphObject[] | GraphSignIn[] {
  const { pathname } = route;

  if (pathname === '/users') {
    return filterBySearch(sampleUsers, route, ['displayName', 'userPrincipalName', 'mail']);
  }
  if (pathname === '/groups') {
    return filterBySearch(sampleGroups, route, ['displayName', 'mailNickname']);
  }
  if (pathname === '/directoryRoles') {
    return filterBySearch(sampleDirectoryRoles, route, ['displayName', 'description', 'roleTemplateId']);
  }
  if (pathname === '/deviceManagement/managedDevices') {
    return filterDevices(route);
  }
  if (pathname === '/deviceAppManagement/mobileApps') {
    return filterBySearch(sampleMobileApps, route, ['displayName', 'publisher']);
  }
  if (pathname === '/deviceManagement/deviceCompliancePolicies') {
    return filterBySearch(sampleCompliancePolicies, route, ['displayName', 'description']);
  }
  if (pathname === '/deviceManagement/deviceConfigurations') {
    return filterBySearch(sampleDeviceConfigurations, route, ['displayName', 'description']);
  }
  if (pathname === '/deviceManagement/configurationPolicies') {
    return filterBySearch(sampleSettingsCatalogPolicies, route, ['displayName', 'description']);
  }
  if (pathname === '/deviceManagement/windowsAutopilotDeploymentProfiles') {
    return filterBySearch(sampleEnrollmentProfiles, route, ['displayName', 'description']);
  }
  if (pathname === '/deviceManagement/assignmentFilters') {
    return filterBySearch(sampleAssignmentFilters, route, ['displayName', 'platform', 'rule']);
  }
  if (pathname === '/deviceManagement/roleScopeTags') {
    return filterBySearch(sampleScopeTags, route, ['displayName', 'description']);
  }

  const managedDeviceUsers = pathname.match(/^\/deviceManagement\/managedDevices\/([^/]+)\/users$/);
  if (managedDeviceUsers) {
    const device = findById(sampleManagedDevices, decodeURIComponent(managedDeviceUsers[1]));
    const userId = text(device, 'userId');
    return userId && userId !== '00000000-0000-0000-0000-000000000000' ? [findById(sampleUsers, userId)] : [];
  }

  const detectedApps = pathname.match(/^\/deviceManagement\/managedDevices\/([^/]+)\/detectedApps$/);
  if (detectedApps) {
    return sampleDetectedAppsByDeviceId[decodeURIComponent(detectedApps[1])] ?? [];
  }

  const userMemberships = pathname.match(/^\/users\/([^/]+)\/memberOf$/);
  if (userMemberships) {
    return sampleMembershipsByUserId[decodeURIComponent(userMemberships[1])] ?? [];
  }

  const groupMembers = pathname.match(/^\/groups\/([^/]+)\/members$/);
  if (groupMembers) {
    return sampleMembersByGroupId[decodeURIComponent(groupMembers[1])] ?? [];
  }

  const roleMembers = pathname.match(/^\/directoryRoles\/([^/]+)\/members$/);
  if (roleMembers) {
    return sampleMembersByDirectoryRoleId[decodeURIComponent(roleMembers[1])] ?? [];
  }

  const assignmentOwner = assignmentOwnerId(pathname);
  if (assignmentOwner) {
    return sampleAssignmentsByOwnerId[assignmentOwner] ?? [];
  }

  if (pathname === '/auditLogs/signIns') {
    return sampleSignIns;
  }

  throw new GraphError(404, `Sample tenant has no collection route for ${pathname}`, 'NotFound');
}

function assignmentOwnerId(pathname: string): string | undefined {
  return [
    /^\/deviceAppManagement\/mobileApps\/([^/]+)\/assignments$/,
    /^\/deviceManagement\/deviceCompliancePolicies\/([^/]+)\/assignments$/,
    /^\/deviceManagement\/deviceConfigurations\/([^/]+)\/assignments$/,
    /^\/deviceManagement\/configurationPolicies\/([^/]+)\/assignments$/,
    /^\/deviceManagement\/windowsAutopilotDeploymentProfiles\/([^/]+)\/assignments$/,
  ]
    .map((pattern) => pathname.match(pattern)?.[1])
    .find((id): id is string => Boolean(id));
}

function parseRoute(path: string): SampleRoute {
  const url = path.startsWith('https://')
    ? new URL(path)
    : new URL(path, 'https://graph.microsoft.com/v1.0');
  const pathname = url.pathname.replace(/^\/(?:v1\.0|beta)/, '') || '/';

  return { pathname, searchParams: url.searchParams };
}

function filterDevices(route: SampleRoute): GraphObject[] {
  const filter = route.searchParams.get('$filter') ?? '';
  const userPrincipalName = filter.match(/userPrincipalName eq '([^']+)'/)?.[1];
  if (userPrincipalName) {
    return sampleManagedDevices.filter((device) => text(device, 'userPrincipalName') === userPrincipalName);
  }

  return filterBySearch(sampleManagedDevices, route, ['deviceName', 'userPrincipalName', 'operatingSystem']);
}

function filterBySearch(items: GraphObject[], route: SampleRoute, fields: string[]): GraphObject[] {
  const terms = searchTerms(route);
  if (terms.length === 0) {
    return items;
  }

  return items.filter((item) =>
    terms.some((term) =>
      fields.some((field) => text(item, field)?.toLowerCase().includes(term)),
    ),
  );
}

function searchTerms(route: SampleRoute): string[] {
  const filter = route.searchParams.get('$filter') ?? '';
  return [...filter.matchAll(/'([^']+)'/g)]
    .map((match) => match[1].toLowerCase())
    .filter((term) => Boolean(term) && !/^\d{4}-\d{2}-\d{2}t/.test(term));
}

function findById(items: GraphObject[], id: string): GraphObject {
  const item = items.find((candidate) => text(candidate, 'id') === id);
  if (!item) {
    throw new GraphError(404, `Sample object ${id} was not found.`, 'NotFound');
  }

  return item;
}

function text(source: GraphObject | undefined, key: string): string | undefined {
  const value = source?.[key];
  return typeof value === 'string' ? value : undefined;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
