/**
 * src/api/admin-rulesets-routes.ts
 *
 * Admin REST surface for blueprint_rulesets (migration 028).
 *
 *   GET    /api/admin/rulesets[?exam=…]     list
 *   POST   /api/admin/rulesets               create
 *   PATCH  /api/admin/rulesets/:id           toggle enabled
 *   DELETE /api/admin/rulesets/:id           hard-delete
 *
 * Auth: requireRole('admin'). DB-less safe.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { createRuleset, listRulesets, deleteRuleset, setRulesetEnabled } from '../blueprints';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, status: number, message: string): void {
  sendJSON(res, { error: message }, status);
}

async function checkAdmin(req: ParsedRequest, res: ServerResponse): Promise<{ id: string } | null> {
  const u = await requireRole(req, res, 'admin');
  return u as any;
}

function requireDb(res: ServerResponse): boolean {
  if (!process.env.DATABASE_URL) {
    sendError(res, 503, 'DATABASE_URL not configured');
    return false;
  }
  return true;
}

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdmin(req, res))) return;
  if (!requireDb(res)) return;
  const exam = req.query.get('exam') ?? undefined;
  const rulesets = await listRulesets({ exam_pack_id: exam });
  sendJSON(res, { rulesets });
}

async function handleCreate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await checkAdmin(req, res);
  if (!auth) return;
  if (!requireDb(res)) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (!body.exam_pack_id || !body.rule_text) {
    return sendError(res, 400, 'exam_pack_id and rule_text required');
  }
  try {
    const rs = await createRuleset({
      exam_pack_id: String(body.exam_pack_id),
      concept_pattern: body.concept_pattern ? String(body.concept_pattern) : undefined,
      rule_text: String(body.rule_text),
      created_by: (auth as any).id ?? 'admin',
      enabled: body.enabled !== false,
    });
    sendJSON(res, { ruleset: rs }, 201);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

async function handlePatch(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdmin(req, res))) return;
  if (!requireDb(res)) return;
  const id = req.params.id;
  if (!id) return sendError(res, 400, 'id required');
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (typeof body.enabled !== 'boolean') {
    return sendError(res, 400, 'only { enabled: boolean } supported on this endpoint');
  }
  const rs = await setRulesetEnabled(id, body.enabled);
  if (!rs) return sendError(res, 404, 'not found');
  sendJSON(res, { ruleset: rs });
}

async function handleDelete(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdmin(req, res))) return;
  if (!requireDb(res)) return;
  const id = req.params.id;
  if (!id) return sendError(res, 400, 'id required');
  const ok = await deleteRuleset(id);
  if (!ok) return sendError(res, 404, 'not found');
  sendJSON(res, { ok: true });
}

export const adminRulesetsRoutes: RouteDefinition[] = [
  { method: 'GET',    path: '/api/admin/rulesets',     handler: handleList },
  { method: 'POST',   path: '/api/admin/rulesets',     handler: handleCreate },
  { method: 'PATCH',  path: '/api/admin/rulesets/:id', handler: handlePatch },
  { method: 'DELETE', path: '/api/admin/rulesets/:id', handler: handleDelete },
];
