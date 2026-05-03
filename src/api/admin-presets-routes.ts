/**
 * src/api/admin-presets-routes.ts
 *
 * Admin REST surface for one-click starter packs.
 *
 *   GET  /api/admin/presets                 list available presets (read-only; no DB needed)
 *   POST /api/admin/presets/:id/install     idempotent install of rulesets + blueprints
 *
 * Auth: requireRole('admin'). The list endpoint works DB-less (presets
 * are TS literals); install requires DATABASE_URL.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { listPresets, installPreset } from '../blueprints';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, status: number, message: string): void {
  sendJSON(res, { error: message }, status);
}

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  // No DB needed — presets are bundled TS literals.
  const presets = listPresets().map((p) => ({
    id: p.id,
    name: p.name,
    exam_pack_id: p.exam_pack_id,
    description: p.description,
    cohort_hint: p.cohort_hint,
    ruleset_count: p.rulesets.length,
    blueprint_count: p.blueprints.length,
  }));
  sendJSON(res, { presets });
}

async function handleInstall(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  if (!process.env.DATABASE_URL) {
    return sendError(res, 503, 'DATABASE_URL not configured');
  }
  const id = req.params.id;
  if (!id) return sendError(res, 400, 'preset id required');
  try {
    const result = await installPreset(id, (auth as any).id ?? 'admin');
    if (!result) return sendError(res, 404, `preset not found: ${id}`);
    sendJSON(res, result, 201);
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

export const adminPresetsRoutes: RouteDefinition[] = [
  { method: 'GET',  path: '/api/admin/presets',              handler: handleList },
  { method: 'POST', path: '/api/admin/presets/:id/install',  handler: handleInstall },
];
