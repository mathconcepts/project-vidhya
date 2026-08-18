/**
 * src/readiness/due-cards.ts — the real due-card scan (T12 / OV2-D1).
 *
 * `pickDueReview` in `next-best-action.ts` used to ask the CATALOG for
 * "easy" items and check `StudentModel.retrievability()`, which returns 0
 * for an item the student has never seen (`student-model-pg.ts`'s
 * `retrievability()`: "no rows → assume forgotten"). Once the practice
 * catalog has real inventory, a fresh student would get a bogus
 * "Review now — recall at 0%" retain on an item they've never attempted.
 *
 * The fix: retain candidates come ONLY from cards that have actually been
 * reviewed at least once (`reps > 0`) and are past their `due_at`. This
 * module is the thin, pure-SQL scan; `next-best-action.ts` never imports
 * `pg` directly — the injected `dueCards` seam on `ReadinessEngineDeps`
 * (composed in `src/api/readiness-routes.ts` for production) is what maps
 * these raw rows to servable candidates, keeping the engine itself DB-free
 * and unit-testable with a plain stub function.
 */

import type pg from 'pg';
import { recallProbability, type FsrsCard } from '../gbrain/fsrs';
import type { DueReviewCandidate } from '../core/interfaces';
import type { LearningObjectCatalog } from '../scoring/learning-object-catalog';
import { getSharedPool } from '../storage/pool';

// T16 (D4 / OV2 #10): was its own dedicated `new Pool({max:5})` — now the
// one shared pool (src/storage/pool.ts). Every call site below already
// guards on `!process.env.DATABASE_URL` before reaching here, so a null
// return only happens if DATABASE_URL was cleared between that check and
// this call — treated the same as any other query failure (degrade to
// empty, never crash).
function getPool(): pg.Pool | null {
  return getSharedPool();
}

export interface DueCardRow {
  objectId: string;
  skillId: string | null;
  stability: number;
  lastReviewAt: string;
  reps: number;
}

// The two consumers of this scan (src/api/quiz-routes.ts's pool assembly and
// next-best-action.ts's retain arm via makeDueReviewSource) each need only a
// small slice of "what's due right now":
//   - quiz-pool assembly needs the pool to reach QUIZ_POOL_MULTIPLE (2) ×
//     QUIZ_LENGTH (6) = 12 total candidates (due + frontier combined) before
//     it's even eligible to offer a quiz (src/readiness/quiz-pool.ts).
//   - the retain arm scans for the single lowest-recall card among rows
//     below RETAIN_RECALL_THRESHOLD — it doesn't need every overdue card,
//     just enough that the most urgent one (oldest by due_at, the query's
//     existing ORDER BY) is very unlikely to be missed.
// 50 gives both consumers generous headroom (4x the quiz pool's floor) while
// bounding the row count — and therefore the per-row catalog lookups below —
// for a student who has let hundreds of cards go overdue.
const DUE_CARDS_SCAN_LIMIT = 50;

/**
 * Cards due for review right now: `due_at <= now` AND `reps > 0` (never-
 * seen cards are never "due" — there is nothing to retain yet). DB-less
 * deploys, and any query failure, degrade to `[]` — an empty retain pool
 * is honest ("nothing due"), never a fabricated one.
 *
 * Capped at `DUE_CARDS_SCAN_LIMIT` (ordered by `due_at ASC`, so the cap
 * always drops the LEAST urgent rows first) — see the constant's doc
 * comment for why that number is enough for both consumers.
 */
export async function dueCards(studentId: string, now: Date): Promise<DueCardRow[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const pool = getPool();
    if (!pool) return [];
    const { rows } = await pool.query(
      `SELECT object_id, skill_id, stability, last_review_at, reps
         FROM fsrs_cards
        WHERE student_id = $1 AND due_at <= $2 AND reps > 0
        ORDER BY due_at ASC
        LIMIT $3`,
      [studentId, now.toISOString(), DUE_CARDS_SCAN_LIMIT],
    );
    return rows.map((row: any) => ({
      objectId: String(row.object_id),
      skillId: row.skill_id === null || row.skill_id === undefined ? null : String(row.skill_id),
      stability: Number(row.stability),
      lastReviewAt: (row.last_review_at instanceof Date ? row.last_review_at : new Date(row.last_review_at)).toISOString(),
      reps: Number(row.reps),
    }));
  } catch (err) {
    console.error(`[due-cards] scan failed for student=${studentId}, degrading to empty:`, (err as Error).message);
    return [];
  }
}

