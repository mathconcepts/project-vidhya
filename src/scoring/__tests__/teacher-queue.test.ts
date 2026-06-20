/**
 * Tests for src/scoring/teacher-queue.ts — pure aggregators.
 */

import { describe, it, expect } from 'vitest';
import { summarizeQueue, formatCalibrationSample } from '../teacher-queue';
import type { GradingReview } from '../teacher-queue';
import type { GradeResult, ItemContext } from '../../core/interfaces';

const grade = (earned: number, max = 6): GradeResult => ({
  earned,
  max,
  perCriterion: {},
  feedback: '',
  confidence: 0.5,
  casFinalAnswerCorrect: true,
});

const review = (over: Partial<GradingReview>): GradingReview => ({
  id: 'r1',
  studentId: null,
  itemId: 'item_1',
  studentResponse: '',
  proposedGrade: grade(3),
  status: 'pending',
  createdAt: '2026-06-01T00:00:00Z',
  ...over,
});

describe('summarizeQueue', () => {
  it('counts pending reviews', () => {
    const h = summarizeQueue([
      review({ status: 'pending' }),
      review({ id: 'r2', status: 'pending' }),
      review({ id: 'r3', status: 'confirmed' }),
    ]);
    expect(h.pendingCount).toBe(2);
  });

  it('measures oldest pending hours', () => {
    const now = new Date('2026-06-02T00:00:00Z');     // 24h after createdAt
    const h = summarizeQueue([review({ status: 'pending' })], now);
    expect(h.oldestPendingHours).toBeCloseTo(24, 1);
  });

  it('computes agreement rate from confirmed vs corrected', () => {
    const h = summarizeQueue([
      review({ id: 'a', status: 'confirmed' }),
      review({ id: 'b', status: 'confirmed' }),
      review({ id: 'c', status: 'corrected', finalGrade: grade(4) }),
    ]);
    expect(h.agreementRate).toBeCloseTo(2 / 3, 3);
  });

  it('returns zeros on an empty queue', () => {
    expect(summarizeQueue([])).toEqual({
      pendingCount: 0,
      oldestPendingHours: 0,
      agreementRate: 0,
      meanAdjustmentMarks: 0,
    });
  });

  it('mean adjustment marks tracks how much reviewers had to correct', () => {
    const h = summarizeQueue([
      review({ id: 'x', status: 'corrected', proposedGrade: grade(3), finalGrade: grade(5) }),
      review({ id: 'y', status: 'corrected', proposedGrade: grade(4), finalGrade: grade(4) }),
    ]);
    expect(h.meanAdjustmentMarks).toBeCloseTo(1, 3);
  });
});

describe('formatCalibrationSample', () => {
  const item: ItemContext = { maxMarks: 6, rubric: [{ id: 'a', description: '', maxMarks: 6 }] };

  it('includes earned, perCriterion, and reviewer notes', () => {
    const r = review({
      status: 'corrected',
      proposedGrade: grade(3),
      finalGrade: { ...grade(5), perCriterion: { a: 5 } },
      reviewerNotes: 'Method was actually fine; partial credit underscored.',
    });
    const text = formatCalibrationSample(r, item);
    expect(text).toContain('earned: 5');
    expect(text).toContain('"a":5');
    expect(text).toContain('Reviewer notes');
  });
});
