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

import pg from 'pg';
import { recallProbability, type FsrsCard } from '../gbrain/fsrs';
import type { DueReviewCandidate } from '../core/interfaces';
import type { LearningObjectCatalog } from '../scoring/learning-object-catalog';

const { Pool } = pg;

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool {
  if (_pool) return _pool;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return _pool;
}

export interface DueCardRow {
  objectId: string;
  skillId: string | null;
  stability: number;
  lastReviewAt: string;
  reps: number;
}

/**
 * Cards due for review right now: `due_at <= now` AND `reps > 0` (never-
 * seen cards are never "due" — there is nothing to retain yet). DB-less
 * deploys, and any query failure, degrade to `[]` — an empty retain pool
 * is honest ("nothing due"), never a fabricated one.
 */
export async function dueCards(studentId: string, now: Date): Promise<DueCardRow[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const { rows } = await getPool().query(
      `SELECT object_id, skill_id, stability, last_review_at, reps
         FROM fsrs_cards
        WHERE student_id = $1 AND due_at <= $2 AND reps > 0
        ORDER BY due_at ASC`,
      [studentId, now.toISOString()],
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
    const results: DueReviewCandidate[] = [];

    for (const row of rows) {
      if (row.skillId === null) continue;
      if (allowedSet && !allowedSet.has(row.skillId)) continue;

      const obj = await catalog.getById(row.objectId);
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
