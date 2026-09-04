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
 *
 * When the spec carries the optional `branches` tree (plan W2.5 / D1),
 * this component delegates to DecisionTreeWalkthrough — the same kind,
 * a different presentation. `steps` stays required so a renderer without
 * the branch support still has something to show.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Lightbulb, Eye, BookOpen } from 'lucide-react';
import { DecisionTreeWalkthrough } from './DecisionTreeWalkthrough';
import type { GuidedWalkthroughSpec } from './types';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { EASE_STANDARD, DUR_FAST_S, framerDuration } from '@/lib/motion-tokens';
import { Button } from '@/components/ui/Button';
import { MarkdownAtomRenderer } from '../MarkdownAtomRenderer';

// Re-exported for this component's existing tests; the source of truth now
// lives in lib/motion-tokens.ts so every framer-motion surface (not just
// this one) shares the same token-backed durations (T24).
export { EASE_STANDARD, DUR_FAST_S };
export function revealTransitionDuration(reducedMotion: boolean): number {
  return framerDuration(DUR_FAST_S, reducedMotion);
}

interface Props {
  spec: GuidedWalkthroughSpec;
  /** Forwarded to DecisionTreeWalkthrough when `spec.branches` is present; a no-op otherwise. See that file's doc comment. */
  startAt?: string;
}

type Phase = 'prompt' | 'hint' | 'answer';

export function GuidedWalkthrough({ spec, startAt }: Props) {
  if (spec.branches) {
    return <DecisionTreeWalkthrough spec={{ ...spec, branches: spec.branches }} startAt={startAt} />;
  }
  return <LinearWalkthrough spec={spec} />;
}

function LinearWalkthrough({ spec }: Props) {
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
          <div className="flex-1 min-w-0">
            <MarkdownAtomRenderer content={currentStep.prompt} atomId={`${spec.title}.step${stepIdx}.prompt`} />
          </div>
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
              <div className="flex-1 min-w-0">
                <MarkdownAtomRenderer
                  content={currentStep.hint ?? ''}
                  atomId={`${spec.title}.step${stepIdx}.hint`}
                  className="vidhya-atom-body--hint"
                />
              </div>
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
              <div className="flex-1 min-w-0">
                <MarkdownAtomRenderer content={currentStep.answer} atomId={`${spec.title}.step${stepIdx}.answer`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-end">
        {/* This is the app's one advance-button convention (variant="grey",
            press-scale feedback baked into the shared Button component) —
            Simulation.tsx's "Continue" and WorkedExampleCard's "Show next
            step" both mirror this exact call rather than hand-rolling their
            own copy, so a future style change to "tap when you're ready"
            only has to happen here. */}
        <Button
          variant="grey"
          tone="neutral"
          size="md"
          onClick={advance}
          disabled={buttonDisabled}
          iconAfter={!buttonDisabled ? <ChevronRight size={16} /> : undefined}
          style={{ background: 'var(--surface-fill-strong)', fontSize: 'var(--text-body)', minHeight: 44 }}
        >
          {buttonLabel}
        </Button>
      </div>

      {spec.caption && (
        <p className="leading-relaxed" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-footnote)' }}>{spec.caption}</p>
      )}
    </div>
  );
}

