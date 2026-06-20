/**
 * Tests for src/scoring/rubric-grader.ts — the descriptive-grade engine.
 * Pure logic via stubbed LLMJudge + CASChecker.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  makeRubricGrader,
  extractFinalAnswer,
  TEACHER_QUEUE_CONFIDENCE_THRESHOLD,
} from '../rubric-grader';
import type { LLMJudge, CASChecker } from '../rubric-grader';
import type { ItemContext, GradeResult } from '../../core/interfaces';

const ITEM: ItemContext = {
  rubric: [
    { id: 'given', description: 'States the given correctly', maxMarks: 1 },
    { id: 'method', description: 'Correct method', maxMarks: 3 },
    { id: 'final', description: 'Final answer present', maxMarks: 2 },
  ],
  expectedAnswer: '1/2',
  officialSolution: 'Use the chain rule. Final answer 1/2.',
  maxMarks: 6,
};

function judgeWith(perCriterion: Record<string, number>, confidence = 0.9): LLMJudge {
  return {
    async gradeRubric() {
      return { perCriterion, feedback: 'Good attempt.', confidence };
    },
  };
}

function casWith(verdict: boolean): CASChecker {
  return {
    async isFinalAnswerCorrect() { return verdict; },
  };
}

describe('extractFinalAnswer', () => {
  it('pulls a \\boxed{} answer', () => {
    expect(extractFinalAnswer('we compute \\boxed{42}')).toBe('42');
  });

  it('pulls an Answer: line', () => {
    expect(extractFinalAnswer('working...\nAnswer: 1/2')).toBe('1/2');
  });

  it('falls back to the last line when symbolic', () => {
    expect(extractFinalAnswer('step 1\nstep 2\n=π/4')).toBe('=π/4');
  });

  it('returns null on prose with no obvious answer', () => {
    expect(extractFinalAnswer('I think the answer is somewhere around there')).toBe(null);
  });

  it('handles nested braces inside \\boxed{} (eng-review fix)', () => {
    expect(extractFinalAnswer('… \\boxed{\\frac{1}{2}}')).toBe('\\frac{1}{2}');
    expect(extractFinalAnswer('… \\boxed{f(x) = \\frac{1}{2}}')).toBe('f(x) = \\frac{1}{2}');
  });

  it('returns null on an unterminated \\boxed{', () => {
    expect(extractFinalAnswer('… \\boxed{\\frac{1}{2}')).toBe(null);
  });
});

describe('RubricGrader.grade', () => {
  it('sums per-criterion scores into earned', async () => {
    const grader = makeRubricGrader({
      judge: judgeWith({ given: 1, method: 2, final: 2 }),
      cas: casWith(true),
    });
    const r: GradeResult = await grader.grade('… \\boxed{1/2}', ITEM);
    expect(r.earned).toBe(5);
    expect(r.max).toBe(6);
    expect(r.perCriterion).toEqual({ given: 1, method: 2, final: 2 });
    expect(r.casFinalAnswerCorrect).toBe(true);
  });

  it('clamps over-rubric scores to the maximum', async () => {
    const grader = makeRubricGrader({
      judge: judgeWith({ given: 5, method: 99, final: -1 }),
      cas: casWith(true),
    });
    const r = await grader.grade('… \\boxed{1/2}', ITEM);
    expect(r.perCriterion).toEqual({ given: 1, method: 3, final: 0 });
    expect(r.earned).toBe(4);
  });

  it('NEVER trusts the LLM on the final answer — CAS verdict wins', async () => {
    // The LLM gives a perfect mark, but the CAS says the final answer is wrong.
    const grader = makeRubricGrader({
      judge: judgeWith({ given: 1, method: 3, final: 2 }),
      cas: casWith(false),
    });
    const r = await grader.grade('… \\boxed{99}', ITEM);
    // earned still reflects the LLM's method judgement — partial credit is the WHOLE POINT —
    // but casFinalAnswerCorrect is the source of truth on the number.
    expect(r.casFinalAnswerCorrect).toBe(false);
  });

  it('routes low-confidence grades to the teacher queue via callback', async () => {
    const onLowConfidence = vi.fn();
    const grader = makeRubricGrader({
      judge: judgeWith({ given: 1, method: 2, final: 1 }, 0.4),
      cas: casWith(true),
      onLowConfidence,
    });
    await grader.grade('… \\boxed{1/2}', ITEM, { studentId: 'student_a' });
    expect(onLowConfidence).toHaveBeenCalledTimes(1);
    expect(onLowConfidence.mock.calls[0][0]).toBe('student_a');
  });

  it('does NOT route high-confidence grades to the teacher queue', async () => {
    const onLowConfidence = vi.fn();
    const grader = makeRubricGrader({
      judge: judgeWith({ given: 1, method: 3, final: 2 }, 0.95),
      cas: casWith(true),
      onLowConfidence,
    });
    await grader.grade('… \\boxed{1/2}', ITEM);
    expect(onLowConfidence).not.toHaveBeenCalled();
  });

  it('throws on missing rubric — caller must use a different Scorer', async () => {
    const grader = makeRubricGrader({
      judge: judgeWith({}),
      cas: casWith(true),
    });
    await expect(grader.grade('x', { maxMarks: 1 })).rejects.toThrow(/requires item.rubric/);
  });

  it('threshold constant is documented', () => {
    expect(TEACHER_QUEUE_CONFIDENCE_THRESHOLD).toBeGreaterThan(0);
    expect(TEACHER_QUEUE_CONFIDENCE_THRESHOLD).toBeLessThan(1);
  });
});
