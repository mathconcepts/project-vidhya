/**
 * src/gbrain/xp-store.ts — T14 (B5): Postgres access for the personal XP
 * ledger (migration 046's `xp_events`). Pure DB plumbing; the award RULE
 * lives in src/scoring/xp.ts (xpForAttempt) so it stays unit-testable
 * without a database.
 *
 * DB-less deploys degrade honestly: `awardXp` no-ops (matches the rest of
 * the practice path's "grade honestly, recorded:false" contract) and both
 * read functions return 0 — never a fabricated meter value.
 *
 * Two read functions, two different jobs:
 *   - `totalXpMinutes` — lifetime total. Used where "lifetime" is the
 *     actual question (e.g. CompoundingCard's "focused work" achievement
 *     stat in src/api/me-routes.ts).
 *   - `xpEarnedSince` — the CURRENT quiz cycle's total, i.e. XP awarded
 *     after a given baseline timestamp (or everything, if `sinceMs` is
 *     null — a student who has never submitted a quiz has no baseline
 *     yet, so their cycle total IS their lifetime total). This is what
 *     the "quiz every N XP" cadence (B5) actually gates on — see
 *     src/api/quiz-routes.ts's `xpSinceBaseline()`, which pairs this with
 *     `quiz-store-pg.ts`'s `getLastSubmittedQuizAt` to resolve the
 *     baseline before calling this.
 */

import pg from 'pg';

const { Pool } = pg;

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool {
  if (_pool) return _pool;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return _pool;
}

export interface XpAward {
  studentId: string;
  objectId: string;
  skillId: string | null;
  xpAmount: number;
  source: 'practice' | 'quiz';
  tsMs: number;
}

/**
 * Best-effort, idempotent on (student_id, object_id, ts_ms) — mirrors
 * attempt_dedup. A DB-less deploy or a transient failure is swallowed and
 * logged (XP is a motivational layer, never allowed to break the grading
 * response it rides alongside).
 */
export async function awardXp(award: XpAward): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    await getPool().query(
      `INSERT INTO xp_events (student_id, object_id, skill_id, xp_amount, source, ts_ms)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (student_id, object_id, ts_ms) DO NOTHING`,
      [award.studentId, award.objectId, award.skillId, award.xpAmount, award.source, award.tsMs],
    );
  } catch (err) {
    console.error(`[xp-store] award failed for student=${award.studentId}:`, (err as Error).message);
  }
}

/**
 * The visible running total, in minutes. Floors negative-net history at 0
 * at READ time — a mistake can reduce the ledger's true sum, but the
 * number a student ever sees never goes backwards (DR-4: negative XP
 * events are never surfaced). DB-less / query failure → 0, the honest
 * "nothing yet" reading, never a guess.
 */
export async function totalXpMinutes(studentId: string): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  try {
    const { rows } = await getPool().query(
      `SELECT COALESCE(SUM(xp_amount), 0) AS total FROM xp_events WHERE student_id = $1`,
      [studentId],
    );
    const total = Number(rows[0]?.total ?? 0);
    return Math.max(0, Math.round(total));
  } catch (err) {
    console.error(`[xp-store] total lookup failed for student=${studentId}, degrading to 0:`, (err as Error).message);
    return 0;
  }
}

/**
 * XP awarded strictly AFTER `sinceMs` (exclusive on `awarded_at`), or the
 * full lifetime total when `sinceMs` is null. Floors at 0 — same "a
 * mistake never shows as a negative meter" discipline as `totalXpMinutes`.
 * DB-less / query failure → 0.
 */
export async function xpEarnedSince(studentId: string, sinceMs: number | null): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  try {
    const { rows } = await getPool().query(
      sinceMs === null
        ? `SELECT COALESCE(SUM(xp_amount), 0) AS total FROM xp_events WHERE student_id = $1`
        : `SELECT COALESCE(SUM(xp_amount), 0) AS total FROM xp_events WHERE student_id = $1 AND awarded_at > $2`,
      sinceMs === null ? [studentId] : [studentId, new Date(sinceMs).toISOString()],
    );
    const total = Number(rows[0]?.total ?? 0);
    return Math.max(0, Math.round(total));
  } catch (err) {
    console.error(`[xp-store] xpEarnedSince lookup failed for student=${studentId}, degrading to 0:`, (err as Error).message);
    return 0;
  }
}
