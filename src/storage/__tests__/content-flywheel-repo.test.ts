/**
 * Tests for ContentFlywheelRepo (CEO plan Phase 0 §5.1) — the Pg
 * implementation against a mocked pg.Pool, matching the established
 * cohort-signals-repo.test.ts / narration-experiments-repo pattern. This
 * repo has no File implementation (see the repo file's header for why), so
 * NullContentFlywheelRepo is covered by the same graceful-degrade
 * contract as its Pg sibling.
 */

import { describe, it, expect } from 'vitest';
import { PgContentFlywheelRepo, NullContentFlywheelRepo } from '../repositories/content-flywheel-repo';

describe('PgContentFlywheelRepo', () => {
  it('getTopPriorities queries the 2-day window and parses priority_score to a number', async () => {
    const query = async (sql: string) => {
      expect(sql).toMatch(/FROM content_priorities/);
      expect(sql).toMatch(/INTERVAL '2 days'/);
      expect(sql).toMatch(/ORDER BY priority_score DESC LIMIT 5/);
      return { rows: [{ topic: 'linear-algebra', priority_score: '0.842' }] };
    };
    const repo = new PgContentFlywheelRepo({ query } as any);
    expect(await repo.getTopPriorities()).toEqual([{ topic: 'linear-algebra', priority_score: 0.842 }]);
  });

  it('getTopicCounts groups pyq_questions by topic and parses count to an int', async () => {
    const query = async (sql: string) => {
      expect(sql).toMatch(/FROM pyq_questions/);
      expect(sql).toMatch(/GROUP BY topic/);
      return { rows: [{ topic: 'calculus', count: '12' }] };
    };
    const repo = new PgContentFlywheelRepo({ query } as any);
    expect(await repo.getTopicCounts()).toEqual([{ topic: 'calculus', count: 12 }]);
  });

  it('insertPyqQuestion inserts with the exact 12-column shape and returns the new id', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [{ id: 'pyq-123' }] };
    };
    const repo = new PgContentFlywheelRepo({ query } as any);
    const id = await repo.insertPyqQuestion({
      exam_id: 'gate-engineering-maths',
      year: 2026,
      question_text: 'What is 2+2?',
      options: { A: '3', B: '4', C: '5', D: '6' },
      correct_answer: 'B',
      explanation: 'Basic arithmetic.',
      topic: 'linear-algebra',
      difficulty: 'easy',
      marks: 2,
      negative_marks: -0.67,
      source: 'generated',
      verification_tier: 'rag',
    });
    expect(id).toBe('pyq-123');
    expect(capturedSql).toMatch(/INSERT INTO pyq_questions/);
    expect(capturedSql).toMatch(/RETURNING id/);
    expect(capturedParams).toEqual([
      'gate-engineering-maths', 2026, 'What is 2+2?', JSON.stringify({ A: '3', B: '4', C: '5', D: '6' }),
      'B', 'Basic arithmetic.', 'linear-algebra', 'easy', 2, -0.67, 'generated', 'rag',
    ]);
  });

  it('insertSeoPage issues an ON CONFLICT (slug) DO NOTHING upsert', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [] };
    };
    const repo = new PgContentFlywheelRepo({ query } as any);
    await repo.insertSeoPage({
      slug: 'gate-linear-algebra-abc12345',
      title: 'GATE Linear Algebra Practice Problem',
      html_content: '<article></article>',
      topic: 'linear-algebra',
      pyq_id: 'pyq-123',
      meta_desc: 'Practice.',
    });
    expect(capturedSql).toMatch(/INSERT INTO seo_pages/);
    expect(capturedSql).toMatch(/ON CONFLICT \(slug\) DO NOTHING/);
  });

  it('insertSocialContent issues a plain ON CONFLICT DO NOTHING with status=pending', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgContentFlywheelRepo({ query } as any);
    await repo.insertSocialContent('pyq-123', 'twitter', 'Check this out!');
    expect(capturedSql).toMatch(/INSERT INTO social_content/);
    expect(capturedSql).toMatch(/'pending'/);
    expect(capturedParams).toEqual(['pyq-123', 'twitter', 'Check this out!']);
  });

  it('getRecentTrends queries the 7-day window scoped to topic_match', async () => {
    const query = async (sql: string, params: any[]) => {
      expect(sql).toMatch(/FROM trend_signals/);
      expect(sql).toMatch(/INTERVAL '7 days'/);
      expect(params).toEqual(['linear-algebra']);
      return { rows: [{ title: 'GATE 2027 syllabus', source: 'reddit', score: 0.9 }] };
    };
    const repo = new PgContentFlywheelRepo({ query } as any);
    expect(await repo.getRecentTrends('linear-algebra')).toEqual([
      { title: 'GATE 2027 syllabus', source: 'reddit', score: 0.9 },
    ]);
  });

  it('insertBlogPost stringifies sections and seo_meta, issues ON CONFLICT (slug) DO NOTHING', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgContentFlywheelRepo({ query } as any);
    await repo.insertBlogPost({
      slug: 'gate-linear-algebra-solved-abc12345',
      title: 'Solved: Linear Algebra',
      excerpt: 'A worked example.',
      content_type: 'solved_problem',
      sections: [{ type: 'heading', level: 1, content: 'Intro' }],
      seo_meta: { title: 'Solved: Linear Algebra', description: 'A worked example.', keywords: ['gate'] },
      topic: 'linear-algebra',
      exam_tags: ['GATE'],
      pyq_id: 'pyq-123',
    });
    expect(capturedSql).toMatch(/INSERT INTO blog_posts/);
    expect(capturedSql).toMatch(/ON CONFLICT \(slug\) DO NOTHING/);
    expect(capturedParams[4]).toBe(JSON.stringify([{ type: 'heading', level: 1, content: 'Intro' }]));
    expect(capturedParams[5]).toBe(JSON.stringify({ title: 'Solved: Linear Algebra', description: 'A worked example.', keywords: ['gate'] }));
  });
});

describe('NullContentFlywheelRepo', () => {
  it('read methods return empty arrays (matches pre-migration "nothing to select" degrade)', async () => {
    const repo = new NullContentFlywheelRepo();
    expect(await repo.getTopPriorities()).toEqual([]);
    expect(await repo.getTopicCounts()).toEqual([]);
    expect(await repo.getRecentTrends('linear-algebra')).toEqual([]);
  });

  it('insertPyqQuestion throws the same DATABASE_URL-not-configured message the old getPool() threw', async () => {
    const repo = new NullContentFlywheelRepo();
    await expect(repo.insertPyqQuestion()).rejects.toThrow('[flywheel] DATABASE_URL not configured');
  });

  it('non-critical inserts (SEO, social, blog) are silent no-ops, never throw', async () => {
    const repo = new NullContentFlywheelRepo();
    await expect(repo.insertSeoPage()).resolves.toBeUndefined();
    await expect(repo.insertSocialContent()).resolves.toBeUndefined();
    await expect(repo.insertBlogPost()).resolves.toBeUndefined();
  });
});
