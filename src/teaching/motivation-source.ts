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
