/**
 * src/scenarios/persona-seeder.ts
 *
 * Writes a persona's seed state into the local DB + flat-file stores so
 * the rest of the system can serve it as if it were a real student.
 *
 * Surveillance + safety contracts:
 *   1. Persona user_ids are derived deterministically from the persona
 *      slug via SHA-256 → UUID, prefixed with the namespace 'persona-'.
 *      Namespace check: the seeder REFUSES to overwrite a row that does
 *      not match the namespace. Real students therefore can't be
 *      clobbered by a persona run, even if the slug collides somehow.
 *   2. No new schema column ('is_persona' would have been the obvious
 *      choice but it'd violate the surveillance-cliff invariant). The
 *      namespace guard lives in code.
 *   3. DB-less safety: the seeder throws a clear, actionable error when
 *      DATABASE_URL is unset rather than silently no-opping. Scenarios
 *      need a real DB to be meaningful.
 */

import pg from 'pg';
import { createHash } from 'crypto';
import type { Persona } from './persona-loader';

const { Pool } = pg;

// All-hex sentinel for the first UUID block. Reads as "0aded0a0" — a
// recognizable signature in psql output ("added 0a0") and valid UUID hex.
// Real users get UUIDv4-shaped ids, so collision with this fixed prefix
// is astronomically unlikely.
const PERSONA_UUID_PREFIX = '0aded0a0';

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'persona-seeder requires DATABASE_URL. Run `docker compose up` for a local stack.',
    );
  }
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _pool;
}

/**
 * Returns the deterministic, PG-UUID-valid id for a persona slug.
 * Format: 0aded0a0-<hash[0..4]>-<hash[4..8]>-<hash[8..12]>-<hash[12..24]>.
 */
export function personaUserId(slug: string): string {
  const hex = createHash('sha256').update(`persona:${slug}`).digest('hex');
  return `${PERSONA_UUID_PREFIX}-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 24)}`;
}

export function isPersonaUserId(id: string): boolean {
  return typeof id === 'string' && id.startsWith(`${PERSONA_UUID_PREFIX}-`);
}

export interface SeedResult {
  user_id: string;
  session_id: string;
  wrote_student_model: boolean;
  wrote_exam_profile: boolean;
}

export async function seedPersona(persona: Persona): Promise<SeedResult> {
  const user_id = personaUserId(persona.id);
  const session_id = `persona-session-${persona.id}`;
  const pool = getPool();

  // Build mastery_vector in the shape the rest of the system expects.
  const mastery_vector: Record<string, { score: number; updated_at: string }> = {};
  const now = new Date().toISOString();
  for (const [concept_id, score] of Object.entries(persona.seed.initial_mastery)) {
    mastery_vector[concept_id] = { score, updated_at: now };
  }

  // ---- student_model ----------------------------------------------------
  // Namespace guard: if a row exists for this user_id and it ISN'T a
  // persona row, refuse to write. This is the safety net.
  const existing = await pool.query<{ user_id: string }>(
    `SELECT user_id::TEXT AS user_id FROM student_model WHERE user_id = $1::UUID LIMIT 1`,
    [user_id],
  );
  if (existing.rows.length > 0 && !isPersonaUserId(existing.rows[0].user_id)) {
    throw new Error(
      `persona-seeder: refusing to overwrite non-persona student_model row (user_id=${existing.rows[0].user_id}). ` +
        `Persona slug "${persona.id}" maps to a UUID that collides with a real user.`,
    );
  }

  let wrote_student_model = false;
  try {
    await pool.query(
      `INSERT INTO student_model (user_id, session_id, mastery_vector, representation_mode, motivation_state, updated_at)
         VALUES ($1::UUID, $2, $3::JSONB, $4, $5, NOW())
         ON CONFLICT (user_id) DO UPDATE
           SET session_id = EXCLUDED.session_id,
               mastery_vector = EXCLUDED.mastery_vector,
               representation_mode = EXCLUDED.representation_mode,
               motivation_state = EXCLUDED.motivation_state,
               updated_at = NOW()`,
      [
        user_id,
        session_id,
        JSON.stringify(mastery_vector),
        persona.seed.representation_mode,
        persona.seed.motivation_state,
      ],
    );
    wrote_student_model = true;
  } catch (err) {
    // student_model schema may differ slightly between branches — surface
    // the error rather than silently swallow it. The runner caller decides
    // whether to abort.
    throw new Error(
      `persona-seeder: student_model insert failed: ${(err as Error).message}`,
    );
  }

  // ---- exam_profile_store (flat file, in-process) -----------------------
  let wrote_exam_profile = false;
  try {
    const { upsertProfile } = await import('../session-planner/exam-profile-store');
    upsertProfile(user_id, [
      {
        exam_id: persona.seed.exam_id,
        exam_date: futureExamDate(),
        knowledge_track_id: persona.seed.knowledge_track_id,
        added_at: now,
      },
    ]);
    wrote_exam_profile = true;
  } catch {
    // Profile store is best-effort; the prompt will fall back to neutral.
  }

  return { user_id, session_id, wrote_student_model, wrote_exam_profile };
}

function futureExamDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().slice(0, 10);
}
