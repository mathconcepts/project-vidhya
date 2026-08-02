/**
 * CohortSignalsRepo — storage boundary for the nightly cohort-aggregator
 * job (CEO plan Phase 0, §5). Relocated the raw SQL out of
 * src/jobs/cohort-aggregator.ts so the job file owns only orchestration
 * (loop, timing, counting) and the repository owns persistence.
 *
 * Two implementations behind the one interface:
 *   - PgCohortSignalsRepo — talks to Postgres (atom_engagements,
 *     cohort_signals), identical SQL to the pre-migration code.
 *   - FileCohortSignalsRepo — JSON-file-backed for DB-less demo/dev mode.
 *     Reads/writes .data/storage/cohort-signals.json. Cannot recompute
 *     aggregates from atom_engagements (that table has no file-backed
 *     mirror — out of scope for Phase 0), so aggregateAndCount() always
 *     reports zero source rows; upsert()/getAll() work fully, so anything
 *     seeded directly (tests, a future demo seeder) round-trips correctly.
 */

import fs from 'fs';
import path from 'path';
import { getSharedPool } from '../pool';

export interface CohortEngagementAggregate {
  atom_id: string;
  errors: number;
  corrects: number;
}

export interface CohortSignal {
  atom_id: string;
  error_pct: number;
  n_seen: number;
  computed_at: string;
}

export interface CohortSignalsRepo {
  /** Raw aggregate straight off atom_engagements — the aggregator loop turns each row into an upsert. */
  getEngagementAggregates(): Promise<CohortEngagementAggregate[]>;
  upsertSignal(atom_id: string, error_pct: number, n_seen: number): Promise<void>;
  getAll(): Promise<CohortSignal[]>;
}

export class PgCohortSignalsRepo implements CohortSignalsRepo {
  constructor(private pool: import('pg').Pool) {}

  async getEngagementAggregates(): Promise<CohortEngagementAggregate[]> {
    const result = await this.pool.query(
      `SELECT atom_id,
              SUM(CASE WHEN last_recall_correct = false THEN 1 ELSE 0 END)::int AS errors,
              SUM(CASE WHEN last_recall_correct = true  THEN 1 ELSE 0 END)::int AS corrects
       FROM atom_engagements
       WHERE last_recall_correct IS NOT NULL
       GROUP BY atom_id`,
    );
    return result.rows.map((r: any) => ({
      atom_id: r.atom_id,
      errors: Number(r.errors) || 0,
      corrects: Number(r.corrects) || 0,
    }));
  }

  async upsertSignal(atom_id: string, error_pct: number, n_seen: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO cohort_signals (atom_id, error_pct, n_seen, computed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (atom_id) DO UPDATE
         SET error_pct = EXCLUDED.error_pct,
             n_seen = EXCLUDED.n_seen,
             computed_at = NOW()`,
      [atom_id, error_pct.toFixed(3), n_seen],
    );
  }

  async getAll(): Promise<CohortSignal[]> {
    const result = await this.pool.query(
      `SELECT atom_id, error_pct, n_seen, computed_at FROM cohort_signals ORDER BY atom_id`,
    );
    return result.rows;
  }
}

export class FileCohortSignalsRepo implements CohortSignalsRepo {
  constructor(private filePath: string = path.resolve(process.cwd(), '.data/storage/cohort-signals.json')) {}

  private read(): Record<string, CohortSignal> {
    if (!fs.existsSync(this.filePath)) return {};
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
    } catch {
      return {};
    }
  }

  private write(data: Record<string, CohortSignal>): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async getEngagementAggregates(): Promise<CohortEngagementAggregate[]> {
    // No file-backed mirror of atom_engagements — DB-less mode has nothing
    // to aggregate from, matching the pre-migration `if (!pool) return
    // zero-result` behavior exactly.
    return [];
  }

  async upsertSignal(atom_id: string, error_pct: number, n_seen: number): Promise<void> {
    const data = this.read();
    data[atom_id] = { atom_id, error_pct, n_seen, computed_at: new Date().toISOString() };
    this.write(data);
  }

  async getAll(): Promise<CohortSignal[]> {
    return Object.values(this.read()).sort((a, b) => a.atom_id.localeCompare(b.atom_id));
  }
}

/** Factory: Postgres-backed when DATABASE_URL is set, file-backed otherwise. */
export function getCohortSignalsRepo(): CohortSignalsRepo {
  const pool = getSharedPool();
  return pool ? new PgCohortSignalsRepo(pool) : new FileCohortSignalsRepo();
}
