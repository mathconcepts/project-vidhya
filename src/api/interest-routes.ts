// @ts-nocheck
/**
 * Interest Routes — "register your interest" capture for U1-10 demand-test
 * pages (institute one-pager + sell-your-course fake door).
 *
 * POST /api/interest        — public, rate-limited. Persists a row to
 *                              interest_registrations (migration 036) when
 *                              DATABASE_URL is configured. On a DB-less
 *                              deploy (or a DB error) it does NOT silently
 *                              drop the submission and does NOT fake a
 *                              "saved" response — it logs the submission
 *                              server-side and returns `persisted: false`
 *                              with an honest note, so the caller can
 *                              decide whether to warn the operator.
 * GET  /api/admin/interest  — admin-only list, so someone can actually
 *                              read what came in.
 */

import { ServerResponse } from 'http';
import pg from 'pg';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';

const { Pool } = pg;

let _pool: any = null;
function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!_pool) _pool = new Pool({ connectionString, max: 3, idleTimeoutMillis: 30_000 });
  return _pool;
}

const ALLOWED_KINDS = new Set(['institute_batch', 'sell_course']);

// ── Rate limiter (in-memory, per IP) — mirrors funnel-routes.ts ─────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // submissions per minute per IP
const RATE_WINDOW = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300_000);

function clientIp(req: ParsedRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const fwdStr = Array.isArray(fwd) ? fwd[0] : fwd;
  if (fwdStr) return fwdStr.split(',')[0].trim();
  const real = req.headers['x-real-ip'];
  return (Array.isArray(real) ? real[0] : real) || 'unknown';
}

async function h_submit(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (isRateLimited(clientIp(req))) return sendError(res, 429, 'Too many requests — try again in a minute');

  const body = (req.body || {}) as any;
  const kind = String(body.kind || '');
  if (!ALLOWED_KINDS.has(kind)) {
    return sendError(res, 400, `kind must be one of: ${[...ALLOWED_KINDS].join(', ')}`);
  }

  const name = String(body.name || '').trim().slice(0, 200);
  const email = String(body.email || '').trim().slice(0, 200);
  if (!name || !email) return sendError(res, 400, 'name and email are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendError(res, 400, 'email looks invalid');

  const record = {
    kind,
    name,
    org_name: String(body.org_name || '').trim().slice(0, 200) || null,
    email,
    phone: String(body.phone || '').trim().slice(0, 40) || null,
    message: String(body.message || '').trim().slice(0, 2000) || null,
    source_page: String(body.source_page || '').trim().slice(0, 200) || null,
  };

  const pool = getPool();
  if (!pool) {
    // DB-less deploy (e.g. Render free-tier ephemeral boot with no DATABASE_URL
    // yet, or a local dev run without Postgres). Log rather than silently
    // drop, and tell the caller the truth about what happened.
    console.log('[interest] no DATABASE_URL configured — logging only:', JSON.stringify(record));
    return sendJSON(res, {
      ok: true,
      persisted: false,
      note: 'Received — this deploy has no database configured, so it was logged server-side only, not saved.',
    });
  }

  try {
    await pool.query(
      `INSERT INTO interest_registrations (kind, name, org_name, email, phone, message, source_page)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [record.kind, record.name, record.org_name, record.email, record.phone, record.message, record.source_page],
    );
    sendJSON(res, { ok: true, persisted: true });
  } catch (err: any) {
    console.error('[interest] DB insert failed — logging instead:', err?.message, JSON.stringify(record));
    sendJSON(res, {
      ok: true,
      persisted: false,
      note: 'Received, but it could not be saved to the database — logged server-side only.',
    });
  }
}

async function h_list(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;

  const pool = getPool();
  if (!pool) return sendJSON(res, { registrations: [], note: 'No database configured on this deploy.' });

  const kind = req.query.get('kind');
  const limit = Math.min(Math.max(parseInt(req.query.get('limit') || '100', 10) || 100, 1), 500);

  try {
    const params: any[] = [];
    let where = '';
    if (kind) {
      params.push(kind);
      where = `WHERE kind = $${params.length}`;
    }
    params.push(limit);
    const { rows } = await pool.query(
      `SELECT id, kind, name, org_name, email, phone, message, source_page, created_at
       FROM interest_registrations
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );
    sendJSON(res, { registrations: rows });
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Failed to list interest registrations');
  }
}

export const interestRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST', path: '/api/interest', handler: h_submit },
  { method: 'GET', path: '/api/admin/interest', handler: h_list },
];
