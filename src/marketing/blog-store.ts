// @ts-nocheck
/**
 * Blog Store — article persistence + lifecycle state machine.
 *
 * State machine:
 *
 *   draft → in_review → approved → published
 *     ↑         |                      |
 *     └─ (reject)                      ↓
 *                                    stale ← (app feature changed)
 *                                      ↓
 *                                  in_review (re-review)
 *
 *   Any state → archived (terminal; preserved for lineage)
 *
 * Every transition appends to review_history. Content mutations bump
 * the version and append to lineage. Content-hash is recomputed after
 * any body change; identical-hash updates are idempotent no-ops.
 */

import crypto from 'crypto';
import { createFlatFileStore } from '../lib/flat-file-store';
import type {
  Article, ArticleStatus, ArticleCategory, ArticleMarketingMeta,
  ArticleReviewEntry, ArticleLineageEntry,
} from './types';

// ============================================================================

interface StoreShape {
  articles: Article[];
}

const STORE_PATH = '.data/marketing-articles.json';
const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ articles: [] }),
});

// ============================================================================
// Helpers
// ============================================================================

function shortId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

function normalizeBody(body: string): string {
  // Normalize whitespace + trim for hash stability. Two articles that
  // differ only in trailing whitespace should share a hash.
  return body.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
}

