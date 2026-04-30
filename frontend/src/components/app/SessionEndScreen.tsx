/**
 * SessionEndScreen (v4.0) — closure moment after a planned session.
 *
 * Before v4.0, finishing a planned session navigated silently to Home —
 * the closure moment was a void. This screen anchors the habit: shows
 * what was covered, what's next, then gives the user a 5-second window
 * (or a Continue button) to return.
 *
 * Design (per plan-design-review):
 *   - Headline rotates from a 6-variant array (no mechanical template)
 *   - Emerald check icon (NOT confetti — confetti reserved for milestones)
 *   - Tomorrow's first priority in violet (AI/Plan signature)
 *   - 5s auto-navigate, with Continue button to override
 *   - Respects prefers-reduced-motion (manual continue only)
 *
 * Data sources:
 *   - Headline: rotated based on completion ratio
 *   - Covered concepts: from action.title (already on PlannedSession)
 *   - Tomorrow's priority: top_priorities[0] from the SessionPlan
 *   - Fallback: gbrain-summary mastery.weak_concepts_preview[0] (passed
 *     via prop from parent)
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface Props {
  /** Total completed actions in this session. */
  completedCount: number;
  /** Total planned actions. */
  totalCount: number;
  /** Elapsed minutes. */
  elapsedMin: number;
  /** Concept names covered, in order. */
  coveredConcepts: string[];
  /** First priority for tomorrow, if known. */
  tomorrowPriority?: string;
  /** Called when the user taps Continue (or auto-navigate fires). */
  onContinue: () => void;
}

const HEADLINES = [
  'Session complete',
  'Steady work today',
  'Strong session',
  'You showed up',
  'Locked in',
  'Solid hour',
];

function pickHeadline(completedCount: number, totalCount: number): string {
  // Deterministic-ish rotation based on completion + day-of-month so the
  // same session today doesn't randomly flicker, but two sessions in a row
  // don't get the identical headline. Cheap and good enough.
  const seed = (completedCount * 7 + totalCount * 3 + new Date().getDate()) % HEADLINES.length;
  return HEADLINES[seed];
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const AUTO_NAVIGATE_MS = 5000;

export function SessionEndScreen({
  completedCount,
  totalCount,
  elapsedMin,
  coveredConcepts,
  tomorrowPriority,
  onContinue,
}: Props) {
  const headline = pickHeadline(completedCount, totalCount);
  const reducedMotion = prefersReducedMotion();
  const [continued, setContinued] = useState(false);

  useEffect(() => {
    trackEvent('closure_screen_viewed', {
      completed: completedCount,
      total: totalCount,
      has_tomorrow: !!tomorrowPriority,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-navigate after 5s — disabled when prefers-reduced-motion is set.
  useEffect(() => {
    if (reducedMotion) return;
    const t = window.setTimeout(() => {
      if (!continued) {
        setContinued(true);
        onContinue();
      }
    }, AUTO_NAVIGATE_MS);
    return () => window.clearTimeout(t);
  }, [reducedMotion, continued, onContinue]);

  const handleContinue = () => {
    if (continued) return;
    setContinued(true);
    trackEvent('closure_screen_continue_clicked', {});
    onContinue();
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Session complete"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0f1a] px-6 py-8"
    >
      <div className="w-full max-w-md space-y-8">
        <CheckCircle2 size={32} className="text-emerald-400" />

        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-white">{headline}</h1>
          <p className="text-sm text-surface-400">
            {completedCount} of {totalCount} done · {elapsedMin} min
          </p>
        </div>

        {coveredConcepts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-surface-500">
              You covered
            </p>
            <ul className="space-y-1.5">
              {coveredConcepts.slice(0, 5).map((c, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-surface-100">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tomorrowPriority && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-surface-500">
              Tomorrow first
            </p>
            <p className="font-display text-xl font-semibold text-violet-400">
              {tomorrowPriority}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleContinue}
            className="h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            Continue <ArrowRight size={14} />
          </button>
          {!reducedMotion && !continued && (
            <p className="text-center text-[11px] text-surface-600">
              Auto-continuing in 5s
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
