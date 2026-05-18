/**
 * Syllabus Bridge API
 *
 * Read endpoints (public):
 *   GET  /api/syllabus-bridge/curricula              — list source curricula
 *   GET  /api/syllabus-bridge/curricula/:id          — curriculum + topics
 *   GET  /api/syllabus-bridge/mappings               — list mappings
 *   GET  /api/syllabus-bridge/mappings/:id           — mapping with entries
 *   GET  /api/syllabus-bridge/mappings/:id/plan      — content plan + cost preview
 *
 * Write endpoints (admin only):
 *   POST /api/syllabus-bridge/batches                — submit a batch
 *   GET  /api/syllabus-bridge/batches                — list all batches
 *   GET  /api/syllabus-bridge/batches/:id            — batch status + results
 *
 * Read content:
 *   GET  /api/syllabus-bridge/content/by-mapping/:id — generated content for a mapping
 *   GET  /api/syllabus-bridge/content/:id            — single content unit
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import {
  listCurricula, getCurriculum,
  listMappings, getMapping,
} from '../syllabus-bridge/registry';
import { buildContentPlan, estimateCostUsd } from '../syllabus-bridge/content-plan';
import {
  saveBatch, getBatch, listBatches,
  listGeneratedContentForMapping, getGeneratedContent,
} from '../syllabus-bridge/store';
import { runBatch } from '../syllabus-bridge/batch-runner';
import { requireAuth, requireRole } from '../auth/middleware';
import type { BatchRequest } from '../syllabus-bridge/types';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

// ----- Curricula -----

async function handleListCurricula(_req: ParsedRequest, res: ServerResponse) {
  const items = listCurricula().map(c => ({
    id: c.id,
    source_name: c.source_name,
    grade: c.grade,
    subject: c.subject,
    display_name: c.display_name,
    knowledge_track_id: c.knowledge_track_id,
    topic_count: c.topics.length,
    concept_count: c.topics.reduce((n, t) => n + t.concepts.length, 0),
    total_hours: c.topics.reduce((n, t) => n + t.estimated_hours, 0),
  }));
  sendJSON(res, { curricula: items });
}

async function handleGetCurriculum(req: ParsedRequest, res: ServerResponse) {
  const { id } = req.params;
  const c = getCurriculum(id);
  if (!c) return sendError(res, 404, `Curriculum '${id}' not found`);
  sendJSON(res, { curriculum: c });
}

// ----- Mappings -----

async function handleListMappings(_req: ParsedRequest, res: ServerResponse) {
  const items = listMappings().map(m => ({
    id: m.id,
    source_curriculum_id: m.source_curriculum_id,
    target_exam_id: m.target_exam_id,
    display_name: m.display_name,
    entry_count: m.entries.length,
    gap_breakdown: {
      aligned:     m.entries.filter(e => e.gap_class === 'aligned').length,
      depth_gap:   m.entries.filter(e => e.gap_class === 'depth-gap').length,
      breadth_gap: m.entries.filter(e => e.gap_class === 'breadth-gap').length,
      foundation:  m.entries.filter(e => e.gap_class === 'foundation').length,
    },
  }));
  sendJSON(res, { mappings: items });
}

async function handleGetMapping(req: ParsedRequest, res: ServerResponse) {
  const { id } = req.params;
  const m = getMapping(id);
  if (!m) return sendError(res, 404, `Mapping '${id}' not found`);
  sendJSON(res, { mapping: m });
}

async function handleGetMappingPlan(req: ParsedRequest, res: ServerResponse) {
  const { id } = req.params;
  const m = getMapping(id);
  if (!m) return sendError(res, 404, `Mapping '${id}' not found`);

  const plan = buildContentPlan(m);
  const cost = estimateCostUsd(plan);

  // Group units by entry for the admin UI
  const groupedByEntry: Record<string, any[]> = {};
  for (const u of plan.units) {
    (groupedByEntry[u.mapping_entry_id] ??= []).push(u);
  }

  sendJSON(res, {
    mapping_id: m.id,
    total_units: plan.units.length,
    total_estimated_tokens: plan.total_estimated_tokens,
    estimated_cost_usd: cost,
    grouped_by_entry: groupedByEntry,
  });
}

// ----- Batches (admin) -----

async function handleCreateBatch(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;

  const body = req.body as any;
  const mapping_id = body?.mapping_id;
  const requested_unit_ids: string[] | undefined = body?.unit_ids;

  if (!mapping_id || typeof mapping_id !== 'string') {
    return sendError(res, 400, 'mapping_id (string) required');
  }
  const m = getMapping(mapping_id);
  if (!m) return sendError(res, 404, `Mapping '${mapping_id}' not found`);

  const plan = buildContentPlan(m);
  // If no specific units requested, run the full plan
  const unitsToRun = requested_unit_ids?.length
    ? plan.units.filter(u => requested_unit_ids.includes(u.unit_id))
    : plan.units;

  if (unitsToRun.length === 0) {
    return sendError(res, 400, 'No units to run (either plan is empty or unit_ids did not match any unit)');
  }

  const batch: BatchRequest = {
    batch_id: `BATCH-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    mapping_id,
    unit_ids: unitsToRun.map(u => u.unit_id),
    submitted_by: auth.user.id,
    submitted_at: new Date().toISOString(),
    status: 'queued',
    results: unitsToRun.map(u => ({ unit_id: u.unit_id, status: 'pending' as const })),
    total_units: unitsToRun.length,
    completed_units: 0,
    failed_units: 0,
    total_cost_estimate_usd: 0,
  };
  saveBatch(batch);

  // Fire-and-forget: run the batch in the background. We don't await it
  // so the HTTP call returns immediately and the UI can poll for progress.
  setImmediate(() => {
    runBatch(batch, plan.units).catch(err => {
      batch.status = 'failed';
      batch.error = err?.message ?? String(err);
      batch.completed_at = new Date().toISOString();
      saveBatch(batch);
    });
  });

  sendJSON(res, { batch }, 201);
}

async function handleListBatches(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  sendJSON(res, { batches: listBatches() });
}

async function handleGetBatch(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { id } = req.params;
  const b = getBatch(id);
  if (!b) return sendError(res, 404, `Batch '${id}' not found`);
  sendJSON(res, { batch: b });
}

// ----- Content -----

async function handleListContentForMapping(req: ParsedRequest, res: ServerResponse) {
  const { id } = req.params;
  const m = getMapping(id);
  if (!m) return sendError(res, 404, `Mapping '${id}' not found`);
  const items = listGeneratedContentForMapping(id);
  sendJSON(res, { mapping_id: id, content: items });
}

async function handleGetContent(req: ParsedRequest, res: ServerResponse) {
  const { id } = req.params;
  const c = getGeneratedContent(id);
  if (!c) return sendError(res, 404, `Content '${id}' not found`);
  sendJSON(res, { content: c });
}

export const syllabusBridgeRoutes: RouteDefinition[] = [
  { method: 'GET',  path: '/api/syllabus-bridge/curricula',                handler: handleListCurricula },
  { method: 'GET',  path: '/api/syllabus-bridge/curricula/:id',            handler: handleGetCurriculum },
  { method: 'GET',  path: '/api/syllabus-bridge/mappings',                 handler: handleListMappings },
  { method: 'GET',  path: '/api/syllabus-bridge/mappings/:id',             handler: handleGetMapping },
  { method: 'GET',  path: '/api/syllabus-bridge/mappings/:id/plan',        handler: handleGetMappingPlan },
  { method: 'POST', path: '/api/syllabus-bridge/batches',                  handler: handleCreateBatch },
  { method: 'GET',  path: '/api/syllabus-bridge/batches',                  handler: handleListBatches },
  { method: 'GET',  path: '/api/syllabus-bridge/batches/:id',              handler: handleGetBatch },
  { method: 'GET',  path: '/api/syllabus-bridge/content/by-mapping/:id',   handler: handleListContentForMapping },
  { method: 'GET',  path: '/api/syllabus-bridge/content/:id',              handler: handleGetContent },
];
