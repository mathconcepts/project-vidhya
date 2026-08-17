/**
 * Tests for src/teaching/motivation-source.ts — the canonical
 * MotivationState vocabulary and its two derived classification lanes.
 *
 * T5: the vocabulary used to be hand-typed in ~8 places with four
 * different (drifted) memberships. These tests pin the canonical export
 * shapes so every downstream import site can trust them.
 */

import { describe, it, expect } from 'vitest';
import {
  MOTIVATION_STATES,
  STRUGGLING_STATES,
  THRIVING_STATES,
  type MotivationState,
} from '../motivation-source';

describe('MOTIVATION_STATES', () => {
  it('contains exactly the 5 canonical states', () => {
    expect([...MOTIVATION_STATES].sort()).toEqual(
      ['anxious', 'driven', 'flagging', 'frustrated', 'steady'].sort(),
    );
  });

  it('is frozen (cannot be mutated at runtime)', () => {
    expect(Object.isFrozen(MOTIVATION_STATES)).toBe(true);
  });
});

describe('STRUGGLING_STATES', () => {
  it('is exactly {anxious, frustrated, flagging}', () => {
    expect([...STRUGGLING_STATES].sort()).toEqual(
      ['anxious', 'flagging', 'frustrated'].sort(),
    );
  });

  it('is frozen', () => {
    expect(Object.isFrozen(STRUGGLING_STATES)).toBe(true);
  });
});

describe('THRIVING_STATES', () => {
  it('is exactly {driven}', () => {
    expect([...THRIVING_STATES]).toEqual(['driven']);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(THRIVING_STATES)).toBe(true);
  });
});

describe('lane partition', () => {
  it('STRUGGLING_STATES and THRIVING_STATES never overlap', () => {
    const overlap = STRUGGLING_STATES.filter((s) =>
      (THRIVING_STATES as readonly MotivationState[]).includes(s),
    );
    expect(overlap).toEqual([]);
  });

  it('every MOTIVATION_STATES member is classified into struggling, thriving, or neither (neutral)', () => {
    // 'steady' is the one neutral state — present in the vocabulary but in
    // neither lane. Everything else must land in exactly one lane.
    for (const state of MOTIVATION_STATES) {
      const inStruggling = (STRUGGLING_STATES as readonly MotivationState[]).includes(state);
      const inThriving = (THRIVING_STATES as readonly MotivationState[]).includes(state);
      expect(inStruggling && inThriving).toBe(false);
      if (state !== 'steady') {
        expect(inStruggling || inThriving).toBe(true);
      }
    }
  });
});
