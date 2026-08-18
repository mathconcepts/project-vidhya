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
  DueReviewCandidate,
  ItemSelector,
  ReadinessEngine,
  ReadinessEngineDeps,
  StudentId,
  TeachingPolicy,
  CurriculumRepo,
  StudentModel,
} from '../core/interfaces';
import { computeExpectedScore } from './expected-score';
import { COMPRESSION_GAIN_CAP, compressionBonus } from './compression-bonus';

// ────────────────────────────────────────────────────────────────────
// Tuneables — locked here so the policy doesn't drift silently.
// ────────────────────────────────────────────────────────────────────

/** < this and it's about to leak. NOTE: compression-bonus.ts's
 *  COMPRESSION_GAIN_CAP (1.3) is `1.0 + (1 - RETAIN_RECALL_THRESHOLD)` —
 *  the two constants must move together (a property test pins this). */
export const RETAIN_RECALL_THRESHOLD = 0.7;
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
    // T12: fetch the due-card scan ONCE (when the seam is wired) and share
    // it between the retain arm (picks the most urgent due card) and the
    // practice arm (compression bonus — does this practice item's implicit
    // credit knock out any of these same due cards?). `undefined` (seam
    // not wired) is a distinct signal from `[]` (wired, nothing due) —
    // retainCandidate falls back to the pre-T12 selector path only on
    // `undefined`.
    const dueCardsList = this.deps.dueCards
      ? await this.deps.dueCards(studentId, new Date(), { allowedNodes: opts.allowedNodes })
      : undefined;

    const candidates = await Promise.all([
      this.retainCandidate(studentId, opts, dueCardsList),
      this.practiceCandidate(studentId, opts, dueCardsList),
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
    opts: { timeBudgetMin: number; allowedNodes?: ConceptId[] },
    dueCardsList: ReadonlyArray<DueReviewCandidate> | undefined,
  ): Promise<Action | null> {
    const due = await pickDueReview(this.deps, studentId, opts, dueCardsList);
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
    opts: { timeBudgetMin: number; allowedNodes?: ConceptId[] },
    dueCardsList: ReadonlyArray<DueReviewCandidate> | undefined,
  ): Promise<Action | null> {
    const obj = await this.deps.selector.selectNext(studentId, {
      successBand: DESIRABLE_DIFFICULTY,
      allowedNodes: opts.allowedNodes,
      timeBudgetMin: opts.timeBudgetMin,
    });
    if (!obj || obj.type !== 'practice') return null;

    // T12/B3: compression-aware gain — does this practice item's implicit
    // (FIRe) credit also knock out any of the student's currently-due
    // reviews? Capped at COMPRESSION_GAIN_CAP (1.3), strictly below the
    // 1.3 floor of a surfaced overdue retain (ENG-D2) so Extraction still
    // wins any real tie.
    const bonus = dueCardsList ? compressionBonus(obj.nodeId, dueCardsList) : 0;
    const expectedGain = Math.min(1.0 + bonus, COMPRESSION_GAIN_CAP);

    return {
      kind: 'practice',
      objectId: obj.id,
      nodeId: obj.nodeId,
      estMinutes: obj.estMinutes,
      rationale: bonus > 0
        ? 'Right-at-the-edge difficulty — plus it knocks out related overdue reviews.'
        : 'Right-at-the-edge difficulty — this is where memory consolidates.',
      expectedGain,
    };
  }

  private async teachCandidate(
    studentId: StudentId,
    opts: { timeBudgetMin: number; allowedNodes?: ConceptId[] }
  ): Promise<Action | null> {
    if (!opts.allowedNodes || opts.allowedNodes.length === 0) return null;
    const nodeId = await this.pickTeachNodeId(studentId, opts.allowedNodes);
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

  /**
   * T12/B3: pick the first node — in topological order — instead of the
   * old `allowedNodes[0]` (which was simply YAML file order: `sequences`
   * is declared first in `gate-ma.yml`, so the engine always proposed it
   * regardless of whether it was the right thing to teach next).
   *
   * Purely graph-structural — no `studentModel` calls here. Mastery-based
   * "non-blocking" filtering is `eligibleNodes()`'s job
   * (`syllabus-context.ts`), which `SyllabusAwareReadinessEngine` already
   * runs (with the batched T5 prefetch) BEFORE narrowing `allowedNodes`
   * and calling into this engine — re-checking mastery here would both
   * duplicate that work and defeat the batched-fetch perf fix. So "all
   * prereqs non-blocking" is read structurally: a node with no prereq
   * that is ALSO present in `allowedNodes` sorts first (a prereq outside
   * the given set is assumed already resolved — exactly what an
   * eligibility-filtered `allowedNodes` guarantees). Ties broken by
   * original `allowedNodes` order for determinism.
   *
   * Falls back to `allowedNodes[0]` whenever ordering can't be computed
   * (a curriculum lookup throws, or nothing qualifies) — never a worse
   * outcome than the pre-T12 behavior.
   */
  private async pickTeachNodeId(
    _studentId: StudentId,
    allowedNodes: ReadonlyArray<ConceptId>,
  ): Promise<ConceptId> {
    try {
      const allowedSet = new Set(allowedNodes);
      for (const id of allowedNodes) {
        const node = await this.deps.curriculum.getNode(id);
        const blockingWithinScope = (node?.prereqs ?? []).filter((p) => allowedSet.has(p));
        if (blockingWithinScope.length === 0) return id;
      }
      // Every candidate blocks on another candidate within the same set
      // (or getNode failed for all of them) — fall back to the pre-T12
      // default rather than guess at a tie-break.
      return allowedNodes[0];
    } catch {
      return allowedNodes[0];
    }
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
 * Find the highest-leverage due-for-review card.
 *
 * T12 (OV2-D1): when `dueCardsList` is provided (the `deps.dueCards` seam
 * is wired), it is the ONLY source consulted — real `fsrs_cards` rows
 * already filtered to `due_at <= now AND reps > 0`, so a student can never
 * get a bogus "recall at 0%" retain on an item they've never attempted
 * (the old selector-based path asked for an easy-band item and checked
 * `retrievability()`, which returns exactly 0 for a never-seen object).
 * Among the due candidates below `RETAIN_RECALL_THRESHOLD`, the one with
 * the LOWEST recall wins (most urgent leak first).
 *
 * `dueCardsList === undefined` (the seam was never wired — legacy
 * callers, unit tests stubbing only the base four deps) falls back to
 * the pre-T12 selector-based path byte-for-byte.
 */
async function pickDueReview(
  deps: ReadinessEngineDeps,
  studentId: StudentId,
  opts: { timeBudgetMin: number; allowedNodes?: ConceptId[] },
  dueCardsList: ReadonlyArray<DueReviewCandidate> | undefined,
): Promise<DueReview | null> {
  if (dueCardsList !== undefined) {
    let best: DueReviewCandidate | null = null;
    for (const candidate of dueCardsList) {
      if (candidate.recall >= RETAIN_RECALL_THRESHOLD) continue;
      if (!best || candidate.recall < best.recall) best = candidate;
    }
    if (!best) return null;
    return {
      objectId: best.objectId,
      nodeId: best.nodeId,
      estMinutes: best.estMinutes,
      recall: best.recall,
      expectedGain: 1.0 + (1 - best.recall),
    };
  }

  // Legacy (pre-T12) path — selector-based, kept exactly as it was for
  // callers that don't wire `deps.dueCards`.
  const obj = await deps.selector.selectNext(studentId, {
    successBand: [0.85, 1.0],         // overdue cards predicted easy
    allowedNodes: opts.allowedNodes,
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
