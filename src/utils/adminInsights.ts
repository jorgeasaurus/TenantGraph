import type { TenantGraph, TenantNode, TenantNodeType } from '../models/tenantGraph';
import { metadataText, relatedEdges } from './graphUtils';
import { policyNodeTypes } from './typePresentation';

export type AdminInsightSeverity = 'critical' | 'warning' | 'info';

export type AdminFinding = {
  id: string;
  severity: AdminInsightSeverity;
  title: string;
  detail: string;
  nodeId?: string;
};

export type AdminImpactAnalysis = {
  blastRadius: {
    apps: number;
    devices: number;
    filters: number;
    groups: number;
    policies: number;
    scopeTags: number;
    users: number;
  };
  findings: AdminFinding[];
  recentChanges: AdminFinding[];
  summary: string;
};

const policyTypes = new Set<TenantNodeType>(policyNodeTypes);
const recentChangeDateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const impactNodeTypes = new Set<TenantNodeType>([
  'app',
  'appAssignment',
  'assignmentFilter',
  'compliancePolicy',
  'device',
  'deviceConfigurationProfile',
  'enrollmentProfile',
  'group',
  'scopeTag',
  'settingsCatalogPolicy',
  'user',
]);

export function analyzeAdminImpact(graph: TenantGraph, selectedNode: TenantNode | undefined): AdminImpactAnalysis {
  const reviewGraph = selectedNode ? neighborhoodGraph(graph, selectedNode.id, 3) : graph;
  const findings = selectedNode
    ? selectedNodeFindings(graph, selectedNode, reviewGraph)
    : tenantFindings(reviewGraph);
  const recentChanges = recentChangeFindings(reviewGraph.nodes);
  const blastRadius = blastRadiusForNodes(reviewGraph.nodes);

  return {
    blastRadius,
    findings: findings.slice(0, 8),
    recentChanges: recentChanges.slice(0, 5),
    summary: summaryFor(selectedNode, blastRadius, findings.length),
  };
}

export function investigationSummaryText(
  graph: TenantGraph,
  selectedNode: TenantNode | undefined,
  analysis: AdminImpactAnalysis,
): string {
  const subject = selectedNode ? `${selectedNode.label} (${selectedNode.type})` : 'Current Tenant Graph view';
  const relationshipCount = selectedNode ? relatedEdges(graph, selectedNode.id).length : graph.edges.length;
  const lines = [
    `Tenant Graph investigation: ${subject}`,
    `Relationships reviewed: ${relationshipCount}`,
    `Blast radius: ${analysis.blastRadius.users} users, ${analysis.blastRadius.devices} devices, ${analysis.blastRadius.groups} groups, ${analysis.blastRadius.apps} apps, ${analysis.blastRadius.policies} policies, ${analysis.blastRadius.filters} filters, ${analysis.blastRadius.scopeTags} scope tags.`,
    '',
    'Findings:',
    ...listOrNone(analysis.findings.map((finding) => `- [${finding.severity}] ${finding.title}: ${finding.detail}`)),
    '',
    'Recent change signals:',
    ...listOrNone(analysis.recentChanges.map((finding) => `- ${finding.title}: ${finding.detail}`)),
  ];

  return lines.join('\n');
}

function selectedNodeFindings(graph: TenantGraph, node: TenantNode, reviewGraph: TenantGraph): AdminFinding[] {
  const findings = tenantFindings(reviewGraph);
  const nodeEdges = relatedEdges(graph, node.id);

  if (policyTypes.has(node.type) || node.type === 'app') {
    const assignmentCount = nodeEdges.filter((edge) => edge.type === 'assignment' || edge.type === 'target').length;
    if (assignmentCount === 0) {
      findings.unshift({
        id: `${node.id}:no-assignment`,
        severity: 'warning',
        title: 'No loaded assignment path',
        detail: 'This object has no assignment relationship in the loaded graph. Expand it before changing production policy.',
        nodeId: node.id,
      });
    }
  }

  if (node.type === 'device' && metadataText(node, 'compliance')?.toLowerCase() === 'noncompliant') {
    findings.unshift({
      id: `${node.id}:noncompliant`,
      severity: 'critical',
      title: 'Selected device is noncompliant',
      detail: 'Access or app delivery may fail until compliance is remediated.',
      nodeId: node.id,
    });
  }

  return dedupeFindings(findings);
}

