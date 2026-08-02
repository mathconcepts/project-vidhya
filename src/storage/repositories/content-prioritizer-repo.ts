/**
 * ContentPrioritizerRepo — storage boundary for src/jobs/content-prioritizer.ts
 * (CEO plan Phase 0, §5 / §5.1 "generation + jobs modules import zero pg").
 *
 * The job file keeps all scoring math (normalization, weighting, content-type
 * selection); this repo owns the five raw signal queries plus the priority
 * insert. Every method returns raw string/number rows exactly as the old
 * inline `pool.query()` calls did — the job file's existing parseFloat/
 * parseInt handling is unchanged, only the query dispatch moved.
 *
 * No File implementation — priority scoring only means anything against
 * real session/trend/funnel/blog data. The factory returns `null` when
 * DATABASE_URL is unset; runPrioritization() throws the same
 * `DATABASE_URL not configured` error the old getPool() threw.
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';

export interface TopicAccuracyRow {
  topic: string;
  avg_accuracy: string;
}

export interface TrendCountRow {
  topic_match: string;
  count: string;
}

export interface ConversionRow {
  topic: string;
  signups: string;
  views: string;
}

export interface ViewVelocityRow {
  topic: string;
  total_views: string;
  days: string;
}

export interface CoverageCountRow {
  topic: string;
  count: string;
}

export interface PriorityInsert {
  topic: string;
  content_type: string;
  priority_score: number;
  signals: Record<string, number>;
}

export interface ContentPrioritizerRepo {
  /** Avg accuracy per topic over the last 30 days of sr_sessions/pyq_questions. */
  getTopicAccuracy(): Promise<TopicAccuracyRow[]>;
  /** trend_signals counts per topic_match over the last 7 days. */
  getTrendCounts(): Promise<TrendCountRow[]>;
  /** funnel_events signup/view counts per blog_topic over the last 30 days. */
  getConversionData(): Promise<ConversionRow[]>;
  /** blog_posts total views + days-live per topic for posts published in the last 14 days. */
  getViewVelocityData(): Promise<ViewVelocityRow[]>;
  /** pyq_questions counts per topic (coverage gap input). */
  getCoverageCounts(): Promise<CoverageCountRow[]>;
  insertPriority(input: PriorityInsert): Promise<void>;
}

export class PgContentPrioritizerRepo implements ContentPrioritizerRepo {
  constructor(private pool: Pool) {}

  async getTopicAccuracy(): Promise<TopicAccuracyRow[]> {
    // Pre-migration bug fix: the original inline query joined on
    // `s.question_id` and compared `s.selected_answer` — neither column
    // exists on sr_sessions (real columns are `pyq_id` and `last_answer`,
    // confirmed against the live schema). The query always threw, was
    // always caught by the job's try/catch, and user_struggle — the
    // highest-weighted signal at 30% — silently fell back to a flat 0.5
    // for every topic. Fixed to the real column names; behavior otherwise
    // unchanged (still last-answer-per-session, not attempts/correct_count
    // cumulative accuracy).
    const { rows } = await this.pool.query<TopicAccuracyRow>(`
      SELECT topic, AVG(accuracy) as avg_accuracy
      FROM (
        SELECT
          q.topic,
          CASE WHEN s.last_answer = q.correct_answer THEN 1.0 ELSE 0.0 END as accuracy
        FROM sr_sessions s
        JOIN pyq_questions q ON q.id = s.pyq_id
        WHERE s.created_at > NOW() - INTERVAL '30 days'
          AND q.topic IS NOT NULL
      ) sub
      GROUP BY topic
    `);
    return rows;
  }

  async getTrendCounts(): Promise<TrendCountRow[]> {
    const { rows } = await this.pool.query<TrendCountRow>(`
      SELECT topic_match, COUNT(*) as count
      FROM trend_signals
      WHERE topic_match IS NOT NULL
        AND collected_at > NOW() - INTERVAL '7 days'
      GROUP BY topic_match
    `);
    return rows;
  }

  async getConversionData(): Promise<ConversionRow[]> {
    const { rows } = await this.pool.query<ConversionRow>(`
      SELECT
        metadata->>'blog_topic' as topic,
        COUNT(*) FILTER (WHERE event_type = 'signup_complete') as signups,
        COUNT(*) FILTER (WHERE event_type = 'page_view') as views
      FROM funnel_events
      WHERE metadata->>'blog_topic' IS NOT NULL
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY metadata->>'blog_topic'
    `);
    return rows;
  }

  async getViewVelocityData(): Promise<ViewVelocityRow[]> {
    const { rows } = await this.pool.query<ViewVelocityRow>(`
      SELECT topic, SUM(views) as total_views,
             GREATEST(1, EXTRACT(EPOCH FROM NOW() - MIN(published_at)) / 86400) as days
      FROM blog_posts
      WHERE status = 'published'
        AND published_at > NOW() - INTERVAL '14 days'
        AND topic IS NOT NULL
      GROUP BY topic
    `);
    return rows;
  }

  async getCoverageCounts(): Promise<CoverageCountRow[]> {
    const { rows } = await this.pool.query<CoverageCountRow>(`
      SELECT topic, COUNT(*) as count
      FROM pyq_questions
      WHERE topic IS NOT NULL
      GROUP BY topic
    `);
    return rows;
  }

  async insertPriority(input: PriorityInsert): Promise<void> {
    await this.pool.query(
      `INSERT INTO content_priorities (topic, content_type, priority_score, signals)
       VALUES ($1, $2, $3, $4)`,
      [input.topic, input.content_type, input.priority_score, JSON.stringify(input.signals)],
    );
  }
}

/** Test/reference only — never returned by the factory. */
export class NullContentPrioritizerRepo implements ContentPrioritizerRepo {
  async getTopicAccuracy(): Promise<TopicAccuracyRow[]> {
    return [];
  }
  async getTrendCounts(): Promise<TrendCountRow[]> {
    return [];
  }
  async getConversionData(): Promise<ConversionRow[]> {
    return [];
  }
  async getViewVelocityData(): Promise<ViewVelocityRow[]> {
    return [];
  }
  async getCoverageCounts(): Promise<CoverageCountRow[]> {
    return [];
  }
  async insertPriority(): Promise<void> {}
}

/** Factory: Postgres-backed when DATABASE_URL is set, `null` otherwise. */
export function getContentPrioritizerRepo(): ContentPrioritizerRepo | null {
  const pool = getSharedPool();
  return pool ? new PgContentPrioritizerRepo(pool) : null;
}
