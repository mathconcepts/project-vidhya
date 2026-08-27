/**
 * Tests for LearningsLedgerRepo (CEO plan Phase 0 §5.1). Pg implementation
 * against a mocked pg.Pool.
 *
 * Closes a real gap: src/jobs/__tests__/learnings-ledger-digest.test.ts's
 * header claims "the DB-touching paths are integration-tested separately"
 * but no such test ever existed — the promote/demote/suggest/ledger-run
 * queries had zero test coverage before this repo extraction.
 */

import { describe, it, expect, vi } from 'vitest';
import { PgLearningsLedgerRepo, NullLearningsLedgerRepo } from '../repositories/learnings-ledger-repo';

describe('PgLearningsLedgerRepo', () => {
  it('fetchAtomTargets filters to non-control atom assignments for the experiment', async () => {
    const query = async (sql: string, params: any[]) => {
      expect(sql).toMatch(/FROM experiment_assignments/);
      expect(sql).toMatch(/target_kind = 'atom'/);
      expect(sql).toMatch(/variant <> 'control'/);
      expect(params).toEqual(['exp_a']);
      return { rows: [{ target_id: 'atom_x' }, { target_id: 'atom_y' }] };
    };
    const repo = new PgLearningsLedgerRepo({ query } as any);
    expect(await repo.fetchAtomTargets('exp_a')).toEqual(['atom_x', 'atom_y']);
  });

  it('applyPromotion no-ops on an empty target list (no queries fired)', async () => {
    let calls = 0;
    const query = async () => {
      calls++;
      return { rows: [] };
    };
    const repo = new PgLearningsLedgerRepo({ query } as any);
    await repo.applyPromotion([], 'reason');
    expect(calls).toBe(0);
  });

  it('applyPromotion updates atom_versions, media_artifacts, and generated_problems in order', async () => {
    const seen: string[] = [];
    const query = async (sql: string, params: any[]) => {
      seen.push(sql);
      expect(params).toEqual([['atom_x'], 'reason text']);
      return { rows: [] };
    };
    const repo = new PgLearningsLedgerRepo({ query } as any);
    await repo.applyPromotion(['atom_x'], 'reason text');
    expect(seen.length).toBe(3);
    expect(seen[0]).toMatch(/UPDATE atom_versions/);
    expect(seen[0]).toMatch(/canonical = TRUE/);
    expect(seen[1]).toMatch(/UPDATE media_artifacts/);
    expect(seen[1]).toMatch(/status = 'done'/);
    expect(seen[2]).toMatch(/UPDATE generated_problems/);
    expect(seen[2]).toMatch(/verified = TRUE/);
  });

  it('applyDemotion no-ops on an empty target list', async () => {
    let calls = 0;
    const query = async () => {
      calls++;
      return { rows: [] };
    };
    const repo = new PgLearningsLedgerRepo({ query } as any);
    await repo.applyDemotion([], 'reason');
    expect(calls).toBe(0);
  });

  it('applyDemotion flips media_artifacts to failed and atom_versions to non-canonical', async () => {
    const seen: string[] = [];
    const query = async (sql: string) => {
      seen.push(sql);
      return { rows: [] };
    };
    const repo = new PgLearningsLedgerRepo({ query } as any);
    await repo.applyDemotion(['atom_x'], 'reason text');
    expect(seen.length).toBe(2);
    expect(seen[0]).toMatch(/UPDATE media_artifacts/);
    expect(seen[0]).toMatch(/status = 'failed'/);
    expect(seen[1]).toMatch(/UPDATE atom_versions/);
    expect(seen[1]).toMatch(/canonical = FALSE/);
  });

  it('loadRecentRunConfigs returns [] without querying for an empty id list', async () => {
    let calls = 0;
    const query = async () => {
      calls++;
      return { rows: [] };
    };
    const repo = new PgLearningsLedgerRepo({ query } as any);
    expect(await repo.loadRecentRunConfigs([])).toEqual([]);
    expect(calls).toBe(0);
  });

  it('loadRecentRunConfigs uses DISTINCT ON per experiment_id, most recent first', async () => {
    const query = async (sql: string, params: any[]) => {
      expect(sql).toMatch(/DISTINCT ON \(experiment_id\)/);
      expect(sql).toMatch(/ORDER BY experiment_id, created_at DESC/);
      expect(params).toEqual([['exp_a', 'exp_b']]);
      return { rows: [{ experiment_id: 'exp_a', config: { quota: { count: 5 } } }] };
    };
    const repo = new PgLearningsLedgerRepo({ query } as any);
    expect(await repo.loadRecentRunConfigs(['exp_a', 'exp_b'])).toEqual([
      { experiment_id: 'exp_a', config: { quota: { count: 5 } } },
    ]);
  });

  it('upsertSuggestion stringifies config and issues an ON CONFLICT (id) upsert', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgLearningsLedgerRepo({ query } as any);
    await repo.upsertSuggestion({
      id: 'sugg_1',
      exam_pack_id: 'gate-ma',
      source_experiment_id: 'exp_a',
      hypothesis: 'Ride the winner',
      config: { quota: { count: 10 } },
      reason: 'lift held',
      expected_lift: 0.12,
      expected_n: 60,
    });
    expect(capturedSql).toMatch(/INSERT INTO run_suggestions/);
    expect(capturedSql).toMatch(/ON CONFLICT \(id\) DO UPDATE/);
    expect(capturedParams[4]).toBe(JSON.stringify({ quota: { count: 10 } }));
  });

  it('markLedgerRunRunning inserts with ON CONFLICT DO NOTHING', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [] };
    };
    const repo = new PgLearningsLedgerRepo({ query } as any);
    await repo.markLedgerRunRunning('ledger_1');
    expect(capturedSql).toMatch(/INSERT INTO ledger_runs/);
    expect(capturedSql).toMatch(/ON CONFLICT \(id\) DO NOTHING/);
  });

  it('markLedgerRunComplete coalesces a missing digest to the existing digest_md', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgLearningsLedgerRepo({ query } as any);
    await repo.markLedgerRunComplete({
      id: 'ledger_1',
      experiments_evaluated: 3,
      promotions: 1,
      demotions: 0,
      suggestions: 2,
      pr_url: null,
    });
    expect(capturedSql).toMatch(/UPDATE ledger_runs/);
    expect(capturedSql).toMatch(/COALESCE\(\$7, digest_md\)/);
    expect(capturedParams).toEqual(['ledger_1', 3, 1, 0, 2, null, null]);
  });
});

