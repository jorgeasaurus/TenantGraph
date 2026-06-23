import * as THREE from 'three';
import type { TenantEdge, TenantGraph, TenantNode, TenantNodeType, TenantRelationshipType } from '../../models/tenantGraph';
import { metadataText, stableHash } from '../../utils/graphUtils';
import { policyNodeTypes } from '../../utils/typePresentation';

export type EdgeVisual = {
  activeOpacity: number;
  animated?: boolean;
  dashSize?: number;
  dimOpacity: number;
  doubleLine?: boolean;
  gapSize?: number;
  opacity: number;
};

const graphPolicyNodeTypes = new Set<TenantNodeType>(policyNodeTypes);

export function buildRelationshipDistances(graph: TenantGraph, selectedNodeId: string | undefined): Map<string, number> {
  const distances = new Map<string, number>();
  if (!selectedNodeId || !graph.nodes.some((node) => node.id === selectedNodeId)) {
    return distances;
  }

  distances.set(selectedNodeId, 0);
  let frontier = new Set([selectedNodeId]);

  for (let depth = 1; depth <= 2; depth += 1) {
    const next = new Set<string>();
    for (const edge of graph.edges) {
      if (frontier.has(edge.source) && !distances.has(edge.target)) {
        distances.set(edge.target, depth);
        next.add(edge.target);
      }
      if (frontier.has(edge.target) && !distances.has(edge.source)) {
        distances.set(edge.source, depth);
        next.add(edge.source);
      }
    }
    frontier = next;
  }

  return distances;
}

export function nodeRelevanceOpacity(distance: number | undefined, hasRelationshipFocus: boolean): number {
  if (!hasRelationshipFocus) {
    return 1;
  }

  switch (distance) {
    case 0:
      return 1;
    case 1:
      return 0.85;
    case 2:
      return 0.6;
    default:
      return 0.2;
  }
}

export function nodeDisplayOpacity(relevanceOpacity: number, prominent: boolean): number {
  const maximum = prominent ? 0.96 : 0.88;
  return Math.min(maximum, relevanceOpacity);
}

export function edgeRelevanceOpacity(
  edge: TenantEdge,
  distances: Map<string, number>,
  hasRelationshipFocus: boolean,
): number {
  if (!hasRelationshipFocus) {
    return 1;
  }

  const sourceDistance = distances.get(edge.source);
  const targetDistance = distances.get(edge.target);
  const maxDistance = Math.max(sourceDistance ?? 99, targetDistance ?? 99);

  if (maxDistance <= 1) {
    return 1;
  }
  if (maxDistance === 2) {
    return 0.6;
  }
  return 0.2;
}

export function labelPriority(
  selected: boolean,
  central: boolean,
  relationshipDistance: number | undefined,
): number {
  if (selected) {
    return 100;
  }
  if (relationshipDistance === 0) {
    return 96;
  }
  if (central) {
    return 86;
  }
  if (relationshipDistance === 1) {
    return 74;
  }
  if (relationshipDistance === 2) {
    return 42;
  }
  return 12;
}

export function edgeVisual(type: TenantRelationshipType): EdgeVisual {
  switch (type) {
    case 'assignment':
      return { activeOpacity: 0.98, dimOpacity: 0.08, opacity: 0.62 };
    case 'filteredBy':
      return { activeOpacity: 0.96, dashSize: 1.4, dimOpacity: 0.07, gapSize: 4.4, opacity: 0.58 };
    case 'scopeTag':
      return { activeOpacity: 0.82, dimOpacity: 0.05, opacity: 0.34 };
    case 'member':
    case 'memberOf':
      return { activeOpacity: 0.84, dashSize: 8.4, dimOpacity: 0.06, gapSize: 5.8, opacity: 0.42 };
    case 'primaryUser':
      return { activeOpacity: 0.94, dimOpacity: 0.08, doubleLine: true, opacity: 0.54 };
    case 'detectedApp':
      return { activeOpacity: 0.82, animated: true, dashSize: 1.6, dimOpacity: 0.05, gapSize: 5.4, opacity: 0.34 };
    default:
      return { activeOpacity: 0.78, dimOpacity: 0.05, opacity: 0.38 };
  }
}

export function directionEndpoints(
  edge: TenantEdge,
  source: THREE.Vector3,
  target: THREE.Vector3,
  sourceNode?: TenantNode,
  targetNode?: TenantNode,
): { source: THREE.Vector3; target: THREE.Vector3 } | undefined {
  if (edge.type === 'scopeTag' || edge.type === 'filteredBy') {
    return undefined;
  }

  if (edge.type === 'primaryUser') {
    if (sourceNode?.type === 'user' && targetNode?.type === 'device') {
      return { source, target };
    }
    if (sourceNode?.type === 'device' && targetNode?.type === 'user') {
      return { source: target, target: source };
    }
  }

  if (sourceNode?.type === 'group' && targetNode?.type === 'app') {
    return { source, target };
  }
  if (sourceNode?.type === 'app' && targetNode?.type === 'group') {
    return { source: target, target: source };
  }

  if (isPolicyType(sourceNode?.type) && targetNode?.type === 'appAssignment') {
    return { source, target };
  }
  if (sourceNode?.type === 'appAssignment' && isPolicyType(targetNode?.type)) {
    return { source: target, target: source };
  }

  if (['assignment', 'target', 'member', 'memberOf', 'detectedApp'].includes(edge.type)) {
    return { source, target };
  }

  return undefined;
}

export function edgeOffsetVector(source: THREE.Vector3, target: THREE.Vector3, amount: number): THREE.Vector3 {
  const offset = new THREE.Vector3(target.z - source.z, 0, source.x - target.x);
  if (offset.lengthSq() === 0) {
    return new THREE.Vector3(amount, 0, 0);
  }
  return offset.normalize().multiplyScalar(amount);
}

export function edgeLabelPosition(source: THREE.Vector3, target: THREE.Vector3, id: string): THREE.Vector3 {
  const midpoint = new THREE.Vector3().addVectors(source, target).multiplyScalar(0.5);
  midpoint.y += 9 + (stableHash(id) % 9);
  return midpoint;
}

export function nodeSignalColor(node: TenantNode): string | undefined {
  const label = node.label.toLowerCase();
  const compliance = metadataText(node, 'compliance')?.toLowerCase();
  const intent = metadataText(node, 'intent')?.toLowerCase();

  if (label === 'all users' || label === 'all devices' || node.metadata?.virtual === true) {
    return '#fbbf24';
  }
  if (node.type === 'directoryRole') {
    return '#f59e0b';
  }
  if (node.type === 'assignmentFilter' || node.type === 'scopeTag') {
    return '#ff2bd6';
  }
  if (compliance?.includes('noncompliant')) {
    return '#ff3366';
  }
  if (intent?.includes('required') || intent?.includes('uninstall')) {
    return '#fbbf24';
  }

  return undefined;
}

function isPolicyType(type: TenantNodeType | undefined): boolean {
  return Boolean(type && graphPolicyNodeTypes.has(type));
}
