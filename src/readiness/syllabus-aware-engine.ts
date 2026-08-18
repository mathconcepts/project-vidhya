/**
 * src/readiness/syllabus-aware-engine.ts — Wave 5's ReadinessEngine.
 *
 * Decorates DefaultReadinessEngine with syllabus-position reasoning:
 *
 *   1. Filter allowedNodes by prereq mastery — a student doesn't get
 *      Calc 2 recommended until Calc 1 is at least 'practicing'.
 *   2. Detect prep phase from weeksToExam + pctSyllabusCovered.
 *   3. Multiply the inner engine's expectedGain by phase-specific arm
 *      weights — final-week shifts toward Retain, early shifts toward
 *      Teach. (Implemented by re-asking the inner engine for each arm
 *      and applying the multiplier; cheaper than reimplementing the
 *      four-arm loop.)
 *
 * Same `ReadinessEngine` interface. Any caller that depends on the
 * interface (the API routes, the cockpit) can swap in this impl
 * without touching anything else.
 *
 * The SyllabusContextProvider is the integration seam to the legacy
 * exam-profile-store (which already tracks exam_date + prep_intent).
 * Tests pass an inline provider; production wires the real store.
 */

import type {
  Action,
  ConceptId,
  MasteryState,
  ReadinessEngine,
  ReadinessEngineDeps,
  StudentId,
} from '../core/interfaces';
import {
  eligibleNodes,
  armWeightsForPhase,
  inferPhase,
  pctSyllabusCovered,
  weeksToExam,
  type ArmWeights,
  type PrepPhase,
} from './syllabus-context';
import { findFirstPrereqRedirect, type ContentExistenceChecker, type PrereqRedirect } from './content-gate';
import { DefaultReadinessEngine } from './next-best-action';
import type { BatchMasteryStudentModel } from '../gbrain/student-model-pg';

// ────────────────────────────────────────────────────────────────────
// Integration seam — provides per-student exam context.
// ────────────────────────────────────────────────────────────────────

export interface SyllabusContextProvider {
  /** Per-student exam date (null = no exam scheduled → treat as far future). */
  examDate(studentId: StudentId): Promise<Date | null>;
  /** Per-student coverage 0..1. Caller may aggregate over the student's exam-pack skills. */
  coverage(studentId: StudentId): Promise<number>;
}

export interface SyllabusAwareReadinessDeps extends ReadinessEngineDeps {
  syllabus: SyllabusContextProvider;
  /** Override clock for deterministic tests. */
  now?: () => Date;
  /**
   * U1-5 seam: when provided, an all-blocked `allowedNodes` set is given
   * one more chance before the pre-U1-5 rescue (fall back to the
   * original set) — a content-backed prerequisite redirect, per
   * `src/readiness/content-gate.ts`. Omitting this dep preserves the
   * exact pre-U1-5 behavior (no redirect ever fires); production wires
   * `getAtomContentChecker()` from `atom-content-checker.ts`.
   */
  content?: ContentExistenceChecker;
}

// ────────────────────────────────────────────────────────────────────
// Implementation
// ────────────────────────────────────────────────────────────────────

export class SyllabusAwareReadinessEngine implements ReadinessEngine {
  private inner: DefaultReadinessEngine;

  constructor(private deps: SyllabusAwareReadinessDeps) {
    this.inner = new DefaultReadinessEngine(deps);
  }

