/**
 * src/api/source-freshness-routes.ts
 *
 * docs/designs/2026-09-02-content-strategy-research-integration-plan.md (P3).
 * Admin-only, read-mostly — mirrors the `?refresh=1` bypass convention from
 * GET /api/admin/journey/progress (Admin Journey UX, PR #58).
 *
 *   GET /api/admin/source-freshness            -> last known state, no fetch
 *   GET /api/admin/source-freshness?refresh=1  -> runs a live check first
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { checkSourceFreshness, getSourceFreshnessState } from '../jobs/source-freshness-monitor';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

async function handleGetSourceFreshness(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'admin');
  if (!user) return;

  const refresh = req.query.get('refresh') === '1';
  const records = refresh ? await checkSourceFreshness() : getSourceFreshnessState();

  sendJSON(res, {
    records,
    any_changed: records.some((r) => r.last_status === 'changed'),
    any_unreachable: records.some((r) => r.last_status === 'fetch_failed'),
  });
}

export const sourceFreshnessRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/source-freshness', handler: handleGetSourceFreshness },
];
