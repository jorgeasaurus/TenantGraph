import { describe, expect, it } from 'vitest';
import { GraphError } from './client';
import { collectGraphs } from './graphCalls';

describe('collectGraphs', () => {
  it('keeps fulfilled graph data while aggregating warning and permission errors', async () => {
    const result = await collectGraphs([
      {
        label: 'users',
        run: async () => ({
          nodes: [{ id: 'user:1', type: 'user' as const, label: 'Adele Vance' }],
          edges: [],
        }),
      },
      {
        label: 'policies',
        run: async () => {
          throw new GraphError(403, 'Forbidden', 'Authorization_RequestDenied');
        },
      },
    ]);

    expect(result.graph.nodes).toEqual([{ id: 'user:1', type: 'user', label: 'Adele Vance' }]);
    expect(result.warnings).toEqual(['policies: 403 Authorization_RequestDenied']);
    expect(result.permissionError).toBe('policies: 403 Authorization_RequestDenied');
  });
});
