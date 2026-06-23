import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { TenantEdge, TenantNode } from '../../models/tenantGraph';
import { directionEndpoints, edgeVisual, labelPriority, nodeDisplayOpacity } from './graphVisualPolicy';

describe('graph visual policy', () => {
  it('assigns distinct line styles for key relationship types', () => {
    expect(edgeVisual('assignment')).toMatchObject({ opacity: 0.62 });
    expect(edgeVisual('memberOf')).toMatchObject({ dashSize: 8.4, gapSize: 5.8 });
    expect(edgeVisual('primaryUser')).toMatchObject({ doubleLine: true });
    expect(edgeVisual('filteredBy')).toMatchObject({ dashSize: 1.4, gapSize: 4.4 });
    expect(edgeVisual('detectedApp')).toMatchObject({ animated: true });
    expect(edgeVisual('scopeTag')).toMatchObject({ opacity: 0.34 });
  });

  it('points primary-user arrows from user to device regardless of edge order', () => {
    const user: TenantNode = { id: 'user:1', type: 'user', label: 'Adele Vance' };
    const device: TenantNode = { id: 'device:1', type: 'device', label: 'SURFACE-01' };
    const source = new THREE.Vector3(1, 0, 0);
    const target = new THREE.Vector3(2, 0, 0);
    const edge: TenantEdge = { id: 'edge:1', source: device.id, target: user.id, type: 'primaryUser' };

    expect(directionEndpoints(edge, source, target, device, user)).toEqual({
      source: target,
      target: source,
    });
  });

  it('prioritizes selected and direct labels over distant labels', () => {
    expect(labelPriority(true, false, undefined)).toBeGreaterThan(labelPriority(false, true, undefined));
    expect(labelPriority(false, false, 1)).toBeGreaterThan(labelPriority(false, false, 2));
    expect(labelPriority(false, false, 2)).toBeGreaterThan(labelPriority(false, false, undefined));
  });

  it('keeps object icons slightly translucent unless they are already relationship-dimmed', () => {
    expect(nodeDisplayOpacity(1, false)).toBe(0.88);
    expect(nodeDisplayOpacity(1, true)).toBe(0.96);
    expect(nodeDisplayOpacity(0.6, false)).toBe(0.6);
  });
});