/**
 * Object ids reviewed within the last `windowDays` days, for ANY skill —
 * the quiz pool-protection no-repeat window (T14 / plan §"Outside-voice
 * amendments" #9, OV2-D4). A quiz must never re-serve an item the student
 * saw recently, whether that item is currently "due" or not — this is a
 * DIFFERENT question than `dueCards()` above (which asks "what needs
 * retaining right now"); this asks "what has this student's eyes been on
 * lately, regardless of schedule." DB-less / query failure degrades to an
 * empty set — an unfiltered pool is the honest fallback (the caller's own
 * pool-size floor still protects against a degenerate small quiz).
 */
export async function recentlyReviewedObjectIds(
  studentId: string,
  now: Date,
  windowDays: number,
): Promise<Set<string>> {
  if (!process.env.DATABASE_URL) return new Set();
  try {
    const pool = getPool();
    if (!pool) return new Set();
    const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const { rows } = await pool.query(
      `SELECT object_id FROM fsrs_cards WHERE student_id = $1 AND last_review_at >= $2`,
      [studentId, since.toISOString()],
    );
    return new Set(rows.map((r: any) => String(r.object_id)));
  } catch (err) {
    console.error(`[due-cards] recently-reviewed scan failed for student=${studentId}, degrading to empty:`, (err as Error).message);
    return new Set();
  }
}

/**
 * Composes the raw scan above with a catalog into the exact function
 * shape `ReadinessEngineDeps.dueCards` expects (`src/core/interfaces.ts`).
 * Production wiring (`src/api/readiness-routes.ts`) passes this straight
 * through.
 *
 * - Scopes by `opts.allowedNodes` via `skillId` when provided.
 * - A due card whose `skill_id` is null (written before migration 045, or
 *   before this card's next real review re-upserts it), or whose object
 *   the catalog can't resolve (deleted / demoted since the card was
 *   created), is SKIPPED — never surfaced as a dead link or a guess.
 * - `recall` is computed fresh via FSRS's `recallProbability` at `now`.
 */
export function makeDueReviewSource(
  catalog: LearningObjectCatalog,
): (studentId: string, now: Date, opts: { allowedNodes?: string[] }) => Promise<DueReviewCandidate[]> {
  return async (studentId, now, opts) => {
    const rows = await dueCards(studentId, now);
    if (rows.length === 0) return [];
    if (!catalog.getById) return []; // catalog can't resolve by id — nothing servable to report

    const allowedSet = opts.allowedNodes ? new Set(opts.allowedNodes) : null;
    const eligibleRows = rows.filter(
      row => row.skillId !== null && (!allowedSet || allowedSet.has(row.skillId)),
    );
    if (eligibleRows.length === 0) return [];

    // Batch the per-row catalog lookups (was a sequential `await` in the
    // loop below — N round trips end to end). The rows are already capped
    // at DUE_CARDS_SCAN_LIMIT above, so this fans out a bounded number of
    // concurrent lookups rather than growing unboundedly with a student's
    // due-card count.
    const getById = catalog.getById!;
    const objs = await Promise.all(eligibleRows.map(row => getById(row.objectId)));

    const results: DueReviewCandidate[] = [];
    for (let i = 0; i < eligibleRows.length; i++) {
      const row = eligibleRows[i];
      const obj = objs[i];
      if (!obj) continue; // unservable — skip rather than dead-end the student

      const card: FsrsCard = {
        stability: row.stability,
        difficulty: 5,          // unused by recallProbability (reads stability + lastReviewAt only)
        lastReviewAt: row.lastReviewAt,
        reps: row.reps,
        lapses: 0,               // unused
        dueAt: now.toISOString(), // unused
      };
      results.push({
        objectId: obj.id,
        nodeId: obj.nodeId,
        estMinutes: obj.estMinutes,
        recall: recallProbability(card, now),
      });
    }

    return results;
  };
}
