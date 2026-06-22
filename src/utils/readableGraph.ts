import {
  relationshipTypeLabels,
  type TenantEdge,
  type TenantGraph,
  type TenantNode,
} from '../models/tenantGraph';
import { metadataText, relatedEdges, relationshipLabel } from './graphUtils';
import {
  glossaryForConfig,
  readableConfig,
  type ReadableBadge,
  type ReadableGlossaryItem,
} from './readableNodeConfig';
import { policyNodeTypes } from './typePresentation';

export type ReadableNodeSummary = {
  objectType: string;
  summary: string;
  impact: string;
  nextStep: string;
  badges: ReadableBadge[];
  glossary: ReadableGlossaryItem[];
};

export type ReadableRelationship = {
  label: string;
  sentence: string;
};

export type ReadableClusterSummary = {
  id: string;
  label: string;
  count: number;
  description: string;
  detail?: string;
  tone: 'cyan' | 'green' | 'magenta' | 'violet' | 'amber' | 'blue';
};

export type ReadablePathCandidate = {
  id: string;
  label: string;
  objectType: string;
  subtitle?: string;
};

type ReadablePathStep = {
  id: string;
  edge: TenantEdge;
  from: TenantNode;
  to: TenantNode;
  relationship: ReadableRelationship;
};

export type ReadablePathResult = {
  target: TenantNode;
  summary: string;
  steps: ReadablePathStep[];
};

type ReadableConfig = ReturnType<typeof readableConfig>;

type ReadableBadgeContext = {
  compliance?: string;
  edgeCount: number;
  node: TenantNode;
  objectType: string;
  platform?: string;
};

export function readableObjectType(node: Pick<TenantNode, 'type'> | undefined): string {
  if (!node) {
    return 'object';
  }

  return readableConfig(node.type).objectType;
}

export function summarizeReadableNode(graph: TenantGraph, node: TenantNode | undefined): ReadableNodeSummary | undefined {
  if (!node) {
    return undefined;
  }

  const edges = relatedEdges(graph, node.id);
  const neighbors = connectedNodes(graph, node, edges);
  const counts = countByType(neighbors);
  const config = readableConfig(node.type);
  const objectType = config.objectType;
  const platform = metadataText(node, 'os') ?? metadataText(node, 'platform') ?? metadataText(node, 'platforms');
  const compliance = metadataText(node, 'compliance');
  const visibleImpact = impactSentence(edges.length, counts);
  const context = { compliance, objectType, platform };

  return {
    objectType,
    summary: config.summary(context),
    impact: visibleImpact,
    nextStep: nextStepForNode(config, edges.length),
    badges: badgesForNode(node, config, { ...context, edgeCount: edges.length, node }),
    glossary: glossaryForConfig(config),
  };
}

export function describeReadableRelationship(
  edge: TenantEdge,
  source: TenantNode | undefined,
  target: TenantNode | undefined,
): ReadableRelationship {
  const sourceName = source?.label ?? 'The source object';
  const targetName = target?.label ?? 'the target object';
  const label = relationshipLabel(edge);

  switch (edge.type) {
    case 'assignment':
      return {
        label,
        sentence: `${sourceName} has an assignment rule that leads to ${targetName}.`,
      };
    case 'detectedApp':
      return {
        label,
        sentence: `${targetName} was detected on ${sourceName}.`,
      };
    case 'accessed':
      return {
        label,
        sentence: `${sourceName} accessed ${targetName}.`,
      };
    case 'blockedBy':
      return {
        label,
        sentence: `${sourceName} was blocked by ${targetName}.`,
      };
    case 'evaluatedPolicy':
      return {
        label,
        sentence: `${targetName} evaluated ${sourceName}.`,
      };
    case 'grantedBy':
      return {
        label,
        sentence: `${sourceName} was granted by ${targetName}.`,
      };
    case 'filteredBy':
      return {
        label,
        sentence: `${targetName} limits when ${sourceName} applies.`,
      };
    case 'member':
      return {
        label,
        sentence: `${targetName} is a member of ${sourceName}.`,
      };
    case 'memberOf':
      return {
        label,
        sentence: `${sourceName} is a member of ${targetName}.`,
      };
    case 'primaryUser':
      return {
        label,
        sentence: `${sourceName} is the primary user for ${targetName}.`,
      };
    case 'scopeTag':
      return {
        label,
        sentence: `${targetName} controls admin visibility for ${sourceName}.`,
      };
    case 'target':
      return {
        label,
        sentence: `${sourceName} targets ${targetName}.`,
      };
    default:
      return {
        label: relationshipTypeLabels[edge.type as keyof typeof relationshipTypeLabels] ?? label,
        sentence: `${sourceName} is related to ${targetName}.`,
      };
  }
}

