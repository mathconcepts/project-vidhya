// @ts-nocheck
/**
 * Admin Orchestrator HTTP routes.
 *
 * Endpoints:
 *   POST /api/admin/agent/run           — trigger a full scan+analyse+enqueue cycle
 *   GET  /api/admin/agent/runs          — list recent runs
 *   GET  /api/admin/agent/runs/:id      — get a specific run
 *   GET  /api/admin/agent/latest        — get the most recent run
 *   GET  /api/admin/agent/health        — standalone health scan (no strategy/task emission)
 *   GET  /api/admin/agent/strategies    — list strategies from latest run
 *   GET  /api/admin/agent/insights      — list recent cross-module insights
 *
 *   GET  /api/admin/agent/tasks         — list tasks (query: status, role, strategy_id)
 *   POST /api/admin/agent/tasks/:id/claim
 *   POST /api/admin/agent/tasks/:id/complete
 *   POST /api/admin/agent/tasks/:id/block
 *   POST /api/admin/agent/tasks/:id/note
 *
 *   GET  /api/admin/agent/tools         — list tools (optionally filtered by role)
 *   POST /api/admin/agent/tools/:id/invoke
 *   GET  /api/admin/agent/roles         — list roles
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAuth, requireRole } from '../auth/middleware';
import {
  runAdminAgent, listAgentRuns, getAgentRun, getLatestAgentRun, listInsights,
} from '../admin-orchestrator/agent';
import { runScan } from '../admin-orchestrator/scanner';
import {
  listTasks, getTask, claimTask, completeTask, blockTask, addTaskNote, taskCountsByRole,
} from '../admin-orchestrator/task-store';
import {
  TOOLS, getTool, listToolsForRole, invokeTool,
} from '../admin-orchestrator/tool-registry';
import { listRoles, getRole } from '../admin-orchestrator/role-registry';

// ============================================================================

async function h_run(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  try {
    const run = await runAdminAgent({
      triggered_by: auth.user.id,
      trigger_kind: body.trigger_kind ?? 'manual',
      trigger_event: body.trigger_event,
      auto_enqueue_tasks: body.auto_enqueue_tasks !== false,
      attempt_llm_narration: body.attempt_llm_narration === true,
    });
    sendJSON(res, { run });
  } catch (err: any) { sendError(res, 500, err.message ?? 'agent run failed'); }
}

async function h_listRuns(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const limit = parseInt(req.query.get('limit') ?? '20', 10);
  sendJSON(res, { runs: listAgentRuns(limit) });
}

async function h_getRun(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const run = getAgentRun(req.params.id);
  if (!run) return sendError(res, 404, 'Run not found');
  sendJSON(res, { run });
}

async function h_latestRun(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const run = getLatestAgentRun();
  if (!run) return sendError(res, 404, 'No runs yet');
  sendJSON(res, { run });
}

async function h_standaloneHealth(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  sendJSON(res, { health: await runScan() });
}

async function h_listStrategies(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const latest = getLatestAgentRun();
  sendJSON(res, { strategies: latest?.strategies_proposed ?? [] });
}

async function h_listInsights(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const limit = parseInt(req.query.get('limit') ?? '20', 10);
  sendJSON(res, { insights: listInsights(limit) });
}

// ============================================================================
// Tasks

async function h_listTasks(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const filter: any = {};
  const status = req.query.get('status');
  if (status) filter.statuses = [status];
  const role = req.query.get('role');
  if (role) filter.role = role;
  const strategy_id = req.query.get('strategy_id');
  if (strategy_id) filter.strategy_id = strategy_id;
  const assigned_to = req.query.get('assigned_to');
  if (assigned_to) filter.assigned_to = assigned_to;
  sendJSON(res, { tasks: listTasks(filter), counts_by_role: taskCountsByRole() });
}

async function h_claimTask(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  try {
    const t = claimTask(req.params.id, auth.user.id);
    if (!t) return sendError(res, 404, 'Task not found');
    sendJSON(res, { task: t });
  } catch (err: any) { sendError(res, 400, err.message ?? 'claim failed'); }
}

async function h_completeTask(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  try {
    const body = (req.body || {}) as any;
    const t = completeTask(req.params.id, auth.user.id, body.note);
    if (!t) return sendError(res, 404, 'Task not found');
    sendJSON(res, { task: t });
  } catch (err: any) { sendError(res, 400, err.message ?? 'complete failed'); }
}

async function h_blockTask(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body || {}) as any;
  const reason = body.reason ?? 'blocked';
  const t = blockTask(req.params.id, auth.user.id, reason);
  if (!t) return sendError(res, 404, 'Task not found');
  sendJSON(res, { task: t });
}

async function h_noteTask(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.note) return sendError(res, 400, 'note required');
  const t = addTaskNote(req.params.id, auth.user.id, body.note);
  if (!t) return sendError(res, 404, 'Task not found');
  sendJSON(res, { task: t });
}

// ============================================================================
// Tools + Roles

async function h_listTools(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const role = req.query.get('role') as any;
  const tools = role ? listToolsForRole(role) : TOOLS;
  sendJSON(res, { tools });
}

async function h_invokeTool(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body || {}) as any;
  const role = body.role ?? 'admin';
  try {
    const inv = await invokeTool(req.params.id, body.input ?? {}, auth.user.id, role);
    sendJSON(res, { invocation: inv });
  } catch (err: any) { sendError(res, 500, err.message ?? 'invoke failed'); }
}

async function h_listRoles(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  sendJSON(res, { roles: listRoles() });
}

// ============================================================================

export const adminAgentRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  // Runs
  { method: 'POST', path: '/api/admin/agent/run',            handler: h_run },
  { method: 'GET',  path: '/api/admin/agent/runs',           handler: h_listRuns },
  { method: 'GET',  path: '/api/admin/agent/runs/:id',       handler: h_getRun },
  { method: 'GET',  path: '/api/admin/agent/latest',         handler: h_latestRun },
  { method: 'GET',  path: '/api/admin/agent/health',         handler: h_standaloneHealth },
  { method: 'GET',  path: '/api/admin/agent/strategies',     handler: h_listStrategies },
  { method: 'GET',  path: '/api/admin/agent/insights',       handler: h_listInsights },

  // Tasks
  { method: 'GET',  path: '/api/admin/agent/tasks',              handler: h_listTasks },
  { method: 'POST', path: '/api/admin/agent/tasks/:id/claim',    handler: h_claimTask },
  { method: 'POST', path: '/api/admin/agent/tasks/:id/complete', handler: h_completeTask },
  { method: 'POST', path: '/api/admin/agent/tasks/:id/block',    handler: h_blockTask },
  { method: 'POST', path: '/api/admin/agent/tasks/:id/note',     handler: h_noteTask },

  // Tools + Roles
  { method: 'GET',  path: '/api/admin/agent/tools',              handler: h_listTools },
  { method: 'POST', path: '/api/admin/agent/tools/:id/invoke',   handler: h_invokeTool },
  { method: 'GET',  path: '/api/admin/agent/roles',              handler: h_listRoles },
];
