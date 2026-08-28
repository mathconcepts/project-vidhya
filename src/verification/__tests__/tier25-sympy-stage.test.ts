/**
 * Tier 2.5 SymPy stage wiring tests (B1b).
 *
 * The orchestrator's `sympy` constructor slot is exercised here with a
 * MOCK AnswerVerifier — these tests are about the orchestrator's wiring
 * (does it call the slot, does it short-circuit Wolfram, does it fall
 * through on a refusal), not about real SymPy computation (that lives in
 * verifiers/__tests__/sympy.test.ts).
 */

import { describe, it, expect, vi } from 'vitest';
import {
  TieredVerificationOrchestrator,
  DEFAULT_CONFIG,
  type DualSolveLLM,
} from '../tiered-orchestrator.js';
import { InMemoryVectorStore } from '../../data/vector-store.js';
import type { WolframVerifier } from '../verifiers/wolfram.js';
import type { AnswerVerifier } from '../verifiers/types.js';

function makeLLM(answer: string, confidence = 0.9): DualSolveLLM {
  return { solve: vi.fn().mockResolvedValue({ answer, confidence }) };
}

function makeWolfram(): WolframVerifier {
  return {
    verify: vi.fn().mockResolvedValue({
      verifier: 'wolfram',
      status: 'verified',
      confidence: 0.95,
      details: 'wolfram says yes',
      timestamp: new Date(),
      durationMs: 100,
    }),
  } as unknown as WolframVerifier;
}

function makeEmbedder(): (text: string) => Promise<number[]> {
  return vi.fn().mockResolvedValue([0.1, 0.2, 0.3]);
}

function makeSympy(overrides: Partial<AnswerVerifier> = {}): AnswerVerifier {
  return {
    name: 'sympy',
    tier: 2.5,
    verify: vi.fn().mockResolvedValue({ agrees: true, confidence: 0.95 }),
    healthCheck: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function buildOrchestrator(sympy: AnswerVerifier | null) {
  const store = new InMemoryVectorStore();
  const llmA = makeLLM('42');
  const llmB = makeLLM('43'); // disagree → falls through to Tier 2.5 / Tier 3
  const wolfram = makeWolfram();
  const orch = new TieredVerificationOrchestrator(
    store,
    makeEmbedder(),
    llmA,
    llmB,
    wolfram,
    DEFAULT_CONFIG,
    undefined,
    [],
    sympy,
  );
  return { orch, wolfram, llmA, llmB };
}

describe('Tier 2.5 SymPy stage', () => {
  it('is skipped entirely when no sympy verifier is injected (absent = skipped)', async () => {
    const { orch, wolfram } = buildOrchestrator(null);
    const result = await orch.verify('What is 6*7?', '42');

    expect(result.tierUsed).toBe('tier3_wolfram');
    expect(result.tierTimings.tier25Ms).toBeUndefined();
    expect(wolfram.verify).toHaveBeenCalledOnce();
  });

  it('short-circuits Wolfram when SymPy reaches a decisive agreement', async () => {
    const sympy = makeSympy({ verify: vi.fn().mockResolvedValue({ agrees: true, confidence: 0.95, canonicalAnswer: '42' }) });
    const { orch, wolfram } = buildOrchestrator(sympy);

    const result = await orch.verify('What is 6*7?', '42');

    expect(result.tierUsed).toBe('tier25_sympy');
    expect(result.overallStatus).toBe('verified');
    expect(result.tierTimings.tier25Ms).toBeDefined();
    expect(sympy.verify).toHaveBeenCalledOnce();
    expect(wolfram.verify).not.toHaveBeenCalled(); // the metered call was spared
  });

  it('short-circuits Wolfram when SymPy reaches a decisive disagreement', async () => {
    const sympy = makeSympy({ verify: vi.fn().mockResolvedValue({ agrees: false, confidence: 0.9, reason: 'sympy: mismatch' }) });
    const { orch, wolfram } = buildOrchestrator(sympy);

    const result = await orch.verify('What is 6*7?', '42');

    expect(result.tierUsed).toBe('tier25_sympy');
    expect(result.overallStatus).toBe('failed');
    expect(wolfram.verify).not.toHaveBeenCalled();
  });

  it('falls through to Wolfram when SymPy refuses (confidence 0)', async () => {
    const sympy = makeSympy({
      verify: vi.fn().mockResolvedValue({ agrees: false, confidence: 0, reason: "sympy: could not parse head 'What'" }),
    });
    const { orch, wolfram } = buildOrchestrator(sympy);

    const result = await orch.verify('What is 6*7?', '42');

    expect(sympy.verify).toHaveBeenCalledOnce();
    expect(result.tierUsed).toBe('tier3_wolfram');
    expect(wolfram.verify).toHaveBeenCalledOnce();

    // The refusal is still recorded as evidence, even though it didn't win.
    const sympyCheck = result.checks.find((c) => c.verifier === 'sympy');
    expect(sympyCheck?.status).toBe('inconclusive');
    expect(sympyCheck?.confidence).toBe(0);
  });

  it('a SymPy verifier that throws never crashes verify() — falls through to Wolfram', async () => {
    const sympy = makeSympy({ verify: vi.fn().mockRejectedValue(new Error('subprocess exploded')) });
    const { orch, wolfram } = buildOrchestrator(sympy);

    const result = await orch.verify('What is 6*7?', '42');

    expect(result.tierUsed).toBe('tier3_wolfram');
    expect(wolfram.verify).toHaveBeenCalledOnce();
    const sympyCheck = result.checks.find((c) => c.verifier === 'sympy');
    expect(sympyCheck?.details).toContain('subprocess exploded');
  });
});
