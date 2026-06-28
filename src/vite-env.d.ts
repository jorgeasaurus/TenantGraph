/// <reference types="vite/client" />

declare module 'vanta/dist/vanta.net.min' {
  import type * as THREE from 'three';

  type VantaEffect = {
    destroy: () => void;
  };

  type VantaThree = typeof THREE & {
    VertexColors?: boolean;
  };

  type VantaNetOptions = {
    THREE?: VantaThree;
    backgroundColor: number;
    color: number;
    el: HTMLElement | string;
    gyroControls: boolean;
    minHeight: number;
    minWidth: number;
    mouseControls: boolean;
    scale: number;
    scaleMobile: number;
    spacing: number;
    touchControls: boolean;
  };

  type VantaNetFactory = (options: VantaNetOptions) => VantaEffect;
  type VantaNetModule = VantaNetFactory | {
    default: VantaNetFactory;
  };

  const createVantaNet: VantaNetModule;
  export default createVantaNet;
}
