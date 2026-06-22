import * as THREE from 'three';
import type { GraphZone } from './graphLayout';

export const renderLayers = {
  background: 0,
  clusters: 10,
  edges: 20,
  nodes: 30,
  labels: 40,
  interactions: 50,
} as const;

type PulseData = {
  amount: number;
  baseOpacity: number;
  phase: number;
  speed: number;
};

export function makeFocusRings(position: THREE.Vector3, size: number, color: string, seed: number): THREE.Group {
  const group = new THREE.Group();
  const ringColor = new THREE.Color(color);

  for (let index = 0; index < 2; index += 1) {
    const opacity = index === 0 ? 0.25 : 0.17;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(size * (2.05 + index * 0.52), 0.11, 8, 96),
      new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.position.copy(position);
    ring.rotation.set(Math.PI * (0.42 + index * 0.2), seed * 0.01, Math.PI * (0.2 + index * 0.36));
    ring.renderOrder = renderLayers.interactions + index;
    setPulse(ring, opacity, seed * 0.01 + index, 0.045, 1.2 + index * 0.34);
    group.add(ring);
  }

  group.renderOrder = renderLayers.interactions;
  return group;
}

export function makeSemanticZone(zone: GraphZone): THREE.Group {
  const group = new THREE.Group();
  const color = new THREE.Color(zone.color);
  const floor = new THREE.Mesh(
    makeBoundaryFillGeometry(zone),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  floor.userData.zone = zone;
  floor.renderOrder = renderLayers.clusters;
  group.add(floor);

  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(zone.boundary),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ring.userData.zone = zone;
  ring.renderOrder = renderLayers.clusters + 1;
  group.add(ring);

  const labelPosition = zone.center.clone().setY(-1);
  group.add(makeZoneLabel(zone.label, zone.nodeCount, labelPosition, zone.color));
  group.userData.zone = zone;
  group.renderOrder = renderLayers.clusters;
  return group;
}

export function makeNodeLayers(
  position: THREE.Vector3,
  size: number,
  color: string,
  options: { active: boolean; dimmed: boolean; signalColor?: string },
): THREE.Group {
  const group = new THREE.Group();
  const opacity = options.dimmed ? 0.04 : options.active ? 0.2 : 0.1;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(size * 0.86, 0.08, 8, 56),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ring.position.copy(position);
  ring.rotation.set(Math.PI * 0.42, 0, Math.PI * 0.18);
  ring.renderOrder = renderLayers.nodes;
  group.add(ring);

  const underlay = new THREE.Mesh(
    new THREE.SphereGeometry(size * 0.36, 16, 8),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: options.dimmed ? 0.025 : options.active ? 0.11 : 0.055,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  underlay.position.copy(position);
  underlay.renderOrder = renderLayers.nodes;
  group.add(underlay);

  if (options.signalColor && !options.dimmed) {
    const badge = new THREE.Mesh(
      new THREE.SphereGeometry(size * 0.12, 14, 8),
      new THREE.MeshBasicMaterial({
        color: options.signalColor,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    badge.position.copy(position).add(new THREE.Vector3(size * 0.34, size * 0.32, size * 0.1));
    badge.renderOrder = renderLayers.interactions;
    setPulse(badge, 0.78, size * 0.1, 0.12, 1.9);
    group.add(badge);
  }

  group.renderOrder = renderLayers.nodes;
  return group;
}

export function makeLabel(text: string, position: THREE.Vector3, prominent: boolean, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const fontSize = prominent ? 42 : 29;
  canvas.width = 768;
  canvas.height = 192;

  if (context) {
    const value = shorten(text, prominent ? 30 : 26);
    context.font = `700 ${fontSize}px Aptos, Segoe UI, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const width = Math.min(canvas.width - 44, context.measureText(value).width + 64);

    if (prominent) {
      context.fillStyle = 'rgba(2, 5, 14, 0.82)';
      context.strokeStyle = color;
      context.lineWidth = 3;
      const x = (canvas.width - width) / 2;
      const y = 55;
      context.fillRect(x, y, width, 82);
      context.strokeRect(x + 1.5, y + 1.5, width - 3, 79);
    }

    context.lineWidth = prominent ? 9 : 7;
    context.strokeStyle = 'rgba(0, 0, 0, 0.86)';
    context.strokeText(value, canvas.width / 2, canvas.height / 2);
    context.fillStyle = prominent ? 'rgba(255, 255, 255, 0.98)' : 'rgba(224, 234, 245, 0.88)';
    context.shadowColor = 'rgba(0, 0, 0, 0.9)';
    context.shadowBlur = 14;
    context.fillText(value, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position).add(new THREE.Vector3(0, prominent ? 15 : 9, 0));
  sprite.scale.set(prominent ? 74 : 54, prominent ? 21 : 14, 1);
  sprite.renderOrder = prominent ? renderLayers.interactions + 4 : renderLayers.labels;
  return sprite;
}

export function makeEdgeLabel(text: string, position: THREE.Vector3, color: string, active: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;

  if (context) {
    const value = shorten(text, 28);
    context.font = '700 26px Aptos, Segoe UI, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const width = Math.min(canvas.width - 32, context.measureText(value).width + 54);
    const x = (canvas.width - width) / 2;
    const y = 39;
    context.fillStyle = active ? 'rgba(2, 6, 16, 0.86)' : 'rgba(2, 6, 16, 0.68)';
    context.strokeStyle = color;
    context.lineWidth = active ? 2.5 : 1.5;
    roundRect(context, x, y, width, 50, 24);
    context.fill();
    context.stroke();
    context.fillStyle = active ? '#f8fbff' : 'rgba(224, 234, 245, 0.82)';
    context.fillText(value, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }),
  );
  sprite.position.copy(position);
  sprite.scale.set(active ? 46 : 34, active ? 12 : 9, 1);
  sprite.renderOrder = renderLayers.labels + 1;
  return sprite;
}

export function makeEdgeArrow(
  source: THREE.Vector3,
  target: THREE.Vector3,
  color: string,
  opacity: number,
): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(target, source);
  if (direction.lengthSq() === 0) {
    direction.set(0, 1, 0);
  }
  direction.normalize();

  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(2.2, 5.2, 3),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  arrow.position.copy(source).lerp(target, 0.67).add(new THREE.Vector3(0, 3.2, 0));
  arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  arrow.renderOrder = renderLayers.edges + 3;
  return arrow;
}

export function makeDependencyPulse(
  source: THREE.Vector3,
  target: THREE.Vector3,
  color: string,
  seed: number,
): THREE.Mesh {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(1.9, 12, 8),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  marker.position.copy(source).lerp(target, 0.5).add(new THREE.Vector3(0, 5.5, 0));
  marker.renderOrder = renderLayers.edges + 4;
  setPulse(marker, 0.68, seed * 0.01, 0.26, 2.4);
  return marker;
}

export function setPulse(
  object: THREE.Object3D,
  baseOpacity: number,
  phase: number,
  amount: number,
  speed: number,
): void {
  object.userData.pulse = { amount, baseOpacity, phase, speed } satisfies PulseData;
}

export function animatePulses(root: THREE.Object3D | null, elapsed: number): void {
  if (!root) {
    return;
  }

  root.traverse((child) => {
    const pulse = child.userData.pulse as PulseData | undefined;
    if (!pulse) {
      return;
    }

    const wave = (Math.sin(elapsed * pulse.speed + pulse.phase) + 1) / 2;
    child.scale.setScalar(1 + wave * pulse.amount);
    const material = (child as THREE.Mesh).material;
    if (material && !Array.isArray(material)) {
      material.opacity = pulse.baseOpacity * (0.72 + wave * 0.48);
    }
  });
}

export function disposeObject(object?: THREE.Object3D | null): void {
  if (!object) {
    return;
  }

  object.parent?.remove(object);
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach(disposeMaterial);
    } else if (material) {
      disposeMaterial(material);
    }
  });
}

function disposeMaterial(material: THREE.Material): void {
  const withMap = material as THREE.Material & { map?: THREE.Texture };
  withMap.map?.dispose();
  material.dispose();
}

function shorten(value: string, length = 28): string {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}

function makeZoneLabel(text: string, count: number, position: THREE.Vector3, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 640;
  canvas.height = 140;

  if (context) {
    const label = `${text} (${count})`;
    context.font = '700 28px Aptos, Segoe UI, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const width = Math.min(canvas.width - 36, context.measureText(label).width + 58);
    const x = (canvas.width - width) / 2;
    context.fillStyle = 'rgba(2, 6, 16, 0.74)';
    context.strokeStyle = color;
    context.lineWidth = 2;
    roundRect(context, x, 42, width, 54, 27);
    context.fill();
    context.stroke();
    context.fillStyle = 'rgba(232, 243, 255, 0.9)';
    context.fillText(label, canvas.width / 2, 70);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }),
  );
  sprite.position.copy(position);
  sprite.scale.set(76, 17, 1);
  sprite.renderOrder = renderLayers.labels;
  return sprite;
}

function makeBoundaryFillGeometry(zone: GraphZone): THREE.BufferGeometry {
  const vertices: number[] = [zone.center.x, -14, zone.center.z];
  const indices: number[] = [];

  for (const point of zone.boundary) {
    vertices.push(point.x, -14, point.z);
  }

  for (let index = 1; index <= zone.boundary.length; index += 1) {
    indices.push(0, index, index === zone.boundary.length ? 1 : index + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}
