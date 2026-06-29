import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { graphBloomLayer } from './threeGraphObjects';

type MaterialOwner = THREE.Object3D & {
  material: THREE.Material | THREE.Material[];
};

type MaterialRestore = {
  material: THREE.Material | THREE.Material[];
  object: MaterialOwner;
};

export type GraphPostProcessing = {
  dispose: () => void;
  render: () => void;
  resize: (width: number, height: number, pixelRatio: number) => void;
};

const bloomOverlayShader = {
  uniforms: {
    bloomStrength: { value: 0.38 },
    bloomTexture: { value: null as THREE.Texture | null },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float bloomStrength;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;

    void main() {
      vec4 bloom = texture2D(bloomTexture, vUv);
      vec3 color = bloom.rgb * bloomStrength;
      float luminance = dot(bloom.rgb, vec3(0.2126, 0.7152, 0.0722));
      float contributionAlpha = smoothstep(0.003, 0.028, luminance);
      gl_FragColor = vec4(color, contributionAlpha);
    }
  `,
};

export function makeGraphPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): GraphPostProcessing {
  const bloomLayer = new THREE.Layers();
  bloomLayer.set(graphBloomLayer);
  const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  blackMaterial.depthWrite = false;
  blackMaterial.toneMapped = false;
  const transparentMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    depthTest: false,
    depthWrite: false,
    opacity: 0,
    toneMapped: false,
    transparent: true,
  });
  const restoreList: MaterialRestore[] = [];

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.36, 0.12);
  bloomComposer.addPass(bloomPass);

  const overlayScene = new THREE.Scene();
  const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const overlayMaterial = new THREE.ShaderMaterial({
    ...bloomOverlayShader,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  overlayMaterial.uniforms.bloomTexture.value = bloomComposer.renderTarget2.texture;
  const overlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), overlayMaterial);
  overlayScene.add(overlayMesh);

  const render = () => {
    try {
      scene.traverse((object) => darkenNonBloomed(object, bloomLayer, blackMaterial, transparentMaterial, restoreList));
      bloomComposer.render();
    } finally {
      restoreMaterials(restoreList);
    }

    renderer.render(scene, camera);

    const previousAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(overlayScene, overlayCamera);
    renderer.autoClear = previousAutoClear;
  };

  return {
    dispose: () => {
      restoreMaterials(restoreList);
      blackMaterial.dispose();
      transparentMaterial.dispose();
      bloomComposer.dispose();
      overlayMesh.geometry.dispose();
      overlayMaterial.dispose();
    },
    render,
    resize: (width, height, pixelRatio) => {
      bloomComposer.setPixelRatio(pixelRatio);
      bloomComposer.setSize(width, height);
      bloomPass.resolution.set(width, height);
    },
  };
}

function darkenNonBloomed(
  object: THREE.Object3D,
  bloomLayer: THREE.Layers,
  blackMaterial: THREE.Material,
  transparentMaterial: THREE.Material,
  restoreList: MaterialRestore[],
): void {
  if (!isMaterialOwner(object) || bloomLayer.test(object.layers)) {
    return;
  }

  restoreList.push({ material: object.material, object });
  object.material = hasTransparentMaterial(object.material) ? transparentMaterial : blackMaterial;
}

function restoreMaterials(restoreList: MaterialRestore[]): void {
  for (const { material, object } of restoreList) {
    object.material = material;
  }
  restoreList.length = 0;
}

function isMaterialOwner(object: THREE.Object3D): object is MaterialOwner {
  return 'material' in object && Boolean((object as { material?: unknown }).material);
}

function hasTransparentMaterial(material: THREE.Material | THREE.Material[]): boolean {
  const materials = Array.isArray(material) ? material : [material];
  return materials.some((entry) => entry.transparent || entry.opacity < 1 || entry instanceof THREE.SpriteMaterial);
}
