/**
 * src/readiness/next-best-action.ts — the L6 orchestrator.
 *
 * The single function the whole app orbits, per blueprint §1.3 / §5.7:
 *
 *   nextBestAction(studentState, curriculumGraph, timeBudget, examModel) → Action
 *
 * Decision order (the four arms of the core learning loop, §2.2):
 *   1. RETAIN  — anything overdue with recall probability < 0.7 and
 *                exam_relevance > 0.3 wins; review beats new every time
 *                when the student's memory is about to leak.
 *   2. PRACTICE — if mastery on the active node is "practicing" and
 *                 there's an in-difficulty-band item, drill it.
 *   3. TEACH   — if mastery is "learning" or "not-started" on a
 *                prereq-cleared node, deliver the teaching object the
 *                policy picks (worked example by default, story / manim
 *                only when motion or motivation earns its cost — per
 *                Challenge C1).
 *   4. DIAGNOSE — fall back to a short calibration item when we lack
 *                 enough signal to confidently route.
 *
 * Each arm is computed as a candidate Action with an expectedGain
 * (marks/minute) and the winner is the maximum, breaking ties toward
 * Retain (locks in marks before chasing new ones — the Extraction
 * priority).
 *
 * This is the reference implementation. Different policies (e.g.
 * exam-week cramming, board-only intent) can be A/B'd by registering
 * different ReadinessEngine implementations behind the same interface.
 */

import type {
  Action,
  ConceptId,
  ItemSelector,
  ReadinessEngine,
  ReadinessEngineDeps,
  StudentId,
  TeachingPolicy,
  CurriculumRepo,
  StudentModel,
} from '../core/interfaces';
import { computeExpectedScore } from './expected-score';

// ────────────────────────────────────────────────────────────────────
// Tuneables — locked here so the policy doesn't drift silently.
// ────────────────────────────────────────────────────────────────────

const RETAIN_RECALL_THRESHOLD = 0.7;     // < this and it's about to leak
const DESIRABLE_DIFFICULTY: [number, number] = [0.7, 0.85];

// ────────────────────────────────────────────────────────────────────
// Reference implementation
// ────────────────────────────────────────────────────────────────────

export class DefaultReadinessEngine implements ReadinessEngine {
  constructor(private deps: ReadinessEngineDeps) {}

  async nextBestAction(
    studentId: StudentId,
    opts: { timeBudgetMin: number; allowedNodes?: ConceptId[] }
  ): Promise<Action> {
    const candidates = await Promise.all([
      this.retainCandidate(studentId, opts),
      this.practiceCandidate(studentId, opts),
      this.teachCandidate(studentId, opts),
    ]);

    const real = candidates.filter((c): c is Action => c !== null);

    if (real.length === 0) {
      return this.diagnoseFallback(opts);
    }

    real.sort((a, b) => {
      if (b.expectedGain !== a.expectedGain) return b.expectedGain - a.expectedGain;
      // Tie-break toward Retain — lock marks in before chasing new ones.
      if (a.kind === 'retain') return -1;
      if (b.kind === 'retain') return 1;
      return 0;
    });

    return real[0];
  }

  async expectedScore(
    studentId: StudentId,
    opts?: { allowedNodes?: ConceptId[]; course?: string },
  ): Promise<{ realized: number; potential: number }> {
    const nodeIds = opts?.allowedNodes ?? [];
    if (nodeIds.length === 0) {
      // Caller didn't scope the assessment — return zeros honestly with
      // an explicit ratio: null so the cockpit knows "no data" vs "scored 0".
      return { realized: 0, potential: 0 };
    }
    const report = await computeExpectedScore(studentId, nodeIds, {
      studentModel: this.deps.studentModel,
      curriculum: this.deps.curriculum,
      course: opts?.course,
    });
    return { realized: report.realized, potential: report.potential };
  }

  // ────────────────────────────────────────────────────────────────
  // Candidate producers
  // ────────────────────────────────────────────────────────────────

