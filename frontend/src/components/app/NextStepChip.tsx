/**
 * NextStepChip — a subtle, dismissible prompt for a suggested next step.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

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
    // sessionStorage unavailable
  }
}

export default function NextStepChip({ step, onAccept, acceptLabel }: Props) {
  const [dismissed, setDismissed] = useState(false);

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
      style={{
        padding: 12,
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-card)',
        border: 'var(--hairline) solid var(--separator)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <div style={{
        flexShrink: 0,
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'rgba(88,86,214,.08)',
        border: '1px solid rgba(88,86,214,.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Sparkles size={12} style={{ color: 'var(--indigo-ink)' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
          {step.description}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            onClick={handleAccept}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(88,86,214,.08)',
              border: '1px solid rgba(88,86,214,.25)',
              fontSize: 11,
              fontWeight: 'var(--weight-medium)',
              color: 'var(--indigo-ink)',
              cursor: 'pointer',
            }}
          >
            {acceptLabel || step.label}
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'none',
              border: 'none',
              fontSize: 11,
              fontWeight: 'var(--weight-medium)',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
            }}
          >
            Not now
          </button>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{ flexShrink: 0, padding: 2, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <X size={12} style={{ color: 'var(--text-tertiary)' }} />
      </button>
    </motion.div>
  );
}
