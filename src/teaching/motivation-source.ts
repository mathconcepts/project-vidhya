/**
 * src/teaching/motivation-source.ts — bridge to the legacy student model.
 *
 * Wave 6 of the 100x. The legacy student-model.ts has tracked
 * motivation_state ∈ {driven, steady, flagging, frustrated, anxious}
 * since v2.x — it's a real signal the 100x layer was ignoring.
 *
 * Rather than rebuild the inference (which the legacy model already
 * does well from session patterns) or merge motivation into the
 * blueprint's StudentModel interface (which would couple the two
 * tracks), this seam lets the teaching policy READ motivation
 * without taking a dependency on the legacy module's shape.
 *
 *   - InMemoryMotivationSource — tests + dev
 *   - PgMotivationSource — reads `student_models.motivation_state`
 */

import type { StudentId } from '../core/interfaces';

export type MotivationState = 'driven' | 'steady' | 'flagging' | 'frustrated' | 'anxious';

export interface MotivationSource {
  /** Returns null when no motivation has been recorded yet (cold start). */
  stateFor(studentId: StudentId): Promise<MotivationState | null>;
}

// ────────────────────────────────────────────────────────────────────
// Canonical vocabulary — the single source of truth every other call
// site must import instead of re-typing the literal list.
//
// The vocabulary was hand-typed in ~8 places across the codebase with
// four different (drifted) memberships — two of those divergences were
// live defects (an unreachable 'confident' branch that isn't a real
// MotivationState, and a cohort-attention filter that silently dropped
// 'anxious'). MOTIVATION_LANE is a Record total over MotivationState:
// if a 6th state is ever added to the union above without adding a case
// here, TypeScript raises a compile error (missing property) rather than
// letting the new state silently fall through unclassified everywhere
// STRUGGLING_STATES / THRIVING_STATES is used. That totality check is the
// whole point of this module.
// ────────────────────────────────────────────────────────────────────

type MotivationLane = 'thriving' | 'neutral' | 'struggling';

const MOTIVATION_LANE: Record<MotivationState, MotivationLane> = {
  driven: 'thriving',
  steady: 'neutral',
  flagging: 'struggling',
  frustrated: 'struggling',
  anxious: 'struggling',
};

function statesInLane(lane: MotivationLane): MotivationState[] {
  return (Object.keys(MOTIVATION_LANE) as MotivationState[]).filter(
    (state) => MOTIVATION_LANE[state] === lane,
  );
}

/** All five canonical motivation states, in declaration order. */
export const MOTIVATION_STATES: readonly MotivationState[] = Object.freeze(
  Object.keys(MOTIVATION_LANE) as MotivationState[],
);

/** States that mean a student needs attention/support. */
export const STRUGGLING_STATES: readonly MotivationState[] = Object.freeze(
  statesInLane('struggling'),
);

/** States that mean a student is doing well and can be given rigour/pace. */
export const THRIVING_STATES: readonly MotivationState[] = Object.freeze(
  statesInLane('thriving'),
);

// ────────────────────────────────────────────────────────────────────
// In-memory implementation
// ────────────────────────────────────────────────────────────────────

export class InMemoryMotivationSource implements MotivationSource {
  private states = new Map<StudentId, MotivationState>();

  constructor(initial?: Record<string, MotivationState>) {
    if (initial) for (const [id, s] of Object.entries(initial)) this.states.set(id, s);
  }

  async stateFor(studentId: StudentId): Promise<MotivationState | null> {
    return this.states.get(studentId) ?? null;
  }

  /** Test helper. */
  set(studentId: StudentId, state: MotivationState): void {
    this.states.set(studentId, state);
  }
}
