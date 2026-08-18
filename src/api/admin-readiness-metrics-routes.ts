/**
 * src/api/admin-readiness-metrics-routes.ts — T15: observability for the
 * readiness engine (§8 of docs/designs/linear-algebra-realtime-and-math-academy-plan.md).
 *
 *   GET /api/admin/readiness-metrics →
 *     {
 *       since, arm_selections, next_action_with_object_id,
 *       next_action_without_object_id, next_action_object_id_rate,
 *       redirect_fired, diagnose_fallback,
 *       atom_fallback_counts,
 *     }
 *
 * Counters are process-local (src/readiness/metrics.ts) and reset on
 * every restart/deploy — `since` names exactly when the current window
 * started so an operator never mistakes "3 hours of traffic" for
 * "3 months". Admin-only, read-only. Also folds in the previously-dangling
 * `getAtomFallbackCounts()` (src/api/lesson-routes.ts, exported since
 * that module shipped but never consumed anywhere) so both readouts live
 * on one surface, same spirit as `GET /api/admin/fsrs-shadow`.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { readinessMetricsSnapshot } from '../readiness/metrics';
import { getAtomFallbackCounts } from './lesson-routes';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

async function handleReadinessMetrics(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'admin');
  if (!user) return;
  sendJSON(res, {
    ...readinessMetricsSnapshot(),
    atom_fallback_counts: getAtomFallbackCounts(),
  });
}

export const adminReadinessMetricsRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/readiness-metrics', handler: handleReadinessMetrics },
];
