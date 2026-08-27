/**
 * Tests for src/scoring/deterministic-scorer.ts — GATE MCQ/MSQ/NAT marking.
 *
 * Full marking matrix: correct/wrong/skip × 1m/2m for MCQ, MSQ exact/
 * subset/superset/partial-refusal, NAT range/boundary/epsilon/out-of-range.
 */

import { describe, it, expect } from 'vitest';
import {
  GateDeterministicScorer,
  makeDeterministicScorer,
  mcqNegativeMarks,
  describeMarking,
  NAT_EPSILON,
  DEFAULT_MCQ_NEGATIVE_1_MARK,
  DEFAULT_MCQ_NEGATIVE_2_MARK,
  type GateItem,
  type GateResponse,
} from '../deterministic-scorer';
import { resolveMarkingStrategy } from '../marking-strategy';
import { COMPILED_ASSESSMENT_CONTRACT } from '../../exams/marking-constants';
import type { MarkingScheme } from '../../exams/types';

const scorer = new GateDeterministicScorer();

// ────────────────────────────────────────────────────────────────────
// MCQ
// ────────────────────────────────────────────────────────────────────

function mcqItem(marks: number): GateItem {
  return {
    id: 'q1',
    kind: 'mcq',
    marks,
    answerIndex: 1,
    options: ['A', 'B', 'C', 'D'],
  };
}

describe('DeterministicScorer — MCQ', () => {
  it('1-mark correct earns +1', async () => {
    const r = await scorer.grade(mcqItem(1), { kind: 'mcq', selectedIndex: 1 });
    expect(r.earned).toBe(1);
    expect(r.max).toBe(1);
    expect(r.casFinalAnswerCorrect).toBe(true);
  });

  it('1-mark wrong applies -1/3 default negative marking', async () => {
    const r = await scorer.grade(mcqItem(1), { kind: 'mcq', selectedIndex: 0 });
    expect(r.earned).toBeCloseTo(-1 / 3, 9);
    expect(r.casFinalAnswerCorrect).toBe(false);
  });

  it('1-mark skipped earns 0', async () => {
    const r = await scorer.grade(mcqItem(1), { kind: 'mcq', skipped: true });
    expect(r.earned).toBe(0);
    expect(r.casFinalAnswerCorrect).toBe(false);
  });

  it('2-mark correct earns +2', async () => {
    const r = await scorer.grade(mcqItem(2), { kind: 'mcq', selectedIndex: 1 });
    expect(r.earned).toBe(2);
  });

  it('2-mark wrong applies -2/3 default negative marking', async () => {
    const r = await scorer.grade(mcqItem(2), { kind: 'mcq', selectedIndex: 3 });
    expect(r.earned).toBeCloseTo(-2 / 3, 9);
  });

  it('2-mark skipped earns 0', async () => {
    const r = await scorer.grade(mcqItem(2), { kind: 'mcq', skipped: true });
    expect(r.earned).toBe(0);
  });

  it('honors an explicit MarkingScheme.negative_marks_per_wrong over the default', async () => {
    const scheme: MarkingScheme = { negative_marks_per_wrong: 0.5 };
    const r = await scorer.grade(mcqItem(1), { kind: 'mcq', selectedIndex: 0 }, scheme);
    expect(r.earned).toBeCloseTo(-0.5, 9);
  });

  it('throws when item kind and response kind mismatch', async () => {
    await expect(scorer.grade(mcqItem(1), { kind: 'nat', value: 1 } as GateResponse)).rejects.toThrow();
  });

  it('throws when mcq item has no answerIndex/options', async () => {
    const bad: GateItem = { id: 'q', kind: 'mcq', marks: 1 };
    await expect(scorer.grade(bad, { kind: 'mcq', selectedIndex: 0 })).rejects.toThrow();
  });

  it('throws when mcq response has no selectedIndex and is not skipped', async () => {
    await expect(scorer.grade(mcqItem(1), { kind: 'mcq' })).rejects.toThrow();
  });
});

describe('mcqNegativeMarks', () => {
  it('defaults to 1/3 for a 1-mark item', () => {
    expect(mcqNegativeMarks(1)).toBeCloseTo(DEFAULT_MCQ_NEGATIVE_1_MARK, 9);
  });
  it('defaults to 2/3 for a 2-mark item', () => {
    expect(mcqNegativeMarks(2)).toBeCloseTo(DEFAULT_MCQ_NEGATIVE_2_MARK, 9);
  });
  it('falls back to marks/3 for an unusual mark value', () => {
    expect(mcqNegativeMarks(3)).toBeCloseTo(1, 9);
  });
});

