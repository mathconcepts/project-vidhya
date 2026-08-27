/**
 * src/blueprints/to-unit-spec.ts
 *
 * Translator: BlueprintDecisionsV1 → CurriculumUnitSpec input for the
 * existing curriculum-unit-orchestrator.
 *
 * Pure-function. No DB. No LLM. Used at the orchestrator's boundary
 * when a generation_run has a blueprint_id set.
 *
 * Backward-compat contract: a blueprint produces a CurriculumUnitSpec
 * that's structurally equivalent to what RunLauncher would have built
 * from raw config. The orchestrator path itself is unchanged — only the
 * SOURCE of the spec changes.
 *
 * W2.2/E12: the translation output also carries `stage_anchors` — one
 * deterministic anchor id per `atom_kinds[]` position, in the same order
 * (see src/blueprints/anchor-id.ts). Optional-additive:
 * CurriculumUnitSpec (src/generation/curriculum-unit-orchestrator.ts)
 * declares no `stage_anchors` field and reads `spec.*` by name only, so it
 * ignores the extra property entirely — idempotent re-call on `unit.id` is
 * unaffected. The locked `BlueprintDecisionsV1` (types.ts) is untouched;
 * anchors are computed here, on the way OUT of the translator, never stored
 * on the blueprint itself.
 */

import type { BlueprintDecisionsV1 } from './types';
import { assertValidDecisions } from './validator';
import { computeAnchorId } from './anchor-id';
import { TEMPLATE_VERSION } from './template-engine';

export interface StageAnchor {
  /** 0-based position in the flattened atom_kinds[] array (NOT the stage's index within decisions.stages). */
  ordinal: number;
  stage_id: string;
  atom_kind: string;
  /** hash(concept_id, stage_id, ordinal, template_version) — src/blueprints/anchor-id.ts. */
  anchor_id: string;
}

export interface BlueprintDerivedSpec {
  /** Match the existing CurriculumUnitSpec shape (loose typed for cross-module compat). */
  exam_pack_id: string;
  concept_id: string;
  name: string;
  hypothesis?: string;
  learning_objectives: Array<{ id: string; statement: string }>;
  prepared_for_pyq_ids: string[];
  atom_kinds: string[];
  /** W2.2/E12 — deterministic per-stage-instance anchors, 1:1 with atom_kinds by ordinal. */
  stage_anchors: StageAnchor[];
}

/**
 * Translate a blueprint into a CurriculumUnitSpec input. The orchestrator
 * already knows how to drive `atom_kinds` through the verifier + canonical
 * pipeline; the blueprint's job is to choose THOSE kinds explicitly.
 */
export function blueprintToUnitSpec(decisions: BlueprintDecisionsV1, opts: {
  unit_name?: string;
  hypothesis?: string;
  prepared_for_pyq_ids?: string[];
  /** Overrides TEMPLATE_VERSION for anchor computation — see anchor-id.ts's module doc. */
  template_version?: string;
} = {}): BlueprintDerivedSpec {
  assertValidDecisions(decisions);

  const templateVersion = opts.template_version ?? TEMPLATE_VERSION;
  const concept_id = decisions.metadata.concept_id;

  // Each stage contributes its atom_kind. Practice stages with count > 1
  // contribute the kind once per atom (the orchestrator iterates per-kind).
  // stage_anchors is built in lockstep, one entry per atom_kinds position.
  const atom_kinds: string[] = [];
  const stage_anchors: StageAnchor[] = [];
  let ordinal = 0;
  for (const stage of decisions.stages) {
    const repeat = stage.count ?? 1;
    for (let i = 0; i < repeat; i++) {
      atom_kinds.push(stage.atom_kind);
      stage_anchors.push({
        ordinal,
        stage_id: stage.id,
        atom_kind: stage.atom_kind,
        anchor_id: computeAnchorId(concept_id, stage.id, ordinal, templateVersion),
      });
      ordinal++;
    }
  }

  // Learning objectives: synthesise from the stage rationale ids so the
  // PedagogyVerifier has something concrete to score against. v2 will let
  // operators write these explicitly.
  const learning_objectives = decisions.stages.map((s, i) => ({
    id: `obj-${i + 1}`,
    statement: s.rationale_note ?? rationaleAsObjective(s.rationale_id, s.id),
  }));

  return {
    exam_pack_id: decisions.metadata.exam_pack_id,
    concept_id,
    name: opts.unit_name ?? `${decisions.metadata.concept_id} (${decisions.metadata.target_difficulty})`,
    hypothesis: opts.hypothesis,
    learning_objectives,
    prepared_for_pyq_ids: opts.prepared_for_pyq_ids ?? [],
    atom_kinds,
    stage_anchors,
  };
}

function rationaleAsObjective(rationale_id: string, stage_id: string): string {
  // Default objective text by stage. Concrete operator notes override
  // these; the rationale_id is used as a fallback.
  const fallbacks: Record<string, string> = {
    intuition: 'Build the mental picture before formal definition',
    discovery: 'Discover the structure through interactive exploration',
    formalism: 'State the formal definition and key results',
    worked_example: 'Walk through a worked example end-to-end',
    practice: 'Practice on calibrated problems at the target difficulty',
    pyq_anchor: 'Bridge to a real past-paper question',
  };
  return fallbacks[stage_id] ?? `Achieve ${rationale_id}`;
}
