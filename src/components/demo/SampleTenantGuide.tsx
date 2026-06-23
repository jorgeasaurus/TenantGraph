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
      setTargetRect({
        height: rect.height,
        left: rect.left,
        top: rect.top,
        width: rect.width,
      });
    };

    const scrollBlock = 'scrollBlock' in step ? step.scrollBlock : undefined;
    if (scrollBlock) {
      const target = document.querySelector<HTMLElement>(step.target);
      target?.scrollIntoView({
        behavior: 'smooth',
        block: scrollBlock,
        inline: 'nearest',
      });
    }

    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);

    return () => {
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
            height: targetRect.height + 12,
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
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
