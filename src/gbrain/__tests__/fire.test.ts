/**
 * Tests for src/gbrain/fire.ts — FIRe-lite credit propagation (T11/B2).
 * Pure functions; no DB / network. Property tests target the guarantees
 * named in the plan: credit strictly decreasing per hop, implicit gain
 * bounded by the explicit review's gain, empty-edges no-op, penalty
 * bounded, determinism.
 */

import { describe, it, expect } from 'vitest';
import {
  buildEncompassingClosure,
  downClosureFor,
  upClosureFor,
  computeImplicitReviews,
  CREDIT_DISCOUNT,
  PENALTY_DISCOUNT,
  PENALTY_STABILITY_FLOOR_RATIO,
  PENALTY_STABILITY_ABSOLUTE_FLOOR,
  FIRE_MAX_DEPTH,
  type EncompassingEdge,
  type ConceptId,
} from '../fire';
import { reviewCard, type FsrsCard } from '../fsrs';

const NOW = new Date('2026-06-20T00:00:00.000Z');

function makeCard(stability: number, lastReviewAt = NOW.toISOString()): FsrsCard {
  return {
    stability,
    difficulty: 5,
    lastReviewAt,
    reps: 3,
    lapses: 0,
    dueAt: NOW.toISOString(), // overwritten by whatever computes it
  };
}

// ── buildEncompassingClosure (synthetic graphs) ─────────────────────────

describe('buildEncompassingClosure', () => {
  it('computes product-of-weights credit along a chain, within the depth cap', () => {
    const edges = new Map<ConceptId, EncompassingEdge[]>([
      ['a', [{ id: 'b', weight: 0.9 }]],
      ['b', [{ id: 'c', weight: 0.8 }]],
      ['c', [{ id: 'd', weight: 0.7 }]],
    ]);
    const closure = buildEncompassingClosure(edges, 'a', 2);
    expect(closure.get('b')).toBeCloseTo(0.9, 10);
    expect(closure.get('c')).toBeCloseTo(0.9 * 0.8, 10);
    expect(closure.has('d')).toBe(false); // depth 3, outside the cap
  });

  it('credit strictly decreases per hop along a single path (weights < 1)', () => {
    const edges = new Map<ConceptId, EncompassingEdge[]>([
      ['a', [{ id: 'b', weight: 0.9 }]],
      ['b', [{ id: 'c', weight: 0.8 }]],
    ]);
    const closure = buildEncompassingClosure(edges, 'a', 2);
    expect(closure.get('c')!).toBeLessThan(closure.get('b')!);
  });

  it('takes the MAX credit when a concept is reachable by multiple paths', () => {
    const edges = new Map<ConceptId, EncompassingEdge[]>([
      ['a', [{ id: 'b', weight: 0.3 }, { id: 'c', weight: 0.9 }]],
      ['c', [{ id: 'b', weight: 0.9 }]], // a -> c -> b gives 0.81, beats direct 0.3
    ]);
    const closure = buildEncompassingClosure(edges, 'a', 2);
    expect(closure.get('b')).toBeCloseTo(0.81, 10);
  });

  it('excludes the start concept from its own closure, even via a would-be cycle', () => {
    const edges = new Map<ConceptId, EncompassingEdge[]>([
      ['a', [{ id: 'b', weight: 0.5 }]],
      ['b', [{ id: 'a', weight: 0.5 }]], // back-edge (loader would refuse this in real data)
    ]);
    const closure = buildEncompassingClosure(edges, 'a', 2);
    expect(closure.has('a')).toBe(false);
  });

  it('ignores concepts with no edges at all — returns an empty closure', () => {
    const edges = new Map<ConceptId, EncompassingEdge[]>();
    expect(buildEncompassingClosure(edges, 'lonely', 2).size).toBe(0);
  });

  it('is deterministic', () => {
    const edges = new Map<ConceptId, EncompassingEdge[]>([
      ['a', [{ id: 'b', weight: 0.6 }, { id: 'c', weight: 0.4 }]],
      ['b', [{ id: 'd', weight: 0.5 }]],
    ]);
    const c1 = buildEncompassingClosure(edges, 'a', 2);
    const c2 = buildEncompassingClosure(edges, 'a', 2);
    expect([...c1.entries()].sort()).toEqual([...c2.entries()].sort());
  });

  it('respects a maxDepth of 1', () => {
    const edges = new Map<ConceptId, EncompassingEdge[]>([
      ['a', [{ id: 'b', weight: 0.9 }]],
      ['b', [{ id: 'c', weight: 0.8 }]],
    ]);
    const closure = buildEncompassingClosure(edges, 'a', 1);
    expect(closure.get('b')).toBeCloseTo(0.9, 10);
    expect(closure.has('c')).toBe(false);
  });
});

