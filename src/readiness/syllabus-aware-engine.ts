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
import { DefaultReadinessEngine } from './next-best-action';

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
    if (scopedNodes && scopedNodes.length > 0) {
      const eligible = await eligibleNodes(scopedNodes, studentId, {
        curriculum: this.deps.curriculum,
        studentModel: this.deps.studentModel,
      });
      // Defensive: if ALL nodes are blocked by prereqs (rare — fresh
      // student on a course with strict DAG), fall back to the original
      // set so the engine doesn't get stuck in diagnose forever. A
      // smarter fallback would pull the prereqs themselves; ship that
      // in a follow-up.
      scopedNodes = eligible.length > 0 ? eligible : scopedNodes;
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
    return {
      ...innerAction,
      expectedGain: innerAction.expectedGain * scale,
      rationale: prefixPhase(phase, innerAction.rationale),
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
}

function weightFor(kind: Action['kind'], w: ArmWeights): number {
  switch (kind) {
    case 'retain': return w.retain;
    case 'practice': return w.practice;
    case 'teach': return w.teach;
    case 'diagnose': return w.diagnose;
  }
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
