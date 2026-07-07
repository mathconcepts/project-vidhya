/**
 * src/api/fsrs-shadow-routes.ts — Wave 12: the A7 §4 exit-criterion
 * readout. Admin-only, read-only.
 *
 *   GET /api/admin/fsrs-shadow →
 *     { events, median_abs_delta_days, p90_abs_delta_days, by_site,
 *       exit_criterion_met }   // median <= 1 day over >= 200 events
 *
 * When exit_criterion_met flips true, A7 §4 step 2 (the actual swap)
 * is unblocked.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { shadowSummary } from '../gbrain/fsrs-shadow';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

async function handleShadowSummary(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'admin');
  if (!user) return;
  sendJSON(res, await shadowSummary());
}

export const fsrsShadowRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/fsrs-shadow', handler: handleShadowSummary },
];
