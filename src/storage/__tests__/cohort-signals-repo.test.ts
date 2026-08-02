/**
 * Tests for CohortSignalsRepo (CEO plan Phase 0 §5) — both the Pg
 * implementation (against a mocked pg.Pool) and the File implementation
 * (real filesystem, temp directory per test).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { PgCohortSignalsRepo, FileCohortSignalsRepo } from '../repositories/cohort-signals-repo';

describe('PgCohortSignalsRepo', () => {
  it('getEngagementAggregates runs the GROUP BY query and maps rows', async () => {
    const query = async (sql: string) => {
      expect(sql).toMatch(/SELECT atom_id/);
      expect(sql).toMatch(/last_recall_correct IS NOT NULL/);
      expect(sql).toMatch(/GROUP BY atom_id/);
      return { rows: [{ atom_id: 'a1', errors: '6', corrects: '4' }] };
    };
    const repo = new PgCohortSignalsRepo({ query } as any);
    const aggregates = await repo.getEngagementAggregates();
    expect(aggregates).toEqual([{ atom_id: 'a1', errors: 6, corrects: 4 }]);
  });

  it('upsertSignal issues an ON CONFLICT upsert with a 3-decimal error_pct', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgCohortSignalsRepo({ query } as any);
    await repo.upsertSignal('a1', 0.6, 10);
    expect(capturedSql).toMatch(/INSERT INTO cohort_signals/);
    expect(capturedSql).toMatch(/ON CONFLICT \(atom_id\) DO UPDATE/);
    expect(capturedParams).toEqual(['a1', '0.600', 10]);
  });
});

describe('FileCohortSignalsRepo', () => {
  let dir: string;
  let filePath: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'vidhya-cohort-repo-'));
    filePath = path.join(dir, 'cohort-signals.json');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('getEngagementAggregates always returns empty — no file-backed atom_engagements mirror', async () => {
    const repo = new FileCohortSignalsRepo(filePath);
    expect(await repo.getEngagementAggregates()).toEqual([]);
  });

  it('upsertSignal + getAll round-trip through the JSON file', async () => {
    const repo = new FileCohortSignalsRepo(filePath);
    await repo.upsertSignal('a1', 0.5, 10);
    await repo.upsertSignal('a2', 0.2, 20);
    const all = await repo.getAll();
    expect(all.map((s) => s.atom_id)).toEqual(['a1', 'a2']);
    expect(all[0].error_pct).toBe(0.5);
    expect(all[0].n_seen).toBe(10);
  });

  it('upsertSignal overwrites an existing entry for the same atom_id', async () => {
    const repo = new FileCohortSignalsRepo(filePath);
    await repo.upsertSignal('a1', 0.5, 10);
    await repo.upsertSignal('a1', 0.9, 99);
    const all = await repo.getAll();
    expect(all.length).toBe(1);
    expect(all[0].error_pct).toBe(0.9);
    expect(all[0].n_seen).toBe(99);
  });

  it('getAll on a fresh repo (no file yet) returns an empty array, not a crash', async () => {
    const repo = new FileCohortSignalsRepo(filePath);
    expect(await repo.getAll()).toEqual([]);
  });
});
