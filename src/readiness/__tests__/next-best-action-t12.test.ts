/**
 * T12 tests for src/readiness/next-best-action.ts:
 *   - retain via the injected `dueCards` seam (real due-card scan)
 *   - compression-aware practice gain, capped at COMPRESSION_GAIN_CAP (1.3)
 *   - property: an overdue card with recall < RETAIN_RECALL_THRESHOLD (0.7)
 *     ALWAYS outranks a compression-boosted practice action
 *   - domino ranking: due reviews on determinants + matrix-operations make
 *     an eigenvalues practice action outrank an unrelated fresh practice
 *   - teachCandidate's topological-order fix (not just allowedNodes[0])
 */

import { describe, it, expect } from 'vitest';
import { makeReadinessEngine, RETAIN_RECALL_THRESHOLD } from '../next-best-action';
import { COMPRESSION_GAIN_CAP } from '../compression-bonus';
import type {
  StudentModel,
  CurriculumRepo,
  ItemSelector,
  TeachingPolicy,
  LearningObject,
  CurriculumNode,
  DueReviewCandidate,
} from '../../core/interfaces';

function makeObject(over: Partial<LearningObject> = {}): LearningObject {
  return {
    id: 'obj_x', nodeId: 'node_x', type: 'practice', difficulty: 1500,
    estMinutes: 3, prereqs: [], verification: 'cas_passed', payload: {},
    ...over,
  };
}

function makeNode(over: Partial<CurriculumNode> = {}): CurriculumNode {
  return {
    id: 'node_x', course: 'gate-ma', kind: 'concept', title: 'A concept',
    prereqs: [], examRelevance: 0.5,
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

function makeRepo(nodes: Record<string, CurriculumNode>, objects: LearningObject[]): CurriculumRepo {
  return {
    async getNode(id) { return nodes[id] ?? null; },
    async prereqsOf() { return []; },
    async objectsForNode(nodeId) { return objects.filter((o) => o.nodeId === nodeId); },
  };
}

const noPolicy: TeachingPolicy = { async selectObject() { return null; } };
const noSelector: ItemSelector = { async selectNext() { return null; } };

describe('DefaultReadinessEngine — T12: due-card-scan retain', () => {
  it('picks the LOWEST-recall due card among several, ignoring ones at/above threshold', async () => {
    const cards: DueReviewCandidate[] = [
      { objectId: 'ok', nodeId: 'n1', estMinutes: 3, recall: 0.95 },        // not due enough
      { objectId: 'urgent', nodeId: 'n2', estMinutes: 3, recall: 0.2 },     // most urgent
      { objectId: 'mid', nodeId: 'n3', estMinutes: 3, recall: 0.5 },
    ];
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo({}, []),
      selector: noSelector,
      policy: noPolicy,
      dueCards: async () => cards,
    });
    const action = await engine.nextBestAction('alice', { timeBudgetMin: 5 });
    expect(action.kind).toBe('retain');
    expect(action.objectId).toBe('urgent');
    expect(action.expectedGain).toBeCloseTo(1.0 + (1 - 0.2), 10);
  });

  it('a never-seen item (no due card returned at all) never becomes a retain — dueCards seam wired, empty result', async () => {
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(0), // legacy retrievability() would say 0 (never seen)
      curriculum: makeRepo({}, []),
      selector: { async selectNext() { return makeObject({ id: 'never_seen' }); } },
      policy: noPolicy,
      dueCards: async () => [], // real scan: nothing actually due yet
    });
    const action = await engine.nextBestAction('alice', { timeBudgetMin: 5 });
    // No retain candidate (dueCards returned []); practice falls back to
    // the selector's item instead of a bogus "recall at 0%" retain.
    expect(action.kind).not.toBe('retain');
  });

  it('dueCards seam absent (undefined) preserves the exact legacy selector-based path', async () => {
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(0.3),
      curriculum: makeRepo({}, []),
      selector: { async selectNext() { return makeObject({ id: 'legacy_retain' }); } },
      policy: noPolicy,
      // no dueCards field at all
    });
    const action = await engine.nextBestAction('alice', { timeBudgetMin: 5 });
    expect(action.kind).toBe('retain');
    expect(action.objectId).toBe('legacy_retain');
  });
});