export function computeContentHash(body: string): string {
  const normalized = normalizeBody(body);
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

function bumpVersion(current: string, level: 'patch' | 'minor' | 'major'): string {
  const [maj, min, pat] = current.split('.').map(n => parseInt(n, 10));
  if (level === 'major') return `${maj + 1}.0.0`;
  if (level === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

// ============================================================================
// Create / read / update
// ============================================================================

export interface CreateArticleInput {
  slug: string;
  title: string;
  subtitle?: string;
  body_md: string;
  author: string;
  author_bio?: string;
  category: ArticleCategory;
  exam_scope: string[];
  topic_ids: string[];
  referenced_app_features: string[];
  marketing_meta: ArticleMarketingMeta;
}

export function createArticle(input: CreateArticleInput, actor: string): Article {
  const store = _store.read();

  // Slug must be unique across non-archived articles
  if (store.articles.some(a => a.slug === input.slug && a.status !== 'archived')) {
    throw new Error(`slug '${input.slug}' already in use (non-archived article exists)`);
  }

  const now = new Date().toISOString();
  const content_hash = computeContentHash(input.body_md);

  const article: Article = {
    id: shortId('ART'),
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle,
    body_md: input.body_md,
    author: input.author,
    author_bio: input.author_bio,
    category: input.category,
    exam_scope: [...input.exam_scope],
    topic_ids: [...input.topic_ids],
    referenced_app_features: [...input.referenced_app_features],
    status: 'draft',
    content_hash,
    version: '0.1.0',
    lineage: [],
    marketing_meta: { ...input.marketing_meta },
    review_history: [{
      reviewed_at: now,
      reviewer: actor,
      action: 'submitted',
      note: 'Article created as draft',
    }],
    created_at: now,
    updated_at: now,
  };

  store.articles.push(article);
  _store.write(store);
  return article;
}

export function getArticle(id: string): Article | null {
  return _store.read().articles.find(a => a.id === id) ?? null;
}

export function getArticleBySlug(slug: string): Article | null {
  return _store.read().articles.find(a => a.slug === slug && a.status !== 'archived') ?? null;
}

export function listArticles(filter?: {
  status?: ArticleStatus | ArticleStatus[];
  exam_id?: string;
  category?: ArticleCategory;
  topic_id?: string;
  referenced_feature?: string;
}): Article[] {
  let items = _store.read().articles;
  if (filter?.status) {
    const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
    items = items.filter(a => statuses.includes(a.status));
  }
  if (filter?.exam_id) items = items.filter(a => a.exam_scope.includes(filter.exam_id!));
  if (filter?.category) items = items.filter(a => a.category === filter.category);
  if (filter?.topic_id) items = items.filter(a => a.topic_ids.includes(filter.topic_id!));
  if (filter?.referenced_feature) items = items.filter(a => a.referenced_app_features.includes(filter.referenced_feature!));
  return items;
}

export interface UpdateArticleInput {
  title?: string;
  subtitle?: string;
  body_md?: string;
  topic_ids?: string[];
  referenced_app_features?: string[];
  marketing_meta?: Partial<ArticleMarketingMeta>;
}

/**
 * Update article content. Bumps version per change level:
 *   - body changed → patch bump (or minor if status was published)
 *   - topic/exam/feature refs changed → minor bump
 *   - category changed → would be major, but category is immutable here
 *
 * Returns null if article not found; returns existing article
 * unchanged if the update produces the same content_hash (idempotent).
 */
export function updateArticle(
  id: string,
  input: UpdateArticleInput,
  actor: string,
  change_summary: string,
): Article | null {
  const store = _store.read();
  const article = store.articles.find(a => a.id === id);
  if (!article) return null;
  if (article.status === 'archived') return null;

  const newBody = input.body_md ?? article.body_md;
  const newHash = computeContentHash(newBody);

  // Idempotency: if nothing material changed, no-op
  const materialBody = newHash !== article.content_hash;
  const materialMeta =
    (input.title && input.title !== article.title) ||
    (input.subtitle !== undefined && input.subtitle !== article.subtitle) ||
    (input.topic_ids && JSON.stringify(input.topic_ids.slice().sort()) !== JSON.stringify(article.topic_ids.slice().sort())) ||
    (input.referenced_app_features && JSON.stringify(input.referenced_app_features.slice().sort()) !== JSON.stringify(article.referenced_app_features.slice().sort())) ||
    (input.marketing_meta && JSON.stringify(input.marketing_meta) !== JSON.stringify({}));

  if (!materialBody && !materialMeta) {
    return article; // No-op
  }

  // Apply changes
  if (input.title !== undefined) article.title = input.title;
  if (input.subtitle !== undefined) article.subtitle = input.subtitle;
  if (input.body_md !== undefined) article.body_md = input.body_md;
  if (input.topic_ids !== undefined) article.topic_ids = [...input.topic_ids];
  if (input.referenced_app_features !== undefined) article.referenced_app_features = [...input.referenced_app_features];
  if (input.marketing_meta) {
    article.marketing_meta = { ...article.marketing_meta, ...input.marketing_meta };
  }

  // Bump version
  const bumpLevel = materialBody
    ? (article.status === 'published' ? 'minor' : 'patch')
    : 'patch';
  article.version = bumpVersion(article.version, bumpLevel);
  article.content_hash = newHash;

  const now = new Date().toISOString();
  article.updated_at = now;

  // If already published, a content change forces re-review
  if (article.status === 'published' && materialBody) {
    article.status = 'in_review';
    article.review_history.push({
      reviewed_at: now,
      reviewer: actor,
      action: 'submitted',
      note: `Published article edited — re-review required. ${change_summary}`,
    });
  }

  _store.write(store);
  return article;
}

// ============================================================================
// State transitions
// ============================================================================

export function submitForReview(id: string, actor: string, note?: string): Article | null {
  return _transition(id, 'draft', 'in_review', actor, 'submitted', note ?? 'Submitted for admin review');
}

export function approveArticle(id: string, actor: string, note?: string): Article | null {
  return _transition(id, 'in_review', 'approved', actor, 'approved', note);
}

export function rejectArticle(id: string, actor: string, note?: string): Article | null {
  // Reject sends back to draft
  return _transition(id, 'in_review', 'draft', actor, 'rejected', note);
}

export function requestChanges(id: string, actor: string, note: string): Article | null {
  return _transition(id, 'in_review', 'draft', actor, 'changes_requested', note);
}

export function publishArticle(id: string, actor: string, note?: string): Article | null {
  const store = _store.read();
  const article = store.articles.find(a => a.id === id);
  if (!article) return null;
  if (article.status !== 'approved') {
    throw new Error(`Cannot publish: article ${id} status is '${article.status}', must be 'approved'`);
  }

  const now = new Date().toISOString();
  article.status = 'published';
  article.published_at = now;
  article.updated_at = now;
  article.review_history.push({
    reviewed_at: now,
    reviewer: actor,
    action: 'approved',
    note: note ?? `Published as v${article.version}`,
  });

  // Append to lineage
  article.lineage.push({
    version: article.version,
    content_hash: article.content_hash,
    published_at: now,
    changed_by: actor,
    change_summary: note ?? `Published v${article.version}`,
  });

  _store.write(store);
  return article;
}

export function markStale(id: string, actor: string, reason: string): Article | null {
  const store = _store.read();
  const article = store.articles.find(a => a.id === id);
  if (!article) return null;
  if (article.status !== 'published') {
    // Only published articles can go stale; drafts / in-review are already unpublished
    return article;
  }

  const now = new Date().toISOString();
  article.status = 'stale';
  article.updated_at = now;
  article.review_history.push({
    reviewed_at: now,
    reviewer: actor,
    action: 'marked_stale',
    note: reason,
  });

  _store.write(store);
  return article;
}

export function archiveArticle(id: string, actor: string, note?: string): Article | null {
  const store = _store.read();
  const article = store.articles.find(a => a.id === id);
  if (!article) return null;

  const now = new Date().toISOString();
  article.status = 'archived';
  article.updated_at = now;
  article.archived_at = now;
  article.review_history.push({
    reviewed_at: now,
    reviewer: actor,
    action: 'rejected',
    note: note ?? 'Archived',
  });

  _store.write(store);
  return article;
}

// ============================================================================
// Block-check — admin-side bulk approval / rejection
// ============================================================================

export interface BlockCheckInput {
  article_ids: string[];
  action: 'approve_all' | 'reject_all' | 'mark_all_stale';
  actor: string;
  note?: string;
}

export interface BlockCheckResult {
  processed: number;
  succeeded: number;
  failed: Array<{ article_id: string; reason: string }>;
}

export function blockCheckArticles(input: BlockCheckInput): BlockCheckResult {
  const result: BlockCheckResult = { processed: input.article_ids.length, succeeded: 0, failed: [] };
  for (const id of input.article_ids) {
    try {
      let res: Article | null = null;
      if (input.action === 'approve_all') res = approveArticle(id, input.actor, input.note);
      else if (input.action === 'reject_all') res = rejectArticle(id, input.actor, input.note ?? 'block reject');
      else if (input.action === 'mark_all_stale') res = markStale(id, input.actor, input.note ?? 'block mark stale');
      if (res) result.succeeded++;
      else result.failed.push({ article_id: id, reason: 'article not found or wrong state' });
    } catch (err: any) {
      result.failed.push({ article_id: id, reason: err.message ?? String(err) });
    }
  }
  return result;
}

// ============================================================================
// Private transition helper
// ============================================================================

function _transition(
  id: string,
  expectedFrom: ArticleStatus,
  to: ArticleStatus,
  actor: string,
  action: ArticleReviewEntry['action'],
  note?: string,
): Article | null {
  const store = _store.read();
  const article = store.articles.find(a => a.id === id);
  if (!article) return null;
  if (article.status !== expectedFrom) {
    throw new Error(`Cannot transition ${article.id}: expected '${expectedFrom}' but status is '${article.status}'`);
  }

  const now = new Date().toISOString();
  article.status = to;
  article.updated_at = now;
  article.review_history.push({
    reviewed_at: now,
    reviewer: actor,
    action,
    note,
  });

  _store.write(store);
  return article;
}
