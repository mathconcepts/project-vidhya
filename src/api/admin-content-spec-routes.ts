/**
 * src/api/admin-content-spec-routes.ts
 *
 * Read-only admin REST surface over docs/content-spec/ (see
 * src/content/atomic-topic-spec.ts) — the founder's per-subtopic
 * content-generation specification: recommended hooks, base sequence,
 * delta slots, quality gates, evidence status for all 116 GATE
 * Engineering Mathematics atomic topics.
 *
 * This is what makes "content generation might refer to this all the
 * time" (live QA feedback #5) an operational reality rather than a
 * filed-away upload: an operator planning a run (RunLauncher,
 * BlueprintsPage) can pull up the exact recommended hooks/sequence for a
 * topic before launching generation, without leaving the app.
 *
 * Every topic and the mapping endpoint also surface the verified
 * atomic_id -> concept_id crosswalk (src/content/atomic-concept-map.ts) —
 * the two id spaces are related but NOT identical (see that file's header
 * for exactly where and why they diverge); `concept_id` is null on a
 * topic this app's concept graph doesn't cover yet, never guessed.
 *
 *   GET /api/admin/content-spec/atomic-topics             list (optional ?domain=)
 *   GET /api/admin/content-spec/atomic-topics/:atomicId    single topic
 *   GET /api/admin/content-spec/mapping                    coverage report
 *
 * No DB — pure file read via atomic-topic-spec.ts's memoized loader.
 * Never mutated through this surface; the spec's home is
 * docs/content-spec/, edited and reviewed like any other repo content.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { loadAtomicTopicSpecs, getAtomicTopicSpec } from '../content/atomic-topic-spec';
import { getConceptIdForAtomicId, mappingCoverage, UNMAPPED_ATOMIC_IDS } from '../content/atomic-concept-map';

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

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  const domain = req.query.get('domain');
  const all = [...loadAtomicTopicSpecs().values()];
  const filtered = domain ? all.filter((t) => t.structure.domain === domain) : all;
  const domains = [...new Set(all.map((t) => t.structure.domain))].sort();
  sendJSON(res, {
    count: filtered.length,
    domains,
    topics: filtered.map((t) => ({
      atomic_id: t.atomic_id,
      domain: t.structure.domain,
      atomic_subtopic: t.structure.atomic_subtopic,
      template_family: t.structure.template_family,
      evidence_status: t.structure.evidence_status,
      concept_id: getConceptIdForAtomicId(t.atomic_id),
    })),
  });
}

async function handleGet(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  const atomicId = req.params.atomicId;
  const spec = getAtomicTopicSpec(atomicId);
  if (!spec) {
    sendJSON(res, { error: 'Not Found', message: `No content spec for atomic_id "${atomicId}"` }, 404);
    return;
  }
  const conceptId = getConceptIdForAtomicId(atomicId);
  sendJSON(res, {
    ...spec,
    concept_id: conceptId,
    unmapped_reason: conceptId ? null : (UNMAPPED_ATOMIC_IDS[atomicId] ?? null),
  });
}

/** GET /api/admin/content-spec/mapping — the honest atomic_id<->concept_id coverage report. */
async function handleMapping(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  sendJSON(res, mappingCoverage());
}

export const adminContentSpecRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/content-spec/atomic-topics',            handler: handleList },
  { method: 'GET', path: '/api/admin/content-spec/atomic-topics/:atomicId',  handler: handleGet },
  { method: 'GET', path: '/api/admin/content-spec/mapping',                  handler: handleMapping },
];
