/**
 * DemoCaption — the self-narrating layer for a demo rail (M3 / D3.4).
 *
 * Its job, per the plan, is to remove the founder from the critical path: the
 * product should be able to explain what it just did without someone standing
 * over the visitor's shoulder. So a caption narrates PRODUCT BEHAVIOUR — "the
 * rail is shorter because his profile does not need the intuition pass" — and
 * never sells. `scripts/check-demo-rails.ts` fails the build on puffery, so
 * that rule is enforced on the copy rather than trusted to the author.
 *
 * Two design constraints shaped this:
 *
 * 1. ZERO FOOTPRINT ON STUDENT SURFACES. The component returns null unless a
 *    demo persona is active in this tab, so a real student never renders it —
 *    and `demo-caption.invariant.test.ts` asserts the only mount point is
 *    behind that check. A narration overlay leaking into a real lesson would
 *    be the product talking about itself to someone who just wants to study.
 *
 * 2. CAPTIONS ARE GARNISH, NEVER LOAD-BEARING. The rail must work with the
 *    caption dismissed, skipped, or absent: it is dismissible, it never traps
 *    focus, and nothing about lesson state depends on it having been read.
 *    The plan's shadow-path table says "script shorter than rail → rail simply
 *    continues uncaptioned", which is what a missing entry does here.
 *
 * Motion honours DESIGN-SYSTEM.md: one curve, one duration, and
 * `prefers-reduced-motion` collapses it rather than animating a translate.
 */

import { useEffect, useState } from 'react';
import { getDemoPersona, getDemoOutcome, onDemoOutcomeChange } from '@/lib/demoPersona';
import { X } from 'lucide-react';

export interface DemoCaptionProps {
  /** The rail step being shown — an atom name, or 'compare'. */
  step: string;
  /** Caption scripts for the active card, anchored by step. */
  captions?: Array<{ at: string; text: string; when?: 'correct' | 'incorrect' }>;
}

/** Pure lookup, exported so the anchoring rule is testable without a DOM. */
export function captionFor(
  step: string,
  captions?: Array<{ at: string; text: string; when?: 'correct' | 'incorrect' }>,
  outcome?: 'correct' | 'incorrect' | null,
): string | null {
  if (!captions?.length || !step) return null;
  // The rails config anchors on atom FILE names (worked-example) while the
  // runtime atom carries an atom_type (worked_example). Normalise both rather
  // than making authors remember which side they are on — a caption silently
  // not showing is the exact failure this anchoring scheme exists to avoid.
  const norm = (s: string) => s.replace(/_/g, '-').toLowerCase();
  const target = norm(step);
  const atStep = captions.filter((c) => norm(c.at) === target);
  // An outcome-specific caption wins once the outcome is known — that is the
  // reframe. The unconditional one is the fallback, so a step without a
  // branch still narrates rather than going silent.
  return (
    (outcome ? atStep.find((c) => c.when === outcome)?.text : undefined) ??
    atStep.find((c) => !c.when)?.text ??
    null
  );
}

export function DemoCaption({ step, captions }: DemoCaptionProps) {
  const [dismissed, setDismissed] = useState(false);
  const [outcome, setOutcome] = useState(() => getDemoOutcome());
  useEffect(() => onDemoOutcomeChange(() => setOutcome(getDemoOutcome())), []);

  // A new step is a new caption; a dismissal applies to the one it was aimed
  // at, not to the rest of the rail.
  useEffect(() => {
    setDismissed(false);
  }, [step]);

  // Not in a demo journey → the component does not exist for this visitor.
  if (!getDemoPersona()) return null;

  const text = captionFor(step, captions, outcome ? (outcome.correct ? 'correct' : 'incorrect') : null);
  if (!text || dismissed) return null;

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <aside
      aria-label="Demo narration"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        margin: '0 0 16px',
        padding: '14px 16px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-sunken)',
        boxShadow: 'inset 0 0 0 1px var(--separator)',
        transition: reduceMotion ? 'none' : 'opacity 180ms var(--ease-standard)',
      }}
    >
      <p
        style={{
          margin: 0,
          flex: 1,
          fontSize: 15,
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
        }}
      >
        {text}
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss narration"
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-capsule)',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
        }}
      >
        <X size={15} strokeWidth={2} aria-hidden="true" />
      </button>
    </aside>
  );
}
