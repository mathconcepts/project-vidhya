/**
 * Tests for CurriculumUnitRepo (CEO plan Phase 0 §5.1) — the Pg
 * implementation against a mocked pg.Pool.
 */

import { describe, it, expect } from 'vitest';
import { PgCurriculumUnitRepo, NullCurriculumUnitRepo } from '../repositories/curriculum-unit-repo';

describe('PgCurriculumUnitRepo', () => {
  it('getInteractivesEnabled returns null when the exam pack has no DB row', async () => {
    const query = async () => ({ rows: [] });
    const repo = new PgCurriculumUnitRepo({ query } as any);
    expect(await repo.getInteractivesEnabled('jee-main')).toBeNull();
  });

  it('getInteractivesEnabled coerces the DB value to a boolean', async () => {
    const query = async (sql: string, params: any[]) => {
      expect(sql).toMatch(/FROM exam_packs/);
      expect(params).toEqual(['operator-pack']);
      return { rows: [{ interactives_enabled: true }] };
    };
    const repo = new PgCurriculumUnitRepo({ query } as any);
    expect(await repo.getInteractivesEnabled('operator-pack')).toBe(true);
  });

  it('upsertUnitGenerating issues the ON CONFLICT status-CASE upsert with JSON-stringified objectives', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgCurriculumUnitRepo({ query } as any);
    await repo.upsertUnitGenerating({
      id: 'unit_1',
      exam_pack_id: 'gate-ma',
      concept_id: 'eigenvalues',
      name: 'Eigenvalues unit',
      hypothesis: null,
      learning_objectives: [{ id: 'lo1', statement: 'Understand eigenvalues' }],
      prepared_for_pyq_ids: ['pyq_1'],
      retrieval_schedule: { revisit_days: [3, 10, 30] },
      generation_run_id: 'run_1',
    });
    expect(capturedSql).toMatch(/INSERT INTO curriculum_units/);
    expect(capturedSql).toMatch(/ON CONFLICT \(id\) DO UPDATE/);
    expect(capturedParams[5]).toBe(JSON.stringify([{ id: 'lo1', statement: 'Understand eigenvalues' }]));
    expect(capturedParams[7]).toBe(JSON.stringify({ revisit_days: [3, 10, 30] }));
  });

  it('linkPyqsToUnit no-ops on an empty pyq list', async () => {
    let calls = 0;
    const query = async () => {
      calls++;
      return { rows: [] };
    };
    const repo = new PgCurriculumUnitRepo({ query } as any);
    await repo.linkPyqsToUnit('unit_1', []);
    expect(calls).toBe(0);
  });

  it('linkPyqsToUnit only claims PYQs unclaimed or already claimed by the same unit', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgCurriculumUnitRepo({ query } as any);
    await repo.linkPyqsToUnit('unit_1', ['pyq_1', 'pyq_2']);
    expect(capturedSql).toMatch(/UPDATE pyq_questions/);
    expect(capturedSql).toMatch(/taught_by_unit_id IS NULL OR taught_by_unit_id = \$1/);
    expect(capturedParams).toEqual(['unit_1', ['pyq_1', 'pyq_2']]);
  });

  it('insertStubAtomVersion issues an ON CONFLICT (atom_id, version_n) DO NOTHING insert', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [] };
    };
    const repo = new PgCurriculumUnitRepo({ query } as any);
    await repo.insertStubAtomVersion({
      atom_id: 'intuition-eigenvalues',
      content: '# stub',
      generation_meta: { unit_id: 'unit_1' },
      generation_run_id: null,
    });
    expect(capturedSql).toMatch(/INSERT INTO atom_versions/);
    expect(capturedSql).toMatch(/ON CONFLICT \(atom_id, version_n\) DO NOTHING/);
  });

  it('readUnitForReview joins curriculum_units to active atom_versions in pedagogical order', async () => {
    const query = async (sql: string, params: any[]) => {
      expect(sql).toMatch(/JOIN atom_versions av ON av.atom_id = ANY\(cu.atom_ids\)/);
      expect(sql).toMatch(/array_position\(cu.atom_ids, av.atom_id\)/);
      expect(params).toEqual(['unit_1']);
      return { rows: [{ atom_id: 'intuition-eigenvalues', content: 'intro text' }] };
    };
    const repo = new PgCurriculumUnitRepo({ query } as any);
    expect(await repo.readUnitForReview('unit_1')).toEqual([
      { atom_id: 'intuition-eigenvalues', content: 'intro text' },
    ]);
  });

  it('markUnitReady clears the error column and sets status=ready', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgCurriculumUnitRepo({ query } as any);
    await repo.markUnitReady('unit_1', ['atom_a', 'atom_b'], 0.82);
    expect(capturedSql).toMatch(/status = 'ready'/);
    expect(capturedSql).toMatch(/error = NULL/);
    expect(capturedParams).toEqual(['unit_1', ['atom_a', 'atom_b'], 0.82]);
  });

  it('markUnitFailed truncates the error message to 4000 chars', async () => {
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgCurriculumUnitRepo({ query } as any);
    const longError = 'x'.repeat(5000);
    await repo.markUnitFailed('unit_1', ['atom_a'], longError);
    expect((capturedParams[2] as string).length).toBe(4000);
  });
});

describe('NullCurriculumUnitRepo', () => {
  it('getInteractivesEnabled returns null (caller falls back to YAML)', async () => {
    const repo = new NullCurriculumUnitRepo();
    expect(await repo.getInteractivesEnabled()).toBeNull();
  });

  it('readUnitForReview returns [] and every write is a safe no-op', async () => {
    const repo = new NullCurriculumUnitRepo();
    expect(await repo.readUnitForReview()).toEqual([]);
    await expect(repo.upsertUnitGenerating()).resolves.toBeUndefined();
    await expect(repo.linkPyqsToUnit()).resolves.toBeUndefined();
    await expect(repo.insertStubAtomVersion()).resolves.toBeUndefined();
    await expect(repo.markUnitReady()).resolves.toBeUndefined();
    await expect(repo.markUnitFailed()).resolves.toBeUndefined();
  });
});
