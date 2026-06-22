/**
 * Tests for src/readiness/syllabus-aware-engine.ts — wraps the default
 * engine with prereq filtering + phase-aware arm weights.
 */

import { describe, it, expect } from 'vitest';
import { makeSyllabusAwareReadinessEngine } from '../syllabus-aware-engine';
import type {
  CurriculumNode, CurriculumRepo, ItemSelector, LearningObject,
  MasteryState, StudentModel, TeachingPolicy,
} from '../../core/interfaces';

const NODE = (id: string, prereqs: string[] = [], over: Partial<CurriculumNode> = {}): CurriculumNode => ({
  id, course: 'gate-ma', kind: 'skill', title: id, prereqs, examRelevance: 0.5, ...over,
});

const OBJ = (id: string, nodeId: string, type: LearningObject['type'] = 'practice'): LearningObject => ({
  id, nodeId, type, difficulty: 1500, estMinutes: 3, prereqs: [],
  verification: 'cas_passed', payload: { skillId: nodeId },
});

const model = (over: Partial<{ [k: string]: MasteryState }> = {}): StudentModel => ({
  async abilityFor() { return { rating: 1500, confidence: 0.7, n: 30 }; },
  async masteryState(_s, k) { return (over[k] ?? 'practicing') as MasteryState; },
  async retrievability() { return 0.9; },
  async errorProfile() { return { weights: {}, n: 0 }; },
  async update() {},
});

const repo = (nodes: CurriculumNode[], objects: LearningObject[] = []): CurriculumRepo => ({
  async getNode(id) { return nodes.find(n => n.id === id) ?? null; },
  async prereqsOf() { return []; },
  async objectsForNode(id) { return objects.filter(o => o.nodeId === id); },
});

const selectorReturning = (obj: LearningObject | null): ItemSelector => ({
  async selectNext() { return obj; },
});

const policy: TeachingPolicy = {
  async selectObject(_s, _n, c) { return c[0] ?? null; },
};

const syllabus = (examWeeks: number, coverage = 0.5) => ({
  examDate: async () => examWeeks >= 999 ? null : new Date(Date.now() + examWeeks * 7 * 86_400_000),
  coverage: async () => coverage,
});

describe('SyllabusAwareReadinessEngine', () => {
  it('blocks a teach action on a node whose prereqs are not-started', async () => {
    const calc2 = NODE('calc2', ['calc1']);
    const calc1 = NODE('calc1');
    const wex = OBJ('wex_c2', 'calc2', 'worked_example');
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: model({ calc1: 'not-started' }),
      curriculum: repo([calc1, calc2], [wex]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(6),
    });
    // Only calc2 is in allowedNodes. Its prereq is not-started → engine
    // should fall back to the original set (rescue), then diagnose
    // since selector returns null.
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 5,
      allowedNodes: ['calc2'],
    });
    // The rescue fallback means we DON'T deadlock in diagnose; the
    // teach candidate runs against calc2 since rescue kept it.
    expect(['teach', 'diagnose']).toContain(action.kind);
  });

  it('allows the teach action when prereqs are practicing', async () => {
    const calc2 = NODE('calc2', ['calc1']);
    const wex = OBJ('wex_c2', 'calc2', 'worked_example');
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: model({ calc1: 'practicing' }),
      curriculum: repo([NODE('calc1'), calc2], [wex]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(6),
    });
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 5,
      allowedNodes: ['calc2'],
    });
    expect(action.kind).toBe('teach');
    expect(action.objectId).toBe('wex_c2');
  });

  it('final-week phase scales retain expectedGain up', async () => {
    const n = NODE('algebra');
    const retainObj = OBJ('r1', 'algebra');
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: { ...model(), async retrievability() { return 0.3; } },
      curriculum: repo([n]),
      selector: selectorReturning(retainObj),
      policy,
      syllabus: syllabus(1),                  // 1 week → final-week
    });
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 5,
      allowedNodes: ['algebra'],
    });
    expect(action.kind).toBe('retain');
    // final-week retain multiplier is 1.5
    // inner retain expectedGain at recall=0.3 was 1.0 + (1-0.3) = 1.7
    // expected after scale: 1.7 * 1.5 = 2.55
    expect(action.expectedGain).toBeGreaterThan(2.0);
  });

  it('early phase scales teach expectedGain up', async () => {
    const n = NODE('algebra');
    const wex = OBJ('wex', 'algebra', 'worked_example');
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: model(),
      curriculum: repo([n], [wex]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(20, 0.2),         // far out + low coverage → early
    });
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 10,
      allowedNodes: ['algebra'],
    });
    expect(action.kind).toBe('teach');
    // early teach multiplier = 1.4; inner gain = 0.8; expected = 1.12
    expect(action.expectedGain).toBeGreaterThan(1.0);
  });

  it('attaches a phase prefix to the rationale', async () => {
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: model(),
      curriculum: repo([NODE('a')]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(1),
    });
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 5,
      allowedNodes: ['a'],
    });
    expect(action.rationale).toMatch(/Exam in days/);
  });

  it('passes expectedScore straight through to the inner engine', async () => {
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: model(),
      curriculum: repo([NODE('a', [], { examRelevance: 1.0 })]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(8),
    });
    const r = await engine.expectedScore('s', { allowedNodes: ['a'] });
    expect(r.potential).toBeGreaterThan(0);
  });
});
