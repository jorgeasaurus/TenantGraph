import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { TenantGraph, TenantNode } from '../../models/tenantGraph';
import { layoutGraph } from './graphLayout';

describe('graph layout', () => {
  it('adds readable spacing between type buckets inside the same visual category', () => {
    const central: TenantNode = { id: 'user:central', type: 'user', label: 'Adele Vance' };
    const appNodes = makeNodes('app', 'app', 5);
    const assignmentNodes = makeNodes('assignment', 'appAssignment', 5);
    const graph: TenantGraph = {
      nodes: [central, ...appNodes, ...assignmentNodes],
      edges: [],
    };

    const layout = layoutGraph(graph, central.id);
    const appCenter = averagePosition(appNodes, layout.positions);
    const assignmentCenter = averagePosition(assignmentNodes, layout.positions);

    expect(appCenter.distanceTo(assignmentCenter)).toBeGreaterThan(60);
  });

  it('keeps large same-type clusters expanded enough for icons to breathe', () => {
    const central: TenantNode = { id: 'user:central', type: 'user', label: 'Adele Vance' };
    const apps = makeNodes('app', 'app', 12);
    const graph: TenantGraph = {
      nodes: [central, ...apps],
      edges: [],
    };

    const layout = layoutGraph(graph, central.id);
    const appZone = layout.zones.find((zone) => zone.id === 'apps');

    expect(appZone?.radius).toBeGreaterThan(75);
  });
});

function makeNodes(prefix: string, type: TenantNode['type'], count: number): TenantNode[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}:${index}`,
    label: `${prefix} ${index}`,
    type,
  }));
}

function averagePosition(nodes: TenantNode[], positions: Map<string, THREE.Vector3>): THREE.Vector3 {
  const center = new THREE.Vector3();
  let count = 0;

  for (const node of nodes) {
    const position = positions.get(node.id);
    if (position) {
      center.add(position);
      count += 1;
    }
  }

  return center.multiplyScalar(count > 0 ? 1 / count : 0);
}
