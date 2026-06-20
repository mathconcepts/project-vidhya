/**
 * Tests for src/scoring/attempt-dedup.ts — idempotency primitive.
 */

import { describe, it, expect } from 'vitest';
import { attemptKey, InMemoryDedupRepo } from '../attempt-dedup';
import type { Attempt } from '../../core/interfaces';

const A = (over: Partial<Attempt> = {}): Attempt => ({
  studentId: 's1',
  objectId: 'o1',
  skillId: 'k1',
  correct: true,
  latencyMs: 5_000,
  ts: 1_700_000_000_000,
  ...over,
});

describe('attemptKey', () => {
  it('is deterministic on the same triple', () => {
    expect(attemptKey(A())).toBe(attemptKey(A()));
  });

  it('changes when student / object / ts changes', () => {
    expect(attemptKey(A()) === attemptKey(A({ studentId: 's2' }))).toBe(false);
    expect(attemptKey(A()) === attemptKey(A({ objectId: 'o2' }))).toBe(false);
    expect(attemptKey(A()) === attemptKey(A({ ts: 1 }))).toBe(false);
  });

  it('does NOT change when irrelevant fields change (correct, latency)', () => {
    expect(attemptKey(A())).toBe(attemptKey(A({ correct: false, latencyMs: 99 })));
  });
});

describe('InMemoryDedupRepo', () => {
  it('first time returns true, second time false', async () => {
    const repo = new InMemoryDedupRepo();
    expect(await repo.markSeen(A())).toBe(true);
    expect(await repo.markSeen(A())).toBe(false);
  });

  it('different attempts are independent', async () => {
    const repo = new InMemoryDedupRepo();
    expect(await repo.markSeen(A({ ts: 1 }))).toBe(true);
    expect(await repo.markSeen(A({ ts: 2 }))).toBe(true);
  });

  it('respects the cap by evicting the oldest entry', async () => {
    const repo = new InMemoryDedupRepo(3);
    await repo.markSeen(A({ ts: 1 }));
    await repo.markSeen(A({ ts: 2 }));
    await repo.markSeen(A({ ts: 3 }));
    expect(repo.size()).toBe(3);
    await repo.markSeen(A({ ts: 4 }));
    expect(repo.size()).toBe(3);
    // ts=1 should have been evicted — adding it again counts as fresh.
    expect(await repo.markSeen(A({ ts: 1 }))).toBe(true);
  });
});
