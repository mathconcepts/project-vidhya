import { describe, it, expect } from 'vitest';
import {
  normalizePyqRow, normalizeGeneratedRow, normalizeMockExamRow, gradeMockExam,
  type MockExamQuestionRow, type NormalizedMockQuestion,
} from '../mock-exam-grading';

describe('normalizePyqRow', () => {
  it('canonicalizes letter-keyed options into an index-ordered mcq item', () => {
    const row: MockExamQuestionRow = {
      id: 'pyq-1', topic: 'eigenvalues', source: 'pyq',
      options: { A: 'one', B: 'two', C: 'three', D: 'four' },
      correct_answer: 'C', marks: 2,
    };
    const r = normalizePyqRow(row);
    expect(r.item).toMatchObject({ id: 'pyq-1', kind: 'mcq', marks: 2, options: ['one', 'two', 'three', 'four'], answerIndex: 2 });
  });

  it('defaults marks to 1 when the row has none', () => {
    const row: MockExamQuestionRow = { id: 'p2', topic: 't', source: 'pyq', options: { A: 'x', B: 'y' }, correct_answer: 'A' };
    expect(normalizePyqRow(row).item?.marks).toBe(1);
  });

  it('refuses (item: null) when options are missing or malformed — never guesses', () => {
    expect(normalizePyqRow({ id: 'p3', topic: 't', source: 'pyq', correct_answer: 'A' }).item).toBeNull();
    expect(normalizePyqRow({ id: 'p4', topic: 't', source: 'pyq', options: { A: 'only one' }, correct_answer: 'A' }).item).toBeNull();
  });

  it('refuses when correct_answer does not match any option key', () => {
    const row: MockExamQuestionRow = { id: 'p5', topic: 't', source: 'pyq', options: { A: 'x', B: 'y' }, correct_answer: 'Z' };
    expect(normalizePyqRow(row).item).toBeNull();
  });

  it('accepts options passed as a JSON string (as they arrive from Postgres)', () => {
    const row: MockExamQuestionRow = { id: 'p6', topic: 't', source: 'pyq', options: JSON.stringify({ A: 'x', B: 'y' }), correct_answer: 'B', marks: 1 };
    expect(normalizePyqRow(row).item).toMatchObject({ answerIndex: 1 });
  });
});

describe('normalizeGeneratedRow', () => {
  it('accepts a fully-marked (post-033) generated_problems row', () => {
    const row: MockExamQuestionRow = {
      id: 'g1', topic: 't', source: 'generated', question_type: 'mcq', marks: 2,
      options: ['a', 'b', 'c'], answer_index: 1,
    };
    expect(normalizeGeneratedRow(row).item).toMatchObject({ kind: 'mcq', marks: 2, answerIndex: 1 });
  });

  it('refuses a pre-033 row with no marking columns — honest, not guessed', () => {
    const row: MockExamQuestionRow = { id: 'g2', topic: 't', source: 'generated', correct_answer: 'legacy free text' };
    expect(normalizeGeneratedRow(row).item).toBeNull();
  });

  it('refuses msq with an out-of-range index', () => {
    const row: MockExamQuestionRow = {
      id: 'g3', topic: 't', source: 'generated', question_type: 'msq', marks: 2,
      options: ['a', 'b'], answer_indices: [0, 5],
    };
    expect(normalizeGeneratedRow(row).item).toBeNull();
  });

  it('accepts a nat row with an answer_range', () => {
    const row: MockExamQuestionRow = { id: 'g4', topic: 't', source: 'generated', question_type: 'nat', marks: 1, answer_range: [1.4, 1.6] };
    expect(normalizeGeneratedRow(row).item).toMatchObject({ kind: 'nat', answerRange: [1.4, 1.6] });
  });
});

describe('normalizeMockExamRow dispatch', () => {
  it('routes by source', () => {
    expect(normalizeMockExamRow({ id: 'a', topic: 't', source: 'pyq', options: { A: 'x', B: 'y' }, correct_answer: 'A' }).item?.kind).toBe('mcq');
    expect(normalizeMockExamRow({ id: 'b', topic: 't', source: 'generated', question_type: 'nat', marks: 1, answer_range: [0, 1] }).item?.kind).toBe('nat');
  });
});

describe('gradeMockExam', () => {
  function q(id: string, topic: string, item: NormalizedMockQuestion['item']): NormalizedMockQuestion {
    return { id, topic, item };
  }

  it('grades a mix of correct/wrong/skipped/ungraded questions', async () => {
    const questions: NormalizedMockQuestion[] = [
      q('a', 'eigenvalues', { id: 'a', kind: 'mcq', marks: 2, options: ['x', 'y'], answerIndex: 0 }),
      q('b', 'eigenvalues', { id: 'b', kind: 'mcq', marks: 2, options: ['x', 'y'], answerIndex: 1 }),
      q('c', 'determinants', { id: 'c', kind: 'nat', marks: 1, answerRange: [1, 1] }),
      q('d', 'determinants', null), // ungraded — no marking data
    ];
    const responses = {
      a: { selectedIndex: 0 },  // correct
      b: { selectedIndex: 0 },  // wrong (negative marking applies)
      // c: no response at all — skipped
    };
    const result = await gradeMockExam(questions, responses);
    expect(result.correct).toBe(1);
    expect(result.wrong).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.ungraded).toBe(1);
    expect(result.max).toBe(4); // only a+b counted (c skipped contributes 0 to max, d excluded)
    expect(result.earned).toBeCloseTo(2 - 2 / 3, 9); // +2 correct, -2/3 wrong MCQ
    expect(result.by_topic.eigenvalues).toMatchObject({ correct: 1, attempted: 2 });
    expect(result.by_topic.determinants.attempted).toBe(0); // c skipped, d ungraded
  });

  it('never throws on an out-of-range index — grades it as an ordinary wrong answer', async () => {
    const questions = [q('x', 't', { id: 'x', kind: 'mcq', marks: 1, options: ['a', 'b'], answerIndex: 0 })];
    const result = await gradeMockExam(questions, { x: { selectedIndex: 99 } as any });
    expect(result.wrong).toBe(1);
    expect(result.skipped).toBe(0);
  });

  it('treats a genuinely absent / shapeless response as skipped', async () => {
    const questions = [q('x', 't', { id: 'x', kind: 'mcq', marks: 1, options: ['a', 'b'], answerIndex: 0 })];
    const withUndefined = await gradeMockExam(questions, {});
    expect(withUndefined.skipped).toBe(1);
    const withEmptyObj = await gradeMockExam(questions, { x: {} });
    expect(withEmptyObj.skipped).toBe(1);
  });

  it('an all-ungraded exam grades to 0/0 honestly, never fabricated', async () => {
    const questions = [q('a', 't', null), q('b', 't', null)];
    const result = await gradeMockExam(questions, {});
    expect(result).toMatchObject({ earned: 0, max: 0, correct: 0, wrong: 0, skipped: 0, ungraded: 2 });
  });
});
