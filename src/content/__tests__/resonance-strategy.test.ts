import { describe, it, expect, beforeEach } from 'vitest';
import { resonanceStrategyFor, __resetResonanceStrategyCacheForTests } from '../resonance-strategy';
import { __resetAtomicTopicSpecCacheForTests } from '../atomic-topic-spec';

describe('resonanceStrategyFor (real docs/content-spec/ + concept-graph data)', () => {
  beforeEach(() => {
    __resetResonanceStrategyCacheForTests();
    __resetAtomicTopicSpecCacheForTests();
  });

  it('merges eigenvalues from BOTH LA-06 and LA-07 — the flagship N:1 case', () => {
    const strategy = resonanceStrategyFor('eigenvalues');
    expect(strategy).not.toBeNull();
    expect(strategy!.concept_id).toBe('eigenvalues');
    expect(strategy!.atomic_ids).toEqual(['LA-06', 'LA-07']);
  });

  it('de-duplicates recommended_hooks and personalized_delta_slots across the merged atomic ids', () => {
    const strategy = resonanceStrategyFor('eigenvalues')!;
    // LA-06 and LA-07's hooks/delta-slots are byte-identical in the source
    // CSV (verified) — a naive concat without dedup would double every entry.
    expect(strategy.recommended_hooks.length).toBeGreaterThan(0);
    expect(new Set(strategy.recommended_hooks).size).toBe(strategy.recommended_hooks.length);
    expect(strategy.personalized_delta_slots.length).toBeGreaterThan(0);
    expect(new Set(strategy.personalized_delta_slots).size).toBe(strategy.personalized_delta_slots.length);
    expect(strategy.recommended_hooks).toContain('Special direction intuition');
    expect(strategy.recommended_hooks).toContain('Transformation that preserves direction');
  });

  it('takes base_sequence and attention_design_hypothesis from the LOWEST atomic id (LA-06)', () => {
    const strategy = resonanceStrategyFor('eigenvalues')!;
    expect(strategy.base_sequence.length).toBeGreaterThan(0);
    expect(strategy.attention_design_hypothesis).toContain('Use the first hook');
  });

  it('resolves a single-atomic-id concept (determinants ← LA-02) with non-empty fields', () => {
    const strategy = resonanceStrategyFor('determinants');
    expect(strategy).not.toBeNull();
    expect(strategy!.atomic_ids).toEqual(['LA-02']);
    expect(strategy!.recommended_hooks.length).toBeGreaterThan(0);
    expect(strategy!.attention_design_hypothesis.length).toBeGreaterThan(0);
  });

  it('returns null for a concept with no atomic_id mapping', () => {
    // 'svd' is one of the 15 richer Linear Algebra concepts added beyond
    // the founder's base spec (see atomic-concept-map.ts's file header) —
    // it genuinely has zero atomic_ids, not a lookup miss.
    expect(resonanceStrategyFor('svd')).toBeNull();
  });

  it('returns null for a completely unknown concept_id', () => {
    expect(resonanceStrategyFor('not-a-real-concept-id')).toBeNull();
  });

  it('returns null when the crosswalk resolves atomic ids but none exist in the CSV spec', async () => {
    // Defensive branch: the hand-verified crosswalk names atomic ids the CSVs
    // no longer carry (e.g. a future spec-file trim). Unreachable with today's
    // committed data, so the spec lookup is mocked out for this one test.
    vi.resetModules();
    vi.doMock('../atomic-topic-spec', () => ({
      getAtomicTopicSpec: () => undefined,
      __resetAtomicTopicSpecCacheForTests: () => {},
    }));
    try {
      const mod = await import('../resonance-strategy');
      mod.__resetResonanceStrategyCacheForTests();
      expect(mod.resonanceStrategyFor('eigenvalues')).toBeNull();
    } finally {
      vi.doUnmock('../atomic-topic-spec');
      vi.resetModules();
    }
  });

  it('memoizes — repeated calls for the same concept return an equal result without recomputation drift', () => {
    const first = resonanceStrategyFor('eigenvalues');
    const second = resonanceStrategyFor('eigenvalues');
    expect(second).toEqual(first);
  });
});
