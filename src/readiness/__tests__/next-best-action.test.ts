/**
 * Tests for src/readiness/next-best-action.ts — the L6 orchestrator.
 *
 * Uses hand-rolled stubs of the four dep interfaces (StudentModel,
 * CurriculumRepo, ItemSelector, TeachingPolicy) — pure logic, no DB.
 */

import { describe, it, expect } from 'vitest';
import { makeReadinessEngine } from '../next-best-action';
import type {
  StudentModel,
  CurriculumRepo,
  ItemSelector,
  TeachingPolicy,
  LearningObject,
  CurriculumNode,
} from '../../core/interfaces';

function makeObject(over: Partial<LearningObject> = {}): LearningObject {
  return {
    id: 'obj_x',
    nodeId: 'node_x',
    type: 'practice',
    difficulty: 1500,
    estMinutes: 3,
    prereqs: [],
    verification: 'cas_passed',
    payload: {},
    ...over,
  };
}

function makeNode(over: Partial<CurriculumNode> = {}): CurriculumNode {
  return {
    id: 'node_x',
    course: 'gate-ma',
    kind: 'concept',
    title: 'A concept',
    prereqs: [],
    examRelevance: 0.5,
    ...over,
  };
}

function makeStudentModel(retrievabilityValue = 1): StudentModel {
  return {
    async abilityFor() { return { rating: 1500, confidence: 0.5, n: 10 }; },
    async masteryState() { return 'practicing'; },
    async retrievability() { return retrievabilityValue; },
    async errorProfile() { return { weights: {}, n: 0 }; },
    async update() { /* noop */ },
  };
}

function makeRepo(node: CurriculumNode, objects: LearningObject[]): CurriculumRepo {
  return {
    async getNode(id) { return id === node.id ? node : null; },
    async prereqsOf() { return []; },
    async objectsForNode() { return objects; },
  };
}

describe('DefaultReadinessEngine.nextBestAction', () => {
  it('returns a retain action when an overdue card has low recall', async () => {
    const retainObj = makeObject({ id: 'retain_obj' });
    const selector: ItemSelector = {
      async selectNext() { return retainObj; },
    };
    const policy: TeachingPolicy = {
      async selectObject() { return null; },
    };
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(0.3),     // memory leaking
      curriculum: makeRepo(makeNode(), []),
      selector,
      policy,
    });

    const action = await engine.nextBestAction('alice', { timeBudgetMin: 5 });
    expect(action.kind).toBe('retain');
    expect(action.objectId).toBe('retain_obj');
  });

  it('returns a practice action when recall is high but a fresh item is available', async () => {
    const obj = makeObject({ id: 'fresh' });
    const selector: ItemSelector = {
      async selectNext() { return obj; },
    };
    const policy: TeachingPolicy = {
      async selectObject() { return null; },
    };
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(0.95),    // nothing leaking
      curriculum: makeRepo(makeNode(), []),
      selector,
      policy,
    });

    const action = await engine.nextBestAction('alice', { timeBudgetMin: 5 });
    expect(action.kind).toBe('practice');
    expect(action.objectId).toBe('fresh');
  });

  it('falls back to diagnose when no candidates exist', async () => {
    const selector: ItemSelector = { async selectNext() { return null; } };
    const policy: TeachingPolicy = { async selectObject() { return null; } };
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(0.95),
      curriculum: makeRepo(makeNode(), []),
      selector,
      policy,
    });

    const action = await engine.nextBestAction('alice', { timeBudgetMin: 5 });
    expect(action.kind).toBe('diagnose');
    expect(action.estMinutes).toBeLessThanOrEqual(5);
  });

  it('honors a tight time budget', async () => {
    const selector: ItemSelector = { async selectNext() { return null; } };
    const policy: TeachingPolicy = { async selectObject() { return null; } };
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo(makeNode(), []),
      selector,
      policy,
    });

    const action = await engine.nextBestAction('alice', { timeBudgetMin: 1 });
    expect(action.estMinutes).toBeLessThanOrEqual(1);
  });

  it('produces a teach action when a node is allowed and a worked example is available', async () => {
    const wex = makeObject({ id: 'wex', type: 'worked_example', nodeId: 'node_y' });
    const node = makeNode({ id: 'node_y' });
    const selector: ItemSelector = { async selectNext() { return null; } };
    const policy: TeachingPolicy = {
      async selectObject(_s, _node, candidates) {
        return candidates[0] ?? null;
      },
    };
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo(node, [wex]),
      selector,
      policy,
    });
    const action = await engine.nextBestAction('bob', {
      timeBudgetMin: 10,
      allowedNodes: ['node_y'],
    });
    expect(action.kind).toBe('teach');
    expect(action.objectId).toBe('wex');
  });
});
