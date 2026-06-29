import { Copy, ExternalLink, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { GraphClient } from '../../graph/client';
import type { ConditionalAccessPolicyGraphFilter } from '../../graph/signInLogs';
import type { SignInEvent } from '../../models/signInLog';
import type { TenantEdge, TenantGraph, TenantNode, TenantRelationshipType } from '../../models/tenantGraph';
import { nodeApiId, nodeColors, relatedEdges, relationshipLabel } from '../../utils/graphUtils';
import { describeReadableRelationship, readableObjectType } from '../../utils/readableGraph';
import { SignInInvestigation } from '../details/SignInInvestigation';

type RelationshipInspectorProps = {
  client: GraphClient;
  edge?: TenantEdge;
  graph: TenantGraph;
  selectedNode?: TenantNode;
  onClose: () => void;
  onProjectSignInEvent: (event: SignInEvent, policyFilter: ConditionalAccessPolicyGraphFilter) => void;
  onSelectNode: (nodeId: string) => void;
};

type PropertyRow = {
  label: string;
  value: string;
};

type RelationshipGroup = {
  edges: TenantEdge[];
  label: string;
  type: TenantRelationshipType;
};

export function RelationshipInspector({
  client,
  edge,
  graph,
  selectedNode,
  onClose,
  onProjectSignInEvent,
  onSelectNode,
}: RelationshipInspectorProps) {
  if (!edge && !selectedNode) {
    return null;
  }

  const source = edge ? graph.nodes.find((node) => node.id === edge.source) : undefined;
  const target = edge ? graph.nodes.find((node) => node.id === edge.target) : undefined;
  const objectNode = selectedNode ?? source ?? target;
  const relationships = objectNode ? relatedEdges(graph, objectNode.id) : [];
  const readableEdge = edge ? describeReadableRelationship(edge, source, target) : undefined;
  const graphQuery = objectNode ? graphQueryForNode(objectNode) : edge ? `relationships/${edge.id}` : '';

  return (
    <aside
      className="relationship-inspector readable-mode"
      aria-label="Relationship inspector"
    >
      <div className="inspector-heading">
        <div>
          <span>{edge ? 'Relationship' : 'Object'}</span>
          <strong>{edge ? relationshipLabel(edge) : objectNode?.label}</strong>
          {readableEdge && <p className="relationship-sentence">{readableEdge.sentence}</p>}
        </div>
        <button type="button" title="Close inspector" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {edge && source && target && (
        <InspectorSection title="Breadcrumb">
          <div className="relationship-breadcrumb" aria-label="Relationship breadcrumb">
            <NodeButton node={source} onSelectNode={onSelectNode} />
            <span>{readableEdge?.label}</span>
            <NodeButton node={target} onSelectNode={onSelectNode} />
          </div>
        </InspectorSection>
      )}

      {objectNode && (
        <div className="inspector-actions" aria-label="Object actions">
          <button type="button" onClick={() => void copyText(objectNode.label)}>
            <Copy size={13} />
            Copy Name
          </button>
          <button type="button" onClick={() => void copyText(nodeApiId(objectNode))}>
            <Copy size={13} />
            Copy ID
          </button>
          <button type="button" onClick={() => openAdminCenter('intune', objectNode)}>
            <ExternalLink size={13} />
            Intune
          </button>
          <button type="button" onClick={() => openAdminCenter('entra', objectNode)}>
            <ExternalLink size={13} />
            Entra
          </button>
          <button type="button" onClick={() => void copyText(graphQuery)}>
            <Copy size={13} />
            Copy Graph Query
          </button>
        </div>
      )}

      {objectNode && (
        <InspectorSection title="Object">
          <dl className="inspector-dl">
            <Property label="Name" value={objectNode.label} />
            <Property label="Type" value={readableObjectType(objectNode)} />
            {objectNode.subtitle && <Property label="Subtitle" value={objectNode.subtitle} />}
          </dl>
        </InspectorSection>
      )}

      <InspectorSection title="Properties">
        <dl className="inspector-dl">
          {objectNode ? (
            propertyRows(objectNode).map((row) => <Property key={row.label} label={row.label} value={row.value} />)
          ) : (
            <Property label="Relationship" value={edge ? relationshipLabel(edge) : 'None'} />
          )}
        </dl>
      </InspectorSection>

      <InspectorSection title="Relationships">
        <RelationshipList
          edges={relationships}
          graph={graph}
          selectedNode={objectNode}
          onSelectNode={onSelectNode}
        />
      </InspectorSection>

      {objectNode && (
        <InspectorSection title="Sign-ins">
          <SignInInvestigation client={client} node={objectNode} onProjectEvent={onProjectSignInEvent} />
        </InspectorSection>
      )}

      <InspectorSection title="Raw Graph IDs">
        <dl className="inspector-dl technical">
          {objectNode && <Property label="Tenant Graph ID" value={objectNode.id} />}
          {objectNode && <Property label="Graph object ID" value={nodeApiId(objectNode)} />}
          {edge && <Property label="Edge ID" value={edge.id} />}
          {edge && <Property label="Source" value={edge.source} />}
          {edge && <Property label="Target" value={edge.target} />}
        </dl>
      </InspectorSection>
    </aside>
  );
}

function InspectorSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="inspector-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function RelationshipList({
  edges,
  emptyText = 'No visible relationships.',
  graph,
  onSelectNode,
  selectedNode,
}: {
  edges: TenantEdge[];
  emptyText?: string;
  graph: TenantGraph;
  onSelectNode: (nodeId: string) => void;
  selectedNode?: TenantNode;
}) {
  if (edges.length === 0) {
    return <p className="muted">{emptyText}</p>;
  }

  const groupedEdges = groupEdgesByRelationship(edges);

  return (
    <div className="edge-list">
      {groupedEdges.map((group) => (
        <section key={group.type} className="edge-group">
          <h3>{group.label}</h3>
          {group.edges.slice(0, 10).map((candidate) => {
            const otherId = candidate.source === selectedNode?.id ? candidate.target : candidate.source;
            const other = graph.nodes.find((node) => node.id === otherId);
            if (!other) {
              return null;
            }
            const sourceNode = graph.nodes.find((node) => node.id === candidate.source);
            const targetNode = graph.nodes.find((node) => node.id === candidate.target);
            const readableRelationship = describeReadableRelationship(candidate, sourceNode, targetNode);

            return (
              <button key={candidate.id} type="button" onClick={() => onSelectNode(other.id)}>
                <NodeDot node={other} />
                <span>
                  <strong>{other.label}</strong>
                  <small>{readableRelationship.sentence}</small>
                </span>
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function groupEdgesByRelationship(edges: TenantEdge[]): RelationshipGroup[] {
  const groups = new Map<TenantRelationshipType, RelationshipGroup>();

  for (const edge of edges) {
    const group = groups.get(edge.type);
    if (group) {
      group.edges.push(edge);
    } else {
      groups.set(edge.type, { edges: [edge], label: relationshipLabel(edge), type: edge.type });
    }
  }

  return [...groups.values()];
}

function NodeButton({ node, onSelectNode }: { node: TenantNode; onSelectNode: (nodeId: string) => void }) {
  return (
    <button type="button" onClick={() => onSelectNode(node.id)}>
      <NodeDot node={node} />
      <span>
        <strong>{node.label}</strong>
        <small>{node.subtitle || node.type}</small>
      </span>
    </button>
  );
}

function NodeDot({ node }: { node: TenantNode }) {
  const color = nodeColors[node.type] ?? '#64748b';
  return <span className="node-dot" style={{ background: color, color }} />;
}

function Property({ label, value }: PropertyRow) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function propertyRows(node: TenantNode): PropertyRow[] {
  const metadataRows = Object.entries(node.metadata ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .slice(0, 8)
    .map(([label, value]) => ({ label, value: String(value) }));

  return metadataRows.length > 0 ? metadataRows : [{ label: 'Status', value: 'No metadata loaded.' }];
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

function openAdminCenter(target: 'entra' | 'intune', node: TenantNode): void {
  window.open(target === 'intune' ? intuneUrlForNode(node) : entraUrlForNode(node), '_blank', 'noopener,noreferrer');
}

function graphQueryForNode(node: TenantNode): string {
  const id = nodeApiId(node);
  switch (node.type) {
    case 'user':
      return `/users/${id}`;
    case 'group':
      return `/groups/${id}`;
    case 'directoryRole':
      return `/directoryRoles/${id}`;
    case 'device':
      return `/deviceManagement/managedDevices/${id}`;
    case 'app':
      return `/deviceAppManagement/mobileApps/${id}`;
    case 'cloudApp':
      return '/auditLogs/signIns';
    case 'assignmentFilter':
      return `/deviceManagement/assignmentFilters/${id}`;
    case 'scopeTag':
      return `/deviceManagement/roleScopeTags/${id}`;
    default:
      return `/directoryObjects/${id}`;
  }
}

function intuneUrlForNode(node: TenantNode): string {
  if (['device', 'app', 'appAssignment', 'assignmentFilter', 'scopeTag'].includes(node.type) || node.type.includes('Policy')) {
    return 'https://intune.microsoft.com/';
  }

  return 'https://intune.microsoft.com/';
}

function entraUrlForNode(node: TenantNode): string {
  if (node.type === 'user' || node.type === 'group' || node.type === 'directoryRole') {
    return 'https://entra.microsoft.com/';
  }

  return 'https://entra.microsoft.com/';
}
