/**
 * Dedup — atoms the student has seen recently get HARD-DROPPED from
 * the result. (Hard floor, not a weighted contribution.)
 *
 * Default window: 7 days (eng-review locked, tunable via env).
 *
 * Progressive backoff: if the dedup window leaves the result empty,
 * the caller (in selector.ts) progressively shortens the window
 * (7 → 3 → 1 → 0 days) until at least 1 atom survives. Always returns
 * something — never strands the student on an empty lesson.
 */

import pg from 'pg';
import type { AtomShape, RankingContext } from './types';

const { Pool } = pg;
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _pool;
}

export const DEFAULT_DEDUP_DAYS = parseInt(process.env.VIDHYA_DEDUP_DAYS ?? '7', 10) || 7;

/**
 * Returns the set of atom_ids the student has SEEN within the given
 * window. Empty set when student_id is null / DB-less / table missing.
 *
 * Reads atom_engagements.last_seen.
 */
export async function recentlySeen(
  atoms: AtomShape[],
  ctx: RankingContext,
  windowDays: number,
): Promise<Set<string>> {
  const out = new Set<string>();
  if (atoms.length === 0 || !ctx.student_id) return out;

  const pool = getPool();
  if (!pool) return out;

  const ids = atoms.map((a) => a.id);
  try {
    const r = await pool.query<{ atom_id: string }>(
      `SELECT atom_id
         FROM atom_engagements
        WHERE student_id = $1::UUID
          AND atom_id = ANY($2::TEXT[])
          AND last_seen > NOW() - ($3::TEXT || ' days')::INTERVAL`,
      [ctx.student_id, ids, String(windowDays)],
    );
    for (const row of r.rows) out.add(row.atom_id);
  } catch {
    // Table missing on a fresh DB → no dedup
  }

  // Also dedup against in-session set (passed in via realtime, in-memory only)
  const sessionSeen = ctx.realtime?.seen_this_session;
  if (sessionSeen) {
    for (const a of atoms) {
      if (sessionSeen.has(a.id)) out.add(a.id);
    }
  }

  return out;
}
