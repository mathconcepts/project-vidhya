/**
 * Tests for src/scoring/proto-cat-selector.ts — Wave 4 ItemSelector.
 *
 * Pure logic via stubbed StudentModel + InMemoryCatalog.
 */

import { describe, it, expect } from 'vitest';
import {
  ProtoCATSelector,
  eloFromSuccess,
  scoreCandidate,
  DEFAULT_SUCCESS_BAND,
} from '../proto-cat-selector';
import { InMemoryCatalog } from '../learning-object-catalog';
import type { LearningObject, StudentModel } from '../../core/interfaces';

function obj(over: Partial<LearningObject> & { id: string; difficulty: number; nodeId: string }): LearningObject {
  return {
    nodeId: over.nodeId,
    id: over.id,
    type: 'practice',
    difficulty: over.difficulty,
    estMinutes: over.estMinutes ?? 3,
    prereqs: [],
    verification: 'cas_passed',
    payload: { skillId: over.nodeId },
    ...over,
  };
}

function modelAt(rating: number, n = 30): Pick<StudentModel, 'abilityFor'> {
  return {
    async abilityFor() { return { rating, confidence: 0.8, n }; },
  };
}

const seededRng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

describe('eloFromSuccess', () => {
  it('roundtrips through expectedSuccess', async () => {
    // p=0.5 at d=a
    expect(eloFromSuccess(1500, 0.5)).toBeCloseTo(1500, 6);
    // p=0.7 at d below a (item easier)
    expect(eloFromSuccess(1500, 0.7)).toBeLessThan(1500);
    // p=0.3 at d above a (item harder)
    expect(eloFromSuccess(1500, 0.3)).toBeGreaterThan(1500);
  });
});

describe('scoreCandidate', () => {
  it('peaks at p=0.5 in info mode', () => {
    const a = scoreCandidate({ successProb: 0.5, exposure: 0, isRetainMode: false, examRelevance: 1, estMinutes: 3 });
    const b = scoreCandidate({ successProb: 0.7, exposure: 0, isRetainMode: false, examRelevance: 1, estMinutes: 3 });
    expect(a).toBeGreaterThan(b);
  });

  it('exam_relevance scales linearly', () => {
    const high = scoreCandidate({ successProb: 0.5, exposure: 0, isRetainMode: false, examRelevance: 1, estMinutes: 3 });
    const low = scoreCandidate({ successProb: 0.5, exposure: 0, isRetainMode: false, examRelevance: 0.5, estMinutes: 3 });
    expect(low).toBeCloseTo(high * 0.5, 6);
  });

  it('overexposed items get penalised', () => {
    const fresh = scoreCandidate({ successProb: 0.5, exposure: 0, isRetainMode: false, examRelevance: 1, estMinutes: 3 });
    const stale = scoreCandidate({ successProb: 0.5, exposure: 8, isRetainMode: false, examRelevance: 1, estMinutes: 3 });
    expect(stale).toBeLessThan(fresh);
  });

  it('items that overshoot time budget take a heavy hit', () => {
    const fits = scoreCandidate({ successProb: 0.5, exposure: 0, isRetainMode: false, examRelevance: 1, estMinutes: 3, timeBudgetMin: 5 });
    const oversized = scoreCandidate({ successProb: 0.5, exposure: 0, isRetainMode: false, examRelevance: 1, estMinutes: 10, timeBudgetMin: 5 });
    expect(oversized).toBeLessThan(fits * 0.5);
  });

  it('retain mode favors high success probability, not ambiguity', () => {
    const easy = scoreCandidate({ successProb: 0.9, exposure: 0, isRetainMode: true, examRelevance: 1, estMinutes: 3 });
    const ambiguous = scoreCandidate({ successProb: 0.5, exposure: 0, isRetainMode: true, examRelevance: 1, estMinutes: 3 });
    expect(easy).toBeGreaterThan(ambiguous);
  });
});