  private async retainCandidate(
    studentId: StudentId,
    opts: { timeBudgetMin: number; allowedNodes?: ConceptId[] }
  ): Promise<Action | null> {
    // The selector exposes a Retain path via successBand near 1 — the
    // overdue cards. Caller-side filtering happens in the ItemSelector
    // impl, which knows which objects belong to FSRS cards and which to
    // fresh practice.
    const due = await pickDueReview(this.deps, studentId, opts);
    if (!due) return null;
    return {
      kind: 'retain',
      objectId: due.objectId,
      nodeId: due.nodeId,
      estMinutes: due.estMinutes,
      rationale: `Review now — recall is at ${(due.recall * 100).toFixed(0)}% and falling.`,
      expectedGain: due.expectedGain,
    };
  }

  private async practiceCandidate(
    studentId: StudentId,
    opts: { timeBudgetMin: number; allowedNodes?: ConceptId[] }
  ): Promise<Action | null> {
    const obj = await this.deps.selector.selectNext(studentId, {
      successBand: DESIRABLE_DIFFICULTY,
      allowedNodes: opts.allowedNodes,
      timeBudgetMin: opts.timeBudgetMin,
    });
    if (!obj || obj.type !== 'practice') return null;
    return {
      kind: 'practice',
      objectId: obj.id,
      nodeId: obj.nodeId,
      estMinutes: obj.estMinutes,
      rationale: 'Right-at-the-edge difficulty — this is where memory consolidates.',
      expectedGain: 1.0,   // baseline; Phase 4 lifts with calibrated IRT info-gain
    };
  }

  private async teachCandidate(
    studentId: StudentId,
    opts: { timeBudgetMin: number; allowedNodes?: ConceptId[] }
  ): Promise<Action | null> {
    if (!opts.allowedNodes || opts.allowedNodes.length === 0) return null;
    const nodeId = opts.allowedNodes[0];
    const node = await this.deps.curriculum.getNode(nodeId);
    if (!node) return null;
    const candidates = await this.deps.curriculum.objectsForNode(nodeId, {
      type: 'worked_example',
    });
    if (candidates.length === 0) return null;
    const obj = await this.deps.policy.selectObject(studentId, node, candidates, {
      timeBudgetMin: opts.timeBudgetMin,
    });
    if (!obj) return null;
    return {
      kind: 'teach',
      objectId: obj.id,
      nodeId,
      estMinutes: obj.estMinutes,
      rationale: 'New ground — a worked example before you try it solo.',
      expectedGain: 0.8,
    };
  }

  private diagnoseFallback(opts: { timeBudgetMin: number }): Action {
    return {
      kind: 'diagnose',
      estMinutes: Math.min(3, opts.timeBudgetMin),
      rationale: 'Quick calibration to figure out where you are.',
      expectedGain: 0.3,
    };
  }
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

interface DueReview {
  objectId: string;
  nodeId: string;
  estMinutes: number;
  recall: number;
  expectedGain: number;
}

/**
 * Find the highest-leverage due-for-review card. Concrete FSRS lookup
 * lives in the StudentModel implementation; this helper expresses the
 * pure-function intent so the selector impl is testable in isolation.
 */
async function pickDueReview(
  deps: ReadinessEngineDeps,
  studentId: StudentId,
  opts: { timeBudgetMin: number }
): Promise<DueReview | null> {
  // Phase 1: defer to the selector's "retain" mode if it has one.
  // Phase 2 wires the FSRS-backed lookup directly.
  const obj = await deps.selector.selectNext(studentId, {
    successBand: [0.85, 1.0],         // overdue cards predicted easy
    timeBudgetMin: opts.timeBudgetMin,
    exposureK: 1,
  });
  if (!obj) return null;
  const recall = await deps.studentModel.retrievability(studentId, obj.id);
  if (recall >= RETAIN_RECALL_THRESHOLD) return null;
  return {
    objectId: obj.id,
    nodeId: obj.nodeId,
    estMinutes: obj.estMinutes,
    recall,
    // Extraction-first priority: an overdue card is marks about to leak.
    // The 1.0 floor + (1-recall) bonus guarantees an overdue card outranks
    // a fresh practice candidate (baseline gain 1.0) whenever recall has
    // fallen below the RETAIN_RECALL_THRESHOLD (otherwise pickDueReview
    // would have returned null).
    expectedGain: 1.0 + (1 - recall),
  };
}

/**
 * Build a DefaultReadinessEngine. Re-exported as a small factory so
 * callers don't have to remember the constructor shape.
 */
export function makeReadinessEngine(deps: ReadinessEngineDeps): ReadinessEngine {
  return new DefaultReadinessEngine(deps);
}

export type { ReadinessEngineDeps };
