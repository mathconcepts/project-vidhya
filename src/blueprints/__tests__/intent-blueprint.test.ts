/**
 * src/blueprints/__tests__/intent-blueprint.test.ts
 *
 * Contract tests for buildIntentBlueprint() (T5, Phase 3). Exercises every
 * intent lane, the null fallback, the explicit-intent override, and proves
 * buildTemplateBlueprint()'s existing outputs are untouched by this change.
 */
import { describe, it, expect } from 'vitest';
import { buildIntentBlueprint, buildTemplateBlueprint } from '../template-engine';
import { validateDecisions } from '../validator';
import {
  CONCEPT_DOMINANT_INTENT,
  CONCEPT_TEMPLATE_FAMILY,
  INTENT_STAGE_SEQUENCES,
  type IntentId,
} from '../intent-tables.gen';
import { RATIONALE_CODES } from '../types';

const RATIONALE_BY_INTENT: Record<IntentId, string> = {
  pyq_targeted_practice: 'intent_pyq_practice',
  guided_problem_solving: 'intent_method_selection',
  concept_clarification: 'intent_property_recall',
  foundation_learning: 'intent_foundation',
};

const ALL_INTENTS: IntentId[] = [
  'foundation_learning',
  'concept_clarification',
  'guided_problem_solving',
  'pyq_targeted_practice',
];

describe('buildIntentBlueprint', () => {
  it('the four intent_* rationale codes are registered in RATIONALE_CODES', () => {
    for (const code of Object.values(RATIONALE_BY_INTENT)) {
      expect(RATIONALE_CODES).toHaveProperty(code);
    }
  });

  for (const intent of ALL_INTENTS) {
    it(`produces a validator-passing blueprint for explicit intent '${intent}'`, () => {
      const bp = buildIntentBlueprint({
        concept_id: 'matrix-operations',
        exam_pack_id: 'gate-em',
        target_difficulty: 'medium',
        intent,
      });
      expect(bp).not.toBeNull();
      const result = validateDecisions(bp);
      expect(result.errors).toEqual([]);
      expect(result.ok).toBe(true);
    });

    it(`every stage carries the '${RATIONALE_BY_INTENT[intent]}' rationale for intent '${intent}'`, () => {
      const bp = buildIntentBlueprint({
        concept_id: 'matrix-operations',
        exam_pack_id: 'gate-em',
        target_difficulty: 'medium',
        intent,
      });
      expect(bp).not.toBeNull();
      for (const stage of bp!.stages) {
        expect(stage.rationale_id).toBe(RATIONALE_BY_INTENT[intent]);
      }
    });

    it(`practice stages (if any) for intent '${intent}' carry an integer count in [3, 8] and a passed-through difficulty_mix`, () => {
      const bp = buildIntentBlueprint({
        concept_id: 'matrix-operations', // inventory total 180 -> round(180/15)=12 -> clamped to 8
        exam_pack_id: 'gate-em',
        target_difficulty: 'medium',
        intent,
      });
      expect(bp).not.toBeNull();
      const practiceStages = bp!.stages.filter((s) => s.id === 'practice');
      for (const stage of practiceStages) {
        expect(Number.isInteger(stage.count)).toBe(true);
        expect(stage.count).toBeGreaterThanOrEqual(3);
        expect(stage.count).toBeLessThanOrEqual(8);
        expect(stage.difficulty_mix).toBeDefined();
        const mix = stage.difficulty_mix!;
        expect(mix.easy + mix.medium + mix.hard).toBe(100);
      }
    });
  }

  it('clamps practice count to the floor of 3 for a concept with no mapped inventory', () => {
    const bp = buildIntentBlueprint({
      concept_id: 'totally-unmapped-concept',
      exam_pack_id: 'gate-em',
      target_difficulty: 'medium',
      intent: 'pyq_targeted_practice',
    });
    expect(bp).not.toBeNull();
    const practice = bp!.stages.find((s) => s.id === 'practice');
    expect(practice?.count).toBe(3);
  });

  it('derives the count from CONCEPT_INVENTORY_TOTALS via clamp(round(total/15), 3, 8) for a mid-size total', () => {
    // eigenvalues total_inventory = 180 -> round(180/15) = 12 -> clamped to 8
    const bp = buildIntentBlueprint({
      concept_id: 'eigenvalues',
      exam_pack_id: 'gate-em',
      target_difficulty: 'medium',
    });
    expect(bp).not.toBeNull();
    const practice = bp!.stages.find((s) => s.id === 'practice');
    expect(practice?.count).toBe(8);

    // least-squares total_inventory = 45 -> round(45/15) = 3 -> stays 3
    const bp2 = buildIntentBlueprint({
      concept_id: 'least-squares',
      exam_pack_id: 'gate-em',
      target_difficulty: 'medium',
    });
    expect(bp2).not.toBeNull();
    const practice2 = bp2!.stages.find((s) => s.id === 'practice');
    expect(practice2?.count).toBe(3);
  });

  it('returns null when the concept has no dominant intent and no explicit override', () => {
    expect(CONCEPT_DOMINANT_INTENT['no-such-concept-id']).toBeUndefined();
    const bp = buildIntentBlueprint({
      concept_id: 'no-such-concept-id',
      exam_pack_id: 'gate-em',
      target_difficulty: 'medium',
    });
    expect(bp).toBeNull();
  });

  it('W2.1/E11: family topology wins over the dominant-intent default when no explicit intent is passed', () => {
    // matrix-operations resolves to the 'matrix' template family (linear-algebra's
    // topic default in template-families.yml) — family overrides the intent
    // default per E11, even though matrix-operations ALSO has a dominant
    // catalogue intent (pyq_targeted_practice, 3 atoms vs 1 concept_clarification).
    expect(CONCEPT_TEMPLATE_FAMILY['matrix-operations']).toBe('matrix');
    expect(CONCEPT_DOMINANT_INTENT['matrix-operations']).toBe('pyq_targeted_practice');
    const bp = buildIntentBlueprint({
      concept_id: 'matrix-operations',
      exam_pack_id: 'gate-em',
      target_difficulty: 'medium',
    });
    expect(bp).not.toBeNull();
    expect(bp!.stages.every((s) => s.rationale_id === 'family_matrix')).toBe(true);
    expect(bp!.stages.some((s) => s.rationale_id === 'intent_pyq_practice')).toBe(false);
  });

  it('W2.1/E11: an explicit intent override still wins over family topology', () => {
    // Same concept as above, but the caller explicitly asks for a lane —
    // family must NOT override an explicit ask (only the unset-intent default).
    expect(CONCEPT_TEMPLATE_FAMILY['matrix-operations']).toBe('matrix');
    const bp = buildIntentBlueprint({
      concept_id: 'matrix-operations',
      exam_pack_id: 'gate-em',
      target_difficulty: 'medium',
      intent: 'concept_clarification',
    });
    expect(bp).not.toBeNull();
    expect(bp!.stages.every((s) => s.rationale_id === 'intent_property_recall')).toBe(true);
  });

  it('W2.1/E11: family-derived practice stage inherits the intent lane difficulty_mix when the concept has a dominant intent', () => {
    // eigenvalues -> family 'eigen' (topology) but its dominant intent
    // (guided_problem_solving) supplies the preserved practice difficulty_mix,
    // per E11's "intent lane's difficulty mixes preserved" clause.
    expect(CONCEPT_TEMPLATE_FAMILY['eigenvalues']).toBe('eigen');
    const intent = CONCEPT_DOMINANT_INTENT['eigenvalues'];
    expect(intent).toBeDefined();
    const bp = buildIntentBlueprint({
      concept_id: 'eigenvalues',
      exam_pack_id: 'gate-em',
      target_difficulty: 'medium',
    });
    expect(bp).not.toBeNull();
    const practice = bp!.stages.find((s) => s.id === 'practice')!;
    const intentPracticeMix = INTENT_STAGE_SEQUENCES[intent!].find((s) => s.stage === 'practice')?.difficulty_mix;
    if (intentPracticeMix) {
      expect(practice.difficulty_mix).toEqual(intentPracticeMix);
    } else {
      expect(practice.difficulty_mix).toEqual({ easy: 30, medium: 50, hard: 20 });
    }
  });

  it('explicit intent override wins over the dominant intent', () => {
    // determinants' dominant intent is concept_clarification; override to foundation_learning.
    expect(CONCEPT_DOMINANT_INTENT['determinants']).toBe('concept_clarification');
    const bp = buildIntentBlueprint({
      concept_id: 'determinants',
      exam_pack_id: 'gate-em',
      target_difficulty: 'medium',
      intent: 'foundation_learning',
    });
    expect(bp).not.toBeNull();
    expect(bp!.stages.every((s) => s.rationale_id === 'intent_foundation')).toBe(true);
    expect(bp!.stages[0].id).toBe('intuition');
  });

  it('metadata mirrors the input exactly (concept_id, exam_pack_id, target_difficulty)', () => {
    const bp = buildIntentBlueprint({
      concept_id: 'matrix-operations',
      exam_pack_id: 'gate-em',
      target_difficulty: 'hard',
    });
    expect(bp).not.toBeNull();
    expect(bp!.metadata).toEqual({
      concept_id: 'matrix-operations',
      exam_pack_id: 'gate-em',
      target_difficulty: 'hard',
    });
  });

  it('is deterministic for the same input', () => {
    const a = buildIntentBlueprint({ concept_id: 'matrix-operations', exam_pack_id: 'gate-em', target_difficulty: 'medium' });
    const b = buildIntentBlueprint({ concept_id: 'matrix-operations', exam_pack_id: 'gate-em', target_difficulty: 'medium' });
    expect(a).toEqual(b);
  });
});

