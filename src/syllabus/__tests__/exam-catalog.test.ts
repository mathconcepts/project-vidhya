/**
 * Tests for the exam-catalog marking/date extension (U1-13).
 *
 * Locks GATE's marking_table row as FACT (not hypothesis) and verifies
 * `gateMcqNegativeMarksFallback()` — the refactored replacement for the
 * `-0.33` literal previously duplicated in src/api/gate-routes.ts and
 * src/db/seed-static-pyqs.ts — stays consistent with
 * src/scoring/deterministic-scorer.ts's own GATE-standard defaults, so a
 * future edit to one can't silently drift from the other.
 */

import { describe, it, expect } from 'vitest';
import {
  EXAMS,
  getExam,
  getMarkingTable,
  gateMcqNegativeMarksFallback,
  examIdsForTopic,
} from '../exam-catalog';
import {
  DEFAULT_MCQ_NEGATIVE_1_MARK,
  DEFAULT_MCQ_NEGATIVE_2_MARK,
} from '../../scoring/deterministic-scorer';

describe('exam-catalog — GATE marking_table (U1-13)', () => {
  it('GATE has a marking_table with real MCQ/MSQ/NAT values', () => {
    const table = getMarkingTable('gate-ma');
    expect(table).not.toBeNull();
    expect(table!.mcq![1]).toEqual({ marks_correct: 1, marks_wrong: -1 / 3 });
    expect(table!.mcq![2]).toEqual({ marks_correct: 2, marks_wrong: -2 / 3 });
    expect(table!.msq).toEqual({ marks_correct: 1, marks_wrong: 0, partial_credit: false });
    expect(table!.nat).toEqual({ marks_correct: 1, marks_wrong: 0 });
  });

  it('GATE declares its question types as mcq/msq/nat', () => {
    expect(EXAMS['gate-ma'].question_types).toEqual(['mcq', 'msq', 'nat']);
  });

  it('getMarkingTable returns null for an exam that has not had its marking scheme transcribed', () => {
    expect(getMarkingTable('university-viva')).toBeNull();
    expect(getMarkingTable('not-a-real-exam-id')).toBeNull();
  });

  it("GATE's catalog row stays consistent with deterministic-scorer's own GATE-standard defaults", () => {
    // These two numbers used to live independently in gate-routes.ts (`-0.33`)
    // and deterministic-scorer.ts (`1/3`, `2/3`). Locking the equality here
    // means a future edit to either can't silently drift from the other.
    // deterministic-scorer.ts stores these as positive magnitudes and
    // negates at the call site; the catalog stores marks_wrong already
    // negative — compare magnitudes.
    expect(-gateMcqNegativeMarksFallback(1)).toBe(DEFAULT_MCQ_NEGATIVE_1_MARK);
    expect(-gateMcqNegativeMarksFallback(2)).toBe(DEFAULT_MCQ_NEGATIVE_2_MARK);
  });

  it('falls back to marks/3 for an MCQ mark value GATE does not define', () => {
    expect(gateMcqNegativeMarksFallback(3)).toBeCloseTo(-1, 10);
  });
});

describe('exam-catalog — examIdsForTopic (U1-12 reachability helper)', () => {
  it('resolves a shared topic (calculus) to every exam that lists it', () => {
    const exams = examIdsForTopic('calculus');
    expect(exams).toContain('gate-ma');
    expect(exams).toContain('jee-advanced-math');
    expect(exams.length).toBeGreaterThan(1);
  });

  it('returns [] for an unclaimed topic id', () => {
    expect(examIdsForTopic('not-a-real-topic')).toEqual([]);
  });
});

describe('exam-catalog — GATE exam date (U1-13)', () => {
  it('exam_date is a real, editable ISO date, not baked into engine code', () => {
    const exam = getExam('gate-ma')!;
    expect(exam.exam_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(exam.exam_dates).toContain(exam.exam_date);
    expect(exam.exam_dates!.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d))).toBe(true);
  });
});
