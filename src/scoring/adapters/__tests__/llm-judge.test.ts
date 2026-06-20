/**
 * Tests for src/scoring/adapters/llm-judge.ts — prompt + parser only.
 * The runtime LLM call is exercised in integration tests (needs network).
 */

import { describe, it, expect } from 'vitest';
import { buildPrompt, parseJudgeResponse, MAX_RESPONSE_CHARS } from '../llm-judge';
import type { ItemContext } from '../../../core/interfaces';

const ITEM: ItemContext = {
  rubric: [
    { id: 'given', description: 'States the given', maxMarks: 1 },
    { id: 'method', description: 'Correct method', maxMarks: 3 },
  ],
  expectedAnswer: '1/2',
  officialSolution: 'Apply the chain rule.',
  maxMarks: 4,
};

describe('buildPrompt', () => {
  it('includes every rubric criterion id and max', () => {
    const p = buildPrompt('student work', ITEM);
    expect(p).toContain('id="given" maxMarks=1');
    expect(p).toContain('id="method" maxMarks=3');
  });

  it('includes the official solution as grounding', () => {
    const p = buildPrompt('student work', ITEM);
    expect(p).toContain('Apply the chain rule.');
  });

  it('truncates oversized student responses to a marker', () => {
    const huge = 'x'.repeat(MAX_RESPONSE_CHARS + 1_000);
    const p = buildPrompt(huge, ITEM);
    expect(p).toContain('…[truncated]');
  });
});

describe('parseJudgeResponse', () => {
  const good = JSON.stringify({
    _reasoning: 'thought process here',
    perCriterion: { given: 1, method: 2 },
    feedback: 'Method is on track; the given is stated correctly.',
    confidence: 0.85,
  });

  it('parses a well-formed response', () => {
    const r = parseJudgeResponse(good, ITEM);
    expect(r.perCriterion).toEqual({ given: 1, method: 2 });
    expect(r.feedback).toMatch(/Method/);
    expect(r.confidence).toBeCloseTo(0.85);
  });

  it('strips ```json fences', () => {
    const fenced = '```json\n' + good + '\n```';
    const r = parseJudgeResponse(fenced, ITEM);
    expect(r.perCriterion).toEqual({ given: 1, method: 2 });
  });

  it('throws on non-JSON', () => {
    expect(() => parseJudgeResponse('definitely not json', ITEM)).toThrow(/not valid JSON/);
  });

  it('throws on missing perCriterion', () => {
    const bad = JSON.stringify({ feedback: 'x', confidence: 0.9 });
    expect(() => parseJudgeResponse(bad, ITEM)).toThrow(/perCriterion/);
  });

  it('throws on unknown criterion id', () => {
    const bad = JSON.stringify({
      perCriterion: { given: 1, method: 2, extra: 1 },
      feedback: 'x',
      confidence: 0.9,
    });
    expect(() => parseJudgeResponse(bad, ITEM)).toThrow(/unknown criterion "extra"/);
  });

  it('throws when a criterion is missing', () => {
    const bad = JSON.stringify({
      perCriterion: { given: 1 },
      feedback: 'x',
      confidence: 0.9,
    });
    expect(() => parseJudgeResponse(bad, ITEM)).toThrow(/missing score for criterion "method"/);
  });

  it('throws on non-numeric score', () => {
    const bad = JSON.stringify({
      perCriterion: { given: 'oops', method: 2 },
      feedback: 'x',
      confidence: 0.9,
    });
    expect(() => parseJudgeResponse(bad, ITEM)).toThrow(/non-numeric score/);
  });

  it('throws on out-of-range confidence', () => {
    const bad = JSON.stringify({
      perCriterion: { given: 1, method: 2 },
      feedback: 'x',
      confidence: 1.5,
    });
    expect(() => parseJudgeResponse(bad, ITEM)).toThrow(/confidence/);
  });

  it('throws on empty string', () => {
    expect(() => parseJudgeResponse('', ITEM)).toThrow(/empty response/);
  });
});
