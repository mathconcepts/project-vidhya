/**
 * Contract test for ContentVerifier implementations.
 *
 * Every ContentVerifier must pass `runContentVerifierContract(verifier)`.
 * This catches contract violations at PR time, before they reach production.
 *
 * Usage in tests:
 *   import { describe, it } from 'vitest';
 *   import { runContentVerifierContract } from '@/content/verifiers/contract';
 *   import myVerifier from './my-verifier';
 *
 *   describe('MyVerifier', () => {
 *     runContentVerifierContract(myVerifier);
 *   });
 */

import { describe, it, expect } from 'vitest';
import type { ContentVerifier } from './types';

export function runContentVerifierContract(verifier: ContentVerifier): void {
  describe(`ContentVerifier contract: ${verifier.name}`, () => {
    it('exposes a stable, non-empty name', () => {
      expect(verifier.name).toBeTruthy();
      expect(typeof verifier.name).toBe('string');
    });

    it('declares a numeric tier', () => {
      expect(typeof verifier.tier).toBe('number');
      expect(Number.isFinite(verifier.tier)).toBe(true);
    });

    it('verify() returns a ContentVerifierResult shape', async () => {
      const result = await verifier.verify('test content');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('score');
      expect(typeof result.passed).toBe('boolean');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('verify() never throws on empty input', async () => {
      await expect(verifier.verify('')).resolves.toBeDefined();
    });

    it('verify() never throws on very long input (10k chars)', async () => {
      const long = 'x'.repeat(10_000);
      await expect(verifier.verify(long)).resolves.toBeDefined();
    });

    it('healthCheck() returns a boolean', async () => {
      const ok = await verifier.healthCheck();
      expect(typeof ok).toBe('boolean');
    });
  });
}
