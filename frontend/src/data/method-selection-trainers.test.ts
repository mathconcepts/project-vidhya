/**
 * method-selection-trainers.test.ts
 *
 * The D2 migration receipt. TheoremWizardPage and DistributionSelectorPage
 * used to carry their content as hardcoded objects; it now lives here as
 * data. These tests hold the migration to two promises:
 *
 *   1. Nothing was lost. Every prompt, hint and answer the two pages
 *      showed before the migration is still present, verbatim.
 *   2. The data is legal against the SHARED validator — the one the
 *      renderer and the `ci:interactive-specs` gate both run — so a
 *      trainer cannot drift into a shape the widget refuses to draw.
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_METHOD_SELECTION_TRAINERS,
  CONCEPT_TO_WIZARD_NODE,
  DISTRIBUTION_TRAINER,
  THEOREM_WIZARD_TRAINERS,
  wizardStartNodeForConcept,
} from './method-selection-trainers';
import { __testing } from '@/components/lesson/interactives/types';

/**
 * The exact strings the two pages rendered before the migration, copied
 * from the pre-migration source. If a future edit rewrites one, this test
 * fails and the edit has to be a deliberate content decision rather than
 * a casualty of a refactor.
 */
const PRE_MIGRATION_ANSWERS: Record<string, string[]> = {
  'linear-algebra': [
    'det(A). If det(A) ≠ 0, A is invertible. If det(A) = 0, A is singular (not invertible). This follows directly from the definition of the determinant and the invertibility equivalence theorem.',
    'nullity(T) = 0, i.e. the null space is {0}. By the Rank-Nullity Theorem, rank(T) = n − nullity(T) = n, so the map is also surjective — injective and surjective square maps are equivalent.',
    'If A is diagonalisable: A = PDP⁻¹, then Aⁿ = PDⁿP⁻¹. Computing Dⁿ is trivial — raise each diagonal entry to the nth power. If A is not diagonalisable, use Cayley-Hamilton to reduce high powers modulo the characteristic polynomial.',
    'All eigenvalues > 0 → positive definite. All ≥ 0 → positive semi-definite. All < 0 → negative definite. Mixed signs → indefinite. The Spectral Theorem guarantees real eigenvalues and orthonormal eigenvectors for symmetric A, so the sign of eigenvalues is well-defined.',
  ],
  'vector-calculus': [
    "Green's Theorem: ∮_C F·dr = ∬_D (∂Q/∂x − ∂P/∂y) dA. Use it when the curve is closed, simple, and the region D is well-defined. F = (P, Q) must have continuous partial derivatives on D.",
    "Stokes' Theorem: ∬_S (curl F)·dS = ∮_{∂S} F·dr. The surface S must be orientable and smooth; the boundary curve ∂S must have the orientation induced by S's normal (right-hand rule).",
    'The Divergence Theorem: ∬_S F·dS = ∭_V (div F) dV. Use when S is the closed boundary of a solid region V and F has continuous partial derivatives on V. Check that div F = ∂F₁/∂x + ∂F₂/∂y + ∂F₃/∂z is simpler than the surface integral.',
  ],
  'distribution-selector': [
    'Poisson(λ=8). Use the Poisson distribution whenever you count the number of occurrences of an independent event in a fixed interval, given only the mean rate λ. P(X=k) = e^{−λ} λ^k / k!.',
    'Binomial(n=50, p=0.02). The Binomial counts successes in n independent Bernoulli trials with constant probability p. P(X=k) = C(n,k) p^k (1−p)^{n−k}. (Poisson approximation Poisson(1) also works here since n is large and p small, but Binomial is exact.)',
    'Geometric(p=0.30). The Geometric distribution models the number of independent Bernoulli trials needed to obtain the first success. P(X=k) = (1−p)^{k−1} p. Mean = 1/p = 3.33 surveys on average.',
    'Uniform(a=0, b=15). The Continuous Uniform distribution on [a,b] has PDF f(x) = 1/(b−a). Mean = (a+b)/2 = 7.5 min; Var = (b−a)²/12 = 18.75 min².',
    'Normal(μ=100, σ=15). Standardise: Z = (130−100)/15 = 2. P(X>130) = P(Z>2) ≈ 0.0228 (from the standard normal table). By the Central Limit Theorem, aggregated continuous measurements cluster around the Normal.',
    'Exponential(λ=1/200). P(X>300) = e^{−λt} = e^{−300/200} = e^{−1.5} ≈ 0.223. The memoryless property: the remaining lifetime has the same distribution regardless of how long it has already run.',
  ],
};

describe('method-selection trainers — legal specs', () => {
  it.each(ALL_METHOD_SELECTION_TRAINERS.map((t) => [t.id, t] as const))(
    '%s passes the shared interactive-spec validator',
    (_id, trainer) => {
      const result = __testing.validateSpec(trainer.spec);
      expect(result.ok, result.ok ? '' : result.reason).toBe(true);
    },
  );

  it.each(ALL_METHOD_SELECTION_TRAINERS.map((t) => [t.id, t] as const))(
    '%s is a branching trainer with at least one sanctioned route and at least one walkable dead end',
    (_id, trainer) => {
      const branches = trainer.spec.branches!;
      expect(branches).toBeDefined();
      expect(branches.leaves.some((l) => l.best === true)).toBe(true);
      expect(branches.leaves.some((l) => l.best !== true)).toBe(true);
    },
  );

  it.each(ALL_METHOD_SELECTION_TRAINERS.map((t) => [t.id, t] as const))(
    '%s writes every leaf reason as a sentence, never a code',
    (_id, trainer) => {
      for (const leaf of trainer.spec.branches!.leaves) {
        expect(leaf.reason.trim().split(/\s+/).length).toBeGreaterThanOrEqual(4);
        expect(leaf.reason).not.toMatch(/^[a-z0-9_]+$/);
      }
    },
  );
});

