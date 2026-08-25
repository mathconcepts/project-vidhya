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
  'cayley-hamilton': 'guided_problem_solving',
  'change-of-basis': 'concept_clarification',
  'determinants': 'concept_clarification',
  'diagonalization': 'pyq_targeted_practice',
  'eigenvalues': 'pyq_targeted_practice',
  'least-squares': 'pyq_targeted_practice',
  'linear-independence': 'pyq_targeted_practice',
  'lu-factorization': 'pyq_targeted_practice',
  'matrix-inverse': 'pyq_targeted_practice',
  'matrix-operations': 'pyq_targeted_practice',
  'null-space-column-space': 'concept_clarification',
  'orthogonality': 'pyq_targeted_practice',
  'positive-definite-matrices': 'pyq_targeted_practice',
  'quadratic-forms': 'pyq_targeted_practice',
  'rank-nullity': 'concept_clarification',
  'svd': 'guided_problem_solving',
  'symmetric-matrices': 'pyq_targeted_practice',
  'systems-of-equations': 'pyq_targeted_practice',
  'vector-spaces': 'pyq_targeted_practice',
};

export const CONCEPT_INVENTORY_TOTALS: Record<string, number> = {
  'cayley-hamilton': 45,
  'change-of-basis': 45,
  'determinants': 45,
  'diagonalization': 45,
  'eigenvalues': 180,
  'least-squares': 45,
  'linear-independence': 90,
  'lu-factorization': 90,
  'matrix-inverse': 45,
  'matrix-operations': 180,
  'null-space-column-space': 45,
  'orthogonality': 90,
  'positive-definite-matrices': 45,
  'quadratic-forms': 45,
  'rank-nullity': 90,
  'svd': 45,
  'symmetric-matrices': 90,
  'systems-of-equations': 135,
  'vector-spaces': 135,
};

export const DIFFICULTY_LABEL_FROM_CATALOGUE: Record<'foundation' | 'standard' | 'stretch', DifficultyLabel> = {
  foundation: 'easy',
  standard: 'medium',
  stretch: 'hard',
};
