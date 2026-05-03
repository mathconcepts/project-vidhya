// @ts-nocheck
/**
 * personalized-regen.ts — per-student variant generation (E5).
 *
 * Triggered when error_log shows 3 failures on the same (student_id,
 * atom_id) pair within the last 7 days. Generates a custom variant
 * grounded in the student's specific error pattern, writes it to
 * student_atom_overrides with a 14-day expiration.
 *
 * Cap (CEO plan + eng review): 1 personalized variant per concept per
 * student per week. Enforced by checking student_atom_overrides for
 * any active variant on the same concept before generating. The
 * student_atom_overrides PK (student_id, atom_id) prevents per-atom
 * duplicates; the per-concept-per-week cap is enforced in code here.
 *
 * Eng-review decision A (locked): async fire-and-forget.
 *   - Lesson submit returns immediately.
 *   - This module exposes maybeQueueRegenForStudent() which checks the
 *     trigger condition + cap, then schedules the generation off-thread.
 *   - Student sees the variant on their NEXT atom load, not this one.
 *
 * Graceful degradation: when DATABASE_URL is unset, the function is a
 * no-op so dev / free-tier deploys never crash on student errors.
 */

import pg from 'pg';
import { generateConcept } from './orchestrator';
import { ALL_CONCEPTS } from '../../constants/concept-graph';

const { Pool } = pg;
let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

export const PERSONAL_FAILURE_THRESHOLD = Number(
  process.env.VIDHYA_PERSONAL_FAILURE_THRESHOLD || '3',
);
export const PERSONAL_FAILURE_WINDOW_DAYS = Number(
  process.env.VIDHYA_PERSONAL_FAILURE_WINDOW_DAYS || '7',
);
export const PERSONAL_OVERRIDE_TTL_DAYS = Number(
  process.env.VIDHYA_PERSONAL_OVERRIDE_TTL_DAYS || '14',
);

export interface MaybeRegenResult {
  /** True when a variant was queued for generation. */
  queued: boolean;
  reason: 'queued' | 'below_threshold' | 'recent_override_exists' | 'no_db' | 'unknown_concept';
}

/**
 * Check trigger conditions and queue a regen if appropriate.
 * Fire-and-forget — call this from lesson submit without awaiting the
 * generation, only awaiting the trigger check.
 */
