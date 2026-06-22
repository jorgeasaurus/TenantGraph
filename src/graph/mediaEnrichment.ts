import type { TenantGraph, TenantGraphResult, TenantNode } from '../models/tenantGraph';
import { nodeApiId } from '../utils/graphUtils';
import { mobileAppToNode, type GraphObject } from './adapters';
import type { GraphClient, GraphVersion } from './client';

type MediaSpec = {
  batchSize?: number;
  fetch: (client: GraphClient, node: TenantNode) => Promise<string | undefined>;
  limit: number;
  matches: (node: TenantNode) => boolean;
};

const mobileAppIconSelect = '$select=id,largeIcon';
const mobileAppIconLimit = 24;
const userPhotoSize = '48x48';
const userPhotoLimit = 32;
const userPhotoBatchSize = 6;

export async function hydrateResultMedia(
  client: GraphClient,
  result: TenantGraphResult,
): Promise<TenantGraphResult> {
  return {
    ...result,
    graph: await hydrateGraphMedia(client, result.graph),
  };
}

async function hydrateGraphMedia(client: GraphClient, graph: TenantGraph): Promise<TenantGraph> {
  const withAppIcons = await hydrateNodeMedia(client, graph, mobileAppIconSpec());
  return hydrateNodeMedia(client, withAppIcons, userPhotoSpec());
}

function mobileAppIconSpec(version: GraphVersion = 'v1.0'): MediaSpec {
  return {
    limit: mobileAppIconLimit,
    matches: (node) => node.type === 'app' && !node.iconDataUrl && !nodeApiId(node).startsWith('detected-'),
    fetch: async (client, node) => {
      const app = await client.get<GraphObject>(
        `/deviceAppManagement/mobileApps/${encodeURIComponent(nodeApiId(node))}?${mobileAppIconSelect}`,
        undefined,
        version,
      );
      return mobileAppToNode(app).iconDataUrl;
    },
  };
}

function userPhotoSpec(): MediaSpec {
  return {
    batchSize: userPhotoBatchSize,
    limit: userPhotoLimit,
    matches: (node) => node.type === 'user' && !node.iconDataUrl,
    fetch: async (client, node) => {
      const photo = await client.getDataUrl(
        `/users/${encodeURIComponent(nodeApiId(node))}/photos/${userPhotoSize}/$value`,
      );
      return isImageDataUrl(photo) ? photo : undefined;
    },
  };
}

async function hydrateNodeMedia(
  client: GraphClient,
  graph: TenantGraph,
  spec: MediaSpec,
): Promise<TenantGraph> {
  const nodes = graph.nodes.filter(spec.matches).slice(0, spec.limit);
  if (nodes.length === 0) {
    return graph;
  }

  const mediaByNodeId = new Map<string, string>();
  const batchSize = spec.batchSize ?? spec.limit;

  for (let index = 0; index < nodes.length; index += batchSize) {
    const batch = nodes.slice(index, index + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (node) => {
        const media = await spec.fetch(client, node);
        return media ? ([node.id, media] as const) : undefined;
      }),
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        mediaByNodeId.set(result.value[0], result.value[1]);
      }
    }
  }

  if (mediaByNodeId.size === 0) {
    return graph;
  }

  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      const iconDataUrl = mediaByNodeId.get(node.id);
      return iconDataUrl ? { ...node, iconDataUrl } : node;
    }),
  };
}

function isImageDataUrl(value: string): boolean {
  return value.startsWith('data:image/');
}
