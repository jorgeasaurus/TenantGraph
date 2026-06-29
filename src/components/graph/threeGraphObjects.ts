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

type IlluminationData = {
  baseOpacity: number;
  scaleAmount: number;
};

type FlowData = {
  arcHeight: number;
  baseOpacity: number;
  phase: number;
  source: THREE.Vector3;
  speed: number;
  target: THREE.Vector3;
};

type ParticleFieldData = {
  baseOpacity: number;
  baseY: number;
  phase: number;
  rotationSpeed: number;
  verticalDrift: number;
};

export type GraphObjectBundle<T extends THREE.Object3D = THREE.Object3D> = {
  object: T;
  flowObjects?: THREE.Object3D[];
  illuminationObjects?: THREE.Object3D[];
  pulseObjects?: THREE.Object3D[];
};

export type SemanticZoneObject = GraphObjectBundle<THREE.Group> & {
  zonePickables: THREE.Object3D[];
};

const labelCanvasCache = new Map<string, HTMLCanvasElement>();
const maxLabelCanvasCacheEntries = 700;
const flowData = new WeakMap<THREE.Object3D, FlowData>();
const illuminationData = new WeakMap<THREE.Object3D, IlluminationData>();
const particleFieldData = new WeakMap<THREE.Object3D, ParticleFieldData>();
const pulseData = new WeakMap<THREE.Object3D, PulseData>();
export const graphVisualBrillianceScale = 0.5;
export const graphBloomLayer = 1;

export function visualBrillianceOpacity(opacity: number): number {
  return opacity * graphVisualBrillianceScale;
}

export function enableGraphBloom(object: THREE.Object3D): void {
  object.layers.enable(graphBloomLayer);
}

export function makeFocusRings(position: THREE.Vector3, size: number, color: string, seed: number): GraphObjectBundle<THREE.Group> {
  const group = new THREE.Group();
  const ringColor = new THREE.Color(color);
  const pulseObjects: THREE.Object3D[] = [];

  for (let index = 0; index < 2; index += 1) {
    const opacity = visualBrillianceOpacity(index === 0 ? 0.3 : 0.2);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(size * (2.05 + index * 0.56), 0.14, 8, 96),
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
    enableGraphBloom(ring);
    setPulse(ring, opacity, seed * 0.01 + index, 0.06, 1.2 + index * 0.34);
    pulseObjects.push(ring);
    group.add(ring);
  }

  group.renderOrder = renderLayers.interactions;
  return { object: group, pulseObjects };
}

export function makeGraphParticleField(
  positions: ReadonlyMap<string, THREE.Vector3>,
  nodeCount: number,
): GraphObjectBundle<THREE.Points> {
  const bounds = graphPositionBounds(positions);
  const count = Math.min(520, Math.max(160, Math.round(Math.sqrt(Math.max(nodeCount, 1)) * 28)));
  const width = Math.max(230, bounds.width + 190);
  const depth = Math.max(230, bounds.depth + 190);
  const height = Math.max(88, Math.min(170, 78 + Math.sqrt(Math.max(nodeCount, 1)) * 5.2));
  const vertices = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    vertices[offset] = bounds.center.x + (seededUnit(index, 11) - 0.5) * width;
    vertices[offset + 1] = bounds.center.y - 26 + seededUnit(index, 29) * height;
    vertices[offset + 2] = bounds.center.z + (seededUnit(index, 47) - 0.5) * depth;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const baseOpacity = visualBrillianceOpacity(0.46);
  const material = new THREE.PointsMaterial({
    alphaTest: 0.01,
    blending: THREE.AdditiveBlending,
    color: '#74e8f5',
    depthTest: false,
    depthWrite: false,
    fog: false,
    map: makeParticleTexture(),
    opacity: baseOpacity,
    size: 3.4,
    sizeAttenuation: false,
    toneMapped: false,
    transparent: true,
  });
  const particles = new THREE.Points(geometry, material);
  particles.frustumCulled = false;
  particles.renderOrder = renderLayers.labels - 1;
  enableGraphBloom(particles);
  particleFieldData.set(particles, {
    baseOpacity,
    baseY: 0,
    phase: seededUnit(nodeCount, 73) * Math.PI * 2,
    rotationSpeed: 0.004 + seededUnit(nodeCount, 91) * 0.003,
    verticalDrift: 1.2 + seededUnit(nodeCount, 113) * 0.9,
  });
  return { object: particles };
}

