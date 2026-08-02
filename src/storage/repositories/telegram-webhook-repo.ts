/**
 * TelegramWebhookRepo — storage boundary for src/jobs/telegram-webhook.ts
 * (CEO plan Phase 0, §5 / §5.1 "generation + jobs modules import zero pg").
 *
 * One query: look up a PYQ by id for the "Show Solution" callback handler.
 * Was its own throwaway `new Pool({max:2})` per callback, closed with
 * `pool.end()` after every tap — same fix as DailyProblemRepo: moved onto
 * the shared pool, and the old `finally { await pool.end() }` must NOT
 * survive the move (closing the shared pool here would break every other
 * consumer in the process).
 *
 * No File implementation — a callback answering "here's the solution to
 * PYQ X" only means anything against the real table. The factory returns
 * `null` when DATABASE_URL is unset; handleShowSolution() throws the same
 * `DATABASE_URL not configured` error the old getPool() threw.
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';

export interface PyqRow {
  id: string;
  correct_answer: string;
  explanation: string;
  [key: string]: unknown;
}

export interface TelegramWebhookRepo {
  findPyqById(id: string): Promise<PyqRow | null>;
}

export class PgTelegramWebhookRepo implements TelegramWebhookRepo {
  constructor(private pool: Pool) {}

  async findPyqById(id: string): Promise<PyqRow | null> {
    const result = await this.pool.query<PyqRow>('SELECT * FROM pyq_questions WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ?? null;
  }
}

/** Test/reference only — never returned by the factory (handleShowSolution() throws before using it, matching pre-migration behavior). */
export class NullTelegramWebhookRepo implements TelegramWebhookRepo {
  async findPyqById(): Promise<PyqRow | null> {
    return null;
  }
}

/** Factory: Postgres-backed when DATABASE_URL is set, `null` otherwise. */
export function getTelegramWebhookRepo(): TelegramWebhookRepo | null {
  const pool = getSharedPool();
  return pool ? new PgTelegramWebhookRepo(pool) : null;
}
