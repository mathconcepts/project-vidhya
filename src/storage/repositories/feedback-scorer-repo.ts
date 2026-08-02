/**
 * FeedbackScorerRepo — storage boundary for src/jobs/feedback-scorer.ts
 * (CEO plan Phase 0, §5 / §5.1 "generation + jobs modules import zero pg").
 *
 * Same split as the other job repos: the job file keeps the scoring math
 * (engagement/conversion/relevance weighting, normalization, sort); this
 * repo owns the five raw queries against blog_posts, funnel_events, and
 * trend_signals.
 *
 * No File implementation — blog performance scoring only means anything
 * against the real published posts and funnel events. The factory returns
 * `null` when DATABASE_URL is unset; runFeedbackScoring() throws the same
 * `DATABASE_URL not configured` error the old getPool() threw.
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';

export interface PublishedPostRow {
  id: string;
  slug: string;
  topic: string;
  views: number | null;
  published_at: string;
}

export interface ConversionRow {
  slug: string;
  signups: number;
}

export interface FeedbackScorerRepo {
  getPublishedPosts(): Promise<PublishedPostRow[]>;
  /** signup_complete funnel events grouped by their blog_slug metadata field. */
  getSignupConversions(): Promise<ConversionRow[]>;
  /** Distinct trend_signals.topic_match values collected in the last 7 days. */
  getTrendingTopics(): Promise<string[]>;
  updatePostScore(id: string, content_score: number): Promise<void>;
  /** Flips published posts under the staleness threshold to archived; returns the count archived. */
  archiveStalePosts(): Promise<number>;
}

export class PgFeedbackScorerRepo implements FeedbackScorerRepo {
  constructor(private pool: Pool) {}

  async getPublishedPosts(): Promise<PublishedPostRow[]> {
    const { rows } = await this.pool.query<PublishedPostRow>(`
      SELECT id, slug, topic, views, published_at
      FROM blog_posts
      WHERE status = 'published'
    `);
    return rows;
  }

  async getSignupConversions(): Promise<ConversionRow[]> {
    const { rows } = await this.pool.query<{ slug: string; signups: string }>(`
      SELECT metadata->>'blog_slug' as slug, COUNT(*) as signups
      FROM funnel_events
      WHERE event_type = 'signup_complete'
        AND metadata->>'blog_slug' IS NOT NULL
      GROUP BY metadata->>'blog_slug'
    `);
    return rows.map((r) => ({ slug: r.slug, signups: parseInt(r.signups, 10) }));
  }

  async getTrendingTopics(): Promise<string[]> {
    const { rows } = await this.pool.query<{ topic_match: string }>(`
      SELECT DISTINCT topic_match
      FROM trend_signals
      WHERE topic_match IS NOT NULL
        AND collected_at > NOW() - INTERVAL '7 days'
    `);
    return rows.map((r) => r.topic_match);
  }

  async updatePostScore(id: string, content_score: number): Promise<void> {
    await this.pool.query(
      `UPDATE blog_posts SET content_score = $1, last_scored_at = NOW() WHERE id = $2`,
      [content_score, id],
    );
  }

  async archiveStalePosts(): Promise<number> {
    const result = await this.pool.query(`
      UPDATE blog_posts
      SET status = 'archived', updated_at = NOW()
      WHERE status = 'published'
        AND content_score < 0.1
        AND published_at < NOW() - INTERVAL '90 days'
      RETURNING id
    `);
    return result.rowCount || 0;
  }
}

/** Test/reference only — never returned by the factory. */
export class NullFeedbackScorerRepo implements FeedbackScorerRepo {
  async getPublishedPosts(): Promise<PublishedPostRow[]> {
    return [];
  }
  async getSignupConversions(): Promise<ConversionRow[]> {
    return [];
  }
  async getTrendingTopics(): Promise<string[]> {
    return [];
  }
  async updatePostScore(): Promise<void> {}
  async archiveStalePosts(): Promise<number> {
    return 0;
  }
}

/** Factory: Postgres-backed when DATABASE_URL is set, `null` otherwise. */
export function getFeedbackScorerRepo(): FeedbackScorerRepo | null {
  const pool = getSharedPool();
  return pool ? new PgFeedbackScorerRepo(pool) : null;
}
