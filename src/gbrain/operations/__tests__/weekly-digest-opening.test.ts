/**
 * F7 regression — motivation_state default case in weekly digest opening.
 *
 * The switch in weeklyDigest had no default case, so unrecognized / null
 * motivation states left opening = '' and the digest started with blank text.
 *
 * The logic was extracted into `digestOpening()` (exported from moat-operations)
 * so it can be tested without a live DB. Invariant: every known state AND any
 * unrecognized state must produce a non-empty opening string.
 */

import { describe, it, expect } from 'vitest';
import { digestOpening } from '../moat-operations';

describe('digestOpening — motivation_state switch (F7 fix)', () => {
  const KNOWN_STATES = ['driven', 'steady', 'flagging', 'frustrated', 'anxious'] as const;

  for (const state of KNOWN_STATES) {
    it(`produces non-empty opening for known state '${state}'`, () => {
      expect(digestOpening(10, state, 5).length).toBeGreaterThan(0);
    });
  }

  it('produces non-empty opening for unknown/unrecognized motivation_state (default case)', () => {
    // Before the fix, the missing default left opening=''. Now it returns a fallback.
    expect(digestOpening(10, 'unknown_state', 3).length).toBeGreaterThan(0);
    expect(digestOpening(10, '', 3).length).toBeGreaterThan(0);
  });

  it('default case returns the expected fallback string', () => {
    expect(digestOpening(10, 'unrecognized', 7)).toBe(
      'Keep going — every problem you work through this week counts.'
    );
  });

  it('driven state includes the streak count', () => {
    expect(digestOpening(10, 'driven', 12)).toContain('12');
  });

  it('zero attempts returns welcome message regardless of motivation_state', () => {
    const msg = digestOpening(0, 'driven', 5);
    expect(msg).toContain('Welcome');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('low attempts (< 5) returns encouragement without switch', () => {
    const msg = digestOpening(3, 'frustrated', 0);
    expect(msg).toContain('3 problems');
    expect(msg.length).toBeGreaterThan(0);
  });
});
