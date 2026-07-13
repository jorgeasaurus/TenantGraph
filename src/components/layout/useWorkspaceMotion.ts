import { animate, createScope, createTimeline, stagger } from 'animejs';
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

type WorkspaceMotionOptions = {
  inspectorOpen: boolean;
  loading: boolean;
  selectedNodeId?: string;
};

export function useWorkspaceMotion({
  inspectorOpen,
  loading,
  selectedNodeId,
}: WorkspaceMotionOptions): RefObject<HTMLDivElement | null> {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) {
      return undefined;
    }

    const scope = createScope({ root }).add(() => {
      createTimeline({ defaults: { ease: 'out(4)' } })
        .add('.toolbar', {
          opacity: [0, 1],
          y: [-14, 0],
          duration: 440,
        })
        .add('.mobile-workspace-nav', {
          opacity: [0, 1],
          y: [-8, 0],
          duration: 320,
        }, '-=280')
        .add('.graph-stage', {
          opacity: [0, 1],
          scale: [0.992, 1],
          duration: 620,
        }, '-=300')
        .add('.sidebar-section', {
          opacity: [0, 1],
          x: [-12, 0],
          delay: stagger(22),
          duration: 360,
        }, '-=500')
        .add('.graph-left-stack > *', {
          opacity: [0, 1],
          y: [10, 0],
          delay: stagger(45),
          duration: 360,
        }, '-=260');
    });

    return () => scope.revert();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !selectedNodeId || prefersReducedMotion()) {
      return undefined;
    }

    const wave = root.querySelector<HTMLElement>('.graph-selection-wave > span');
    const details = root.querySelector<HTMLElement>('[data-guide="details"] .details-panel');
    const selectedResult = root.querySelector<HTMLElement>('.result-item[aria-pressed="true"]');
    const animations: ReturnType<typeof animate>[] = [];

    if (wave) {
      animations.push(animate(wave, {
        opacity: [0, 0.42, 0],
        scale: [0.62, 1.14],
        duration: 760,
        ease: 'out(3)',
      }));
    }
    if (details) {
      animations.push(animate(details, {
        opacity: [0.58, 1],
        x: [-9, 0],
        duration: 360,
        ease: 'out(4)',
      }));
    }
    if (selectedResult) {
      animations.push(animate(selectedResult, {
        scale: [0.985, 1],
        duration: 320,
        ease: 'out(4)',
      }));
    }

    return () => {
      animations.forEach((animation) => animation.revert());
    };
  }, [selectedNodeId]);

  useEffect(() => {
    const inspector = rootRef.current?.querySelector<HTMLElement>('.relationship-inspector');
    if (!inspectorOpen || !inspector || prefersReducedMotion()) {
      return undefined;
    }

    const animation = animate(inspector, {
      opacity: [0, 1],
      x: [24, 0],
      duration: 420,
      ease: 'out(4)',
    });
    return () => {
      animation.revert();
    };
  }, [inspectorOpen]);

  useEffect(() => {
    const loadingState = rootRef.current?.querySelector<HTMLElement>('.loading-state');
    if (!loading || !loadingState || prefersReducedMotion()) {
      return undefined;
    }

    const animation = animate(loadingState, {
      opacity: [0, 1],
      y: [8, 0],
      duration: 260,
      ease: 'out(3)',
    });
    return () => {
      animation.revert();
    };
  }, [loading]);

  return rootRef;
}

export function useSidebarResultMotion(
  rootRef: RefObject<HTMLElement | null>,
  resultKey: string,
): void {
  useLayoutEffect(() => {
    const results = rootRef.current?.querySelectorAll<HTMLElement>('.result-item');
    if (!results?.length || prefersReducedMotion()) {
      return undefined;
    }

    const animation = animate(results, {
      opacity: [0, 1],
      x: [-8, 0],
      delay: stagger(18),
      duration: 280,
      ease: 'out(3)',
    });
    return () => {
      animation.revert();
    };
  }, [resultKey, rootRef]);
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
