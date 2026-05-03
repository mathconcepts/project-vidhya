/**
 * src/api/admin-blueprints-routes.ts
 *
 * Admin REST surface for content_blueprints.
 *
 *   GET   /api/admin/blueprints                    list
 *   GET   /api/admin/blueprints/:id                read (sets ETag header)
 *   POST  /api/admin/blueprints                    create from template input
 *   PATCH /api/admin/blueprints/:id                edit (requires If-Match ETag)
 *   POST  /api/admin/blueprints/:id/approve        sets approved_at + approved_by
 *
 * Auth: requireRole('admin'). DB-less safe: returns 503 with a clear
 * message rather than crashing.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import {
  insertBlueprint,
  getBlueprint,
  listBlueprints,
  updateBlueprint,
  buildTemplateBlueprint,
  TEMPLATE_VERSION,
  type BlueprintDecisionsV1,
  type CreatedBy,
  type DifficultyLabel,
} from '../blueprints';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

function sendJSON(res: ServerResponse, data: unknown, status = 200, extraHeaders: Record<string, string> = {}): void {
  res.writeHead(status, { 'Content-Type': 'application/json', ...extraHeaders });
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

// ----------------------------------------------------------------------------

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdmin(req, res))) return;
  if (!requireDb(res)) return;
  const exam = req.query.get('exam') ?? undefined;
  const concept = req.query.get('concept') ?? undefined;
  const review = req.query.get('requires_review');
  const limit = Number(req.query.get('limit') ?? '50');
  const blueprints = await listBlueprints({
    exam_pack_id: exam,
    concept_id: concept,
    requires_review: review === null ? undefined : review === 'true',
    limit,
  });
  sendJSON(res, { blueprints });
}

async function handleGet(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdmin(req, res))) return;
  if (!requireDb(res)) return;
  const id = req.params.id;
  if (!id) return sendError(res, 400, 'id required');
  const bp = await getBlueprint(id);
  if (!bp) return sendError(res, 404, 'not found');
  sendJSON(res, { blueprint: bp }, 200, { ETag: `"${bp.updated_at}"` });
}

async function handleCreate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await checkAdmin(req, res);
  if (!auth) return;
  if (!requireDb(res)) return;

  const body = (req.body ?? {}) as Record<string, unknown>;
  // Two paths: caller can supply a fully-formed `decisions` object OR
  // the template inputs (concept_id + exam_pack_id + target_difficulty).
  let decisions: BlueprintDecisionsV1;
  let template_version: string | null = null;
  let created_by: CreatedBy = 'operator';

  if (body.decisions) {
    decisions = body.decisions as BlueprintDecisionsV1;
  } else if (body.concept_id && body.exam_pack_id && body.target_difficulty) {
    decisions = buildTemplateBlueprint({
      concept_id: String(body.concept_id),
      exam_pack_id: String(body.exam_pack_id),
      target_difficulty: body.target_difficulty as DifficultyLabel,
      topic_family: body.topic_family ? String(body.topic_family) : undefined,
      requires_pyq_anchor: body.requires_pyq_anchor === true,
    });
    template_version = TEMPLATE_VERSION;
    created_by = 'template';
  } else {
    return sendError(
      res,
      400,
      'either { decisions } or { concept_id, exam_pack_id, target_difficulty } required',
    );
  }

  try {
    const bp = await insertBlueprint({
      exam_pack_id: decisions.metadata.exam_pack_id,
      concept_id: decisions.metadata.concept_id,
      decisions,
      template_version,
      created_by,
      confidence: typeof body.confidence === 'number' ? body.confidence : undefined,
      requires_review: body.requires_review === true,
    });
    sendJSON(res, { blueprint: bp }, 201);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

async function handlePatch(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await checkAdmin(req, res);
  if (!auth) return;
  if (!requireDb(res)) return;

  const id = req.params.id;
  if (!id) return sendError(res, 400, 'id required');

  const ifMatchHeader = req.headers['if-match'];
  const ifMatch = Array.isArray(ifMatchHeader) ? ifMatchHeader[0] : ifMatchHeader;
  if (!ifMatch) return sendError(res, 428, 'If-Match header required (precondition)');
  const ifMatchValue = String(ifMatch).replace(/^"|"$/g, '');

  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    const result = await updateBlueprint(id, ifMatchValue, {
      decisions: body.decisions as BlueprintDecisionsV1 | undefined,
      requires_review: typeof body.requires_review === 'boolean' ? body.requires_review : undefined,
    });
    if (result === null) return sendError(res, 404, 'not found');
    if ('conflict' in result) {
      sendJSON(res, { error: 'conflict', current: result.conflict }, 409, {
        ETag: `"${result.conflict.updated_at}"`,
      });
      return;
    }
    sendJSON(res, { blueprint: result.ok }, 200, { ETag: `"${result.ok.updated_at}"` });
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

async function handleApprove(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await checkAdmin(req, res);
  if (!auth) return;
  if (!requireDb(res)) return;
  const id = req.params.id;
  if (!id) return sendError(res, 400, 'id required');
  const ifMatchHeader = req.headers['if-match'];
  const ifMatch = String(Array.isArray(ifMatchHeader) ? ifMatchHeader[0] : ifMatchHeader ?? '').replace(/^"|"$/g, '');
  if (!ifMatch) return sendError(res, 428, 'If-Match header required');
  const result = await updateBlueprint(id, ifMatch, { approved_by: (auth as any).id ?? 'admin' });
  if (result === null) return sendError(res, 404, 'not found');
  if ('conflict' in result) {
    return sendJSON(res, { error: 'conflict', current: result.conflict }, 409);
  }
  sendJSON(res, { blueprint: result.ok }, 200, { ETag: `"${result.ok.updated_at}"` });
}

export const adminBlueprintsRoutes: RouteDefinition[] = [
  { method: 'GET',   path: '/api/admin/blueprints',                handler: handleList },
  { method: 'GET',   path: '/api/admin/blueprints/:id',            handler: handleGet },
  { method: 'POST',  path: '/api/admin/blueprints',                handler: handleCreate },
  { method: 'PATCH', path: '/api/admin/blueprints/:id',            handler: handlePatch },
  { method: 'POST',  path: '/api/admin/blueprints/:id/approve',    handler: handleApprove },
];
