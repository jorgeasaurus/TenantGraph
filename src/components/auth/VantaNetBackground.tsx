import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import vantaNetModule from 'vanta/dist/vanta.net.min';

const vantaThree = { ...THREE, VertexColors: true };
const createVantaNet = typeof vantaNetModule === 'function' ? vantaNetModule : vantaNetModule.default;

export function VantaNetBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    const effect = element
      ? createVantaNet({
          el: element,
          THREE: vantaThree,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1,
          scaleMobile: 1,
          color: 0x3fbbff,
          backgroundColor: 0x0,
          spacing: 12,
        })
      : undefined;

    return () => effect?.destroy();
  }, []);

  return <div aria-hidden="true" className="network-background" ref={containerRef} />;
}
