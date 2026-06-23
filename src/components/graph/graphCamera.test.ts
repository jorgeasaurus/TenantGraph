import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cameraPoseForGraph, cameraPoseForZone } from './graphCamera';
import type { GraphZone } from './graphLayout';

describe('graph camera focus', () => {
  it('uses a closer default full-graph frame for reset and initial load', () => {
    const camera = new THREE.PerspectiveCamera(48, 1.6, 0.1, 2000);
    camera.position.set(120, 110, 180);
    const controls = {
      target: new THREE.Vector3(0, 0, 0),
      update: vi.fn(),
    } as unknown as OrbitControls;
    const positions = new Map([
      ['center', new THREE.Vector3(0, 0, 0)],
      ['right', new THREE.Vector3(20, 0, 0)],
    ]);

    const pose = cameraPoseForGraph(camera, controls, positions);

    expect(pose.position.distanceTo(pose.target)).toBeLessThan(150);
    expect(pose.target.y).toBeLessThan(-12);
  });

  it('fits a zone to its actual node bounds instead of its loose boundary center', () => {
    const camera = new THREE.PerspectiveCamera(48, 1.6, 0.1, 2000);
    camera.position.set(130, 90, 210);
    const controls = {
      target: new THREE.Vector3(0, 0, 0),
      update: vi.fn(),
    } as unknown as OrbitControls;
    const zone: GraphZone = {
      boundary: [
        new THREE.Vector3(-500, -14, -500),
        new THREE.Vector3(500, -14, -500),
        new THREE.Vector3(500, -14, 500),
      ],
      center: new THREE.Vector3(0, 0, 0),
      color: '#3fd1ff',
      id: 'apps',
      label: 'Apps',
      nodeCount: 3,
      nodeIds: ['app:one', 'app:two', 'app:three'],
      order: 3,
      radius: 500,
    };

    const pose = cameraPoseForZone(camera, controls, zone, [
      new THREE.Vector3(100, 0, -40),
      new THREE.Vector3(128, 4, -36),
      new THREE.Vector3(116, -2, -20),
    ]);

    expect(pose.target.x).toBeCloseTo(114, 0);
    expect(pose.target.y).toBeLessThan(0);
    expect(pose.target.z).toBeCloseTo(-30, 0);
    expect(pose.target.distanceTo(zone.center)).toBeGreaterThan(100);
  });
});