export async function maybeQueueRegenForStudent(
  student_id: string,
  atom_id: string,
): Promise<MaybeRegenResult> {
  const pool = getPool();
  if (!pool) return { queued: false, reason: 'no_db' };

  const concept_id = atom_id.split('.')[0];
  const concept = ALL_CONCEPTS.find((c: any) => c.id === concept_id);
  if (!concept) return { queued: false, reason: 'unknown_concept' };

  // Check failure count in window.
  let failure_count = 0;
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS cnt
         FROM error_log
         WHERE student_id = $1 AND atom_id = $2
           AND created_at > NOW() - ($3 || ' days')::interval`,
      [student_id, atom_id, String(PERSONAL_FAILURE_WINDOW_DAYS)],
    );
    failure_count = r.rows[0]?.cnt ?? 0;
  } catch (err) {
    console.warn(`[personalized-regen] failure count failed: ${(err as Error).message}`);
    return { queued: false, reason: 'no_db' };
  }

  if (failure_count < PERSONAL_FAILURE_THRESHOLD) {
    return { queued: false, reason: 'below_threshold' };
  }

  // Per-concept-per-week cap: any non-expired override on this concept
  // for this student blocks a new one.
  try {
    const r = await pool.query(
      `SELECT 1
         FROM student_atom_overrides
         WHERE student_id = $1
           AND atom_id LIKE $2
           AND expires_at > NOW()
         LIMIT 1`,
      [student_id, `${concept_id}.%`],
    );
    if (r.rows.length > 0) {
      return { queued: false, reason: 'recent_override_exists' };
    }
  } catch (err) {
    console.warn(`[personalized-regen] cap check failed: ${(err as Error).message}`);
    return { queued: false, reason: 'no_db' };
  }

  // Pull the student's specific error pattern.
  let student_errors: string[] = [];
  try {
    const r = await pool.query(
      `SELECT error_text
         FROM error_log
         WHERE student_id = $1 AND atom_id = $2
           AND created_at > NOW() - ($3 || ' days')::interval
         ORDER BY created_at DESC
         LIMIT 5`,
      [student_id, atom_id, String(PERSONAL_FAILURE_WINDOW_DAYS)],
    );
    student_errors = r.rows.map((row: any) => row.error_text).filter(Boolean);
  } catch (err) {
    console.warn(`[personalized-regen] error pattern lookup failed: ${(err as Error).message}`);
  }

  // Fire and forget — do not await.
  generatePersonalVariant(pool, student_id, atom_id, concept, student_errors).catch((err) => {
    console.warn(`[personalized-regen] variant generation failed for ${student_id}/${atom_id}: ${(err as Error).message}`);
  });

  return { queued: true, reason: 'queued' };
}

async function generatePersonalVariant(
  pool: any,
  student_id: string,
  atom_id: string,
  concept: any,
  student_errors: string[],
): Promise<void> {
  const dot_idx = atom_id.indexOf('.');
  const atom_type = atom_id.slice(dot_idx + 1).replace(/-/g, '_');
  const topic_family = concept.topic_family ?? concept.topic ?? 'generic';

  // Phase B of personalization plan — assemble the student-context payload
  // from gbrain (representation_mode + recent misconceptions for THIS concept
  // + motivation_state + shaky prereqs) and thread it into the generation
  // prompt. Falls back to neutral context (today's generic prompt) when
  // gbrain has no row for the student.
  const { buildStudentContext } = await import('../../personalization/student-context');
  const student_context = await buildStudentContext({
    student_id,
    concept_id: concept.id,
  });

  const draft = await generateConcept({
    concept_id: concept.id,
    topic_family,
    atom_types: [atom_type as any],
    force: true,
    dry_run: true,  // we write to student_atom_overrides, not atom_versions
    student_context,
  });

  const generated = draft.atoms[0];
  if (!generated) {
    console.warn(`[personalized-regen] no atom generated for ${atom_id}`);
    return;
  }

  // Write the variant to student_atom_overrides. Idempotent via PK
  // (student_id, atom_id); concurrent inserts collide cleanly.
  const trigger_reason = student_errors.length > 0
    ? `Personalized for: ${student_errors[0].slice(0, 200)}`
    : 'Personalized after 3+ failures';

  try {
    await pool.query(
      `INSERT INTO student_atom_overrides
         (student_id, atom_id, override_content, generated_at, expires_at, trigger_reason)
         VALUES ($1, $2, $3, NOW(), NOW() + ($4 || ' days')::interval, $5)
         ON CONFLICT (student_id, atom_id) DO UPDATE
           SET override_content = EXCLUDED.override_content,
               generated_at = NOW(),
               expires_at = NOW() + ($4 || ' days')::interval,
               trigger_reason = EXCLUDED.trigger_reason`,
      [student_id, atom_id, generated.content, String(PERSONAL_OVERRIDE_TTL_DAYS), trigger_reason],
    );
  } catch (err) {
    console.warn(`[personalized-regen] override insert failed: ${(err as Error).message}`);
  }
}

/**
 * Read all active overrides for a student. Used by atom-loader to swap
 * canonical content when serving lessons.
 */
export async function readStudentOverrides(
  student_id: string,
  atom_ids: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (atom_ids.length === 0) return out;
  const pool = getPool();
  if (!pool) return out;
  try {
    const r = await pool.query(
      `SELECT atom_id, override_content
         FROM student_atom_overrides
         WHERE student_id = $1
           AND atom_id = ANY($2)
           AND expires_at > NOW()`,
      [student_id, atom_ids],
    );
    for (const row of r.rows) out.set(row.atom_id, row.override_content);
  } catch (err) {
    console.warn(`[personalized-regen] readStudentOverrides failed: ${(err as Error).message}`);
  }
  return out;
}
