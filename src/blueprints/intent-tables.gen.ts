/**
 * src/blueprints/intent-tables.gen.ts
 *
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Source of truth:
 *   data/curriculum/gate-em/intent-profiles.yml
 *   data/curriculum/gate-em/atomic-catalogue.json
 *
 * Regenerate:
 *   npm run gen:intent-tables
 *   (or: npx tsx scripts/generate-intent-tables.ts)
 *
 * Edit the YAML/JSON sources above, then regenerate — never edit this file
 * directly. A CI drift test (src/blueprints/__tests__/intent-tables-drift.test.ts)
 * fails the build if this file is out of sync with the sources.
 *
 * `presentation` hints from intent-profiles.yml are intentionally stripped
 * here — BlueprintDecisionsV1 (src/blueprints/types.ts) is a locked contract
 * that must never carry a presentation field; renderers derive presentation
 * separately from (intent × stage) later in the pipeline.
 */

import type { StageKind, AtomKind, DifficultyMix, DifficultyLabel } from './types';

export type IntentId =
  | 'foundation_learning'
  | 'concept_clarification'
  | 'guided_problem_solving'
  | 'pyq_targeted_practice';

export interface GeneratedStage {
  stage: StageKind;
  atom_kind: AtomKind;
  difficulty_mix?: DifficultyMix;
}

export const INTENT_STAGE_SEQUENCES: Record<IntentId, GeneratedStage[]> = {
  foundation_learning: [
    { stage: 'intuition', atom_kind: 'visual_analogy' },
    { stage: 'discovery', atom_kind: 'manipulable' },
    { stage: 'formalism', atom_kind: 'worked_example' },
    { stage: 'worked_example', atom_kind: 'worked_example' },
    { stage: 'practice', atom_kind: 'mcq', difficulty_mix: { easy: 50, medium: 40, hard: 10 } },
  ],
  concept_clarification: [
    { stage: 'formalism', atom_kind: 'worked_example' },
    { stage: 'worked_example', atom_kind: 'worked_example' },
    { stage: 'pyq_anchor', atom_kind: 'pyq_anchor' },
  ],
  guided_problem_solving: [
    { stage: 'discovery', atom_kind: 'guided_walkthrough' },
    { stage: 'worked_example', atom_kind: 'worked_example' },
    { stage: 'practice', atom_kind: 'mcq', difficulty_mix: { easy: 20, medium: 50, hard: 30 } },
  ],
  pyq_targeted_practice: [
    { stage: 'pyq_anchor', atom_kind: 'pyq_anchor' },
    { stage: 'practice', atom_kind: 'mcq', difficulty_mix: { easy: 30, medium: 50, hard: 20 } },
  ],
};

export const CONCEPT_DOMINANT_INTENT: Record<string, IntentId> = {
  'analytic-functions': 'pyq_targeted_practice',
  'cayley-hamilton': 'guided_problem_solving',
  'change-of-basis': 'concept_clarification',
  'complex-integration': 'guided_problem_solving',
  'complex-numbers': 'pyq_targeted_practice',
  'continuity': 'concept_clarification',
  'continuous-distributions': 'guided_problem_solving',
  'counting-principles': 'pyq_targeted_practice',
  'definite-integrals': 'guided_problem_solving',
  'derivatives-basic': 'guided_problem_solving',
  'determinants': 'concept_clarification',
  'diagonalization': 'pyq_targeted_practice',
  'differentiability': 'concept_clarification',
  'discrete-distributions': 'guided_problem_solving',
  'divergence-curl': 'pyq_targeted_practice',
  'eigenvalues': 'pyq_targeted_practice',
  'fourier-series': 'pyq_targeted_practice',
  'functions-combinatorics': 'pyq_targeted_practice',
  'gauss-divergence': 'guided_problem_solving',
  'graph-basics': 'pyq_targeted_practice',
  'graph-coloring': 'pyq_targeted_practice',
  'graph-connectivity': 'pyq_targeted_practice',
  'greens-theorem': 'guided_problem_solving',
  'group-theory-basics': 'pyq_targeted_practice',
  'hypothesis-testing': 'guided_problem_solving',
  'improper-integrals': 'concept_clarification',
  'interpolation': 'guided_problem_solving',
  'inverse-laplace': 'pyq_targeted_practice',
  'joint-distributions': 'pyq_targeted_practice',
  'laplace-applications': 'guided_problem_solving',
  'laplace-transform': 'concept_clarification',
  'least-squares': 'pyq_targeted_practice',
  'limits': 'pyq_targeted_practice',
  'line-integrals': 'foundation_learning',
  'linear-independence': 'pyq_targeted_practice',
  'lu-factorization': 'pyq_targeted_practice',
  'matrix-inverse': 'pyq_targeted_practice',
  'matrix-operations': 'pyq_targeted_practice',
  'maxima-minima': 'pyq_targeted_practice',
  'mean-value-theorems': 'guided_problem_solving',
  'multiple-integrals': 'pyq_targeted_practice',
  'multivariable-calculus': 'guided_problem_solving',
  'null-space-column-space': 'concept_clarification',
  'numerical-error-analysis': 'pyq_targeted_practice',
  'numerical-integration': 'guided_problem_solving',
  'numerical-linear-algebra': 'pyq_targeted_practice',
  'numerical-ode': 'guided_problem_solving',
  'ode-bernoulli': 'guided_problem_solving',
  'ode-exact': 'guided_problem_solving',
  'ode-first-order': 'guided_problem_solving',
  'ode-higher-order': 'guided_problem_solving',
  'ode-second-order-homo': 'pyq_targeted_practice',
  'ode-second-order-nonhomo': 'pyq_targeted_practice',
  'orthogonality': 'pyq_targeted_practice',
  'pde-basics': 'guided_problem_solving',
  'positive-definite-matrices': 'pyq_targeted_practice',
  'probability-basics': 'foundation_learning',
  'propositional-logic': 'pyq_targeted_practice',
  'quadratic-forms': 'pyq_targeted_practice',
  'random-variables': 'pyq_targeted_practice',
  'rank-nullity': 'concept_clarification',
  'recurrence-relations': 'pyq_targeted_practice',
  'regression-correlation': 'pyq_targeted_practice',
  'residue-calculus': 'pyq_targeted_practice',
  'root-finding': 'guided_problem_solving',
  'sampling-distributions': 'guided_problem_solving',
  'sequences': 'concept_clarification',
  'series': 'pyq_targeted_practice',
  'sets-relations': 'pyq_targeted_practice',
  'stokes-theorem': 'guided_problem_solving',
  'surface-integrals': 'pyq_targeted_practice',
  'svd': 'guided_problem_solving',
  'symmetric-matrices': 'pyq_targeted_practice',
  'systems-of-equations': 'pyq_targeted_practice',
  'taylor-laurent': 'pyq_targeted_practice',
  'vector-algebra-basics': 'pyq_targeted_practice',
  'vector-fields': 'pyq_targeted_practice',
  'vector-spaces': 'pyq_targeted_practice',
};

