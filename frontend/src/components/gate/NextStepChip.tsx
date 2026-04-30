/**
 * NextStepChip
 *
 * The "permission chip" — a subtle, dismissible prompt asking the student if
 * they want to take a suggested next step.
 *
 * UX contract (encoded here so no caller accidentally violates it):
 *   - Renders BELOW the main answer, never above or blocking it.
 *   - One primary action ("Yes, do it") and one dismiss ("Not now").
 *   - Dismissal is persistent for the session via the dedupe_key in
 *     sessionStorage — if the same next step comes back later in the chat,
 *     we silently hide it.
 *   - No animation that forces attention (no pulse, no ping).
 *   - Friendly language, never imperative.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface NextStepData {
  action: 'practice_problems' | 'explain_concept' | 'check_your_work' | 'review_misconception' | 'build_syllabus' | 'save_to_notes';
  label: string;
  description: string;
  dedupe_key: string;
  target: {
    concept_id?: string;
    topic?: string;
    scope?: string;
    difficulty?: number;
  };
}

interface Props {
  step: NextStepData;
  onAccept: (step: NextStepData) => void;
  /** Optional override label — defaults to step.label */
  acceptLabel?: string;
}

const DISMISS_STORAGE_KEY = 'vidhya.next_step.dismissed';

function loadDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function persistDismissed(s: Set<string>) {
  try {
    sessionStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify([...s]));
  } catch {
    // sessionStorage unavailable — dismissal is still in-memory for the component
  }
}

export default function NextStepChip({ step, onAccept, acceptLabel }: Props) {
  const [dismissed, setDismissed] = useState(false);

  // On mount, check if this dedupe_key was already dismissed this session
  useEffect(() => {
    const set = loadDismissed();
    if (set.has(step.dedupe_key)) setDismissed(true);
  }, [step.dedupe_key]);

  if (dismissed) return null;

  const handleAccept = () => {
    onAccept(step);
  };

  const handleDismiss = () => {
    setDismissed(true);
    const set = loadDismissed();
    set.add(step.dedupe_key);
    persistDismissed(set);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="p-3 rounded-xl bg-surface-900/60 border border-surface-800 flex items-start gap-2.5"
    >
      <div className="shrink-0 w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
        <Sparkles size={12} className="text-violet-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-surface-300 leading-relaxed">
          {step.description}
        </p>
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={handleAccept}
            className={clsx(
              'px-2.5 py-1 rounded-md bg-violet-500/15 hover:bg-violet-500/25',
              'text-[11px] font-medium text-violet-300 border border-violet-500/30',
              'transition-colors'
            )}
          >
            {acceptLabel || step.label}
          </button>
          <button
            onClick={handleDismiss}
            className={clsx(
              'px-2.5 py-1 rounded-md text-[11px] font-medium',
              'text-surface-500 hover:text-surface-300 hover:bg-surface-800',
              'transition-colors'
            )}
          >
            Not now
          </button>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 p-0.5 rounded text-surface-600 hover:text-surface-400"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}
