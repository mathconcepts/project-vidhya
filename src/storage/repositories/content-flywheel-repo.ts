/**
 * ContentFlywheelRepo — storage boundary for src/jobs/content-flywheel.ts
 * (CEO plan Phase 0, §5 / §5.1 "generation + jobs modules import zero pg").
 *
 * Same split as cohort-signals-repo.ts / narration-experiments-repo.ts: the
 * job file keeps orchestration (topic selection weighting, LLM calls,
 * verification, fire-and-forget scheduling); this repo owns the six raw
 * queries against content_priorities, pyq_questions, seo_pages,
 * social_content, trend_signals, and blog_posts.
 *
 * No File implementation. Unlike cohort signals (one small aggregate table)
 * this job spans six real content tables with no meaningful file-backed
 * mirror — the pre-migration DB-less behavior was "the flywheel silently
 * can't publish anything," not "publish to a JSON file," so a Null repo is
 * the honest match (same reasoning as NarrationExperimentsRepo). The
 * factory returns `null` when DATABASE_URL is unset; call sites throw the
 * same `[flywheel] DATABASE_URL not configured` error the old inline
 * getPool() threw, preserving the exact pre-migration control flow (caught
 * by each function's existing try/catch, non-fatal).
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';

export interface TopicPriority {
  topic: string;
  priority_score: number;
}

export interface TopicCount {
  topic: string;
  count: number;
}

export interface PyqQuestionInsert {
  exam_id: string;
  year: number;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  topic: string;
  difficulty: string;
  marks: number;
  negative_marks: number;
  source: string;
  verification_tier: string;
}

export interface SeoPageInsert {
  slug: string;
  title: string;
  html_content: string;
  topic: string;
  pyq_id: string;
  meta_desc: string;
}

export interface TrendSignal {
  title: string;
  source: string;
  score: number;
}

export interface BlogPostInsert {
  slug: string;
  title: string;
  excerpt: string;
  content_type: string;
  sections: unknown[];
  seo_meta: Record<string, unknown>;
  topic: string;
  exam_tags: string[];
  pyq_id: string | null;
}

export interface ContentFlywheelRepo {
  /** Top 5 topics by priority_score from the last 2 days (content-prioritizer's output). Empty when none scored recently. */
  getTopPriorities(): Promise<TopicPriority[]>;
  /** Per-topic question counts across all of pyq_questions — the inverse-count fallback when no priorities exist. */
  getTopicCounts(): Promise<TopicCount[]>;
  /** Inserts a verified problem; returns the new row's id. */
  insertPyqQuestion(input: PyqQuestionInsert): Promise<string>;
  insertSeoPage(input: SeoPageInsert): Promise<void>;
  insertSocialContent(pyq_id: string, platform: string, content: string): Promise<void>;
  /** Top 3 trend signals for a topic from the last 7 days, used to enrich blog prompts. */
  getRecentTrends(topic: string): Promise<TrendSignal[]>;
  insertBlogPost(input: BlogPostInsert): Promise<void>;
}

export class PgContentFlywheelRepo implements ContentFlywheelRepo {
  constructor(private pool: Pool) {}

  async getTopPriorities(): Promise<TopicPriority[]> {
    const { rows } = await this.pool.query(
      `SELECT topic, priority_score FROM content_priorities
       WHERE created_at > NOW() - INTERVAL '2 days'
       ORDER BY priority_score DESC LIMIT 5`,
    );
    return rows.map((r: any) => ({ topic: r.topic, priority_score: parseFloat(r.priority_score) }));
  }

  async getTopicCounts(): Promise<TopicCount[]> {
    const { rows } = await this.pool.query(`
      SELECT topic, COUNT(*) as count
      FROM pyq_questions
      GROUP BY topic
    `);
    return rows.map((r: any) => ({ topic: r.topic, count: parseInt(r.count, 10) }));
  }

  async insertPyqQuestion(input: PyqQuestionInsert): Promise<string> {
    const { rows } = await this.pool.query(
      `INSERT INTO pyq_questions
       (exam_id, year, question_text, options, correct_answer, explanation,
        topic, difficulty, marks, negative_marks, source, generated_at, verification_tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
       RETURNING id`,
      [
        input.exam_id,
        input.year,
        input.question_text,
        JSON.stringify(input.options),
        input.correct_answer,
        input.explanation,
        input.topic,
        input.difficulty,
        input.marks,
        input.negative_marks,
        input.source,
        input.verification_tier,
      ],
    );
    return rows[0].id;
  }

  async insertSeoPage(input: SeoPageInsert): Promise<void> {
    await this.pool.query(
      `INSERT INTO seo_pages (slug, title, html_content, topic, pyq_id, meta_desc)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO NOTHING`,
      [input.slug, input.title, input.html_content, input.topic, input.pyq_id, input.meta_desc],
    );
  }

  async insertSocialContent(pyq_id: string, platform: string, content: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO social_content (pyq_id, platform, content, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT DO NOTHING`,
      [pyq_id, platform, content],
    );
  }

  async getRecentTrends(topic: string): Promise<TrendSignal[]> {
    const { rows } = await this.pool.query(
      `SELECT title, source, score FROM trend_signals
       WHERE topic_match = $1 AND collected_at > NOW() - INTERVAL '7 days'
       ORDER BY score DESC LIMIT 3`,
      [topic],
    );
    return rows;
  }

  async insertBlogPost(input: BlogPostInsert): Promise<void> {
    await this.pool.query(
      `INSERT INTO blog_posts
       (slug, title, excerpt, content_type, sections, seo_meta, topic, exam_tags, pyq_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
       ON CONFLICT (slug) DO NOTHING`,
      [
        input.slug,
        input.title,
        input.excerpt,
        input.content_type,
        JSON.stringify(input.sections),
        JSON.stringify(input.seo_meta),
        input.topic,
        input.exam_tags,
        input.pyq_id,
      ],
    );
  }
}

/** Test/reference only — never returned by the factory (see file header for why DB-less mode returns `null` instead). */
export class NullContentFlywheelRepo implements ContentFlywheelRepo {
  async getTopPriorities(): Promise<TopicPriority[]> {
    return [];
  }
  async getTopicCounts(): Promise<TopicCount[]> {
    return [];
  }
  async insertPyqQuestion(): Promise<string> {
    throw new Error('[flywheel] DATABASE_URL not configured');
  }
  async insertSeoPage(): Promise<void> {}
  async insertSocialContent(): Promise<void> {}
  async getRecentTrends(): Promise<TrendSignal[]> {
    return [];
  }
  async insertBlogPost(): Promise<void> {}
}

/** Factory: Postgres-backed when DATABASE_URL is set, `null` otherwise (matches pre-migration DB-less behavior — see file header). */
export function getContentFlywheelRepo(): ContentFlywheelRepo | null {
  const pool = getSharedPool();
  return pool ? new PgContentFlywheelRepo(pool) : null;
}
