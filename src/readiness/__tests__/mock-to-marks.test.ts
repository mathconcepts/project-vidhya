/**
 * Tests for src/readiness/mock-to-marks.ts — the Extraction report.
 */

import { describe, it, expect } from 'vitest';
import { summarizeMock, KNEW_IT_TAGS, DIDNT_KNOW_TAGS } from '../mock-to-marks';
import type { Attempt, ErrorTag } from '../../core/interfaces';

/**
 * Mirrors src/core/interfaces.ts's ErrorTag union (13 members, W3.4/E4).
 * Deliberately NOT imported — same "erased at runtime, hand-mirrored with
 * a drift tripwire" shape as scripts/check-intent-catalogue.ts's
 * ERROR_TAGS, so this file doesn't grow a THIRD silent copy of the union:
 * a mismatch here fails the drift test below instead.
 */
const ALL_ERROR_TAGS: readonly ErrorTag[] = [
  'sign', 'unit', 'misread', 'transcription', 'method', 'careless',
  'method_selection', 'representation', 'mode_msq', 'mode_nat_entry',
  'time_pressure', 'risk_decision', 'prerequisite',
];

const A = (over: Partial<Attempt> = {}): Attempt => ({
  studentId: 's', objectId: 'o', skillId: 'algebra',
  correct: true, latencyMs: 5_000, ts: Date.now(),
  ...over,
});

const partial = (earned: number, max: number) => ({
  earned, max, perCriterion: {},
});

describe('summarizeMock', () => {
  it('returns zeros on an empty attempt list', () => {
    const r = summarizeMock([]);
    expect(r.earned).toBe(0);
    expect(r.knewIt).toBe(0);
    expect(r.leftOnTable).toBe(0);
    expect(r.topDrillRecommendation).toBeNull();
  });

  it('credits a clean run with no leftOnTable', () => {
    const r = summarizeMock([
      A({ correct: true, partialMarks: partial(4, 4) }),
      A({ correct: true, partialMarks: partial(2, 2) }),
    ]);
    expect(r.earned).toBe(6);
    expect(r.leftOnTable).toBe(0);
    expect(r.headline).toMatch(/Clean run/);
  });

  it('a "sign" slip with full method credit is left-on-table marks', () => {
    const r = summarizeMock([
      A({ correct: false, partialMarks: partial(3, 4), errorTags: ['sign'] }),
    ]);
    expect(r.earned).toBe(3);
    expect(r.knewIt).toBe(4);
    expect(r.leftOnTable).toBe(1);
    expect(r.lossByErrorType.sign).toBe(1);
    expect(r.topDrillRecommendation).toBe('sign');
  });

  it('a "method" tag means they did NOT know it — no left-on-table credit', () => {
    const r = summarizeMock([
      A({ correct: false, partialMarks: partial(0, 4), errorTags: ['method'] }),
    ]);
    expect(r.knewIt).toBe(0);
    expect(r.leftOnTable).toBe(0);
  });

  it('splits multi-tag loss evenly across careless tags', () => {
    const r = summarizeMock([
      A({ correct: false, partialMarks: partial(0, 4), errorTags: ['sign', 'unit'] }),
    ]);
    expect(r.lossByErrorType.sign).toBe(2);
    expect(r.lossByErrorType.unit).toBe(2);
  });

  it('top drill recommendation is the largest reclaimable error type', () => {
    const r = summarizeMock([
      A({ correct: false, partialMarks: partial(2, 4), errorTags: ['sign'] }),
      A({ correct: false, partialMarks: partial(1, 4), errorTags: ['sign'] }),
      A({ correct: false, partialMarks: partial(0, 2), errorTags: ['unit'] }),
    ]);
    // sign loss = 2+3 = 5; unit loss = 2
    expect(r.topDrillRecommendation).toBe('sign');
    expect(r.lossByErrorType.sign).toBe(5);
    expect(r.lossByErrorType.unit).toBe(2);
  });

  it('rolls up per-skill correctly', () => {
    const r = summarizeMock([
      A({ skillId: 'algebra', correct: true, partialMarks: partial(4, 4) }),
      A({ skillId: 'calc', correct: false, partialMarks: partial(1, 4), errorTags: ['sign'] }),
    ]);
    const algebra = r.byNode.find(n => n.skillId === 'algebra')!;
    const calc = r.byNode.find(n => n.skillId === 'calc')!;
    expect(algebra.earned).toBe(4);
    expect(algebra.knewIt).toBe(4);
    expect(calc.earned).toBe(1);
    expect(calc.knewIt).toBe(4);    // they slipped, but knew it
  });

  it('headline names the dominant error', () => {
    const r = summarizeMock([
      A({ correct: false, partialMarks: partial(2, 4), errorTags: ['unit'] }),
    ]);
    expect(r.headline).toMatch(/unit/);
    expect(r.headline).toMatch(/2 on the table/i);
  });

  // W3.4/D9 — the 7 new ErrorTag members, exercised individually so a
  // future reclassification of any one of them is caught here, not just
  // by the completeness test below (which only checks that SOME
  // classification exists, not which one).
  it('classifies the 4 new knew-it tags as left-on-table (exam-craft, not knowledge gaps)', () => {
    for (const tag of ['time_pressure', 'mode_nat_entry', 'mode_msq', 'risk_decision'] as const) {
      const r = summarizeMock([
        A({ correct: false, partialMarks: partial(0, 4), errorTags: [tag] }),
      ]);
      expect(r.knewIt, `${tag} should be knew-it`).toBe(4);
      expect(r.leftOnTable, `${tag} should be left-on-table`).toBe(4);
    }
  });

  it('classifies the 3 new didn\'t-know tags as no left-on-table credit (genuine gaps)', () => {
    for (const tag of ['method_selection', 'prerequisite', 'representation'] as const) {
      const r = summarizeMock([
        A({ correct: false, partialMarks: partial(0, 4), errorTags: [tag] }),
      ]);
      expect(r.knewIt, `${tag} should NOT be knew-it`).toBe(0);
      expect(r.leftOnTable, `${tag} should have no left-on-table credit`).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// W3.4/E4 — ErrorTag union-completeness: KNEW_IT_TAGS ∪ DIDNT_KNOW_TAGS must
// equal the full ErrorTag union with no overlap and no gap. A future tag
// added to interfaces.ts but forgotten here fails THIS test rather than
// silently defaulting to "didn't know" (or worse, "knew it") in the
// aggregator above.
// ---------------------------------------------------------------------------
describe('mock-to-marks — ErrorTag union completeness', () => {
  it('KNEW_IT_TAGS and DIDNT_KNOW_TAGS partition the full ErrorTag union exactly', () => {
    const knew = new Set(KNEW_IT_TAGS);
    const didnt = new Set(DIDNT_KNOW_TAGS);

    const overlap = [...knew].filter((t) => didnt.has(t));
    expect(overlap, 'a tag cannot be both knew-it and didn\'t-know').toEqual([]);

    const union = new Set([...knew, ...didnt]);
    const unclassified = ALL_ERROR_TAGS.filter((t) => !union.has(t));
    expect(
      unclassified,
      'every ErrorTag member must be explicitly classified in KNEW_IT_TAGS or DIDNT_KNOW_TAGS',
    ).toEqual([]);

    const extraneous = [...union].filter((t) => !ALL_ERROR_TAGS.includes(t));
    expect(extraneous, 'a classified tag that is not a real ErrorTag member — stale entry?').toEqual([]);
  });
});
