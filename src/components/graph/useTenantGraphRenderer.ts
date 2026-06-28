import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { TenantEdge, TenantGraph, TenantNode } from '../../models/tenantGraph';
import { useLazyRef } from '../../utils/useLazyRef';
import { applyCameraPose, cameraPoseForGraph, cameraPoseForZone, fitCameraToGraph, type CameraPose } from './graphCamera';
import type { GraphHoverTarget } from './graphHoverCopy';
import { updateGraphLabels } from './graphLabelVisibility';
import type { GraphZone } from './graphLayout';
import { buildTenantGraphScene, pointsForZone } from './tenantGraphSceneBuilder';
import {
  animateFlowObjects,
  animateIlluminationObjects,
  animateParticleFields,
  animatePulseObjects,
  disposeObject,
} from './threeGraphObjects';

type CurrentRef<T> = {
  current: T;
};

export type TenantGraphHoverState = GraphHoverTarget & {
  x: number;
  y: number;
};

type CameraFlight = {
  duration: number;
  fromPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  startedAt: number;
  toPosition: THREE.Vector3;
  toTarget: THREE.Vector3;
};

type IlluminationFlight = {
  duration: number;
  startedAt: number;
};

type UseTenantGraphRendererOptions = {
  centralNodeId?: string;
  focusedZoneId?: string;
  getImage: (nodeId: string) => HTMLImageElement | undefined;
  graph: TenantGraph;
  nodeImageVersion: number;
  selectedEdgeId?: string;
  selectedNodeId?: string;
  onSelectCluster?: (zoneId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  setHover: Dispatch<SetStateAction<TenantGraphHoverState | undefined>>;
};

type TenantGraphRenderer = {
  containerRef: RefObject<HTMLDivElement | null>;
  fitView: () => void;
  resetView: () => void;
};

export function useTenantGraphRenderer({
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
}: UseTenantGraphRendererOptions): TenantGraphRenderer {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraFlightRef = useRef<CameraFlight | undefined>(undefined);
  const cameraFocusKeyRef = useRef<string | undefined>(undefined);
  const edgePickablesRef = useRef<THREE.Object3D[]>([]);
  const flowObjectsRef = useRef<THREE.Object3D[]>([]);
  const focusPointRef = useRef<THREE.Vector3 | undefined>(undefined);
  const focusProjectionRef = useLazyRef(() => new THREE.Vector3());
  const hoverNodeIdRef = useRef<string | undefined>(undefined);
  const illuminationGraphKeyRef = useRef<string | undefined>(undefined);
  const illuminationObjectsRef = useRef<THREE.Object3D[]>([]);
  const illuminationRef = useRef<IlluminationFlight | undefined>(undefined);
  const labelProjectionRef = useLazyRef(() => new THREE.Vector3());
  const labelSpritesRef = useRef<THREE.Sprite[]>([]);
  const labelVisibilityKeyRef = useRef('');
  const nodePickablesRef = useRef<THREE.Object3D[]>([]);
  const particleObjectsRef = useRef<THREE.Object3D[]>([]);
  const positionsRef = useLazyRef(() => new Map<string, THREE.Vector3>());
  const pulseObjectsRef = useRef<THREE.Object3D[]>([]);
  const zonePickablesRef = useRef<THREE.Object3D[]>([]);

  const moveCameraToPose = useCallback((pose: CameraPose, animated = true) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) {
      return;
    }

    if (!animated) {
      cameraFlightRef.current = undefined;
      applyCameraPose(camera, controls, pose);
      return;
    }

    cameraFlightRef.current = {
      duration: 620,
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      startedAt: performance.now(),
      toPosition: pose.position.clone(),
      toTarget: pose.target.clone(),
    };
  }, []);

  const startGraphIllumination = useCallback((duration = 2600) => {
    if (illuminationObjectsRef.current.length === 0) {
      return;
    }

    illuminationRef.current = {
      duration,
      startedAt: performance.now(),
    };
    animateIlluminationObjects(illuminationObjectsRef.current, 1);
  }, []);

  const resetView = useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) {
      return;
    }

    cameraFlightRef.current = undefined;
    if (positionsRef.current.size > 0) {
      applyCameraPose(camera, controls, cameraPoseForGraph(camera, controls, positionsRef.current));
    } else {
      camera.position.set(98, 90, 148);
      controls.target.set(0, 0, 0);
      controls.update();
    }
    startGraphIllumination();
  }, [positionsRef, startGraphIllumination]);

  const fitView = useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) {
      return;
    }

    moveCameraToPose(cameraPoseForGraph(camera, controls, positionsRef.current));
  }, [moveCameraToPose, positionsRef]);

  const moveCameraToPoseEvent = useEffectEvent((pose: CameraPose) => {
    moveCameraToPose(pose);
  });

  const selectNode = useEffectEvent((nodeId: string) => {
    onSelectNode(nodeId);
  });

  const selectEdge = useEffectEvent((edgeId: string) => {
    onSelectEdge(edgeId);
  });

  const selectCluster = useEffectEvent((zoneId: string) => {
    onSelectCluster?.(zoneId);
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const scene = makeScene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 2000);
    const renderer = makeRenderer();
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 900;
    controls.minDistance = 28;
    controls.screenSpacePanning = true;

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
      updateFocusGlow(container, camera, focusPointRef.current, focusProjectionRef.current);
    };

    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    raycaster.params.Line = { threshold: 8 };

    const pickTarget = (event: PointerEvent | MouseEvent): Pick<TenantGraphHoverState, 'edge' | 'node' | 'zone'> => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
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

    let pendingHoverEvent: PointerEvent | undefined;
    let hoverFrame = 0;
    const updateHover = () => {
      hoverFrame = 0;
      const event = pendingHoverEvent;
      pendingHoverEvent = undefined;
      if (!event) {
        return;
      }

      const target = pickTarget(event);
      hoverNodeIdRef.current = target.node?.id;
      renderer.domElement.style.cursor = target.node || target.edge || target.zone ? 'pointer' : 'grab';
      setHover(target.node || target.edge || target.zone ? { ...target, x: event.clientX, y: event.clientY } : undefined);
    };

    const onPointerMove = (event: PointerEvent) => {
      pendingHoverEvent = event;
      if (!hoverFrame) {
        hoverFrame = window.requestAnimationFrame(updateHover);
      }
    };

    const onPointerLeave = () => {
      if (hoverFrame) {
        window.cancelAnimationFrame(hoverFrame);
        hoverFrame = 0;
      }
      pendingHoverEvent = undefined;
      hoverNodeIdRef.current = undefined;
      renderer.domElement.style.cursor = 'grab';
      setHover(undefined);
    };

    const onClick = (event: MouseEvent) => {
      const target = pickTarget(event);
      if (target.node) {
        selectNode(target.node.id);
      } else if (target.edge) {
        selectEdge(target.edge.id);
      } else if (target.zone) {
        moveCameraToPoseEvent(cameraPoseForZone(camera, controls, target.zone, pointsForZone(target.zone, positionsRef.current)));
        focusPointRef.current = target.zone.center;
        selectCluster(target.zone.id);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.addEventListener('click', onClick);

    const timer = new THREE.Timer();
    timer.connect(document);
    let frame = 0;
    const animate = (timestamp?: number) => {
      timer.update(timestamp);
      const elapsed = timer.getElapsed();
      animateFlowObjects(flowObjectsRef.current, elapsed);
      animateParticleFields(particleObjectsRef.current, elapsed);
      animatePulseObjects(pulseObjectsRef.current, elapsed);
      updateGraphIllumination(illuminationRef, illuminationObjectsRef.current, performance.now());
      updateCameraFlight(cameraFlightRef, camera, controls, performance.now());
      controls.update();
      updateFocusGlow(container, camera, focusPointRef.current, focusProjectionRef.current);
      const labelVisibilityKey = graphLabelVisibilityKey(container, camera, controls, hoverNodeIdRef.current);
      if (labelVisibilityKey !== labelVisibilityKeyRef.current) {
        labelVisibilityKeyRef.current = labelVisibilityKey;
        updateGraphLabels(
          labelSpritesRef.current,
          camera,
          controls,
          renderer,
          hoverNodeIdRef.current,
          labelProjectionRef.current,
        );
      }
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      timer.dispose();
      if (hoverFrame) {
        window.cancelAnimationFrame(hoverFrame);
      }
      observer.disconnect();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      clearFocusGlow(container);
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, [focusProjectionRef, labelProjectionRef, positionsRef, resetView, setHover]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) {
      return undefined;
    }

    const renderedGraph = buildTenantGraphScene({
      centralNodeId,
      focusedZoneId,
      getImage,
      graph,
      selectedEdgeId,
      selectedNodeId,
    });

    scene.add(renderedGraph.group);
    edgePickablesRef.current = renderedGraph.edgePickables;
    flowObjectsRef.current = renderedGraph.flowObjects;
    focusPointRef.current = renderedGraph.focusPoint;
    labelSpritesRef.current = renderedGraph.labelSprites;
    labelVisibilityKeyRef.current = '';
    nodePickablesRef.current = renderedGraph.nodePickables;
    particleObjectsRef.current = renderedGraph.particleObjects;
    illuminationObjectsRef.current = renderedGraph.illuminationObjects;
    illuminationRef.current = undefined;
    positionsRef.current = renderedGraph.positions;
    pulseObjectsRef.current = renderedGraph.pulseObjects;
    zonePickablesRef.current = renderedGraph.zonePickables;

    if (renderedGraph.positions.size > 0 && renderedGraph.illuminationKey !== illuminationGraphKeyRef.current) {
      illuminationGraphKeyRef.current = renderedGraph.illuminationKey;
      startGraphIllumination();
    }
    if (renderedGraph.focusKey !== cameraFocusKeyRef.current) {
      cameraFocusKeyRef.current = renderedGraph.focusKey;
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (camera && controls && renderedGraph.focusedZone) {
        moveCameraToPose(
          cameraPoseForZone(
            camera,
            controls,
            renderedGraph.focusedZone,
            pointsForZone(renderedGraph.focusedZone, renderedGraph.positions),
          ),
        );
      } else {
        fitView();
      }
    }

    return () => {
      disposeObject(renderedGraph.group);
      edgePickablesRef.current = [];
      flowObjectsRef.current = [];
      focusPointRef.current = undefined;
      labelSpritesRef.current = [];
      nodePickablesRef.current = [];
      particleObjectsRef.current = [];
      illuminationObjectsRef.current = [];
      illuminationRef.current = undefined;
      positionsRef.current = new Map();
      pulseObjectsRef.current = [];
      zonePickablesRef.current = [];
    };
  }, [
    centralNodeId,
    fitView,
    focusedZoneId,
    getImage,
    graph,
    moveCameraToPose,
    nodeImageVersion,
    positionsRef,
    selectedEdgeId,
    selectedNodeId,
    startGraphIllumination,
  ]);

  return { containerRef, fitView, resetView };
}

function makeScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog('#040714', 500, 980);
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

  return scene;
}

function makeRenderer(): THREE.WebGLRenderer {
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
  return renderer;
}

function updateFocusGlow(
  container: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  focusPosition?: THREE.Vector3,
  scratchVector = new THREE.Vector3(),
): void {
  const host = container.parentElement ?? container;
  if (!focusPosition) {
    host.style.setProperty('--graph-focus-opacity', '0.38');
    host.style.setProperty('--graph-focus-x', '50%');
    host.style.setProperty('--graph-focus-y', '48%');
    return;
  }

  const projected = scratchVector.copy(focusPosition).project(camera);
  const width = container.clientWidth || 1;
  const height = container.clientHeight || 1;
  const x = ((projected.x + 1) / 2) * width;
  const y = ((1 - projected.y) / 2) * height;

  host.style.setProperty('--graph-focus-opacity', '0.82');
  host.style.setProperty('--graph-focus-x', `${x}px`);
  host.style.setProperty('--graph-focus-y', `${y}px`);
}

function graphLabelVisibilityKey(
  container: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  hoverNodeId: string | undefined,
): string {
  return [
    roundedCameraValue(camera.position.x),
    roundedCameraValue(camera.position.y),
    roundedCameraValue(camera.position.z),
    roundedCameraValue(controls.target.x),
    roundedCameraValue(controls.target.y),
    roundedCameraValue(controls.target.z),
    container.clientWidth,
    container.clientHeight,
    hoverNodeId ?? '',
  ].join(':');
}

