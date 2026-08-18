/**
 * TimerPrimitive — T14/T22 (DR-3): ONE shared timer chip, two registers.
 *
 *   register="light" — the checkpoint quiz (DR-3). Grey static capsule,
 *     mono digits. Below 20% remaining (default) the WHOLE capsule swaps
 *     to the orange tint/ink pair — a single discrete state change, never
 *     a continuous per-second color shift, and never red (that's reserved
 *     for the exam register — a quiz is practice for the clock, not the
 *     clock itself).
 *
 *   register="exam" — MockExamPage (T22). Preserves the pre-existing exam
 *     chrome exactly: grey capsule normally, red capsule + red text past
 *     `lowThresholdSeconds` (default 600s, matching the prior hardcoded
 *     "isLowTime" behavior) — full exam urgency stays where it always was.
 *
 * This component OWNS none of the countdown state — the caller ticks
 * `remainingSeconds` on its own interval (unchanged pattern from
 * DiagnosticPage / MockExamPage) and this renders + announces. Keeping
 * the ticking logic with the caller avoids a second interval fighting the
 * first, and matches every existing page's ownership of its own clock.
 *
 * Accessibility: `aria-live="polite"` fires ONLY at register-state
 * transitions (normal → low, i.e. exactly once per quiz/exam) — never
 * every second, which would be an assistive-tech firehose.
 */

import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

export type TimerRegister = 'light' | 'exam';

export interface TimerPrimitiveProps {
  totalSeconds: number;
  remainingSeconds: number;
  register: TimerRegister;
  /** Overrides the default "20% of total" (light) / "600s absolute" (exam) low threshold. */
  lowThresholdSeconds?: number;
}

function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function TimerPrimitive({ totalSeconds, remainingSeconds, register, lowThresholdSeconds }: TimerPrimitiveProps) {
  const defaultThreshold = register === 'light' ? totalSeconds * 0.2 : 600;
  const threshold = lowThresholdSeconds ?? defaultThreshold;
  const isLow = remainingSeconds <= threshold;

  const [announcement, setAnnouncement] = useState('');
  const prevLow = useRef(isLow);
  useEffect(() => {
    if (prevLow.current !== isLow) {
      prevLow.current = isLow;
      if (isLow) {
        setAnnouncement(register === 'exam' ? 'Less than 10 minutes remaining.' : 'Under 20% of the time remaining.');
      }
    }
  }, [isLow, register]);

  const light = register === 'light';
  const background = isLow
    ? (light ? 'var(--orange-tint)' : 'rgba(255,59,48,.1)')
    : 'var(--surface-fill)';
  const color = isLow
    ? (light ? 'var(--orange-ink)' : 'var(--red)')
    : 'var(--text-primary)';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 12,
        fontFamily: 'var(--font-mono)',
        fontWeight: 'var(--weight-bold)',
        fontSize: 'var(--text-footnote)',
        fontVariantNumeric: 'tabular-nums',
        background,
        color,
      }}
    >
      <Clock size={13} aria-hidden="true" />
      {formatClock(remainingSeconds)}
      <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {announcement}
      </span>
    </div>
  );
}
