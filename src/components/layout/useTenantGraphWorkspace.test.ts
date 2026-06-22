import { describe, expect, it } from 'vitest';
import { classifyConditionalAccess } from '../../graph/signInLogs';
import type { SignInEvent } from '../../models/signInLog';
import { initialWorkspaceState, workspaceReducer } from './useTenantGraphWorkspace';

describe('workspace reset', () => {
  it('restores original overview defaults and reselects the signed-in user', () => {
    const overview = {
      graph: {
        nodes: [
          { id: 'user:me', type: 'user' as const, label: 'Signed In User' },
          { id: 'device:one', type: 'device' as const, label: 'DEVICE-01' },
        ],
        edges: [{ id: 'user-device', source: 'user:me', target: 'device:one', type: 'primaryUser' as const }],
      },
      warnings: [],
    };
    const searchResult = {
      graph: {
        nodes: [{ id: 'app:portal', type: 'app' as const, label: 'Company Portal' }],
        edges: [],
      },
      warnings: ['search warning'],
      permissionError: 'partial access',
    };

    let state = workspaceReducer(initialWorkspaceState(), { type: 'overviewLoaded', result: overview });
    state = workspaceReducer(state, { type: 'setSearchTerm', searchTerm: 'portal' });
    state = workspaceReducer(state, { type: 'searchLoaded', result: searchResult });
    state = workspaceReducer(state, { type: 'selectNode', nodeId: 'device:one' });
    state = workspaceReducer(state, { type: 'selectEdge', edgeId: 'user-device' });
    state = workspaceReducer(state, { type: 'setDepth', depth: 3 });
    state = workspaceReducer(state, { type: 'setFocusDepth', focusDepth: 2 });
    state = workspaceReducer(state, { type: 'toggleType', nodeType: 'user' });
    state = workspaceReducer(state, { type: 'toggleRelationship', relationshipType: 'blockedBy' });
    state = workspaceReducer(state, { type: 'showMoreGraph', total: 360 });
    state = workspaceReducer(state, { type: 'showMoreResults', total: 60 });

    expect(state.selectedNodeId).toBe('device:one');
    expect(state.searchTerm).toBe('portal');
    expect(state.typeFilter.user).toBe(false);
    expect(state.relationshipFilter.blockedBy).toBe(false);

    state = workspaceReducer(state, { type: 'startOverview' });

    expect(state.graph.nodes).toHaveLength(0);
    expect(state.searchTerm).toBe('');
    expect(state.remoteResults).toEqual([]);
    expect(state.depth).toBe(1);
    expect(state.focusDepth).toBe(0);
    expect(state.typeFilter.user).toBe(true);
    expect(state.relationshipFilter.blockedBy).toBe(true);
    expect(state.selectedNodeId).toBeUndefined();
    expect(state.centralNodeId).toBeUndefined();
    expect(state.selectedEdgeId).toBeUndefined();
    expect(state.graphObjectLimit).toBe(180);
    expect(state.resultLimit).toBe(30);
    expect(state.warnings).toEqual([]);
    expect(state.permissionError).toBeUndefined();

    state = workspaceReducer(state, { type: 'overviewLoaded', result: overview });

    expect(state.selectedNodeId).toBe('user:me');
    expect(state.centralNodeId).toBe('user:me');
    expect(state.graph.nodes.map((node) => node.id)).toEqual(['user:me', 'device:one']);
  });
});

describe('workspace sign-in projection', () => {
  it('selects the clicked failure event instead of an earlier successful sign-in projection', () => {
    const overview = {
      graph: {
        nodes: [{ id: 'user:jorge-id', type: 'user' as const, label: 'Jorge Suarez', subtitle: 'jorge@example.com' }],
        edges: [],
      },
      warnings: [],
    };
    let state = workspaceReducer(initialWorkspaceState(), { type: 'overviewLoaded', result: overview });

    state = workspaceReducer(state, {
      type: 'projectSignInEvent',
      event: signInEvent('success-1', 0, 'success'),
      policyFilter: 'all',
    });
    state = workspaceReducer(state, {
      type: 'projectSignInEvent',
      event: signInEvent('failure-1', 53003, 'failure'),
      policyFilter: 'all',
    });

    expect(state.graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'signInEvent:success-1', label: 'Success / Azure Portal' }),
        expect.objectContaining({ id: 'signInEvent:failure-1', label: 'Failure / Azure Portal' }),
      ]),
    );
    expect(state.selectedNodeId).toBe('signInEvent:failure-1');
    expect(state.centralNodeId).toBe('signInEvent:failure-1');
  });
});

function signInEvent(id: string, errorCode: number, conditionalAccessStatus: string): SignInEvent {
  return {
    appDisplayName: 'Azure Portal',
    ca: classifyConditionalAccess(conditionalAccessStatus, undefined),
    conditionalAccessStatus,
    createdDateTime: '2026-06-21T12:00:00Z',
    id,
    resourceDisplayName: 'Azure Portal',
    riskEventTypes: [],
    status: { errorCode },
    userDisplayName: 'Jorge Suarez',
    userId: 'jorge-id',
    userPrincipalName: 'jorge@example.com',
  };
}
