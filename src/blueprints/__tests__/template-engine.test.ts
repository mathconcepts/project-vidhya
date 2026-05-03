import { describe, it, expect } from 'vitest';
import { buildTemplateBlueprint, TEMPLATE_VERSION } from '../template-engine';
import { validateDecisions } from '../validator';

describe('buildTemplateBlueprint', () => {
  it('produces a structurally-valid blueprint for limits/medium/jee-main', () => {
    const bp = buildTemplateBlueprint({
      concept_id: 'limits-jee',
      exam_pack_id: 'jee-main',
      target_difficulty: 'medium',
    });
    expect(validateDecisions(bp).ok).toBe(true);
    expect(bp.metadata.concept_id).toBe('limits-jee');
    expect(bp.metadata.target_difficulty).toBe('medium');
  });

  it('is deterministic for the same input', () => {
    const a = buildTemplateBlueprint({ concept_id: 'limits-jee', exam_pack_id: 'jee-main', target_difficulty: 'medium' });
    const b = buildTemplateBlueprint({ concept_id: 'limits-jee', exam_pack_id: 'jee-main', target_difficulty: 'medium' });
    expect(a).toEqual(b);
  });

  it('uses visual_analogy intuition for geometric topic family', () => {
    const bp = buildTemplateBlueprint({
      concept_id: 'vectors-jee', exam_pack_id: 'jee-main', target_difficulty: 'medium', topic_family: 'vectors',
    });
    expect(bp.stages[0].id).toBe('intuition');
    expect(bp.stages[0].atom_kind).toBe('visual_analogy');
    expect(bp.stages[0].rationale_id).toBe('concept_is_geometric');
  });

  it('uses worked_example intuition for algebraic topic family', () => {
    const bp = buildTemplateBlueprint({
      concept_id: 'matrices-determinants', exam_pack_id: 'jee-main', target_difficulty: 'hard', topic_family: 'matrices-determinants',
    });
    expect(bp.stages[0].atom_kind).toBe('worked_example');
    expect(bp.stages[0].rationale_id).toBe('concept_is_algebraic');
  });

  it('skips discovery stage when difficulty=easy', () => {
    const bp = buildTemplateBlueprint({
      concept_id: 'limits-jee', exam_pack_id: 'jee-main', target_difficulty: 'easy', topic_family: 'calculus',
    });
    expect(bp.stages.find((s) => s.id === 'discovery')).toBeUndefined();
  });

  it('includes a manipulable discovery stage when difficulty>easy AND family fits', () => {
    const bp = buildTemplateBlueprint({
      concept_id: 'limits-jee', exam_pack_id: 'jee-main', target_difficulty: 'medium', topic_family: 'calculus',
    });
    const disc = bp.stages.find((s) => s.id === 'discovery');
    expect(disc).toBeDefined();
    expect(disc!.atom_kind).toBe('manipulable');
    expect(disc!.rationale_id).toBe('param_space_small_enough');
  });

  it('practice stage difficulty_mix shifts with target_difficulty', () => {
    const easy = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'easy' });
    const hard = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'hard' });
    const mEasy = easy.stages.find((s) => s.id === 'practice')!.difficulty_mix!;
    const mHard = hard.stages.find((s) => s.id === 'practice')!.difficulty_mix!;
    expect(mEasy.easy).toBeGreaterThan(mHard.easy);
    expect(mHard.hard).toBeGreaterThan(mEasy.hard);
  });

  it('appends pyq_anchor stage + constraint when requires_pyq_anchor=true', () => {
    const bp = buildTemplateBlueprint({
      concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium', requires_pyq_anchor: true,
    });
    expect(bp.stages.find((s) => s.id === 'pyq_anchor')).toBeDefined();
    expect(bp.constraints.some((c) => c.id === 'always_include_pyq_anchor')).toBe(true);
  });

  it('omits pyq_anchor when not required', () => {
    const bp = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium' });
    expect(bp.stages.find((s) => s.id === 'pyq_anchor')).toBeUndefined();
  });

  it('always includes the no_jargon_first_definition constraint', () => {
    const bp = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'easy' });
    expect(bp.constraints.some((c) => c.id === 'no_jargon_first_definition')).toBe(true);
  });

  it('TEMPLATE_VERSION is a non-empty string for ledger joins', () => {
    expect(typeof TEMPLATE_VERSION).toBe('string');
    expect(TEMPLATE_VERSION.length).toBeGreaterThan(0);
  });
});
