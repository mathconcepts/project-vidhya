/**
 * Data export/import with verify — CEO plan Phase 0 §5.2 ("Task 7").
 *
 * The mechanism behind `vidhya data export` / `vidhya data import` /
 * `vidhya data verify` (see scripts/vidhya-data.ts for the CLI). Snapshots
 * are JSONL: one canonical-JSON row per line per table, plus a
 * manifest.json recording each table's row count and a SHA-256 content
 * checksum. Verification recomputes the checksum from the live backend
 * and refuses to declare success on any mismatch — `MigrationVerifyError`
 * lists every discrepancy found, not just the first.
 *
 * SCOPE, stated plainly rather than implied: this is NOT a universal
 * table dumper. It moves data through the src/storage/repository
 * interfaces (CEO plan §5's "Two targets cover every real deployment"
 * principle — file mode and Postgres, not five databases, not raw table
 * introspection). A table is only snapshot-able once its repo has both a
 * Pg and a File implementation — today that's exactly one:
 * CohortSignalsRepo (src/storage/repositories/cohort-signals-repo.ts).
 * Every other repo built during this Phase 0 pass (content-flywheel,
 * learnings-ledger, daily-problem, feedback-scorer, content-prioritizer,
 * regen-scanner, retention-engine, telegram-webhook, trend-collector,
 * curriculum-unit, narration-experiments) is intentionally Pg+Null only
 * — file mode was never a supported backend for those jobs, so there's
 * nothing to move between backends. TABLE_REGISTRY below is where a
 * table joins the migration surface once its repo grows a File
 * implementation; the registry is designed to grow, not to be exhaustive
 * today.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Pool } from 'pg';
import {
  PgCohortSignalsRepo,
  FileCohortSignalsRepo,
  type CohortSignalsRepo,
  type CohortSignal,
} from '../storage/repositories/cohort-signals-repo';

export const SNAPSHOT_FORMAT_VERSION = 1;

export type Backend = 'pg' | 'file';

export class MigrationVerifyError extends Error {
  constructor(public readonly mismatches: string[]) {
    super(`Snapshot verification failed for ${mismatches.length} table(s):\n${mismatches.map((m) => `  - ${m}`).join('\n')}`);
    this.name = 'MigrationVerifyError';
  }
}

export interface TableManifestEntry {
  name: string;
  row_count: number;
  checksum: string;
}

export interface SnapshotManifest {
  format_version: number;
  created_at: string;
  backend: Backend;
  tables: TableManifestEntry[];
}

/**
 * One entry per snapshot-able table. `T` is the row shape returned by the
 * repo's read-all method. `readAll`/`importRow` are thin adapters onto
 * the repo's actual method names (which vary per repo — e.g.
 * CohortSignalsRepo.upsertSignal takes 3 positional args, not one row
 * object) so the snapshot engine itself stays repo-shape-agnostic.
 */
export interface TableSnapshotter<T> {
  name: string;
  makePgRepo(pool: Pool): unknown;
  makeFileRepo(): unknown;
  readAll(repo: unknown): Promise<T[]>;
  importRow(repo: unknown, row: T): Promise<void>;
  /**
   * Optional: coerce a row to its logical (backend-independent) shape
   * before it's hashed or written to JSONL. Needed because a backend's
   * native driver can return the "same" value in different JS shapes —
   * e.g. node-pg returns NUMERIC columns as strings by default (no
   * custom type parser registered), while FileCohortSignalsRepo stores
   * genuine JS numbers, even though both satisfy CohortSignal.error_pct:
   * number. Without normalization, a file→pg migration would report a
   * false checksum mismatch on data that's logically identical — caught
   * by this engine's own cross-backend test during Task 7 development.
   * Defaults to identity when omitted.
   */
  normalizeRow?(row: T): Record<string, unknown>;
}

const cohortSignalsTable: TableSnapshotter<CohortSignal> = {
  name: 'cohort_signals',
  makePgRepo: (pool) => new PgCohortSignalsRepo(pool),
  makeFileRepo: () => new FileCohortSignalsRepo(),
  readAll: (repo) => (repo as CohortSignalsRepo).getAll(),
  importRow: (repo, row) => (repo as CohortSignalsRepo).upsertSignal(row.atom_id, row.error_pct, row.n_seen),
  normalizeRow: (row) => ({
    atom_id: row.atom_id,
    error_pct: Number(row.error_pct),
    n_seen: Number(row.n_seen),
    // computed_at is intentionally excluded: it's a computation
    // timestamp, not content — a re-import (which is allowed to
    // re-stamp computed_at) shouldn't fail verification for that alone.
  }),
};

export const TABLE_REGISTRY: TableSnapshotter<any>[] = [cohortSignalsTable];

function resolveRepo(table: TableSnapshotter<any>, backend: Backend, pool: Pool | null): unknown {
  if (backend === 'pg') {
    if (!pool) throw new Error(`[data-migration] backend 'pg' requires a live Pool (DATABASE_URL not configured?)`);
    return table.makePgRepo(pool);
  }
  return table.makeFileRepo();
}

/**
 * Canonical JSON for one row: keys sorted, no whitespace, so the same
 * logical row always serializes identically regardless of the source
 * backend's column ordering or the JS object's insertion order.
 */
export function canonicalRowJSON(row: Record<string, unknown>): string {
  const sortedKeys = Object.keys(row).sort();
  const sorted: Record<string, unknown> = {};
  for (const k of sortedKeys) sorted[k] = row[k];
  return JSON.stringify(sorted);
}

/** SHA-256 hex digest over the newline-joined canonical rows, sorted for determinism regardless of read order. */
export function computeChecksum(rows: Record<string, unknown>[]): string {
  const lines = rows.map(canonicalRowJSON).sort();
  const hash = crypto.createHash('sha256');
  hash.update(lines.join('\n'));
  return hash.digest('hex');
}