describe('NullLearningsLedgerRepo', () => {
  it('every method is a safe no-op / empty-result (runLearningsLedger short-circuits before using it in practice)', async () => {
    const repo = new NullLearningsLedgerRepo();
    expect(await repo.fetchAtomTargets()).toEqual([]);
    expect(await repo.loadRecentRunConfigs()).toEqual([]);
    await expect(repo.applyPromotion()).resolves.toBeUndefined();
    await expect(repo.applyDemotion()).resolves.toBeUndefined();
    await expect(repo.upsertSuggestion()).resolves.toBeUndefined();
    await expect(repo.markLedgerRunRunning()).resolves.toBeUndefined();
    await expect(repo.markLedgerRunComplete()).resolves.toBeUndefined();
    expect(await repo.fetchDelayedRetention()).toBeNull();
    expect(await repo.fetchModeSplitAccuracy()).toEqual([]);
    expect(await repo.fetchSpeedAccuracy()).toBeNull();
  });
});

// ============================================================================
// W1.6 — anti-gaming guard data fetchers
// ============================================================================

vi.mock('../../experiments/lift', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../experiments/lift')>();
  return { ...actual, resolveTreatmentSessions: vi.fn() };
});

describe('PgLearningsLedgerRepo — W1.6 guard data fetchers', () => {
  it('fetchDelayedRetention: empty treatment cohort short-circuits to null without querying', async () => {
    const { resolveTreatmentSessions } = await import('../../experiments/lift');
    vi.mocked(resolveTreatmentSessions).mockResolvedValueOnce(new Set());
    const query = vi.fn();
    const repo = new PgLearningsLedgerRepo({ query } as any);
    const result = await repo.fetchDelayedRetention('exp_a', 'gate-ma', '2026-04-25T00:00:00Z', 7);
    expect(result).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it('fetchDelayedRetention: averages per-session deltas across concepts, excludes sessions with no measurable delta', async () => {
    const { resolveTreatmentSessions } = await import('../../experiments/lift');
    vi.mocked(resolveTreatmentSessions).mockResolvedValueOnce(new Set(['s1', 's2']));
    const query = vi.fn().mockResolvedValueOnce({
      rows: [
        { session_id: 's1', concept_id: 'eigenvalues', pre_mastery: 0.4, delayed_mastery: 0.6 },
        { session_id: 's1', concept_id: 'determinants', pre_mastery: 0.5, delayed_mastery: 0.5 },
        { session_id: 's2', concept_id: 'eigenvalues', pre_mastery: 0.3, delayed_mastery: null }, // excluded — no delayed reading
      ],
    });
    const repo = new PgLearningsLedgerRepo({ query } as any);
    const result = await repo.fetchDelayedRetention('exp_a', 'gate-ma', '2026-04-25T00:00:00Z', 7);
    // s1: (0.2 + 0.0) / 2 = 0.1; s2 excluded entirely (no delayed_mastery at all) -> mean over 1 session = 0.1
    expect(result!.n).toBe(1);
    expect(result!.delta).toBeCloseTo(0.1, 10);
  });

  it('fetchDelayedRetention: a query failure degrades to null, never throws', async () => {
    const { resolveTreatmentSessions } = await import('../../experiments/lift');
    vi.mocked(resolveTreatmentSessions).mockResolvedValueOnce(new Set(['s1']));
    const query = vi.fn().mockRejectedValueOnce(new Error('boom'));
    const repo = new PgLearningsLedgerRepo({ query } as any);
    const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(repo.fetchDelayedRetention('exp_a', 'gate-ma', '2026-04-25T00:00:00Z', 7)).resolves.toBeNull();
    consoleErr.mockRestore();
  });

  it('fetchModeSplitAccuracy: bridges session ids to student ids via mastery_snapshots.user_id, then aggregates attempt_facts', async () => {
    const { resolveTreatmentSessions } = await import('../../experiments/lift');
    vi.mocked(resolveTreatmentSessions).mockResolvedValueOnce(new Set(['s1']));
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1' }] }) // treatmentStudentIds
      .mockResolvedValueOnce({
        rows: [
          { question_kind: 'mcq', n_pre: '40', correct_pre: '20', n_post: '40', correct_post: '28' },
          { question_kind: 'nat', n_pre: '40', correct_pre: '24', n_post: '40', correct_post: '16' },
        ],
      });
    const repo = new PgLearningsLedgerRepo({ query } as any);
    const result = await repo.fetchModeSplitAccuracy('exp_a', 'gate-ma', '2026-04-25T00:00:00Z', 7);
    expect(result).toEqual([
      { kind: 'mcq', accuracyPre: 0.5, nPre: 40, accuracyPost: 0.7, nPost: 40 },
      { kind: 'nat', accuracyPre: 0.6, nPre: 40, accuracyPost: 0.4, nPost: 40 },
    ]);
    expect(query.mock.calls[1][0]).toMatch(/FROM attempt_facts/);
    expect(query.mock.calls[1][0]).toMatch(/GROUP BY question_kind/);
    expect(query.mock.calls[1][1]).toEqual([['u1'], 'gate-ma', '2026-04-25T00:00:00Z', '7']);
  });

  it('fetchModeSplitAccuracy: no bridged student ids -> empty array without querying attempt_facts', async () => {
    const { resolveTreatmentSessions } = await import('../../experiments/lift');
    vi.mocked(resolveTreatmentSessions).mockResolvedValueOnce(new Set(['s1']));
    const query = vi.fn().mockResolvedValueOnce({ rows: [] }); // no user_id mirrors
    const repo = new PgLearningsLedgerRepo({ query } as any);
    const result = await repo.fetchModeSplitAccuracy('exp_a', 'gate-ma', '2026-04-25T00:00:00Z', 7);
    expect(result).toEqual([]);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('fetchSpeedAccuracy: computes the attempt-weighted mean latency-bucket index pre/post', async () => {
    const { resolveTreatmentSessions } = await import('../../experiments/lift');
    vi.mocked(resolveTreatmentSessions).mockResolvedValueOnce(new Set(['s1']));
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1' }] })
      .mockResolvedValueOnce({
        rows: [
          { is_pre: true, latency_bucket: '30-90s', n: '20', correct: '10' },  // index 2
          { is_pre: false, latency_bucket: 'lt10s', n: '20', correct: '5' },   // index 0
        ],
      });
    const repo = new PgLearningsLedgerRepo({ query } as any);
    const result = await repo.fetchSpeedAccuracy('exp_a', 'gate-ma', '2026-04-25T00:00:00Z', 7);
    expect(result).toEqual({
      meanBucketIndexPre: 2, meanBucketIndexPost: 0,
      accuracyPre: 0.5, accuracyPost: 0.25,
      n: 20,
    });
  });

  it('fetchSpeedAccuracy: no post-window data at all degrades to null', async () => {
    const { resolveTreatmentSessions } = await import('../../experiments/lift');
    vi.mocked(resolveTreatmentSessions).mockResolvedValueOnce(new Set(['s1']));
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [] });
    const repo = new PgLearningsLedgerRepo({ query } as any);
    const result = await repo.fetchSpeedAccuracy('exp_a', 'gate-ma', '2026-04-25T00:00:00Z', 7);
    expect(result).toBeNull();
  });
});
