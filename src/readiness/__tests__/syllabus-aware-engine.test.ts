/**
 * Tests for src/readiness/syllabus-aware-engine.ts — wraps the default
 * engine with prereq filtering + phase-aware arm weights.
 */

import { describe, it, expect, vi } from 'vitest';
import { makeSyllabusAwareReadinessEngine } from '../syllabus-aware-engine';
import type { ContentExistenceChecker } from '../content-gate';
import type { BatchMasteryStudentModel } from '../../gbrain/student-model-pg';
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

  // ── U1-5: LA-chain on-ramp ──────────────────────────────────────
  // next-best-action fires a prerequisite redirect ONLY when explainer
  // content exists behind every door in the unmet-prereq chain.

  const contentAllowing = (ids: string[]): ContentExistenceChecker => ({
    async hasContent(id) { return ids.includes(id); },
  });

  it('U1-5: redirects to the content-backed prerequisite when the whole chain is content-backed', async () => {
    const eigen = NODE('eigenvalues', ['determinants']);
    const det = NODE('determinants');
    const wexDet = OBJ('wex_det', 'determinants', 'worked_example');
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: model({ determinants: 'not-started' }),
      curriculum: repo([eigen, det], [wexDet]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(6),
      content: contentAllowing(['determinants']),
    });
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 5,
      allowedNodes: ['eigenvalues'],
    });
    // Redirected: the teach candidate should run against 'determinants',
    // not the original blocked 'eigenvalues'.
    expect(action.kind).toBe('teach');
    expect(action.nodeId).toBe('determinants');
    expect(action.rationale).toMatch(/Not ready for eigenvalues yet — determinants first/);
  });

  it('U1-5: suppresses the redirect (falls back to rescue) when one link in the chain has no content', async () => {
    const eigen = NODE('eigenvalues', ['determinants']);
    const det = NODE('determinants', ['matrix-operations']);
    const matrixOps = NODE('matrix-operations');
    const wexEigen = OBJ('wex_eigen', 'eigenvalues', 'worked_example');
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: model({ determinants: 'not-started', 'matrix-operations': 'not-started' }),
      curriculum: repo([eigen, det, matrixOps], [wexEigen]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(6),
      // 'matrix-operations' (the foundational link) has NO content —
      // the whole redirect must be suppressed, never fired partially.
      content: contentAllowing(['determinants']),
    });
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 5,
      allowedNodes: ['eigenvalues'],
    });
    // Same pre-U1-5 rescue behavior: falls back to the original
    // (still-blocked) node set, never redirects to a stub.
    expect(['teach', 'diagnose']).toContain(action.kind);
    expect(action.rationale).not.toMatch(/Not ready for/);
    if (action.kind === 'teach') {
      expect(action.nodeId).toBe('eigenvalues');
    }
  });

  it('U1-5: never redirects when no content checker is wired (safe default)', async () => {
    const eigen = NODE('eigenvalues', ['determinants']);
    const det = NODE('determinants');
    const wexEigen = OBJ('wex_eigen', 'eigenvalues', 'worked_example');
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: model({ determinants: 'not-started' }),
      curriculum: repo([eigen, det], [wexEigen]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(6),
      // no `content` dep at all
    });
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 5,
      allowedNodes: ['eigenvalues'],
    });
    expect(action.rationale).not.toMatch(/Not ready for/);
  });

  it('U1-5: no redirect fires when there is no prerequisite gap (normal behavior unaffected)', async () => {
    const calc2 = NODE('calc2', ['calc1']);
    const wex = OBJ('wex_c2', 'calc2', 'worked_example');
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: model({ calc1: 'practicing' }),
      curriculum: repo([NODE('calc1'), calc2], [wex]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(6),
      content: contentAllowing(['calc1']), // content exists, but irrelevant — no gap to redirect for
    });
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 5,
      allowedNodes: ['calc2'],
    });
    expect(action.kind).toBe('teach');
    expect(action.nodeId).toBe('calc2');
    expect(action.rationale).not.toMatch(/Not ready for/);
  });

  // ── T5 (A1 marquee fix): the redirect must fire even when `eligible`
  // is NON-EMPTY but content-starved — the old bug filtered only on
  // prereq-eligibility and stopped there, so this branch was dead.

  it('T5: redirects when eligible is non-empty but every eligible node is content-starved', async () => {
    // 'root' has NO prereqs, so it's always prereq-eligible — but it has
    // no content. 'eigenvalues' is blocked on 'determinants', which DOES
    // have content. The old code would have used `eligible = ['root']`
    // outright (content irrelevant); T5 must see 'root' lacks content,
    // find no content-backed eligible node, and redirect instead.
    const root = NODE('root');
    const eigen = NODE('eigenvalues', ['determinants']);
    const det = NODE('determinants');
    const wexDet = OBJ('wex_det', 'determinants', 'worked_example');
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: model({ determinants: 'not-started' }),
      curriculum: repo([root, eigen, det], [wexDet]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(6),
      // 'root' is prereq-eligible but content-less; 'determinants' is not
      // prereq-eligible as a direct candidate (it isn't in allowedNodes)
      // but IS the fully content-backed redirect target for 'eigenvalues'.
      content: contentAllowing(['determinants']),
    });
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 5,
      allowedNodes: ['root', 'eigenvalues'],
    });
    expect(action.kind).toBe('teach');
    expect(action.nodeId).toBe('determinants');
    expect(action.rationale).toMatch(/Not ready for eigenvalues yet — determinants first/);
  });

  it('T5: uses the content-backed eligible node directly when one exists (no redirect needed)', async () => {
    const root = NODE('root'); // eligible AND content-backed
    const decoy = NODE('decoy'); // eligible but content-less
    const wexRoot = OBJ('wex_root', 'root', 'worked_example');
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: model(),
      curriculum: repo([root, decoy], [wexRoot]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(6),
      content: contentAllowing(['root']),
    });
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 5,
      allowedNodes: ['decoy', 'root'],
    });
    expect(action.kind).toBe('teach');
    expect(action.nodeId).toBe('root');
    expect(action.rationale).not.toMatch(/Not ready for/);
  });

  // ── T5/§7: batch mastery prefetch ────────────────────────────────

  it('T5: uses BatchMasteryStudentModel.masteryStates() instead of per-call masteryState() when available', async () => {
    const masteryStates = vi.fn(async () => new Map([['calc1', 'practicing']]));
    const masteryState = vi.fn(async () => 'not-started' as const);
    const batchModel: StudentModel & BatchMasteryStudentModel = {
      async abilityFor() { return { rating: 1500, confidence: 0.5, n: 10 }; },
      masteryState,
      async retrievability() { return 0.9; },
      async errorProfile() { return { weights: {}, n: 0 }; },
      async update() {},
      masteryStates,
    };
    const calc2 = NODE('calc2', ['calc1']);
    const wex = OBJ('wex_c2', 'calc2', 'worked_example');
    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: batchModel,
      curriculum: repo([NODE('calc1'), calc2], [wex]),
      selector: selectorReturning(null),
      policy,
      syllabus: syllabus(6),
    });
    const action = await engine.nextBestAction('s', {
      timeBudgetMin: 5,
      allowedNodes: ['calc2'],
    });
    expect(masteryStates).toHaveBeenCalledWith('s', expect.arrayContaining(['calc2', 'calc1']));
    expect(masteryState).not.toHaveBeenCalled();
    // calc1 came back 'practicing' from the batch call → calc2 unblocked.
    expect(action.kind).toBe('teach');
    expect(action.nodeId).toBe('calc2');
  });

  it('T5: falls back to per-call masteryState() when the StudentModel does not implement masteryStates()', async () => {
    // `model()` (the file's default fake) has no `masteryStates` — this
    // locks in that omitting the capability is a safe no-op, not a break.
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
    expect(action.nodeId).toBe('calc2');
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
