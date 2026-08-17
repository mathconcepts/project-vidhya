/**
 * PedagogyShadowRepo — storage boundary for the Tier 4 shadow log.
 *
 * Lives here rather than beside the verifier so `pedagogy-shadow.ts` stays a
 * pure module: every statistic and the flip criterion are computable from an
 * array, with no pool, no clock and no environment. That is what makes them
 * testable without a database, which matters because no database is reachable
 * in the environment this was written in.
 *
 * It also keeps `src/content/verifiers/` off the pg-import allowlist. That
 * list "may only SHRINK ... or grow via an explicit, reviewable diff", and its
 * stated intent is migration onto this boundary. Adding a repository is the
 * move the ratchet is asking for; growing the list would have been the move it
 * tolerates.
 *
 * Two implementations behind one interface, matching the other repos here:
 *   - PgPedagogyShadowRepo    — Postgres, table from migration 040.
 *   - FilePedagogyShadowRepo  — JSON file, for DB-less demo and dev runs.
 */

import fs from 'fs';
import path from 'path';
import { getSharedPool } from '../pool';
import type { PedagogyShadowRow } from '../../content/verifiers/pedagogy-shadow';

export interface PedagogyShadowRepo {
  /** Record one observation. Never throws — a lost shadow row is not worth failing generation over. */
  append(row: PedagogyShadowRow): Promise<void>;
  /** Every observation, newest first. */
  all(limit?: number): Promise<PedagogyShadowRow[]>;
  /** Where the rows are, for the readout to state plainly. */
  describe(): string;
}

const DEFAULT_LIMIT = 5000;

// ---------------------------------------------------------------------------

export class PgPedagogyShadowRepo implements PedagogyShadowRepo {
  async append(row: PedagogyShadowRow): Promise<void> {
    const pool = getSharedPool();
    if (!pool) return;
    try {
      await pool.query(
        `INSERT INTO pedagogy_shadow_log (target_id, concept_id, score, errored, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [row.target_id, row.concept_id ?? null, row.score, row.errored, row.reason ?? null],
      );
    } catch (err) {
      console.error('[pedagogy-shadow] log failed (non-fatal):', (err as Error).message);
    }
  }

  async all(limit = DEFAULT_LIMIT): Promise<PedagogyShadowRow[]> {
    const pool = getSharedPool();
    if (!pool) return [];
    try {
      const { rows } = await pool.query(
        `SELECT target_id, concept_id, score, errored, reason
           FROM pedagogy_shadow_log
          ORDER BY created_at DESC
          LIMIT $1`,
        [limit],
      );
      return rows.map((r: Record<string, unknown>) => ({
        target_id: String(r.target_id),
        concept_id: r.concept_id ? String(r.concept_id) : undefined,
        // NUMERIC comes back as a string from pg; Number() here rather than at
        // every call site, or the quantiles sort lexicographically and "0.9"
        // lands below "0.12".
        score: Number(r.score),
        errored: Boolean(r.errored),
        reason: r.reason ? String(r.reason) : undefined,
      }));
    } catch (err) {
      console.error('[pedagogy-shadow] read failed:', (err as Error).message);
      return [];
    }
  }

  describe(): string {
    return 'postgres:pedagogy_shadow_log';
  }
}

// ---------------------------------------------------------------------------

export class FilePedagogyShadowRepo implements PedagogyShadowRepo {
  constructor(private file = path.join('.data', 'storage', 'pedagogy-shadow.json')) {}

  private read(): PedagogyShadowRow[] {
    try {
      if (!fs.existsSync(this.file)) return [];
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async append(row: PedagogyShadowRow): Promise<void> {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const rows = this.read();
      rows.push(row);
      fs.writeFileSync(this.file, JSON.stringify(rows, null, 2));
    } catch (err) {
      console.error('[pedagogy-shadow] file log failed (non-fatal):', (err as Error).message);
    }
  }

  async all(limit = DEFAULT_LIMIT): Promise<PedagogyShadowRow[]> {
    return this.read().slice(-limit).reverse();
  }

  describe(): string {
    return `file:${this.file}`;
  }
}

// ---------------------------------------------------------------------------

let _repo: PedagogyShadowRepo | null = null;

/** Postgres when DATABASE_URL is set, a JSON file otherwise. */
export function getPedagogyShadowRepo(): PedagogyShadowRepo {
  if (!_repo) {
    _repo = getSharedPool() ? new PgPedagogyShadowRepo() : new FilePedagogyShadowRepo();
  }
  return _repo;
}

/** Tests only. */
export function _setPedagogyShadowRepo(r: PedagogyShadowRepo | null): void {
  _repo = r;
}
