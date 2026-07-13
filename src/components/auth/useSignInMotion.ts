import { animate, createScope, createTimeline, stagger } from 'animejs';
import { useLayoutEffect, type RefObject } from 'react';

export function useSignInMotion(rootRef: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) {
      return undefined;
    }

    const scope = createScope({ root }).add(() => {
      animate('.network-background', {
        opacity: [0.45, 1],
        duration: 1100,
        ease: 'out(3)',
      });

      createTimeline({ defaults: { ease: 'out(4)' } })
        .add('.signin-panel', {
          opacity: [0, 1],
          y: [24, 0],
          scale: [0.985, 1],
          duration: 620,
        })
        .add('.brand-mark', {
          opacity: [0, 1],
          rotate: ['-8deg', '0deg'],
          scale: [0.72, 1],
          duration: 520,
        }, '-=410')
        .add('.signin-panel > .eyebrow, .signin-panel > h1, .signin-panel > p, .env-list > code', {
          opacity: [0, 1],
          y: [10, 0],
          delay: stagger(45),
          duration: 360,
        }, '-=330')
        .add('.landing-action-stack > *, .access-resources', {
          opacity: [0, 1],
          y: [12, 0],
          delay: stagger(55),
          duration: 420,
        }, '-=240');
    });

    return () => scope.revert();
  }, [rootRef]);
}

export function animateAccessRequirements(panel: HTMLElement): () => void {
  if (prefersReducedMotion()) {
    return () => undefined;
  }

  const content = panel.querySelectorAll(':scope > p, :scope > ul, :scope > a');
  const panelAnimation = animate(panel, {
    opacity: [0, 1],
    y: [-8, 0],
    scale: [0.985, 1],
    duration: 280,
    ease: 'out(4)',
  });
  const contentAnimation = animate(content, {
    opacity: [0, 1],
    y: [-4, 0],
    delay: stagger(28),
    duration: 240,
    ease: 'out(3)',
  });

  return () => {
    panelAnimation.revert();
    contentAnimation.revert();
  };
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
