import { describe, expect, it } from 'vitest';
import { conditionalAccessDetailScopes, signInLogScopes } from '../auth/msal';
import { mockGraphClient } from '../test/mockGraphClient';
import {
  classifyConditionalAccess,
  loadSignInLogs,
  replaceSignInEventProjection,
  signInEventToGraph,
  signInLogPath,
  signInLogSubject,
} from './signInLogs';

describe('sign-in log graph adapter', () => {
  it('builds a bounded sign-in query with date, user, and CA filters', () => {
    const path = decodeURIComponent(
      signInLogPath({
        caFilter: 'failed',
        includePolicyDetails: false,
        node: {
          id: 'user:user-id',
          type: 'user',
          label: 'Adele Vance',
          subtitle: 'adele@example.com',
        },
        rangeDays: 45,
        resultFilter: 'all',
        top: 500,
      }),
    );

    expect(path).toContain('/auditLogs/signIns?$top=50');
    expect(path).toContain('createdDateTime ge ');
    expect(path).toContain("userId eq 'user-id'");
    expect(path).toContain("userPrincipalName eq 'adele@example.com'");
    expect(path).toContain("conditionalAccessStatus eq 'failure'");
  });

  it('fails closed for unsupported sign-in investigation subjects', () => {
    expect(signInLogSubject({ id: 'group:all-users', type: 'group', label: 'All users' })).toBeUndefined();
    expect(signInLogSubject({ id: 'cloudApp:azure-portal', type: 'cloudApp', label: 'Azure Portal' })).toMatchObject({
      type: 'cloudApp',
    });
  });

  it('builds cloud app sign-in queries from app IDs when available', () => {
    const path = decodeURIComponent(
      signInLogPath({
        caFilter: 'all',
        includePolicyDetails: false,
        node: {
          id: 'cloudApp:resource-id',
          type: 'cloudApp',
          label: 'Azure Portal',
          metadata: { appId: 'app-id' },
        },
        rangeDays: 7,
        resultFilter: 'all',
        top: 25,
      }),
    );

    expect(path).toContain("appId eq 'app-id'");
  });

  it('requests only audit-log scope by default', async () => {
    const observed = { headers: undefined as unknown, scopes: [] as string[] };
    const client = mockGraphClient({
      async getPage<T>(_path: string, scopes = [], _version?: string, options?: unknown): Promise<{ value: T[] }> {
        observed.scopes = scopes;
        observed.headers = options;
        return {
          value: [
            {
              appDisplayName: 'Office 365',
              conditionalAccessStatus: 'success',
              createdDateTime: '2026-06-21T12:00:00Z',
              id: 'signin-1',
              status: { errorCode: 0 },
              userDisplayName: 'Adele Vance',
              userId: 'user-id',
              userPrincipalName: 'adele@example.com',
            },
          ],
        } as { value: T[] };
      },
    });

    const result = await loadSignInLogs(client, {
      caFilter: 'all',
      includePolicyDetails: false,
      rangeDays: 7,
      resultFilter: 'success',
      top: 25,
    });

    expect(observed.scopes).toEqual(signInLogScopes);
    expect(observed.headers).toEqual({ headers: { Prefer: 'include-unknown-enum-members' } });
    expect(result.events[0]).toMatchObject({
      appDisplayName: 'Office 365',
      ca: { missingDetails: true, state: 'applied' },
      status: { errorCode: 0 },
    });
  });

  it('requests optional CA detail scope when policy names are enabled', async () => {
    const observed = { scopes: [] as string[] };
    const client = mockGraphClient({
      async getPage<T>(_path: string, scopes: string[]): Promise<{ value: T[] }> {
        observed.scopes = scopes;
        return { value: [] };
      },
    });

    await loadSignInLogs(client, {
      caFilter: 'all',
      includePolicyDetails: true,
      rangeDays: 7,
      resultFilter: 'all',
      top: 25,
    });

    expect(observed.scopes).toEqual([...signInLogScopes, ...conditionalAccessDetailScopes]);
  });

  it('uses Microsoft Graph nextLink for loading more sign-in events', async () => {
    const observed = { path: '' };
    const client = mockGraphClient({
      async getPage<T>(path: string): Promise<{ '@odata.nextLink': string; value: T[] }> {
        observed.path = path;

        return {
          '@odata.nextLink': 'https://graph.microsoft.com/v1.0/auditLogs/signIns?$skiptoken=next-page',
          value: [],
        };
      },
    });

    const result = await loadSignInLogs(
      client,
      {
        caFilter: 'all',
        includePolicyDetails: false,
        rangeDays: 7,
        resultFilter: 'all',
        top: 25,
      },
      'https://graph.microsoft.com/v1.0/auditLogs/signIns?$skiptoken=current-page',
    );

    expect(observed.path).toBe('https://graph.microsoft.com/v1.0/auditLogs/signIns?$skiptoken=current-page');
    expect(result.nextLink).toBe('https://graph.microsoft.com/v1.0/auditLogs/signIns?$skiptoken=next-page');
  });

  it('filters projected sign-in nodes by event id', async () => {
    const client = mockGraphClient({
      async getPage<T>(): Promise<{ value: T[] }> {
        return {
          value: [
            {
              appDisplayName: 'Office 365',
              conditionalAccessStatus: 'success',
              createdDateTime: '2026-06-21T12:00:00Z',
              id: 'signin-1',
              status: { errorCode: 0 },
            },
            {
              appDisplayName: 'Azure Portal',
              conditionalAccessStatus: 'failure',
              createdDateTime: '2026-06-21T12:05:00Z',
              id: 'signin-2',
              status: { errorCode: 53003 },
            },
          ],
        } as { value: T[] };
      },
    });

    const result = await loadSignInLogs(client, {
      caFilter: 'all',
      includePolicyDetails: false,
      node: { id: 'signInEvent:signin-2', type: 'signInEvent', label: 'Failure / Azure Portal' },
      rangeDays: 7,
      resultFilter: 'all',
      top: 25,
    });

    expect(result.events.map((event) => event.id)).toEqual(['signin-2']);
  });

  it('uses projected sign-in user context for follow-up failure queries', async () => {
    const path = decodeURIComponent(
      signInLogPath({
        caFilter: 'failed',
        includePolicyDetails: false,
        node: {
          id: 'signInEvent:success-1',
          type: 'signInEvent',
          label: 'Success / Tenant Graph',
          metadata: {
            userId: 'jorge-id',
            userPrincipalName: 'jorge@jorgeasaur.us',
          },
        },
        rangeDays: 7,
        resultFilter: 'failure',
        top: 25,
      }),
    );

    expect(path).toContain("userId eq 'jorge-id'");
    expect(path).toContain("userPrincipalName eq 'jorge@jorgeasaur.us'");
    expect(path).toContain("conditionalAccessStatus eq 'failure'");
    expect(path).not.toContain("id eq 'success-1'");
  });

  it('keeps projected sign-in follow-up results scoped to the original user', async () => {
    const client = mockGraphClient({
      async getPage<T>(): Promise<{ value: T[] }> {
        return {
          value: [
            {
              appDisplayName: 'Tenant Graph',
              conditionalAccessStatus: 'failure',
              createdDateTime: '2026-06-21T12:00:00Z',
              id: 'failure-1',
              status: { errorCode: 53003 },
              userDisplayName: 'Jorge Suarez',
              userId: 'jorge-id',
              userPrincipalName: 'jorge@jorgeasaur.us',
            },
            {
              appDisplayName: 'Tenant Graph',
              conditionalAccessStatus: 'failure',
              createdDateTime: '2026-06-21T12:01:00Z',
              id: 'failure-other-user',
              status: { errorCode: 53003 },
              userDisplayName: 'Other User',
              userId: 'other-id',
              userPrincipalName: 'other@example.com',
            },
          ],
        } as { value: T[] };
      },
    });

    const result = await loadSignInLogs(client, {
      caFilter: 'failed',
      includePolicyDetails: false,
      node: {
        id: 'signInEvent:success-1',
        type: 'signInEvent',
        label: 'Success / Tenant Graph',
        metadata: {
          userId: 'jorge-id',
          userPrincipalName: 'jorge@jorgeasaur.us',
        },
      },
      rangeDays: 7,
      resultFilter: 'failure',
      top: 25,
    });

    expect(result.events.map((event) => event.id)).toEqual(['failure-1']);
  });

  it('classifies real blocks separately from report-only policy impact', () => {
    expect(classifyConditionalAccess('failure', undefined)).toMatchObject({
      missingDetails: true,
      state: 'failed',
    });
    expect(
      classifyConditionalAccess('reportOnlyFailure', [
        {
          displayName: 'Would block legacy auth',
          enforcedGrantControls: [],
          enforcedSessionControls: [],
          id: 'policy-1',
          result: 'reportOnlyFailure',
        },
      ]),
    ).toMatchObject({
      blockingPolicies: [],
      reportOnlyPolicies: [expect.objectContaining({ displayName: 'Would block legacy auth' })],
      state: 'reportOnly',
    });
    expect(
      classifyConditionalAccess('failure', [
        {
          displayName: 'Block legacy auth',
          enforcedGrantControls: ['block'],
          enforcedSessionControls: [],
          id: 'policy-2',
          result: 'failure',
        },
      ]),
    ).toMatchObject({
      blockingPolicies: [expect.objectContaining({ displayName: 'Block legacy auth' })],
      state: 'failed',
    });
    expect(classifyConditionalAccess('notApplied', [])).toMatchObject({ state: 'notApplied' });
  });

  it('projects a sign-in event into graph nodes and CA policy relationships', () => {
    const graph = signInEventToGraph({
      appDisplayName: 'Office 365',
      ca: classifyConditionalAccess('failure', [
        {
          displayName: 'Block unmanaged devices',
          enforcedGrantControls: ['compliantDevice'],
          enforcedSessionControls: [],
          id: 'policy-1',
          result: 'failure',
        },
      ]),
      conditionalAccessStatus: 'failure',
      createdDateTime: '2026-06-21T12:00:00Z',
      id: 'signin-1',
      ipAddress: '203.0.113.10',
      location: { city: 'Seattle', countryOrRegion: 'US' },
      resourceDisplayName: 'SharePoint Online',
      riskEventTypes: [],
      status: { errorCode: 53003, failureReason: 'Blocked by Conditional Access' },
      userDisplayName: 'Adele Vance',
      userId: 'user-id',
      userPrincipalName: 'adele@example.com',
    });

    expect(graph.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'signInEvent:signin-1', type: 'signInEvent' }),
          expect.objectContaining({ id: 'user:user-id', type: 'user' }),
          expect.objectContaining({
            label: 'SharePoint Online',
            type: 'cloudApp',
            metadata: expect.objectContaining({
              appDisplayName: 'Office 365',
              resourceDisplayName: 'SharePoint Online',
            }),
          }),
          expect.objectContaining({ id: 'conditionalAccessPolicy:policy-1', type: 'conditionalAccessPolicy' }),
          expect.objectContaining({ type: 'networkLocation' }),
      ]),
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'user:user-id', target: 'signInEvent:signin-1', type: 'signedIn' }),
        expect.objectContaining({ source: 'signInEvent:signin-1', target: 'conditionalAccessPolicy:policy-1', type: 'blockedBy' }),
      ]),
    );
  });

  it('filters projected Conditional Access policies by blocked or evaluated results', () => {
    const event = {
      appDisplayName: 'Office 365',
      ca: classifyConditionalAccess('failure', [
        {
          displayName: 'Block unmanaged devices',
          enforcedGrantControls: ['block'],
          enforcedSessionControls: [],
          id: 'blocked-policy',
          result: 'failure',
        },
        {
          displayName: 'Report-only legacy auth',
          enforcedGrantControls: [],
          enforcedSessionControls: [],
          id: 'evaluated-policy',
          result: 'reportOnlyFailure',
        },
        {
          displayName: 'Require MFA',
          enforcedGrantControls: ['mfa'],
          enforcedSessionControls: [],
          id: 'applied-policy',
          result: 'success',
        },
      ]),
      conditionalAccessStatus: 'failure',
      createdDateTime: '2026-06-21T12:00:00Z',
      id: 'signin-1',
      riskEventTypes: [],
      status: { errorCode: 53003 },
    };

    expect(signInEventToGraph(event).edges.map((edge) => edge.type)).toEqual(
      expect.arrayContaining(['blockedBy', 'evaluatedPolicy', 'grantedBy']),
    );
    expect(signInEventToGraph(event, 'blocked').edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: 'conditionalAccessPolicy:blocked-policy', type: 'blockedBy' }),
      ]),
    );
    expect(signInEventToGraph(event, 'blocked').edges).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: 'conditionalAccessPolicy:evaluated-policy' }),
        expect.objectContaining({ target: 'conditionalAccessPolicy:applied-policy' }),
      ]),
    );
    expect(signInEventToGraph(event, 'evaluated').edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: 'conditionalAccessPolicy:evaluated-policy', type: 'evaluatedPolicy' }),
      ]),
    );
    expect(signInEventToGraph(event, 'evaluated').edges).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: 'conditionalAccessPolicy:blocked-policy' }),
        expect.objectContaining({ target: 'conditionalAccessPolicy:applied-policy' }),
      ]),
    );

    const reprojected = replaceSignInEventProjection(signInEventToGraph(event), event, 'blocked');
    expect(reprojected.nodes).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'conditionalAccessPolicy:blocked-policy' })]),
    );
    expect(reprojected.nodes).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'conditionalAccessPolicy:evaluated-policy' }),
        expect.objectContaining({ id: 'conditionalAccessPolicy:applied-policy' }),
      ]),
    );
  });
});
