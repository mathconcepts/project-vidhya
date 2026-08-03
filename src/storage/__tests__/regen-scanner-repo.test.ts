/**
 * Tests for RegenScannerRepo (CEO plan Phase 0 §5.1). Pg implementation
 * against a mocked pg.Pool.
 */

import { describe, it, expect } from 'vitest';
import { PgRegenScannerRepo, NullRegenScannerRepo } from '../repositories/regen-scanner-repo';

describe('PgRegenScannerRepo', () => {
  it('getMaxCohortSignalUpdatedAt returns the max_ts value, or null when empty', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [{ max_ts: '2026-08-01T00:00:00.000Z' }] };
    };
    const repo = new PgRegenScannerRepo({ query } as any);
    const result = await repo.getMaxCohortSignalUpdatedAt();
    expect(capturedSql).toMatch(/MAX\(computed_at\) AS max_ts FROM cohort_signals/);
    expect(result).toBe('2026-08-01T00:00:00.000Z');
  });

  it('getMaxCohortSignalUpdatedAt returns null when the table is empty', async () => {
    const query = async () => ({ rows: [{ max_ts: null }] });
    const repo = new PgRegenScannerRepo({ query } as any);
    await expect(repo.getMaxCohortSignalUpdatedAt()).resolves.toBeNull();
  });

  it('getCandidates passes threshold/minNSeen/dedupeHours/cap positionally', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [{ atom_id: 'calculus.limits-intro', error_pct: 0.6, n_seen: 15 }] };
    };
    const repo = new PgRegenScannerRepo({ query } as any);
    const result = await repo.getCandidates(0.5, 10, 24, 20);
    expect(capturedSql).toMatch(/FROM cohort_signals cs/);
    expect(capturedSql).toMatch(/NOT EXISTS/);
    expect(capturedParams).toEqual([0.5, 10, '24', 20]);
    expect(result).toEqual([{ atom_id: 'calculus.limits-intro', error_pct: 0.6, n_seen: 15 }]);
  });

  it('getTopMisconceptions groups by concept_id and returns diagnosis values, filtering falsy entries', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [{ diagnosis: 'sign error', freq: '5' }, { diagnosis: null, freq: '1' }] };
    };
    const repo = new PgRegenScannerRepo({ query } as any);
    const result = await repo.getTopMisconceptions('derivatives-basic');
    expect(capturedSql).toMatch(/FROM error_log/);
    expect(capturedSql).toMatch(/WHERE concept_id = \$1/);
    expect(capturedSql).toMatch(/GROUP BY diagnosis/);
    expect(capturedSql).not.toMatch(/atom_id/);
    expect(capturedSql).not.toMatch(/error_text/);
    expect(capturedParams).toEqual(['derivatives-basic']);
    expect(result).toEqual(['sign error']);
  });

  it('getLatestTwoVersionNumbers returns version_n values newest first', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [{ version_n: 3 }, { version_n: 2 }] };
    };
    const repo = new PgRegenScannerRepo({ query } as any);
    const result = await repo.getLatestTwoVersionNumbers('calculus.limits-intro');
    expect(capturedSql).toMatch(/ORDER BY version_n DESC LIMIT 2/);
    expect(result).toEqual([3, 2]);
  });

  it('updateImprovementReason issues the UPDATE with reason + atom_id', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgRegenScannerRepo({ query } as any);
    await repo.updateImprovementReason('calculus.limits-intro', 'Cohort error 60% — top miss: sign error');
    expect(capturedSql).toMatch(/UPDATE atom_versions/);
    expect(capturedSql).toMatch(/SET improvement_reason = \$1/);
    expect(capturedParams).toEqual(['Cohort error 60% — top miss: sign error', 'calculus.limits-intro']);
  });
});

describe('NullRegenScannerRepo', () => {
  it('getMaxCohortSignalUpdatedAt returns null', async () => {
    const repo = new NullRegenScannerRepo();
    await expect(repo.getMaxCohortSignalUpdatedAt()).resolves.toBeNull();
  });

  it('getCandidates returns an empty array', async () => {
    const repo = new NullRegenScannerRepo();
    await expect(repo.getCandidates(0.5, 10, 24, 20)).resolves.toEqual([]);
  });

  it('getTopMisconceptions returns an empty array', async () => {
    const repo = new NullRegenScannerRepo();
    await expect(repo.getTopMisconceptions('atom-1')).resolves.toEqual([]);
  });

  it('getLatestTwoVersionNumbers returns an empty array', async () => {
    const repo = new NullRegenScannerRepo();
    await expect(repo.getLatestTwoVersionNumbers('atom-1')).resolves.toEqual([]);
  });

  it('updateImprovementReason is a safe no-op', async () => {
    const repo = new NullRegenScannerRepo();
    await expect(repo.updateImprovementReason('atom-1', 'reason')).resolves.toBeUndefined();
  });
});