// ────────────────────────────────────────────────────────────────────
// MSQ
// ────────────────────────────────────────────────────────────────────

function msqItem(marks = 2): GateItem {
  return {
    id: 'q2',
    kind: 'msq',
    marks,
    answerIndices: [0, 2],
    options: ['A', 'B', 'C', 'D'],
  };
}

describe('DeterministicScorer — MSQ', () => {
  it('exact set match earns full marks', async () => {
    const r = await scorer.grade(msqItem(), { kind: 'msq', selectedIndices: [0, 2] });
    expect(r.earned).toBe(2);
    expect(r.casFinalAnswerCorrect).toBe(true);
  });

  it('exact set match is order-independent', async () => {
    const r = await scorer.grade(msqItem(), { kind: 'msq', selectedIndices: [2, 0] });
    expect(r.earned).toBe(2);
  });

  it('subset of correct answers earns 0, never negative', async () => {
    const r = await scorer.grade(msqItem(), { kind: 'msq', selectedIndices: [0] });
    expect(r.earned).toBe(0);
    expect(r.earned).toBeGreaterThanOrEqual(0);
  });

  it('superset (correct + extra wrong) earns 0, never negative', async () => {
    const r = await scorer.grade(msqItem(), { kind: 'msq', selectedIndices: [0, 1, 2] });
    expect(r.earned).toBe(0);
  });

  it('completely wrong selection earns 0, never negative', async () => {
    const r = await scorer.grade(msqItem(), { kind: 'msq', selectedIndices: [1, 3] });
    expect(r.earned).toBe(0);
  });

  it('skipped earns 0', async () => {
    const r = await scorer.grade(msqItem(), { kind: 'msq', skipped: true });
    expect(r.earned).toBe(0);
  });

  it('refuses to grade when MarkingScheme.partial_credit is true', async () => {
    const scheme: MarkingScheme = { partial_credit: true };
    await expect(
      scorer.grade(msqItem(), { kind: 'msq', selectedIndices: [0] }, scheme),
    ).rejects.toThrow(/partial_credit/);
  });

  it('grades full-or-nothing when partial_credit is false or absent', async () => {
    const r1 = await scorer.grade(msqItem(), { kind: 'msq', selectedIndices: [0, 2] }, { partial_credit: false });
    expect(r1.earned).toBe(2);
    const r2 = await scorer.grade(msqItem(), { kind: 'msq', selectedIndices: [0, 2] });
    expect(r2.earned).toBe(2);
  });

  it('throws when msq item has no answerIndices/options', async () => {
    const bad: GateItem = { id: 'q', kind: 'msq', marks: 2 };
    await expect(scorer.grade(bad, { kind: 'msq', selectedIndices: [0] })).rejects.toThrow();
  });
});

// ────────────────────────────────────────────────────────────────────
// NAT
// ────────────────────────────────────────────────────────────────────

function natItem(range: [number, number] = [1.995, 2.005], marks = 1): GateItem {
  return { id: 'q3', kind: 'nat', marks, answerRange: range };
}

describe('DeterministicScorer — NAT', () => {
  it('value inside range earns full marks', async () => {
    const r = await scorer.grade(natItem(), { kind: 'nat', value: 2.0 });
    expect(r.earned).toBe(1);
    expect(r.casFinalAnswerCorrect).toBe(true);
  });

  it('value on the lower boundary earns full marks', async () => {
    const r = await scorer.grade(natItem(), { kind: 'nat', value: 1.995 });
    expect(r.earned).toBe(1);
  });

  it('value on the upper boundary earns full marks', async () => {
    const r = await scorer.grade(natItem(), { kind: 'nat', value: 2.005 });
    expect(r.earned).toBe(1);
  });

  it('value just within epsilon of the lower boundary still earns full marks', async () => {
    const r = await scorer.grade(natItem(), { kind: 'nat', value: 1.995 - NAT_EPSILON / 2 });
    expect(r.earned).toBe(1);
  });

  it('value just within epsilon of the upper boundary still earns full marks', async () => {
    const r = await scorer.grade(natItem(), { kind: 'nat', value: 2.005 + NAT_EPSILON / 2 });
    expect(r.earned).toBe(1);
  });

  it('value outside range earns 0, never negative', async () => {
    const r = await scorer.grade(natItem(), { kind: 'nat', value: 3.0 });
    expect(r.earned).toBe(0);
    expect(r.casFinalAnswerCorrect).toBe(false);
  });

  it('value clearly outside epsilon of the boundary earns 0', async () => {
    const r = await scorer.grade(natItem(), { kind: 'nat', value: 2.006 });
    expect(r.earned).toBe(0);
  });

  it('skipped earns 0', async () => {
    const r = await scorer.grade(natItem(), { kind: 'nat', skipped: true });
    expect(r.earned).toBe(0);
  });

  it('throws when nat item has no answerRange', async () => {
    const bad: GateItem = { id: 'q', kind: 'nat', marks: 1 };
    await expect(scorer.grade(bad, { kind: 'nat', value: 1 })).rejects.toThrow();
  });

  it('throws when nat response has no value and is not skipped', async () => {
    await expect(scorer.grade(natItem(), { kind: 'nat' })).rejects.toThrow();
  });
});

