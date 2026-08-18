import { describe, it, expect } from 'vitest';
import { parsePracticeItemResponse } from '../parse';

const validMcq = JSON.stringify({
  question_text: 'A = [[4,1],[2,3]]. Eigenvalues?',
  correct_answer: '5 and 2',
  distractors: ['4 and 3', '7 and 10', '6 and 1'],
  solution_steps: ['trace=7, det=10', 'factor (λ-5)(λ-2)=0'],
  difficulty: 0.35,
});

const validMsq = JSON.stringify({
  question_text: 'Which are eigenvectors of A?',
  correct_answers: ['(1,1)', '(1,-1)'],
  distractors: ['(0,1)'],
  solution_steps: ['check Av = λv for each'],
  difficulty: 0.5,
});

const validNat = JSON.stringify({
  question_text: 'det([[3,0],[0,2]]) = ?',
  correct_answer: '6',
  distractors: [],
  solution_steps: ['3*2 - 0*0 = 6'],
  difficulty: 0.25,
});

describe('parsePracticeItemResponse — strict parsing', () => {
  it('accepts a well-formed mcq response', () => {
    const r = parsePracticeItemResponse(validMcq, 'mcq');
    expect(r.ok).toBe(true);
    expect(r.response?.correct_answer).toBe('5 and 2');
    expect(r.response?.correct_answers).toBeUndefined();
  });

  it('accepts a well-formed msq response', () => {
    const r = parsePracticeItemResponse(validMsq, 'msq');
    expect(r.ok).toBe(true);
    expect(r.response?.correct_answers).toEqual(['(1,1)', '(1,-1)']);
    expect(r.response?.correct_answer).toBeUndefined();
  });

  it('accepts a well-formed nat response', () => {
    const r = parsePracticeItemResponse(validNat, 'nat');
    expect(r.ok).toBe(true);
    expect(r.response?.correct_answer).toBe('6');
  });

  it('refuses invalid JSON rather than guessing', () => {
    const r = parsePracticeItemResponse('{ this is not json', 'mcq');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/invalid JSON/);
  });

  it('refuses a JSON array (not an object)', () => {
    const r = parsePracticeItemResponse('[1,2,3]', 'mcq');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/not a JSON object/);
  });

  it('refuses when question_text is missing', () => {
    const bad = JSON.stringify({ correct_answer: 'x', distractors: ['a', 'b'], solution_steps: ['s'], difficulty: 0.5 });
    const r = parsePracticeItemResponse(bad, 'mcq');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/question_text/);
  });

  it('refuses when question_text is empty/whitespace', () => {
    const bad = JSON.stringify({ question_text: '   ', correct_answer: 'x', distractors: ['a', 'b'], solution_steps: ['s'], difficulty: 0.5 });
    expect(parsePracticeItemResponse(bad, 'mcq').ok).toBe(false);
  });

  it('refuses when distractors is missing or not a string array', () => {
    const bad1 = JSON.stringify({ question_text: 'q', correct_answer: 'x', solution_steps: ['s'], difficulty: 0.5 });
    expect(parsePracticeItemResponse(bad1, 'mcq').ok).toBe(false);
    const bad2 = JSON.stringify({ question_text: 'q', correct_answer: 'x', distractors: [1, 2], solution_steps: ['s'], difficulty: 0.5 });
    expect(parsePracticeItemResponse(bad2, 'mcq').ok).toBe(false);
  });

  it('refuses when solution_steps is missing, empty, or contains a blank step', () => {
    const missing = JSON.stringify({ question_text: 'q', correct_answer: 'x', distractors: ['a', 'b'], difficulty: 0.5 });
    expect(parsePracticeItemResponse(missing, 'mcq').ok).toBe(false);
    const empty = JSON.stringify({ question_text: 'q', correct_answer: 'x', distractors: ['a', 'b'], solution_steps: [], difficulty: 0.5 });
    expect(parsePracticeItemResponse(empty, 'mcq').ok).toBe(false);
    const blank = JSON.stringify({ question_text: 'q', correct_answer: 'x', distractors: ['a', 'b'], solution_steps: ['  '], difficulty: 0.5 });
    expect(parsePracticeItemResponse(blank, 'mcq').ok).toBe(false);
  });

  it('refuses when difficulty is missing, non-numeric, or out of [0,1] range', () => {
    const base = { question_text: 'q', correct_answer: 'x', distractors: ['a', 'b'], solution_steps: ['s'] };
    expect(parsePracticeItemResponse(JSON.stringify(base), 'mcq').ok).toBe(false);
    expect(parsePracticeItemResponse(JSON.stringify({ ...base, difficulty: 'high' }), 'mcq').ok).toBe(false);
    expect(parsePracticeItemResponse(JSON.stringify({ ...base, difficulty: 1.5 }), 'mcq').ok).toBe(false);
    expect(parsePracticeItemResponse(JSON.stringify({ ...base, difficulty: -0.1 }), 'mcq').ok).toBe(false);
  });

  it('refuses mcq/nat when correct_answer is missing (even if correct_answers is present)', () => {
    const bad = JSON.stringify({
      question_text: 'q', correct_answers: ['a', 'b'], distractors: ['c'], solution_steps: ['s'], difficulty: 0.5,
    });
    expect(parsePracticeItemResponse(bad, 'mcq').ok).toBe(false);
  });

  it('refuses msq with fewer than 2 correct_answers', () => {
    const bad = JSON.stringify({
      question_text: 'q', correct_answers: ['a'], distractors: ['b'], solution_steps: ['s'], difficulty: 0.5,
    });
    const r = parsePracticeItemResponse(bad, 'msq');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/correct_answers/);
  });

  it('refuses msq when correct_answers is missing (even if correct_answer is present)', () => {
    const bad = JSON.stringify({
      question_text: 'q', correct_answer: 'a', distractors: ['b'], solution_steps: ['s'], difficulty: 0.5,
    });
    expect(parsePracticeItemResponse(bad, 'msq').ok).toBe(false);
  });

  it('accepts an empty distractors array for nat (nat does not need options)', () => {
    const r = parsePracticeItemResponse(validNat, 'nat');
    expect(r.ok).toBe(true);
    expect(r.response?.distractors).toEqual([]);
  });
});
