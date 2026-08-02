/**
 * Tests for FeedbackScorerRepo (CEO plan Phase 0 §5.1). Pg implementation
 * against a mocked pg.Pool.
 */

import { describe, it, expect } from 'vitest';
import { PgFeedbackScorerRepo, NullFeedbackScorerRepo } from '../repositories/feedback-scorer-repo';

describe('PgFeedbackScorerRepo', () => {
  it('getPublishedPosts selects published blog posts', async () => {
    let capturedSql = '';
    const rows = [
      { id: '1', slug: 'a', topic: 'linear-algebra', views: 100, published_at: '2026-01-01T00:00:00.000Z' },
    ];
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows };
    };
    const repo = new PgFeedbackScorerRepo({ query } as any);
    const result = await repo.getPublishedPosts();
    expect(capturedSql).toMatch(/FROM blog_posts/);
    expect(capturedSql).toMatch(/WHERE status = 'published'/);
    expect(result).toEqual(rows);
  });

  it('getSignupConversions groups funnel events by blog slug and parses signups to int', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [{ slug: 'a', signups: '3' }, { slug: 'b', signups: '10' }] };
    };
    const repo = new PgFeedbackScorerRepo({ query } as any);
    const result = await repo.getSignupConversions();
    expect(capturedSql).toMatch(/FROM funnel_events/);
    expect(capturedSql).toMatch(/signup_complete/);
    expect(result).toEqual([
      { slug: 'a', signups: 3 },
      { slug: 'b', signups: 10 },
    ]);
  });

  it('getTrendingTopics returns distinct topic_match values from the last 7 days', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [{ topic_match: 'linear-algebra' }, { topic_match: 'calculus' }] };
    };
    const repo = new PgFeedbackScorerRepo({ query } as any);
    const result = await repo.getTrendingTopics();
    expect(capturedSql).toMatch(/FROM trend_signals/);
    expect(capturedSql).toMatch(/INTERVAL '7 days'/);
    expect(result).toEqual(['linear-algebra', 'calculus']);
  });

  it('updatePostScore issues an UPDATE with content_score and last_scored_at', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgFeedbackScorerRepo({ query } as any);
    await repo.updatePostScore('post-1', 0.75);
    expect(capturedSql).toMatch(/UPDATE blog_posts SET content_score = \$1, last_scored_at = NOW\(\) WHERE id = \$2/);
    expect(capturedParams).toEqual([0.75, 'post-1']);
  });

  it('archiveStalePosts returns rowCount of archived posts', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [{ id: '1' }, { id: '2' }], rowCount: 2 };
    };
    const repo = new PgFeedbackScorerRepo({ query } as any);
    const result = await repo.archiveStalePosts();
    expect(capturedSql).toMatch(/UPDATE blog_posts/);
    expect(capturedSql).toMatch(/status = 'archived'/);
    expect(capturedSql).toMatch(/content_score < 0\.1/);
    expect(capturedSql).toMatch(/INTERVAL '90 days'/);
    expect(result).toBe(2);
  });

  it('archiveStalePosts falls back to 0 when rowCount is null', async () => {
    const query = async () => ({ rows: [], rowCount: null });
    const repo = new PgFeedbackScorerRepo({ query } as any);
    const result = await repo.archiveStalePosts();
    expect(result).toBe(0);
  });
});

describe('NullFeedbackScorerRepo', () => {
  it('getPublishedPosts returns an empty array', async () => {
    const repo = new NullFeedbackScorerRepo();
    await expect(repo.getPublishedPosts()).resolves.toEqual([]);
  });

  it('getSignupConversions returns an empty array', async () => {
    const repo = new NullFeedbackScorerRepo();
    await expect(repo.getSignupConversions()).resolves.toEqual([]);
  });

  it('getTrendingTopics returns an empty array', async () => {
    const repo = new NullFeedbackScorerRepo();
    await expect(repo.getTrendingTopics()).resolves.toEqual([]);
  });

  it('updatePostScore is a safe no-op', async () => {
    const repo = new NullFeedbackScorerRepo();
    await expect(repo.updatePostScore('post-1', 0.5)).resolves.toBeUndefined();
  });

  it('archiveStalePosts returns 0', async () => {
    const repo = new NullFeedbackScorerRepo();
    await expect(repo.archiveStalePosts()).resolves.toBe(0);
  });
});
