/**
 * motion-tokens — the CSS motion tokens (styles/tokens/motion.css), expressed
 * in the shape framer-motion's `transition` prop needs.
 *
 * CSS transitions read `--dur-*`/`--ease-standard` directly and get the
 * `prefers-reduced-motion` collapse to ~1ms for free (see motion.css's media
 * query). framer-motion's numeric `transition.duration` does NOT — a bare
 * `duration: 0.18` bypasses that collapse entirely, which is exactly the
 * literal this module exists to replace (T24, §11 "Sanctioned motion": "All
 * three route through the shared usePrefersReducedMotion hook... framer-motion
 * duration literals are banned in new surfaces").
 *
 * Pair every duration here with `usePrefersReducedMotion()` via
 * `framerDuration()` rather than reading the constant directly.
 */

/** --ease-standard, as a framer-motion cubic-bezier tuple. */
export const EASE_STANDARD = [0.32, 0.72, 0, 1] as const;

/** --dur-instant (100ms) in seconds. */
export const DUR_INSTANT_S = 0.1;
/** --dur-fast (180ms) in seconds. */
export const DUR_FAST_S = 0.18;
/** --dur-base (280ms) in seconds. */
export const DUR_BASE_S = 0.28;
/** --dur-slow (420ms) in seconds. */
export const DUR_SLOW_S = 0.42;

/**
 * Collapses a token duration to ~1ms under prefers-reduced-motion — the same
 * contract motion.css's media query gives CSS transitions for free.
 */
export function framerDuration(tokenSeconds: number, reducedMotion: boolean): number {
  return reducedMotion ? 0.001 : tokenSeconds;
}
