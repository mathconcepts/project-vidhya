// @ts-nocheck
/**
 * Feedback Scorer — Blog Post Performance Scoring
 *
 * Scores every published blog post on 3 metrics:
 *   40% engagement  — views per day since publish
 *   40% conversion  — signups driven / views
 *   20% relevance   — does topic match current trend signals?
 *
 * Auto-actions:
 *   - Top 5 posts → flagged for social promotion
 *   - Posts with score < 0.1 after 90 days → auto-archived
 *
 * Cron endpoint: POST /api/content/score (Bearer CRON_SECRET)
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import {
  getFeedbackScorerRepo,
  PgFeedbackScorerRepo,
  type FeedbackScorerRepo,
} from '../storage/repositories/feedback-scorer-repo';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

interface ScoredPost {
  id: string;
  slug: string;
  topic: string;
  content_score: number;
  engagement: number;
  conversion: number;
  relevance: number;
}

// ============================================================================
// Database
// ============================================================================

// Test-only override — see _setPool() at the bottom of this file.
let _testRepo: FeedbackScorerRepo | null | undefined;

function resolveRepo(): FeedbackScorerRepo | null {
  if (_testRepo !== undefined) return _testRepo;
  return getFeedbackScorerRepo();
}

// ============================================================================
// Scoring
// ============================================================================

function normalizeScore(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, value / max));
}

async function runFeedbackScoring(): Promise<{ scored: number; archived: number; topPosts: string[] }> {
  const repo = resolveRepo();
  if (!repo) throw new Error('[feedback-scorer] DATABASE_URL not configured');

  // Get all published blog posts
  const posts = await repo.getPublishedPosts();

  if (posts.length === 0) {
    console.log('[feedback-scorer] No published posts to score');
    return { scored: 0, archived: 0, topPosts: [] };
  }

  // Get conversion data (funnel events that reference blog slugs)
  const conversions = await repo.getSignupConversions();
  const conversionMap: Record<string, number> = {};
  for (const c of conversions) {
    conversionMap[c.slug] = c.signups;
  }

  // Get trending topics (last 7 days)
  const trendingTopics = await repo.getTrendingTopics();
  const trendingSet = new Set(trendingTopics);

  // Score each post
  const scored: ScoredPost[] = [];
  let maxEngagement = 0;
  let maxConversion = 0;

  // First pass: compute raw values
  const rawScores = posts.map(post => {
    const daysLive = Math.max(1, (Date.now() - new Date(post.published_at).getTime()) / (86400 * 1000));
    const views = post.views || 0;
    const engagement = views / daysLive;
    const signups = conversionMap[post.slug] || 0;
    const conversion = signups / Math.max(views, 1);

    if (engagement > maxEngagement) maxEngagement = engagement;
    if (conversion > maxConversion) maxConversion = conversion;

    return { ...post, engagement, conversion, daysLive };
  });

  // Second pass: normalize and compute composite score
  for (const post of rawScores) {
    const normEngagement = normalizeScore(post.engagement, maxEngagement);
    const normConversion = normalizeScore(post.conversion, maxConversion);
    const relevance = trendingSet.has(post.topic) ? 1 : 0.5;

    const content_score =
      0.4 * normEngagement +
      0.4 * normConversion +
      0.2 * relevance;

    scored.push({
      id: post.id,
      slug: post.slug,
      topic: post.topic,
      content_score,
      engagement: normEngagement,
      conversion: normConversion,
      relevance,
    });
  }

  // Sort by score descending
  scored.sort((a, b) => b.content_score - a.content_score);

  // Update scores in DB
  for (const post of scored) {
    try {
      await repo.updatePostScore(post.id, post.content_score);
    } catch (err) {
      console.warn(`[feedback-scorer] Update failed for ${post.slug}:`, (err as Error).message);
    }
  }

  // Auto-archive low-scoring posts after 90 days
  let archived = 0;
  try {
    archived = await repo.archiveStalePosts();
    if (archived > 0) {
      console.log(`[feedback-scorer] Auto-archived ${archived} low-performing posts`);
    }
  } catch (err) {
    console.warn('[feedback-scorer] Auto-archive failed:', (err as Error).message);
  }

  const topPosts = scored.slice(0, 5).map(p => p.slug);
  console.log(`[feedback-scorer] Scored ${scored.length} posts. Top: ${topPosts.join(', ')}`);

  return { scored: scored.length, archived, topPosts };
}

// ============================================================================
// Route Handler
// ============================================================================

async function handleFeedbackScore(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'CRON_SECRET not configured' }));
    return;
  }

  const authHeader = (req.headers?.['authorization'] || req.headers?.['Authorization']) as string | undefined;
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  try {
    const result = await runFeedbackScoring();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'complete', ...result }));
  } catch (err) {
    console.error('[feedback-scorer] Pipeline error:', (err as Error).message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: (err as Error).message }));
  }
}

// ============================================================================
// Exports
// ============================================================================

/**
 * For testing: inject a mock pg.Pool-shaped object (matches the pre-
 * migration signature — tests build `{ query: mockQuery }`). Wrapped into
 * a real PgFeedbackScorerRepo so the exact same SQL runs against the mock,
 * just via the storage boundary (CEO plan Phase 0 §5.1) instead of a raw
 * pool. Pass `null` to force the DATABASE_URL-not-configured path.
 */
export function _setPool(pool: { query: (...args: any[]) => any } | null): void {
  _testRepo = pool ? new PgFeedbackScorerRepo(pool as any) : null;
}

export { runFeedbackScoring, normalizeScore };

export const feedbackScorerRoutes: RouteDefinition[] = [
  { method: 'POST', path: '/api/content/score', handler: handleFeedbackScore },
];
