/**
 * Multi-exam marking: the compiled registry + the pack -> contract-key map.
 *
 * The bug these lock down is silent by construction. Before v4.86.0 every
 * caller resolved GATE's contract, so a JEE Main MCQ (4 marks) found no row
 * in `marks_wrong_by_marks` and fell through to `-(4 / 3)`. Nothing threw,
 * nothing logged, and the student simply lost 1.33 marks where the real
 * paper deducts 1. Assertions on the ARITHMETIC are the only thing that
 * catches a regression of that shape.
 */

import { describe, it, expect } from 'vitest';
import {
  contractKeyForExam,
  contractKeyForConcept,
  mappedContractPackIds,
} from '../exam-contract-key';
import {
  findCompiledContract,
  COMPILED_CONTRACT_KEY,
  JEE_MAIN_CONTRACT_KEY,
  COMPILED_CONTRACTS,
} from '../marking-constants';
import { resolveAssessmentContract } from '../assessment-contract-loader';
import { makeContractGrader } from '../../scoring/contract-grading';

const mcq = (marks: number) =>
  ({ id: 'probe', kind: 'mcq', marks, answerIndex: 0, options: ['a', 'b', 'c', 'd'] }) as never;

async function graderFor(examOrConcept: 'gate-ma' | 'jee-main') {
  const c = await resolveAssessmentContract(contractKeyForExam(examOrConcept));
  return { grader: makeContractGrader({ version: c.version, marking: c.marking }), contract: c };
}

describe('pack -> contract key', () => {
  it('maps both shipped packs, and the map is not a string transform', () => {
    expect(mappedContractPackIds().sort()).toEqual(['gate-ma', 'jee-main']);
    // 'gate-ma' -> exam 'gate', paper 'common-em'. No convention over the
    // pack id would have produced that, which is why the table is explicit.
    expect(contractKeyForExam('gate-ma')).toEqual({ ...COMPILED_CONTRACT_KEY });
    expect(contractKeyForExam('jee-main')).toEqual({ ...JEE_MAIN_CONTRACT_KEY });
  });

  it('gives an unmapped pack a key NOTHING covers, so it refuses rather than borrowing', () => {
    const key = contractKeyForExam('some-exam-nobody-registered');
    expect(findCompiledContract(key)).toBeNull();
    // Critically it must NOT quietly resolve to GATE's key.
    expect(key).not.toEqual({ ...COMPILED_CONTRACT_KEY });
  });

  it('keys a practice item on the exam that OWNS the concept, not the caller', () => {
    expect(contractKeyForConcept('eigenvalues')).toEqual({ ...COMPILED_CONTRACT_KEY });
    expect(contractKeyForConcept('quadratic-equations')).toEqual({ ...JEE_MAIN_CONTRACT_KEY });
    expect(contractKeyForConcept('three-d-geometry')).toEqual({ ...JEE_MAIN_CONTRACT_KEY });
  });
});

describe('compiled contract registry', () => {
  it('carries both exams and finds each by exact (exam, paper, year)', () => {
    expect(COMPILED_CONTRACTS.length).toBeGreaterThanOrEqual(2);
    expect(findCompiledContract(COMPILED_CONTRACT_KEY)?.exam).toBe('gate');
    expect(findCompiledContract(JEE_MAIN_CONTRACT_KEY)?.exam).toBe('jee-main');
    // A marking scheme is notified per paper per year: a near-miss is a miss.
    expect(findCompiledContract({ ...JEE_MAIN_CONTRACT_KEY, year: 1999 })).toBeNull();
  });

  it("JEE's entry omits msq and nat ON PURPOSE — absence is the enforcement", () => {
    const jee = findCompiledContract(JEE_MAIN_CONTRACT_KEY)!;
    expect(Object.keys(jee.marking)).toEqual(['mcq']);
    // If this ever grows a `nat` entry, someone resolved the disputed NVQ
    // negative-marking rule — that needs a source, not a default.
    expect(jee.marking.nat).toBeUndefined();
    expect(jee.marking.msq).toBeUndefined();
  });

  it('GATE still carries all three kinds', () => {
    const gate = findCompiledContract(COMPILED_CONTRACT_KEY)!;
    expect(Object.keys(gate.marking).sort()).toEqual(['mcq', 'msq', 'nat']);
  });
});

describe('marking arithmetic per exam', () => {
  it('marks a JEE Main MCQ +4 correct / -1 wrong', async () => {
    const { grader } = await graderFor('jee-main');
    expect((await grader(mcq(4), { kind: 'mcq', selectedIndex: 0 } as never)).earned).toBe(4);
    expect((await grader(mcq(4), { kind: 'mcq', selectedIndex: 2 } as never)).earned).toBe(-1);
  });

  it('is the bug: the SAME item under GATE deducts 1.33, not 1', async () => {
    const { grader } = await graderFor('gate-ma');
    const wrong = (await grader(mcq(4), { kind: 'mcq', selectedIndex: 2 } as never)).earned;
    expect(wrong).toBeCloseTo(-4 / 3, 10);
    expect(wrong).not.toBe(-1);
  });

  it('leaves GATE 1- and 2-mark MCQs exactly as they were', async () => {
    const { grader } = await graderFor('gate-ma');
    expect((await grader(mcq(1), { kind: 'mcq', selectedIndex: 1 } as never)).earned).toBeCloseTo(-1 / 3, 10);
    expect((await grader(mcq(2), { kind: 'mcq', selectedIndex: 1 } as never)).earned).toBeCloseTo(-2 / 3, 10);
  });

  it('REFUSES a JEE numeric item by name instead of inventing a rule', async () => {
    const { grader } = await graderFor('jee-main');
    await expect(
      grader({ id: 'n', kind: 'nat', marks: 4, answerRange: [1, 1] } as never, { kind: 'nat', value: 1 } as never),
    ).rejects.toThrow(/no marking for question kind 'nat'.*defines: mcq/);
  });

  it('an unmapped pack resolves to an EMPTY contract, never another exam’s numbers', async () => {
    const c = await resolveAssessmentContract(contractKeyForExam('not-a-real-pack'));
    expect(Object.keys(c.marking)).toEqual([]);
  });
});
