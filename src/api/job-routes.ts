/**
 * Background job admin routes (content-pipeline realignment plan,
 * Accepted Scope item 4). Persistent, checkpointed job control — the
 * successor to the concept-orchestrator's in-memory job status routes.
 *
 *   POST /api/admin/jobs/:name/start   start (409 when already running,
 *                                      with the running status attached)
 *   GET  /api/admin/jobs/:name/status  persisted status (survives restart)
 *   POST /api/admin/jobs/:name/cancel  cooperative cancel (between items)
 *   GET  /api/admin/jobs               list registered jobs + statuses
 *
 * All endpoints sit behind the existing admin auth (same roles as the
 * concept-orchestrator admin surface). Global kill switch:
 * CONTENT_JOBS_DISABLED=true → every start is refused with 503.
 */

import { ServerResponse } from 'http';
import { requireAnyRole } from '../auth/middleware';
import type { Role } from '../auth/types';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import {
  startJob,
  cancelJob,
  getJobStatus,
  getJobDefinition,
  listJobs,
} from '../jobs/job-runner';
// Side-effect import: registers content-generation + wolfram-verify.
import '../jobs/job-registry';

const ADMIN_ROLES: Role[] = ['admin', 'owner', 'institution'];

async function handleStart(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAnyRole(req, res, ADMIN_ROLES);
  if (!auth) return;
  const name = req.params?.name;
  if (!name) return sendError(res, 400, 'job name required');
  if (!getJobDefinition(name)) return sendError(res, 404, `unknown job "${name}"`);

  const result = await startJob(name);
  if (result.ok) {
    return sendJSON(res, { started: true, status: result.status }, 202);
  }
  switch (result.code) {
    case 'already_running':
      // Concurrent start of a running job → 409 with the existing status.
      return sendError(res, 409, result.message, { status: result.status });
    case 'disabled':
      return sendError(res, 503, result.message);
    case 'refused':
      return sendError(res, 400, result.message);
    case 'checkpoint_corrupt':
      return sendError(res, 500, result.message, { status: result.status });
    default:
      return sendError(res, 404, result.message);
  }
}

async function handleStatus(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAnyRole(req, res, ADMIN_ROLES);
  if (!auth) return;
  const name = req.params?.name;
  if (!name) return sendError(res, 400, 'job name required');
  if (!getJobDefinition(name)) return sendError(res, 404, `unknown job "${name}"`);
  const status = getJobStatus(name);
  sendJSON(res, { job: name, status: status ?? null, state: status?.state ?? 'idle' });
}

async function handleCancel(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAnyRole(req, res, ADMIN_ROLES);
  if (!auth) return;
  const name = req.params?.name;
  if (!name) return sendError(res, 400, 'job name required');
  if (!getJobDefinition(name)) return sendError(res, 404, `unknown job "${name}"`);
  const result = cancelJob(name);
  if (!result.ok) {
    return sendError(res, 409, result.message, { status: result.status });
  }
  sendJSON(res, { cancelling: true, message: result.message, status: result.status });
}

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAnyRole(req, res, ADMIN_ROLES);
  if (!auth) return;
  sendJSON(res, { jobs: listJobs() });
}

export const jobRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET',  path: '/api/admin/jobs', handler: handleList },
  { method: 'POST', path: '/api/admin/jobs/:name/start', handler: handleStart },
  { method: 'GET',  path: '/api/admin/jobs/:name/status', handler: handleStatus },
  { method: 'POST', path: '/api/admin/jobs/:name/cancel', handler: handleCancel },
];
