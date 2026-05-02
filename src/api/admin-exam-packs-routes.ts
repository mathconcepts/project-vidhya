/**
 * src/api/admin-exam-packs-routes.ts
 *
 * Admin REST endpoints for operator-defined exam packs (eng-review D5).
 * Operators create new packs via the admin UI without editing YAML or
 * pushing code; canonical packs (gate-ma, jee-main) stay in version
 * control as YAML files in data/curriculum/.
 *
 *   GET    /api/admin/exam-packs            list active + archived packs (DB-only)
 *   GET    /api/admin/exam-packs/:id        single pack
 *   POST   /api/admin/exam-packs            create operator pack
 *   PATCH  /api/admin/exam-packs/:id        update name/status (config edits go via clone+archive)
 *
 * Auth: requireRole('admin') — same gate as the rest of /api/admin/*.
 *
 * Note: Phase 1 stores rows but the exam-loader doesn't yet merge them
 * into the unified exam view. PR #32 wires the consumer side so the
 * unit generator can target operator packs. For now, the admin UI's
 * pack picker is the only consumer of the DB rows.
 */

import { ServerResponse } from 'http';
import pg from 'pg';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';

const { Pool } = pg;
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

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

// ============================================================================
// Validation
// ============================================================================

interface ExamPackConfigShape {
  metadata?: { id?: string; name?: string; description?: string; [k: string]: unknown };
  syllabus?: Array<{ id?: string; title?: string; weight_pct?: number; concept_ids?: string[] }>;
  capabilities?: { interactives_enabled?: boolean };
  [k: string]: unknown;
}

/**
 * Lightweight shape check on the operator-supplied config blob. Strict
 * enough to catch obvious typos that would crash the consumer; permissive
 * about additional fields so the schema can evolve without breaking the
 * admin UI on the operator's machine.
 */
function validateConfig(raw: unknown): { ok: true; config: ExamPackConfigShape } | { ok: false; reason: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'config must be an object' };
  }
  const c = raw as Record<string, unknown>;

  // Optional but typed:
  if (c.syllabus !== undefined) {
    if (!Array.isArray(c.syllabus)) return { ok: false, reason: 'config.syllabus must be an array if present' };
    for (let i = 0; i < c.syllabus.length; i++) {
      const s = c.syllabus[i] as Record<string, unknown>;
      if (s == null || typeof s !== 'object') return { ok: false, reason: `config.syllabus[${i}] must be an object` };
      if (s.id !== undefined && typeof s.id !== 'string') return { ok: false, reason: `config.syllabus[${i}].id must be a string` };
      if (s.weight_pct !== undefined && typeof s.weight_pct !== 'number') {
        return { ok: false, reason: `config.syllabus[${i}].weight_pct must be a number` };
      }
      if (s.concept_ids !== undefined && !Array.isArray(s.concept_ids)) {
        return { ok: false, reason: `config.syllabus[${i}].concept_ids must be an array of strings` };
      }
    }
  }

  if (c.capabilities !== undefined && (typeof c.capabilities !== 'object' || Array.isArray(c.capabilities))) {
    return { ok: false, reason: 'config.capabilities must be an object if present' };
  }

  return { ok: true, config: c as ExamPackConfigShape };
}

