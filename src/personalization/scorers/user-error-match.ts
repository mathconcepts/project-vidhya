/**
 * User-error-match scorer (Layer 5, weight 0.15).
 *
 * Reads error_log.misconception_id for the student in the last 30 days
 * and matches against atom.target_misconception. Atoms that DIRECTLY
 * address a misconception the student has shown score high; atoms that
 * don't, score neutral (0.4 — slightly below the user-mastery default,
 * because not addressing an error is a small minus).
 *
 * Atoms with no target_misconception (older / scraped atoms) score
 * neutral 0.4 — we can't know one way or the other.
 *
 * For anonymous sessions or new students with empty error_log, every
 * atom scores 0.4 (neutral, no signal).
 *
 * Surveillance-cliff note: we read the misconception IDs but never
 * surface the IDs (or the matching) to the student. The output is a
 * better atom selection, not a "we saw you make this error" callout.
 */

import pg from 'pg';
import type { AtomShape, RankingContext } from '../types';

const { Pool } = pg;
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _pool;
}

const RECENT_ERROR_DAYS = 30;
const NEUTRAL = 0.4;
const MATCH_BOOST = 0.6;

export async function scoreByUserError(
  atoms: AtomShape[],
  ctx: RankingContext,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (atoms.length === 0) return out;

  if (!ctx.student_id) {
    for (const a of atoms) out.set(a.id, NEUTRAL);
    return out;
  }

  const pool = getPool();
  if (!pool) {
    for (const a of atoms) out.set(a.id, NEUTRAL);
    return out;
  }

  // Pull recent misconception ids for this student. error_log is keyed
  // on session_id (TEXT) — student_model.session_id maps user_id → session_id.
  // We do the join here rather than read student_model first, so it's a
  // single round-trip.
  let recentMisconceptions = new Set<string>();
  try {
    const r = await pool.query<{ misconception_id: string }>(
      `SELECT DISTINCT el.misconception_id
         FROM error_log el
         JOIN student_model sm ON sm.session_id = el.session_id
        WHERE sm.user_id = $1::UUID
          AND el.misconception_id IS NOT NULL
          AND el.created_at > NOW() - ($2::TEXT || ' days')::INTERVAL`,
      [ctx.student_id, String(RECENT_ERROR_DAYS)],
    );
    for (const row of r.rows) {
      if (row.misconception_id) recentMisconceptions.add(row.misconception_id);
    }
  } catch {
    // Tables missing (fresh DB) or bad UUID → neutral
    for (const a of atoms) out.set(a.id, NEUTRAL);
    return out;
  }

  if (recentMisconceptions.size === 0) {
    for (const a of atoms) out.set(a.id, NEUTRAL);
    return out;
  }

  for (const a of atoms) {
    const target = a.target_misconception;
    if (!target) {
      out.set(a.id, NEUTRAL);
      continue;
    }
    out.set(a.id, recentMisconceptions.has(target) ? Math.min(1, NEUTRAL + MATCH_BOOST) : NEUTRAL);
  }
  return out;
}
