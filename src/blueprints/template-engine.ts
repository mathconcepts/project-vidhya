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
  DifficultyMix,
  AtomKind,
} from './types';
import {
  INTENT_STAGE_SEQUENCES,
  CONCEPT_DOMINANT_INTENT,
  CONCEPT_INVENTORY_TOTALS,
  FAMILY_STAGE_SEQUENCES,
  CONCEPT_TEMPLATE_FAMILY,
  type IntentId,
  type TemplateFamilyId,
  type GeneratedStage,
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

// ----------------------------------------------------------------------------
// Template families (W2.1/E11) — codegen'd from
// data/curriculum/gate-em/template-families.yml via
// src/blueprints/intent-tables.gen.ts's FAMILY_STAGE_SEQUENCES /
// CONCEPT_TEMPLATE_FAMILY.
//
// Precedence (E11, locked): when a concept resolves to a template family
// (CONCEPT_TEMPLATE_FAMILY covers all 101 concept-graph concepts as of
// 2026-08-27), the family's stage TOPOLOGY (stage ids, atom_kinds, order)
// REPLACES this file's old 3-way GEOMETRIC/ALGEBRAIC/COMPUTATIONAL heuristic
// below (pickIntuitionAtom/pickDiscoveryAtom + inferTopicFamily) — that
// heuristic now serves ONLY concept_ids the family table doesn't cover
// (concepts outside the GATE-EM concept graph, e.g. JEE's '-jee'-suffixed
// ids used by presets.ts and the existing test suite). Practice-stage
// difficulty_mix is preserved from the concept's dominant catalogue intent
// where one exists (practiceDifficultyMixFor below), falling back to
// DIFFICULTY_MIX_BY_TARGET — never invented fresh per family.
// ----------------------------------------------------------------------------

/** One rationale code per template family — see the additive block in types.ts. */
const RATIONALE_ID_BY_FAMILY: Record<TemplateFamilyId, string> = {
  matrix: 'family_matrix',
  eigen: 'family_eigen',
  limit: 'family_limit',
  derivative: 'family_derivative',
  integral: 'family_integral',
  optimization: 'family_optimization',
  vector: 'family_vector',
  ode: 'family_ode',
  pde: 'family_pde',
  complex: 'family_complex',
  probability: 'family_probability',
  statistics: 'family_statistics',
  numerical: 'family_numerical',
  discrete: 'family_discrete',
};

/** The family a concept resolves to, or null when uncovered (legacy fallback applies). */
function resolveFamilyStages(concept_id: string): { family: TemplateFamilyId; sequence: GeneratedStage[] } | null {
  const family = CONCEPT_TEMPLATE_FAMILY[concept_id];
  if (!family) return null;
  const sequence = FAMILY_STAGE_SEQUENCES[family];
  if (!sequence || sequence.length === 0) return null;
  return { family, sequence };
}

/**
 * Practice-stage difficulty_mix for a family-derived blueprint: the concept's
 * dominant catalogue intent's own practice-stage mix when one exists
 * (preserving the calibrated intent-lane mixes — E11's "intent lane's
 * difficulty mixes preserved" clause), else the existing target-difficulty
 * table (never a third, invented default).
 */
function practiceDifficultyMixFor(concept_id: string, target_difficulty: DifficultyLabel): DifficultyMix {
  const intent = CONCEPT_DOMINANT_INTENT[concept_id];
  if (intent) {
    const practiceEntry = INTENT_STAGE_SEQUENCES[intent].find((s) => s.stage === 'practice');
    if (practiceEntry?.difficulty_mix) return { ...practiceEntry.difficulty_mix };
  }
  return { ...DIFFICULTY_MIX_BY_TARGET[target_difficulty] };
}

/** Build a BlueprintDecisionsV1 from a resolved family's stage sequence. */
function buildFromFamilySequence(
  input: TemplateInput,
  family: TemplateFamilyId,
  sequence: GeneratedStage[],
): BlueprintDecisionsV1 {
  const rationale_id = RATIONALE_ID_BY_FAMILY[family];
  const totalInventory = CONCEPT_INVENTORY_TOTALS[input.concept_id] ?? 0;

  const stages: BlueprintStage[] = sequence.map((generated) => {
    const stage: BlueprintStage = {
      id: generated.stage,
      atom_kind: generated.atom_kind,
      rationale_id,
    };
    if (generated.stage === 'practice') {
      stage.count = practiceCountFromInventory(totalInventory);
      stage.difficulty_mix = practiceDifficultyMixFor(input.concept_id, input.target_difficulty);
    }
    return stage;
  });

  const constraints: BlueprintConstraint[] = [
    { id: 'no_jargon_first_definition', source: 'template' },
  ];

  if (input.requires_pyq_anchor && !stages.some((s) => s.id === 'pyq_anchor')) {
    stages.push({
      id: 'pyq_anchor',
      atom_kind: 'pyq_anchor',
      rationale_id: 'pyq_anchor_required_by_pack',
    });
    constraints.push({ id: 'always_include_pyq_anchor', source: 'template' });
  }

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

/**
 * Produce the deterministic baseline blueprint for the given input.
 *
 * W2.1/E11: tries the template-family table FIRST (resolveFamilyStages) —
 * this replaces the old 3-way topic-family heuristic below for any concept
 * template-families.yml covers. The heuristic (inferTopicFamily +
 * pickIntuitionAtom/pickDiscoveryAtom) survives as the fallback for concept
 * ids outside the concept graph (see the precedence note above the family
 * helpers).
 */
export function buildTemplateBlueprint(input: TemplateInput): BlueprintDecisionsV1 {
  const familyMatch = resolveFamilyStages(input.concept_id);
  if (familyMatch) {
    return buildFromFamilySequence(input, familyMatch.family, familyMatch.sequence);
  }

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
 * Intent-aware alternative to buildTemplateBlueprint. Precedence (W2.1/E11):
 *   1. An explicit `intent` override ALWAYS wins — the caller asked for that
 *      lane specifically, family topology never overrides an explicit ask.
 *   2. Otherwise, when the concept resolves to a template family
 *      (CONCEPT_TEMPLATE_FAMILY — covers all 101 concept-graph concepts as
 *      of 2026-08-27), the family's stage topology is used — "family
 *      overrides the intent default", per E11 — via the same
 *      buildFromFamilySequence() buildTemplateBlueprint() uses, so the two
 *      builders can never silently diverge on how a family renders.
 *   3. Otherwise (no explicit intent, no family), falls back to the
 *      concept's dominant catalogue intent (CONCEPT_DOMINANT_INTENT,
 *      computed by codegen from the atomic catalogue's per-atom intent
 *      distribution). Emits INTENT_STAGE_SEQUENCES for that intent, with:
 *      - practice stages given a concrete count via practiceCountFromInventory()
 *        and their difficulty_mix passed through unchanged from the sequence;
 *      - every stage's rationale_id set from RATIONALE_ID_BY_INTENT (one of
 *        the four intent_* codes added to RATIONALE_CODES in types.ts).
 *
 * Returns null when none of the three resolve — callers fall back to
 * buildTemplateBlueprint(), which this function never calls and never
 * mutates.
 */
export function buildIntentBlueprint(
  input: TemplateInput & { intent?: IntentId },
): BlueprintDecisionsV1 | null {
  if (!input.intent) {
    const familyMatch = resolveFamilyStages(input.concept_id);
    if (familyMatch) {
      return buildFromFamilySequence(input, familyMatch.family, familyMatch.sequence);
    }
  }

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
