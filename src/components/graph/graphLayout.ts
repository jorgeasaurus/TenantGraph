import * as THREE from 'three';
import type { TenantGraph, TenantNode } from '../../models/tenantGraph';
import { stableHash } from '../../utils/graphUtils';
import { type GraphZoneDefinition, zoneForNode } from '../../utils/graphZones';

export type GraphZone = GraphZoneDefinition & {
  boundary: THREE.Vector3[];
  center: THREE.Vector3;
  nodeCount: number;
  radius: number;
};

export type GraphLayout = {
  positions: Map<string, THREE.Vector3>;
  zones: GraphZone[];
};

export function layoutGraph(graph: TenantGraph, centralNodeId?: string): GraphLayout {
  const positions = new Map<string, THREE.Vector3>();
  const zones = new Map<string, { definition: GraphZoneDefinition; nodes: TenantNode[] }>();
  const central = centralNodeId ? graph.nodes.find((node) => node.id === centralNodeId) : graph.nodes[0];

  if (central) {
    positions.set(central.id, new THREE.Vector3(0, 0, 0));
  }

  for (const node of graph.nodes) {
    if (node.id === central?.id) {
      continue;
    }
    const definition = zoneForNode(node);
    const zone = zones.get(definition.id) ?? { definition, nodes: [] };
    zone.nodes.push(node);
    zones.set(definition.id, zone);
  }

  const orderedZones = [...zones.values()].sort((first, second) => first.definition.order - second.definition.order);
  const zoneOrbit = Math.max(58, Math.min(210, 25 * Math.sqrt(Math.max(graph.nodes.length, 2))));
  const renderedZones: GraphZone[] = [];

  orderedZones.forEach((zone, zoneIndex) => {
    const zoneAngle = -Math.PI / 2 + (zoneIndex / Math.max(orderedZones.length, 1)) * Math.PI * 2;
    const zoneCenter = new THREE.Vector3(Math.cos(zoneAngle) * zoneOrbit, 0, Math.sin(zoneAngle) * zoneOrbit);
    const typeBuckets = bucketByType(zone.nodes);
    const bucketTypes = [...typeBuckets.keys()].sort();
    let zoneRadius = 42;

    bucketTypes.forEach((type, typeIndex) => {
      const nodes = typeBuckets.get(type) ?? [];
      const bucketAngle = (typeIndex / Math.max(bucketTypes.length, 1)) * Math.PI * 2;
      const bucketRadius = bucketTypes.length > 1 ? 18 + Math.sqrt(zone.nodes.length) * 3.5 : 0;
      const bucketCenter = zoneCenter
        .clone()
        .add(new THREE.Vector3(Math.cos(bucketAngle) * bucketRadius, 0, Math.sin(bucketAngle) * bucketRadius));

      nodes.forEach((node, index) => {
        const angle = index * 2.399963 + (stableHash(type) % 100) * 0.01;
        const ring = Math.ceil(Math.sqrt(index + 1));
        const radius = 8 + ring * 7.2;
        const y = ((stableHash(node.id) % 9) - 4) * 2.4;
        const position = new THREE.Vector3(
          bucketCenter.x + Math.cos(angle) * radius,
          y,
          bucketCenter.z + Math.sin(angle) * radius,
        );
        positions.set(node.id, position);
        zoneRadius = Math.max(zoneRadius, zoneCenter.distanceTo(position) + 24);
      });
    });

    const zonePositions = zone.nodes
      .map((node) => positions.get(node.id))
      .filter((position): position is THREE.Vector3 => Boolean(position));

    renderedZones.push({
      ...zone.definition,
      boundary: makeZoneBoundary(zoneCenter, zonePositions, Math.min(150, zoneRadius)),
      center: zoneCenter,
      nodeCount: zone.nodes.length,
      radius: Math.min(150, zoneRadius),
    });
  });

  return { positions, zones: renderedZones };
}

export function makeEdgeGeometry(source: THREE.Vector3, target: THREE.Vector3, id: string): THREE.BufferGeometry {
  const distance = source.distanceTo(target);
  const midpoint = new THREE.Vector3().addVectors(source, target).multiplyScalar(0.5);
  const side = new THREE.Vector3(target.z - source.z, 0, source.x - target.x);
  if (side.lengthSq() > 0) {
    side.normalize().multiplyScalar((((stableHash(id) % 200) - 100) / 100) * Math.min(34, distance * 0.075));
  }
  midpoint.y += Math.min(76, Math.max(10, distance * 0.13));
  midpoint.add(side);

  return new THREE.BufferGeometry().setFromPoints(
    new THREE.QuadraticBezierCurve3(source.clone(), midpoint, target.clone()).getPoints(20),
  );
}

function bucketByType(nodes: TenantNode[]): Map<string, TenantNode[]> {
  const buckets = new Map<string, TenantNode[]>();

  for (const node of nodes) {
    buckets.set(node.type, [...(buckets.get(node.type) ?? []), node]);
  }

  return buckets;
}

function makeZoneBoundary(
  center: THREE.Vector3,
  positions: THREE.Vector3[],
  fallbackRadius: number,
): THREE.Vector3[] {
  const uniquePoints = positions
    .map((position) => new THREE.Vector2(position.x, position.z))
    .filter((point, index, points) =>
      points.findIndex((candidate) => candidate.distanceToSquared(point) < 0.01) === index,
    );

  if (uniquePoints.length < 3) {
    return makeFallbackBoundary(center, fallbackRadius);
  }

  const hull = convexHull(uniquePoints);
  const padded = hull.map((point) => {
    const direction = new THREE.Vector2(point.x - center.x, point.y - center.z);
    if (direction.lengthSq() === 0) {
      direction.set(1, 0);
    }
    direction.normalize().multiplyScalar(28);
    return new THREE.Vector3(point.x + direction.x, -14, point.y + direction.y);
  });

  return padded.length >= 3 ? padded : makeFallbackBoundary(center, fallbackRadius);
}

function makeFallbackBoundary(center: THREE.Vector3, radius: number): THREE.Vector3[] {
  return Array.from({ length: 18 }, (_, index) => {
    const angle = (index / 18) * Math.PI * 2;
    return new THREE.Vector3(
      center.x + Math.cos(angle) * radius,
      -14,
      center.z + Math.sin(angle) * radius,
    );
  });
}

function convexHull(points: THREE.Vector2[]): THREE.Vector2[] {
  const sorted = [...points].sort((first, second) => first.x - second.x || first.y - second.y);
  const lower: THREE.Vector2[] = [];
  const upper: THREE.Vector2[] = [];

  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  for (const point of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function cross(origin: THREE.Vector2, first: THREE.Vector2, second: THREE.Vector2): number {
  return (first.x - origin.x) * (second.y - origin.y) - (first.y - origin.y) * (second.x - origin.x);
}
