/**
 * mediaPreferences — user-agent preference queries, in one place.
 *
 * `prefers-reduced-data` was implemented three times independently
 * (`loadScript.ts`, `InteractiveBoundary.tsx`, and a third copy added while
 * removing the MathBox tier), all byte-identical. That is the "parallel truths
 * that drift" shape this repo's own registry header warns about: the copies
 * agree today, and the first person to fix a bug in one of them creates a
 * discrepancy nobody notices.
 *
 * A deliberately small module — it holds the queries that more than one caller
 * asks. `prefers-reduced-motion` is NOT here: `Simulation.tsx` consumes it
 * through a React hook that subscribes to changes, which is a different shape
 * from these one-shot reads, and folding them together would make both worse.
 */

/**
 * True when the user has asked their OS to save data.
 *
 * Callers should treat this as "do not fetch the heavy thing" — skip a CDN
 * payload, drop to the lightest render tier. Any failure to answer is a false:
 * an unsupported media query must not silently downgrade everyone.
 */
export function prefersReducedData(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-data: reduce)').matches;
  } catch {
    return false;
  }
}
