/**
 * MasteryParticle — single emerald particle that floats up + fades on
 * concept-mastery crossover (E2 in the content module v3 plan).
 *
 * Taste contract from /plan-design-review:
 *   - ONE particle per celebration (not confetti)
 *   - Emerald (#10b981) — the system's mastery signature color
 *   - Slow rise (~1.4s), gentle fade, easing ease-out
 *   - prefers-reduced-motion: render a quiet static dot instead
 *   - Gated by last_celebrated_at per concept-per-day in localStorage
 *     (handled by useMasteryCelebration; this component just renders)
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export interface MasteryParticleProps {
  /** Mounted only when celebration is active. Parent unmounts after ~2s. */
  active: boolean;
}

export function MasteryParticle({ active }: MasteryParticleProps) {
  const reduced = usePrefersReducedMotion();
  if (!active) return null;

  if (reduced) {
    // Quiet alternative — no motion, just a brief emerald glow.
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.2 }}
        className="pointer-events-none fixed inset-x-0 top-1/3 mx-auto h-2 w-2 rounded-full bg-emerald-500"
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], y: -120, scale: [0.5, 1, 1, 0.8] }}
      transition={{ duration: 1.4, ease: 'easeOut', times: [0, 0.15, 0.7, 1] }}
      className="pointer-events-none fixed left-1/2 bottom-1/3 -translate-x-1/2 z-50 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.7)]"
      aria-hidden="true"
    />
  );
}

const CELEBRATION_KEY = 'vidhya.mastery_celebrated';

export function shouldCelebrate(conceptId: string): boolean {
  try {
    const raw = localStorage.getItem(CELEBRATION_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    const today = new Date().toISOString().slice(0, 10);
    return map[conceptId] !== today;
  } catch {
    return true;
  }
}

export function markCelebrated(conceptId: string): void {
  try {
    const raw = localStorage.getItem(CELEBRATION_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[conceptId] = new Date().toISOString().slice(0, 10);
    localStorage.setItem(CELEBRATION_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}
