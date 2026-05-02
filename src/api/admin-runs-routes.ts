/**
 * src/api/admin-runs-routes.ts
 *
 * Admin REST endpoints for GenerationRuns. Operator launches a run from
 * the UI; the underlying flywheel/orchestrator picks it up.
 *
 *   GET    /api/admin/runs                   → list (filter by exam_pack_id, status)
 *   GET    /api/admin/runs/:id               → single run
 *   POST   /api/admin/runs                   → create (queued status; auto-creates wrapping experiment)
 *   POST   /api/admin/runs/dry-run           → cost estimate, no DB write
 *   PATCH  /api/admin/runs/:id               → abort a queued/running run
 *
 * Note: this Sprint B2 surface CREATES the run row but does NOT yet
 * dispatch the actual generation. The cron-driven flywheel still picks
 * up its default daily run. A future iteration will let admin-launched
 * runs override the flywheel queue.
 *
 * Auth: requireRole('admin') — same gate as admin-experiments-routes.ts.
 * JWT for browsers, CRON_SECRET backdoor for curl/CI.
 */

import { ServerResponse } from 'http';
import {
  createRun,
  getRun,
  listRuns,
  markRunFailed,
} from '../generation/run-orchestrator';
import { estimateRunCost } from '../generation/dry-run';
import type {
  GenerationRunStatus,
  GenerationRunConfig,
} from '../experiments/types';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';

// ============================================================================
// Auth + helpers
// ============================================================================

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function checkAdminAuth(req: ParsedRequest, res: ServerResponse): Promise<boolean> {
  const user = await requireRole(req, res, 'admin');
  return user !== null;
}

function requireDb(res: ServerResponse): boolean {
  if (!process.env.DATABASE_URL) {
    sendJSON(res, { error: 'DATABASE_URL not configured' }, 503);
    return false;
  }
  return true;
}

function badRequest(res: ServerResponse, message: string): void {
  sendJSON(res, { error: 'Bad Request', message }, 400);
}

function isString(x: unknown): x is string {
  return typeof x === 'string' && x.length > 0;
}

/**
 * Validate and normalize the run config. Strict on required fields,
 * permissive on optional ones (preserves forward compatibility with
 * future config keys).
 */
function parseRunConfig(raw: unknown): GenerationRunConfig | string {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return 'config must be an object';
  }
  const c = raw as Record<string, unknown>;

  const target =
    c.target && typeof c.target === 'object' ? (c.target as Record<string, unknown>) : {};
  const pipeline =
    c.pipeline && typeof c.pipeline === 'object'
      ? (c.pipeline as Record<string, unknown>)
      : {};
  const verification = c.verification as Record<string, unknown> | undefined;
  const quota = c.quota as Record<string, unknown> | undefined;

  if (!verification || typeof verification !== 'object') {
    return 'config.verification required';
  }
  const tier = verification.tier_ceiling;
  if (tier !== 'rag' && tier !== 'gemini' && tier !== 'wolfram') {
    return 'config.verification.tier_ceiling must be rag|gemini|wolfram';
  }
  if (!quota || typeof quota !== 'object') {
    return 'config.quota required';
  }
  const count = Number(quota.count);
  const maxCost = Number(quota.max_cost_usd);
  if (!Number.isFinite(count) || count <= 0 || count > 10000) {
    return 'config.quota.count must be 1..10000';
  }
  if (!Number.isFinite(maxCost) || maxCost <= 0 || maxCost > 1000) {
    return 'config.quota.max_cost_usd must be (0, 1000]';
  }

  return {
    target: {
      topic_id: typeof target.topic_id === 'string' ? target.topic_id : undefined,
      concept_ids: Array.isArray(target.concept_ids)
        ? (target.concept_ids as unknown[]).filter(isString)
        : undefined,
      difficulty_dist:
        target.difficulty_dist && typeof target.difficulty_dist === 'object'
          ? (target.difficulty_dist as { easy: number; medium: number; hard: number })
          : undefined,
    },
    pipeline: {
      template_id:
        typeof pipeline.template_id === 'string' ? pipeline.template_id : undefined,
      llm_models: Array.isArray(pipeline.llm_models)
        ? (pipeline.llm_models as unknown[]).filter(isString)
        : undefined,
      pyq_grounding:
        typeof pipeline.pyq_grounding === 'boolean' ? pipeline.pyq_grounding : undefined,
      multi_llm_consensus:
        typeof pipeline.multi_llm_consensus === 'boolean'
          ? pipeline.multi_llm_consensus
          : undefined,
    },
    verification: {
      tier_ceiling: tier,
      gemini_dual_solve:
        typeof verification.gemini_dual_solve === 'boolean'
          ? verification.gemini_dual_solve
          : undefined,
      wolfram_required:
        typeof verification.wolfram_required === 'boolean'
          ? verification.wolfram_required
          : undefined,
    },
    pedagogy:
      c.pedagogy && typeof c.pedagogy === 'object'
        ? {
            reviewer_strictness:
              ((c.pedagogy as Record<string, unknown>).reviewer_strictness ===
                'lenient' ||
                (c.pedagogy as Record<string, unknown>).reviewer_strictness ===
                  'standard' ||
                (c.pedagogy as Record<string, unknown>).reviewer_strictness ===
                  'strict')
                ? ((c.pedagogy as Record<string, unknown>)
                    .reviewer_strictness as 'lenient' | 'standard' | 'strict')
                : undefined,
          }
        : undefined,
    quota: {
      count: Math.floor(count),
      max_cost_usd: maxCost,
      deadline_hours:
        typeof quota.deadline_hours === 'number' ? quota.deadline_hours : undefined,
    },
  };
}