  async nextBestAction(
    studentId: StudentId,
    opts: { timeBudgetMin: number; allowedNodes?: ConceptId[] },
  ): Promise<Action> {
    const phase = await this.phaseFor(studentId);
    const weights = armWeightsForPhase(phase);

    // Filter allowedNodes by prereq readiness. If the caller didn't pass
    // any, we don't synthesise — the inner engine handles "no nodes →
    // diagnose" already.
    let scopedNodes: ConceptId[] | undefined = opts.allowedNodes;
    let redirect: PrereqRedirect | null = null;
    if (scopedNodes && scopedNodes.length > 0) {
      const originalCandidates = scopedNodes;

      // T5/§7: batch-fetch mastery for the candidates + their prereqs in
      // ONE round-trip (when the wired StudentModel supports it) instead
      // of eligibleNodes() awaiting masteryState() per prereq edge.
      const prefetchedMastery = await this.prefetchMastery(studentId, originalCandidates);

      const eligible = await eligibleNodes(originalCandidates, studentId, {
        curriculum: this.deps.curriculum,
        studentModel: this.deps.studentModel,
      }, prefetchedMastery);

      // T5 (A1 — the marquee fix): prereq-eligible is necessary but not
      // sufficient. Without real content behind a node, recommending it
      // is a dead end (the old bug: `resolveAllowedNodes()` returns all
      // 97 concept ids, most of which have no content, so `eligible`
      // was almost always non-empty and this redirect branch never ran).
      // Filter `eligible` down to nodes that are ALSO content-backed —
      // when no `content` checker is wired, skip the filter entirely
      // (exact pre-T5 behavior: prereq-eligibility only).
      const contentBacked = this.deps.content
        ? await filterHasContent(eligible, this.deps.content)
        : eligible;

      if (contentBacked.length > 0) {
        scopedNodes = contentBacked;
      } else if (this.deps.content) {
        // Every prereq-eligible node (if any) is content-starved, or
        // nothing was prereq-eligible at all. Before the defensive
        // rescue (fall back to the original, still-unusable set), see
        // whether any of the STUDENT'S ORIGINAL candidates — not just
        // the prereq-eligible subset, which a blocked node can't be
        // part of — has a FULLY content-backed prerequisite chain: the
        // "LA-chain on-ramp." findFirstPrereqRedirect only returns
        // non-null when every single node in that chain has real
        // explainer content AND a gradable catalog item; a single
        // missing link means null, never a partial redirect.
        redirect = await findFirstPrereqRedirect(originalCandidates, studentId, {
          curriculum: this.deps.curriculum,
          studentModel: this.deps.studentModel,
          content: this.deps.content,
        });
        if (redirect) scopedNodes = [redirect.redirectTo];
        // else: no candidate's chain is fully content-backed — fall
        // through to the unchanged rescue-to-original-set behavior below.
      }
      // Defensive: if scopedNodes is still `originalCandidates` at this
      // point (no content checker wired and eligible was empty; or a
      // content checker is wired but nothing rescued it), that's the
      // intentional fallback — the engine never deadlocks into an
      // empty-set diagnose trap.
    }

    const innerAction = await this.inner.nextBestAction(studentId, {
      timeBudgetMin: opts.timeBudgetMin,
      allowedNodes: scopedNodes,
    });

    // Apply phase weight to expectedGain. Note: the kind ranking
    // changes only if a different arm becomes the maximum — but the
    // inner engine already picked its best arm. We can't re-rank
    // without recomputing, but we CAN scale the surfaced gain so the
    // cockpit sees an honest phase-adjusted value.
    const scale = weightFor(innerAction.kind, weights);
    const rationale = redirect
      ? prefixPhase(phase, redirectRationale(redirect))
      : prefixPhase(phase, innerAction.rationale);
    return {
      ...innerAction,
      expectedGain: innerAction.expectedGain * scale,
      rationale,
    };
  }

  async expectedScore(
    studentId: StudentId,
    opts?: { allowedNodes?: ConceptId[]; course?: string },
  ): Promise<{ realized: number; potential: number }> {
    return this.inner.expectedScore(studentId, opts);
  }

  // ────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────

  private async phaseFor(studentId: StudentId): Promise<PrepPhase> {
    const now = this.deps.now ? this.deps.now() : new Date();
    const date = await this.deps.syllabus.examDate(studentId);
    const wks = weeksToExam(date, now);
    const cov = await this.deps.syllabus.coverage(studentId);
    return inferPhase({ weeksToExam: wks, pctSyllabusCovered: cov });
  }

