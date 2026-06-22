import type { TenantNode, TenantNodeType } from '../models/tenantGraph';
import {
  graphZoneDefinitions,
  graphZoneNodeTypes,
  type GraphZoneDefinition,
  type GraphZoneId,
} from './typePresentation';

export {
  sidebarTypeSections,
  type GraphZoneDefinition,
} from './typePresentation';

export function zoneForNode(node: Pick<TenantNode, 'type'>): GraphZoneDefinition {
  return zoneForNodeType(node.type);
}

function zoneForNodeType(type: TenantNodeType): GraphZoneDefinition {
  for (const [zoneId, nodeTypes] of Object.entries(graphZoneNodeTypes)) {
    if (nodeTypes.includes(type)) {
      return graphZoneDefinitions[zoneId as GraphZoneId];
    }
  }

  return graphZoneDefinitions.context;
}

export function nodeTypesForZone(zoneId: string): Set<TenantNodeType> {
  return new Set(graphZoneNodeTypes[zoneId as GraphZoneId] ?? []);
}
