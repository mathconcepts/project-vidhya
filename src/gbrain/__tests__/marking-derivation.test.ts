/**
 * Tests for src/gbrain/marking-derivation.ts — the Wave 10 authoring
 * gate between generated content and the 032/033 marking columns.
 */

import { describe, it, expect } from 'vitest';
import {
  deriveMarking,
  parseNumericAnswer,
  marksForDifficulty,
  shuffle,
  NAT_ABS_TOL,
} from '../marking-derivation';

describe('parseNumericAnswer — strict', () => {
  it('accepts plain numbers, fractions, exponents, $-wrapped', () => {
    expect(parseNumericAnswer('42')).toBe(42);
    expect(parseNumericAnswer('-3.5')).toBe(-3.5);
    expect(parseNumericAnswer('.25')).toBe(0.25);
    expect(parseNumericAnswer('1e-3')).toBe(0.001);
    expect(parseNumericAnswer('3/4')).toBe(0.75);
    expect(parseNumericAnswer('$2.5$')).toBe(2.5);
  });

  it('rejects symbolic, unitful, and junk answers', () => {
    for (const bad of ['\\pi/4', 'sqrt(2)', '2 m/s', 'x = 3', '', '3/0', '2,5', '1/2/3']) {
      expect(parseNumericAnswer(bad)).toBeNull();
    }
  });
});

describe('marksForDifficulty', () => {
  it('authors hard items as 2-mark, the rest 1-mark', () => {
    expect(marksForDifficulty(0.3)).toBe(1);
    expect(marksForDifficulty(0.65)).toBe(1);
    expect(marksForDifficulty(0.66)).toBe(2);
    expect(marksForDifficulty(0.9)).toBe(2);
  });
});

describe('deriveMarking — mcq', () => {
  const rng = () => 0.999999;   // deterministic shuffle (identity for Fisher–Yates with j=i)

  it('builds canonical options with answer_index pointing at the correct answer', () => {
    const m = deriveMarking({
      format: 'mcq', correctAnswer: '4', distractors: ['2', '8', '16'], difficulty: 0.7, rng,
    })!;
    expect(m.question_type).toBe('mcq');
    expect(m.marks).toBe(2);
    expect(m.options).toHaveLength(4);
    expect(m.options![m.answer_index!]).toBe('4');
    expect(new Set(m.options)).toEqual(new Set(['4', '2', '8', '16']));
  });

  it('dedups distractors and drops ones equal to the correct answer', () => {
    const m = deriveMarking({
      format: 'mcq', correctAnswer: '4', distractors: ['4', '2', '2', '8'], difficulty: 0.3, rng,
    })!;
    expect(m.options).toHaveLength(3);
    expect(m.options![m.answer_index!]).toBe('4');
  });

  it('refuses with <2 usable distractors or a missing correct answer', () => {
    expect(deriveMarking({ format: 'mcq', correctAnswer: '4', distractors: ['4', '4'], difficulty: 0.5 })).toBeNull();
    expect(deriveMarking({ format: 'mcq', correctAnswer: '4', distractors: ['2'], difficulty: 0.5 })).toBeNull();
    expect(deriveMarking({ format: 'mcq', correctAnswer: '  ', distractors: ['1', '2', '3'], difficulty: 0.5 })).toBeNull();
  });
});

describe('deriveMarking — nat', () => {
  it('authors an inclusive range around a numeric answer', () => {
    const m = deriveMarking({ format: 'numerical', correctAnswer: '0.75', distractors: [], difficulty: 0.4 })!;
    expect(m.question_type).toBe('nat');
    expect(m.marks).toBe(1);
    const [lo, hi] = m.answer_range!;
    expect(lo).toBeCloseTo(0.75 - NAT_ABS_TOL, 9);
    expect(hi).toBeCloseTo(0.75 + NAT_ABS_TOL, 9);
  });

  it('uses relative tolerance for large values', () => {
    const m = deriveMarking({ format: 'numerical', correctAnswer: '1000', distractors: [], difficulty: 0.4 })!;
    const [lo, hi] = m.answer_range!;
    expect(hi - lo).toBeCloseTo(2 * 0.005 * 1000, 6);
  });

  it('refuses symbolic answers — display-only practice, never a guessed key', () => {
    expect(deriveMarking({ format: 'numerical', correctAnswer: '\\pi/4', distractors: [], difficulty: 0.4 })).toBeNull();
  });
});

describe('deriveMarking — open / unknown formats', () => {
  it('returns null', () => {
    expect(deriveMarking({ format: 'open', correctAnswer: '42', distractors: [], difficulty: 0.5 })).toBeNull();
    expect(deriveMarking({ format: 'essay', correctAnswer: '42', distractors: [], difficulty: 0.5 })).toBeNull();
  });
});

describe('shuffle', () => {
  it('is a permutation and respects the injected rng', () => {
    const out = shuffle([1, 2, 3, 4, 5], () => 0);
    expect(new Set(out)).toEqual(new Set([1, 2, 3, 4, 5]));
    // rng()=0 swaps a[i] with a[0] each step — deterministic
    expect(shuffle([1, 2, 3], () => 0)).toEqual(shuffle([1, 2, 3], () => 0));
  });
});
