/**
 * useScrollDirection — is the reader currently moving down the page?
 *
 * Exists for one job: let a floating overlay step out of the way while the
 * student is reading, and come back when they stop.
 *
 * The tutor FAB is `position: fixed` at `right: 20px`, 80px off the bottom,
 * with no gutter reserved for it in the content column. On a phone-width
 * atom card that puts a 56px opaque indigo disc directly on top of body
 * text — live QA caught it covering two of the four options on a
 * `micro_exercise`, and covering the hook's prose on the concept page.
 * Padding the content column instead would cost every line 56px of measure
 * on the one axis a 390px viewport cannot spare, to avoid a control the
 * student is not using while they read.
 *
 * Returns `true` only while scrolling DOWN — reading posture. Scrolling up
 * is navigation posture (looking for a control), so the FAB returns
 * immediately, as does settling at rest.
 */

import { useEffect, useRef, useState } from 'react';

/** Ignore sub-pixel and rubber-band jitter; iOS overscroll reports both. */
const THRESHOLD_PX = 8;
/** How long after the last scroll event the reader counts as "at rest". */
const SETTLE_MS = 400;

export function useScrollDirection(): { scrollingDown: boolean } {
  const [scrollingDown, setScrollingDown] = useState(false);
  const lastY = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // SSR/jsdom guard — components using this render in tests without a
    // real scrolling document.
    if (typeof window === 'undefined') return;
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) >= THRESHOLD_PX) {
        // Near the very top there is nothing to read past yet, and hiding
        // the control on a short page would make it feel broken.
        setScrollingDown(delta > 0 && y > 64);
        lastY.current = y;
      }
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => setScrollingDown(false), SETTLE_MS);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  return { scrollingDown };
}
