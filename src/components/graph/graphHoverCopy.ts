import type { TenantEdge, TenantGraph, TenantNode } from '../../models/tenantGraph';
import { relatedEdges } from '../../utils/graphUtils';
import { describeReadableRelationship, readableObjectType } from '../../utils/readableGraph';
import type { GraphZone } from './graphLayout';

export type GraphHoverTarget = {
  edge?: TenantEdge;
  node?: TenantNode;
  zone?: GraphZone;
};

export type HoverCopy = {
  detail?: string;
  subtitle: string;
  title: string;
};

export function describeHover(hover: GraphHoverTarget, graph: TenantGraph): HoverCopy {
  if (hover.node) {
    return describeNodeHover(hover.node, graph);
  }

  if (hover.edge) {
    const source = graph.nodes.find((node) => node.id === hover.edge?.source);
    const target = graph.nodes.find((node) => node.id === hover.edge?.target);
    const relationship = describeReadableRelationship(hover.edge, source, target);
    return {
      title: relationship.label,
      subtitle: relationship.sentence,
      detail: [source?.label, target?.label].filter(Boolean).join(' -> '),
    };
  }

  if (hover.zone) {
    return {
      title: hover.zone.label,
      subtitle: `${hover.zone.nodeCount} visible ${hover.zone.nodeCount === 1 ? 'object' : 'objects'}`,
      detail: 'Click to zoom into this cluster and isolate its object types.',
    };
  }

  return { title: 'Tenant object', subtitle: 'No metadata available.' };
}

function describeNodeHover(node: TenantNode, graph: TenantGraph): HoverCopy {
  const edges = relatedEdges(graph, node.id);
  const nodeById = new Map(graph.nodes.map((candidate) => [candidate.id, candidate]));
  const relatedTypes = new Map<string, number>();

  for (const edge of edges) {
    const relatedId = edge.source === node.id ? edge.target : edge.source;
    const relatedNode = nodeById.get(relatedId);
    if (relatedNode) {
      const type = readableObjectType(relatedNode);
      relatedTypes.set(type, (relatedTypes.get(type) ?? 0) + 1);
    }
  }

  const detail = Array.from(relatedTypes.entries())
    .toSorted((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
    .slice(0, 3)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');

  return {
    title: node.label,
    subtitle: `${readableObjectType(node)} / ${edges.length} visible ${edges.length === 1 ? 'relationship' : 'relationships'}`,
    detail: detail || node.subtitle || 'Expand this object to load more context.',
  };
}