describe('ProtoCATSelector.selectNext', () => {
  it('returns null when no allowedNodes are supplied', async () => {
    const sel = new ProtoCATSelector({
      studentModel: modelAt(1500),
      catalog: new InMemoryCatalog([]),
    });
    const r = await sel.selectNext('s1', {});
    expect(r).toBeNull();
  });

  it('returns null when the catalog has nothing in the band', async () => {
    const sel = new ProtoCATSelector({
      studentModel: modelAt(1500),
      catalog: new InMemoryCatalog([
        obj({ id: 'too_easy', difficulty: 800, nodeId: 'algebra' }),
        obj({ id: 'too_hard', difficulty: 2200, nodeId: 'algebra' }),
      ]),
      rng: seededRng(1),
    });
    const r = await sel.selectNext('s1', { allowedNodes: ['algebra'] });
    expect(r).toBeNull();
  });

  it('picks an item in the [0.7, 0.85] band when one exists', async () => {
    const sel = new ProtoCATSelector({
      studentModel: modelAt(1500),
      catalog: new InMemoryCatalog([
        // p=0.5 at 1500, p=0.76 at ~1300, p=0.71 at ~1350
        obj({ id: 'in_band', difficulty: 1320, nodeId: 'algebra' }),
        obj({ id: 'too_easy', difficulty: 900, nodeId: 'algebra' }),
        obj({ id: 'too_hard', difficulty: 1800, nodeId: 'algebra' }),
      ]),
      rng: seededRng(1),
    });
    const r = await sel.selectNext('s1', { allowedNodes: ['algebra'] });
    expect(r?.id).toBe('in_band');
  });

  it('honors a custom successBand', async () => {
    // Caller wants harder items (success 0.4-0.6).
    const sel = new ProtoCATSelector({
      studentModel: modelAt(1500),
      catalog: new InMemoryCatalog([
        obj({ id: 'mid', difficulty: 1500, nodeId: 'algebra' }),       // p=0.5
        obj({ id: 'easy', difficulty: 1300, nodeId: 'algebra' }),     // p~0.76
      ]),
      rng: seededRng(1),
    });
    const r = await sel.selectNext('s1', {
      allowedNodes: ['algebra'],
      successBand: [0.4, 0.6],
    });
    expect(r?.id).toBe('mid');
  });

  it('exposure penalty pushes a heavily-served item out of the top pick', async () => {
    const cat = new InMemoryCatalog([
      obj({ id: 'a', difficulty: 1320, nodeId: 'algebra' }),
      obj({ id: 'b', difficulty: 1330, nodeId: 'algebra' }),
    ]);
    // 'a' has been seen 12 times — should lose to 'b'.
    for (let i = 0; i < 12; i++) cat.bumpExposure('a');
    const sel = new ProtoCATSelector({
      studentModel: modelAt(1500),
      catalog: cat,
      rng: seededRng(1),
    });
    const r = await sel.selectNext('s1', { allowedNodes: ['algebra'], exposureK: 1 });
    expect(r?.id).toBe('b');
  });

  it('retain mode picks the easiest-handled item, not the maximally ambiguous one', async () => {
    const sel = new ProtoCATSelector({
      studentModel: modelAt(1700),
      catalog: new InMemoryCatalog([
        obj({ id: 'easy', difficulty: 1200, nodeId: 'algebra' }),    // p=0.95 — easy
        obj({ id: 'edge', difficulty: 1500, nodeId: 'algebra' }),    // p~0.76
      ]),
      rng: seededRng(2),
    });
    const r = await sel.selectNext('s1', {
      allowedNodes: ['algebra'],
      successBand: [0.85, 1.0],   // retain mode
    });
    expect(r?.id).toBe('easy');
  });

  it('is deterministic given a seeded RNG', async () => {
    const cat = new InMemoryCatalog([
      obj({ id: 'a', difficulty: 1310, nodeId: 'algebra' }),
      obj({ id: 'b', difficulty: 1320, nodeId: 'algebra' }),
      obj({ id: 'c', difficulty: 1330, nodeId: 'algebra' }),
    ]);
    const seln = () => new ProtoCATSelector({
      studentModel: modelAt(1500), catalog: cat, rng: seededRng(7),
    });
    const r1 = await seln().selectNext('s1', { allowedNodes: ['algebra'] });
    const r2 = await seln().selectNext('s1', { allowedNodes: ['algebra'] });
    expect(r1?.id).toBe(r2?.id);
  });

  it('cross-skill selection considers all allowedNodes', async () => {
    const sel = new ProtoCATSelector({
      studentModel: modelAt(1500),
      catalog: new InMemoryCatalog([
        obj({ id: 'algebra_item', difficulty: 1320, nodeId: 'algebra' }),
        obj({ id: 'calc_item', difficulty: 1320, nodeId: 'calc' }),
      ]),
      rng: seededRng(0),
    });
    const r = await sel.selectNext('s1', { allowedNodes: ['algebra', 'calc'] });
    expect(['algebra_item', 'calc_item']).toContain(r?.id);
  });

  it('uses DEFAULT_SUCCESS_BAND when caller omits successBand', async () => {
    const cat = new InMemoryCatalog([
      obj({ id: 'in_default_band', difficulty: 1320, nodeId: 'algebra' }),
    ]);
    const sel = new ProtoCATSelector({
      studentModel: modelAt(1500), catalog: cat, rng: seededRng(1),
    });
    const r = await sel.selectNext('s1', { allowedNodes: ['algebra'] });
    expect(r?.id).toBe('in_default_band');
    // sanity: default band is what we think it is
    expect(DEFAULT_SUCCESS_BAND).toEqual([0.7, 0.85]);
  });
});
