/**
 * Tests for cas-pre-verifier.ts
 *
 * All Wolfram calls are mocked — tests exercise extraction logic,
 * gate-mode branching, and answer-agreement paths without network.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractAtomAnswer, casPreVerify } from '../cas-pre-verifier';
import type { GeneratedAtom } from '../types';

// ── Mock wolframSolve + answersAgree ───────────────────────────────────

vi.mock('../../../services/wolfram-service', () => ({
  wolframSolve: vi.fn(),
  answersAgree: vi.fn(),
}));

import { wolframSolve, answersAgree } from '../../../services/wolfram-service';
const mockSolve = vi.mocked(wolframSolve);
const mockAgree = vi.mocked(answersAgree);

// ── Helpers ────────────────────────────────────────────────────────────

function makeAtom(atomType: GeneratedAtom['atom_type'], content: string): GeneratedAtom {
  return {
    atom_id: `test-concept.${atomType}`,
    concept_id: 'test-concept',
    atom_type: atomType,
    bloom_level: 3,
    difficulty: 0.5,
    exam_ids: ['*'],
    content,
    meta: {
      source_cascade: ['llm-claude'],
      wolfram_grounded: false,
      pyq_grounded: [],
      generated_at: new Date().toISOString(),
      cost_usd: 0.01,
    },
  };
}

// ── extractAtomAnswer ──────────────────────────────────────────────────

describe('extractAtomAnswer', () => {
  it('extracts "Answer: X" from worked_example', () => {
    const content = 'Find the derivative of x².\n---\nDifferentiate.\n---\nAnswer: 2x';
    expect(extractAtomAnswer(content, 'worked_example')).toBe('2x');
  });

  it('extracts \\boxed{value} for formal_definition', () => {
    const content = 'The limit is $\\boxed{\\frac{1}{2}}$.';
    expect(extractAtomAnswer(content, 'formal_definition')).toBe('\\frac{1}{2}');
  });

  it('handles nested braces in \\boxed', () => {
    const content = '$\\boxed{f(x) = \\frac{a}{b}}$';
    expect(extractAtomAnswer(content, 'worked_example')).toBe('f(x) = \\frac{a}{b}');
  });

  it('returns null for non-math atom types', () => {
    expect(extractAtomAnswer('Answer: 42', 'hook')).toBeNull();
    expect(extractAtomAnswer('Answer: 42', 'intuition')).toBeNull();
    expect(extractAtomAnswer('Answer: 42', 'visual_analogy')).toBeNull();
    expect(extractAtomAnswer('Answer: 42', 'mnemonic')).toBeNull();
  });

  it('returns null when no answer marker present', () => {
    const content = 'The derivative of x² is 2x (no answer marker).';
    expect(extractAtomAnswer(content, 'worked_example')).toBeNull();
  });

  it('trims whitespace from extracted answer', () => {
    const content = 'Answer:   π/4   \nNext line';
    expect(extractAtomAnswer(content, 'worked_example')).toBe('π/4');
  });

  it('extracts from interleaved_drill', () => {
    const content = 'Drill: compute $\\int_0^1 x\\,dx$\n\nAnswer: 1/2';
    expect(extractAtomAnswer(content, 'interleaved_drill')).toBe('1/2');
  });
});

// ── casPreVerify ───────────────────────────────────────────────────────

describe('casPreVerify', () => {
  const origEnv = process.env.VIDHYA_CAS_PREFLIGHT;

  afterEach(() => {
    if (origEnv === undefined) delete process.env.VIDHYA_CAS_PREFLIGHT;
    else process.env.VIDHYA_CAS_PREFLIGHT = origEnv;
    vi.clearAllMocks();
  });

  it('skips entirely when VIDHYA_CAS_PREFLIGHT is off (default)', async () => {
    delete process.env.VIDHYA_CAS_PREFLIGHT;
    const atom = makeAtom('worked_example', 'Answer: 2x');
    const result = await casPreVerify(atom);
    expect(result.skipped).toBe(true);
    expect(mockSolve).not.toHaveBeenCalled();
  });

  it('skips when no extractable answer found', async () => {
    process.env.VIDHYA_CAS_PREFLIGHT = 'on';
    const atom = makeAtom('worked_example', 'No answer marker here.');
    const result = await casPreVerify(atom);
    expect(result.skipped).toBe(true);
    expect(mockSolve).not.toHaveBeenCalled();
  });

  it('skips for non-math atom types even in gate mode', async () => {
    process.env.VIDHYA_CAS_PREFLIGHT = 'on';
    const atom = makeAtom('hook', 'Answer: 42');
    const result = await casPreVerify(atom);
    expect(result.skipped).toBe(true);
    expect(mockSolve).not.toHaveBeenCalled();
  });

  it('skips when Wolfram is not available (no API key)', async () => {
    process.env.VIDHYA_CAS_PREFLIGHT = 'on';
    mockSolve.mockResolvedValueOnce({
      available: false,
      query: 'test',
      answer: null,
      steps: [],
      interpretation: null,
      pods: [],
      error: 'WOLFRAM_APP_ID not configured',
      latency_ms: 0,
    });
    const atom = makeAtom('worked_example', 'Find x.\n\nAnswer: 5');
    const result = await casPreVerify(atom);
    expect(result.skipped).toBe(true);
  });

  it('shadow mode: logs but does not reject even when Wolfram disagrees', async () => {
    process.env.VIDHYA_CAS_PREFLIGHT = 'shadow';
    mockSolve.mockResolvedValueOnce({
      available: true,
      query: 'test',
      answer: '3',
      steps: [],
      interpretation: null,
      pods: [],
      latency_ms: 10,
    });
    mockAgree.mockReturnValueOnce(false);
    const atom = makeAtom('worked_example', 'Find x.\n\nAnswer: 5');
    const result = await casPreVerify(atom);
    expect(result.skipped).toBe(false);
    expect(result.verified).toBe(false);
    // shadow mode: reason is still set for logging
    expect(result.extractedAnswer).toBe('5');
    expect(result.wolframAnswer).toBe('3');
  });

  it('gate mode on: verified=true when Wolfram agrees', async () => {
    process.env.VIDHYA_CAS_PREFLIGHT = 'on';
    mockSolve.mockResolvedValueOnce({
      available: true,
      query: 'test',
      answer: '2x',
      steps: [],
      interpretation: null,
      pods: [],
      latency_ms: 10,
    });
    mockAgree.mockReturnValueOnce(true);
    const atom = makeAtom('worked_example', 'Differentiate x².\n\nAnswer: 2x');
    const result = await casPreVerify(atom);
    expect(result.skipped).toBe(false);
    expect(result.verified).toBe(true);
    expect(result.extractedAnswer).toBe('2x');
  });

  it('gate mode on: verified=false with reason when Wolfram disagrees', async () => {
    process.env.VIDHYA_CAS_PREFLIGHT = 'on';
    mockSolve.mockResolvedValueOnce({
      available: true,
      query: 'test',
      answer: '2x',
      steps: [],
      interpretation: null,
      pods: [],
      latency_ms: 10,
    });
    mockAgree.mockReturnValueOnce(false);
    const atom = makeAtom('worked_example', 'Differentiate x².\n\nAnswer: 3x');
    const result = await casPreVerify(atom);
    expect(result.skipped).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.reason).toContain('Wolfram disagrees');
    expect(result.extractedAnswer).toBe('3x');
    expect(result.wolframAnswer).toBe('2x');
  });

  it('skips (no penalty) when Wolfram returns no answer for the query', async () => {
    process.env.VIDHYA_CAS_PREFLIGHT = 'on';
    mockSolve.mockResolvedValueOnce({
      available: true,
      query: 'test',
      answer: null,
      steps: [],
      interpretation: null,
      pods: [],
      latency_ms: 10,
    });
    const atom = makeAtom('worked_example', 'Find x.\n\nAnswer: 5');
    const result = await casPreVerify(atom);
    expect(result.skipped).toBe(true);
    expect(result.verified).toBe(false);
    expect(mockAgree).not.toHaveBeenCalled();
  });

  it('skips gracefully on cascade exception', async () => {
    process.env.VIDHYA_CAS_PREFLIGHT = 'on';
    mockSolve.mockRejectedValueOnce(new Error('network timeout'));
    const atom = makeAtom('worked_example', 'Find x.\n\nAnswer: 5');
    const result = await casPreVerify(atom);
    expect(result.skipped).toBe(true);
  });
});
