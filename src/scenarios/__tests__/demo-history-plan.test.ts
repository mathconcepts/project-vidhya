import { describe, it, expect } from 'vitest';
import {
  buildAttempts, responseForOutcome, isWithinXpWindow, simulate, type ConceptGroupSpec,
} from '../demo-history-plan';
import type { GateItem } from '../../scoring/deterministic-scorer';
import { gateResponseFromBody } from '../../api/practice-routes';
import type { LearningObject } from '../../core/interfaces';

const NOW = new Date('2026-08-18T09:00:00.000Z');

describe('buildAttempts', () => {
  const groups: ConceptGroupSpec[] = [
    { conceptId: 'eigenvalues', numAttempts: 4, probCorrect: 0.5, minDaysAgo: 1, maxDaysAgo: 8 },
  ];

  it('produces exactly numAttempts entries, oldest-first in wall-clock time', () => {
    const attempts = buildAttempts('persona-x', groups, NOW, () => 'item-1');
    expect(attempts).toHaveLength(4);
    for (let i = 1; i < attempts.length; i++) {
      expect(attempts[i].tsMs).toBeGreaterThan(attempts[i - 1].tsMs);
    }
    // all before "now"
    for (const a of attempts) expect(a.tsMs).toBeLessThan(NOW.getTime());
  });

  it('is fully deterministic for the same persona id', () => {
    const a = buildAttempts('persona-x', groups, NOW, () => 'item-1');
    const b = buildAttempts('persona-x', groups, NOW, () => 'item-1');
    expect(a).toEqual(b);
  });

  it('produces a DIFFERENT correctness pattern for a different persona id (same seed key changes)', () => {
    const a = buildAttempts('persona-x', groups, NOW, () => 'item-1');
    const b = buildAttempts('persona-y', groups, NOW, () => 'item-1');
    expect(a.map((x) => x.correct)).not.toEqual(b.map((x) => x.correct));
  });

  it('skips a concept the resolver has no item for — never fabricates', () => {
    const attempts = buildAttempts('persona-x', groups, NOW, () => null);
    expect(attempts).toEqual([]);
  });

  it('threads the attemptIdx into the resolver (for cycling through multiple items)', () => {
    const seen: number[] = [];
    buildAttempts('persona-x', groups, NOW, (_c, idx) => { seen.push(idx); return 'item-1'; });
    expect(seen).toEqual([0, 1, 2, 3]);
  });
});

describe('responseForOutcome', () => {
  it('mcq: correct picks the answer index; incorrect picks a different one', () => {
    const item: GateItem = { id: 'x', kind: 'mcq', marks: 2, options: ['a', 'b', 'c'], answerIndex: 1 };
    expect(responseForOutcome(item, true)).toEqual({ kind: 'mcq', selectedIndex: 1 });
    const wrong = responseForOutcome(item, false);
    expect(wrong.kind).toBe('mcq');
    expect((wrong as any).selectedIndex).not.toBe(1);
  });

  it('msq: correct picks the exact set; incorrect picks a non-matching set', () => {
    const item: GateItem = { id: 'x', kind: 'msq', marks: 2, options: ['a', 'b', 'c'], answerIndices: [0, 2] };
    expect(responseForOutcome(item, true)).toEqual({ kind: 'msq', selectedIndices: [0, 2] });
    const wrong = responseForOutcome(item, false) as any;
    expect(wrong.selectedIndices).not.toEqual([0, 2]);
    expect(wrong.selectedIndices.length).toBeGreaterThan(0);
  });

  it('nat: correct lands inside the range; incorrect lands outside it', () => {
    const item: GateItem = { id: 'x', kind: 'nat', marks: 1, answerRange: [1.4, 1.6] };
    const correct = responseForOutcome(item, true) as any;
    expect(correct.value).toBeGreaterThanOrEqual(1.4);
    expect(correct.value).toBeLessThanOrEqual(1.6);
    const wrong = responseForOutcome(item, false) as any;
    expect(wrong.value).toBeGreaterThan(1.6);
  });

  it('every synthesized response passes gateResponseFromBody validation for its item (never malformed)', () => {
    const mcq: GateItem = { id: 'x', kind: 'mcq', marks: 2, options: ['a', 'b', 'c', 'd'], answerIndex: 2 };
    const msq: GateItem = { id: 'y', kind: 'msq', marks: 2, options: ['a', 'b', 'c'], answerIndices: [1] };
    const nat: GateItem = { id: 'z', kind: 'nat', marks: 1, answerRange: [0, 1] };
    for (const item of [mcq, msq, nat]) {
      for (const wantCorrect of [true, false]) {
        const r = responseForOutcome(item, wantCorrect);
        const validated = gateResponseFromBody(item, r);
        expect(typeof validated, `${item.kind} wantCorrect=${wantCorrect} should validate`).not.toBe('string');
      }
    }
  });
});

describe('isWithinXpWindow', () => {
  it('null window means everything counts', () => {
    expect(isWithinXpWindow(NOW.getTime() - 100 * 86_400_000, NOW, null)).toBe(true);
  });

  it('respects the day boundary', () => {
    const fiveDaysAgo = NOW.getTime() - 5 * 86_400_000;
    const sixDaysAgo = NOW.getTime() - 6 * 86_400_000;
    expect(isWithinXpWindow(fiveDaysAgo, NOW, 5)).toBe(true);
    expect(isWithinXpWindow(sixDaysAgo, NOW, 5)).toBe(false);
  });
});

describe('simulate', () => {
  const MCQ_OBJ: LearningObject = {
    id: 'obj-1', nodeId: 'eigenvalues', type: 'practice', difficulty: 1500, estMinutes: 3, prereqs: [],
    verification: 'human_verified',
    payload: { skillId: 'eigenvalues', questionType: 'mcq', marks: 2, options: ['a', 'b'], answerIndex: 0 },
  };

  it('skips an attempt whose object the catalog cannot resolve — never fabricates a grade', async () => {
    const attempts = buildAttempts('p', [{ conceptId: 'eigenvalues', numAttempts: 1, probCorrect: 1, minDaysAgo: 1, maxDaysAgo: 1 }], NOW, () => 'ghost-obj');
    const sim = await simulate('p', attempts, NOW, async () => null);
    expect(sim.concepts).toEqual({});
    expect(sim.totalXpMinutes).toBe(0);
  });

  it('a fully-correct single attempt produces positive XP and n=1', async () => {
    const attempts = buildAttempts('p', [{ conceptId: 'eigenvalues', numAttempts: 1, probCorrect: 1, minDaysAgo: 1, maxDaysAgo: 1 }], NOW, () => 'obj-1');
    const sim = await simulate('p', attempts, NOW, async (id) => (id === 'obj-1' ? MCQ_OBJ : null));
    expect(sim.concepts['eigenvalues']?.n).toBe(1);
    expect(sim.totalXpMinutes).toBeGreaterThan(0);
  });

  it('totalXpMinutes floors at 0 even under a net-negative simulated history', async () => {
    const attempts = buildAttempts('p', [{ conceptId: 'eigenvalues', numAttempts: 6, probCorrect: 0, minDaysAgo: 1, maxDaysAgo: 3 }], NOW, () => 'obj-1');
    const sim = await simulate('p', attempts, NOW, async (id) => (id === 'obj-1' ? MCQ_OBJ : null));
    expect(sim.totalXpMinutes).toBeGreaterThanOrEqual(0);
  });
});
