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

export const conceptOrchestratorRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST', path: '/api/admin/concept-orchestrator/generate', handler: handleGenerate },
  { method: 'GET',  path: '/api/admin/concept-orchestrator/status/:job_id', handler: handleStatus },
  { method: 'GET',  path: '/api/admin/concept-orchestrator/queue', handler: handleQueue },
  { method: 'GET',  path: '/api/admin/concept-orchestrator/cost/:concept_id', handler: handleCost },
  { method: 'GET',  path: '/api/admin/atoms/:atom_id/versions', handler: handleListVersions },
  { method: 'POST', path: '/api/admin/atoms/:atom_id/activate', handler: handleActivate },
];
