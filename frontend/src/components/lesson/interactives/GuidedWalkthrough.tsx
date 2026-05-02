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
    <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 space-y-3">
      <header className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-surface-100">{spec.title}</h4>
        <span className="text-[10px] uppercase tracking-wide text-surface-500 font-medium">
          Step {stepIdx + 1} / {spec.steps.length}
        </span>
      </header>

      {/* Progress dots */}
      <div className="flex items-center gap-1">
        {spec.steps.map((_, i) => {
          let cls = 'bg-surface-800 border-surface-700';
          if (i < stepIdx) cls = 'bg-emerald-500/30 border-emerald-500/40';
          else if (i === stepIdx)
            cls =
              phase === 'answer'
                ? 'bg-emerald-500/30 border-emerald-500/40'
                : 'bg-violet-500/30 border-violet-500/40';
          return (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full border ${cls}`}
              aria-hidden
            />
          );
        })}
      </div>

      {/* Current step */}
      <div className="rounded-lg bg-surface-900/60 border border-surface-800 p-3 space-y-2 min-h-[80px]">
        <div className="flex items-start gap-2">
          <BookOpen size={13} className="mt-0.5 flex-shrink-0 text-violet-400" />
          <p className="text-sm text-surface-200 leading-relaxed">{currentStep.prompt}</p>
        </div>

        {currentStep.eqn && (
          <pre className="font-mono text-xs text-surface-300 bg-surface-950 p-2 rounded border border-surface-800 overflow-x-auto">
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
              className="flex items-start gap-2 pt-2 border-t border-surface-800"
            >
              <Lightbulb size={13} className="mt-0.5 flex-shrink-0 text-amber-400" />
              <p className="text-xs text-amber-200/90 italic leading-relaxed">{currentStep.hint}</p>
            </motion.div>
          )}
          {phase === 'answer' && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 pt-2 border-t border-surface-800"
            >
              <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-emerald-400" />
              <p className="text-xs text-emerald-200/95 leading-relaxed">{currentStep.answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={advance}
          disabled={buttonDisabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-500 hover:bg-violet-400 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {buttonLabel}
          {!buttonDisabled && <ChevronRight size={12} />}
        </button>
      </div>

      {spec.caption && (
        <p className="text-[11px] text-surface-500 leading-relaxed">{spec.caption}</p>
      )}
    </div>
  );
}
