import { useImperativeHandle, useState, type Ref } from 'react';
import type { TenantGraph } from '../../models/tenantGraph';
import { describeHover } from './graphHoverCopy';
import { useNodeImageCache } from './useNodeImageCache';
import { useTenantGraphRenderer, type TenantGraphHoverState } from './useTenantGraphRenderer';

export type TenantGraphCanvasHandle = {
  fitView: () => void;
  resetView: () => void;
};

type TenantGraphCanvasProps = {
  centralNodeId?: string;
  'data-guide'?: string;
  focusedZoneId?: string;
  graph: TenantGraph;
  ref?: Ref<TenantGraphCanvasHandle>;
  selectedEdgeId?: string;
  selectedNodeId?: string;
  onSelectEdge: (edgeId: string) => void;
  onSelectCluster?: (zoneId: string) => void;
  onSelectNode: (nodeId: string) => void;
};

export function TenantGraphCanvas({
  centralNodeId,
  'data-guide': dataGuide,
  focusedZoneId,
  graph,
  ref,
  selectedEdgeId,
  selectedNodeId,
  onSelectCluster,
  onSelectEdge,
  onSelectNode,
}: TenantGraphCanvasProps) {
  const [hover, setHover] = useState<TenantGraphHoverState>();
  const { getImage, version: nodeImageVersion } = useNodeImageCache(graph.nodes);
  const { containerRef, fitView, resetView } = useTenantGraphRenderer({
    centralNodeId,
    focusedZoneId,
    getImage,
    graph,
    nodeImageVersion,
    selectedEdgeId,
    selectedNodeId,
    onSelectCluster,
    onSelectEdge,
    onSelectNode,
    setHover,
  });

  useImperativeHandle(ref, () => ({ fitView, resetView }), [fitView, resetView]);

  const hoverCopy = hover ? describeHover(hover, graph) : undefined;

  return (
    <div className="graph-canvas" data-guide={dataGuide} ref={containerRef}>
      {hover && hoverCopy && (
        <div className="graph-tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>
          <strong>{hoverCopy.title}</strong>
          <span>{hoverCopy.subtitle}</span>
          {hoverCopy.detail && <small>{hoverCopy.detail}</small>}
        </div>
      )}
    </div>
  );
}
