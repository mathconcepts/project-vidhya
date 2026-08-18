import { describe, it, expect } from 'vitest';
import { buildPracticeItemPrompt } from '../prompt';
import type { PracticeItemSpec } from '../types';

const baseSpec: PracticeItemSpec = {
  concept_id: 'eigenvalues',
  format: 'mcq',
  difficulty: 0.35,
  topic: 'linear-algebra',
};

describe('buildPracticeItemPrompt', () => {
  it('is deterministic: the same spec always produces the same prompt', () => {
    expect(buildPracticeItemPrompt(baseSpec)).toBe(buildPracticeItemPrompt({ ...baseSpec }));
  });

  it('pulls the concept label from the concept graph', () => {
    const prompt = buildPracticeItemPrompt(baseSpec);
    expect(prompt).toContain('eigenvalues');
    expect(prompt.toLowerCase()).not.toContain('undefined');
  });

  it('requests correct_answer (not correct_answers) for mcq', () => {
    const prompt = buildPracticeItemPrompt(baseSpec);
    expect(prompt).toContain('"correct_answer"');
    expect(prompt).not.toContain('"correct_answers"');
  });

  it('requests correct_answers (not correct_answer) for msq', () => {
    const prompt = buildPracticeItemPrompt({ ...baseSpec, format: 'msq' });
    expect(prompt).toContain('"correct_answers"');
    expect(prompt).not.toContain('"correct_answer"');
  });

  it('describes NAT items as numeric, no units, no LaTeX', () => {
    const prompt = buildPracticeItemPrompt({ ...baseSpec, format: 'nat' });
    expect(prompt.toLowerCase()).toContain('numerical');
    expect(prompt.toLowerCase()).toContain('no units');
  });

  it('labels difficulty consistently with its numeric band', () => {
    expect(buildPracticeItemPrompt({ ...baseSpec, difficulty: 0.1 })).toContain('easy');
    expect(buildPracticeItemPrompt({ ...baseSpec, difficulty: 0.5 })).toContain('medium');
    expect(buildPracticeItemPrompt({ ...baseSpec, difficulty: 0.9 })).toContain('hard');
  });

  it('degrades gracefully for an unknown concept id (no crash, no "undefined" leak)', () => {
    const prompt = buildPracticeItemPrompt({ ...baseSpec, concept_id: 'not-a-real-concept-xyz' });
    expect(prompt).toContain('not-a-real-concept-xyz');
    expect(prompt.toLowerCase()).not.toContain('undefined');
  });

  it('always asks for a JSON-only response with no markdown fences', () => {
    const prompt = buildPracticeItemPrompt(baseSpec);
    expect(prompt).toMatch(/ONLY a single JSON object/);
    expect(prompt).toContain('no markdown fences');
  });
});