export function summarizeReadableClusters(graph: TenantGraph): ReadableClusterSummary[] {
  const counts = countByType(graph.nodes);
  const policyCount = policyNodeTypes.reduce((total, type) => total + (counts.get(type) ?? 0), 0);
  const guardrailCount = (counts.get('assignmentFilter') ?? 0) + (counts.get('scopeTag') ?? 0);
  const summaries: ReadableClusterSummary[] = [
    {
      id: 'people',
      label: 'People',
      count: counts.get('user') ?? 0,
      description: 'Accounts that can receive apps, policies, or device ownership.',
      tone: 'amber',
    },
    {
      id: 'devices',
      label: 'Devices',
      count: counts.get('device') ?? 0,
      description: 'Managed endpoints connected to users, apps, and policies.',
      detail: devicePlatformDetail(graph.nodes),
      tone: 'cyan',
    },
    {
      id: 'groups',
      label: 'Groups',
      count: counts.get('group') ?? 0,
      description: 'Targeting containers that often decide who receives changes.',
      tone: 'green',
    },
    {
      id: 'roles',
      label: 'Roles',
      count: counts.get('directoryRole') ?? 0,
      description: 'Entra admin roles connected to people through membership.',
      tone: 'amber',
    },
    {
      id: 'apps',
      label: 'Apps',
      count: counts.get('app') ?? 0,
      description: 'Managed or detected software connected to devices and assignments.',
      tone: 'magenta',
    },
    {
      id: 'cloudApps',
      label: 'Cloud apps',
      count: counts.get('cloudApp') ?? 0,
      description: 'Sign-in resources evaluated by Entra and Conditional Access.',
      tone: 'blue',
    },
    {
      id: 'policies',
      label: 'Policies',
      count: policyCount,
      description: 'Rules that configure, enroll, or evaluate devices.',
      detail: policyDetail(counts),
      tone: 'violet',
    },
    {
      id: 'assignments',
      label: 'Assignments',
      count: counts.get('appAssignment') ?? 0,
      description: 'Delivery rules that connect apps or policies to targets.',
      tone: 'blue',
    },
    {
      id: 'guardrails',
      label: 'Guardrails',
      count: guardrailCount,
      description: 'Filters and scope tags that narrow impact or admin visibility.',
      detail: guardrailDetail(counts),
      tone: 'amber',
    },
  ];

  return summaries.filter((summary) => summary.count > 0);
}

export function readablePathCandidates(
  graph: TenantGraph,
  selectedNode: TenantNode | undefined,
): ReadablePathCandidate[] {
  if (!selectedNode) {
    return [];
  }

  const preferredTypes = new Set(readableConfig(selectedNode.type).pathTargets);
  const fallbackTypes = new Set([
    ...preferredTypes,
    'directoryRole',
    'group',
    'user',
    'device',
    'app',
    'cloudApp',
    ...policyNodeTypes,
  ]);

  return graph.nodes
    .filter((node) => node.id !== selectedNode.id)
    .filter((node) => fallbackTypes.has(node.type))
    .filter((node) => explainReadablePath(graph, selectedNode.id, node.id))
    .sort((first, second) => {
      const firstRank = preferredTypes.has(first.type) ? 0 : 1;
      const secondRank = preferredTypes.has(second.type) ? 0 : 1;
      return (
        firstRank - secondRank ||
        readableObjectType(first).localeCompare(readableObjectType(second)) ||
        first.label.localeCompare(second.label)
      );
    })
    .slice(0, 40)
    .map((node) => ({
      id: node.id,
      label: node.label,
      objectType: readableObjectType(node),
      subtitle: node.subtitle,
    }));
}

