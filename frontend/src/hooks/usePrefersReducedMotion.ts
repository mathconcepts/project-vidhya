import { useEffect, useState } from 'react';

/**
 * Shared reduced-motion preference hook (T24/§11). All sanctioned motion
 * (warmup crossfade, focused-work fill-once, frontier auto-scroll) routes
 * through this — never duplicate the matchMedia wiring per component.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
