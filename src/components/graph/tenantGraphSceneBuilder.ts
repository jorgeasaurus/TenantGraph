import * as THREE from 'three';
import type { TenantEdge, TenantGraph, TenantNode } from '../../models/tenantGraph';
import { edgeColors, relationshipLabel, stableHash } from '../../utils/graphUtils';
import { type GraphLabelData } from './graphLabelVisibility';
import { type GraphZone, layoutGraph, makeEdgeGeometry } from './graphLayout';
import {
  buildRelationshipDistances,
  directionEndpoints,
  edgeLabelPosition,
  edgeOffsetVector,
  edgeRelevanceOpacity,
  edgeVisual,
  labelPriority,
  nodeDisplayOpacity,
  nodeRelevanceOpacity,
  nodeSignalColor,
} from './graphVisualPolicy';
import { iconColor, makeNodeIcon } from './nodeIcons';
import {
  makeDependencyPulse,
  makeEdgeArrow,
  makeEdgeLabel,
  makeFocusRings,
  makeLabel,
  makeNodeIllumination,
  makeNodeLayers,
  makeRelationshipFlowPulse,
  makeSelectionAnchor,
  makeSemanticZone,
  renderLayers,
  setPulse,
} from './threeGraphObjects';

export type TenantGraphSceneBuild = {
  edgePickables: THREE.Object3D[];
  flowObjects: THREE.Object3D[];
  focusKey: string;
  focusedZone?: GraphZone;
  focusPoint?: THREE.Vector3;
  group: THREE.Group;
  illuminationKey: string;
  illuminationObjects: THREE.Object3D[];
  labelSprites: THREE.Sprite[];
  nodePickables: THREE.Object3D[];
  positions: Map<string, THREE.Vector3>;
  pulseObjects: THREE.Object3D[];
  zonePickables: THREE.Object3D[];
};

type TenantGraphSceneOptions = {
  centralNodeId?: string;
  focusedZoneId?: string;
  getImage: (nodeId: string) => HTMLImageElement | undefined;
  graph: TenantGraph;
  selectedEdgeId?: string;
  selectedNodeId?: string;
};

export function buildTenantGraphScene({
  centralNodeId,
  focusedZoneId,
  getImage,
  graph,
  selectedEdgeId,
  selectedNodeId,
}: TenantGraphSceneOptions): TenantGraphSceneBuild {
  const group = new THREE.Group();
  const edgePickables: THREE.Object3D[] = [];
  const flowObjects: THREE.Object3D[] = [];
  const illuminationObjects: THREE.Object3D[] = [];
  const labelSprites: THREE.Sprite[] = [];
  const nodePickables: THREE.Object3D[] = [];
  const pulseObjects: THREE.Object3D[] = [];
  const zonePickables: THREE.Object3D[] = [];
  const { positions, zones } = layoutGraph(graph, centralNodeId);
  const relationshipDistances = buildRelationshipDistances(graph, selectedNodeId);
  const hasRelationshipFocus = Boolean(selectedNodeId && relationshipDistances.size > 0);
  const focusedZone = focusedZoneId ? zones.find((zone) => zone.id === focusedZoneId) : undefined;
  const focusedZoneNodeIds = new Set(focusedZone?.nodeIds ?? []);
  const hasZoneFocus = Boolean(focusedZone && focusedZoneNodeIds.size > 0);
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

  for (const zone of zones) {
    const zoneObject = makeSemanticZone(zone);
    zonePickables.push(...zoneObject.zonePickables);
    group.add(zoneObject.object);
  }

  addEdges({
    centralNodeId,
    edgePickables,
    flowObjects,
    focusedZoneNodeIds,
    graph,
    group,
    hasRelationshipFocus,
    hasZoneFocus,
    nodeById,
    positions,
    relationshipDistances,
    selectedEdgeId,
    selectedNodeId,
    pulseObjects,
  });

  addNodes({
    centralNodeId,
    focusedZoneNodeIds,
    getImage,
    graph,
    group,
    hasRelationshipFocus,
    hasZoneFocus,
    illuminationObjects,
    labelSprites,
    nodePickables,
    positions,
    pulseObjects,
    relationshipDistances,
    selectedNodeId,
  });

  return {
    edgePickables,
    flowObjects,
    focusKey: cameraFocusKey(graph, centralNodeId, focusedZoneId),
    focusedZone,
    focusPoint: focusedZone?.center ?? focusPointForNode(positions, selectedNodeId ?? centralNodeId),
    group,
    illuminationKey: graphIlluminationKey(graph),
    illuminationObjects,
    labelSprites,
    nodePickables,
    positions,
    pulseObjects,
    zonePickables,
  };
}

