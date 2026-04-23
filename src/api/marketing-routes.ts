// @ts-nocheck
/**
 * Marketing HTTP surface — admin endpoints for articles, campaigns, sync.
 *
 * All endpoints except layout + published article reads require admin role.
 *
 * Articles:
 *   POST   /api/marketing/articles                create draft
 *   GET    /api/marketing/articles                list (filters via query)
 *   GET    /api/marketing/articles/:id            get
 *   GET    /api/marketing/articles/slug/:slug     get by slug
 *   PATCH  /api/marketing/articles/:id            update
 *   POST   /api/marketing/articles/:id/submit     draft → in_review
 *   POST   /api/marketing/articles/:id/approve    in_review → approved
 *   POST   /api/marketing/articles/:id/reject     in_review → draft
 *   POST   /api/marketing/articles/:id/publish    approved → published + sync
 *   POST   /api/marketing/articles/:id/archive    any → archived
 *   POST   /api/marketing/articles/block-check    bulk approve/reject/stale
 *
 * Layout:
 *   GET    /api/marketing/layout                  compute + return current layout
 *
 * Sync:
 *   GET    /api/marketing/sync/records            list sync records
 *   GET    /api/marketing/sync/dashboard          dashboard summary
 *   POST   /api/marketing/sync/bus/publish        publish event to sync bus
 *   POST   /api/marketing/sync/drift-check        manual drift check
 *
 * Campaigns:
 *   POST   /api/marketing/campaigns               create
 *   GET    /api/marketing/campaigns               list
 *   GET    /api/marketing/campaigns/:id           get
 *   POST   /api/marketing/campaigns/:id/launch    launch
 *   POST   /api/marketing/campaigns/:id/conclude  conclude
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAuth, requireRole } from '../auth/middleware';
import {
  createArticle, getArticle, getArticleBySlug, listArticles, updateArticle,
  submitForReview, approveArticle, rejectArticle, publishArticle, archiveArticle,
  blockCheckArticles,
} from '../marketing/blog-store';
import {
  computeLayout,
} from '../marketing/layout-engine';
import {
  syncArticle, getSyncRecord, listSyncRecords, generateSocialCards,
  createLandingVariant, publishToSyncBus, detectDriftFromFeatureChange,
  getDashboardSummary, listSocialCardsForArticle, listLandingVariantsForArticle,
} from '../marketing/sync-engine';
import {
  createCampaign, launchCampaign, concludeCampaign, getCampaign, listCampaigns,
} from '../marketing/campaign-store';

// ============================================================================

async function h_createArticle(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const article = createArticle(req.body as any, auth.user.id);
    sendJSON(res, { article });
  } catch (err: any) { sendError(res, 400, err.message ?? 'Failed to create article'); }
}

async function h_listArticles(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const filter: any = {};
  const status = req.query.get('status');
  if (status) filter.status = status;
  const exam_id = req.query.get('exam_id');
  if (exam_id) filter.exam_id = exam_id;
  const category = req.query.get('category');
  if (category) filter.category = category;
  sendJSON(res, { articles: listArticles(filter) });
}

async function h_getArticle(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const article = getArticle(req.params.id);
  if (!article) return sendError(res, 404, 'Article not found');
  sendJSON(res, { article });
}

async function h_getArticleBySlug(req: ParsedRequest, res: ServerResponse): Promise<void> {
  // Public — slug read is for the blog frontend
  const article = getArticleBySlug(req.params.slug);
  if (!article) return sendError(res, 404, 'Article not found');
  if (article.status !== 'published') return sendError(res, 404, 'Article not available');
  sendJSON(res, { article });
}

async function h_updateArticle(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  const summary = body._change_summary ?? 'edit';
  delete body._change_summary;
  try {
    const article = updateArticle(req.params.id, body, auth.user.id, summary);
    if (!article) return sendError(res, 404, 'Article not found or archived');
    sendJSON(res, { article });
  } catch (err: any) { sendError(res, 400, err.message ?? 'Failed'); }
}

async function h_submit(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  try {
    const article = submitForReview(req.params.id, auth.user.id, (req.body as any)?.note);
    if (!article) return sendError(res, 404, 'Article not found');
    sendJSON(res, { article });
  } catch (err: any) { sendError(res, 400, err.message ?? 'Failed'); }
}

async function h_approve(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const article = approveArticle(req.params.id, auth.user.id, (req.body as any)?.note);
    if (!article) return sendError(res, 404, 'Article not found');
    sendJSON(res, { article });
  } catch (err: any) { sendError(res, 400, err.message ?? 'Failed'); }
}

async function h_reject(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const article = rejectArticle(req.params.id, auth.user.id, (req.body as any)?.note);
    if (!article) return sendError(res, 404, 'Article not found');
    sendJSON(res, { article });
  } catch (err: any) { sendError(res, 400, err.message ?? 'Failed'); }
}

async function h_publish(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const article = publishArticle(req.params.id, auth.user.id, (req.body as any)?.note);
    if (!article) return sendError(res, 404, 'Article not found');

    // Publishing triggers the full sync pipeline
    const syncRecord = syncArticle(article.id);

    // Announce on the sync bus
    publishToSyncBus({ kind: 'article_published', article_id: article.id, version: article.version });

    sendJSON(res, { article, sync_record: syncRecord });
  } catch (err: any) { sendError(res, 400, err.message ?? 'Failed'); }
}

async function h_archive(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const article = archiveArticle(req.params.id, auth.user.id, (req.body as any)?.note);
    if (!article) return sendError(res, 404, 'Article not found');
    publishToSyncBus({ kind: 'article_archived', article_id: article.id });
    sendJSON(res, { article });
  } catch (err: any) { sendError(res, 400, err.message ?? 'Failed'); }
}

async function h_blockCheck(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!Array.isArray(body.article_ids)) return sendError(res, 400, 'article_ids (array) required');
  if (!['approve_all', 'reject_all', 'mark_all_stale'].includes(body.action)) return sendError(res, 400, 'invalid action');
  const result = blockCheckArticles({ ...body, actor: auth.user.id });
  sendJSON(res, { result });
}

// ============================================================================

async function h_getLayout(req: ParsedRequest, res: ServerResponse): Promise<void> {
  // Public — the layout is what the blog frontend renders
  const published = listArticles({ status: 'published' });
  const layout = computeLayout(published);
  sendJSON(res, { layout });
}

// ============================================================================

async function h_listSync(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const drift = req.query.get('drift_status') as any;
  const filter = drift ? { drift_status: drift } : undefined;
  sendJSON(res, { records: listSyncRecords(filter) });
}

async function h_dashboard(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  sendJSON(res, { summary: getDashboardSummary() });
}

async function h_busPublish(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const event = req.body as any;
  if (!event?.kind) return sendError(res, 400, 'event.kind required');
  const result = publishToSyncBus(event);
  sendJSON(res, { result });
}

async function h_driftCheck(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.feature_id) return sendError(res, 400, 'feature_id required');
  const affected = detectDriftFromFeatureChange(body.feature_id, body.change_summary ?? 'manual drift check', auth.user.id);
  sendJSON(res, { affected });
}

// ============================================================================

async function h_createCampaign(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const campaign = createCampaign(req.body as any);
    sendJSON(res, { campaign });
  } catch (err: any) { sendError(res, 400, err.message ?? 'Failed'); }
}

async function h_listCampaigns(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const status = req.query.get('status') as any;
  const objective = req.query.get('objective') as any;
  sendJSON(res, { campaigns: listCampaigns({ status, objective }) });
}

async function h_getCampaign(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const c = getCampaign(req.params.id);
  if (!c) return sendError(res, 404, 'Campaign not found');
  sendJSON(res, { campaign: c });
}

async function h_launchCampaign(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const campaign = launchCampaign(req.params.id);
    sendJSON(res, { campaign });
  } catch (err: any) { sendError(res, 400, err.message ?? 'Failed'); }
}

async function h_concludeCampaign(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const campaign = concludeCampaign(req.params.id);
    sendJSON(res, { campaign });
  } catch (err: any) { sendError(res, 400, err.message ?? 'Failed'); }
}

// ============================================================================

export const marketingRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  // Articles
  { method: 'POST',  path: '/api/marketing/articles',                    handler: h_createArticle },
  { method: 'GET',   path: '/api/marketing/articles',                    handler: h_listArticles },
  { method: 'GET',   path: '/api/marketing/articles/:id',                handler: h_getArticle },
  { method: 'GET',   path: '/api/marketing/articles/slug/:slug',         handler: h_getArticleBySlug },
  { method: 'PATCH', path: '/api/marketing/articles/:id',                handler: h_updateArticle },
  { method: 'POST',  path: '/api/marketing/articles/:id/submit',         handler: h_submit },
  { method: 'POST',  path: '/api/marketing/articles/:id/approve',        handler: h_approve },
  { method: 'POST',  path: '/api/marketing/articles/:id/reject',         handler: h_reject },
  { method: 'POST',  path: '/api/marketing/articles/:id/publish',        handler: h_publish },
  { method: 'POST',  path: '/api/marketing/articles/:id/archive',        handler: h_archive },
  { method: 'POST',  path: '/api/marketing/articles/block-check',        handler: h_blockCheck },

  // Layout
  { method: 'GET',   path: '/api/marketing/layout',                      handler: h_getLayout },

  // Sync
  { method: 'GET',   path: '/api/marketing/sync/records',                handler: h_listSync },
  { method: 'GET',   path: '/api/marketing/sync/dashboard',              handler: h_dashboard },
  { method: 'POST',  path: '/api/marketing/sync/bus/publish',            handler: h_busPublish },
  { method: 'POST',  path: '/api/marketing/sync/drift-check',            handler: h_driftCheck },

  // Campaigns
  { method: 'POST',  path: '/api/marketing/campaigns',                   handler: h_createCampaign },
  { method: 'GET',   path: '/api/marketing/campaigns',                   handler: h_listCampaigns },
  { method: 'GET',   path: '/api/marketing/campaigns/:id',               handler: h_getCampaign },
  { method: 'POST',  path: '/api/marketing/campaigns/:id/launch',        handler: h_launchCampaign },
  { method: 'POST',  path: '/api/marketing/campaigns/:id/conclude',      handler: h_concludeCampaign },
];
