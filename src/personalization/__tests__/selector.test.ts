/**
 * Unit tests for the PersonalizedSelector. Most scorers are tested via
 * the integration test (selector returning ranked atoms in a synthetic
 * world). DB-touching scorers are tested in their respective module
 * tests; this file focuses on the orchestration + dedup-backoff +
 * control-bucket invariants.
 */

import { describe, it, expect } from 'vitest';
import { applyPersonalizedRanking, LAYER_WEIGHTS, bucketFor, hashToUnit } from '../index';
import type { AtomShape, RankingContext } from '../types';

function atom(id: string, atom_type: string, opts: Partial<AtomShape> = {}): AtomShape {
  return { id, concept_id: 'eigenvalues', atom_type, ...opts };
}

const BASE_CTX: RankingContext = {
  session_id: 'sess_test',
  student_id: null,
  concept_id: 'eigenvalues',
  exam_pack_id: 'gate-ma',
  ab_bucket: 'treatment',
};

describe('applyPersonalizedRanking', () => {
  it('returns input unchanged for control bucket', async () => {
    const atoms = [atom('a1', 'intuition'), atom('a2', 'practice')];
    const ctx = { ...BASE_CTX, ab_bucket: 'control' as const };
    const out = await applyPersonalizedRanking(atoms, ctx);
    expect(out.map((a) => a.id)).toEqual(['a1', 'a2']);
  });

  it('returns empty for empty input', async () => {
    const out = await applyPersonalizedRanking([], BASE_CTX);
    expect(out).toEqual([]);
  });

  it('treatment ranks atoms (order may differ from input)', async () => {
    const atoms = [
      atom('a1', 'intuition'),
      atom('a2', 'formal_definition'),
      atom('a3', 'worked_example'),
      atom('a4', 'common_traps'),
    ];
    // Anonymous + DB-less: cohort/user layers neutral. Exam-fit
    // (mcq-rigorous default) prefers formal_definition + worked_example +
    // common_traps. So they should outrank intuition.
    const out = await applyPersonalizedRanking(atoms, BASE_CTX);
    expect(out.length).toBe(4);
    const intuitionIdx = out.findIndex((a) => a.id === 'a1');
    const formalIdx = out.findIndex((a) => a.id === 'a2');
    expect(formalIdx).toBeLessThan(intuitionIdx);
  });

  it('returns input unchanged when only one atom (no rank to do)', async () => {
    const atoms = [atom('a1', 'intuition')];
    const out = await applyPersonalizedRanking(atoms, BASE_CTX);
    expect(out.map((a) => a.id)).toEqual(['a1']);
  });
});

describe('LAYER_WEIGHTS sums to 1.0', () => {
  it('all six positive-signal layer weights sum to 1.0', () => {
    const sum =
      LAYER_WEIGHTS.syllabus +
      LAYER_WEIGHTS.exam +
      LAYER_WEIGHTS.cohort +
      LAYER_WEIGHTS.user_mastery +
      LAYER_WEIGHTS.user_error +
      LAYER_WEIGHTS.realtime;
    expect(sum).toBeCloseTo(1.0, 6);
  });
});

describe('A/B bucketing', () => {
  it('hashToUnit is uniform over a 10k synthetic sample', () => {
    let belowHalf = 0;
    for (let i = 0; i < 10_000; i++) {
      if (hashToUnit('exp_test', `sess_${i}`) < 0.5) belowHalf += 1;
    }
    // Expected ~5000; allow ±200 (4σ for binomial)
    expect(belowHalf).toBeGreaterThan(4800);
    expect(belowHalf).toBeLessThan(5200);
  });

  it('bucketFor is stable for the same (experiment, session) pair', () => {
    const a = bucketFor('exp_x', 'sess_1');
    const b = bucketFor('exp_x', 'sess_1');
    const c = bucketFor('exp_x', 'sess_1');
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('bucketFor differs for different experiments (same session)', () => {
    // Not strictly required, but probabilistic ✓ — confirms the input
    // hash includes experiment_id.
    let differCount = 0;
    for (let i = 0; i < 100; i++) {
      const a = bucketFor('exp_a', `sess_${i}`);
      const b = bucketFor('exp_b', `sess_${i}`);
      if (a !== b) differCount += 1;
    }
    // ~50% expected
    expect(differCount).toBeGreaterThan(20);
    expect(differCount).toBeLessThan(80);
  });
});