describe('method-selection trainers — the migration lost nothing', () => {
  it.each(Object.entries(PRE_MIGRATION_ANSWERS))(
    '%s keeps every pre-migration answer verbatim',
    (id, answers) => {
      const trainer =
        id === 'distribution-selector' ? DISTRIBUTION_TRAINER : THEOREM_WIZARD_TRAINERS[id];
      const kept = trainer.spec.steps.map((s) => s.answer);
      for (const answer of answers) expect(kept).toContain(answer);
      expect(kept).toHaveLength(answers.length);
    },
  );

  it('keeps a hint on every migrated step — the hints became the tree questions, not casualties', () => {
    for (const trainer of ALL_METHOD_SELECTION_TRAINERS) {
      for (const step of trainer.spec.steps) {
        expect(step.hint && step.hint.length > 0).toBe(true);
      }
    }
  });

  it('routes every theorem-wizard module the page ships, D2 pair plus wave-1 single-fork trainers', () => {
    expect(Object.keys(THEOREM_WIZARD_TRAINERS).sort()).toEqual([
      'differential-equations',
      'graph-theory',
      'linear-algebra',
      'numerical-methods',
      'transform-theory',
      'vector-calculus',
    ]);
  });
});

describe('micro-solver wave 1 — single-fork trainers (2026-09-03)', () => {
  const WAVE_1_IDS = ['numerical-methods', 'transform-theory', 'graph-theory', 'differential-equations'];

  it.each(WAVE_1_IDS)('%s is exactly a single-node tree — a micro-solver, not a multi-fork tree', (id) => {
    const trainer = THEOREM_WIZARD_TRAINERS[id];
    expect(trainer).toBeDefined();
    expect(trainer.spec.branches!.nodes).toHaveLength(1);
  });

  it.each(WAVE_1_IDS)('%s\'s single step is derived from its node/best-leaf, not a second copy of the content', (id) => {
    const trainer = THEOREM_WIZARD_TRAINERS[id];
    const node = trainer.spec.branches!.nodes[0];
    const bestLeaf = trainer.spec.branches!.leaves.find((l) => l.best === true)!;
    expect(trainer.spec.steps).toHaveLength(1);
    expect(trainer.spec.steps[0].prompt).toBe(node.question);
    expect(bestLeaf).toBeDefined();
  });

  it('every wave-1 concept in CONCEPT_TO_WIZARD_NODE resolves to that trainer\'s one node', () => {
    for (const trainerId of WAVE_1_IDS) {
      const nodeId = THEOREM_WIZARD_TRAINERS[trainerId].spec.branches!.nodes[0].id;
      const concepts = CONCEPT_TO_WIZARD_NODE[trainerId];
      expect(Object.keys(concepts).length).toBeGreaterThan(0);
      for (const mapped of Object.values(concepts)) {
        expect(mapped).toBe(nodeId);
      }
    }
  });

  it('transform-theory tags all three transform concepts to its one shared fork', () => {
    expect(wizardStartNodeForConcept('transform-theory', 'laplace-transform')).toBe('tt_transform_pick');
    expect(wizardStartNodeForConcept('transform-theory', 'fourier-transform')).toBe('tt_transform_pick');
    expect(wizardStartNodeForConcept('transform-theory', 'z-transform')).toBe('tt_transform_pick');
  });
});

describe('CONCEPT_TO_WIZARD_NODE — the startAt deep-link map', () => {
  function trainerFor(trainerId: string) {
    if (trainerId === 'distribution-selector') return DISTRIBUTION_TRAINER;
    return THEOREM_WIZARD_TRAINERS[trainerId];
  }

  it('every mapped node id is a real node in that trainer\'s own tree — no stale/typo\'d targets', () => {
    for (const [trainerId, concepts] of Object.entries(CONCEPT_TO_WIZARD_NODE)) {
      const trainer = trainerFor(trainerId);
      expect(trainer, `no trainer registered for "${trainerId}"`).toBeDefined();
      const nodeIds = new Set(trainer.spec.branches!.nodes.map((n) => n.id));
      for (const [concept, nodeId] of Object.entries(concepts)) {
        expect(
          nodeIds.has(nodeId),
          `${trainerId}/${concept} -> "${nodeId}" is not a node in ${trainerId}'s tree`,
        ).toBe(true);
      }
    }
  });

  it('resolves a mapped concept to its fork', () => {
    expect(wizardStartNodeForConcept('linear-algebra', 'determinants')).toBe('la_invertible');
    expect(wizardStartNodeForConcept('linear-algebra', 'rank-nullity')).toBe('la_injective');
    expect(wizardStartNodeForConcept('vector-calculus', 'stokes-theorem')).toBe('vc_space_pick');
    expect(wizardStartNodeForConcept('distribution-selector', 'discrete-distributions')).toBe(
      'ds_discrete',
    );
  });

  it('returns undefined for an unmapped concept, an unmapped trainer, or no concept — never a guess', () => {
    expect(wizardStartNodeForConcept('linear-algebra', 'vector-spaces')).toBeUndefined();
    expect(wizardStartNodeForConcept('some-unknown-trainer', 'determinants')).toBeUndefined();
    expect(wizardStartNodeForConcept('linear-algebra', null)).toBeUndefined();
    expect(wizardStartNodeForConcept('linear-algebra', undefined)).toBeUndefined();
  });
});