  /**
   * T5/§7 perf seam: builds one prefetched `ConceptId → MasteryState` map
   * covering `candidates` AND their direct prereqs (everything
   * `eligibleNodes()` would otherwise fetch one-at-a-time), via a single
   * batched `masteryStates()` call — IF the wired `StudentModel` supports
   * it (duck-typed against `BatchMasteryStudentModel`). `curriculum.getNode`
   * lookups here are in-memory (`ConceptGraphCurriculumRepo` — no Pg
   * round-trip), so walking `candidates` to collect prereq ids costs
   * nothing extra. Returns `undefined` — never throws — when the model
   * doesn't support batching or the batch call itself fails; callers fall
   * straight back to `eligibleNodes()`'s original per-call path.
   */
  private async prefetchMastery(
    studentId: StudentId,
    candidates: ReadonlyArray<ConceptId>,
  ): Promise<ReadonlyMap<ConceptId, MasteryState> | undefined> {
    const batchModel = this.deps.studentModel as Partial<BatchMasteryStudentModel>;
    if (typeof batchModel.masteryStates !== 'function') return undefined;

    const idsToFetch = new Set<ConceptId>(candidates);
    for (const id of candidates) {
      const node = await this.deps.curriculum.getNode(id);
      if (node) for (const p of node.prereqs) idsToFetch.add(p);
    }
    if (idsToFetch.size === 0) return undefined;

    try {
      return await batchModel.masteryStates(studentId, Array.from(idsToFetch));
    } catch (err) {
      console.error(
        '[syllabus-aware-engine] batch mastery prefetch failed, falling back to per-call path:',
        (err as Error).message,
      );
      return undefined;
    }
  }
}

function weightFor(kind: Action['kind'], w: ArmWeights): number {
  switch (kind) {
    case 'retain': return w.retain;
    case 'practice': return w.practice;
    case 'teach': return w.teach;
    case 'diagnose': return w.diagnose;
  }
}

/**
 * T5: filters `ids` down to the ones `content.hasContent()` confirms.
 * Fail-closed per node, mirroring `findPrereqRedirect`'s own per-link
 * check — a checker error means "assume no content", never a guess.
 */
async function filterHasContent(
  ids: ReadonlyArray<ConceptId>,
  content: ContentExistenceChecker,
): Promise<ConceptId[]> {
  const result: ConceptId[] = [];
  for (const id of ids) {
    let ok: boolean;
    try {
      ok = await content.hasContent(id);
    } catch {
      ok = false;
    }
    if (ok) result.push(id);
  }
  return result;
}

/** The exact marker `redirectRationale()` below emits — kept as one constant so detection (T15's metrics) can never drift from the copy. */
const REDIRECT_RATIONALE_MARKER = 'Not ready for ';

/**
 * U1-5 rationale: honest about WHY the student is being routed to a
 * prerequisite instead of the concept they were scoped to. Never hides
 * the redirect — "labels never lie" applies to rationale copy too.
 */
function redirectRationale(r: PrereqRedirect): string {
  return `${REDIRECT_RATIONALE_MARKER}${r.originalNodeId} yet — ${r.redirectTo} first.`;
}

/**
 * T15: cheap, non-coupling way for an observability layer to tell a
 * redirect fired without threading a new field through `Action` (which
 * every `ReadinessEngine` implementation would then need to populate).
 * Exported so readiness-routes.ts's metrics recording and this module's
 * own tests share one definition instead of two regexes that could drift.
 */
export function rationaleIndicatesRedirect(rationale: string): boolean {
  return rationale.includes(REDIRECT_RATIONALE_MARKER);
}

function prefixPhase(phase: PrepPhase, rationale: string): string {
  // Phase shows up in the student-facing rationale — "exam in 3 weeks,
  // so the bias has shifted toward locking in marks." Honest > hidden.
  const labels: Record<PrepPhase, string> = {
    'early': 'Early in your prep — ',
    'mid': 'Mid-prep — ',
    'crunch': 'Crunch time — ',
    'final-week': 'Exam in days — ',
  };
  return labels[phase] + rationale;
}

export function makeSyllabusAwareReadinessEngine(deps: SyllabusAwareReadinessDeps): ReadinessEngine {
  return new SyllabusAwareReadinessEngine(deps);
}