describe('buildTemplateBlueprint is unchanged by the intent-blueprint addition', () => {
  it('limits-jee/medium/jee-main output matches the pre-existing shape', () => {
    const bp = buildTemplateBlueprint({
      concept_id: 'limits-jee',
      exam_pack_id: 'jee-main',
      target_difficulty: 'medium',
      topic_family: 'calculus',
    });
    expect(validateDecisions(bp).ok).toBe(true);
    expect(bp.stages.map((s) => s.id)).toEqual(['intuition', 'discovery', 'worked_example', 'practice']);
    expect(bp.stages[0].rationale_id).toBe('concept_is_computational');
    const practice = bp.stages.find((s) => s.id === 'practice')!;
    expect(practice.count).toBe(4);
    expect(practice.difficulty_mix).toEqual({ easy: 30, medium: 50, hard: 20 });
  });

  it('vectors-jee/hard/jee-main with requires_pyq_anchor matches the pre-existing shape', () => {
    const bp = buildTemplateBlueprint({
      concept_id: 'vectors-jee',
      exam_pack_id: 'jee-main',
      target_difficulty: 'hard',
      topic_family: 'vectors',
      requires_pyq_anchor: true,
    });
    expect(validateDecisions(bp).ok).toBe(true);
    expect(bp.stages.map((s) => s.id)).toEqual([
      'intuition', 'discovery', 'worked_example', 'practice', 'pyq_anchor',
    ]);
    expect(bp.stages[0].rationale_id).toBe('concept_is_geometric');
    expect(bp.constraints.some((c) => c.id === 'always_include_pyq_anchor')).toBe(true);
  });
});
