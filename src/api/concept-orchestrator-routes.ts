// @ts-nocheck
/**
 * Concept Orchestrator HTTP routes (admin-only).
 *
 *   POST /api/admin/concept-orchestrator/generate
 *     Starts a generation job asynchronously. Returns { job_id }.
 *     Frontend polls GET /status/:job_id until status === 'done'.
 *
 *   GET  /api/admin/concept-orchestrator/status/:job_id
 *     Returns the JobState including event history + final result.
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
 */

import { ServerResponse } from 'http';
import {
  generateConcept,
  readState,
  listVersions,
  activate,
  buildQueue,
  createJob,
  getJob,
  recordProgress,
  recordResult,
  recordFailure,
} from '../content/concept-orchestrator';
import type { OrchestratorOptions, ConceptState } from '../content/concept-orchestrator';
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

async function handleGenerate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;

  const body = (req.body || {}) as Partial<OrchestratorOptions>;
  if (!body.concept_id || !body.topic_family) {
    return sendError(res, 400, 'concept_id and topic_family are required');
  }

  // Start the job + return its id immediately. Generation runs async.
  const job = createJob(body.concept_id, body.topic_family);
  const opts: OrchestratorOptions = {
    concept_id: body.concept_id,
    lo_id: body.lo_id,
    topic_family: body.topic_family,
    atom_types: body.atom_types,
    cost_cap_usd: body.cost_cap_usd,
    dry_run: body.dry_run ?? false,
    force: body.force ?? false,
    on_progress: (event) => recordProgress(job.id, event),
  };

  // Fire-and-forget. Errors recorded into the job state for the poll endpoint.
  generateConcept(opts)
    .then((draft) => recordResult(job.id, draft))
    .catch((err) => {
      console.error(`[orchestrator job ${job.id}] failed: ${(err as Error).message}`);
      recordFailure(job.id, (err as Error).message);
    });

  sendJSON(res, { job_id: job.id, status: 'queued' });
}

async function handleStatus(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;
  const job_id = (req.params as any)?.job_id;
  if (!job_id) return sendError(res, 400, 'job_id required');
  const job = getJob(job_id);
  if (!job) return sendError(res, 404, `job ${job_id} not found (may have expired or server restarted)`);
  sendJSON(res, job);
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
  { method: 'POST', path: '/api/admin/concept-orchestrator/generate', handler: handleGenerate },
  { method: 'GET',  path: '/api/admin/concept-orchestrator/status/:job_id', handler: handleStatus },
  { method: 'GET',  path: '/api/admin/concept-orchestrator/queue', handler: handleQueue },
  { method: 'GET',  path: '/api/admin/concept-orchestrator/cost/:concept_id', handler: handleCost },
  { method: 'GET',  path: '/api/admin/atoms/:atom_id/versions', handler: handleListVersions },
  { method: 'POST', path: '/api/admin/atoms/:atom_id/activate', handler: handleActivate },
  { method: 'POST', path: '/api/admin/atoms/bulk-activate', handler: handleBulkActivate },
];