type EdgeBuildContext = {
  centralNodeId?: string;
  edgePickables: THREE.Object3D[];
  flowObjects: THREE.Object3D[];
  focusedZoneNodeIds: Set<string>;
  graph: TenantGraph;
  group: THREE.Group;
  hasRelationshipFocus: boolean;
  hasZoneFocus: boolean;
  nodeById: Map<string, TenantNode>;
  positions: Map<string, THREE.Vector3>;
  relationshipDistances: Map<string, number>;
  selectedEdgeId?: string;
  selectedNodeId?: string;
  pulseObjects: THREE.Object3D[];
};

function addEdges({
  centralNodeId,
  edgePickables,
  flowObjects,
  focusedZoneNodeIds,
  graph,
  group,
  hasRelationshipFocus,
  hasZoneFocus,
  nodeById,
  positions,
  relationshipDistances,
  selectedEdgeId,
  selectedNodeId,
  pulseObjects,
}: EdgeBuildContext): void {
  let anchorFlowCount = 0;

  for (const edge of graph.edges) {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    if (!source || !target) {
      continue;
    }

    const color = edgeColors[edge.type] ?? '#64748b';
    const visual = edgeVisual(edge.type);
    const activeEdge = edge.id === selectedEdgeId || edge.source === selectedNodeId || edge.target === selectedNodeId;
    const edgeInFocusedZone = focusedZoneNodeIds.has(edge.source) && focusedZoneNodeIds.has(edge.target);
    const edgeTouchesAnchor =
      edge.source === selectedNodeId ||
      edge.target === selectedNodeId ||
      edge.source === centralNodeId ||
      edge.target === centralNodeId;
    const relevanceOpacity = edgeRelevanceOpacity(edge, relationshipDistances, hasRelationshipFocus);
    const dimmedEdge =
      (hasRelationshipFocus && relevanceOpacity <= 0.25 && !activeEdge) ||
      (hasZoneFocus && !edgeInFocusedZone && !activeEdge);
    const opacity = dimmedEdge
      ? visual.dimOpacity
      : activeEdge
        ? visual.activeOpacity
        : edgeTouchesAnchor
          ? Math.min(visual.activeOpacity * 0.86, Math.max(visual.opacity, relevanceOpacity))
          : Math.min(visual.opacity, relevanceOpacity);
    const material = makeEdgeMaterial(color, opacity, visual.dashSize, visual.gapSize);
    const line = new THREE.Line(makeEdgeGeometry(source, target, edge.id), material);
    if (line.material instanceof THREE.LineDashedMaterial) {
      line.computeLineDistances();
    }
    line.userData.edge = edge;
    line.renderOrder = activeEdge ? renderLayers.interactions : renderLayers.edges;
    edgePickables.push(line);
    group.add(line);

    if (visual.doubleLine) {
      const offset = edgeOffsetVector(source, target, 3.4);
      const secondLine = new THREE.Line(
        makeEdgeGeometry(source.clone().add(offset), target.clone().add(offset), `${edge.id}:double`),
        material.clone() as THREE.LineBasicMaterial | THREE.LineDashedMaterial,
      );
      if (secondLine.material instanceof THREE.LineDashedMaterial) {
        secondLine.computeLineDistances();
      }
      secondLine.renderOrder = line.renderOrder;
      group.add(secondLine);
    }

    anchorFlowCount = addRelationshipCues({
      activeEdge,
      anchorFlowCount,
      centralNodeId,
      color,
      dimmedEdge,
      edge,
      edgeTouchesAnchor,
      flowObjects,
      graph,
      group,
      hasRelationshipFocus,
      nodeById,
      pulseObjects,
      selectedNodeId,
      source,
      target,
      visual,
    });
  }
}

function makeEdgeMaterial(
  color: string,
  opacity: number,
  dashSize?: number,
  gapSize?: number,
): THREE.LineBasicMaterial | THREE.LineDashedMaterial {
  if (dashSize && gapSize) {
    return new THREE.LineDashedMaterial({
      blending: THREE.AdditiveBlending,
      color,
      dashSize,
      depthWrite: false,
      gapSize,
      opacity,
      transparent: true,
    });
  }

  return new THREE.LineBasicMaterial({
    blending: THREE.AdditiveBlending,
    color,
    depthWrite: false,
    opacity,
    transparent: true,
  });
}

