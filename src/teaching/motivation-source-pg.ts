/**
 * src/teaching/motivation-source-pg.ts — Wave 8: the production
 * MotivationSource the Wave 6 docs promised ("PgMotivationSource — reads
 * `student_model.motivation_state`", see motivation-source.ts header).
 *
 * The legacy student model (src/gbrain/student-model.ts, table
 * `student_model` from migration 011) has inferred motivation_state
 * ∈ {driven, steady, flagging, frustrated, anxious} from session
 * patterns since v2.x, keyed by session_id — the same id the readiness
 * stack passes as StudentId (see student-model-pg.ts). This adapter is
 * the read-only seam bridging that signal into the 100x teaching policy
 * without coupling the two tracks.
 *
 * DB-less behavior: no DATABASE_URL → every lookup returns null (cold
 * start), matching the repo's DB-less demo-mode contract. Query failures
 * (missing migration, transient connection errors) also degrade to null
 * rather than throwing — an unknown motivation must never break
 * next-action; the policy's 'default' modality ranking handles null.
 */

import pg from 'pg';
import type { StudentId } from '../core/interfaces';
import {
  InMemoryMotivationSource,
  type MotivationSource,
  type MotivationState,
} from './motivation-source';

const { Pool } = pg;

const VALID_STATES = new Set<MotivationState>([
  'driven', 'steady', 'flagging', 'frustrated', 'anxious',
]);

export class PgMotivationSource implements MotivationSource {
  private pool: pg.Pool | null;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    this.pool = connectionString ? new Pool({ connectionString, max: 2 }) : null;
  }

  async stateFor(studentId: StudentId): Promise<MotivationState | null> {
    if (!this.pool) return null;
    try {
      const { rows } = await this.pool.query(
        `SELECT motivation_state
           FROM student_model
          WHERE session_id = $1
          ORDER BY updated_at DESC
          LIMIT 1`,
        [studentId],
      );
      const state = rows[0]?.motivation_state as MotivationState | undefined;
      return state && VALID_STATES.has(state) ? state : null;
    } catch (err) {
      console.error('[motivation-source-pg] stateFor failed, returning null:', (err as Error).message);
      return null;
    }
  }
}

let _instance: MotivationSource | null = null;

/**
 * Singleton accessor — mirrors getStudentModel() / getLearningObjectCatalog().
 * Always the Pg adapter: it self-degrades to null (cold start) without a
 * DATABASE_URL, so no InMemory fallback branch is needed in production
 * wiring. InMemoryMotivationSource stays the tool for tests/dev seeding.
 */
export function getMotivationSource(): MotivationSource {
  if (!_instance) _instance = new PgMotivationSource();
  return _instance;
}

/** Test hook: replace the singleton (e.g. with a seeded InMemoryMotivationSource). */
export function setMotivationSourceForTests(source: MotivationSource | null): void {
  _instance = source;
}

export { InMemoryMotivationSource };
