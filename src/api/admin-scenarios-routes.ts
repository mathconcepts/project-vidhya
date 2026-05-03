/**
 * src/api/admin-scenarios-routes.ts
 *
 * Admin REST surface for persona scenario trials.
 *
 *   GET  /api/admin/scenarios                  list run-ids (newest first)
 *   GET  /api/admin/scenarios/:id              read trial.json + digest.md
 *   POST /api/admin/scenarios/:id/neutral-render
 *        body: { atom_id }                     on-demand "what would a
 *                                              generic prompt have produced?"
 *                                              version of the same atom,
 *                                              for the side-by-side moat view.
 *
 * Auth: requireRole('admin') — surveillance invariant 7. Persona trial
 * output is operator-only debug data.
 *
 * Surveillance invariant 6: this file MUST NOT echo scorer internals
 * (layers, scores, layer_weights). The CI test in
 * src/personalization/__tests__/surveillance-invariants.test.ts greps
 * this exact file.
 *
 * Rate limit on the neutral-render endpoint: 10 requests/hour/admin
 * (in-memory token bucket — survives a single process; the cache below
 * is what does the real work for repeated demo views).
 *
 * Disk cache for neutral renders: keyed by (concept_id, atom_id). Same
 * atom regenerates once, ever, per process lifetime.
 */

import { ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { listRunIds, readTrial, runDir, digestOf } from '../scenarios/trial-storage';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function checkAdminAuth(req: ParsedRequest, res: ServerResponse): Promise<{ id: string } | null> {
  const user = await requireRole(req, res, 'admin');
  return user as any;
}

// ----------------------------------------------------------------------------
// Rate limiter — per-admin, 10/hour, in-memory token bucket.

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 10;
const _buckets = new Map<string, number[]>();

function checkRateLimit(adminId: string): boolean {
  const now = Date.now();
  const bucket = _buckets.get(adminId) ?? [];
  const fresh = bucket.filter((t) => now - t < RATE_WINDOW_MS);
  if (fresh.length >= RATE_MAX) {
    _buckets.set(adminId, fresh);
    return false;
  }
  fresh.push(now);
  _buckets.set(adminId, fresh);
  return true;
}

// ----------------------------------------------------------------------------
// Disk cache for neutral renders.

function neutralCacheDir(): string {
  if (process.env.VIDHYA_SCENARIO_NEUTRAL_CACHE) return process.env.VIDHYA_SCENARIO_NEUTRAL_CACHE;
  return path.join(process.cwd(), '.data', 'scenarios', '_neutral_cache');
}

function readNeutralCache(concept_id: string, atom_id: string): string | null {
  const file = path.join(neutralCacheDir(), `${concept_id}__${encodeURIComponent(atom_id)}.txt`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

function writeNeutralCache(concept_id: string, atom_id: string, body: string): void {
  const dir = neutralCacheDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${concept_id}__${encodeURIComponent(atom_id)}.txt`), body);
}

// ----------------------------------------------------------------------------

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await checkAdminAuth(req, res);
  if (!user) return;
  const ids = listRunIds();
  sendJSON(res, { runs: ids.map((id) => ({ id })) });
}

async function handleRead(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await checkAdminAuth(req, res);
  if (!user) return;
  const id = req.params?.id;
  if (!id) {
    sendJSON(res, { error: 'missing id' }, 400);
    return;
  }
  try {
    const dir = runDir(id);
    const trial = readTrial(dir);
    sendJSON(res, { trial, digest: digestOf(trial) });
  } catch (err) {
    sendJSON(res, { error: (err as Error).message }, 404);
  }
}

async function handleNeutralRender(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await checkAdminAuth(req, res);
  if (!user) return;
  const id = req.params?.id;
  if (!id) {
    sendJSON(res, { error: 'missing run id' }, 400);
    return;
  }

  const body = (req.body as Record<string, unknown> | undefined) ?? {};
  const atom_id = typeof body.atom_id === 'string' ? body.atom_id : '';
  if (!atom_id) {
    sendJSON(res, { error: 'atom_id required' }, 400);
    return;
  }

  let trial;
  try {
    trial = readTrial(runDir(id));
  } catch (err) {
    sendJSON(res, { error: (err as Error).message }, 404);
    return;
  }
  const concept_id = trial.concept_id;

  // Cache hit? Short-circuit before consuming a rate-limit token.
  const cached = readNeutralCache(concept_id, atom_id);
  if (cached !== null) {
    sendJSON(res, { atom_id, concept_id, body: cached, cached: true });
    return;
  }

  if (!checkRateLimit((user as any).id ?? 'admin')) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'rate_limited', limit_per_hour: RATE_MAX }));
    return;
  }

  // Generate the neutral version. We deliberately call the orchestrator
  // with NEUTRAL_CONTEXT (no student steering) so the side-by-side panel
  // shows what a generic prompt would have produced.
  let neutral;
  try {
    const { generateConcept } = await import('../content/concept-orchestrator/orchestrator');
    const { ALL_CONCEPTS } = await import('../constants/concept-graph');
    const concept = ALL_CONCEPTS.find((c: any) => c.id === concept_id);
    if (!concept) throw new Error(`unknown concept ${concept_id}`);
    const dot_idx = atom_id.indexOf('.');
    const atom_type = atom_id.slice(dot_idx + 1).replace(/-/g, '_');
    const draft = await generateConcept({
      concept_id,
      topic_family: (concept as any).topic_family ?? (concept as any).topic ?? 'generic',
      atom_types: [atom_type as any],
      force: true,
      dry_run: true,
      // NOTE: student_context omitted on purpose — the orchestrator's
      // existing fall-through is "generic prompt", which is exactly the
      // contrast we want to surface.
    });
    neutral = draft.atoms?.[0]?.content ?? '';
  } catch (err) {
    sendJSON(res, { error: `generation failed: ${(err as Error).message}` }, 500);
    return;
  }

  writeNeutralCache(concept_id, atom_id, neutral);
  sendJSON(res, { atom_id, concept_id, body: neutral, cached: false });
}

export const __testing = {
  checkRateLimit,
  resetRateLimit: () => _buckets.clear(),
  RATE_MAX,
  readNeutralCache,
  writeNeutralCache,
};

export const adminScenariosRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/scenarios', handler: handleList },
  { method: 'GET', path: '/api/admin/scenarios/:id', handler: handleRead },
  { method: 'POST', path: '/api/admin/scenarios/:id/neutral-render', handler: handleNeutralRender },
];