function roundedCameraValue(value: number): number {
  return Math.round(value * 10) / 10;
}

function updateCameraFlight(
  flightRef: CurrentRef<CameraFlight | undefined>,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  now: number,
): void {
  const flight = flightRef.current;
  if (!flight) {
    return;
  }

  const progress = Math.min(1, (now - flight.startedAt) / flight.duration);
  const eased = easeInOutCubic(progress);
  camera.position.copy(flight.fromPosition).lerp(flight.toPosition, eased);
  controls.target.copy(flight.fromTarget).lerp(flight.toTarget, eased);

  if (progress >= 1) {
    flightRef.current = undefined;
  }
}

function updateGraphIllumination(
  flightRef: CurrentRef<IlluminationFlight | undefined>,
  objects: readonly THREE.Object3D[],
  now: number,
): void {
  const flight = flightRef.current;
  if (!flight) {
    return;
  }

  const progress = Math.min(1, (now - flight.startedAt) / flight.duration);
  if (progress >= 1) {
    animateIlluminationObjects(objects, 0);
    flightRef.current = undefined;
    return;
  }

  const fade = 1 - easeOutCubic(progress);
  const pulse = 0.9 + Math.sin(progress * Math.PI * 3) * 0.1;
  animateIlluminationObjects(objects, Math.max(0, fade * pulse));
}

function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function clearFocusGlow(container: HTMLDivElement): void {
  const host = container.parentElement ?? container;
  host.style.removeProperty('--graph-focus-opacity');
  host.style.removeProperty('--graph-focus-x');
  host.style.removeProperty('--graph-focus-y');
}
