import { useEffect, useRef } from 'react';

type VantaEffect = {
  destroy: () => void;
};

type VantaNetOptions = {
  backgroundColor: number;
  color: number;
  el: HTMLElement;
  gyroControls: boolean;
  minHeight: number;
  minWidth: number;
  mouseControls: boolean;
  scale: number;
  scaleMobile: number;
  spacing: number;
  touchControls: boolean;
};

declare global {
  interface Window {
    VANTA?: {
      NET?: (options: VantaNetOptions) => VantaEffect;
    };
  }
}

export function VantaNetBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    const effect = element
      ? window.VANTA?.NET?.({
          el: element,
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
