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
// MCP JSON-RPC — external agent interface (v2.23.0)
// ============================================================================

/**
 * POST /api/admin/agent/mcp
 * Accepts a JSON-RPC 2.0 request, dispatches to the MCP server, returns
 * the JSON-RPC response. Authenticated via the standard requireAuth
 * middleware — the caller's user id and claimed role become the actor
 * on every tool invocation within the call.
 *
 * The claimed role is extracted from:
 *   1. Body.params._role (explicit per-call override)
 *   2. Query parameter ?role= (per-session fixed role)
 *   3. Default: 'admin' (backward-compatible with direct-invoke path)
 */
async function h_mcpRpc(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const { handleMCPRequest } = await import('../admin-orchestrator/mcp-server');

  const body = (req.body || {}) as any;
  const role = (body?.params?._role) || req.query.get('role') || 'admin';

  const response = await handleMCPRequest(body, {
    role,
    actor: auth.user.id,
    session_id: req.query.get('session') ?? undefined,
  });
  sendJSON(res, response);
}

/**
 * GET /api/admin/agent/mcp/manifest
 * Public, unauthenticated endpoint returning server info, protocol
 * version, and auth scheme. External agents hit this first to discover
 * how to talk to the server before initialize.
 */
async function h_mcpManifest(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { getPublicManifest } = await import('../admin-orchestrator/mcp-server');
  sendJSON(res, getPublicManifest());
}

/**
 * GET /api/admin/agent/llm-status
 * Diagnostic: returns whether the LLM bridge has a provider+key
 * configured. Used by dashboards + smoke tests to verify LLM
 * infrastructure is wired correctly without making a paid call.
 */
async function h_llmStatus(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { describeLLMAvailability } = await import('../admin-orchestrator/llm-bridge');
  sendJSON(res, { llm: describeLLMAvailability() });
}

/**
 * GET /api/admin/agent/dashboard
 * Serves the admin orchestrator UI — an HTML page with inline CSS+JS
 * that consumes the /api/admin/agent/* endpoints via fetch(). The HTML
 * itself is PUBLIC and unauthenticated so it can load before an auth
 * token exists; the JS then prompts the user for a JWT which is
 * attached to every API call as a Bearer header. This mirrors how
 * bookmarkable single-page apps work everywhere else.
 */
async function h_dashboard(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { sendHTML } = await import('../lib/route-helpers');
  const { getDashboardHTML } = await import('../admin-orchestrator/dashboard-html');
  sendHTML(res, getDashboardHTML());
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

  // MCP (v2.23.0, extended in v2.24.0 with resources)
  { method: 'POST', path: '/api/admin/agent/mcp',                handler: h_mcpRpc },
  { method: 'GET',  path: '/api/admin/agent/mcp/manifest',       handler: h_mcpManifest },
  { method: 'GET',  path: '/api/admin/agent/llm-status',         handler: h_llmStatus },

  // Dashboard UI (v2.25.0) — public HTML page; API calls from JS are authenticated
  { method: 'GET',  path: '/api/admin/agent/dashboard',          handler: h_dashboard },
];