// ============================================================================
// Handlers
// ============================================================================

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const examPackId = req.query.get('exam') ?? undefined;
  const statusParam = req.query.get('status') ?? undefined;
  const limit = Math.min(parseInt(req.query.get('limit') ?? '50', 10) || 50, 200);

  const allowed: GenerationRunStatus[] = [
    'queued',
    'running',
    'complete',
    'aborted',
    'failed',
  ];
  const status =
    statusParam && allowed.includes(statusParam as GenerationRunStatus)
      ? (statusParam as GenerationRunStatus)
      : undefined;

  const runs = await listRuns({ exam_pack_id: examPackId, status, limit });
  sendJSON(res, { runs, count: runs.length });
}

async function handleGet(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const id = req.params.id;
  if (!isString(id)) return badRequest(res, 'run id required');

  const run = await getRun(id);
  if (!run) {
    sendJSON(res, { error: 'Not Found' }, 404);
    return;
  }
  sendJSON(res, { run });
}

async function handleCreate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const body = (req.body ?? {}) as Record<string, unknown>;
  if (!isString(body.exam_pack_id)) return badRequest(res, 'exam_pack_id required');

  const parsed = parseRunConfig(body.config);
  if (typeof parsed === 'string') return badRequest(res, parsed);

  const run = await createRun({
    id: typeof body.id === 'string' ? body.id : undefined,
    exam_pack_id: body.exam_pack_id,
    config: parsed,
    hypothesis: typeof body.hypothesis === 'string' ? body.hypothesis : undefined,
    experiment_id:
      typeof body.experiment_id === 'string' ? body.experiment_id : undefined,
    auto_experiment:
      typeof body.auto_experiment === 'boolean' ? body.auto_experiment : true,
  });

  if (!run) {
    sendJSON(res, { error: 'Failed to create run' }, 500);
    return;
  }
  sendJSON(res, { run }, 201);
}

async function handleDryRun(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  // Dry-run does NOT require DB — purely computational

  const body = (req.body ?? {}) as Record<string, unknown>;
  const parsed = parseRunConfig(body.config);
  if (typeof parsed === 'string') return badRequest(res, parsed);

  const estimate = estimateRunCost(parsed);
  sendJSON(res, { estimate });
}

async function handleAbort(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const id = req.params.id;
  if (!isString(id)) return badRequest(res, 'run id required');

  const body = (req.body ?? {}) as Record<string, unknown>;
  if (body.action !== 'abort') {
    return badRequest(res, "only action='abort' supported on this endpoint");
  }
  const reason = isString(body.reason) ? body.reason : 'aborted by admin';
  await markRunFailed(id, reason, 'aborted');
  sendJSON(res, { ok: true });
}

// ============================================================================
// Route table
// ============================================================================

export const adminRunsRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/runs', handler: handleList },
  // Note: dry-run path before :id to avoid the param matcher capturing it
  { method: 'POST', path: '/api/admin/runs/dry-run', handler: handleDryRun },
  { method: 'GET', path: '/api/admin/runs/:id', handler: handleGet },
  { method: 'POST', path: '/api/admin/runs', handler: handleCreate },
  { method: 'PATCH', path: '/api/admin/runs/:id', handler: handleAbort },
];
