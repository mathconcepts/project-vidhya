/**
 * Tests for src/verification/verifiers/method-check.ts — the Tier 4+
 * method-tag check ("Gap 1's second layer": catches right-answer-wrong-
 * method solutions, which a CAS/numeric check cannot see).
 *
 * Covers:
 *   - the AnswerVerifier contract
 *   - pure functions: methodTokens, heuristicMethodOverlap, parseMethodCheckResponse
 *   - the "nothing to check" degrade (no expectedMethod, no solutionText)
 *   - the natural fail-closed path in THIS environment: no LLM provider is
 *     configured (no API keys in this sandbox), so getLlmForRole() returns
 *     null for real — the heuristic fallback is exercised, not mocked away
 *   - the LLM-judge path, via vi.mock of ../../../llm/runtime, for both an
 *     agreeing and a disagreeing verdict, and a malformed-JSON fallback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAnswerVerifierContract } from '../contract';
import {
  methodCheckVerifier,
  methodTokens,
  heuristicMethodOverlap,
  parseMethodCheckResponse,
} from '../method-check';

describe('methodCheckVerifier', () => {
  runAnswerVerifierContract(methodCheckVerifier);
});

describe('methodTokens', () => {
  it('splits on underscores and _vs_, drops stopwords and short tokens', () => {
    expect(methodTokens('hand_checkable_triangular_diagonal')).toEqual(['triangular', 'diagonal']);
    expect(methodTokens('pigeonhole_formula_vs_worst_case_construction')).toEqual(
      ['pigeonhole', 'worst', 'case', 'construction'],
    );
  });

  it('returns an empty array for an all-stopword or empty string', () => {
    expect(methodTokens('hand_checkable_method')).toEqual([]);
    expect(methodTokens('')).toEqual([]);
  });
});

describe('heuristicMethodOverlap', () => {
  it('agrees with high-ish confidence when most tokens are present', () => {
    const r = heuristicMethodOverlap(
      'triangular_diagonal',
      'Since the matrix is upper triangular, the eigenvalues are the diagonal entries.',
    );
    expect(r.agrees).toBe(true);
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(0.35); // never claims high confidence
    expect(r.reason).toMatch(/heuristic-only/);
  });

  it('disagrees (low overlap) when the solution text does not mention expected-method keywords', () => {
    const r = heuristicMethodOverlap(
      'pigeonhole_formula_vs_worst_case_construction',
      'We compute the determinant by cofactor expansion along the first row.',
    );
    expect(r.agrees).toBe(false);
    expect(r.reason).toMatch(/0\/4/); // none of the 4 tokens found
  });

  it('never fabricates confidence for an expected method with no checkable tokens', () => {
    const r = heuristicMethodOverlap('hand_checkable_method', 'any solution text');
    expect(r.confidence).toBe(0);
    expect(r.agrees).toBe(true); // no signal = no disagreement, not a guessed disagreement
  });
});

describe('parseMethodCheckResponse', () => {
  it('parses a well-formed response', () => {
    const parsed = parseMethodCheckResponse(JSON.stringify({
      method_sound: true, matches_expected: true, confidence: 0.9, reason: 'Correct use of triangular structure.',
    }));
    expect(parsed).toEqual({
      method_sound: true, matches_expected: true, confidence: 0.9, reason: 'Correct use of triangular structure.',
    });
  });

  it('strips a markdown code fence', () => {
    const parsed = parseMethodCheckResponse('```json\n' + JSON.stringify({ method_sound: false, matches_expected: null, confidence: 0.4 }) + '\n```');
    expect(parsed?.method_sound).toBe(false);
    expect(parsed?.matches_expected).toBeNull();
  });

  it('returns null on unparseable JSON', () => {
    expect(parseMethodCheckResponse('not json at all')).toBeNull();
  });

  it('returns null when method_sound is missing or not boolean', () => {
    expect(parseMethodCheckResponse(JSON.stringify({ confidence: 0.9 }))).toBeNull();
    expect(parseMethodCheckResponse(JSON.stringify({ method_sound: 'yes', confidence: 0.9 }))).toBeNull();
  });

  it('clamps an out-of-range confidence and defaults a missing one to 0.5', () => {
    expect(parseMethodCheckResponse(JSON.stringify({ method_sound: true, confidence: 5 }))?.confidence).toBe(1);
    expect(parseMethodCheckResponse(JSON.stringify({ method_sound: true, confidence: -1 }))?.confidence).toBe(0);
    expect(parseMethodCheckResponse(JSON.stringify({ method_sound: true }))?.confidence).toBe(0.5);
  });
});

describe('verify() — nothing to check', () => {
  it('returns confidence 0 (inconclusive), never a guess, when neither expectedMethod nor solutionText is given', async () => {
    const r = await methodCheckVerifier.verify('2 + 2', '4');
    expect(r.confidence).toBe(0);
    expect(r.agrees).toBe(true);
    expect(r.reason).toMatch(/nothing to check/);
  });
});

describe('verify() — no LLM configured (real fail-closed path in this sandbox)', () => {
  it('falls back to the heuristic when expectedMethod + solutionText are both given', async () => {
    const r = await methodCheckVerifier.verify(
      'Find the eigenvalues of an upper triangular matrix.',
      'λ = 3 and λ = -2',
      {
        expectedMethod: 'hand_checkable_triangular_diagonal',
        solutionText: 'The matrix is upper triangular, so its eigenvalues are the diagonal entries: 3 and -2.',
      },
    );
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(0.35);
    expect(r.reason).toMatch(/heuristic-only/);
  });

  it('returns confidence 0 when only expectedMethod is given (no solution text to check it against)', async () => {
    const r = await methodCheckVerifier.verify('2 + 2', '4', { expectedMethod: 'some_method' });
    expect(r.confidence).toBe(0);
  });
});

describe('verify() — LLM judge path (mocked)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('agrees when the LLM judge says the method is sound and matches', async () => {
    vi.doMock('../../../llm/runtime', () => ({
      getLlmForRole: vi.fn(async () => ({
        generate: vi.fn(async () => JSON.stringify({
          method_sound: true, matches_expected: true, confidence: 0.92, reason: 'Sound triangular-matrix argument.',
        })),
      })),
    }));
    const { methodCheckVerifier: mc } = await import('../method-check');
    const r = await mc.verify('problem', 'answer', {
      expectedMethod: 'triangular_diagonal',
      solutionText: 'Upper triangular, eigenvalues are diagonal entries.',
    });
    expect(r.agrees).toBe(true);
    expect(r.confidence).toBe(0.92);
  });

  it('disagrees when the LLM judge says the method does not match the expected one', async () => {
    vi.doMock('../../../llm/runtime', () => ({
      getLlmForRole: vi.fn(async () => ({
        generate: vi.fn(async () => JSON.stringify({
          method_sound: true, matches_expected: false, confidence: 0.8, reason: 'Right answer, but used cofactor expansion instead of the expected triangular shortcut.',
        })),
      })),
    }));
    const { methodCheckVerifier: mc } = await import('../method-check');
    const r = await mc.verify('problem', 'answer', {
      expectedMethod: 'triangular_diagonal',
      solutionText: 'Expanded the determinant by cofactors...',
    });
    expect(r.agrees).toBe(false);
    expect(r.reason).toMatch(/cofactor/);
  });

  it('disagrees when the LLM judge says the method itself is unsound, even with no expected method given', async () => {
    vi.doMock('../../../llm/runtime', () => ({
      getLlmForRole: vi.fn(async () => ({
        generate: vi.fn(async () => JSON.stringify({
          method_sound: false, matches_expected: null, confidence: 0.75, reason: 'Circular reasoning — assumes the answer to derive it.',
        })),
      })),
    }));
    const { methodCheckVerifier: mc } = await import('../method-check');
    const r = await mc.verify('problem', 'answer', { solutionText: 'Assume the answer is 5, then 5 = 5, so the answer is 5.' });
    expect(r.agrees).toBe(false);
  });

  it('falls back to the heuristic when the LLM returns malformed JSON', async () => {
    vi.doMock('../../../llm/runtime', () => ({
      getLlmForRole: vi.fn(async () => ({
        generate: vi.fn(async () => 'not json'),
      })),
    }));
    const { methodCheckVerifier: mc } = await import('../method-check');
    const r = await mc.verify('problem', 'answer', {
      expectedMethod: 'triangular_diagonal',
      solutionText: 'Upper triangular, eigenvalues are diagonal entries.',
    });
    expect(r.reason).toMatch(/heuristic-only/);
    expect(r.confidence).toBeLessThanOrEqual(0.35);
  });

  it('falls back to the heuristic when the LLM call throws', async () => {
    vi.doMock('../../../llm/runtime', () => ({
      getLlmForRole: vi.fn(async () => ({
        generate: vi.fn(async () => { throw new Error('network error'); }),
      })),
    }));
    const { methodCheckVerifier: mc } = await import('../method-check');
    const r = await mc.verify('problem', 'answer', {
      expectedMethod: 'triangular_diagonal',
      solutionText: 'Upper triangular, eigenvalues are diagonal entries.',
    });
    expect(r.reason).toMatch(/heuristic-only/);
  });
});
