/**
 * src/api/admin-decisions-routes.ts
 *
 * The decision log: a chronological feed of admin actions across the
 * blueprint / ruleset / generation-run surfaces. Pure read; no new
 * tables. Sourced from `created_at` + `created_by` on existing rows.
 *
 *   GET /api/admin/decisions?limit=50
 *
 * Surveillance: returns only what the admin themselves did. No student
 * actions, no per-student fields. Invariant 9 grep covers this file.
 */

import { ServerResponse } from 'http';
import pg from 'pg';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';

const { Pool } = pg;

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _pool;
}

export type DecisionKind =
  | 'ruleset_created'
  | 'blueprint_created'
  | 'blueprint_approved'
  | 'run_launched';

export interface DecisionRow {
  kind: DecisionKind;
  at: string;
  actor: string;
  ref_id: string;
  summary: string;
  href: string;
}

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await requireRole(req, res, 'admin'))) return;
  const limit = Math.min(Math.max(Number(req.query.get('limit') ?? '50'), 1), 200);

  const pool = getPool();
  if (!pool) return sendJSON(res, { decisions: [] });

  const rows = await collectDecisions(pool, limit);
  sendJSON(res, { decisions: rows });
}

export async function collectDecisions(pool: pg.Pool, limit: number): Promise<DecisionRow[]> {
  const queries = await Promise.allSettled([
    pool.query<{ id: string; created_at: Date; created_by: string; rule_text: string }>(
      `SELECT id, created_at, created_by, rule_text
         FROM blueprint_rulesets
         ORDER BY created_at DESC LIMIT $1`,
      [limit],
    ),
    pool.query<{ id: string; created_at: Date; created_by: string; concept_id: string; exam_pack_id: string }>(
      `SELECT id, created_at, created_by, concept_id, exam_pack_id
         FROM content_blueprints
         WHERE superseded_by IS NULL
         ORDER BY created_at DESC LIMIT $1`,
      [limit],
    ),
    pool.query<{ id: string; approved_at: Date; approved_by: string; concept_id: string }>(
      `SELECT id, approved_at, approved_by, concept_id
         FROM content_blueprints
         WHERE approved_at IS NOT NULL
         ORDER BY approved_at DESC LIMIT $1`,
      [limit],
    ),
    pool.query<{ id: string; created_at: Date; exam_pack_id: string; hypothesis: string | null }>(
      `SELECT id, created_at, exam_pack_id, hypothesis
         FROM generation_runs
         ORDER BY created_at DESC LIMIT $1`,
      [limit],
    ),
  ]);

  const out: DecisionRow[] = [];

  if (queries[0].status === 'fulfilled') {
    for (const r of queries[0].value.rows) {
      out.push({
        kind: 'ruleset_created',
        at: r.created_at.toISOString(),
        actor: r.created_by,
        ref_id: r.id,
        summary: r.rule_text.length > 120 ? r.rule_text.slice(0, 117) + '…' : r.rule_text,
        href: '/admin/rulesets',
      });
    }
  }
  if (queries[1].status === 'fulfilled') {
    for (const r of queries[1].value.rows) {
      out.push({
        kind: 'blueprint_created',
        at: r.created_at.toISOString(),
        actor: r.created_by,
        ref_id: r.id,
        summary: `${r.concept_id} (${r.exam_pack_id})`,
        href: `/admin/blueprints/${r.id}`,
      });
    }
  }
  if (queries[2].status === 'fulfilled') {
    for (const r of queries[2].value.rows) {
      out.push({
        kind: 'blueprint_approved',
        at: r.approved_at.toISOString(),
        actor: r.approved_by ?? 'admin',
        ref_id: r.id,
        summary: `Approved blueprint for ${r.concept_id}`,
        href: `/admin/blueprints/${r.id}`,
      });
    }
  }
  if (queries[3].status === 'fulfilled') {
    for (const r of queries[3].value.rows) {
      out.push({
        kind: 'run_launched',
        at: r.created_at.toISOString(),
        actor: 'admin',
        ref_id: r.id,
        summary: r.hypothesis?.slice(0, 100) ?? `Run on ${r.exam_pack_id}`,
        href: '/admin/content-rd',
      });
    }
  }

  out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return out.slice(0, limit);
}

export const adminDecisionsRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/decisions', handler: handleList },
];
