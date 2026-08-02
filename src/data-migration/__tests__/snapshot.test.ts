/**
 * Tests for the data export/import/verify engine (CEO plan Phase 0 §5.2).
 *
 * Two paths, matching the delivery doc's stated testing intent:
 *   - File round-trips (FileCohortSignalsRepo pattern) — real filesystem,
 *     real JSONL, real checksums, no mocking.
 *   - A mocked-pg.Pool path — proves the pg backend without a live DB.
 *
 * (A genuine live-Postgres round-trip is additionally run as an ad-hoc
 * smoke script during this session, since a real DB happens to be
 * available here — see the delivery doc for that transcript. These
 * tests are the permanent, CI-run coverage.)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  exportSnapshot,
  importSnapshot,
  verifySnapshot,
  computeChecksum,
  canonicalRowJSON,
  MigrationVerifyError,
  SNAPSHOT_FORMAT_VERSION,
} from '../snapshot';
import { FileCohortSignalsRepo } from '../../storage/repositories/cohort-signals-repo';

function tmpDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('canonicalRowJSON / computeChecksum', () => {
  it('produces identical output regardless of key order', () => {
    const a = { b: 2, a: 1 };
    const b = { a: 1, b: 2 };
    expect(canonicalRowJSON(a)).toBe(canonicalRowJSON(b));
  });

  it('computeChecksum is stable across row order (rows are sorted before hashing)', () => {
    const rows1 = [{ atom_id: 'x', n: 1 }, { atom_id: 'y', n: 2 }];
    const rows2 = [{ atom_id: 'y', n: 2 }, { atom_id: 'x', n: 1 }];
    expect(computeChecksum(rows1)).toBe(computeChecksum(rows2));
  });

  it('computeChecksum differs when content differs', () => {
    const rows1 = [{ atom_id: 'x', n: 1 }];
    const rows2 = [{ atom_id: 'x', n: 2 }];
    expect(computeChecksum(rows1)).not.toBe(computeChecksum(rows2));
  });

  it('empty table has a stable, deterministic checksum', () => {
    expect(computeChecksum([])).toBe(computeChecksum([]));
  });
});

describe('file backend round-trip (real filesystem, no mocking)', () => {
  let snapshotDir: string;

  // TABLE_REGISTRY's makeFileRepo() always resolves FileCohortSignalsRepo's
  // default path (path.resolve(process.cwd(), '.data/storage/cohort-signals.json'))
  // — the registry intentionally doesn't expose per-call path injection (see
  // snapshot.ts's TableSnapshotter doc comment), so these tests seed/verify
  // through that same default path, backing up and restoring whatever real
  // file might already be there.
  const defaultFilePath = path.resolve(process.cwd(), '.data/storage/cohort-signals.json');
  const defaultFileBackup = `${defaultFilePath}.bak-test`;

  beforeEach(() => {
    snapshotDir = tmpDir('vidhya-data-snap-');
    if (fs.existsSync(defaultFilePath)) fs.renameSync(defaultFilePath, defaultFileBackup);
  });

  afterEach(() => {
    fs.rmSync(snapshotDir, { recursive: true, force: true });
  });

  afterEach(() => {
    if (fs.existsSync(defaultFilePath)) fs.rmSync(defaultFilePath);
    if (fs.existsSync(defaultFileBackup)) fs.renameSync(defaultFileBackup, defaultFilePath);
  });

  it('exports what was seeded via FileCohortSignalsRepo, matching manifest row count + checksum', async () => {
    const repo = new FileCohortSignalsRepo(defaultFilePath);
    await repo.upsertSignal('calculus.limits', 0.4, 20);
    await repo.upsertSignal('linear-algebra.eigen', 0.6, 15);

    const manifest = await exportSnapshot(snapshotDir, 'file', null);

    expect(manifest.format_version).toBe(SNAPSHOT_FORMAT_VERSION);
    expect(manifest.backend).toBe('file');
    expect(manifest.tables).toHaveLength(1);
    expect(manifest.tables[0].name).toBe('cohort_signals');
    expect(manifest.tables[0].row_count).toBe(2);

    const jsonlPath = path.join(snapshotDir, 'cohort_signals.jsonl');
    const lines = fs.readFileSync(jsonlPath, 'utf-8').trim().split('\n');
    expect(lines).toHaveLength(2);
    const parsed = lines.map((l) => JSON.parse(l));
    expect(parsed.map((r) => r.atom_id).sort()).toEqual(['calculus.limits', 'linear-algebra.eigen']);
  });

  it('verifySnapshot passes against the same unmodified file backend', async () => {
    const repo = new FileCohortSignalsRepo(defaultFilePath);
    await repo.upsertSignal('calculus.limits', 0.4, 20);

    await exportSnapshot(snapshotDir, 'file', null);
    await expect(verifySnapshot(snapshotDir, 'file', null)).resolves.toMatchObject({ backend: 'file' });
  });

  it('verifySnapshot throws MigrationVerifyError when the backend drifts after export', async () => {
    const repo = new FileCohortSignalsRepo(defaultFilePath);
    await repo.upsertSignal('calculus.limits', 0.4, 20);
    await exportSnapshot(snapshotDir, 'file', null);

    // Mutate the backend after the snapshot was taken.
    await repo.upsertSignal('calculus.limits', 0.9, 999);

    await expect(verifySnapshot(snapshotDir, 'file', null)).rejects.toThrow(MigrationVerifyError);
    try {
      await verifySnapshot(snapshotDir, 'file', null);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(MigrationVerifyError);
      expect((e as MigrationVerifyError).mismatches[0]).toContain('cohort_signals');
    }
  });

  it('importSnapshot round-trips into a fresh (empty) file backend and self-verifies', async () => {
    const source = new FileCohortSignalsRepo(defaultFilePath);
    await source.upsertSignal('calculus.limits', 0.4, 20);
    await source.upsertSignal('linear-algebra.eigen', 0.6, 15);
    await exportSnapshot(snapshotDir, 'file', null);

    // Wipe the backend to prove import actually repopulates it, not just re-verifies existing state.
    fs.rmSync(defaultFilePath);

    const manifest = await importSnapshot(snapshotDir, 'file', null);
    expect(manifest.tables[0].row_count).toBe(2);

    const target = new FileCohortSignalsRepo(defaultFilePath);
    const rows = await target.getAll();
    expect(rows.map((r) => r.atom_id).sort()).toEqual(['calculus.limits', 'linear-algebra.eigen']);
  });
});

describe('pg backend (mocked pg.Pool)', () => {
  /** A minimal in-memory fake of the cohort_signals table, wired to the exact SQL PgCohortSignalsRepo issues. */
  function makeMockPgPool() {
    const table = new Map<string, { atom_id: string; error_pct: string; n_seen: number; computed_at: string }>();
    const query = async (sql: string, params?: any[]) => {
      if (/FROM cohort_signals ORDER BY atom_id/.test(sql)) {
        return { rows: [...table.values()].sort((a, b) => a.atom_id.localeCompare(b.atom_id)) };
      }
      if (/INSERT INTO cohort_signals/.test(sql)) {
        const [atom_id, error_pct, n_seen] = params!;
        table.set(atom_id, { atom_id, error_pct, n_seen, computed_at: new Date().toISOString() });
        return { rows: [] };
      }
      if (/FROM atom_engagements/.test(sql)) {
        return { rows: [] };
      }
      throw new Error(`mock pg pool: unhandled query: ${sql}`);
    };
    return { query } as any;
  }

  it('exports what was seeded via the mocked Pg repo', async () => {
    const pool = makeMockPgPool();
    const outDir = tmpDir('vidhya-data-pg-export-');
    try {
      // Seed through the same repo path exportSnapshot itself would use.
      const { PgCohortSignalsRepo } = await import('../../storage/repositories/cohort-signals-repo');
      const seedRepo = new PgCohortSignalsRepo(pool);
      await seedRepo.upsertSignal('discrete.graphs', 0.3, 40);

      const manifest = await exportSnapshot(outDir, 'pg', pool);
      expect(manifest.backend).toBe('pg');
      expect(manifest.tables[0].row_count).toBe(1);
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('cross-backend migration: export from file, import into pg, verify pg matches', async () => {
    const defaultFilePath = path.resolve(process.cwd(), '.data/storage/cohort-signals.json');
    const backup = `${defaultFilePath}.bak-test2`;
    if (fs.existsSync(defaultFilePath)) fs.renameSync(defaultFilePath, backup);
    const snapshotDir = tmpDir('vidhya-data-migrate-');
    try {
      const fileRepo = new FileCohortSignalsRepo(defaultFilePath);
      await fileRepo.upsertSignal('complex-variables.residues', 0.55, 12);
      await fileRepo.upsertSignal('transforms.laplace', 0.2, 8);

      const exportManifest = await exportSnapshot(snapshotDir, 'file', null);
      expect(exportManifest.tables[0].row_count).toBe(2);

      const pool = makeMockPgPool();
      const importManifest = await importSnapshot(snapshotDir, 'pg', pool);
      expect(importManifest.tables[0].row_count).toBe(2);

      // verifySnapshot against pg should now also pass, proving the data
      // genuinely landed in the target backend (not just re-read from file).
      await expect(verifySnapshot(snapshotDir, 'pg', pool)).resolves.toBeTruthy();
    } finally {
      if (fs.existsSync(defaultFilePath)) fs.rmSync(defaultFilePath);
      if (fs.existsSync(backup)) fs.renameSync(backup, defaultFilePath);
      fs.rmSync(snapshotDir, { recursive: true, force: true });
    }
  });

  it('importSnapshot throws MigrationVerifyError if the target repo silently drops rows', async () => {
    const outDir = tmpDir('vidhya-data-badimport-');
    try {
      // A pool whose INSERT is a no-op — simulates a broken target backend.
      const brokenPool = {
        query: async (sql: string) => {
          if (/FROM cohort_signals ORDER BY atom_id/.test(sql)) return { rows: [] };
          if (/INSERT INTO cohort_signals/.test(sql)) return { rows: [] }; // silently drops
          return { rows: [] };
        },
      } as any;

      // Build a manifest by hand describing 1 row that the broken pool will never actually persist.
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, 'cohort_signals.jsonl'),
        JSON.stringify({ atom_id: 'x.y', error_pct: 0.5, n_seen: 10, computed_at: new Date().toISOString() }) + '\n',
      );
      fs.writeFileSync(
        path.join(outDir, 'manifest.json'),
        JSON.stringify({
          format_version: SNAPSHOT_FORMAT_VERSION,
          created_at: new Date().toISOString(),
          backend: 'file',
          tables: [{ name: 'cohort_signals', row_count: 1, checksum: 'deliberately-wrong-or-unreachable' }],
        }),
      );

      await expect(importSnapshot(outDir, 'pg', brokenPool)).rejects.toThrow(MigrationVerifyError);
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });
});
