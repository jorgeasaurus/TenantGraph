import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type GraphLabelData = {
  direct: boolean;
  nodeId: string;
  priority: number;
  relationshipDistance?: number;
  selected: boolean;
};

export function updateGraphLabels(
  labels: THREE.Sprite[],
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  renderer: THREE.WebGLRenderer,
  hoverNodeId: string | undefined,
  scratchVector = new THREE.Vector3(),
): void {
  if (labels.length === 0) {
    return;
  }

  const distance = camera.position.distanceTo(controls.target);
  const zoomLevel = distance > 320 ? 'far' : distance > 155 ? 'medium' : 'close';
  const maxVisibleLabels = zoomLevel === 'far' ? 8 : zoomLevel === 'medium' ? 24 : 52;
  const rect = renderer.domElement.getBoundingClientRect();
  const candidates: Array<{
    data: GraphLabelData;
    hovered: boolean;
    label: THREE.Sprite;
    priority: number;
    selected: boolean;
  }> = [];

  for (const label of labels) {
    const data = label.userData.graphLabel as GraphLabelData;
    const hovered = data.nodeId === hoverNodeId;
    const selected = data.selected;
    const direct = data.direct;
    const zoomVisible =
      zoomLevel === 'close' ||
      (zoomLevel === 'medium' && (data.priority >= 70 || direct)) ||
      selected ||
      hovered;

    if (zoomVisible) {
      candidates.push({
        data,
        hovered,
        label,
        priority: hovered ? 98 : data.priority,
        selected,
      });
    }
  }

  const sortedCandidates = candidates.toSorted((first, second) => second.priority - first.priority);

  const accepted: Array<{ height: number; width: number; x: number; y: number }> = [];
  const visibleIds = new Set<string>();
  const fadedIds = new Set<string>();

  for (const candidate of sortedCandidates) {
    const screen = scratchVector.copy(candidate.label.position).project(camera);
    const x = ((screen.x + 1) / 2) * rect.width;
    const y = ((-screen.y + 1) / 2) * rect.height;
    const width = candidate.selected ? 156 : 118;
    const height = candidate.selected ? 30 : 23;
    const box = { x: x - width / 2, y: y - height / 2, width, height };
    const collides = accepted.some((existing) => boxesOverlap(existing, box));
    const labelBudgetReached = visibleIds.size >= maxVisibleLabels && !candidate.selected && !candidate.hovered;

    if ((!collides && !labelBudgetReached) || candidate.selected || candidate.hovered) {
      accepted.push(box);
      visibleIds.add(candidate.data.nodeId);
    } else {
      fadedIds.add(candidate.data.nodeId);
    }
  }

  for (const label of labels) {
    const data = label.userData.graphLabel as GraphLabelData;
    const material = label.material as THREE.SpriteMaterial;
    if (visibleIds.has(data.nodeId)) {
      label.visible = true;
      material.opacity = data.selected ? 1 : 0.88;
    } else if (fadedIds.has(data.nodeId)) {
      label.visible = true;
      material.opacity = 0.16;
    } else {
      material.opacity = 0;
      label.visible = false;
    }
  }
}

export function boxesOverlap(
  first: { height: number; width: number; x: number; y: number },
  second: { height: number; width: number; x: number; y: number },
): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}