export function explainReadablePath(
  graph: TenantGraph,
  startId: string | undefined,
  targetId: string | undefined,
): ReadablePathResult | undefined {
  if (!startId || !targetId || startId === targetId) {
    return undefined;
  }

  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const start = nodes.get(startId);
  const target = nodes.get(targetId);
  if (!start || !target) {
    return undefined;
  }

  const path = shortestPath(graph, startId, targetId);
  if (!path) {
    return undefined;
  }

  const steps = path.edges.map((edge, index) => {
    const from = nodes.get(path.nodeIds[index]);
    const to = nodes.get(path.nodeIds[index + 1]);
    const edgeSource = nodes.get(edge.source);
    const edgeTarget = nodes.get(edge.target);

    if (!from || !to) {
      return undefined;
    }

    return {
      id: `${edge.id}:${index}`,
      edge,
      from,
      to,
      relationship: describeReadableRelationship(edge, edgeSource, edgeTarget),
    };
  });

  if (steps.some((step) => !step)) {
    return undefined;
  }

  const typedSteps = steps as ReadablePathStep[];
  return {
    target,
    summary: `${target.label} is connected to ${start.label} through ${typedSteps.length} ${pluralize('relationship', typedSteps.length)}.`,
    steps: typedSteps,
  };
}

function nextStepForNode(config: ReadableConfig, edgeCount: number): string {
  if (edgeCount === 0) {
    return 'Expand this object or increase depth to find who or what it affects.';
  }

  return config.nextStep;
}

function badgesForNode(
  node: TenantNode,
  config: ReadableConfig,
  context: ReadableBadgeContext,
): ReadableBadge[] {
  const badges: ReadableBadge[] = [];

  if (context.edgeCount > 0) {
    badges.push({ label: `${context.edgeCount} visible ${pluralize('connection', context.edgeCount)}`, tone: 'info' });
  }

  badges.push(...(config.badges?.(context) ?? []));

  if (isBroadTarget(node)) {
    badges.push({ label: 'Broad target', tone: 'warning' });
  }

  if (recentlyChanged(node)) {
    badges.push({ label: 'Recently changed', tone: 'warning' });
  }

  return badges;
}

function isBroadTarget(node: TenantNode): boolean {
  const label = node.label.toLowerCase();
  return (
    label === 'all devices' ||
    label === 'all users' ||
    node.id.endsWith(':all-devices') ||
    node.id.endsWith(':all-users')
  );
}

function recentlyChanged(node: TenantNode): boolean {
  const dateText = metadataText(node, 'modified') ?? metadataText(node, 'created');
  if (!dateText) {
    return false;
  }

  const timestamp = Date.parse(dateText);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return timestamp <= now && now - timestamp <= thirtyDaysMs;
}

function connectedNodes(graph: TenantGraph, node: TenantNode, edges: TenantEdge[]): TenantNode[] {
  const ids = new Set(edges.map((edge) => (edge.source === node.id ? edge.target : edge.source)));
  return graph.nodes.filter((candidate) => ids.has(candidate.id));
}

function countByType(nodes: TenantNode[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const node of nodes) {
    counts.set(node.type, (counts.get(node.type) ?? 0) + 1);
  }

  return counts;
}

function impactSentence(edgeCount: number, counts: Map<string, number>): string {
  if (edgeCount === 0) {
    return 'No visible relationships are loaded for this object yet.';
  }

  const parts = [
    countPhrase(counts, 'device', 'device'),
    countPhrase(counts, 'user', 'person'),
    countPhrase(counts, 'group', 'group'),
    countPhrase(counts, 'directoryRole', 'directory role'),
    countPhrase(counts, 'app', 'app'),
    countPhrase(counts, 'cloudApp', 'cloud app'),
    countPhrase(counts, 'appAssignment', 'assignment'),
    policyCountPhrase(counts),
  ].filter(Boolean);

  if (parts.length === 0) {
    return `This object has ${edgeCount} visible ${pluralize('relationship', edgeCount)} in the current view.`;
  }

  return `Visible impact: ${parts.join(', ')}.`;
}

function countPhrase(counts: Map<string, number>, type: string, label: string): string | undefined {
  const count = counts.get(type) ?? 0;
  return count > 0 ? `${count} ${pluralize(label, count)}` : undefined;
}

