/**
 * Contract test for AnswerVerifier implementations.
 *
 * Every AnswerVerifier (Wolfram, SymPy, LLM consensus, future additions) must pass
 * `runAnswerVerifierContract(verifier)`. The TieredVerificationOrchestrator relies
 * on these invariants to keep the cascade safe.
 */

import { describe, it, expect } from 'vitest';
import type { AnswerVerifier } from './types';

export function runAnswerVerifierContract(verifier: AnswerVerifier): void {
  describe(`AnswerVerifier contract: ${verifier.name}`, () => {
    it('exposes a stable, non-empty name', () => {
      expect(verifier.name).toBeTruthy();
      expect(typeof verifier.name).toBe('string');
    });

    it('declares a positive tier (1-9)', () => {
      expect(typeof verifier.tier).toBe('number');
      expect(verifier.tier).toBeGreaterThanOrEqual(1);
      expect(verifier.tier).toBeLessThanOrEqual(9);
    });

    it('verify() returns an AnswerVerifierResult shape', async () => {
      const result = await verifier.verify('2+2', '4');
      expect(result).toHaveProperty('agrees');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.agrees).toBe('boolean');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('verify() never throws on empty inputs', async () => {
      await expect(verifier.verify('', '')).resolves.toBeDefined();
    });

    it('healthCheck() returns a boolean', async () => {
      const ok = await verifier.healthCheck();
      expect(typeof ok).toBe('boolean');
    });
  });
}
