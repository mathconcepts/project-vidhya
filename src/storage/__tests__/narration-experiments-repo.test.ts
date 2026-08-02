/**
 * Tests for NarrationExperimentsRepo (CEO plan Phase 0 §5) — the Pg
 * implementation against a mocked pg.Pool, plus the Null implementation's
 * documented no-op contract.
 */

import { describe, it, expect } from 'vitest';
import { PgNarrationExperimentsRepo, NullNarrationExperimentsRepo } from '../repositories/narration-experiments-repo';

describe('PgNarrationExperimentsRepo', () => {
  it('countActiveNarrationExperiments filters on variant_kind + status', async () => {
    const query = async (sql: string) => {
      expect(sql).toMatch(/variant_kind = 'narration'/);
      expect(sql).toMatch(/status = 'running'/);
      return { rows: [{ n: 7 }] };
    };
    const repo = new PgNarrationExperimentsRepo({ query } as any);
    expect(await repo.countActiveNarrationExperiments()).toBe(7);
  });

  it('countActiveNarrationExperiments defaults to 0 on an empty result', async () => {
    const repo = new PgNarrationExperimentsRepo({ query: async () => ({ rows: [] }) } as any);
    expect(await repo.countActiveNarrationExperiments()).toBe(0);
  });

  it('findEligibleAtoms passes the limit through and returns the joined rows', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [{ atom_id: 'derivatives-basic.intuition', version_n: 3 }] };
    };
    const repo = new PgNarrationExperimentsRepo({ query } as any);
    const eligible = await repo.findEligibleAtoms(25);
    expect(capturedSql).toMatch(/JOIN media_artifacts/);
    expect(capturedSql).toMatch(/LEFT JOIN atom_ab_tests/);
    expect(capturedSql).toMatch(/v\.atom_id LIKE '%\.intuition'/);
    expect(capturedParams).toEqual([25]);
    expect(eligible).toEqual([{ atom_id: 'derivatives-basic.intuition', version_n: 3 }]);
  });
});

describe('NullNarrationExperimentsRepo', () => {
  it('always reports zero active experiments and zero eligible atoms', async () => {
    const repo = new NullNarrationExperimentsRepo();
    expect(await repo.countActiveNarrationExperiments()).toBe(0);
    expect(await repo.findEligibleAtoms(50)).toEqual([]);
  });
});