/**
 * Reads a table from `backend` and returns it already coerced to
 * canonical form (TableSnapshotter.normalizeRow applied when present).
 * This is the ONE place raw backend-native rows get normalized — every
 * caller (export, the post-import re-read, verify) goes through this, so
 * JSONL content, checksums, and importRow() inputs are always the same
 * canonical shape regardless of which backend produced them. Without
 * this, a pg-sourced export (NUMERIC columns as strings, per node-pg's
 * default type parsing) would fail to re-import into a fresh backend
 * whose upsert methods expect real JS numbers — caught by this engine's
 * own live-Postgres round-trip smoke test during Task 7 development.
 */
async function readTableRows(table: TableSnapshotter<any>, backend: Backend, pool: Pool | null): Promise<Record<string, unknown>[]> {
  const repo = resolveRepo(table, backend, pool);
  const raw = await table.readAll(repo);
  return table.normalizeRow ? raw.map((r) => table.normalizeRow!(r)) : raw;
}

/**
 * Export every registered table from `backend` into `outDir` as JSONL
 * (`<outDir>/<table>.jsonl`) plus `<outDir>/manifest.json`. Returns the
 * manifest that was written.
 */
export async function exportSnapshot(outDir: string, backend: Backend, pool: Pool | null): Promise<SnapshotManifest> {
  fs.mkdirSync(outDir, { recursive: true });
  const tables: TableManifestEntry[] = [];

  for (const table of TABLE_REGISTRY) {
    const rows = await readTableRows(table, backend, pool);
    const jsonlPath = path.join(outDir, `${table.name}.jsonl`);
    fs.writeFileSync(jsonlPath, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''), 'utf-8');
    tables.push({ name: table.name, row_count: rows.length, checksum: computeChecksum(rows) });
  }

  const manifest: SnapshotManifest = {
    format_version: SNAPSHOT_FORMAT_VERSION,
    created_at: new Date().toISOString(),
    backend,
    tables,
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  return manifest;
}

function readManifest(dir: string): SnapshotManifest {
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`[data-migration] no manifest.json found in ${dir} — is this a snapshot directory?`);
  }
  const manifest: SnapshotManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  if (manifest.format_version !== SNAPSHOT_FORMAT_VERSION) {
    throw new Error(
      `[data-migration] snapshot format_version ${manifest.format_version} != supported ${SNAPSHOT_FORMAT_VERSION}`,
    );
  }
  return manifest;
}

function readJsonlRows(dir: string, tableName: string): Record<string, unknown>[] {
  const jsonlPath = path.join(dir, `${tableName}.jsonl`);
  if (!fs.existsSync(jsonlPath)) return [];
  const content = fs.readFileSync(jsonlPath, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/**
 * Import every table recorded in `<inDir>/manifest.json` into `backend`.
 * After writing each table's rows, immediately re-reads the target and
 * compares row count + checksum against the manifest — an import that
 * silently drops or corrupts rows throws MigrationVerifyError instead of
 * reporting success. Table-by-table: one table's rows are all imported
 * before that table is verified, but a later table's failure doesn't
 * roll back an earlier table's already-imported rows (matching the
 * repos' own no-transaction upsert semantics — see cohort-signals-repo.ts).
 */
export async function importSnapshot(inDir: string, backend: Backend, pool: Pool | null): Promise<SnapshotManifest> {
  const manifest = readManifest(inDir);
  const mismatches: string[] = [];

  for (const entry of manifest.tables) {
    const table = TABLE_REGISTRY.find((t) => t.name === entry.name);
    if (!table) {
      mismatches.push(`${entry.name}: no registered table snapshotter for this name (registry drifted since export?)`);
      continue;
    }
    const rows = readJsonlRows(inDir, entry.name);
    const repo = resolveRepo(table, backend, pool);
    for (const row of rows) {
      await table.importRow(repo, row);
    }

    const imported = await readTableRows(table, backend, pool);
    const importedChecksum = computeChecksum(imported);
    if (imported.length !== entry.row_count) {
      mismatches.push(`${entry.name}: row count ${imported.length} != manifest ${entry.row_count}`);
    } else if (importedChecksum !== entry.checksum) {
      mismatches.push(`${entry.name}: checksum ${importedChecksum} != manifest ${entry.checksum}`);
    }
  }

  if (mismatches.length > 0) throw new MigrationVerifyError(mismatches);
  return manifest;
}

/**
 * Standalone verify: recompute row count + checksum for every table in
 * `<dir>/manifest.json` against the current state of `backend`, without
 * importing anything. Throws MigrationVerifyError listing every
 * mismatched table if any differ.
 */
export async function verifySnapshot(dir: string, backend: Backend, pool: Pool | null): Promise<SnapshotManifest> {
  const manifest = readManifest(dir);
  const mismatches: string[] = [];

  for (const entry of manifest.tables) {
    const table = TABLE_REGISTRY.find((t) => t.name === entry.name);
    if (!table) {
      mismatches.push(`${entry.name}: no registered table snapshotter for this name (registry drifted since export?)`);
      continue;
    }
    const rows = await readTableRows(table, backend, pool);
    const checksum = computeChecksum(rows);
    if (rows.length !== entry.row_count) {
      mismatches.push(`${entry.name}: row count ${rows.length} != manifest ${entry.row_count}`);
    } else if (checksum !== entry.checksum) {
      mismatches.push(`${entry.name}: checksum ${checksum} != manifest ${entry.checksum}`);
    }
  }

  if (mismatches.length > 0) throw new MigrationVerifyError(mismatches);
  return manifest;
}
