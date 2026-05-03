/**
 * src/blueprints/template-engine.ts
 *
 * Deterministic blueprint producer. Given (concept_id, exam_pack_id,
 * target_difficulty), returns a BlueprintDecisionsV1 chosen by rules
 * over the concept-graph + exam pack metadata.
 *
 * No LLM calls. No DB. No clocks (so the same input always returns the
 * same blueprint — testable + cacheable).
 *
 * The arbitrator (PR-2, deferred) will call this as its baseline before
 * deciding whether to override.
 */

import type {
  BlueprintDecisionsV1,
  BlueprintStage,
  BlueprintConstraint,
  DifficultyLabel,
  AtomKind,
} from './types';

export const TEMPLATE_VERSION = 'v1.0';

export interface TemplateInput {
  concept_id: string;
  exam_pack_id: string;
  target_difficulty: DifficultyLabel;
  /** Optional concept metadata override; usually pulled from concept-graph. */
  topic_family?: string;
  /** From the exam pack — drives the pyq_anchor_required_by_pack rationale. */
  requires_pyq_anchor?: boolean;
}

const GEOMETRIC_FAMILIES = new Set([
  'geometry', 'trigonometry', 'vectors', 'coordinate-geometry',
  'three-d-geometry', 'optics', 'mechanics',
]);

const ALGEBRAIC_FAMILIES = new Set([
  'algebra', 'matrices-determinants', 'complex-numbers', 'sequences-series',
  'binomial', 'permutations-combinations',
]);

const COMPUTATIONAL_FAMILIES = new Set([
  'calculus', 'integration', 'differential-equations',
  'probability', 'statistics',
]);

const PRACTICE_COUNT_BY_DIFFICULTY: Record<DifficultyLabel, number> = {
  easy: 5,
  medium: 4,
  hard: 3,
};

const DIFFICULTY_MIX_BY_TARGET = {
  easy:   { easy: 70, medium: 30, hard: 0 },
  medium: { easy: 30, medium: 50, hard: 20 },
  hard:   { easy: 10, medium: 40, hard: 50 },
} as const;

/**
 * Produce the deterministic baseline blueprint for the given input.
 */
export function buildTemplateBlueprint(input: TemplateInput): BlueprintDecisionsV1 {
  const family = (input.topic_family ?? inferTopicFamily(input.concept_id)).toLowerCase();
  const stages: BlueprintStage[] = [];
  const constraints: BlueprintConstraint[] = [];

  // Stage 1: intuition — atom_kind by topic family
  const intuitionAtom = pickIntuitionAtom(family);
  stages.push({
    id: 'intuition',
    atom_kind: intuitionAtom.atom_kind,
    rationale_id: intuitionAtom.rationale_id,
  });

  // Stage 2 (conditional): discovery — only when an interactive fits
  const discovery = pickDiscoveryAtom(family, input.target_difficulty);
  if (discovery) {
    stages.push({
      id: 'discovery',
      atom_kind: discovery.atom_kind,
      rationale_id: discovery.rationale_id,
    });
  }

  // Stage 3: formalism — always a worked_example for medium/hard
  if (input.target_difficulty !== 'easy') {
    stages.push({
      id: 'worked_example',
      atom_kind: 'worked_example',
      rationale_id: 'default_template',
    });
  }

  // Stage 4: practice — count + mix by target difficulty
  stages.push({
    id: 'practice',
    atom_kind: 'mcq',
    count: PRACTICE_COUNT_BY_DIFFICULTY[input.target_difficulty],
    difficulty_mix: { ...DIFFICULTY_MIX_BY_TARGET[input.target_difficulty] },
    rationale_id: 'default_practice_mix',
  });

  // Stage 5 (conditional): pyq_anchor when the pack requires it
  if (input.requires_pyq_anchor) {
    stages.push({
      id: 'pyq_anchor',
      atom_kind: 'pyq_anchor',
      rationale_id: 'pyq_anchor_required_by_pack',
    });
    constraints.push({ id: 'always_include_pyq_anchor', source: 'template' });
  }

  // Default constraint
  constraints.push({ id: 'no_jargon_first_definition', source: 'template' });

  return {
    version: 1,
    metadata: {
      concept_id: input.concept_id,
      exam_pack_id: input.exam_pack_id,
      target_difficulty: input.target_difficulty,
    },
    stages,
    constraints,
  };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function pickIntuitionAtom(family: string): { atom_kind: AtomKind; rationale_id: string } {
  if (GEOMETRIC_FAMILIES.has(family)) {
    return { atom_kind: 'visual_analogy', rationale_id: 'concept_is_geometric' };
  }
  if (ALGEBRAIC_FAMILIES.has(family)) {
    return { atom_kind: 'worked_example', rationale_id: 'concept_is_algebraic' };
  }
  if (COMPUTATIONAL_FAMILIES.has(family)) {
    return { atom_kind: 'visual_analogy', rationale_id: 'concept_is_computational' };
  }
  return { atom_kind: 'visual_analogy', rationale_id: 'default_template' };
}

function pickDiscoveryAtom(
  family: string,
  difficulty: DifficultyLabel,
): { atom_kind: AtomKind; rationale_id: string } | null {
  // Manipulables shine when the parameter space is small + the function
  // can be plotted. Geometric + computational families fit.
  if (GEOMETRIC_FAMILIES.has(family) && difficulty !== 'easy') {
    return { atom_kind: 'manipulable', rationale_id: 'param_space_small_enough' };
  }
  if (COMPUTATIONAL_FAMILIES.has(family) && difficulty !== 'easy') {
    return { atom_kind: 'manipulable', rationale_id: 'param_space_small_enough' };
  }
  return null;
}

function inferTopicFamily(concept_id: string): string {
  // concept_id convention: <family>-<exam>-<topic>; e.g. "limits-jee-1d"
  // or "vectors-jee", "complex-numbers-algebra"
  const head = concept_id.split('-')[0]?.toLowerCase() ?? '';
  if (head === 'limits' || head === 'derivatives' || head === 'integration') return 'calculus';
  if (head === 'vectors') return 'vectors';
  if (head === 'matrices' || head === 'determinants') return 'matrices-determinants';
  if (head === 'complex') return 'complex-numbers';
  if (head === 'trigonometric' || head === 'inverse') return 'trigonometry';
  if (head === 'straight' || head === 'circles' || head === 'parabola') return 'coordinate-geometry';
  if (head === 'three' || head === 'sets') return 'three-d-geometry';
  if (head === 'probability' || head === 'statistics') return 'statistics';
  return head || 'unknown';
}
