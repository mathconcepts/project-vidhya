import { describe, it, expect } from 'vitest';
import { blueprintToUnitSpec } from '../to-unit-spec';
import { buildTemplateBlueprint, TEMPLATE_VERSION } from '../template-engine';
import { computeAnchorId } from '../anchor-id';

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

  // ---------------------------------------------------------------------
  // W2.2/E12 — stage_anchors
  // ---------------------------------------------------------------------

  it('emits one stage_anchors entry per atom_kinds position, in the same order', () => {
    const bp = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium' });
    const spec = blueprintToUnitSpec(bp);
    expect(spec.stage_anchors.length).toBe(spec.atom_kinds.length);
    spec.stage_anchors.forEach((anchor, i) => {
      expect(anchor.ordinal).toBe(i);
      expect(anchor.atom_kind).toBe(spec.atom_kinds[i]);
    });
  });

  it('every anchor_id matches computeAnchorId(concept_id, stage_id, ordinal, TEMPLATE_VERSION)', () => {
    const bp = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium' });
    const spec = blueprintToUnitSpec(bp);
    for (const anchor of spec.stage_anchors) {
      expect(anchor.anchor_id).toBe(computeAnchorId('x', anchor.stage_id, anchor.ordinal, TEMPLATE_VERSION));
    }
  });

  it('is deterministic: translating the same blueprint twice yields identical anchor ids', () => {
    const bp = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium' });
    const a = blueprintToUnitSpec(bp);
    const b = blueprintToUnitSpec(bp);
    expect(a.stage_anchors).toEqual(b.stage_anchors);
  });

  it('a different concept_id yields different anchor ids at the same ordinal', () => {
    const bpX = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium' });
    const bpY = buildTemplateBlueprint({ concept_id: 'y', exam_pack_id: 'p', target_difficulty: 'medium' });
    const specX = blueprintToUnitSpec(bpX);
    const specY = blueprintToUnitSpec(bpY);
    expect(specX.stage_anchors[0].anchor_id).not.toBe(specY.stage_anchors[0].anchor_id);
  });

  it('repeated practice-stage instances (same stage_id, different ordinal) get distinct anchor ids', () => {
    const bp = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium' });
    const practiceAnchors = blueprintToUnitSpec(bp).stage_anchors.filter((a) => a.stage_id === 'practice');
    expect(practiceAnchors.length).toBeGreaterThan(1);
    const ids = new Set(practiceAnchors.map((a) => a.anchor_id));
    expect(ids.size).toBe(practiceAnchors.length);
  });

  it('an explicit template_version override changes every anchor id (documented as intentional)', () => {
    const bp = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium' });
    const a = blueprintToUnitSpec(bp);
    const b = blueprintToUnitSpec(bp, { template_version: 'v2.0' });
    for (let i = 0; i < a.stage_anchors.length; i++) {
      expect(a.stage_anchors[i].anchor_id).not.toBe(b.stage_anchors[i].anchor_id);
    }
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
