/**
 * DiagnosticInterstitial (v4.0) — 3-step reveal after diagnostic submit.
 *
 * The first impression of the system's intelligence happens here. Instead
 * of navigating straight to /planned with no transition, we show:
 *   Step 1: "Strong in: {topic}" with confetti (milestone)
 *   Step 2: "Focus area: {topic}" calm amber
 *   Step 3: "Your plan is ready" with violet plan accent + CTA
 *
 * Design (per plan-design-review):
 *   - Confetti reserved for Step 1 (first diagnostic = milestone)
 *   - Step 2 amber for focus area, NO confetti
 *   - Step 3 violet for AI/Plan signal
 *   - Auto-advance 2.5s per step (300ms transition)
 *   - prefers-reduced-motion: disable auto-advance, manual continue per step
 *   - "Skip →" button visible top-right at all times
 *   - Final step doesn't auto-navigate; user clicks Start
 *
 * Per-step typography:
 *   - Label: DM Sans 13px uppercase tracked dim
 *   - Value: Fraunces 32px / 700 white
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Sparkles, ArrowRight, X } from 'lucide-react';
import { Confetti } from '@/components/app/Confetti';
import { trackEvent } from '@/lib/analytics';

interface Props {
  /** Topic the user is strongest in. */
  topStrength: string;
  /** Topic the user needs to focus on. */
  biggestGap: string;
  /** Called when the user finishes the interstitial (Start or Skip). */
  onContinue: () => void;
}

const STEP_DURATION_MS = 2500;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function DiagnosticInterstitial({ topStrength, biggestGap, onContinue }: Props) {
  const [step, setStep] = useState(0); // 0, 1, 2 (step 2 doesn't auto-advance)
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    trackEvent('diagnostic_interstitial_viewed', {
      reduced_motion: reducedMotion,
    });
  }, [reducedMotion]);

  // Auto-advance steps 0 and 1 unless reduced-motion is set.
  useEffect(() => {
    if (reducedMotion) return;
    if (step >= 2) return;
    const t = window.setTimeout(() => setStep(s => s + 1), STEP_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [step, reducedMotion]);

  const handleSkip = () => {
    trackEvent('diagnostic_interstitial_skipped', { skipped_at_step: step });
    onContinue();
  };

  const handleStart = () => {
    trackEvent('diagnostic_interstitial_completed', {});
    onContinue();
  };

  const handleManualContinue = () => {
    if (step >= 2) {
      handleStart();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Diagnostic results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#0a0f1a] flex flex-col items-center justify-center px-6 py-8"
    >
      {/* Skip button — always visible, top-right */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 inline-flex items-center gap-1 px-3 py-1.5 text-xs text-surface-400 hover:text-surface-200 transition-colors"
        aria-label="Skip results"
      >
        Skip <X size={12} />
      </button>

      {step === 0 && <Confetti />}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md space-y-6"
        >
          {step === 0 && (
            <>
              <div className="size-12 rounded-2xl bg-emerald-500/15 inline-flex items-center justify-center">
                <CheckCircle2 size={24} className="text-emerald-400" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-surface-500">
                  Strong in
                </p>
                <h1 className="font-display text-3xl font-bold text-white">{topStrength}</h1>
              </div>
              <p
                aria-live="polite"
                className="text-sm text-surface-400"
              >
                You've got a foundation here. We'll keep you sharp.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <div className="size-12 rounded-2xl bg-amber-500/15 inline-flex items-center justify-center">
                <AlertCircle size={24} className="text-amber-400" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-surface-500">
                  Focus area
                </p>
                <h1 className="font-display text-3xl font-bold text-white">{biggestGap}</h1>
              </div>
              <p
                aria-live="polite"
                className="text-sm text-surface-400"
              >
                Where the most score points are hiding. Your plan starts here.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="size-12 rounded-2xl bg-violet-500/15 inline-flex items-center justify-center">
                <Sparkles size={24} className="text-violet-400" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-surface-500">
                  Your plan
                </p>
                <h1 className="font-display text-3xl font-bold text-white">Ready when you are.</h1>
              </div>
              <button
                onClick={handleStart}
                className="w-full h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                Start <ArrowRight size={14} />
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Reduced-motion: per-step Continue button */}
      {reducedMotion && step < 2 && (
        <button
          onClick={handleManualContinue}
          className="absolute bottom-8 right-6 inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
        >
          Continue <ArrowRight size={14} />
        </button>
      )}

      {/* Step indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className={`size-1.5 rounded-full transition-colors ${
              i === step ? 'bg-violet-400' : 'bg-surface-700'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
