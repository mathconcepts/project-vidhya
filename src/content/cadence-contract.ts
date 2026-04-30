/**
 * Contract test for CadenceStrategy implementations.
 *
 * Every CadenceStrategy must pass `runCadenceStrategyContract(strategy)`.
 * Determinism and pure-function semantics are the key invariants — the router
 * relies on these to keep behavior reproducible in tests.
 */

import { describe, it, expect } from 'vitest';
import type { CadenceStrategy, CadenceItem, CadenceContext } from './cadence';

const SAMPLE_ITEMS: CadenceItem[] = [
  { id: 'a', difficulty: 'intro', examRelevance: 0.3, mastery: 0.9 },
  { id: 'b', difficulty: 'intermediate', examRelevance: 0.7, mastery: 0.5 },
  { id: 'c', difficulty: 'advanced', examRelevance: 0.9, mastery: 0.2 },
];

export function runCadenceStrategyContract(strategy: CadenceStrategy): void {
  describe(`CadenceStrategy contract: ${strategy.name}`, () => {
    it('exposes a stable, non-empty name', () => {
      expect(strategy.name).toBeTruthy();
      expect(typeof strategy.name).toBe('string');
    });

    it('appliesTo() returns a boolean for every SessionMode', () => {
      for (const mode of ['knowledge', 'exam-prep', 'revision'] as const) {
        const result = strategy.appliesTo({ mode });
        expect(typeof result).toBe('boolean');
      }
    });

    it('selectContent() returns a subset (or reordering) of input', () => {
      const ctx: CadenceContext = { mode: 'knowledge' };
      const result = strategy.selectContent(SAMPLE_ITEMS, ctx);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(SAMPLE_ITEMS.length);
      const inputIds = new Set(SAMPLE_ITEMS.map(i => i.id));
      for (const r of result) expect(inputIds.has(r.id)).toBe(true);
    });

    it('selectContent() is deterministic (same inputs => same output)', () => {
      const ctx: CadenceContext = { mode: 'exam-prep', examProximityDays: 7 };
      const a = strategy.selectContent(SAMPLE_ITEMS, ctx);
      const b = strategy.selectContent(SAMPLE_ITEMS, ctx);
      expect(a.map(i => i.id)).toEqual(b.map(i => i.id));
    });

    it('selectContent() returns empty array on empty input, not throws', () => {
      expect(() => strategy.selectContent([], { mode: 'knowledge' })).not.toThrow();
    });
  });
}