describe('DefaultReadinessEngine — T12/B3: compression-aware practice gain', () => {
  it('applies zero bonus (gain stays 1.0) for a concept with no encompassing edges', async () => {
    const obj = makeObject({ id: 'p1', nodeId: 'sequences' });
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo({}, []),
      selector: { async selectNext() { return obj; } },
      policy: noPolicy,
      dueCards: async () => [{ objectId: 'd1', nodeId: 'determinants', estMinutes: 3, recall: 0.9 }],
    });
    const action = await engine.nextBestAction('alice', { timeBudgetMin: 5 });
    expect(action.kind).toBe('practice');
    expect(action.expectedGain).toBe(1.0);
  });

  it('applies a positive bonus when the practice concept encompasses a due concept', async () => {
    const obj = makeObject({ id: 'p1', nodeId: 'eigenvalues' });
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo({}, []),
      selector: { async selectNext() { return obj; } },
      policy: noPolicy,
      dueCards: async () => [{ objectId: 'd1', nodeId: 'determinants', estMinutes: 3, recall: 0.9 }],
    });
    const action = await engine.nextBestAction('alice', { timeBudgetMin: 5 });
    expect(action.kind).toBe('practice');
    expect(action.expectedGain).toBeGreaterThan(1.0);
    expect(action.expectedGain).toBeLessThanOrEqual(COMPRESSION_GAIN_CAP);
  });

  it('caps the gain at COMPRESSION_GAIN_CAP (1.3) even with a huge due-card list', async () => {
    const obj = makeObject({ id: 'p1', nodeId: 'eigenvalues' });
    // Pile on many due cards across the whole closure to try to blow past the cap.
    const manyDueCards: DueReviewCandidate[] = [
      'determinants', 'systems-of-equations', 'matrix-operations', 'matrix-inverse',
    ].map((nodeId, i) => ({ objectId: `d${i}`, nodeId, estMinutes: 3, recall: 0.95 }));
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo({}, []),
      selector: { async selectNext() { return obj; } },
      policy: noPolicy,
      dueCards: async () => manyDueCards,
    });
    const action = await engine.nextBestAction('alice', { timeBudgetMin: 5 });
    expect(action.kind).toBe('practice');
    expect(action.expectedGain).toBeLessThanOrEqual(COMPRESSION_GAIN_CAP);
  });
});

describe('DefaultReadinessEngine — T12 property: overdue retain always outranks compression-boosted practice', () => {
  it('for a spread of recall values below threshold and bonus values, retain wins', async () => {
    const recalls = [0, 0.1, 0.3, 0.5, 0.65, 0.69, 0.699];
    for (const recall of recalls) {
      const retainGain = 1.0 + (1 - recall);
      // Any legal (capped) compression-boosted practice gain.
      for (const bonus of [0, 0.05, 0.3, 10]) { // even a huge raw bonus gets capped
        const practiceGain = Math.min(1.0 + bonus, COMPRESSION_GAIN_CAP);
        expect(retainGain).toBeGreaterThan(practiceGain);
      }
    }
  });

  it('end-to-end: an engine given both an overdue card and a compression-boosted practice item picks retain', async () => {
    const practiceObj = makeObject({ id: 'p1', nodeId: 'eigenvalues' });
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo({}, []),
      selector: { async selectNext() { return practiceObj; } },
      policy: noPolicy,
      dueCards: async () => [
        // Below threshold -> a real retain candidate ...
        { objectId: 'urgent', nodeId: 'determinants', estMinutes: 3, recall: 0.2 },
        // ... AND in eigenvalues' closure, so practice ALSO gets boosted.
        { objectId: 'also-due', nodeId: 'systems-of-equations', estMinutes: 3, recall: 0.9 },
      ],
    });
    const action = await engine.nextBestAction('alice', { timeBudgetMin: 5 });
    expect(action.kind).toBe('retain');
    expect(action.objectId).toBe('urgent');
  });
});