type RelationshipCueContext = {
  activeEdge: boolean;
  anchorFlowCount: number;
  centralNodeId?: string;
  color: string;
  dimmedEdge: boolean;
  edge: TenantEdge;
  edgeTouchesAnchor: boolean;
  flowObjects: THREE.Object3D[];
  graph: TenantGraph;
  group: THREE.Group;
  hasRelationshipFocus: boolean;
  nodeById: Map<string, TenantNode>;
  pulseObjects: THREE.Object3D[];
  selectedNodeId?: string;
  source: THREE.Vector3;
  target: THREE.Vector3;
  visual: ReturnType<typeof edgeVisual>;
};

function addRelationshipCues({
  activeEdge,
  anchorFlowCount,
  centralNodeId,
  color,
  dimmedEdge,
  edge,
  edgeTouchesAnchor,
  flowObjects,
  graph,
  group,
  hasRelationshipFocus,
  nodeById,
  pulseObjects,
  selectedNodeId,
  source,
  target,
  visual,
}: RelationshipCueContext): number {
  let nextAnchorFlowCount = anchorFlowCount;
  const sourceNode = nodeById.get(edge.source);
  const targetNode = nodeById.get(edge.target);
  const arrowEndpoints = directionEndpoints(edge, source, target, sourceNode, targetNode);
  if (arrowEndpoints && !dimmedEdge) {
    group.add(makeEdgeArrow(arrowEndpoints.source, arrowEndpoints.target, color, activeEdge ? 0.82 : 0.46));
  }
  if (visual.animated && !dimmedEdge) {
    const pulse = makeDependencyPulse(source, target, color, stableHash(edge.id));
    pulseObjects.push(pulse);
    group.add(pulse);
  }
  if (edgeTouchesAnchor && !dimmedEdge && anchorFlowCount < 48) {
    const pulseStartsAtSource = edge.source === selectedNodeId || edge.source === centralNodeId;
    const flowPulse = makeRelationshipFlowPulse(
      pulseStartsAtSource ? source : target,
      pulseStartsAtSource ? target : source,
      color,
      stableHash(edge.id),
      activeEdge,
    );
    flowObjects.push(flowPulse);
    group.add(flowPulse);
    nextAnchorFlowCount += 1;
  }

  if ((activeEdge || (!hasRelationshipFocus && graph.edges.length <= 36)) && !dimmedEdge) {
    group.add(makeEdgeLabel(relationshipLabel(edge), edgeLabelPosition(source, target, edge.id), color, activeEdge));
  }

  return nextAnchorFlowCount;
}

type NodeBuildContext = {
  centralNodeId?: string;
  focusedZoneNodeIds: Set<string>;
  getImage: (nodeId: string) => HTMLImageElement | undefined;
  graph: TenantGraph;
  group: THREE.Group;
  hasRelationshipFocus: boolean;
  hasZoneFocus: boolean;
  illuminationObjects: THREE.Object3D[];
  labelSprites: THREE.Sprite[];
  nodePickables: THREE.Object3D[];
  positions: Map<string, THREE.Vector3>;
  pulseObjects: THREE.Object3D[];
  relationshipDistances: Map<string, number>;
  selectedNodeId?: string;
};

function addNodes({
  centralNodeId,
  focusedZoneNodeIds,
  getImage,
  graph,
  group,
  hasRelationshipFocus,
  hasZoneFocus,
  illuminationObjects,
  labelSprites,
  nodePickables,
  positions,
  pulseObjects,
  relationshipDistances,
  selectedNodeId,
}: NodeBuildContext): void {
  for (const node of graph.nodes) {
    const position = positions.get(node.id);
    if (!position) {
      continue;
    }

    const isCentral = node.id === centralNodeId;
    const isSelected = node.id === selectedNodeId;
    const relationshipDistance = relationshipDistances.get(node.id);
    const nodeOpacity = nodeRelevanceOpacity(relationshipDistance, hasRelationshipFocus);
    const dimmedByZone = hasZoneFocus && !focusedZoneNodeIds.has(node.id);
    const dimmed = (hasRelationshipFocus && nodeOpacity <= 0.25) || dimmedByZone;
    const isActive = isCentral || isSelected || relationshipDistance === 0 || relationshipDistance === 1;
    const iconSize = isSelected ? 34 : isCentral ? 32 : 22;
    const color = iconColor(node);

    const illumination = makeNodeIllumination(position, iconSize, color, {
      dimmed,
      prominent: isCentral || isSelected,
    });
    illuminationObjects.push(...(illumination.illuminationObjects ?? []));
    group.add(illumination.object);

    const layers = makeNodeLayers(position, iconSize, color, {
      active: isActive,
      dimmed,
      signalColor: nodeSignalColor(node),
    });
    pulseObjects.push(...(layers.pulseObjects ?? []));
    group.add(layers.object);
    if (isCentral || isSelected) {
      addSelectedNodeCues(group, pulseObjects, node, position, iconSize, color, isCentral);
    }
    addNodeIcon({
      color,
      dimmedByZone,
      getImage,
      group,
      iconSize,
      isCentral,
      isSelected,
      node,
      nodeOpacity,
      nodePickables,
      position,
    });
    addNodeLabel({
      color,
      group,
      isCentral,
      isSelected,
      labelSprites,
      node,
      position,
      relationshipDistance,
    });
  }
}

