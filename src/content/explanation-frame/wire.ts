/**
 * src/content/explanation-frame/wire.ts
 *
 * The one place `composeExplanation` is reachable from a request a student
 * made. Everything else in this directory is pure; this file is where the
 * gate, the disk read and the signal derivation live, so the pure core
 * stays pure.
 *
 * ## The gate, and why it is three conditions rather than one
 *
 * `composeFrameForLesson` returns null — meaning the lesson response is
 * byte-identical to what it was before this file existed — unless ALL of:
 *
 *   1. the request carries a `session_id`. An anonymous visitor has no
 *      stable bucket, so including them would dirty the lift signal. Same
 *      rule, same reason, as `src/personalization/lesson-wire.ts`.
 *   2. an `experiments` row for this exam pack exists and is `active`.
 *      This is the operator's switch, and it is deliberately NOT a bucket
 *      check alone: `getExperiment` returns null with no `DATABASE_URL`, so
 *      the DB-less demo and every deployment nobody enrolled stay off
 *      without anyone having to remember to turn them off.
 *   3. the session buckets to `treatment` under that experiment id.
 *
 * Condition 2 is what makes this honestly "behind the experiment gate"
 * rather than "shipped dark behind a hash". A 50/50 hash with no row is
 * still on for half of everybody.
 *
 * ## What it does NOT do
 *
 * It does not replace the atom stack. `handleCompose` attaches the result
 * as an ADDITIVE `explanation_frame` field; no client reads that field
 * today, so a treatment-bucket student currently sees exactly what a
 * control-bucket student sees. That is on purpose: composing from the
 * frame changes what every enrolled student reads, and the decision to
 * render it belongs to a client change that can be verified on its own
 * rather than riding along on the plumbing. What this buys now is that the
 * composition runs against REAL signals on the REAL serving path — which
 * the admin shadow readout (`/api/admin/explanation-frame/:concept_id`,
 * synthetic probe bundles, admin only) cannot tell you — and that
 * `enrichment_level` is in the response for the lift ledger to group by.
 *
 * ## Signals
 *
 * Derived from the request the lesson already resolved, never from a new
 * read of the student. `stance` is the SAME pinned value
 * `applyStanceVariants` used on the atom stack, passed in rather than
 * recomputed, so the frame and the atoms can never disagree about register.
 * Nothing here is persisted (surveillance invariant 1).
 */

import { buildFrameForConcept } from './build';
import { composeExplanation } from './compose';
import type { ComposedExplanation, LearnerSignals } from './types';
import { getExperiment } from '../../experiments/registry';
import { bucketFor } from '../../personalization/ab';
import { getPrerequisites } from '../../constants/concept-graph';
import { trackIdForStudent } from '../../registry/curriculum-bridge';
import { resolveActiveExamId } from '../../curriculum/exam-loader';

/**
 * Mastery at or below which a prerequisite counts as shaky.
 *
 * Exported and imported by `buildRelatedProblems` in
 * `src/api/lesson-routes.ts`, which had this as an inline `< 0.5`. Two
 * copies of "is this prerequisite weak" would be free to drift, and a
 * lesson that offers prerequisite review for one concept while the frame
 * declines to mention it is a visible contradiction on one screen.
 */
export const WEAK_PREREQUISITE_MASTERY = 0.5;

/**
 * Experiment id, per exam pack.
 *
 * Carries the version, per `src/personalization/ab.ts`'s convention, so a
 * change to the frame's own logic cannot silently re-bucket an experiment
 * that is already accruing evidence. Carries the pack because the lift
 * ledger groups by `exam_pack_id` and this platform now runs two exams —
 * `personalized_selector_v1_gate_ma` was named when there was only one.
 */
export function explanationFrameExperimentId(examPackId: string): string {
  return `explanation_frame_v1_${examPackId}`;
}

