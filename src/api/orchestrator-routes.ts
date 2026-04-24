// @ts-nocheck
/**
 * src/api/orchestrator-routes.ts
 *
 * Admin introspection for the module+tier+profile orchestrator.
 *
 * All routes are admin+ gated; health is public (no PII).
 *
 * Routes:
 *   GET /api/orchestrator/modules    admin+    list all modules
 *   GET /api/orchestrator/tiers      admin+    list all tiers with status
 *   GET /api/orchestrator/profiles   admin+    list deployment profiles
 *   POST /api/orchestrator/compose   admin+    compose from profile name
 *   GET /api/orchestrator/graph      admin+    DOT dependency graph
 *   GET /api/orchestrator/health     public    per-module health aggregate
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError } from '../lib/route-helpers';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from '../auth/middleware';
import { listModules, listTiers, listProfiles, loadRegistry } from '../orchestrator/registry';
import { composeDeployment, renderDependencyGraph } from '../orchestrator/composer';
import { computeOrgHealth } from '../orchestrator/health';
import { jobStatus } from '../jobs/scheduler';

async function h_modules(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    sendJSON(res, { modules: listModules(), count: listModules().length });
  } catch (e: any) {
    sendError(res, 500, `registry load failed: ${e?.message}`);
  }
}

async function h_tiers(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const tiers = listTiers();
    const by_status: Record<string, number> = {};
    for (const t of tiers) by_status[t.status] = (by_status[t.status] ?? 0) + 1;
    sendJSON(res, { tiers, count: tiers.length, by_status });
  } catch (e: any) {
    sendError(res, 500, `registry load failed: ${e?.message}`);
  }
}

async function h_profiles(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    sendJSON(res, { profiles: listProfiles(), count: listProfiles().length });
  } catch (e: any) {
    sendError(res, 500, `registry load failed: ${e?.message}`);
  }
}

async function h_compose(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body ?? {}) as any;
  const profile_name = body.profile_name ?? 'full';
  try {
    const result = composeDeployment(profile_name);
    sendJSON(res, result);
  } catch (e: any) {
    sendError(res, 500, `compose failed: ${e?.message}`);
  }
}

async function h_graph(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const dot = renderDependencyGraph();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(dot);
  } catch (e: any) {
    sendError(res, 500, `graph failed: ${e?.message}`);
  }
}

async function h_health(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  // Public — no auth required. Does not leak PII.
  try {
    const health = await computeOrgHealth();
    sendJSON(res, health, health.ok ? 200 : 503);
  } catch (e: any) {
    sendError(res, 500, `health check failed: ${e?.message}`);
  }
}

async function h_jobs(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  sendJSON(res, { jobs: jobStatus() });
}

async function h_signals(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const { inspect } = await import('../events/signal-bus');
    sendJSON(res, inspect());
  } catch (e: any) {
    sendError(res, 500, `signal-bus unavailable: ${e?.message}`);
  }
}

export const orchestratorRoutes: Array<{
  method: string;
  path: string;
  handler: RouteHandler;
}> = [
  { method: 'GET',  path: '/api/orchestrator/modules',  handler: h_modules },
  { method: 'GET',  path: '/api/orchestrator/tiers',    handler: h_tiers },
  { method: 'GET',  path: '/api/orchestrator/profiles', handler: h_profiles },
  { method: 'POST', path: '/api/orchestrator/compose',  handler: h_compose },
  { method: 'GET',  path: '/api/orchestrator/graph',    handler: h_graph },
  { method: 'GET',  path: '/api/orchestrator/health',   handler: h_health },
  { method: 'GET',  path: '/api/orchestrator/jobs',     handler: h_jobs },
  { method: 'GET',  path: '/api/orchestrator/signals',  handler: h_signals },
];
