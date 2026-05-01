/**
 * ImprovedBadge — student-facing pill that surfaces atom-level regeneration.
 *
 * Phase 4 of the concept-generation framework v1 (E7 from the CEO plan).
 * Closes the feedback loop back to the student: "this concept got better
 * since you last saw it."
 *
 * Visibility rules:
 *   - Show when atom.improved_since is newer than atom.last_seen_at
 *     OR atom.last_seen_at is unset (student has never seen the atom).
 *   - Auto-dismisses on the first engagement post-improvement — caller
 *     drives this by re-rendering after engagement updates last_seen_at.
 *
 * Tooltip:
 *   - Anchored to the badge, opens on hover/focus/tap.
 *   - Body comes from atom.improvement_reason (plain English from the
 *     LLM-judge or regen-scanner, e.g. "Cohort error 52% — top miss:
 *     students confused tangent with secant").
 *   - On reduced-motion, no fade animation; tooltip shows on focus only.
 *
 * Design system alignment:
 *   - Emerald palette matches mastery dot + particle (consistent feedback
 *     vocabulary).
 *   - 11px DM Sans, ~36px wide pill matches existing card-header chrome.
 */

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ImprovedBadgeProps {
  /** ISO timestamp from atom_versions.generated_at on the active version. */
  improvedSince?: string;
  /** ISO timestamp from atom_engagements.last_seen for this student. */
  lastSeenAt?: string;
  /** Plain-English what-changed copy from the active version. */
  reason?: string | null;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function shouldShow(improvedSince?: string, lastSeenAt?: string): boolean {
  if (!improvedSince) return false;
  if (!lastSeenAt) return true; // student has never seen this atom
  try {
    return new Date(improvedSince).getTime() > new Date(lastSeenAt).getTime();
  } catch {
    return false;
  }
}

export function ImprovedBadge({ improvedSince, lastSeenAt, reason }: ImprovedBadgeProps) {
  const [open, setOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Click-outside-closes contract for tap-friendly mobile UX.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  if (!shouldShow(improvedSince, lastSeenAt)) return null;

  const tooltipBody = reason && reason.trim()
    ? reason
    : 'This concept was regenerated based on cohort feedback since you last saw it.';

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium"
      onMouseEnter={() => !reduced && setOpen(true)}
      onMouseLeave={() => !reduced && setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((v) => !v);
      }}
      tabIndex={0}
      role="status"
      aria-label="This concept improved since your last visit"
    >
      <Sparkles size={10} />
      <span>Improved</span>
      {open && (
        <span
          role="tooltip"
          className="absolute z-30 right-0 top-full mt-1 w-64 rounded-lg bg-surface-900 border border-emerald-500/30 p-2.5 shadow-xl text-[11px] font-normal text-emerald-100/90 normal-case tracking-normal"
        >
          <span className="block text-emerald-300 font-semibold mb-1">What changed</span>
          <span className="block">{tooltipBody}</span>
        </span>
      )}
    </span>
  );
}
