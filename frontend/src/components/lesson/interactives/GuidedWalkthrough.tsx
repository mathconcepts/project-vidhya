/**
 * GuidedWalkthrough.tsx
 *
 * Multi-step solver. Operator clicks to advance through worked steps.
 * Each step has three reveal phases:
 *   0. Just the prompt (initial)
 *   1. Prompt + hint (after first click)
 *   2. Prompt + hint + answer (after second click)
 *
 * Steps reveal sequentially — operator can't skip ahead. Designed to
 * mimic the "think first, then peek" pacing of a tutor working through
 * a problem with a student.
 *
 * No grading. The interactive's job is paced revelation, not assessment.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Lightbulb, CheckCircle2, BookOpen } from 'lucide-react';
import type { GuidedWalkthroughSpec } from './types';

interface Props {
  spec: GuidedWalkthroughSpec;
}

type Phase = 'prompt' | 'hint' | 'answer';

export function GuidedWalkthrough({ spec }: Props) {
  // step index, and per-step reveal phase
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('prompt');

  const currentStep = spec.steps[stepIdx];
  const isLastStep = stepIdx === spec.steps.length - 1;
  const hasHint = !!currentStep?.hint;

  function advance() {
    if (phase === 'prompt') {
      setPhase(hasHint ? 'hint' : 'answer');
      return;
    }
    if (phase === 'hint') {
      setPhase('answer');
      return;
    }
    // phase === 'answer'
    if (!isLastStep) {
      setStepIdx(stepIdx + 1);
      setPhase('prompt');
    }
  }

  const buttonLabel =
    phase === 'prompt' && hasHint ? 'Show hint'
      : phase === 'prompt' ? 'Show answer'
      : phase === 'hint' ? 'Show answer'
      : isLastStep ? 'Done' : 'Next step';

  const buttonDisabled = phase === 'answer' && isLastStep;

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: 'rgba(88,86,214,.25)', background: 'rgba(88,86,214,.05)' }}
    >
      <header className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{spec.title}</h4>
        <span
          className="text-[10px] uppercase tracking-wide font-medium"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Step {stepIdx + 1} / {spec.steps.length}
        </span>
      </header>

      {/* Progress dots */}
      <div className="flex items-center gap-1">
        {spec.steps.map((_, i) => {
          const dotStyle =
            i < stepIdx
              ? { background: 'rgba(52,199,89,.3)', borderColor: 'rgba(52,199,89,.4)' }
              : i === stepIdx && phase === 'answer'
              ? { background: 'rgba(52,199,89,.3)', borderColor: 'rgba(52,199,89,.4)' }
              : i === stepIdx
              ? { background: 'rgba(88,86,214,.3)', borderColor: 'rgba(88,86,214,.4)' }
              : { background: 'var(--surface-fill)', borderColor: 'var(--separator)' };
          return (
            <div
              key={i}
              className="flex-1 h-1 rounded-full border"
              style={dotStyle}
              aria-hidden
            />
          );
        })}
      </div>

      {/* Current step */}
      <div
        className="rounded-lg border p-3 space-y-2 min-h-[80px]"
        style={{ background: 'var(--surface-card)', borderColor: 'var(--separator)' }}
      >
        <div className="flex items-start gap-2">
          <BookOpen size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--indigo-ink)' }} />
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{currentStep.prompt}</p>
        </div>

        {currentStep.eqn && (
          <pre
            className="font-mono text-xs p-2 rounded border overflow-x-auto"
            style={{ color: 'var(--text-secondary)', background: 'var(--canvas)', borderColor: 'var(--separator)' }}
          >
            {currentStep.eqn}
          </pre>
        )}

        <AnimatePresence initial={false}>
          {(phase === 'hint' || phase === 'answer') && hasHint && (
            <motion.div
              key="hint"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 pt-2 border-t"
              style={{ borderColor: 'var(--separator)' }}
            >
              <Lightbulb size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--orange)' }} />
              <p className="text-xs italic leading-relaxed" style={{ color: 'var(--orange)', opacity: 0.9 }}>{currentStep.hint}</p>
            </motion.div>
          )}
          {phase === 'answer' && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 pt-2 border-t"
              style={{ borderColor: 'var(--separator)' }}
            >
              <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--green-ink)' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--green-ink)' }}>{currentStep.answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={advance}
          disabled={buttonDisabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--indigo)', color: 'var(--text-on-accent)' }}
        >
          {buttonLabel}
          {!buttonDisabled && <ChevronRight size={12} />}
        </button>
      </div>

      {spec.caption && (
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{spec.caption}</p>
      )}
    </div>
  );
}
