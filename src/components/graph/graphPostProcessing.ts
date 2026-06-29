import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { graphBloomLayer } from './threeGraphObjects';

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
      float luminance = dot(bloom.rgb, vec3(0.2126, 0.7152, 0.0722));
      float contribution = smoothstep(0.003, 0.028, luminance);
      vec3 color = bloom.rgb * bloomStrength * contribution;
      gl_FragColor = vec4(color, contribution);
    }
  `,
};

export function makeGraphPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): GraphPostProcessing {
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
  overlayMaterial.uniforms.bloomTexture.value = bloomComposer.readBuffer.texture;
  const overlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), overlayMaterial);
  overlayScene.add(overlayMesh);

  const render = () => {
    const previousCameraLayerMask = camera.layers.mask;
    try {
      camera.layers.set(graphBloomLayer);
      bloomComposer.render();
      overlayMaterial.uniforms.bloomTexture.value = bloomComposer.readBuffer.texture;
    } finally {
      camera.layers.mask = previousCameraLayerMask;
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
      bloomPass.dispose();
      bloomComposer.dispose();
      overlayMesh.geometry.dispose();
      overlayMaterial.dispose();
    },
    render,
    resize: (width, height, pixelRatio) => {
      bloomComposer.setPixelRatio(pixelRatio);
      bloomComposer.setSize(width, height);
    },
  };
}
