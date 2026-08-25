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
import {
  INTENT_STAGE_SEQUENCES,
  CONCEPT_DOMINANT_INTENT,
  CONCEPT_INVENTORY_TOTALS,
  type IntentId,
} from './intent-tables.gen';

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
// Intent-aware blueprints (T5 — codegen'd from data/curriculum/gate-em/intent-profiles.yml)
// ----------------------------------------------------------------------------

/** One rationale code per intent — see the additive block in types.ts. */
const RATIONALE_ID_BY_INTENT: Record<IntentId, string> = {
  pyq_targeted_practice: 'intent_pyq_practice',
  guided_problem_solving: 'intent_method_selection',
  concept_clarification: 'intent_property_recall',
  foundation_learning: 'intent_foundation',
};

const PRACTICE_COUNT_MIN = 3;
const PRACTICE_COUNT_MAX = 8;
/** Roughly a session-sized slice of the concept's full inventory target. */
const PRACTICE_COUNT_DIVISOR = 15;

/**
 * count = clamp(round(total_inventory / 15), 3, 8).
 *
 * `total_inventory` is the concept's full CONCEPT_INVENTORY_TOTALS figure —
 * everything Phase 4 generation eventually fills in. A single blueprint's
 * practice stage should feel like one sitting, not the whole backlog, so
 * this divides down to a session-sized slice and clamps it into a sane
 * [3, 8] range (matches validator.ts's "positive integer count" requirement
 * and mirrors buildTemplateBlueprint's PRACTICE_COUNT_BY_DIFFICULTY scale).
 */
function practiceCountFromInventory(totalInventory: number): number {
  const raw = Math.round(totalInventory / PRACTICE_COUNT_DIVISOR);
  return Math.min(PRACTICE_COUNT_MAX, Math.max(PRACTICE_COUNT_MIN, raw));
}

/**
 * Intent-aware alternative to buildTemplateBlueprint. When the concept has
 * a dominant intent (CONCEPT_DOMINANT_INTENT, computed by codegen from the
 * atomic catalogue's per-atom intent distribution — see intent-tables.gen.ts),
 * or an explicit `intent` override is passed, emits the stage sequence
 * INTENT_STAGE_SEQUENCES declares for that intent, with:
 *   - practice stages given a concrete count via practiceCountFromInventory()
 *     and their difficulty_mix passed through unchanged from the sequence;
 *   - every stage's rationale_id set from RATIONALE_ID_BY_INTENT (one of the
 *     four intent_* codes added to RATIONALE_CODES in types.ts).
 *
 * Returns null when the concept has no dominant intent and no explicit
 * override was given — callers fall back to buildTemplateBlueprint(), which
 * this function never calls and never mutates.
 */
export function buildIntentBlueprint(
  input: TemplateInput & { intent?: IntentId },
): BlueprintDecisionsV1 | null {
  const intent = input.intent ?? CONCEPT_DOMINANT_INTENT[input.concept_id];
  if (!intent) return null;

  const sequence = INTENT_STAGE_SEQUENCES[intent];
  const rationale_id = RATIONALE_ID_BY_INTENT[intent];
  const totalInventory = CONCEPT_INVENTORY_TOTALS[input.concept_id] ?? 0;

  const stages: BlueprintStage[] = sequence.map((generated) => {
    const stage: BlueprintStage = {
      id: generated.stage,
      atom_kind: generated.atom_kind,
      rationale_id,
    };
    if (generated.stage === 'practice') {
      stage.count = practiceCountFromInventory(totalInventory);
    }
    if (generated.difficulty_mix) {
      stage.difficulty_mix = { ...generated.difficulty_mix };
    }
    return stage;
  });

  const constraints: BlueprintConstraint[] = [
    { id: 'no_jargon_first_definition', source: 'template' },
  ];

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