function addSelectedNodeCues(
  group: THREE.Group,
  pulseObjects: THREE.Object3D[],
  node: TenantNode,
  position: THREE.Vector3,
  iconSize: number,
  color: string,
  isCentral: boolean,
): void {
  const haloOpacity = isCentral ? 0.34 : 0.28;
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(iconSize * 0.8, 18, 10),
    new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color,
      depthWrite: false,
      opacity: haloOpacity,
      transparent: true,
    }),
  );
  halo.position.copy(position);
  halo.renderOrder = renderLayers.interactions + 2;
  setPulse(halo, haloOpacity, stableHash(node.id) * 0.01, 0.08, 1.7);
  pulseObjects.push(halo);
  group.add(halo);
  const anchor = makeSelectionAnchor(position, iconSize, color, stableHash(node.id));
  pulseObjects.push(...(anchor.pulseObjects ?? []));
  group.add(anchor.object);
  const focusRings = makeFocusRings(position, iconSize * 0.42, color, stableHash(node.id));
  pulseObjects.push(...(focusRings.pulseObjects ?? []));
  group.add(focusRings.object);
}

type NodeIconContext = {
  color: string;
  dimmedByZone: boolean;
  getImage: (nodeId: string) => HTMLImageElement | undefined;
  group: THREE.Group;
  iconSize: number;
  isCentral: boolean;
  isSelected: boolean;
  node: TenantNode;
  nodeOpacity: number;
  nodePickables: THREE.Object3D[];
  position: THREE.Vector3;
};

function addNodeIcon({
  color,
  dimmedByZone,
  getImage,
  group,
  iconSize,
  isCentral,
  isSelected,
  node,
  nodeOpacity,
  nodePickables,
  position,
}: NodeIconContext): void {
  const icon = makeNodeIcon(node, color, isCentral || isSelected, getImage(node.id));
  icon.position.copy(position);
  icon.scale.set(iconSize, iconSize, 1);
  icon.userData.node = node;
  icon.renderOrder = isSelected ? renderLayers.interactions + 3 : renderLayers.nodes + 2;
  (icon.material as THREE.SpriteMaterial).opacity = dimmedByZone
    ? 0.14
    : nodeDisplayOpacity(nodeOpacity, isCentral || isSelected);
  nodePickables.push(icon);
  group.add(icon);
}

type NodeLabelContext = {
  color: string;
  group: THREE.Group;
  isCentral: boolean;
  isSelected: boolean;
  labelSprites: THREE.Sprite[];
  node: TenantNode;
  position: THREE.Vector3;
  relationshipDistance?: number;
};

function addNodeLabel({
  color,
  group,
  isCentral,
  isSelected,
  labelSprites,
  node,
  position,
  relationshipDistance,
}: NodeLabelContext): void {
  const label = makeLabel(node.label, position, isCentral || isSelected, color);
  label.userData.graphLabel = {
    direct: relationshipDistance === 1,
    nodeId: node.id,
    priority: labelPriority(isSelected, isCentral, relationshipDistance),
    relationshipDistance,
    selected: isSelected,
  } satisfies GraphLabelData;
  const labelMaterial = label.material as THREE.SpriteMaterial;
  labelMaterial.opacity = 0;
  label.visible = false;
  labelSprites.push(label);
  group.add(label);
}

export function pointsForZone(zone: GraphZone, positions: Map<string, THREE.Vector3>): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (const nodeId of zone.nodeIds) {
    const position = positions.get(nodeId);
    if (position) {
      points.push(position);
    }
  }
  return points;
}

function focusPointForNode(positions: Map<string, THREE.Vector3>, nodeId: string | undefined): THREE.Vector3 | undefined {
  return nodeId ? positions.get(nodeId) : undefined;
}

function cameraFocusKey(graph: TenantGraph, centralNodeId: string | undefined, focusedZoneId: string | undefined): string {
  return [
    focusedZoneId ?? 'graph',
    centralNodeId ?? '',
    graph.nodes.length,
    graph.edges.length,
    graph.nodes.map((node) => node.id).join('|'),
  ].join(':');
}

function graphIlluminationKey(graph: TenantGraph): string {
  return [
    graph.nodes.length,
    graph.edges.length,
    graph.nodes.map((node) => node.id).join('|'),
  ].join(':');
}