// ── downClosureFor / upClosureFor against the real gate-ma.yml graph ────

describe('downClosureFor / upClosureFor — real gate-ma.yml encompassing graph', () => {
  it('eigenvalues down-closure includes determinants (~0.7) and systems-of-equations (~0.5)', () => {
    const closure = downClosureFor('eigenvalues');
    expect(closure.get('determinants')).toBeCloseTo(0.7, 5);
    expect(closure.get('systems-of-equations')).toBeCloseTo(0.5, 5);
  });

  it('determinants up-closure includes eigenvalues (~0.7) — the reverse of the down edge', () => {
    const closure = upClosureFor('determinants');
    expect(closure.get('eigenvalues')).toBeCloseTo(0.7, 5);
  });

  it('a concept with no encompassing edges (non-LA) has an empty closure in both directions', () => {
    expect(downClosureFor('sequences').size).toBe(0);
    expect(upClosureFor('sequences').size).toBe(0);
  });

  it('respects the FIRE_MAX_DEPTH module constant (2)', () => {
    expect(FIRE_MAX_DEPTH).toBe(2);
  });
});

// ── computeImplicitReviews ───────────────────────────────────────────────

describe('computeImplicitReviews', () => {
  it('empty-edges no-op: a non-LA concept returns [] regardless of cards on hand', () => {
    const cards = new Map([['determinants', makeCard(10)]]);
    expect(computeImplicitReviews({ skillId: 'sequences', correct: true }, cards, NOW)).toEqual([]);
    expect(computeImplicitReviews({ skillId: 'sequences', correct: false }, cards, NOW)).toEqual([]);
  });

  it('no cards → no-op ("nothing due" is semantically correct)', () => {
    expect(computeImplicitReviews({ skillId: 'eigenvalues', correct: true }, new Map(), NOW)).toEqual([]);
  });

  it('a closure concept absent from cardsByConcept is skipped, not errored', () => {
    // downClosureFor('eigenvalues') has both determinants and
    // systems-of-equations; only give it a card for determinants.
    const cards = new Map([['determinants', makeCard(10)]]);
    const result = computeImplicitReviews({ skillId: 'eigenvalues', correct: true }, cards, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].conceptId).toBe('determinants');
  });

  it('CREDIT (correct): blends stability toward a hypothetical good review by credit × DISCOUNT', () => {
    const card = makeCard(10);
    const cards = new Map([['determinants', card]]);
    const [result] = computeImplicitReviews({ skillId: 'eigenvalues', correct: true }, cards, NOW);

    const credit = downClosureFor('eigenvalues').get('determinants')!;
    const target = reviewCard(card, 3, NOW).card;
    const expectedStability = card.stability + credit * CREDIT_DISCOUNT * (target.stability - card.stability);

    expect(result.newCard.stability).toBeCloseTo(expectedStability, 10);
  });

  it('lastReviewAt is UNCHANGED on a credit application (not a real review event)', () => {
    const card = makeCard(10, '2026-06-01T00:00:00.000Z');
    const cards = new Map([['determinants', card]]);
    const [result] = computeImplicitReviews({ skillId: 'eigenvalues', correct: true }, cards, NOW);
    expect(result.newCard.lastReviewAt).toBe('2026-06-01T00:00:00.000Z');
    expect(result.newCard.difficulty).toBe(card.difficulty);
    expect(result.newCard.reps).toBe(card.reps);
    expect(result.newCard.lapses).toBe(card.lapses);
  });

  it('PENALTY (incorrect): blends toward a hypothetical lapse by credit × PENALTY_DISCOUNT', () => {
    const card = makeCard(20);
    const cards = new Map([['eigenvalues', card]]);
    const [result] = computeImplicitReviews({ skillId: 'determinants', correct: false }, cards, NOW);

    const credit = upClosureFor('determinants').get('eigenvalues')!;
    const target = reviewCard(card, 1, NOW).card;
    const blended = card.stability + credit * PENALTY_DISCOUNT * (target.stability - card.stability);
    const floor = Math.max(PENALTY_STABILITY_ABSOLUTE_FLOOR, card.stability * PENALTY_STABILITY_FLOOR_RATIO);
    const expectedStability = Math.max(blended, floor);

    expect(result.newCard.stability).toBeCloseTo(expectedStability, 10);
  });

  it('penalty bounded: newStability never drops below max(0.5, stability × 0.5), across many starting stabilities', () => {
    for (const stability of [0.6, 1, 2, 5, 10, 50, 200]) {
      const card = makeCard(stability);
      const cards = new Map([['eigenvalues', card]]);
      const [result] = computeImplicitReviews({ skillId: 'determinants', correct: false }, cards, NOW);
      const floor = Math.max(0.5, stability * 0.5);
      expect(result.newCard.stability).toBeGreaterThanOrEqual(floor - 1e-9);
    }
  });

  it('total implicit stability gain never exceeds the explicit review\'s gain (credit ≤ 1, discount ≤ 1)', () => {
    // Exercise several (skillId, concept, stability) triples pulled from the
    // real closure so this checks the actual exported function's math.
    const cases: Array<{ skillId: string; conceptId: string }> = [
      { skillId: 'eigenvalues', conceptId: 'determinants' },
      { skillId: 'eigenvalues', conceptId: 'systems-of-equations' },
      { skillId: 'svd', conceptId: 'eigenvalues' },
      { skillId: 'gram-schmidt', conceptId: 'inner-product-spaces' },
      { skillId: 'matrix-inverse', conceptId: 'matrix-operations' },
    ];
    for (const { skillId, conceptId } of cases) {
      for (const stability of [0.6, 3, 15, 80]) {
        const card = makeCard(stability);
        const cards = new Map([[conceptId, card]]);
        const [result] = computeImplicitReviews({ skillId, correct: true }, cards, NOW);
        const target = reviewCard(card, 3, NOW).card;
        const explicitGain = target.stability - card.stability;
        const implicitGain = result.newCard.stability - card.stability;
        expect(implicitGain).toBeLessThanOrEqual(explicitGain + 1e-9);
        expect(implicitGain).toBeGreaterThanOrEqual(0); // credit is always positive here
      }
    }
  });

  it('is deterministic: identical inputs produce identical output', () => {
    const cards = new Map([
      ['determinants', makeCard(10)],
      ['systems-of-equations', makeCard(4)],
    ]);
    const r1 = computeImplicitReviews({ skillId: 'eigenvalues', correct: true }, cards, NOW);
    const r2 = computeImplicitReviews({ skillId: 'eigenvalues', correct: true }, cards, NOW);
    expect(r1).toEqual(r2);
  });

  it('idempotent under attempt dedup: calling twice for the same (already-applied) state does not compound', () => {
    // Simulates the dedup guarantee at the caller level: if update() is
    // never invoked twice for the same attempt, computeImplicitReviews is
    // never invoked twice for it either, so there is nothing to compound.
    // This test locks that computeImplicitReviews itself has no hidden
    // internal state across calls (pure function, no memoized mutation of
    // its inputs).
    const card = makeCard(10);
    const cards = new Map([['determinants', card]]);
    computeImplicitReviews({ skillId: 'eigenvalues', correct: true }, cards, NOW);
    // The original card object must be untouched by the call above.
    expect(card.stability).toBe(10);
    const [result] = computeImplicitReviews({ skillId: 'eigenvalues', correct: true }, cards, NOW);
    expect(result.newCard.stability).toBe(
      computeImplicitReviews({ skillId: 'eigenvalues', correct: true }, cards, NOW)[0].newCard.stability,
    );
  });
});
