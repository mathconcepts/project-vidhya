/**
 * Provenance-refactor regression test for src/gbrain/exam-strategy.ts.
 *
 * U1-13: the GATE exam config's `marks_per_wrong` used to be a bare inline
 * literal (`-0.67`). It now reads `GATE_EM_MCQ_2MARK_NEGATIVE_ROUNDED` from
 * src/exams/exam-profile.ts. This is a provenance refactor, not a behavior
 * change — this test locks the runtime value at exactly -0.67, the same
 * value skip-threshold and expected-score math already depended on.
 */

import { describe, it, expect } from 'vitest';
import { EXAM_CONFIGS } from '../exam-strategy';
import { GATE_EM_MCQ_2MARK_NEGATIVE_ROUNDED } from '../../exams/exam-profile';

describe('exam-strategy GATE config — exam-profile wiring', () => {
  it('marks_per_wrong is byte-identical to the pre-refactor -0.67 literal', () => {
    expect(EXAM_CONFIGS['gate'].marks_per_wrong).toBe(-0.67);
  });

  it('marks_per_wrong is sourced from GATE_EM_MCQ_2MARK_NEGATIVE_ROUNDED, not re-hardcoded', () => {
    expect(EXAM_CONFIGS['gate'].marks_per_wrong).toBe(GATE_EM_MCQ_2MARK_NEGATIVE_ROUNDED);
  });

  it('marks_per_correct is unchanged at 2 (weighted average, untouched by this refactor)', () => {
    expect(EXAM_CONFIGS['gate'].marks_per_correct).toBe(2);
  });
});
