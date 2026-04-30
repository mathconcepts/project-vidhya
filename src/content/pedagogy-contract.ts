/**
 * Contract test for PedagogyReviewer implementations.
 *
 * Every PedagogyReviewer must pass `runPedagogyReviewerContract(reviewer)`.
 * Critical invariant: review() never throws — a failing reviewer must never
 * affect content delivery to the student.
 */

import { describe, it, expect } from 'vitest';
import type { PedagogyReviewer } from './pedagogy';

export function runPedagogyReviewerContract(reviewer: PedagogyReviewer): void {
  describe(`PedagogyReviewer contract: ${reviewer.name}`, () => {
    it('exposes a stable, non-empty name', () => {
      expect(reviewer.name).toBeTruthy();
      expect(typeof reviewer.name).toBe('string');
    });

    it('failThreshold is in [0, 1]', () => {
      expect(reviewer.failThreshold).toBeGreaterThanOrEqual(0);
      expect(reviewer.failThreshold).toBeLessThanOrEqual(1);
    });

    it('review() returns null or a well-formed PedagogyResult', async () => {
      const result = await reviewer.review('Sample explanation of derivatives.');
      if (result === null) return;
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(typeof result.recommendKeep).toBe('boolean');
      expect(result.rubric).toBeDefined();
      for (const k of ['accuracy', 'clarity', 'difficultyAppropriateness', 'syllabusAlignment'] as const) {
        expect(result.rubric[k]).toBeGreaterThanOrEqual(0);
        expect(result.rubric[k]).toBeLessThanOrEqual(1);
      }
    });

    it('review() NEVER throws — empty content', async () => {
      await expect(reviewer.review('')).resolves.toBeDefined();
    });

    it('review() NEVER throws — very long content (50k chars)', async () => {
      const long = 'x'.repeat(50_000);
      await expect(reviewer.review(long)).resolves.toBeDefined();
    });

    it('healthCheck() returns a boolean', async () => {
      const ok = await reviewer.healthCheck();
      expect(typeof ok).toBe('boolean');
    });
  });
}
