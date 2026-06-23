import {
  replaceSignInEventProjection,
  signInEventNodeId,
  type ConditionalAccessPolicyGraphFilter,
} from '../../graph/signInLogs';
import type { SignInEvent } from '../../models/signInLog';
import type {
  TenantGraph,
  TenantGraphResult,
  TenantNode,
  TenantNodeType,
  TenantRelationshipType,
} from '../../models/tenantGraph';
import { emptyTenantGraph, tenantNodeTypes } from '../../models/tenantGraph';
import {
  defaultRelationshipFilter,
  defaultTypeFilter,
  mergeTenantGraphs,
} from '../../utils/graphUtils';
import { nodeTypesForZone } from '../../utils/graphZones';

const defaultGraphObjectLimit = 180;
const graphObjectLimitStep = 180;
const defaultResultLimit = 30;
const resultLimitStep = 30;

export type WorkspaceState = {
  busyNodeId?: string;
  centralNodeId?: string;
  depth: number;
  error?: string;
  expandedDepthByNode: Record<string, number>;
  focusDepth: number;
  focusedZoneId?: string;
  graph: TenantGraph;
  graphObjectLimit: number;
  inspectorOpen: boolean;
  loading: string;
  pathTargetId?: string;
  permissionError?: string;
  relationshipFilter: Record<string, boolean>;
  remoteResults: TenantNode[];
  resultLimit: number;
  searching: boolean;
  searchTerm: string;
  selectedEdgeId?: string;
  selectedNodeId?: string;
  typeFilter: Record<string, boolean>;
  warnings: string[];
};

export type WorkspaceAction =
  | { type: 'closeInspector' }
  | { type: 'expandFailed'; error: string }
  | { type: 'expandLoaded'; depth: number; nodeId: string; result: TenantGraphResult }
  | { type: 'overviewFailed'; error: string }
  | { type: 'overviewLoaded'; result: TenantGraphResult }
  | { type: 'projectSignInEvent'; event: SignInEvent; policyFilter: ConditionalAccessPolicyGraphFilter }
  | { type: 'searchFailed'; error: string }
  | { type: 'searchLoaded'; result: TenantGraphResult }
  | { type: 'selectCluster'; zoneId: string }
  | { type: 'selectEdge'; edgeId: string }
  | { type: 'selectNode'; nodeId: string }
  | { type: 'setDepth'; depth: number }
  | { type: 'setFocusDepth'; focusDepth: number }
  | { type: 'setPathTarget'; targetId?: string }
  | { type: 'setSearchTerm'; searchTerm: string }
  | { type: 'showMoreGraph'; total: number }
  | { type: 'showMoreResults'; total: number }
  | { type: 'startExpand'; nodeId: string }
  | { type: 'startOverview' }
  | { type: 'startSearch' }
  | { type: 'toggleRelationship'; relationshipType: TenantRelationshipType }
  | { type: 'toggleType'; nodeType: TenantNodeType };

