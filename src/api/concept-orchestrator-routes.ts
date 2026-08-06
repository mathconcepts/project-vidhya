// @ts-nocheck
/**
 * Concept Orchestrator HTTP routes (admin-only).
 *
 *   GET  /api/admin/concept-orchestrator/queue
 *     Returns the priority-sorted queue of concepts needing content.
 *     Query params: limit, topic_family, state (repeatable filters)
 *
 *   GET  /api/admin/concept-orchestrator/cost/:concept_id
 *     Returns: CostState for the concept this month
 *
 *   GET  /api/admin/atoms/:atom_id/versions
 *   POST /api/admin/atoms/:atom_id/activate
 *
 * All endpoints gated to admin/owner/institution roles. Feature-flagged
 * behind VIDHYA_CONCEPT_ORCHESTRATOR=on.
 *
 * REMOVED (2026-08-06): the generate/status pair
 * (POST .../generate, GET .../status/:job_id) that used to live here.
 * It was in-memory-only (job state died with the process) — a real gap,
 * but the docblock's stated replacement (src/api/job-routes.ts's job
 * runner) was WRONG: job-routes.ts's JobDefinition is a singleton keyed
 * by NAME only (one job named 'content-generation' at a time, refuses
 * concurrent starts with the same name) — fine for one nightly job,
 * broken for per-invocation, per-concept, concurrently-launchable
 * generation. Migrated onto src/generation/run-dispatcher.ts +
 * generation_runs instead (the v4.26.0 infrastructure that already
 * supports exactly this: one row per invocation, its own run_id, real
 * concurrency). The frontend now calls POST /api/admin/runs +
 * GET /api/admin/runs/:id/atoms (frontend/src/pages/app/ConceptOrchestratorPage.tsx).
 * The in-memory job store (jobs.ts) is deleted alongside this — nothing
 * else referenced it.
 */

import { ServerResponse } from 'http';
import {
  readState,
  listVersions,
  activate,
  buildQueue,
  topPatterns,
} from '../content/concept-orchestrator';
import type { ConceptState } from '../content/concept-orchestrator';
import { requireRole } from '../auth/middleware';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

const FEATURE_FLAG_ON = process.env.VIDHYA_CONCEPT_ORCHESTRATOR === 'on';

function checkFeatureFlag(res: ServerResponse): boolean {
  if (!FEATURE_FLAG_ON) {
    sendError(res, 404, 'concept orchestrator not enabled (VIDHYA_CONCEPT_ORCHESTRATOR=on)');
    return false;
  }
  return true;
}

async function handleQueue(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;

  const q = (req.query as any) || {};
  const limit = q.limit ? Number(q.limit) : 50;
  const topic_families = q.topic_family
    ? (Array.isArray(q.topic_family) ? q.topic_family : [q.topic_family])
    : undefined;
  const states = q.state
    ? (Array.isArray(q.state) ? q.state : [q.state])
    : undefined;

  const rows = await buildQueue({
    limit: Number.isFinite(limit) ? limit : 50,
    topic_families,
    states: states as ConceptState[] | undefined,
  });
  sendJSON(res, { rows });
}

async function handleCost(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;
  const concept_id = (req.params as any)?.concept_id;
  if (!concept_id) return sendError(res, 400, 'concept_id required');
  const state = await readState(concept_id);
  sendJSON(res, state);
}

async function handleListVersions(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;
  const atom_id = (req.params as any)?.atom_id;
  if (!atom_id) return sendError(res, 400, 'atom_id required');
  const versions = await listVersions(atom_id);
  sendJSON(res, { versions });
}

async function handleActivate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;
  const atom_id = (req.params as any)?.atom_id;
  const body = (req.body || {}) as { version_n?: number };
  if (!atom_id || typeof body.version_n !== 'number') {
    return sendError(res, 400, 'atom_id and version_n required');
  }
  const ok = await activate(atom_id, body.version_n);
  sendJSON(res, { activated: ok });
}

interface BulkActivateBody {
  /** [{atom_id, version_n}, ...]. version_n optional — when omitted,
   *  the most recent (highest) version_n for that atom is activated. */
  items?: Array<{ atom_id: string; version_n?: number }>;
}

interface BulkActivateResult {
  total: number;
  activated: number;
  failed: number;
  failures: Array<{ atom_id: string; reason: string }>;
}

async function handlePromptPatterns(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;
  const q = (req.query as any) || {};
  const limit = q.limit ? Number(q.limit) : 50;
  const min_promoted = q.min_promoted ? Number(q.min_promoted) : 3;
  const topic_family = typeof q.topic_family === 'string' ? q.topic_family : undefined;
  const atom_type = typeof q.atom_type === 'string' ? q.atom_type : undefined;
  const patterns = await topPatterns({
    limit: Number.isFinite(limit) ? limit : 50,
    min_promoted: Number.isFinite(min_promoted) ? min_promoted : 3,
    topic_family,
    atom_type,
  });
  sendJSON(res, { patterns });
}

async function handleBulkActivate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;
  const body = (req.body || {}) as BulkActivateBody;
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return sendError(res, 400, 'items array required (non-empty)');
  }
  if (body.items.length > 100) {
    return sendError(res, 400, 'bulk-activate capped at 100 items per call');
  }
  for (const it of body.items) {
    if (!it || typeof it.atom_id !== 'string') {
      return sendError(res, 400, 'each item must be { atom_id: string, version_n?: number }');
    }
    if (it.version_n !== undefined && typeof it.version_n !== 'number') {
      return sendError(res, 400, 'version_n must be a number when present');
    }
  }

  const result: BulkActivateResult = {
    total: body.items.length,
    activated: 0,
    failed: 0,
    failures: [],
  };

  // Sequential activation — each call is a transaction in the DB layer
  // and the partial-unique-index serializes per-atom anyway. ~10ms each;
  // 100 items = ~1s total. Acceptable for an admin click action.
  for (const it of body.items) {
    try {
      let target_version = it.version_n;
      if (target_version === undefined) {
        // Look up the latest version for this atom — the typical "approve
        // newly generated batch" case where the admin doesn't know the
        // version_n. listVersions returns DESC, so [0] is latest.
        const versions = await listVersions(it.atom_id);
        if (versions.length === 0) {
          result.failed++;
          result.failures.push({ atom_id: it.atom_id, reason: 'no versions exist' });
          continue;
        }
        target_version = versions[0].version_n;
      }
      const ok = await activate(it.atom_id, target_version);
      if (ok) result.activated++;
      else {
        result.failed++;
        result.failures.push({ atom_id: it.atom_id, reason: 'activate returned false (no matching version?)' });
      }
    } catch (err) {
      result.failed++;
      result.failures.push({ atom_id: it.atom_id, reason: (err as Error).message });
    }
  }

  sendJSON(res, result);
}

export const conceptOrchestratorRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET',  path: '/api/admin/concept-orchestrator/queue', handler: handleQueue },
  { method: 'GET',  path: '/api/admin/concept-orchestrator/cost/:concept_id', handler: handleCost },
  { method: 'GET',  path: '/api/admin/concept-orchestrator/prompt-patterns', handler: handlePromptPatterns },
  { method: 'GET',  path: '/api/admin/atoms/:atom_id/versions', handler: handleListVersions },
  { method: 'POST', path: '/api/admin/atoms/:atom_id/activate', handler: handleActivate },
  { method: 'POST', path: '/api/admin/atoms/bulk-activate', handler: handleBulkActivate },
];