/** Lower-case slug; alphanumeric + hyphens; no leading/trailing hyphen. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// ============================================================================
// Handlers
// ============================================================================

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;
  const pool = getPool();
  if (!pool) return;

  const status = req.query.get('status');
  const args: unknown[] = [];
  let where = '';
  if (status === 'active' || status === 'archived') {
    args.push(status);
    where = `WHERE status = $1`;
  }

  const { rows } = await pool.query(
    `SELECT id, name, source, interactives_enabled, status, created_at, created_by, updated_at
       FROM exam_packs ${where}
      ORDER BY created_at DESC
      LIMIT 200`,
    args,
  );
  sendJSON(res, { packs: rows, count: rows.length });
}

async function handleGet(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;
  const pool = getPool();
  if (!pool) return;

  const id = req.params.id;
  if (!isString(id)) return badRequest(res, 'pack id required');

  const { rows } = await pool.query(`SELECT * FROM exam_packs WHERE id = $1`, [id]);
  if (rows.length === 0) {
    sendJSON(res, { error: 'Not Found' }, 404);
    return;
  }
  sendJSON(res, { pack: rows[0] });
}

async function handleCreate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;
  const pool = getPool();
  if (!pool) return;

  const body = (req.body ?? {}) as Record<string, unknown>;
  const nameRaw = body.name;
  if (!isString(nameRaw)) return badRequest(res, 'name required');

  const validation = validateConfig(body.config);
  if (!validation.ok) return badRequest(res, validation.reason);

  // ID: caller may supply, otherwise derive from name.
  let id: string;
  if (typeof body.id === 'string' && body.id.length > 0) {
    id = slugify(body.id);
    if (!id) return badRequest(res, 'id slug is empty after sanitization');
  } else {
    id = slugify(nameRaw);
    if (!id) return badRequest(res, 'name produces empty slug; supply an explicit id');
  }

  // Reserved canonical slugs are off-limits for operator packs.
  const reserved = new Set(['gate-ma', 'jee-main', 'jee-advanced', 'neet']);
  if (reserved.has(id)) {
    return badRequest(res, `id '${id}' is reserved for canonical YAML packs; pick another`);
  }

  // Capability flag: operator packs default to false (text+GIF only) per scope.
  const interactivesEnabled =
    typeof body.interactives_enabled === 'boolean' ? body.interactives_enabled : false;

  // Stash creator id from the auth result (cheap re-derive via requireRole already passed)
  const auth = await import('./auth-middleware').then((m) => m.getAuth(req));

  try {
    const { rows } = await pool.query(
      `INSERT INTO exam_packs (id, name, source, config, interactives_enabled, status, created_by)
       VALUES ($1, $2, 'operator', $3, $4, 'active', $5)
       RETURNING *`,
      [id, nameRaw, JSON.stringify(validation.config), interactivesEnabled, auth?.userId ?? null],
    );
    sendJSON(res, { pack: rows[0] }, 201);
  } catch (e: any) {
    if ((e?.code ?? '') === '23505') {
      sendJSON(res, { error: 'Conflict', message: `pack '${id}' already exists` }, 409);
      return;
    }
    sendJSON(res, { error: 'Failed to create pack', message: e?.message ?? 'unknown' }, 500);
  }
}

async function handleUpdate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;
  const pool = getPool();
  if (!pool) return;

  const id = req.params.id;
  if (!isString(id)) return badRequest(res, 'pack id required');

  const body = (req.body ?? {}) as Record<string, unknown>;
  const sets: string[] = [];
  const args: unknown[] = [id];

  if (typeof body.name === 'string' && body.name.length > 0) {
    args.push(body.name);
    sets.push(`name = $${args.length}`);
  }
  if (body.status === 'active' || body.status === 'archived') {
    args.push(body.status);
    sets.push(`status = $${args.length}`);
  }
  if (typeof body.interactives_enabled === 'boolean') {
    args.push(body.interactives_enabled);
    sets.push(`interactives_enabled = $${args.length}`);
  }

  if (sets.length === 0) return badRequest(res, 'no editable fields supplied');

  const { rowCount } = await pool.query(
    `UPDATE exam_packs SET ${sets.join(', ')} WHERE id = $1`,
    args,
  );
  if ((rowCount ?? 0) === 0) {
    sendJSON(res, { error: 'Not Found' }, 404);
    return;
  }
  sendJSON(res, { ok: true });
}

// ============================================================================
// Route table
// ============================================================================

export const adminExamPacksRoutes: RouteDefinition[] = [
  { method: 'GET',   path: '/api/admin/exam-packs',     handler: handleList },
  { method: 'GET',   path: '/api/admin/exam-packs/:id', handler: handleGet },
  { method: 'POST',  path: '/api/admin/exam-packs',     handler: handleCreate },
  { method: 'PATCH', path: '/api/admin/exam-packs/:id', handler: handleUpdate },
];