export function initialWorkspaceState(): WorkspaceState {
  return {
    depth: 1,
    expandedDepthByNode: {},
    focusDepth: 0,
    graph: emptyTenantGraph,
    graphObjectLimit: defaultGraphObjectLimit,
    inspectorOpen: true,
    loading: 'Loading tenant graph',
    relationshipFilter: defaultRelationshipFilter(),
    remoteResults: [],
    resultLimit: defaultResultLimit,
    searching: false,
    searchTerm: '',
    typeFilter: defaultTypeFilter(),
    warnings: [],
  };
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'closeInspector':
      return { ...state, inspectorOpen: false, selectedEdgeId: undefined };
    case 'expandFailed':
      return { ...state, busyNodeId: undefined, error: action.error };
    case 'expandLoaded':
      return {
        ...applyResult(state, action.result),
        busyNodeId: undefined,
        expandedDepthByNode: shouldMarkExpanded(action.result)
          ? { ...state.expandedDepthByNode, [action.nodeId]: action.depth }
          : state.expandedDepthByNode,
      };
    case 'overviewFailed':
      return { ...state, error: action.error, loading: '' };
    case 'overviewLoaded': {
      const firstNode = action.result.graph.nodes[0];
      return {
        ...state,
        graph: action.result.graph,
        warnings: action.result.warnings,
        permissionError: action.result.permissionError,
        selectedEdgeId: undefined,
        selectedNodeId: firstNode?.id,
        centralNodeId: firstNode?.id,
        focusedZoneId: undefined,
        loading: '',
      };
    }
    case 'projectSignInEvent': {
      const graph = replaceSignInEventProjection(state.graph, action.event, action.policyFilter);
      const eventNodeId = signInEventNodeId(action.event);
      const selectedNodeId = graph.nodes.some((node) => node.id === eventNodeId)
        ? eventNodeId
        : state.selectedNodeId;
      return {
        ...state,
        centralNodeId: selectedNodeId ?? state.centralNodeId,
        focusedZoneId: undefined,
        graph,
        inspectorOpen: true,
        selectedEdgeId: undefined,
        selectedNodeId,
      };
    }
    case 'searchFailed':
      return { ...state, error: action.error, searching: false };
    case 'searchLoaded':
      return {
        ...applyResult(state, action.result),
        remoteResults: action.result.graph.nodes,
        searching: false,
      };
    case 'selectCluster': {
      const nodeTypes = nodeTypesForZone(action.zoneId);
      if (nodeTypes.size === 0) {
        return state;
      }

      return {
        ...state,
        focusDepth: 0,
        focusedZoneId: action.zoneId,
        inspectorOpen: false,
        resultLimit: defaultResultLimit,
        selectedEdgeId: undefined,
        typeFilter: Object.fromEntries(tenantNodeTypes.map((type) => [type, nodeTypes.has(type)])),
      };
    }
    case 'selectEdge':
      return { ...state, selectedEdgeId: action.edgeId, inspectorOpen: true };
    case 'selectNode':
      return {
        ...state,
        selectedNodeId: action.nodeId,
        centralNodeId: action.nodeId,
        focusedZoneId: undefined,
        selectedEdgeId: undefined,
        pathTargetId: undefined,
        inspectorOpen: true,
      };
    case 'setDepth':
      return { ...state, depth: action.depth };
    case 'setFocusDepth':
      return { ...state, focusDepth: action.focusDepth };
    case 'setPathTarget':
      return { ...state, pathTargetId: action.targetId };
    case 'setSearchTerm':
      return {
        ...state,
        searchTerm: action.searchTerm,
        remoteResults: [],
        focusedZoneId: undefined,
        resultLimit: defaultResultLimit,
      };
    case 'showMoreGraph':
      return {
        ...state,
        graphObjectLimit: Math.min(state.graphObjectLimit + graphObjectLimitStep, action.total),
      };
    case 'showMoreResults':
      return { ...state, resultLimit: Math.min(state.resultLimit + resultLimitStep, action.total) };
    case 'startExpand':
      return { ...state, busyNodeId: action.nodeId, error: undefined };
    case 'startOverview':
      return {
        ...initialWorkspaceState(),
        error: undefined,
        loading: 'Loading tenant graph',
      };
    case 'startSearch':
      return { ...state, error: undefined, searching: true, resultLimit: defaultResultLimit };
    case 'toggleRelationship':
      return {
        ...state,
        relationshipFilter: {
          ...state.relationshipFilter,
          [action.relationshipType]: !state.relationshipFilter[action.relationshipType],
        },
        focusedZoneId: undefined,
      };
    case 'toggleType':
      return {
        ...state,
        typeFilter: {
          ...state.typeFilter,
          [action.nodeType]: !state.typeFilter[action.nodeType],
        },
        focusedZoneId: undefined,
      };
    default:
      return state;
  }
}

function applyResult(state: WorkspaceState, result: TenantGraphResult): WorkspaceState {
  return {
    ...state,
    graph: mergeTenantGraphs(state.graph, result.graph),
    warnings: [...new Set([...state.warnings, ...result.warnings])].slice(-8),
    permissionError: result.permissionError,
  };
}

function shouldMarkExpanded(result: TenantGraphResult): boolean {
  return result.graph.nodes.length > 0 || result.graph.edges.length > 0 || result.warnings.length === 0;
}
