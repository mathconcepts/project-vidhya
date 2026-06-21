/**
 * Tests for src/readiness/mock-to-marks.ts — the Extraction report.
 */

import { describe, it, expect } from 'vitest';
import { summarizeMock } from '../mock-to-marks';
import type { Attempt, ErrorTag } from '../../core/interfaces';

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
});