export interface LessonFrameInput {
  concept_id: string;
  /** Null for an anonymous visitor — always control. */
  session_id: string | null;
  /** Resolved student id when known; the board bridge needs it. */
  student_id?: string | null;
  exam_pack_id?: string;
  /** The stance already pinned for this concept, so register cannot diverge. */
  stance?: string | null;
  /** concept_id -> 0..1, already sanitized by the route. */
  mastery_by_concept?: Record<string, number>;
  representation_mode?: string | null;
  recent_misconceptions?: readonly string[] | null;
}

export interface LessonFrameResult {
  concept_id: string;
  experiment_id: string;
  /** How many slots a resolver filled or replaced. The lift-ledger group key. */
  enrichment_level: number;
  slots: Array<{
    slot_id: string;
    role: string;
    source: 'static' | 'adaptive';
    resolver_id: string | null;
    text: string;
  }>;
}

/**
 * Prerequisites of `concept_id` the student is weak on.
 *
 * Intersected with the concept's OWN declared prerequisites on purpose: an
 * alert about an unrelated concept is not a reason to bring it up in this
 * explanation, and the `prerequisite_bridge` resolver would decline anyway.
 */
export function shakyPrerequisites(
  concept_id: string,
  masteryByConcept: Record<string, number> | undefined,
): string[] {
  if (!masteryByConcept || Object.keys(masteryByConcept).length === 0) return [];
  return getPrerequisites(concept_id)
    .filter((p) => (masteryByConcept[p.id] ?? 1) < WEAK_PREREQUISITE_MASTERY)
    .map((p) => p.id);
}

/** Pure: the signals a request implies. Separated so it is testable without a DB. */
export function signalsForLesson(input: LessonFrameInput): LearnerSignals {
  const mastery = input.mastery_by_concept?.[input.concept_id];
  return {
    stance: input.stance ?? null,
    mastery: typeof mastery === 'number' ? mastery : null,
    shaky_prerequisites: shakyPrerequisites(input.concept_id, input.mastery_by_concept),
    recent_misconceptions: input.recent_misconceptions ?? null,
    track_id: trackIdForStudent(input.student_id ?? input.session_id ?? null),
    representation_mode: input.representation_mode ?? null,
  };
}

/** Pure: is this session enrolled AND in treatment? Exported for tests. */
export function isFrameTreatment(
  session_id: string | null,
  experimentStatus: string | null,
  experiment_id: string,
): boolean {
  if (!session_id) return false;
  if (experimentStatus !== 'active') return false;
  return bucketFor(experiment_id, session_id) === 'treatment';
}

/**
 * Compose the frame for this lesson, or return null.
 *
 * Null is the normal answer, and it is indistinguishable from this file not
 * existing: not enrolled, no DB, control bucket, anonymous, or a concept
 * whose content cannot be framed yet. Every failure path is null rather
 * than a throw — an additive field must never be able to take a lesson
 * down, which is the same rule `handleGetBase` already applies to the
 * curriculum bridge.
 */
export async function composeFrameForLesson(
  input: LessonFrameInput,
): Promise<LessonFrameResult | null> {
  try {
    if (!input.session_id) return null;

    const examPackId = input.exam_pack_id ?? resolveActiveExamId() ?? 'gate-ma';
    const experimentId = explanationFrameExperimentId(examPackId);

    const row = await getExperiment(experimentId);
    if (!isFrameTreatment(input.session_id, row?.status ?? null, experimentId)) return null;

    const { frame, resolvers } = await buildFrameForConcept(input.concept_id);
    if (!frame) return null;

    const composed: ComposedExplanation = composeExplanation(
      frame,
      signalsForLesson(input),
      resolvers,
    );

    return {
      concept_id: composed.concept_id,
      experiment_id: experimentId,
      enrichment_level: composed.enrichment_level,
      slots: composed.slots.map((s) => ({
        slot_id: s.slot_id,
        role: s.role,
        source: s.source,
        resolver_id: s.resolver_id ?? null,
        text: s.text,
      })),
    };
  } catch (err) {
    console.warn(`[explanation-frame] compose skipped: ${(err as Error).message}`);
    return null;
  }
}