function policyCountPhrase(counts: Map<string, number>): string | undefined {
  const count = policyNodeTypes.reduce((total, type) => total + (counts.get(type) ?? 0), 0);

  return count > 0 ? `${count} ${pluralize('policy', count)}` : undefined;
}

function devicePlatformDetail(nodes: TenantNode[]): string | undefined {
  const platforms = new Map<string, number>();

  for (const node of nodes) {
    if (node.type !== 'device') {
      continue;
    }

    const platform = normalizeDevicePlatform(metadataText(node, 'os') ?? node.subtitle);
    platforms.set(platform, (platforms.get(platform) ?? 0) + 1);
  }

  return compactTopEntries(platforms);
}

function policyDetail(counts: Map<string, number>): string | undefined {
  const labels: [string, string][] = [
    ['settingsCatalogPolicy', 'settings'],
    ['compliancePolicy', 'compliance'],
    ['deviceConfigurationProfile', 'profiles'],
    ['enrollmentProfile', 'enrollment'],
  ];
  const parts = labels
    .map(([type, label]) => {
      const count = counts.get(type) ?? 0;
      return count > 0 ? `${count} ${label}` : undefined;
    })
    .filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : undefined;
}

function guardrailDetail(counts: Map<string, number>): string | undefined {
  const filters = counts.get('assignmentFilter') ?? 0;
  const scopeTags = counts.get('scopeTag') ?? 0;
  const parts = [
    filters > 0 ? `${filters} ${pluralize('filter', filters)}` : undefined,
    scopeTags > 0 ? `${scopeTags} scope ${pluralize('tag', scopeTags)}` : undefined,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : undefined;
}

function shortestPath(
  graph: TenantGraph,
  startId: string,
  targetId: string,
): { nodeIds: string[]; edges: TenantEdge[] } | undefined {
  const adjacency = new Map<string, { nodeId: string; edge: TenantEdge }[]>();

  for (const edge of graph.edges) {
    appendPathNeighbor(adjacency, edge.source, edge.target, edge);
    appendPathNeighbor(adjacency, edge.target, edge.source, edge);
  }

  const visited = new Set([startId]);
  const queue = [startId];
  const previous = new Map<string, { nodeId: string; edge: TenantEdge }>();

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current === targetId) {
      break;
    }

    for (const neighbor of adjacency.get(current) ?? []) {
      if (visited.has(neighbor.nodeId)) {
        continue;
      }

      visited.add(neighbor.nodeId);
      previous.set(neighbor.nodeId, { nodeId: current, edge: neighbor.edge });
      queue.push(neighbor.nodeId);
    }
  }

  if (!visited.has(targetId)) {
    return undefined;
  }

  const nodeIds = [targetId];
  const edges: TenantEdge[] = [];
  let cursor = targetId;

  while (cursor !== startId) {
    const step = previous.get(cursor);
    if (!step) {
      return undefined;
    }

    edges.unshift(step.edge);
    nodeIds.unshift(step.nodeId);
    cursor = step.nodeId;
  }

  return { nodeIds, edges };
}

function appendPathNeighbor(
  adjacency: Map<string, { nodeId: string; edge: TenantEdge }[]>,
  source: string,
  target: string,
  edge: TenantEdge,
): void {
  const neighbors = adjacency.get(source) ?? [];
  neighbors.push({ nodeId: target, edge });
  adjacency.set(source, neighbors);
}

function normalizeDevicePlatform(value: string | undefined): string {
  const normalized = value?.toLowerCase() ?? '';

  if (normalized.includes('windows')) {
    return 'Windows';
  }
  if (normalized.includes('ios') || normalized.includes('iphone') || normalized.includes('ipad')) {
    return 'iOS';
  }
  if (normalized.includes('mac')) {
    return 'macOS';
  }
  if (normalized.includes('android')) {
    return 'Android';
  }

  return 'Other';
}

function compactTopEntries(entries: Map<string, number>): string | undefined {
  const parts = [...entries.entries()]
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
    .slice(0, 3)
    .map(([label, count]) => `${count} ${label}`);

  return parts.length > 0 ? parts.join(', ') : undefined;
}

function pluralize(label: string, count: number): string {
  if (count === 1) {
    return label;
  }

  if (label === 'policy') {
    return 'policies';
  }

  if (label === 'person') {
    return 'people';
  }

  return `${label}s`;
}
