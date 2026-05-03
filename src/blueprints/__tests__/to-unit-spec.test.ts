import { describe, it, expect } from 'vitest';
import { blueprintToUnitSpec } from '../to-unit-spec';
import { buildTemplateBlueprint } from '../template-engine';

describe('blueprintToUnitSpec', () => {
  it('translates a template blueprint into a CurriculumUnitSpec-shaped object', () => {
    const bp = buildTemplateBlueprint({
      concept_id: 'limits-jee', exam_pack_id: 'jee-main', target_difficulty: 'medium', topic_family: 'calculus',
    });
    const spec = blueprintToUnitSpec(bp);
    expect(spec.exam_pack_id).toBe('jee-main');
    expect(spec.concept_id).toBe('limits-jee');
    expect(spec.atom_kinds.length).toBeGreaterThan(0);
    expect(spec.learning_objectives.length).toBe(bp.stages.length);
  });

  it('expands practice stages by their count', () => {
    const bp = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium' });
    const practice = bp.stages.find((s) => s.id === 'practice')!;
    const spec = blueprintToUnitSpec(bp);
    const mcqCount = spec.atom_kinds.filter((k) => k === 'mcq').length;
    expect(mcqCount).toBe(practice.count);
  });

  it('uses operator overrides for unit_name + hypothesis when supplied', () => {
    const bp = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'easy' });
    const spec = blueprintToUnitSpec(bp, { unit_name: 'Custom name', hypothesis: 'My hypothesis' });
    expect(spec.name).toBe('Custom name');
    expect(spec.hypothesis).toBe('My hypothesis');
  });

  it('default unit name embeds concept + difficulty', () => {
    const bp = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'hard' });
    const spec = blueprintToUnitSpec(bp);
    expect(spec.name).toContain('x');
    expect(spec.name).toContain('hard');
  });

  it('refuses to translate an invalid decisions object', () => {
    expect(() => blueprintToUnitSpec({ version: 99 } as any)).toThrow(/invalid blueprint/);
  });
});
