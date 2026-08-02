/**
 * TrendCollectorRepo — storage boundary for src/jobs/trend-collector.ts
 * (CEO plan Phase 0, §5 / §5.1 "generation + jobs modules import zero pg").
 *
 * Two queries: the 30-day-expiry cleanup DELETE that opens every
 * collection run, and the per-signal INSERT (kept as one row per call,
 * matching the original — each collector's signals are independently
 * fallible so a single bad row shouldn't abort the batch).
 *
 * No File implementation — external trend signals only mean anything
 * against the real trend_signals table (this feeds content-flywheel's
 * topic selection and blog-prompt enrichment, both DB-backed already).
 * The factory returns `null` when DATABASE_URL is unset; insertSignal()
 * throws the same `DATABASE_URL not configured` error the old getPool()
 * threw, preserving the per-row try/catch degrade in the caller.
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';

export interface TrendSignalInsert {
  source: string;
  topic_match: string | null;
  title: string;
  url: string | null;
  score: number;
  raw_data: Record<string, unknown>;
  expires_at: string;
}

export interface TrendCollectorRepo {
  deleteExpiredSignals(): Promise<void>;
  insertSignal(input: TrendSignalInsert): Promise<void>;
}

export class PgTrendCollectorRepo implements TrendCollectorRepo {
  constructor(private pool: Pool) {}

  async deleteExpiredSignals(): Promise<void> {
    await this.pool.query(`DELETE FROM trend_signals WHERE expires_at < NOW()`);
  }

  async insertSignal(input: TrendSignalInsert): Promise<void> {
    await this.pool.query(
      `INSERT INTO trend_signals (source, topic_match, title, url, score, raw_data, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [input.source, input.topic_match, input.title, input.url, input.score, JSON.stringify(input.raw_data), input.expires_at],
    );
  }
}

/** Test/reference only — never returned by the factory. */
export class NullTrendCollectorRepo implements TrendCollectorRepo {
  async deleteExpiredSignals(): Promise<void> {}
  async insertSignal(): Promise<void> {
    throw new Error('[trend-collector] DATABASE_URL not configured');
  }
}

/** Factory: Postgres-backed when DATABASE_URL is set, `null` otherwise. */
export function getTrendCollectorRepo(): TrendCollectorRepo | null {
  const pool = getSharedPool();
  return pool ? new PgTrendCollectorRepo(pool) : null;
}
