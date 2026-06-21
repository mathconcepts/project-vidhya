/**
 * Integration: ProtoCATSelector + InMemoryCatalog + DefaultReadinessEngine.
 *
 * The Wave 4 promise was: with a real selector, the four-arm core loop
 * actually returns concrete practice/retain actions instead of falling
 * back to diagnose. This proves it end-to-end against an in-memory stack.
 */

import { describe, it, expect } from 'vitest';
import { makeReadinessEngine } from '../next-best-action';
import { ProtoCATSelector } from '../../scoring/proto-cat-selector';
import { InMemoryCatalog } from '../../scoring/learning-object-catalog';
import type {
  CurriculumRepo,
  LearningObject,
  CurriculumNode,
  StudentModel,
  TeachingPolicy,
} from '../../core/interfaces';

function obj(over: Partial<LearningObject> & { id: string; nodeId: string; difficulty: number }): LearningObject {
  return {
    id: over.id, nodeId: over.nodeId, type: 'practice',
    difficulty: over.difficulty, estMinutes: 3, prereqs: [],
    verification: 'cas_passed',
    payload: { skillId: over.nodeId, ...(over.payload as object ?? {}) },
    ...over,
  };
}

const ALGEBRA: CurriculumNode = {
  id: 'algebra', course: 'gate-ma', kind: 'skill',
  title: 'Algebra', prereqs: [], examRelevance: 0.6,
};

function modelAt(rating: number, recall = 0.95): StudentModel {
  return {
    async abilityFor() { return { rating, confidence: 0.7, n: 25 }; },
    async masteryState() { return 'practicing'; },
    async retrievability() { return recall; },
    async errorProfile() { return { weights: {}, n: 0 }; },
    async update() {},
  };
}

function repo(node: CurriculumNode, objects: LearningObject[]): CurriculumRepo {
  return {
    async getNode(id) { return id === node.id ? node : null; },
    async prereqsOf() { return []; },
    async objectsForNode() { return objects.filter(o => o.nodeId === node.id); },
  };
}

const policy: TeachingPolicy = {
  async selectObject(_s, _n, c) { return c[0] ?? null; },
};

describe('Wave 4 integration: real engine + real selector', () => {
  it('produces a practice action when the catalog has an in-band item', async () => {
    const catalog = new InMemoryCatalog([
      obj({ id: 'in_band', nodeId: 'algebra', difficulty: 1320 }),
    ]);
    const selector = new ProtoCATSelector({
      studentModel: modelAt(1500),
      catalog,
      rng: () => 0,
    });
    const engine = makeReadinessEngine({
      studentModel: modelAt(1500),
      curriculum: repo(ALGEBRA, []),
      selector,
      policy,
    });
    const action = await engine.nextBestAction('s1', {
      timeBudgetMin: 5,
      allowedNodes: ['algebra'],
    });
    expect(action.kind).toBe('practice');
    expect(action.objectId).toBe('in_band');
  });

  it('returns a retain action when recall is low and an easy item exists', async () => {
    const easy = obj({ id: 'easy', nodeId: 'algebra', difficulty: 1100 }); // p ~0.91 at rating 1500
    const selector = new ProtoCATSelector({
      studentModel: modelAt(1500),
      catalog: new InMemoryCatalog([easy]),
      rng: () => 0,
    });
    const engine = makeReadinessEngine({
      studentModel: modelAt(1500, 0.3),       // memory leaking
      curriculum: repo(ALGEBRA, []),
      selector,
      policy,
    });
    const action = await engine.nextBestAction('s1', {
      timeBudgetMin: 5,
      allowedNodes: ['algebra'],
    });
    expect(action.kind).toBe('retain');
    expect(action.objectId).toBe('easy');
  });

  it('falls back to diagnose when the catalog is empty', async () => {
    const selector = new ProtoCATSelector({
      studentModel: modelAt(1500),
      catalog: new InMemoryCatalog([]),
      rng: () => 0,
    });
    const engine = makeReadinessEngine({
      studentModel: modelAt(1500),
      curriculum: repo(ALGEBRA, []),
      selector,
      policy,
    });
    const action = await engine.nextBestAction('s1', {
      timeBudgetMin: 5,
      allowedNodes: ['algebra'],
    });
    expect(action.kind).toBe('diagnose');
  });

  it('serves a teach action via the policy when a worked example is registered on the node', async () => {
    const wex = obj({ id: 'wex', nodeId: 'algebra', difficulty: 1400 });
    const wexAsTeach: LearningObject = { ...wex, type: 'worked_example' };
    const selector = new ProtoCATSelector({
      studentModel: modelAt(1500),
      catalog: new InMemoryCatalog([]),     // no practice items
      rng: () => 0,
    });
    const engine = makeReadinessEngine({
      studentModel: modelAt(1500),
      curriculum: repo(ALGEBRA, [wexAsTeach]),
      selector,
      policy,
    });
    const action = await engine.nextBestAction('s1', {
      timeBudgetMin: 5,
      allowedNodes: ['algebra'],
    });
    expect(action.kind).toBe('teach');
    expect(action.objectId).toBe('wex');
  });
});
