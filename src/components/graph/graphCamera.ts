import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GraphZone } from './graphLayout';

export function fitCameraToGraph(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  positions: Map<string, THREE.Vector3>,
): void {
  const radius = Math.max(80, ...[...positions.values()].map((position) => position.length()));
  const aspect = camera.aspect || 1;
  const distance = radius * (aspect < 0.78 ? 1.34 : 1.08);
  camera.position.set(distance * 0.65, distance * 0.55, distance);
  controls.target.set(0, 0, 0);
  controls.update();
}

export function fitCameraToZone(camera: THREE.PerspectiveCamera, controls: OrbitControls, zone: GraphZone): void {
  const distance = Math.max(72, zone.radius * 1.46);
  camera.position.set(zone.center.x + distance * 0.48, distance * 0.52, zone.center.z + distance);
  controls.target.copy(zone.center).setY(0);
  controls.update();
}
