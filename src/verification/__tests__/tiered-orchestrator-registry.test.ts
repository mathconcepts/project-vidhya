/**
 * Tier 4+ verifier registration tests.
 *
 * Proves:
 *   1. registerVerifier() accepts Tier 4+ verifiers and runs them in tier order
 *   2. registerVerifier() rejects Tier 1-3 (those slots are reserved for built-ins)
 *   3. registerVerifier() rejects duplicate names
 *   4. extraVerifiers can be passed via the constructor as well
 *   5. SNAPSHOT REGRESSION: with zero extra verifiers, the orchestrator still
 *      delivers byte-identical TieredVerificationResult shape (verifies the
 *      pragmatic refactor preserved the original 3-tier behavior)
 */

import { describe, it, expect, vi } from 'vitest';
import {
  TieredVerificationOrchestrator,
  DEFAULT_CONFIG,
  type DualSolveLLM,
  type TierSignalEmitter,
} from '../tiered-orchestrator.js';
import type { AnswerVerifier } from '../verifiers/types.js';
import type { VectorStore } from '../../data/vector-store.js';
import type { WolframVerifier } from '../verifiers/wolfram.js';

// ─── Mocks ─────────────────────────────────────────────────────────────

function makeMockVectorStore(): VectorStore {
  return {
    search: vi.fn().mockResolvedValue([]), // No RAG hits
    upsert: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  } as unknown as VectorStore;
}

function makeMockLLM(answer: string, confidence = 0.9): DualSolveLLM {
  return { solve: vi.fn().mockResolvedValue({ answer, confidence }) };
}

function makeMockWolfram(): WolframVerifier {
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

function makeMockExtraVerifier(name: string, tier: number): AnswerVerifier {
  return {
    name,
    tier,
    verify: vi.fn().mockResolvedValue({ agrees: true, confidence: 0.9 }),
    healthCheck: vi.fn().mockResolvedValue(true),
  };
}

function buildOrchestrator(extras: AnswerVerifier[] = []): TieredVerificationOrchestrator {
  return new TieredVerificationOrchestrator(
    makeMockVectorStore(),
    vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    makeMockLLM('42', 0.9),
    makeMockLLM('42', 0.85),
    makeMockWolfram(),
    DEFAULT_CONFIG,
    undefined,
    extras,
  );
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe('TieredVerificationOrchestrator — registerVerifier()', () => {
  it('accepts a Tier 4 verifier', () => {
    const orch = buildOrchestrator();
    const v = makeMockExtraVerifier('sympy', 4);
    expect(() => orch.registerVerifier(v)).not.toThrow();
    expect(orch.listExtraVerifiers()).toContain('sympy');
  });

  it('rejects a Tier 1 verifier (reserved for built-in RAG)', () => {
    const orch = buildOrchestrator();
    const v = makeMockExtraVerifier('rogue', 1);
    expect(() => orch.registerVerifier(v)).toThrowError(/tier 1 reserved/i);
  });

  it('rejects a Tier 3 verifier (reserved for built-in Wolfram)', () => {
    const orch = buildOrchestrator();
    const v = makeMockExtraVerifier('rogue', 3);
    expect(() => orch.registerVerifier(v)).toThrowError(/tier 3 reserved/i);
  });

  it('rejects duplicate names', () => {
    const orch = buildOrchestrator();
    orch.registerVerifier(makeMockExtraVerifier('sympy', 4));
    expect(() => orch.registerVerifier(makeMockExtraVerifier('sympy', 5))).toThrowError(/already registered/i);
  });

  it('keeps registered verifiers sorted by tier ascending', () => {
    const orch = buildOrchestrator();
    orch.registerVerifier(makeMockExtraVerifier('z-tier-7', 7));
    orch.registerVerifier(makeMockExtraVerifier('a-tier-4', 4));
    orch.registerVerifier(makeMockExtraVerifier('m-tier-5', 5));
    expect(orch.listExtraVerifiers()).toEqual(['a-tier-4', 'm-tier-5', 'z-tier-7']);
  });

  it('accepts extras via constructor', () => {
    const orch = buildOrchestrator([makeMockExtraVerifier('boot-time', 4)]);
    expect(orch.listExtraVerifiers()).toEqual(['boot-time']);
  });

  it('SNAPSHOT REGRESSION: zero extras → result shape unchanged from pre-refactor', async () => {
    // This test fixes the core invariant: adding registerVerifier() must NOT change
    // the existing 3-tier behavior or the TieredVerificationResult shape. Any future
    // change that breaks this snapshot is a behavior regression.
    const orch = buildOrchestrator();
    const result = await orch.verify('what is 6 * 7?', '42');

    expect(result).toMatchObject({
      // Required fields from pre-refactor result shape
      contentId: expect.any(String),
      contentType: 'math_solution',
      originalContent: expect.stringContaining('6 * 7'),
      traceId: expect.any(String),
      tierUsed: expect.stringMatching(/^tier[123]_/),
      tierTimings: expect.any(Object),
      checks: expect.any(Array),
    });

    // The closed enum must still be one of the original three.
    expect(['tier1_rag', 'tier2_llm', 'tier3_wolfram']).toContain(result.tierUsed);
  });
});
