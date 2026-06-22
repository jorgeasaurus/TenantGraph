import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { TenantEdge, TenantGraph, TenantNode } from '../../models/tenantGraph';
import { edgeColors, relationshipLabel, stableHash } from '../../utils/graphUtils';
import { useLazyRef } from '../../utils/useLazyRef';
import { fitCameraToGraph, fitCameraToZone } from './graphCamera';
import { describeHover, type GraphHoverTarget } from './graphHoverCopy';
import { type GraphLabelData, updateGraphLabels } from './graphLabelVisibility';
import { type GraphZone, layoutGraph, makeEdgeGeometry } from './graphLayout';
import {
  buildRelationshipDistances,
  directionEndpoints,
  edgeLabelPosition,
  edgeOffsetVector,
  edgeRelevanceOpacity,
  edgeVisual,
  labelPriority,
  nodeRelevanceOpacity,
  nodeSignalColor,
} from './graphVisualPolicy';
import { iconColor, makeNodeIcon } from './nodeIcons';
import {
  animatePulses,
  disposeObject,
  makeDependencyPulse,
  makeEdgeArrow,
  makeEdgeLabel,
  makeFocusRings,
  makeLabel,
  makeNodeLayers,
  makeSemanticZone,
  renderLayers,
  setPulse,
} from './threeGraphObjects';
import { useNodeImageCache } from './useNodeImageCache';

export type TenantGraphCanvasHandle = {
  fitView: () => void;
  resetView: () => void;
};

type TenantGraphCanvasProps = {
  centralNodeId?: string;
  graph: TenantGraph;
  ref?: Ref<TenantGraphCanvasHandle>;
  selectedEdgeId?: string;
  selectedNodeId?: string;
  onSelectEdge: (edgeId: string) => void;
  onSelectCluster?: (zoneId: string) => void;
  onSelectNode: (nodeId: string) => void;
};

type HoverState = GraphHoverTarget & {
  x: number;
  y: number;
};

