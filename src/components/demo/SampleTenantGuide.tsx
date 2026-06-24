import { useEffect, useLayoutEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { sampleGuideSteps } from './sampleGuideSteps';

type TargetRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type SampleTenantGuideProps = {
  open: boolean;
  onClose: () => void;
};

export function SampleTenantGuide({ open, onClose }: SampleTenantGuideProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect>();
  const step = sampleGuideSteps[stepIndex];

  useEffect(() => {
    if (open) {
      setStepIndex(0);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !step?.target) {
      setTargetRect(undefined);
      return undefined;
    }

    const updateTarget = () => {
      const target = document.querySelector<HTMLElement>(step.target!);
      if (!target) {
        setTargetRect(undefined);
        return;
      }

      const rect = target.getBoundingClientRect();
      const inset = 6;
      const left = Math.max(inset, rect.left - inset);
      const top = Math.max(inset, rect.top - inset);
      const right = Math.min(window.innerWidth - inset, rect.right + inset);
      const bottom = Math.min(window.innerHeight - inset, rect.bottom + inset);

      setTargetRect({
        height: Math.max(0, bottom - top),
        left,
        top,
        width: Math.max(0, right - left),
      });
    };

    let animationFrameId: number | undefined;
    let settleTimerId: number | undefined;
    const scrollBlock = 'scrollBlock' in step ? step.scrollBlock : undefined;
    if (scrollBlock) {
      const target = document.querySelector<HTMLElement>(step.target);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const scrollBehavior: ScrollBehavior = reduceMotion || window.innerWidth <= 980 ? 'auto' : 'smooth';
      target?.scrollIntoView({
        behavior: scrollBehavior,
        block: scrollBlock,
        inline: 'nearest',
      });

      animationFrameId = window.requestAnimationFrame(updateTarget);
      settleTimerId = window.setTimeout(updateTarget, scrollBehavior === 'smooth' ? 650 : 80);
    }

    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);

    return () => {
      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId);
      }
      if (settleTimerId !== undefined) {
        window.clearTimeout(settleTimerId);
      }
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [open, step]);

  if (!open || !step) {
    return null;
  }

  const lastStep = stepIndex === sampleGuideSteps.length - 1;

  return (
    <div className="sample-guide" aria-live="polite">
      {targetRect && (
        <div
          className="sample-guide-target"
          style={{
            height: targetRect.height,
            left: targetRect.left,
            top: targetRect.top,
            width: targetRect.width,
          }}
        />
      )}
      <section key={step.id} className="sample-guide-panel" aria-label="Sample tenant guide">
        <div className="sample-guide-heading">
          <span>
            Step {stepIndex + 1} of {sampleGuideSteps.length}
          </span>
          <button type="button" aria-label="Close sample guide" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="sample-guide-progress" aria-hidden="true">
          {sampleGuideSteps.map((guideStep, index) => (
            <span key={guideStep.id} className={index === stepIndex ? 'active' : undefined} />
          ))}
        </div>
        <div className="sample-guide-actions">
          <button
            type="button"
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            disabled={stepIndex === 0}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <button
            className="primary-action"
            type="button"
            onClick={() => (lastStep ? onClose() : setStepIndex((current) => current + 1))}
          >
            {lastStep ? 'Finish' : 'Next'}
            {!lastStep && <ArrowRight size={14} />}
          </button>
        </div>
      </section>
    </div>
  );
}
