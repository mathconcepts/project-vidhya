/**
 * listVersionsByRunId tests.
 *
 * generation_run_id has been a write-only column on atom_versions since
 * v4.26.0 — appendVersion() stamps it, but nothing read it back until
 * this function (added for the concept-orchestrator → generation_runs
 * migration, 2026-08-06). Covers: DB-less graceful empty result, the
 * query shape, row mapping, and query-failure graceful degradation.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

beforeEach(() => { mockQuery.mockReset(); });

describe('listVersionsByRunId (DB-less)', () => {
  const prev = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (prev) process.env.DATABASE_URL = prev; else delete process.env.DATABASE_URL; });

  it('returns an empty array when DATABASE_URL is unset', async () => {
    vi.resetModules();
    const { listVersionsByRunId } = await import('../atom-versions');
    expect(await listVersionsByRunId('run_1')).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('listVersionsByRunId (with DB)', () => {
  beforeEach(() => { process.env.DATABASE_URL = 'postgres://test'; });
  afterEach(() => { delete process.env.DATABASE_URL; });

  it('queries by generation_run_id and maps rows', async () => {
    vi.resetModules();
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          atom_id: 'derivatives-basic.hook',
          version_n: 1,
          content: 'body',
          generation_meta: JSON.stringify({ llm_judge_score: 8.2, source_cascade: [] }),
          generated_at: '2026-08-06T00:00:00.000Z',
          active: false,
          improvement_reason: null,
        },
      ],
    });
    const { listVersionsByRunId } = await import('../atom-versions');
    const rows = await listVersionsByRunId('run_1');

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/WHERE generation_run_id = \$1/);
    expect(params).toEqual(['run_1']);

    expect(rows).toHaveLength(1);
    expect(rows[0].atom_id).toBe('derivatives-basic.hook');
    // generation_meta is JSON-parsed, same as listVersions()/getActiveVersion().
    expect(rows[0].generation_meta).toEqual({ llm_judge_score: 8.2, source_cascade: [] });
  });

  it('degrades to an empty array when the query fails', async () => {
    vi.resetModules();
    mockQuery.mockRejectedValueOnce(new Error('connection refused'));
    const { listVersionsByRunId } = await import('../atom-versions');
    expect(await listVersionsByRunId('run_1')).toEqual([]);
  });
});
