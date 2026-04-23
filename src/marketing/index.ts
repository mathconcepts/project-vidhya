// @ts-nocheck
/**
 * Marketing + Acquisition Module — public surface.
 *
 * Unified content-to-distribution pipeline tied together by the sync bus.
 *
 * Primary flows:
 *
 *   1. AUTHOR FLOW
 *      createArticle → submitForReview → (admin) approveArticle → publishArticle
 *      Publishing triggers syncArticle() which generates social cards
 *      and the layout recomputes on next read.
 *
 *   2. ADMIN BLOCK CHECK
 *      blockCheckArticles({ action: 'approve_all', article_ids, actor })
 *      Bulk-approve or reject articles after a review session.
 *
 *   3. CAMPAIGN FLOW
 *      createCampaign → launchCampaign (auto-generates social cards +
 *      landing variants across platforms) → concludeCampaign
 *
 *   4. SYNC / DRIFT
 *      publishToSyncBus({ kind: 'app_feature_changed', feature_id: ... })
 *      → affected articles auto-marked stale; admin dashboard shows them.
 *
 *   5. DASHBOARD
 *      getDashboardSummary() — single-pane view of article totals,
 *      sync health, asset totals, recent bus events.
 */

export * from './types';
export * from './blog-store';
export * from './layout-engine';
export * from './sync-engine';
export * from './campaign-store';
