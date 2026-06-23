import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GraphZone } from './graphLayout';

export type CameraPose = {
  position: THREE.Vector3;
  target: THREE.Vector3;
};

type CameraFitOptions = {
  minRadius?: number;
  padding?: number;
};

const graphFitMinRadius = 68;
const graphFitPaddingWide = 1.14;
const graphFitPaddingNarrow = 1.28;

export function fitCameraToGraph(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  positions: Map<string, THREE.Vector3>,
): void {
  applyCameraPose(camera, controls, cameraPoseForPoints(camera, controls, positions.values(), {
    minRadius: graphFitMinRadius,
    padding: camera.aspect < 0.78 ? graphFitPaddingNarrow : graphFitPaddingWide,
  }));
}

export function fitCameraToZone(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  zone: GraphZone,
  nodePositions: Iterable<THREE.Vector3> = zone.boundary,
): void {
  applyCameraPose(camera, controls, cameraPoseForZone(camera, controls, zone, nodePositions));
}

export function cameraPoseForGraph(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  positions: Map<string, THREE.Vector3>,
): CameraPose {
  return cameraPoseForPoints(camera, controls, positions.values(), {
    minRadius: graphFitMinRadius,
    padding: camera.aspect < 0.78 ? graphFitPaddingNarrow : graphFitPaddingWide,
  });
}

export function cameraPoseForZone(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  zone: GraphZone,
  nodePositions: Iterable<THREE.Vector3> = zone.boundary,
): CameraPose {
  const points = [...nodePositions];
  return cameraPoseForPoints(camera, controls, points.length > 0 ? points : zone.boundary, {
    minRadius: 44,
    padding: camera.aspect < 0.78 ? 1.38 : 1.22,
  });
}

export function applyCameraPose(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  pose: CameraPose,
): void {
  camera.position.copy(pose.position);
  controls.target.copy(pose.target);
  controls.update();
}

function cameraPoseForPoints(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  points: Iterable<THREE.Vector3>,
  options: CameraFitOptions,
): CameraPose {
  const pointList = [...points];
  const target = pointList.length > 0 ? centerForPoints(pointList) : new THREE.Vector3();
  const radius = Math.max(options.minRadius ?? 42, radiusForPoints(pointList, target) * (options.padding ?? 1.25));
  const distance = distanceForRadius(camera, radius);
  const direction = currentOrbitDirection(camera, controls);

  return {
    position: target.clone().add(direction.multiplyScalar(distance)),
    target,
  };
}

function centerForPoints(points: THREE.Vector3[]): THREE.Vector3 {
  const box = new THREE.Box3().setFromPoints(points);
  return box.getCenter(new THREE.Vector3());
}

function radiusForPoints(points: THREE.Vector3[], center: THREE.Vector3): number {
  let radius = 0;
  for (const point of points) {
    radius = Math.max(radius, point.distanceTo(center));
  }
  return radius;
}

function distanceForRadius(camera: THREE.PerspectiveCamera, radius: number): number {
  const verticalFov = THREE.MathUtils.degToRad(camera.fov || 48);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect || 1, 0.1));
  const limitingFov = Math.max(0.36, Math.min(verticalFov, horizontalFov));
  return radius / Math.sin(limitingFov / 2);
}

function currentOrbitDirection(camera: THREE.PerspectiveCamera, controls: OrbitControls): THREE.Vector3 {
  const direction = camera.position.clone().sub(controls.target);
  if (direction.lengthSq() < 0.001) {
    return new THREE.Vector3(0.48, 0.52, 1).normalize();
  }

  direction.normalize();
  if (direction.y < 0.26) {
    direction.y = 0.26;
    direction.normalize();
  }
  return direction;
}
