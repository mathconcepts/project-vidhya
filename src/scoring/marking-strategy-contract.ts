/**
 * Contract test for MarkingStrategy implementations (plan D11).
 *
 * Every MarkingStrategy must pass `runMarkingStrategyContract(strategy)`.
 * This catches contract violations at PR time, before a student is graded
 * under them. Mirrors the four existing contract tests
 * (`runAnswerVerifierContract`, `runContentVerifierContract`,
 * `runCadenceStrategyContract`, `runPedagogyReviewerContract`) — same shape,
 * same one-line invocation.
 *
 * Usage in tests:
 *   import { describe } from 'vitest';
 *   import { runMarkingStrategyContract } from '@/scoring/marking-strategy-contract';
 *   import { myStrategy } from '../my-strategy';
 *
 *   describe('myStrategy', () => {
 *     runMarkingStrategyContract(myStrategy);
 *   });
 *
 * ── What it asserts, and why these ───────────────────────────────────────
 *
 * The invariants below are the ones that, if broken, silently corrupt a
 * student's marks rather than throwing something a developer would notice:
 *
 *   1. A correct answer earns POSITIVE marks, never more than `max`. A
 *      strategy that awards more than the item is worth inflates a score
 *      no rank list would agree with.
 *   2. A wrong answer earns exactly the declared negative — the number the
 *      caller asked for, sign included, not "some penalty".
 *   3. A skipped answer earns exactly 0. Not −0, not a penalty. This is
 *      the single rule students plan their whole attempt strategy around.
 *   4. Grading is DETERMINISTIC. Same item, same response, same params →
 *      byte-identical result. A grade that depends on a clock, a random
 *      draw, or accumulated state cannot be replayed on an idempotent
 *      retry, and this repo's grading paths all retry.
 *   5. `max` echoes the item's marks — a caller summing `earned/max` is
 *      entitled to a denominator it recognises.
 *   6. Identity: a non-empty id, a non-empty description, at least one
 *      supported kind, and a refusal (not a zero) for a kind it does not
 *      support.
 *
 * ── Providing a fixture ──────────────────────────────────────────────────
 *
 * A strategy for a different exam grades different question kinds, so the
 * contract cannot hardcode one item shape. Pass a `MarkingStrategyFixture`
 * describing one correct / wrong / skipped triple; the built-in strategy's
 * fixture is exported below as a worked example.
 */

import { describe, it, expect } from 'vitest';
import type {
  MarkingStrategy,
  MarkingStrategyItem,
  MarkingStrategyParams,
  MarkingStrategyResponse,
} from './marking-strategy';

export interface MarkingStrategyFixture {
  /** An item this strategy can grade. */
  item: MarkingStrategyItem;
  /** Params as they would arrive from `assessment_contracts.marking.<kind>.params`. */
  params?: MarkingStrategyParams;
  /** A response that is fully correct for `item`. */
  correct: MarkingStrategyResponse;
  /** A response that is wrong for `item`. */
  wrong: MarkingStrategyResponse;
  /** A skipped response for `item`. */
  skipped: MarkingStrategyResponse;
  /**
   * Marks the wrong response must earn, SIGNED (negative = deduction,
   * 0 = no penalty). Declared by the fixture rather than inferred, because
   * "what a wrong answer costs" is precisely the fact the contract exists
   * to pin down.
   */
  expectedWrongMarks: number;
  /**
   * A question kind this strategy does NOT support, used to prove it
   * refuses by name instead of returning a zero. Omit only if the strategy
   * genuinely claims every kind.
   */
  unsupportedKind?: string;
}

export function runMarkingStrategyContract(
  strategy: MarkingStrategy,
  fixture: MarkingStrategyFixture,
): void {
  describe(`MarkingStrategy contract: ${strategy.id}`, () => {
    const { item, params, correct, wrong, skipped, expectedWrongMarks } = fixture;

    it('exposes a stable, non-empty id', () => {
      expect(typeof strategy.id).toBe('string');
      expect(strategy.id.trim()).not.toBe('');
    });

    it('describes what arithmetic it applies', () => {
      expect(typeof strategy.description).toBe('string');
      expect(strategy.description.trim()).not.toBe('');
    });

    it('declares at least one supported question kind, including the fixture item kind', () => {
      expect(strategy.supportedKinds.length).toBeGreaterThan(0);
      expect(strategy.supportedKinds).toContain(item.kind);
    });

    it('a correct answer earns positive marks, never more than max', async () => {
      const r = await strategy.grade(item, correct, params);
      expect(r.earned).toBeGreaterThan(0);
      expect(r.earned).toBeLessThanOrEqual(r.max);
      expect(r.max).toBe(item.marks);
    });

    it('a wrong answer earns exactly the declared negative', async () => {
      const r = await strategy.grade(item, wrong, params);
      expect(r.earned).toBeCloseTo(expectedWrongMarks, 12);
      expect(r.max).toBe(item.marks);
    });

    it('a skipped answer earns exactly 0 — no marks, no penalty', async () => {
      const r = await strategy.grade(item, skipped, params);
      expect(r.earned).toBe(0);
      expect(r.max).toBe(item.marks);
    });

    it('grading is deterministic — same input, byte-identical result', async () => {
      for (const response of [correct, wrong, skipped]) {
        const a = await strategy.grade(item, response, params);
        const b = await strategy.grade(item, response, params);
        expect(a).toEqual(b);
      }
    });

    it('reports correctness consistently with the marks it awards', async () => {
      const c = await strategy.grade(item, correct, params);
      const w = await strategy.grade(item, wrong, params);
      expect(c.casFinalAnswerCorrect).toBe(true);
      expect(w.casFinalAnswerCorrect).toBe(false);
    });

    if (fixture.unsupportedKind !== undefined) {
      const unsupported = fixture.unsupportedKind;

      it('does not claim the unsupported kind the fixture names', () => {
        expect(strategy.supportedKinds).not.toContain(unsupported);
      });

      it('refuses an unsupported question kind by name instead of returning 0', async () => {
        const alien: MarkingStrategyItem = { ...item, kind: unsupported };
        const alienResponse: MarkingStrategyResponse = { ...correct, kind: unsupported };
        await expect(strategy.grade(alien, alienResponse, params)).rejects.toThrow(
          new RegExp(unsupported),
        );
      });
    }
  });
}
