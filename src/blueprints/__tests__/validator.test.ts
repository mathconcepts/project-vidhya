import { describe, it, expect } from 'vitest';
import { validateDecisions, assertValidDecisions } from '../validator';
import type { BlueprintDecisionsV1 } from '../types';

const MINIMAL_VALID: BlueprintDecisionsV1 = {
  version: 1,
  metadata: { concept_id: 'limits-jee', exam_pack_id: 'jee-main', target_difficulty: 'medium' },
  stages: [
    { id: 'intuition', atom_kind: 'visual_analogy', rationale_id: 'concept_is_geometric' },
    {
      id: 'practice',
      atom_kind: 'mcq',
      count: 3,
      difficulty_mix: { easy: 50, medium: 30, hard: 20 },
      rationale_id: 'default_practice_mix',
    },
  ],
  constraints: [{ id: 'no_jargon_first_definition', source: 'template' }],
};

describe('validateDecisions', () => {
  it('accepts a minimal valid blueprint', () => {
    const r = validateDecisions(MINIMAL_VALID);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejects non-object input', () => {
    expect(validateDecisions(null).ok).toBe(false);
    expect(validateDecisions('s').ok).toBe(false);
    expect(validateDecisions(42).ok).toBe(false);
  });

  it('rejects version != 1', () => {
    const r = validateDecisions({ ...MINIMAL_VALID, version: 2 });
    expect(r.ok).toBe(false);
    expect(r.errors[0].path).toBe('version');
  });

  it('rejects missing metadata fields', () => {
    const r = validateDecisions({ ...MINIMAL_VALID, metadata: { concept_id: '', exam_pack_id: 'x', target_difficulty: 'medium' } });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.path === 'metadata.concept_id')).toBe(true);
  });

  it('rejects unknown target_difficulty', () => {
    const r = validateDecisions({
      ...MINIMAL_VALID,
      metadata: { ...MINIMAL_VALID.metadata, target_difficulty: 'extreme' as any },
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.path === 'metadata.target_difficulty')).toBe(true);
  });

  it('rejects empty stages', () => {
    const r = validateDecisions({ ...MINIMAL_VALID, stages: [] });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.path === 'stages')).toBe(true);
  });

  it('rejects unknown stage.id', () => {
    const r = validateDecisions({
      ...MINIMAL_VALID,
      stages: [{ id: 'pep_talk' as any, atom_kind: 'mcq', rationale_id: 'x' }],
    });
    expect(r.ok).toBe(false);
    expect(r.errors[0].path).toBe('stages[0].id');
  });

  it('rejects unknown atom_kind', () => {
    const r = validateDecisions({
      ...MINIMAL_VALID,
      stages: [{ id: 'intuition', atom_kind: 'pep_talk' as any, rationale_id: 'x' }],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.path === 'stages[0].atom_kind')).toBe(true);
  });

  it('requires count + difficulty_mix on practice stages', () => {
    const r = validateDecisions({
      ...MINIMAL_VALID,
      stages: [{ id: 'practice', atom_kind: 'mcq', rationale_id: 'x' }],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.path === 'stages[0].count')).toBe(true);
    expect(r.errors.some((e) => e.path === 'stages[0].difficulty_mix')).toBe(true);
  });

  it('rejects difficulty_mix that does not sum to 100', () => {
    const r = validateDecisions({
      ...MINIMAL_VALID,
      stages: [
        { id: 'practice', atom_kind: 'mcq', count: 3, difficulty_mix: { easy: 50, medium: 30, hard: 30 }, rationale_id: 'x' },
      ],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.path === 'stages[0].difficulty_mix' && /sum to 100/.test(e.reason))).toBe(true);
  });

  it('rejects difficulty_mix with out-of-range values', () => {
    const r = validateDecisions({
      ...MINIMAL_VALID,
      stages: [
        { id: 'practice', atom_kind: 'mcq', count: 3, difficulty_mix: { easy: -10, medium: 80, hard: 30 }, rationale_id: 'x' },
      ],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.path === 'stages[0].difficulty_mix.easy')).toBe(true);
  });

  it('rejects unknown constraint.source', () => {
    const r = validateDecisions({
      ...MINIMAL_VALID,
      constraints: [{ id: 'x', source: 'random_source' as any }],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.path === 'constraints[0].source')).toBe(true);
  });

  // Surveillance — defense in depth
  it('rejects decisions containing forbidden field names (user_id)', () => {
    const r = validateDecisions({
      ...MINIMAL_VALID,
      stages: [{ id: 'intuition', atom_kind: 'visual_analogy', rationale_id: 'x', user_id: 'leak' } as any],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /surveillance/.test(e.reason))).toBe(true);
  });

  it('rejects forbidden field names at any nesting depth', () => {
    const r = validateDecisions({
      ...MINIMAL_VALID,
      metadata: { ...MINIMAL_VALID.metadata, tracked_visits: 5 } as any,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /surveillance/.test(e.reason))).toBe(true);
  });

  it('rejects forbidden field names inside arrays', () => {
    const r = validateDecisions({
      ...MINIMAL_VALID,
      constraints: [{ id: 'x', source: 'template', behavior_log: ['a'] } as any],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /surveillance/.test(e.reason))).toBe(true);
  });
});

describe('assertValidDecisions', () => {
  it('throws on invalid', () => {
    expect(() => assertValidDecisions({ version: 99 })).toThrow(/invalid blueprint/);
  });
  it('returns void on valid', () => {
    expect(() => assertValidDecisions(MINIMAL_VALID)).not.toThrow();
  });
});
