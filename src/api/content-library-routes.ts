// @ts-nocheck
/**
 * src/api/content-library-routes.ts
 *
 * Three endpoints for the content-library module:
 *
 *   GET  /api/content-library/concepts            (public)
 *   GET  /api/content-library/concept/:id         (public)
 *   POST /api/content-library/concept             (admin, or teacher+ when flag)
 *
 * Auth model:
 *
 *   The library is a content store, not personal data. Reads are
 *   public — a prospective user browsing the demo URL should see
 *   what's available before signing in. This matches the existing
 *   blog / landing-page surfaces.
 *
 *   Writes go through admin by default. The
 *   `content_library.user_authoring` feature flag, when on, broadens
 *   write access to teacher+. Default off because there's no
 *   moderation flow yet — turning it on is opt-in for trusted-
 *   contributor deployments.
 *
 *   The POST handler always overrides `added_by` with the actor's
 *   id — never trust client-supplied identity.
 *
 *   `source: 'seed'` is rejected at the API layer; seeds come from
 *   data/content-library/seed/ at boot, not from POSTs.
 */

import type { ServerResponse } from 'http';
import {
  sendJSON,
  sendError,
  type ParsedRequest,
  type RouteHandler,
} from '../lib/route-helpers';
import { requireRole, getCurrentUser } from '../auth/middleware';
import {
  listSummaries,
  getEntry,
  addEntry,
  type AddEntryRequest,
} from '../modules/content-library';
import { isContentLibraryFeatureEnabled } from '../modules/content-library/feature-flags';

// ─── Read handlers (public) ─────────────────────────────────────────

async function h_list_concepts(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const summaries = listSummaries();
  // Optional query filter: ?source=seed (or user, llm). req.query is a
  // URLSearchParams in production (see server.ts), so use .get().
  const source_filter = req.query?.get?.('source');
  const filtered = source_filter
    ? summaries.filter(s => s.source === source_filter)
    : summaries;
  sendJSON(res, {
    count: filtered.length,
    concepts: filtered,
  });
}

async function h_get_concept(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const id = (req.params as any)?.id;
  if (!id || typeof id !== 'string') {
    return sendError(res, 400, 'concept id required');
  }
  const entry = getEntry(id);
  if (!entry) {
    return sendError(res, 404, `no library entry for concept_id='${id}'`);
  }
  sendJSON(res, entry);
}

// ─── Write handler (admin or teacher+ via flag) ─────────────────────

async function h_add_concept(req: ParsedRequest, res: ServerResponse): Promise<void> {
  // First, get the actor — we need the id even if they're admin-tier.
  const actor = await getCurrentUser(req);
  if (!actor) return sendError(res, 401, 'authentication required');

  // Authorization: admin baseline, OR teacher+ when the flag is on.
  const flag_on = isContentLibraryFeatureEnabled('content_library.user_authoring');
  const role = actor.user.role;
  const is_admin_tier = ['admin', 'owner', 'institution'].includes(role);
  const is_teacher_plus_with_flag = flag_on && role === 'teacher';
  if (!is_admin_tier && !is_teacher_plus_with_flag) {
    if (flag_on) {
      return sendError(res, 403, 'requires admin or teacher role to add library entries');
    }
    return sendError(res, 403,
      'requires admin role to add library entries (set VIDHYA_CONTENT_LIBRARY_USER_AUTHORING=on to allow teachers)');
  }

  const body = (req.body as any) || {};

  // Reject the client trying to claim source=seed. seeds are loaded
  // from data/content-library/seed/ at boot, never accepted via POST.
  if (body.source === 'seed') {
    return sendError(res, 400,
      "source='seed' is reserved for boot-time loaded entries; use 'user' or 'llm'");
  }

  // Default source to 'user' if missing — most POSTs come from a human
  // admin. An LLM script wiring up should explicitly set source='llm'
  // for traceability in the turn log.
  const source: 'user' | 'llm' = body.source === 'llm' ? 'llm' : 'user';

  // Force added_by to actor's identity. Never trust client-supplied.
  // For LLM-tagged adds, the actor is still the admin running the
  // wiring; we annotate the source to distinguish, but the audit
  // trail records the human responsible.
  const added_by = source === 'llm'
    ? `llm:${body.llm_provider ?? 'unknown'} (via ${actor.user.id})`
    : actor.user.id;

  const req_to_store: AddEntryRequest = {
    concept_id: body.concept_id,
    title: body.title,
    difficulty: body.difficulty,
    tags: body.tags,
    exams: body.exams,
    prereqs: body.prereqs,
    explainer_md: body.explainer_md,
    worked_example_md: body.worked_example_md,
    added_by,
    source,
    licence: body.licence,
    wolfram_checkable: body.wolfram_checkable,
  };

  let entry;
  try {
    entry = addEntry(req_to_store);
  } catch (e: any) {
    return sendError(res, 400, e?.message ?? 'invalid entry');
  }

  sendJSON(res, { ok: true, entry }, 201);
}

// ─── Route table ─────────────────────────────────────────────────────

export const contentLibraryRoutes: Array<{
  method: string;
  path: string;
  handler: RouteHandler;
}> = [
  { method: 'GET',  path: '/api/content-library/concepts',     handler: h_list_concepts },
  { method: 'GET',  path: '/api/content-library/concept/:id',  handler: h_get_concept },
  { method: 'POST', path: '/api/content-library/concept',      handler: h_add_concept },
];