export function makeSemanticZone(zone: GraphZone): SemanticZoneObject {
  const group = new THREE.Group();
  const color = new THREE.Color(zone.color);
  const zonePickables: THREE.Object3D[] = [];
  const floor = new THREE.Mesh(
    makeBoundaryFillGeometry(zone),
    new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color,
      depthWrite: false,
      opacity: visualBrillianceOpacity(0.095),
      side: THREE.DoubleSide,
      transparent: true,
    }),
  );
  floor.userData.zone = zone;
  floor.renderOrder = renderLayers.clusters;
  zonePickables.push(floor);
  group.add(floor);

  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(zone.boundary),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: visualBrillianceOpacity(0.42),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ring.userData.zone = zone;
  ring.renderOrder = renderLayers.clusters + 1;
  enableGraphBloom(ring);
  zonePickables.push(ring);
  group.add(ring);

  const labelPosition = zone.center.clone().setY(-1);
  group.add(makeZoneLabel(zone.label, zone.nodeCount, labelPosition, zone.color));
  group.userData.zone = zone;
  group.renderOrder = renderLayers.clusters;
  return { object: group, zonePickables };
}

export function makeNodeLayers(
  position: THREE.Vector3,
  size: number,
  color: string,
  options: { active: boolean; dimmed: boolean; signalColor?: string },
): GraphObjectBundle<THREE.Group> {
  const group = new THREE.Group();
  const pulseObjects: THREE.Object3D[] = [];
  const opacity = visualBrillianceOpacity(options.dimmed ? 0.07 : options.active ? 0.42 : 0.3);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(size * 0.88, 0.11, 8, 56),
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
  if (options.active) {
    enableGraphBloom(ring);
  }
  group.add(ring);

  const rimOpacity = visualBrillianceOpacity(options.dimmed ? 0.04 : options.active ? 0.32 : 0.13);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(size * 1.04, 0.07, 8, 72),
    new THREE.MeshBasicMaterial({
      color: options.active ? '#f8fbff' : color,
      transparent: true,
      opacity: rimOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  rim.position.copy(position);
  rim.rotation.set(Math.PI * 0.48, 0, Math.PI * 0.25);
  rim.renderOrder = renderLayers.nodes + 1;
  if (options.active) {
    enableGraphBloom(rim);
  }
  group.add(rim);

  const underlayOpacity = visualBrillianceOpacity(options.dimmed ? 0.05 : options.active ? 0.3 : 0.18);
  const underlay = new THREE.Mesh(
    new THREE.SphereGeometry(size * 0.42, 16, 8),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: underlayOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  underlay.position.copy(position);
  underlay.renderOrder = renderLayers.nodes;
  if (options.active) {
    enableGraphBloom(underlay);
  }
  group.add(underlay);

  if (options.signalColor && !options.dimmed) {
    const badge = new THREE.Mesh(
      new THREE.SphereGeometry(size * 0.12, 14, 8),
      new THREE.MeshBasicMaterial({
        color: options.signalColor,
        transparent: true,
        opacity: visualBrillianceOpacity(0.78),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    badge.position.copy(position).add(new THREE.Vector3(size * 0.34, size * 0.32, size * 0.1));
    badge.renderOrder = renderLayers.interactions;
    enableGraphBloom(badge);
    setPulse(badge, visualBrillianceOpacity(0.78), size * 0.1, 0.12, 1.9);
    pulseObjects.push(badge);
    group.add(badge);
  }

  group.renderOrder = renderLayers.nodes;
  return { object: group, pulseObjects };
}

export function makeNodeIllumination(
  position: THREE.Vector3,
  size: number,
  color: string,
  options: { dimmed: boolean; prominent: boolean },
): GraphObjectBundle<THREE.Group> {
  const group = new THREE.Group();
  const illuminationObjects: THREE.Object3D[] = [];
  const glowColor = new THREE.Color(color);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(size * 1.85, 48),
    new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  floor.position.copy(position).add(new THREE.Vector3(0, -size * 0.34, 0));
  floor.rotation.x = -Math.PI / 2;
  floor.renderOrder = renderLayers.nodes + 1;
  floor.visible = false;
  enableGraphBloom(floor);
  setIllumination(floor, visualBrillianceOpacity(options.dimmed ? 0.1 : options.prominent ? 0.42 : 0.32), 0.52);
  illuminationObjects.push(floor);
  group.add(floor);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(size * 0.96, 0.16, 8, 64),
    new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    }),
  );
  ring.position.copy(position);
  ring.rotation.set(Math.PI * 0.45, 0, Math.PI * 0.18);
  ring.renderOrder = renderLayers.nodes + 1;
  ring.visible = false;
  enableGraphBloom(ring);
  setIllumination(ring, visualBrillianceOpacity(options.dimmed ? 0.12 : options.prominent ? 0.58 : 0.46), 0.3);
  illuminationObjects.push(ring);
  group.add(ring);

  group.renderOrder = renderLayers.nodes + 1;
  return { object: group, illuminationObjects };
}

export function makeSelectionAnchor(position: THREE.Vector3, size: number, color: string, seed: number): GraphObjectBundle<THREE.Group> {
  const group = new THREE.Group();
  const pulseObjects: THREE.Object3D[] = [];
  const anchorColor = new THREE.Color(color);

  const plate = new THREE.Mesh(
    new THREE.TorusGeometry(size * 1.15, 0.18, 8, 96),
    new THREE.MeshBasicMaterial({
      color: anchorColor,
      transparent: true,
      opacity: visualBrillianceOpacity(0.34),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  plate.position.copy(position).add(new THREE.Vector3(0, -size * 0.28, 0));
  plate.rotation.x = Math.PI / 2;
  plate.renderOrder = renderLayers.interactions + 2;
  enableGraphBloom(plate);
  setPulse(plate, visualBrillianceOpacity(0.34), seed * 0.02, 0.045, 1.45);
  pulseObjects.push(plate);
  group.add(plate);

  group.renderOrder = renderLayers.interactions;
  return { object: group, pulseObjects };
}

export function makeLabel(text: string, position: THREE.Vector3, prominent: boolean, color: string): THREE.Sprite {
  const fontSize = prominent ? 46 : 31;
  const value = shorten(text, prominent ? 30 : 26);
  const canvas = getCachedCanvas(labelCanvasCache, ['node-label', value, prominent ? '1' : '0', color].join('|'), () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 768;
    canvas.height = 192;

    if (context) {
      context.font = `700 ${fontSize}px Aptos, Segoe UI, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const width = Math.min(canvas.width - 44, context.measureText(value).width + 64);

      if (prominent) {
        context.fillStyle = 'rgba(2, 5, 14, 0.82)';
        context.strokeStyle = color;
        context.lineWidth = 4;
        const x = (canvas.width - width) / 2;
        const y = 55;
        context.fillRect(x, y, width, 82);
        context.strokeRect(x + 1.5, y + 1.5, width - 3, 79);
      }

      context.lineWidth = prominent ? 10 : 7;
      context.strokeStyle = 'rgba(0, 0, 0, 0.86)';
      context.strokeText(value, canvas.width / 2, canvas.height / 2);
      context.fillStyle = prominent ? 'rgba(255, 255, 255, 1)' : 'rgba(246, 250, 255, 0.96)';
      context.shadowColor = 'rgba(0, 0, 0, 0.9)';
      context.shadowBlur = 14;
      context.fillText(value, canvas.width / 2, canvas.height / 2);
    }

    return canvas;
  });

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position).add(new THREE.Vector3(0, prominent ? 19 : 10, 0));
  sprite.scale.set(prominent ? 88 : 58, prominent ? 25 : 15, 1);
  sprite.renderOrder = prominent ? renderLayers.interactions + 4 : renderLayers.labels;
  return sprite;
}

export function makeEdgeLabel(text: string, position: THREE.Vector3, color: string, active: boolean): THREE.Sprite {
  const value = shorten(text, 28);
  const canvas = getCachedCanvas(labelCanvasCache, ['edge-label', value, active ? '1' : '0', color].join('|'), () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    if (context) {
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
      context.fillStyle = active ? '#f8fbff' : 'rgba(240, 248, 255, 0.92)';
      context.fillText(value, canvas.width / 2, canvas.height / 2);
    }

    return canvas;
  });

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
      opacity: visualBrillianceOpacity(opacity),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  arrow.position.copy(source).lerp(target, 0.67).add(new THREE.Vector3(0, 3.2, 0));
  arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  arrow.renderOrder = renderLayers.edges + 3;
  return arrow;
}

export function makeRelationshipFlowPulse(
  source: THREE.Vector3,
  target: THREE.Vector3,
  color: string,
  seed: number,
  prominent: boolean,
): THREE.Mesh {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(prominent ? 3 : 2.2, 14, 8),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: visualBrillianceOpacity(prominent ? 0.88 : 0.58),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  marker.renderOrder = renderLayers.edges + 5;
  enableGraphBloom(marker);
  setFlow(marker, source, target, visualBrillianceOpacity(prominent ? 0.88 : 0.58), seed * 0.017, prominent ? 0.44 : 0.32);
  return marker;
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
      opacity: visualBrillianceOpacity(0.68),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  marker.position.copy(source).lerp(target, 0.5).add(new THREE.Vector3(0, 5.5, 0));
  marker.renderOrder = renderLayers.edges + 4;
  enableGraphBloom(marker);
  setPulse(marker, visualBrillianceOpacity(0.68), seed * 0.01, 0.26, 2.4);
  return marker;
}

export function setPulse(
  object: THREE.Object3D,
  baseOpacity: number,
  phase: number,
  amount: number,
  speed: number,
): void {
  pulseData.set(object, { amount, baseOpacity, phase, speed });
}

function setIllumination(object: THREE.Object3D, baseOpacity: number, scaleAmount: number): void {
  illuminationData.set(object, { baseOpacity, scaleAmount });
}

function setFlow(
  object: THREE.Object3D,
  source: THREE.Vector3,
  target: THREE.Vector3,
  baseOpacity: number,
  phase: number,
  speed: number,
): void {
  flowData.set(object, {
    arcHeight: Math.min(28, Math.max(8, source.distanceTo(target) * 0.08)),
    baseOpacity,
    phase,
    source: source.clone(),
    speed,
    target: target.clone(),
  });
}

export function animateIlluminationObjects(objects: readonly THREE.Object3D[], intensity: number): void {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  for (const object of objects) {
    const illumination = illuminationData.get(object);
    if (!illumination) {
      continue;
    }

    object.visible = clampedIntensity > 0.015;
    object.scale.setScalar(1 + clampedIntensity * illumination.scaleAmount);
    const material = (object as THREE.Mesh).material;
    if (material && !Array.isArray(material)) {
      material.opacity = illumination.baseOpacity * clampedIntensity;
    }
  }
}

export function animateFlowObjects(objects: readonly THREE.Object3D[], elapsed: number): void {
  for (const object of objects) {
    const flow = flowData.get(object);
    if (!flow) {
      continue;
    }

    const progress = (elapsed * flow.speed + flow.phase) % 1;
    object.position.copy(flow.source).lerp(flow.target, progress);
    object.position.y += Math.sin(progress * Math.PI) * flow.arcHeight + 3;
    object.scale.setScalar(0.82 + Math.sin(progress * Math.PI) * 0.42);
    const material = (object as THREE.Mesh).material;
    if (material && !Array.isArray(material)) {
      material.opacity = flow.baseOpacity * (0.24 + Math.sin(progress * Math.PI) * 0.76);
    }
  }
}

export function animateParticleFields(objects: readonly THREE.Object3D[], elapsed: number): void {
  for (const object of objects) {
    const particles = particleFieldData.get(object);
    if (!particles) {
      continue;
    }

    object.rotation.y = elapsed * particles.rotationSpeed + particles.phase * 0.04;
    object.position.y = particles.baseY + Math.sin(elapsed * 0.36 + particles.phase) * particles.verticalDrift;
    const material = (object as THREE.Points).material;
    if (material && !Array.isArray(material)) {
      material.opacity = particles.baseOpacity * (0.74 + Math.sin(elapsed * 0.42 + particles.phase) * 0.18);
    }
  }
}

export function animatePulseObjects(objects: readonly THREE.Object3D[], elapsed: number): void {
  for (const object of objects) {
    const pulse = pulseData.get(object);
    if (!pulse) {
      continue;
    }

    const wave = (Math.sin(elapsed * pulse.speed + pulse.phase) + 1) / 2;
    object.scale.setScalar(1 + wave * pulse.amount);
    const material = (object as THREE.Mesh).material;
    if (material && !Array.isArray(material)) {
      material.opacity = pulse.baseOpacity * (0.72 + wave * 0.48);
    }
  }
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

function makeParticleTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 31);
    gradient.addColorStop(0, 'rgba(116, 232, 245, 0.92)');
    gradient.addColorStop(0.2, 'rgba(116, 232, 245, 0.72)');
    gradient.addColorStop(1, 'rgba(116, 232, 245, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function graphPositionBounds(positions: ReadonlyMap<string, THREE.Vector3>): {
  center: THREE.Vector3;
  depth: number;
  width: number;
} {
  if (positions.size === 0) {
    return { center: new THREE.Vector3(), depth: 0, width: 0 };
  }

  const min = new THREE.Vector3(Number.POSITIVE_INFINITY, 0, Number.POSITIVE_INFINITY);
  const max = new THREE.Vector3(Number.NEGATIVE_INFINITY, 0, Number.NEGATIVE_INFINITY);

  for (const position of positions.values()) {
    min.x = Math.min(min.x, position.x);
    min.z = Math.min(min.z, position.z);
    max.x = Math.max(max.x, position.x);
    max.z = Math.max(max.z, position.z);
  }

  return {
    center: new THREE.Vector3((min.x + max.x) / 2, 0, (min.z + max.z) / 2),
    depth: max.z - min.z,
    width: max.x - min.x,
  };
}

function seededUnit(index: number, salt: number): number {
  const wave = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return wave - Math.floor(wave);
}

function shorten(value: string, length = 28): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function makeZoneLabel(text: string, count: number, position: THREE.Vector3, color: string): THREE.Sprite {
  const label = `${text} (${count})`;
  const canvas = getCachedCanvas(labelCanvasCache, ['zone-label', label, color].join('|'), () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 820;
    canvas.height = 180;

    if (context) {
      context.font = '800 36px Aptos, Segoe UI, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const width = Math.min(canvas.width - 48, context.measureText(label).width + 78);
      const x = (canvas.width - width) / 2;
      context.shadowColor = 'rgba(0, 0, 0, 0.88)';
      context.shadowBlur = 20;
      context.fillStyle = 'rgba(2, 6, 16, 0.9)';
      context.strokeStyle = color;
      context.lineWidth = 3.5;
      roundRect(context, x, 50, width, 72, 34);
      context.fill();
      context.stroke();
      context.shadowBlur = 0;
      context.lineWidth = 7;
      context.strokeStyle = 'rgba(0, 0, 0, 0.78)';
      context.strokeText(label, canvas.width / 2, 87);
      context.fillStyle = 'rgba(245, 250, 255, 0.96)';
      context.fillText(label, canvas.width / 2, 87);
    }

    return canvas;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }),
  );
  sprite.position.copy(position);
  sprite.scale.set(112, 25, 1);
  sprite.renderOrder = renderLayers.labels + 2;
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

function getCachedCanvas(
  cache: Map<string, HTMLCanvasElement>,
  key: string,
  createCanvas: () => HTMLCanvasElement,
): HTMLCanvasElement {
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = createCanvas();
  cache.set(key, canvas);
  while (cache.size > maxLabelCanvasCacheEntries) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
  }
  return canvas;
}
