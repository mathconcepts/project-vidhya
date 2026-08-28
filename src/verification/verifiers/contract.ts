/**
 * Contract test for AnswerVerifier implementations (B1a).
 *
 * Mirrors `src/content/verifiers/contract.ts`'s shape for the sibling
 * ContentVerifier contract — same five checks, same "call it from a
 * describe block" usage. Every AnswerVerifier (the Tier 4+ registry slot,
 * and the hardcoded Tier 2.5 SymPy stage) must pass
 * `runAnswerVerifierContract(verifier)`. This catches contract violations
 * at PR time, before they reach the orchestrator.
 *
 * Usage in tests:
 *   import { describe } from 'vitest';
 *   import { runAnswerVerifierContract } from '../contract';
 *   import myVerifier from './my-verifier';
 *
 *   describe('MyVerifier', () => {
 *     runAnswerVerifierContract(myVerifier);
 *   });
 */

import { describe, it, expect } from 'vitest';
import type { AnswerVerifier } from './types';

export function runAnswerVerifierContract(verifier: AnswerVerifier): void {
  describe(`AnswerVerifier contract: ${verifier.name}`, () => {
    it('exposes a stable, non-empty name', () => {
      expect(verifier.name).toBeTruthy();
      expect(typeof verifier.name).toBe('string');
    });

    it('declares a numeric tier', () => {
      expect(typeof verifier.tier).toBe('number');
      expect(Number.isFinite(verifier.tier)).toBe(true);
    });

    it('verify() returns an AnswerVerifierResult shape', async () => {
      const result = await verifier.verify('2 + 2', '4');
      expect(result).toHaveProperty('agrees');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.agrees).toBe('boolean');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('verify() never throws on empty input', async () => {
      await expect(verifier.verify('', '')).resolves.toBeDefined();
    });

    it('verify() never throws on very long input (10k chars)', async () => {
      const long = 'x'.repeat(10_000);
      await expect(verifier.verify(long, long)).resolves.toBeDefined();
    });

    it('healthCheck() returns a boolean', async () => {
      const ok = await verifier.healthCheck();
      expect(typeof ok).toBe('boolean');
    });
  });
}