function tenantFindings(graph: TenantGraph): AdminFinding[] {
  const findings: AdminFinding[] = [];
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const incoming = incomingCounts(graph);
  const outgoing = outgoingCounts(graph);

  for (const node of graph.nodes) {
    if (node.type === 'group' && isBroadTarget(node)) {
      findings.push({
        id: `${node.id}:broad-target`,
        severity: 'warning',
        title: `${node.label} assignment target`,
        detail: 'Tenant-wide targets deserve extra review because small policy changes can affect many people or devices.',
        nodeId: node.id,
      });
    }

    if (node.type === 'device' && metadataText(node, 'compliance')?.toLowerCase() === 'noncompliant') {
      findings.push({
        id: `${node.id}:noncompliant`,
        severity: 'critical',
        title: `${node.label} is noncompliant`,
        detail: 'Conditional Access and required app flows may block this device.',
        nodeId: node.id,
      });
    }

    if (node.type === 'directoryRole' && (incoming.get(node.id) ?? 0) > 0) {
      findings.push({
        id: `${node.id}:privileged-role`,
        severity: 'info',
        title: `${node.label} has visible members`,
        detail: 'Privileged role memberships should be reviewed before changing admin-scoped policies.',
        nodeId: node.id,
      });
    }

    if ((policyTypes.has(node.type) || node.type === 'app') && (outgoing.get(node.id) ?? 0) === 0 && (incoming.get(node.id) ?? 0) === 0) {
      findings.push({
        id: `${node.id}:unconnected`,
        severity: 'info',
        title: `${node.label} has no loaded relationships`,
        detail: 'Expand or search related objects before assuming this item has no production impact.',
        nodeId: node.id,
      });
    }

    if (node.type === 'appAssignment') {
      const targetEdges = graph.edges.filter((edge) => edge.source === node.id && edge.type === 'target');
      const hasBroadTarget = targetEdges.some((edge) => isBroadTarget(nodes.get(edge.target)));
      const intent = metadataText(node, 'intent') ?? node.label;
      if (hasBroadTarget || intent.toLowerCase() === 'required') {
        findings.push({
          id: `${node.id}:assignment-impact`,
          severity: hasBroadTarget ? 'warning' : 'info',
          title: `${intent} assignment needs review`,
          detail: hasBroadTarget
            ? 'This assignment targets a broad tenant audience.'
            : 'Required assignments install or enforce behavior automatically.',
          nodeId: node.id,
        });
      }
    }
  }

  return dedupeFindings(findings).toSorted((first, second) => severityRank(first.severity) - severityRank(second.severity));
}

function recentChangeFindings(nodes: TenantNode[]): AdminFinding[] {
  return nodes
    .flatMap((node): AdminFinding[] => {
      const modified = metadataText(node, 'modified');
      const created = metadataText(node, 'created');
      const date = modified ?? created;
      if (!date || !isRecentDate(date)) {
        return [];
      }

      return [{
        id: `${node.id}:recent-change`,
        severity: 'info',
        title: `${node.label} changed recently`,
        detail: `${modified ? 'Modified' : 'Created'} ${formatDate(date)}. Check audit logs before editing related assignments.`,
        nodeId: node.id,
      }];
    });
}

function neighborhoodGraph(graph: TenantGraph, startId: string, depth: number): TenantGraph {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    addNeighbor(adjacency, edge.source, edge.target);
    addNeighbor(adjacency, edge.target, edge.source);
  }

  const visited = new Set([startId]);
  let frontier = new Set([startId]);
  for (let index = 0; index < depth; index += 1) {
    const next = new Set<string>();
    for (const current of frontier) {
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          next.add(neighbor);
        }
      }
    }
    frontier = next;
  }

  return {
    nodes: [...visited].map((id) => nodes.get(id)).filter((node): node is TenantNode => Boolean(node)),
    edges: graph.edges.filter((edge) => visited.has(edge.source) && visited.has(edge.target)),
  };
}

function blastRadiusForNodes(nodes: TenantNode[]): AdminImpactAnalysis['blastRadius'] {
  const counts = new Map<TenantNodeType, number>();
  for (const node of nodes) {
    if (impactNodeTypes.has(node.type)) {
      counts.set(node.type, (counts.get(node.type) ?? 0) + 1);
    }
  }

  return {
    apps: counts.get('app') ?? 0,
    devices: counts.get('device') ?? 0,
    filters: counts.get('assignmentFilter') ?? 0,
    groups: counts.get('group') ?? 0,
    policies: policyNodeTypes.reduce((total, type) => total + (counts.get(type) ?? 0), 0),
    scopeTags: counts.get('scopeTag') ?? 0,
    users: counts.get('user') ?? 0,
  };
}

function summaryFor(
  selectedNode: TenantNode | undefined,
  blastRadius: AdminImpactAnalysis['blastRadius'],
  findingCount: number,
): string {
  const subject = selectedNode ? selectedNode.label : 'This loaded view';
  return `${subject} currently touches ${blastRadius.users} users, ${blastRadius.devices} devices, ${blastRadius.apps} apps, and ${blastRadius.policies} policies in the loaded graph. ${findingCount} review signal${findingCount === 1 ? '' : 's'} found.`;
}

function incomingCounts(graph: TenantGraph): Map<string, number> {
  const counts = new Map<string, number>();
  for (const edge of graph.edges) {
    counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1);
  }
  return counts;
}

function outgoingCounts(graph: TenantGraph): Map<string, number> {
  const counts = new Map<string, number>();
  for (const edge of graph.edges) {
    counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1);
  }
  return counts;
}

function isBroadTarget(node: TenantNode | undefined): boolean {
  if (!node) {
    return false;
  }

  const label = node.label.toLowerCase();
  return node.metadata?.virtual === true || label === 'all users' || label === 'all devices';
}

function isRecentDate(value: string): boolean {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  const days = Math.abs(Date.now() - timestamp) / 86_400_000;
  return days <= 60;
}

function formatDate(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return recentChangeDateFormatter.format(timestamp);
}

function addNeighbor(adjacency: Map<string, Set<string>>, source: string, target: string): void {
  const neighbors = adjacency.get(source) ?? new Set<string>();
  neighbors.add(target);
  adjacency.set(source, neighbors);
}

function dedupeFindings(findings: AdminFinding[]): AdminFinding[] {
  return [...new Map(findings.map((finding) => [finding.id, finding])).values()];
}

function severityRank(severity: AdminInsightSeverity): number {
  if (severity === 'critical') {
    return 0;
  }
  if (severity === 'warning') {
    return 1;
  }
  return 2;
}

function listOrNone(lines: string[]): string[] {
  return lines.length > 0 ? lines : ['- None in the loaded graph.'];
}