export function TenantGraphCanvas({
  centralNodeId,
  graph,
  ref,
  selectedEdgeId,
  selectedNodeId,
  onSelectCluster,
  onSelectEdge,
  onSelectNode,
}: TenantGraphCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const groupRef = useRef<THREE.Group | null>(null);
    const edgePickablesRef = useRef<THREE.Object3D[]>([]);
    const nodePickablesRef = useRef<THREE.Object3D[]>([]);
    const zonePickablesRef = useRef<THREE.Object3D[]>([]);
    const positionsRef = useLazyRef(() => new Map<string, THREE.Vector3>());
    const edgeSelectRef = useRef(onSelectEdge);
    const selectClusterRef = useRef(onSelectCluster);
    const selectRef = useRef(onSelectNode);
    const focusNodeIdRef = useRef<string | undefined>(centralNodeId);
    const hoverNodeIdRef = useRef<string | undefined>(undefined);
    const [hover, setHover] = useState<HoverState>();
    const { getImage, version: nodeImageVersion } = useNodeImageCache(graph.nodes);

    useEffect(() => {
      selectRef.current = onSelectNode;
    }, [onSelectNode]);

    useEffect(() => {
      edgeSelectRef.current = onSelectEdge;
    }, [onSelectEdge]);

    useEffect(() => {
      selectClusterRef.current = onSelectCluster;
    }, [onSelectCluster]);

    useEffect(() => {
      focusNodeIdRef.current = selectedNodeId ?? centralNodeId;
    }, [centralNodeId, selectedNodeId]);

    const resetView = useCallback(() => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) {
        return;
      }

      camera.position.set(120, 110, 180);
      controls.target.set(0, 0, 0);
      controls.update();
    }, []);

    const fitView = useCallback(() => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) {
        return;
      }

      fitCameraToGraph(camera, controls, positionsRef.current);
    }, [positionsRef]);

    useImperativeHandle(ref, () => ({ fitView, resetView }), [fitView, resetView]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) {
        return undefined;
      }

      const scene = new THREE.Scene();
      scene.background = null;
      scene.fog = new THREE.Fog('#040714', 500, 980);

      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 2000);
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: import.meta.env.DEV,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.maxDistance = 900;
      controls.minDistance = 28;
      controls.screenSpacePanning = true;

      scene.add(new THREE.AmbientLight('#c7f9ff', 0.76));
      const light = new THREE.PointLight('#3fd1ff', 104, 880);
      light.position.set(80, 140, 120);
      scene.add(light);
      const warmLight = new THREE.PointLight('#ff2bd6', 37, 580);
      warmLight.position.set(-190, -70, -120);
      scene.add(warmLight);
      const signalLight = new THREE.PointLight('#14f195', 25, 520);
      signalLight.position.set(170, -110, 80);
      scene.add(signalLight);

      rendererRef.current = renderer;
      sceneRef.current = scene;
      cameraRef.current = camera;
      controlsRef.current = controls;
      resetView();

      const resize = () => {
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        if (positionsRef.current.size > 0) {
          fitCameraToGraph(camera, controls, positionsRef.current);
        }
        updateFocusGlow(container, camera, positionsRef.current, focusNodeIdRef.current);
      };

      const pickTarget = (event: PointerEvent | MouseEvent): Pick<HoverState, 'edge' | 'node' | 'zone'> => {
        const rect = renderer.domElement.getBoundingClientRect();
        const pointer = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        const raycaster = new THREE.Raycaster();
        raycaster.params.Line = { threshold: 8 };
        raycaster.setFromCamera(pointer, camera);
        const nodeHit = raycaster.intersectObjects(nodePickablesRef.current, false)[0];
        if (nodeHit) {
          return { node: nodeHit.object.userData.node as TenantNode };
        }

        const edgeHit = raycaster.intersectObjects(edgePickablesRef.current, false)[0];
        if (edgeHit) {
          return { edge: edgeHit.object.userData.edge as TenantEdge };
        }

        const zoneHit = raycaster.intersectObjects(zonePickablesRef.current, false)[0];
        return zoneHit ? { zone: zoneHit.object.userData.zone as GraphZone } : {};
      };

      const onPointerMove = (event: PointerEvent) => {
        const target = pickTarget(event);
        hoverNodeIdRef.current = target.node?.id;
        renderer.domElement.style.cursor = target.node || target.edge || target.zone ? 'pointer' : 'grab';
        setHover(target.node || target.edge || target.zone ? { ...target, x: event.clientX, y: event.clientY } : undefined);
      };

      const onPointerLeave = () => {
        hoverNodeIdRef.current = undefined;
        renderer.domElement.style.cursor = 'grab';
        setHover(undefined);
      };

      const onClick = (event: MouseEvent) => {
        const target = pickTarget(event);
        if (target.node) {
          selectRef.current(target.node.id);
        } else if (target.edge) {
          edgeSelectRef.current(target.edge.id);
        } else if (target.zone) {
          fitCameraToZone(camera, controls, target.zone);
          selectClusterRef.current?.(target.zone.id);
        }
      };

      const observer = new ResizeObserver(resize);
      observer.observe(container);
      resize();

      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerleave', onPointerLeave);
      renderer.domElement.addEventListener('click', onClick);

      const clock = new THREE.Clock();
      let frame = 0;
      const animate = () => {
        const elapsed = clock.getElapsedTime();
        animatePulses(groupRef.current, elapsed);
        controls.update();
        updateFocusGlow(container, camera, positionsRef.current, focusNodeIdRef.current);
        updateGraphLabels(groupRef.current, camera, controls, renderer, hoverNodeIdRef.current);
        renderer.render(scene, camera);
        frame = window.requestAnimationFrame(animate);
      };
      animate();

      return () => {
        window.cancelAnimationFrame(frame);
        observer.disconnect();
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
        renderer.domElement.removeEventListener('click', onClick);
        controls.dispose();
        disposeObject(groupRef.current);
        groupRef.current = null;
        clearFocusGlow(container);
        renderer.dispose();
        renderer.domElement.remove();
      };
    }, [positionsRef, resetView]);

    useEffect(() => {
      const scene = sceneRef.current;
      if (!scene) {
        return;
      }

      disposeObject(groupRef.current);
      groupRef.current = null;
      edgePickablesRef.current = [];
      nodePickablesRef.current = [];
      zonePickablesRef.current = [];

      const group = new THREE.Group();
      const { positions, zones } = layoutGraph(graph, centralNodeId);
      const relationshipDistances = buildRelationshipDistances(graph, selectedNodeId);
      const hasRelationshipFocus = Boolean(selectedNodeId && relationshipDistances.size > 0);
      positionsRef.current = positions;

      for (const zone of zones) {
        const zoneObject = makeSemanticZone(zone);
        zoneObject.traverse((child) => {
          if (child.userData.zone) {
            zonePickablesRef.current.push(child);
          }
        });
        group.add(zoneObject);
      }

      const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
      for (const edge of graph.edges) {
        const source = positions.get(edge.source);
        const target = positions.get(edge.target);
        if (!source || !target) {
          continue;
        }

        const geometry = makeEdgeGeometry(source, target, edge.id);
        const color = edgeColors[edge.type] ?? '#64748b';
        const visual = edgeVisual(edge.type);
        const activeEdge = edge.id === selectedEdgeId || edge.source === selectedNodeId || edge.target === selectedNodeId;
        const relevanceOpacity = edgeRelevanceOpacity(edge, relationshipDistances, hasRelationshipFocus);
        const dimmedEdge = hasRelationshipFocus && relevanceOpacity <= 0.25 && !activeEdge;
        const opacity = dimmedEdge
          ? visual.dimOpacity
          : activeEdge
            ? visual.activeOpacity
            : Math.min(visual.opacity, relevanceOpacity);
        const material =
          visual.dashSize && visual.gapSize
            ? new THREE.LineDashedMaterial({
                color,
                dashSize: visual.dashSize,
                gapSize: visual.gapSize,
                transparent: true,
                opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              })
            : new THREE.LineBasicMaterial({
                color,
                transparent: true,
                opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              });
        const line = new THREE.Line(geometry, material);
        if (line.material instanceof THREE.LineDashedMaterial) {
          line.computeLineDistances();
        }
        line.userData.edge = edge;
        line.renderOrder = activeEdge ? renderLayers.interactions : renderLayers.edges;
        edgePickablesRef.current.push(line);
        group.add(line);

        if (visual.doubleLine) {
          const offset = edgeOffsetVector(source, target, 3.4);
          const secondGeometry = makeEdgeGeometry(source.clone().add(offset), target.clone().add(offset), `${edge.id}:double`);
          const secondLine = new THREE.Line(
            secondGeometry,
            material.clone() as THREE.LineBasicMaterial | THREE.LineDashedMaterial,
          );
          if (secondLine.material instanceof THREE.LineDashedMaterial) {
            secondLine.computeLineDistances();
          }
          secondLine.renderOrder = line.renderOrder;
          group.add(secondLine);
        }

        const sourceNode = nodeById.get(edge.source);
        const targetNode = nodeById.get(edge.target);
        const arrowEndpoints = directionEndpoints(edge, source, target, sourceNode, targetNode);
        if (arrowEndpoints && !dimmedEdge) {
          group.add(makeEdgeArrow(arrowEndpoints.source, arrowEndpoints.target, color, activeEdge ? 0.82 : 0.46));
        }
        if (visual.animated && !dimmedEdge) {
          group.add(makeDependencyPulse(source, target, color, stableHash(edge.id)));
        }

        if ((activeEdge || (!hasRelationshipFocus && graph.edges.length <= 36)) && !dimmedEdge) {
          group.add(makeEdgeLabel(relationshipLabel(edge), edgeLabelPosition(source, target, edge.id), color, activeEdge));
        }
      }

      for (const node of graph.nodes) {
        const position = positions.get(node.id);
        if (!position) {
          continue;
        }

        const isCentral = node.id === centralNodeId;
        const isSelected = node.id === selectedNodeId;
        const relationshipDistance = relationshipDistances.get(node.id);
        const nodeOpacity = nodeRelevanceOpacity(relationshipDistance, hasRelationshipFocus);
        const dimmed = hasRelationshipFocus && nodeOpacity <= 0.25;
        const isActive = isCentral || isSelected || relationshipDistance === 0 || relationshipDistance === 1;
        const iconSize = isSelected ? 20 : isCentral ? 18 : 14;
        const color = iconColor(node);
        group.add(
          makeNodeLayers(position, iconSize, color, {
            active: isActive,
            dimmed,
            signalColor: nodeSignalColor(node),
          }),
        );

        if (isCentral || isSelected) {
          const haloOpacity = isCentral ? 0.16 : 0.12;
          const halo = new THREE.Mesh(
            new THREE.SphereGeometry(iconSize * 0.72, 18, 10),
            new THREE.MeshBasicMaterial({
              color,
              transparent: true,
              opacity: haloOpacity,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          );
          halo.position.copy(position);
          halo.renderOrder = renderLayers.interactions + 2;
          setPulse(halo, haloOpacity, stableHash(node.id) * 0.01, 0.08, 1.7);
          group.add(halo);
          group.add(makeFocusRings(position, iconSize * 0.42, color, stableHash(node.id)));
        }

        const icon = makeNodeIcon(node, color, isCentral || isSelected, getImage(node.id));
        icon.position.copy(position);
        icon.scale.set(iconSize, iconSize, 1);
        icon.userData.node = node;
        icon.renderOrder = isSelected ? renderLayers.interactions + 3 : renderLayers.nodes + 2;
        (icon.material as THREE.SpriteMaterial).opacity = nodeOpacity;
        nodePickablesRef.current.push(icon);
        group.add(icon);

        const label = makeLabel(node.label, position, isCentral || isSelected, color);
        label.userData.graphLabel = {
          direct: relationshipDistance === 1,
          nodeId: node.id,
          priority: labelPriority(isSelected, isCentral, relationshipDistance),
          relationshipDistance,
          selected: isSelected,
        } satisfies GraphLabelData;
        const labelMaterial = label.material as THREE.SpriteMaterial;
        labelMaterial.opacity = 0;
        label.visible = false;
        group.add(label);
      }

      scene.add(group);
      groupRef.current = group;
      fitView();
    }, [nodeImageVersion, centralNodeId, fitView, getImage, graph, positionsRef, selectedEdgeId, selectedNodeId]);

    const hoverCopy = hover ? describeHover(hover, graph) : undefined;

    return (
      <div className="graph-canvas" ref={containerRef}>
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

function updateFocusGlow(
  container: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  positions: Map<string, THREE.Vector3>,
  focusNodeId?: string,
): void {
  const host = container.parentElement ?? container;
  const focusPosition = focusNodeId ? positions.get(focusNodeId) : undefined;
  if (!focusPosition) {
    host.style.setProperty('--graph-focus-opacity', '0.38');
    host.style.setProperty('--graph-focus-x', '50%');
    host.style.setProperty('--graph-focus-y', '48%');
    return;
  }

  const projected = focusPosition.clone().project(camera);
  const width = container.clientWidth || 1;
  const height = container.clientHeight || 1;
  const x = ((projected.x + 1) / 2) * width;
  const y = ((1 - projected.y) / 2) * height;

  host.style.setProperty('--graph-focus-opacity', '0.82');
  host.style.setProperty('--graph-focus-x', `${x}px`);
  host.style.setProperty('--graph-focus-y', `${y}px`);
}

function clearFocusGlow(container: HTMLDivElement): void {
  const host = container.parentElement ?? container;
  host.style.removeProperty('--graph-focus-opacity');
  host.style.removeProperty('--graph-focus-x');
  host.style.removeProperty('--graph-focus-y');
}
