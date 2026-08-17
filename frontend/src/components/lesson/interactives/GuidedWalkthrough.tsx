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
 * Revealed is not the same as correct — the answer step uses a neutral
 * "revealed" treatment, not the mastery-green "correct" treatment.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Lightbulb, Eye, BookOpen } from 'lucide-react';
import type { GuidedWalkthroughSpec } from './types';

// Exported for tests: the token curve (--ease-standard) and --dur-fast
// (180ms, expressed in seconds for framer-motion), and the pure function
// that collapses it to ~1ms under prefers-reduced-motion — same contract
// as the CSS tokens in styles/tokens/motion.css.
export const EASE_STANDARD = [0.32, 0.72, 0, 1] as const;
export const DUR_FAST_S = 0.18;
export function revealTransitionDuration(reducedMotion: boolean): number {
  return reducedMotion ? 0.001 : DUR_FAST_S;
}

interface Props {
  spec: GuidedWalkthroughSpec;
}

type Phase = 'prompt' | 'hint' | 'answer';

export function GuidedWalkthrough({ spec }: Props) {
  // step index, and per-step reveal phase
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('prompt');
  const reducedMotion = usePrefersReducedMotion();
  const revealDuration = revealTransitionDuration(reducedMotion);

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
      style={{ borderColor: 'var(--separator)', background: 'var(--surface-fill)' }}
    >
      <header className="flex items-center justify-between gap-2">
        <h4 className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-body)' }}>{spec.title}</h4>
        <span
          className="uppercase tracking-wide font-medium flex-shrink-0"
          style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-footnote)' }}
        >
          Step {stepIdx + 1} / {spec.steps.length}
        </span>
      </header>

      {/* Progress dots — track "revealed", not "correct". Neutral fill only;
          colour never implies a grading judgement. */}
      <div className="flex items-center gap-1">
        {spec.steps.map((_, i) => {
          const revealed = i < stepIdx || (i === stepIdx && phase === 'answer');
          const isCurrent = i === stepIdx && !revealed;
          const dotStyle = revealed
            ? { background: 'var(--surface-fill-strong)', borderColor: 'var(--separator)' }
            : isCurrent
            ? { background: 'var(--surface-fill)', borderColor: 'var(--text-tertiary)' }
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
          <BookOpen size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
          <p className="leading-relaxed" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-body)' }}>{currentStep.prompt}</p>
        </div>

        {currentStep.eqn && (
          <pre
            className="font-mono p-2 rounded border overflow-x-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)', background: 'var(--canvas)', borderColor: 'var(--separator)', fontSize: 'var(--text-body)' }}
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
              transition={{ duration: revealDuration, ease: EASE_STANDARD }}
              className="flex items-start gap-2 pt-2 border-t"
              style={{ borderColor: 'var(--separator)' }}
            >
              <Lightbulb size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--orange)' }} />
              <p className="italic leading-relaxed" style={{ color: 'var(--orange)', opacity: 0.9, fontSize: 'var(--text-body)' }}>{currentStep.hint}</p>
            </motion.div>
          )}
          {phase === 'answer' && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: revealDuration, ease: EASE_STANDARD }}
              className="flex items-start gap-2 pt-2 border-t"
              style={{ borderColor: 'var(--separator)' }}
            >
              {/* Eye, not a check mark: this step is revealed, not graded correct. */}
              <Eye size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
              <p className="leading-relaxed" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-body)' }}>{currentStep.answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={advance}
          disabled={buttonDisabled}
          className="inline-flex items-center justify-center gap-1.5 rounded-md font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--surface-fill-strong)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-body)',
            minHeight: 44,
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          {buttonLabel}
          {!buttonDisabled && <ChevronRight size={16} />}
        </button>
      </div>

      {spec.caption && (
        <p className="leading-relaxed" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-footnote)' }}>{spec.caption}</p>
      )}
    </div>
  );
}

// ============================================================================
// prefers-reduced-motion hook — same pattern as Simulation.tsx
// ============================================================================

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}