export const CONCEPT_INVENTORY_TOTALS: Record<string, number> = {
  'analytic-functions': 140,
  'cayley-hamilton': 45,
  'change-of-basis': 45,
  'complex-integration': 70,
  'complex-numbers': 140,
  'continuity': 45,
  'continuous-distributions': 180,
  'counting-principles': 45,
  'definite-integrals': 225,
  'derivatives-basic': 45,
  'determinants': 45,
  'diagonalization': 45,
  'differentiability': 45,
  'discrete-distributions': 135,
  'divergence-curl': 120,
  'eigenvalues': 180,
  'fourier-series': 180,
  'functions-combinatorics': 225,
  'gauss-divergence': 120,
  'graph-basics': 45,
  'graph-coloring': 45,
  'graph-connectivity': 45,
  'greens-theorem': 80,
  'group-theory-basics': 90,
  'hypothesis-testing': 180,
  'improper-integrals': 45,
  'interpolation': 105,
  'inverse-laplace': 90,
  'joint-distributions': 180,
  'laplace-applications': 45,
  'laplace-transform': 45,
  'least-squares': 45,
  'limits': 180,
  'line-integrals': 40,
  'linear-independence': 90,
  'lu-factorization': 90,
  'matrix-inverse': 45,
  'matrix-operations': 180,
  'maxima-minima': 225,
  'mean-value-theorems': 135,
  'multiple-integrals': 135,
  'multivariable-calculus': 270,
  'null-space-column-space': 45,
  'numerical-error-analysis': 105,
  'numerical-integration': 105,
  'numerical-linear-algebra': 105,
  'numerical-ode': 105,
  'ode-bernoulli': 90,
  'ode-exact': 45,
  'ode-first-order': 135,
  'ode-higher-order': 45,
  'ode-second-order-homo': 180,
  'ode-second-order-nonhomo': 270,
  'orthogonality': 90,
  'pde-basics': 315,
  'positive-definite-matrices': 45,
  'probability-basics': 315,
  'propositional-logic': 270,
  'quadratic-forms': 45,
  'random-variables': 315,
  'rank-nullity': 90,
  'recurrence-relations': 135,
  'regression-correlation': 135,
  'residue-calculus': 70,
  'root-finding': 105,
  'sampling-distributions': 180,
  'sequences': 45,
  'series': 180,
  'sets-relations': 270,
  'stokes-theorem': 80,
  'surface-integrals': 40,
  'svd': 45,
  'symmetric-matrices': 90,
  'systems-of-equations': 135,
  'taylor-laurent': 175,
  'vector-algebra-basics': 80,
  'vector-fields': 80,
  'vector-spaces': 135,
};

export const DIFFICULTY_LABEL_FROM_CATALOGUE: Record<'foundation' | 'standard' | 'stretch', DifficultyLabel> = {
  foundation: 'easy',
  standard: 'medium',
  stretch: 'hard',
};
