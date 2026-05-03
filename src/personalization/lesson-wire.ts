/**
 * src/personalization/lesson-wire.ts
 *
 * Glue between lesson-routes (which loads + enriches atoms) and the
 * PersonalizedSelector (which re-ranks them per student). Single helper
 * shared by every lesson-serving call site so the wire is uniform.
 *
 * Eng-review locked behaviour:
 *   - Treatment cohort gets re-ranked atoms; control cohort sees the
 *     pedagogy-engine's existing order untouched.
 *   - Anonymous sessions (no student_id): always control. Bucketing only
 *     applies to identified students so the experiment's lift signal
 *     comes from a clean cohort.
 *   - Single line at the call site: `atoms = await rankAtomsForLesson(atoms, ctx)`.
 */

import pg from 'pg';
import { applyPersonalizedRanking } from './selector';
import { bucketFor, PERSONALIZED_SELECTOR_EXPERIMENT_ID } from './ab';
import type { AtomShape, RankingContext } from './types';

const { Pool } = pg;
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _pool;
}

// Resolves session_id → user_id (UUID) via student_model.session_id.
// Cached per-session for the request lifetime; the actual cache lives at
// the call site, not here, so we just do a single DB read when called.
async function resolveUserIdForSession(sessionId: string): Promise<string | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const r = await pool.query<{ user_id: string | null }>(
      `SELECT user_id::TEXT AS user_id FROM student_model WHERE session_id = $1 LIMIT 1`,
      [sessionId],
    );
    return r.rows[0]?.user_id ?? null;
  } catch {
    return null;
  }
}

/**
 * Generic atom shape we accept — must have `id`, `concept_id`, `atom_type`.
 * Existing ContentAtom has all those plus more; we read only what's needed.
 */
type WithSelectorFields = AtomShape & Record<string, unknown>;

export interface LessonRankingInput {
  /** Required for the dedup layer + any user-* scorers. */
  session_id: string | null;
  /** Optional UUID; null for anonymous sessions → forces control bucket. */
  student_id: string | null;
  concept_id: string;
  /** Defaults to 'gate-ma' if missing — single-exam pilot. */
  exam_pack_id?: string;
}

/**
 * The single helper lesson-routes calls. Returns atoms unchanged for:
 *   - anonymous sessions (no student_id)
 *   - sessions bucketed into control
 *   - empty atom lists
 *
 * Returns re-ranked atoms (with dedup hard-floor) for treatment-cohort
 * sessions. Same input/output shape — caller doesn't need to know about
 * the personalization machinery.
 */
export async function rankAtomsForLesson<T extends WithSelectorFields>(
  atoms: T[],
  input: LessonRankingInput,
): Promise<T[]> {
  if (atoms.length === 0) return atoms;
  if (!input.session_id) return atoms;

  // Resolve student_id (UUID). Caller may pass it directly; otherwise we
  // look it up from student_model.session_id. Either path can return null
  // (no student_model row exists for this session) → control bucket.
  let resolvedStudentId = input.student_id;
  if (!resolvedStudentId && input.session_id) {
    resolvedStudentId = await resolveUserIdForSession(input.session_id);
  }

  // Eng-review safety: sessions without an identified user always sit in
  // control. The experiment's lift signal needs a stable session→bucket
  // mapping; ephemeral anonymous sessions would wreck it.
  if (!resolvedStudentId) return atoms;

  const ctx: RankingContext = {
    session_id: input.session_id,
    student_id: resolvedStudentId,
    concept_id: input.concept_id,
    exam_pack_id: input.exam_pack_id ?? 'gate-ma',
    ab_bucket: bucketFor(PERSONALIZED_SELECTOR_EXPERIMENT_ID, input.session_id),
    // Realtime layer is intentionally absent here — the lesson serving
    // path doesn't have an obvious last_correct signal at load time.
    // The realtime scorer falls back to neutral (0.5) when ctx.realtime
    // is undefined, so this is fine. A later PR could thread it from a
    // session cache if the data justifies it.
  };

  // Cast through unknown is safe — applyPersonalizedRanking only reads
  // the AtomShape fields and returns the same instances unchanged
  // (re-ordered + dedup-filtered). The richer ContentAtom fields ride
  // along untouched.
  const ranked = (await applyPersonalizedRanking(
    atoms as unknown as AtomShape[],
    ctx,
  )) as unknown as T[];

  return ranked;
}
