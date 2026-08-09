/**
 * src/api/admin-playbooks-routes.ts
 *
 * Admin REST surface for the Playbook Layer (Track E5).
 *
 *   GET    /api/admin/playbooks                list all registered playbooks
 *   GET    /api/admin/playbooks/:id            single playbook details
 *   POST   /api/admin/playbooks/:id/estimate   dry-run cost estimate
 *   POST   /api/admin/playbooks/:id/launch     launch a playbook run
 *   GET    /api/admin/playbook-runs            list recent runs
 *   GET    /api/admin/playbook-runs/:run_id    single run status
 *   POST   /api/admin/playbook-runs/:run_id/abort  abort a running run
 *
 * Auth: requireRole('admin').
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { listPlaybooks, getPlaybook } from '../playbooks/registry';
import {
  estimateRun,
  launchPlaybook,
  loadRun,
  listRuns,
  abortRun,
} from '../playbooks/runner';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, status: number, message: string): void {
  sendJSON(res, { error: message }, status);
}

async function parseBody(req: ParsedRequest): Promise<Record<string, unknown>> {
  return (req.body as Record<string, unknown>) ?? {};
}

export const adminPlaybooksRoutes: RouteDefinition[] = [
    // List all registered playbooks
    {
      method: 'GET',
      path: '/api/admin/playbooks',
      handler: async (req, res) => {
        const user = await requireRole(req, res, 'admin');
        if (!user) return;

        const playbooks = listPlaybooks().map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          executor: p.executor,
          guards: p.guards,
          params_schema: p.params_schema,
          steps: p.steps,
        }));

        sendJSON(res, { playbooks, total: playbooks.length });
      },
    },

    // Single playbook
    {
      method: 'GET',
      path: '/api/admin/playbooks/:id',
      handler: async (req, res) => {
        const user = await requireRole(req, res, 'admin');
        if (!user) return;

        const id = req.params?.id as string;
        const playbook = getPlaybook(id);
        if (!playbook) {
          return sendError(res, 404, `Playbook '${id}' not found`);
        }

        sendJSON(res, {
          id: playbook.id,
          title: playbook.title,
          description: playbook.description,
          executor: playbook.executor,
          guards: playbook.guards,
          params_schema: playbook.params_schema,
          steps: playbook.steps,
        });
      },
    },

    // Dry-run estimate
    {
      method: 'POST',
      path: '/api/admin/playbooks/:id/estimate',
      handler: async (req, res) => {
        const user = await requireRole(req, res, 'admin');
        if (!user) return;

        const id = req.params?.id as string;
        const body = await parseBody(req);

        try {
          const result = estimateRun(id, body);
          sendJSON(res, result);
        } catch (err) {
          sendError(res, 400, String(err instanceof Error ? err.message : err));
        }
      },
    },

    // Launch playbook
    {
      method: 'POST',
      path: '/api/admin/playbooks/:id/launch',
      handler: async (req, res) => {
        const user = await requireRole(req, res, 'admin');
        if (!user) return;

        const id = req.params?.id as string;
        const body = await parseBody(req);
        const { dry_run, ...params } = body;

        try {
          const result = await launchPlaybook(id, params, { dry_run: Boolean(dry_run) });
          sendJSON(res, {
            run_id: result.run.run_id,
            status: result.run.status,
            brief_path: result.brief_path,
            started_at: result.run.started_at,
          }, 201);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sendError(res, 400, msg);
        }
      },
    },

    // List recent runs
    {
      method: 'GET',
      path: '/api/admin/playbook-runs',
      handler: async (req, res) => {
        const user = await requireRole(req, res, 'admin');
        if (!user) return;

        const playbookId = req.query.get('playbook_id') ?? undefined;
        const runs = listRuns(playbookId).slice(0, 50);
        sendJSON(res, { runs, total: runs.length });
      },
    },

    // Single run status
    {
      method: 'GET',
      path: '/api/admin/playbook-runs/:run_id',
      handler: async (req, res) => {
        const user = await requireRole(req, res, 'admin');
        if (!user) return;

        const runId = req.params?.run_id as string;
        const run = loadRun(runId);
        if (!run) return sendError(res, 404, `Run '${runId}' not found`);
        sendJSON(res, run);
      },
    },

    // Abort a run
    {
      method: 'POST',
      path: '/api/admin/playbook-runs/:run_id/abort',
      handler: async (req, res) => {
        const user = await requireRole(req, res, 'admin');
        if (!user) return;

        const runId = req.params?.run_id as string;
        try {
          const run = abortRun(runId);
          sendJSON(res, run);
        } catch (err) {
          sendError(res, 400, err instanceof Error ? err.message : String(err));
        }
      },
    },
];