// ────────────────────────────────────────────────────────────────────
// Factory + describeMarking
// ────────────────────────────────────────────────────────────────────

describe('makeDeterministicScorer', () => {
  it('returns a working DeterministicScorer', async () => {
    const s = makeDeterministicScorer();
    const r = await s.grade(mcqItem(1), { kind: 'mcq', selectedIndex: 1 });
    expect(r.earned).toBe(1);
  });
});

describe('describeMarking', () => {
  it('describes MCQ marking with the resolved negative', () => {
    expect(describeMarking({ kind: 'mcq', marks: 1 })).toEqual({ marks_correct: 1, marks_wrong: -1 / 3 });
    expect(describeMarking({ kind: 'mcq', marks: 2 })).toEqual({ marks_correct: 2, marks_wrong: -2 / 3 });
  });

  it('describes MSQ/NAT marking as never-negative', () => {
    expect(describeMarking({ kind: 'msq', marks: 2 })).toEqual({ marks_correct: 2, marks_wrong: 0 });
    expect(describeMarking({ kind: 'nat', marks: 1 })).toEqual({ marks_correct: 1, marks_wrong: 0 });
  });
});

// ────────────────────────────────────────────────────────────────────
// Golden parity: strategy + contract params ≡ direct scorer (plan D11)
//
// The marking matrix above is the golden set. Every case in it is replayed
// here through the SECOND path — `resolveMarkingStrategy('gate_2026')`
// grading under params read from the compiled contract — and asserted
// byte-identical (`toEqual` on the whole GradeResult, not just `earned`).
//
// This is what makes "the scorer becomes the registered gate_2026 strategy"
// a checkable statement rather than a claim in a doc: if the strategy layer
// ever starts doing its own arithmetic, or if the contract params drift
// from the compiled defaults the direct path uses, this block fails.
//
// The existing tests above are untouched and still assert the direct path
// on its own. This is additive.
// ────────────────────────────────────────────────────────────────────

const strategy = resolveMarkingStrategy('gate_2026');
const CONTRACT_MARKING = COMPILED_ASSESSMENT_CONTRACT.marking;

/** Contract params for a kind, exactly as the seed row carries them. */
function paramsFor(kind: 'mcq' | 'msq' | 'nat'): Record<string, unknown> {
  return CONTRACT_MARKING[kind].params as unknown as Record<string, unknown>;
}

/** Grade one case both ways and assert the results are indistinguishable. */
async function assertParity(
  item: GateItem,
  response: GateResponse,
  scheme?: MarkingScheme,
  params?: Record<string, unknown>,
) {
  const direct = await scorer.grade(item, response, scheme);
  const viaStrategy = await strategy!.grade(item, response, params ?? paramsFor(item.kind));
  expect(viaStrategy).toEqual(direct);
  return direct;
}

