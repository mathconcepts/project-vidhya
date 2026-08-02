/**
 * Tests for ContentPrioritizerRepo (CEO plan Phase 0 §5.1). Pg implementation
 * against a mocked pg.Pool.
 */

import { describe, it, expect } from 'vitest';
import { PgContentPrioritizerRepo, NullContentPrioritizerRepo } from '../repositories/content-prioritizer-repo';

describe('PgContentPrioritizerRepo', () => {
  it('getTopicAccuracy joins sr_sessions to pyq_questions on pyq_id and compares last_answer', async () => {
    let capturedSql = '';
    const rows = [{ topic: 'calculus', avg_accuracy: '0.75' }];
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows };
    };
    const repo = new PgContentPrioritizerRepo({ query } as any);
    const result = await repo.getTopicAccuracy();
    expect(capturedSql).toMatch(/JOIN pyq_questions q ON q\.id = s\.pyq_id/);
    expect(capturedSql).toMatch(/s\.last_answer = q\.correct_answer/);
    expect(result).toEqual(rows);
  });

  it('getTrendCounts selects trend_signals grouped by topic_match over 7 days', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [{ topic_match: 'calculus', count: '3' }] };
    };
    const repo = new PgContentPrioritizerRepo({ query } as any);
    const result = await repo.getTrendCounts();
    expect(capturedSql).toMatch(/FROM trend_signals/);
    expect(capturedSql).toMatch(/INTERVAL '7 days'/);
    expect(result).toEqual([{ topic_match: 'calculus', count: '3' }]);
  });

  it('getConversionData selects funnel_events filtered signup/view counts by blog_topic', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [{ topic: 'calculus', signups: '2', views: '10' }] };
    };
    const repo = new PgContentPrioritizerRepo({ query } as any);
    const result = await repo.getConversionData();
    expect(capturedSql).toMatch(/FROM funnel_events/);
    expect(capturedSql).toMatch(/blog_topic/);
    expect(result).toEqual([{ topic: 'calculus', signups: '2', views: '10' }]);
  });

  it('getViewVelocityData selects blog_posts total views + days-live for posts published in the last 14 days', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [{ topic: 'calculus', total_views: '500', days: '2' }] };
    };
    const repo = new PgContentPrioritizerRepo({ query } as any);
    const result = await repo.getViewVelocityData();
    expect(capturedSql).toMatch(/FROM blog_posts/);
    expect(capturedSql).toMatch(/INTERVAL '14 days'/);
    expect(result).toEqual([{ topic: 'calculus', total_views: '500', days: '2' }]);
  });

  it('getCoverageCounts selects pyq_questions counts grouped by topic', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [{ topic: 'calculus', count: '12' }] };
    };
    const repo = new PgContentPrioritizerRepo({ query } as any);
    const result = await repo.getCoverageCounts();
    expect(capturedSql).toMatch(/FROM pyq_questions/);
    expect(result).toEqual([{ topic: 'calculus', count: '12' }]);
  });

  it('insertPriority stringifies signals and passes all 4 columns positionally', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgContentPrioritizerRepo({ query } as any);
    await repo.insertPriority({
      topic: 'calculus',
      content_type: 'topic_explainer',
      priority_score: 0.42,
      signals: { user_struggle: 0.5 },
    });
    expect(capturedSql).toMatch(/INSERT INTO content_priorities/);
    expect(capturedParams).toEqual([
      'calculus', 'topic_explainer', 0.42, JSON.stringify({ user_struggle: 0.5 }),
    ]);
  });
});

describe('NullContentPrioritizerRepo', () => {
  it('all getters return empty arrays', async () => {
    const repo = new NullContentPrioritizerRepo();
    await expect(repo.getTopicAccuracy()).resolves.toEqual([]);
    await expect(repo.getTrendCounts()).resolves.toEqual([]);
    await expect(repo.getConversionData()).resolves.toEqual([]);
    await expect(repo.getViewVelocityData()).resolves.toEqual([]);
    await expect(repo.getCoverageCounts()).resolves.toEqual([]);
  });

  it('insertPriority is a safe no-op', async () => {
    const repo = new NullContentPrioritizerRepo();
    await expect(
      repo.insertPriority({ topic: 'calculus', content_type: 'topic_explainer', priority_score: 0.1, signals: {} }),
    ).resolves.toBeUndefined();
  });
});
