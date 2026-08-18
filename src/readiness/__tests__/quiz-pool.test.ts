import { describe, it, expect } from 'vitest';
import { assembleQuizPool, quizIsEligible, selectQuizItems, type QuizPoolCandidate } from '../quiz-pool';
import { seededRng } from '../../scenarios/policy-runner';

describe('assembleQuizPool', () => {
  it('merges due + frontier rows, deduplicated by objectId', () => {
    const due = [{ objectId: 'a', skillId: 'eigenvalues' }, { objectId: 'b', skillId: 'determinants' }];
    const frontier = [{ objectId: 'b', skillId: 'determinants' }, { objectId: 'c', skillId: 'orthogonality' }];
    const pool = assembleQuizPool(due, frontier, new Set());
    expect(pool.map((p) => p.objectId).sort()).toEqual(['a', 'b', 'c']);
    // 'b' appears once, sourced from 'due' (due wins on collision)
    expect(pool.find((p) => p.objectId === 'b')?.source).toBe('due');
  });

  it('excludes items reviewed within the no-repeat window, from EITHER source', () => {
    const due = [{ objectId: 'a', skillId: 'eigenvalues' }];
    const frontier = [{ objectId: 'b', skillId: 'determinants' }];
    const pool = assembleQuizPool(due, frontier, new Set(['a', 'b']));
    expect(pool).toEqual([]);
  });

  it('drops due rows with no skillId (unmapped card) — never guessed', () => {
    const due = [{ objectId: 'a', skillId: null }];
    const pool = assembleQuizPool(due, [], new Set());
    expect(pool).toEqual([]);
  });

  it('an empty pool is a valid, honest result', () => {
    expect(assembleQuizPool([], [], new Set())).toEqual([]);
  });
});

describe('quizIsEligible', () => {
  it('requires at least 2x the quiz length', () => {
    expect(quizIsEligible(11, 6)).toBe(false);
    expect(quizIsEligible(12, 6)).toBe(true);
    expect(quizIsEligible(13, 6)).toBe(true);
  });

  it('is false for an empty pool', () => {
    expect(quizIsEligible(0)).toBe(false);
  });
});

describe('selectQuizItems', () => {
  function pool(n: number): QuizPoolCandidate[] {
    return Array.from({ length: n }, (_, i) => ({ objectId: `obj-${i}`, skillId: 'eigenvalues', source: 'due' as const }));
  }

  it('selects exactly quizLength distinct items when the pool is large enough', () => {
    const rng = seededRng('test-seed-1');
    const selected = selectQuizItems(pool(20), 6, rng);
    expect(selected).toHaveLength(6);
    expect(new Set(selected.map((s) => s.objectId)).size).toBe(6); // within-session dedup, structurally
  });

  it('never selects more than the pool holds', () => {
    const rng = seededRng('test-seed-2');
    const selected = selectQuizItems(pool(4), 6, rng);
    expect(selected).toHaveLength(4);
  });

  it('is deterministic for a fixed rng seed', () => {
    const a = selectQuizItems(pool(10), 6, seededRng('fixed'));
    const b = selectQuizItems(pool(10), 6, seededRng('fixed'));
    expect(a.map((x) => x.objectId)).toEqual(b.map((x) => x.objectId));
  });

  it('produces a different draw for a different seed (overwhelmingly likely)', () => {
    const a = selectQuizItems(pool(10), 6, seededRng('seed-a'));
    const b = selectQuizItems(pool(10), 6, seededRng('seed-b'));
    expect(a.map((x) => x.objectId)).not.toEqual(b.map((x) => x.objectId));
  });
});