describe('marking-strategy parity — the golden matrix, graded both ways', () => {
  it('the gate_2026 strategy is registered', () => {
    expect(strategy).toBeDefined();
  });

  it('MCQ: 1-mark correct / wrong / skipped', async () => {
    expect((await assertParity(mcqItem(1), { kind: 'mcq', selectedIndex: 1 })).earned).toBe(1);
    expect((await assertParity(mcqItem(1), { kind: 'mcq', selectedIndex: 0 })).earned).toBeCloseTo(-1 / 3, 9);
    expect((await assertParity(mcqItem(1), { kind: 'mcq', skipped: true })).earned).toBe(0);
  });

  it('MCQ: 2-mark correct / wrong / skipped', async () => {
    expect((await assertParity(mcqItem(2), { kind: 'mcq', selectedIndex: 1 })).earned).toBe(2);
    expect((await assertParity(mcqItem(2), { kind: 'mcq', selectedIndex: 3 })).earned).toBeCloseTo(-2 / 3, 9);
    expect((await assertParity(mcqItem(2), { kind: 'mcq', skipped: true })).earned).toBe(0);
  });

  it('MCQ: an explicit scheme override and its params equivalent agree', async () => {
    // The direct path expresses "half a mark off" as a MarkingScheme; the
    // strategy path expresses the same rule as contract params. Both must
    // land on the same number.
    const r = await assertParity(
      mcqItem(1),
      { kind: 'mcq', selectedIndex: 0 },
      { negative_marks_per_wrong: 0.5 },
      { marks_wrong_by_marks: { '1': -0.5 }, marks_wrong_fallback_divisor: 3 },
    );
    expect(r.earned).toBeCloseTo(-0.5, 9);
  });

  it('MCQ: the defensive fallback for an unusual mark value', async () => {
    expect((await assertParity(mcqItem(3), { kind: 'mcq', selectedIndex: 0 })).earned).toBeCloseTo(-1, 9);
  });

  it('MSQ: exact / order-independent / subset / superset / wrong / skipped', async () => {
    expect((await assertParity(msqItem(), { kind: 'msq', selectedIndices: [0, 2] })).earned).toBe(2);
    expect((await assertParity(msqItem(), { kind: 'msq', selectedIndices: [2, 0] })).earned).toBe(2);
    expect((await assertParity(msqItem(), { kind: 'msq', selectedIndices: [0] })).earned).toBe(0);
    expect((await assertParity(msqItem(), { kind: 'msq', selectedIndices: [0, 1, 2] })).earned).toBe(0);
    expect((await assertParity(msqItem(), { kind: 'msq', selectedIndices: [1, 3] })).earned).toBe(0);
    expect((await assertParity(msqItem(), { kind: 'msq', skipped: true })).earned).toBe(0);
  });

  it('NAT: inside / both boundaries / both epsilon edges / outside / skipped', async () => {
    expect((await assertParity(natItem(), { kind: 'nat', value: 2.0 })).earned).toBe(1);
    expect((await assertParity(natItem(), { kind: 'nat', value: 1.995 })).earned).toBe(1);
    expect((await assertParity(natItem(), { kind: 'nat', value: 2.005 })).earned).toBe(1);
    expect((await assertParity(natItem(), { kind: 'nat', value: 1.995 - NAT_EPSILON / 2 })).earned).toBe(1);
    expect((await assertParity(natItem(), { kind: 'nat', value: 2.005 + NAT_EPSILON / 2 })).earned).toBe(1);
    expect((await assertParity(natItem(), { kind: 'nat', value: 3.0 })).earned).toBe(0);
    expect((await assertParity(natItem(), { kind: 'nat', value: 2.006 })).earned).toBe(0);
    expect((await assertParity(natItem(), { kind: 'nat', skipped: true })).earned).toBe(0);
  });

  it('both paths refuse the same malformed items and responses', async () => {
    const cases: Array<[GateItem, GateResponse]> = [
      [{ id: 'q', kind: 'mcq', marks: 1 }, { kind: 'mcq', selectedIndex: 0 }],
      [mcqItem(1), { kind: 'mcq' }],
      [{ id: 'q', kind: 'msq', marks: 2 }, { kind: 'msq', selectedIndices: [0] }],
      [{ id: 'q', kind: 'nat', marks: 1 }, { kind: 'nat', value: 1 }],
      [natItem(), { kind: 'nat' }],
    ];
    for (const [item, response] of cases) {
      await expect(scorer.grade(item, response)).rejects.toThrow();
      await expect(strategy!.grade(item, response, paramsFor(item.kind))).rejects.toThrow();
    }
  });

  it('both paths refuse a kind/response mismatch', async () => {
    const bad = { kind: 'nat', value: 1 } as GateResponse;
    await expect(scorer.grade(mcqItem(1), bad)).rejects.toThrow();
    await expect(strategy!.grade(mcqItem(1), bad, paramsFor('mcq'))).rejects.toThrow();
  });

  it('the contract params ARE the compiled defaults — not a lookalike copy', () => {
    // Parity above would still pass if both paths were wrong in the same
    // way. This asserts the params the strategy reads carry the numbers the
    // direct path defaults to.
    const mcq = CONTRACT_MARKING.mcq.params;
    expect(Math.abs(mcq.marks_wrong_by_marks['1'])).toBe(DEFAULT_MCQ_NEGATIVE_1_MARK);
    expect(Math.abs(mcq.marks_wrong_by_marks['2'])).toBe(DEFAULT_MCQ_NEGATIVE_2_MARK);
    expect(CONTRACT_MARKING.nat.params.tolerance_epsilon).toBe(NAT_EPSILON);
    expect(CONTRACT_MARKING.msq.params.marks_wrong).toBe(0);
    expect(CONTRACT_MARKING.nat.params.marks_wrong).toBe(0);
  });
});
