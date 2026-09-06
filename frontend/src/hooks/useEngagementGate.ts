import { useEffect, useState } from 'react';

/**
 * useEngagementGate — a minimum think-time before an "advance" control
 * (GuidedWalkthrough's hint/answer button, Simulation's Continue,
 * AtomCardRenderer's "Show next step") becomes tappable.
 *
 * Root cause (/design-review, 2026-09-06): every one of these buttons was
 * tappable at the instant new content appeared, with nothing distinguishing
 * "I read this" from "I'm mashing through." Intelligent-tutoring research
 * uses exactly this lever — CMU/Carnegie Learning's between-hint delay,
 * UMass's minimum-time-on-problem gate before a hint unlocks — to regulate
 * *when* help/next-step becomes available, not whether it's offered at all.
 *
 * Scaled by word count rather than a flat delay, so a one-line prompt and a
 * dense worked step get proportionate think-time; floor/ceiling keep it from
 * ever reading as broken (too short to notice) or punishing (too long on a
 * short line).
 *
 * Deliberately NOT collapsed under prefers-reduced-motion: that preference
 * is about decorative animation, not reading time, and gating the wait on it
 * would silently remove the safeguard for exactly the users who opted into
 * it for an unrelated reason. Callers that also render a purely decorative
 * fade/transition around the gated state should still run THAT through
 * usePrefersReducedMotion separately (see revealTransitionDuration in
 * GuidedWalkthrough.tsx for the established pattern).
 *
 * `key` re-arms the gate — pass something that changes exactly when the
 * gated control should re-lock (a step index, a phase, a beat index).
 */

const WORDS_PER_MINUTE = 140;
const GATE_FLOOR_MS = 1200;
const GATE_CEILING_MS = 5000;

export function engagementGateMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const estimateMs = (words / WORDS_PER_MINUTE) * 60_000;
  return Math.min(GATE_CEILING_MS, Math.max(GATE_FLOOR_MS, estimateMs));
}

export function useEngagementGate(text: string, key: string | number): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const timer = setTimeout(() => setReady(true), engagementGateMs(text));
    return () => clearTimeout(timer);
    // `text` intentionally excluded: `key` is the caller's declared re-arm
    // signal (step/phase/beat), and re-running on every text identity
    // change too would double-fire when a re-render passes a new string
    // instance with the same content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return ready;
}
