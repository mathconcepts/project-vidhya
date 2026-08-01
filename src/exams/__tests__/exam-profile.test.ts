/**
 * Tests for src/exams/exam-profile.ts — the exam-profile-schema v1 row.
 *
 * Verifies GATE_EM_PROFILE matches docs/exam-profile-schema.md's fact
 * column exactly, and that the derived rounded constant consumed by
 * src/gbrain/exam-strategy.ts stays byte-identical to the value it
 * replaced (-0.67).
 */

import { describe, it, expect } from 'vitest';
import {
  GATE_EM_PROFILE,
  GATE_EM_MARKING_TABLE,
  GATE_EM_MCQ_2MARK_NEGATIVE_ROUNDED,
} from '../exam-profile';

describe('GATE_EM_PROFILE', () => {
  it('is marked fact, not hypothesis', () => {
    expect(GATE_EM_PROFILE.confidence).toBe('fact');
  });

  it('has the exact GATE marking_table fact from exam-profile-schema.md', () => {
    // "MCQ +1/−⅓ or +2/−⅔ · MSQ no negative, no partial unless verified · NAT no negative"
    expect(GATE_EM_PROFILE.marking_table.mcq.one_mark).toEqual({
      marks_correct: 1,
      marks_wrong: -(1 / 3),
    });
    expect(GATE_EM_PROFILE.marking_table.mcq.two_mark).toEqual({
      marks_correct: 2,
      marks_wrong: -(2 / 3),
    });
    expect(GATE_EM_PROFILE.marking_table.msq.marks_wrong).toBe(0);
    expect(GATE_EM_PROFILE.marking_table.msq.partial_credit).toBe('no_partial_unless_verified');
    expect(GATE_EM_PROFILE.marking_table.nat.marks_wrong).toBe(0);
  });

  it('has the documented question types: mcq, msq, nat', () => {
    expect(GATE_EM_PROFILE.question_types).toEqual(['mcq', 'msq', 'nat']);
  });

  it('fixes the single-annual-date cadence fact, without inventing a literal exam date', () => {
    expect(GATE_EM_PROFILE.attempt_calendar.cadence).toBe('single annual date');
    expect(GATE_EM_PROFILE.exam_date.mode).toBe('student_declared');
    expect(GATE_EM_PROFILE.exam_date.fixed_dates).toBeUndefined();
  });

  it('matches the rest of the schema doc\'s GATE-EM fact column', () => {
    expect(GATE_EM_PROFILE.score_currency).toBe('raw_marks');
    expect(GATE_EM_PROFILE.schedule_authority).toBe('self-directed');
    expect(GATE_EM_PROFILE.account_holder.holder).toBe('adult self');
    expect(GATE_EM_PROFILE.account_holder.consent_required).toBe(false);
    expect(GATE_EM_PROFILE.mock_format.label).toBe('GATE CBT mirror');
    expect(GATE_EM_PROFILE.mock_format.duration_minutes).toBe(180);
    expect(GATE_EM_PROFILE.tone_register).toBe('adult, career-stakes');
    expect(GATE_EM_PROFILE.parent_role_weight).toBe('low');
    expect(GATE_EM_PROFILE.syllabus_pack).toBe('gate-em.yml');
  });

  it('derives the rounded 2-mark MCQ negative-marking constant as -0.67', () => {
    // Exact fact is -2/3; exam-strategy.ts consumes the 2dp-rounded form,
    // matching the literal it used to hardcode inline.
    expect(GATE_EM_MARKING_TABLE.mcq.two_mark.marks_wrong).toBeCloseTo(-2 / 3, 9);
    expect(GATE_EM_MCQ_2MARK_NEGATIVE_ROUNDED).toBe(-0.67);
  });
});