describe('DefaultReadinessEngine — T12 domino ranking: eigenvalues practice outranks unrelated fresh practice', () => {
  it('due reviews on determinants + matrix-operations lift an eigenvalues practice action above an unrelated one', async () => {
    const dueCards: DueReviewCandidate[] = [
      { objectId: 'd1', nodeId: 'determinants', estMinutes: 3, recall: 0.9 },      // above threshold, no retain
      { objectId: 'd2', nodeId: 'matrix-operations', estMinutes: 3, recall: 0.9 },  // above threshold, no retain
    ];

    const eigenObj = makeObject({ id: 'p_eigen', nodeId: 'eigenvalues' });
    const eigenEngine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo({}, []),
      selector: { async selectNext() { return eigenObj; } },
      policy: noPolicy,
      dueCards: async () => dueCards,
    });
    const eigenAction = await eigenEngine.nextBestAction('alice', { timeBudgetMin: 5 });

    const unrelatedObj = makeObject({ id: 'p_unrelated', nodeId: 'sequences' });
    const unrelatedEngine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo({}, []),
      selector: { async selectNext() { return unrelatedObj; } },
      policy: noPolicy,
      dueCards: async () => dueCards,
    });
    const unrelatedAction = await unrelatedEngine.nextBestAction('alice', { timeBudgetMin: 5 });

    expect(eigenAction.kind).toBe('practice');
    expect(unrelatedAction.kind).toBe('practice');
    expect(eigenAction.expectedGain).toBeGreaterThan(unrelatedAction.expectedGain);
    expect(unrelatedAction.expectedGain).toBe(1.0);
  });
});

describe('DefaultReadinessEngine — T12/B3: teachCandidate topological ordering', () => {
  it('picks the prereq-free node, not allowedNodes[0], when a later node depends on an earlier one', async () => {
    // 'later' depends on 'earlier' (both in allowedNodes) — allowedNodes[0]
    // is 'later' (the pre-T12 bug would always propose it).
    const earlier = makeNode({ id: 'earlier', prereqs: [] });
    const later = makeNode({ id: 'later', prereqs: ['earlier'] });
    const wexEarlier = makeObject({ id: 'wex_earlier', type: 'worked_example', nodeId: 'earlier' });
    const wexLater = makeObject({ id: 'wex_later', type: 'worked_example', nodeId: 'later' });

    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo({ earlier, later }, [wexEarlier, wexLater]),
      selector: noSelector,
      policy: { async selectObject(_s, _node, candidates) { return candidates[0] ?? null; } },
    });

    const action = await engine.nextBestAction('bob', {
      timeBudgetMin: 10,
      allowedNodes: ['later', 'earlier'], // deliberately out of topological order
    });
    expect(action.kind).toBe('teach');
    expect(action.nodeId).toBe('earlier');
    expect(action.objectId).toBe('wex_earlier');
  });

  it('falls back to allowedNodes[0] when every candidate blocks on another candidate in scope (or ordering fails)', async () => {
    // 'a' depends on 'b' and 'b' depends on 'a' within the SAME allowedNodes
    // scope (a pathological/inconsistent input) — no zero-in-degree node
    // exists in the induced subgraph; the fix must not throw or hang.
    const a = makeNode({ id: 'a', prereqs: ['b'] });
    const b = makeNode({ id: 'b', prereqs: ['a'] });
    const wexA = makeObject({ id: 'wex_a', type: 'worked_example', nodeId: 'a' });
    const wexB = makeObject({ id: 'wex_b', type: 'worked_example', nodeId: 'b' });

    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo({ a, b }, [wexA, wexB]),
      selector: noSelector,
      policy: { async selectObject(_s, _node, candidates) { return candidates[0] ?? null; } },
    });

    const action = await engine.nextBestAction('bob', { timeBudgetMin: 10, allowedNodes: ['a', 'b'] });
    expect(action.kind).toBe('teach');
    expect(action.nodeId).toBe('a'); // allowedNodes[0] fallback
  });

  it('preserves the original single-node behavior (no ordering ambiguity)', async () => {
    const node = makeNode({ id: 'solo' });
    const wex = makeObject({ id: 'wex_solo', type: 'worked_example', nodeId: 'solo' });
    const engine = makeReadinessEngine({
      studentModel: makeStudentModel(),
      curriculum: makeRepo({ solo: node }, [wex]),
      selector: noSelector,
      policy: { async selectObject(_s, _node, candidates) { return candidates[0] ?? null; } },
    });
    const action = await engine.nextBestAction('bob', { timeBudgetMin: 10, allowedNodes: ['solo'] });
    expect(action.kind).toBe('teach');
    expect(action.nodeId).toBe('solo');
  });
});

describe('RETAIN_RECALL_THRESHOLD / COMPRESSION_GAIN_CAP relationship (ENG-D2)', () => {
  it('COMPRESSION_GAIN_CAP equals 1.0 + (1 - RETAIN_RECALL_THRESHOLD)', () => {
    expect(COMPRESSION_GAIN_CAP).toBeCloseTo(1.0 + (1 - RETAIN_RECALL_THRESHOLD), 10);
  });
});
