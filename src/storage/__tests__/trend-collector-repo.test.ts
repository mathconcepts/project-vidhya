/**
 * Tests for TrendCollectorRepo (CEO plan Phase 0 §5.1). Pg implementation
 * against a mocked pg.Pool.
 */

import { describe, it, expect } from 'vitest';
import { PgTrendCollectorRepo, NullTrendCollectorRepo } from '../repositories/trend-collector-repo';

describe('PgTrendCollectorRepo', () => {
  it('deleteExpiredSignals issues the expiry DELETE', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [] };
    };
    const repo = new PgTrendCollectorRepo({ query } as any);
    await repo.deleteExpiredSignals();
    expect(capturedSql).toMatch(/DELETE FROM trend_signals WHERE expires_at < NOW\(\)/);
  });

  it('insertSignal stringifies raw_data and passes all 7 columns positionally', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgTrendCollectorRepo({ query } as any);
    await repo.insertSignal({
      source: 'reddit',
      topic_match: 'linear-algebra',
      title: 'Help with eigenvalues',
      url: 'https://reddit.com/x',
      score: 42,
      raw_data: { subreddit: 'GATE' },
      expires_at: '2026-09-01T00:00:00.000Z',
    });
    expect(capturedSql).toMatch(/INSERT INTO trend_signals/);
    expect(capturedParams).toEqual([
      'reddit', 'linear-algebra', 'Help with eigenvalues', 'https://reddit.com/x', 42,
      JSON.stringify({ subreddit: 'GATE' }), '2026-09-01T00:00:00.000Z',
    ]);
  });
});

describe('NullTrendCollectorRepo', () => {
  it('deleteExpiredSignals is a safe no-op', async () => {
    const repo = new NullTrendCollectorRepo();
    await expect(repo.deleteExpiredSignals()).resolves.toBeUndefined();
  });

  it('insertSignal throws the same DATABASE_URL-not-configured message the old getPool() threw', async () => {
    const repo = new NullTrendCollectorRepo();
    await expect(repo.insertSignal()).rejects.toThrow('[trend-collector] DATABASE_URL not configured');
  });
});
