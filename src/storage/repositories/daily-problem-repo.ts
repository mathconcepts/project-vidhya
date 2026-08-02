/**
 * DailyProblemRepo — storage boundary for src/jobs/daily-problem.ts (CEO
 * plan Phase 0, §5 / §5.1 "generation + jobs modules import zero pg").
 *
 * One method, one real transaction: SELECT ... FOR UPDATE SKIP LOCKED then
 * UPDATE posted_at, committed atomically so two concurrent cron hits can
 * never claim the same PYQ. Kept as a single repo method rather than
 * separate select/update calls specifically to preserve that atomicity —
 * splitting it across two repo calls would let the job's orchestration
 * layer interleave other work between SELECT and UPDATE, reintroducing
 * the race this FOR UPDATE SKIP LOCKED was written to prevent.
 *
 * Uses the shared pool (was its own throwaway `new Pool({max:2})` per
 * call, closed with `pool.end()` after every post). Note: the job file's
 * old `finally { await pool.end() }` must NOT survive the move — ending
 * the shared pool here would tear it down for every other consumer in
 * the process. This repo never closes the pool it's given.
 *
 * No File implementation — same reasoning as the other content repos:
 * "post one real PYQ to Telegram" only means anything against the real
 * pyq_questions table. The factory returns `null` when DATABASE_URL is
 * unset; postDailyProblem() throws the same `DATABASE_URL not configured`
 * error the old getPool() threw, preserving pre-migration behavior.
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';

export interface UnpostedPyq {
  id: string;
  exam_id: string;
  year: number;
  question_text: string;
  options: Record<string, string> | string;
  correct_answer: string;
  explanation: string;
  topic: string;
  difficulty: string;
  marks: number;
}

export interface DailyProblemRepo {
  /** Atomically claims one unposted PYQ and stamps posted_at=NOW(). Returns null if none remain. */
  selectAndClaimUnpostedPyq(): Promise<UnpostedPyq | null>;
}

export class PgDailyProblemRepo implements DailyProblemRepo {
  constructor(private pool: Pool) {}

  async selectAndClaimUnpostedPyq(): Promise<UnpostedPyq | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query<UnpostedPyq>(`
        SELECT * FROM pyq_questions
        WHERE posted_at IS NULL
        ORDER BY RANDOM()
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const pyq = result.rows[0];

      await client.query('UPDATE pyq_questions SET posted_at = NOW() WHERE id = $1', [pyq.id]);

      await client.query('COMMIT');
      return pyq;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
}

/** Test/reference only — never returned by the factory (postDailyProblem() throws before using it, matching pre-migration behavior). */
export class NullDailyProblemRepo implements DailyProblemRepo {
  async selectAndClaimUnpostedPyq(): Promise<UnpostedPyq | null> {
    return null;
  }
}

/** Factory: Postgres-backed when DATABASE_URL is set, `null` otherwise. */
export function getDailyProblemRepo(): DailyProblemRepo | null {
  const pool = getSharedPool();
  return pool ? new PgDailyProblemRepo(pool) : null;
}
