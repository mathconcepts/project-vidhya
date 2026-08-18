import { describe, it, expect } from 'vitest';
import { assemblePracticeItem, practiceItemId, verificationPathForFormat } from '../assemble';
import type { PracticeItemGenerationResponse, PracticeItemSpec } from '../types';

const mcqSpec: PracticeItemSpec = { concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.35, topic: 'linear-algebra' };
const mcqResponse: PracticeItemGenerationResponse = {
  question_text: 'Eigenvalues of A?',
  correct_answer: '5 and 2',
  distractors: ['4 and 3', '7 and 10'],
  solution_steps: ['trace=7, det=10', '(λ-5)(λ-2)=0'],
  difficulty: 0.4, // deliberately different from spec.difficulty — must be ignored
};

const msqSpec: PracticeItemSpec = { concept_id: 'eigenvalues', format: 'msq', difficulty: 0.5, topic: 'linear-algebra' };
const msqResponse: PracticeItemGenerationResponse = {
  question_text: 'Which are eigenvectors?',
  correct_answers: ['(1,1)', '(1,-1)'],
  distractors: ['(0,1)'],
  solution_steps: ['check Av=λv'],
  difficulty: 0.5,
};

const natSpec: PracticeItemSpec = { concept_id: 'determinants', format: 'nat', difficulty: 0.25, topic: 'linear-algebra' };
const natResponse: PracticeItemGenerationResponse = {
  question_text: 'det([[3,0],[0,2]])?',
  correct_answer: '6',
  distractors: [],
  solution_steps: ['3*2=6'],
  difficulty: 0.25,
};

describe('verificationPathForFormat', () => {
  it('routes nat through wolfram_verified', () => {
    expect(verificationPathForFormat('nat')).toBe('wolfram_verified');
  });
  it('routes mcq/msq through dual_model_consensus', () => {
    expect(verificationPathForFormat('mcq')).toBe('dual_model_consensus');
    expect(verificationPathForFormat('msq')).toBe('dual_model_consensus');
  });
});

describe('practiceItemId', () => {
  it('is deterministic and namespaced pi-<concept>-<hash8>', () => {
    const id = practiceItemId(mcqSpec, mcqResponse);
    expect(id).toMatch(/^pi-eigenvalues-[0-9a-f]{8}$/);
    expect(practiceItemId(mcqSpec, mcqResponse)).toBe(id);
  });

  it('differs when the question text differs (even same spec)', () => {
    const id1 = practiceItemId(mcqSpec, mcqResponse);
    const id2 = practiceItemId(mcqSpec, { ...mcqResponse, question_text: 'A different question' });
    expect(id1).not.toBe(id2);
  });
});

describe('assemblePracticeItem — mcq', () => {
  it('assembles a gradable AuthoredItem with the spec difficulty, not the response difficulty', () => {
    const result = assemblePracticeItem(mcqSpec, mcqResponse, 'dual_model_consensus');
    expect(result.ok).toBe(true);
    expect(result.item!.difficulty).toBe(0.35); // spec's, not response's 0.4
    expect(result.item!.question_type).toBe('mcq');
    expect(result.item!.marks).toBeGreaterThan(0);
    expect(result.item!.verification_method).toBe('dual_model_consensus');
    expect(result.item!.concept_id).toBe('eigenvalues');
    expect(result.item!.topic).toBe('linear-algebra');
  });

  it('the answer index points at the correct answer inside options', () => {
    const result = assemblePracticeItem(mcqSpec, mcqResponse, 'dual_model_consensus');
    const item = result.item!;
    expect(item.options![item.answer_index!]).toBe('5 and 2');
  });

  it('refuses when fewer than 2 usable distractors survive dedup', () => {
    const thin = { ...mcqResponse, distractors: ['5 and 2'] }; // equals correct answer, filtered out
    const result = assemblePracticeItem(mcqSpec, thin, 'dual_model_consensus');
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/deriveMarking refused/);
    expect(result.item).toBeUndefined();
  });

  it('is deterministic under an injected rng (same shuffle every time)', () => {
    const rng = () => 0.42;
    const a = assemblePracticeItem(mcqSpec, mcqResponse, 'dual_model_consensus', rng);
    const b = assemblePracticeItem(mcqSpec, mcqResponse, 'dual_model_consensus', rng);
    expect(a.item!.options).toEqual(b.item!.options);
    expect(a.item!.answer_index).toEqual(b.item!.answer_index);
  });
});

describe('assemblePracticeItem — msq', () => {
  it('assembles with answer_indices and joins correct_answers for correct_answer field', () => {
    const result = assemblePracticeItem(msqSpec, msqResponse, 'dual_model_consensus');
    expect(result.ok).toBe(true);
    expect(result.item!.question_type).toBe('msq');
    expect(result.item!.answer_indices!.length).toBe(2);
    expect(result.item!.correct_answer).toContain('(1,1)');
    expect(result.item!.correct_answer).toContain('(1,-1)');
  });

  it('refuses an all-correct "select all" with no disjoint distractor', () => {
    const bad = { ...msqResponse, distractors: [] };
    const result = assemblePracticeItem(msqSpec, bad, 'dual_model_consensus');
    expect(result.ok).toBe(false);
  });
});

describe('assemblePracticeItem — nat', () => {
  it('assembles with an answer_range and wolfram_verified stamp', () => {
    const result = assemblePracticeItem(natSpec, natResponse, 'wolfram_verified');
    expect(result.ok).toBe(true);
    expect(result.item!.question_type).toBe('nat');
    expect(result.item!.answer_range).toBeDefined();
    const [lo, hi] = result.item!.answer_range!;
    expect(lo).toBeLessThanOrEqual(6);
    expect(hi).toBeGreaterThanOrEqual(6);
    expect(result.item!.verification_method).toBe('wolfram_verified');
  });

  it('refuses a symbolic (non-numeric) answer', () => {
    const symbolic = { ...natResponse, correct_answer: 'π/4' };
    const result = assemblePracticeItem(natSpec, symbolic, 'wolfram_verified');
    expect(result.ok).toBe(false);
  });
});
