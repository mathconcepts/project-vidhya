// @ts-nocheck
/**
 * src/api/content-studio-routes.ts
 *
 * Seven endpoints for the content-studio module:
 *
 *   POST  /api/content-studio/generate              admin only
 *   GET   /api/content-studio/drafts                admin only
 *   GET   /api/content-studio/draft/:id             admin only
 *   PATCH /api/content-studio/draft/:id             admin only
 *   POST  /api/content-studio/draft/:id/approve     admin only
 *   POST  /api/content-studio/draft/:id/reject      admin only
 *   GET   /api/content-studio/underperforming       admin only
 *
 * Auth model:
 *
 *   All endpoints require admin role. Unlike the content library
 *   (where reads are public + writes are admin-or-flagged-teacher),
 *   the studio is admin-only across the board because:
 *     - Drafts can contain unverified LLM output that shouldn't be
 *       browsable until reviewed
 *     - Generation costs LLM tokens; opening it broader without
 *       moderation would be a runaway-cost surface
 *     - There's no analogue to the content_library.user_authoring
 *       flag for studio because we don't have a moderation flow
 *
 *   The POST /generate handler always overrides the request's
 *   actor identity with the authenticated user's id — for the
 *   audit trail and for rate-limit + budget attribution.
 *
 *   The /approve handler propagates library validation failures
 *   as 400 — if the draft has a bad concept_id slug, the library's
 *   addEntry throws, the studio's approveDraft propagates, the
 *   route returns 400 to the admin so they can fix it.
 *
 *   /underperforming is the GBrain feedback hook — manual trigger,
 *   not a scheduled job. Scans recent teaching turns for library
 *   entries with consistently low mastery delta. Returns a list
 *   the admin can use to drive new draft generation. Per the
 *   option-b decision when this surface was scoped: keeping it
 *   manual avoids a job-scheduler dependency and gives operators
 *   control over when scans happen.
 */

import type { ServerResponse } from 'http';
import {
  sendJSON,
  sendError,
  type ParsedRequest,
  type RouteHandler,
} from '../lib/route-helpers';
import { getCurrentUser } from '../auth/middleware';
import {
  generateDraft,
  getDraft,
  listDrafts,
  editDraft,
  approveDraft,
  rejectDraft,
  type GenerationRequest,
  type StudioDraftStatus,
  type StudioSourceKind,
} from '../modules/content-studio';
import { listAllTurns } from '../modules/teaching';

// ─── Helpers ─────────────────────────────────────────────────────────

const ADMIN_ROLES = new Set(['admin', 'owner', 'institution']);

async function requireAdmin(req: ParsedRequest, res: ServerResponse): Promise<{ user: any } | null> {
  const auth = await getCurrentUser(req);
  if (!auth) {
    sendError(res, 401, 'authentication required');
    return null;
  }
  if (!ADMIN_ROLES.has(auth.user.role)) {
    sendError(res, 403, 'admin role required for content-studio');
    return null;
  }
  return { user: auth.user };
}

function isValidConceptId(s: any): boolean {
  return typeof s === 'string' && /^[a-z0-9-]+$/.test(s) && s.length > 0;
}

function isValidDifficulty(d: any): boolean {
  return d === 'intro' || d === 'intermediate' || d === 'advanced';
}

function isValidSourceKind(s: any): boolean {
  return s === 'uploads' || s === 'wolfram' || s === 'url-extract' || s === 'llm';
}

// ─── POST /api/content-studio/generate ───────────────────────────────

async function h_generate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireAdmin(req, res);
  if (!ok) return;
  const body = (req.body as any) || {};

  // Validate the request shape before invoking the orchestrator.
  // Better to refuse bad input here than let the adapters fail
  // mid-cascade.
  if (!isValidConceptId(body.concept_id)) {
    return sendError(res, 400, 'concept_id must be lowercase kebab-case (a-z0-9-)');
  }
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return sendError(res, 400, 'title is required');
  }
  if (!isValidDifficulty(body.difficulty)) {
    return sendError(res, 400, "difficulty must be 'intro' | 'intermediate' | 'advanced'");
  }
  if (!Array.isArray(body.sources_to_try) || body.sources_to_try.length === 0) {
    return sendError(res, 400, 'sources_to_try must be a non-empty array');
  }
  for (const s of body.sources_to_try) {
    if (!isValidSourceKind(s)) {
      return sendError(res, 400, `unknown source kind: '${s}'. Must be one of: uploads, wolfram, url-extract, llm`);
    }
  }
  if (body.source_url !== undefined && typeof body.source_url !== 'string') {
    return sendError(res, 400, 'source_url must be a string');
  }
  if (body.tags !== undefined && !Array.isArray(body.tags)) {
    return sendError(res, 400, 'tags must be an array of strings');
  }

  const gen_req: GenerationRequest = {
    concept_id: body.concept_id,
    title: body.title.trim(),
    difficulty: body.difficulty,
    sources_to_try: body.sources_to_try,
    source_url: body.source_url,
    source_upload_id: body.source_upload_id,
    wolfram_query: body.wolfram_query,
    llm_extra_prompt: body.llm_extra_prompt,
    tags: body.tags ?? [],
    exams: body.exams ?? [],
  };

  try {
    // Use the authenticated admin's user_id as the actor — drives
    // rate-limit + budget attribution AND the audit trail. Don't
    // trust client-supplied actor.
    const draft = await generateDraft(gen_req, ok.user.id);
    sendJSON(res, draft, 201);
  } catch (e: any) {
    sendError(res, 500, `generation failed: ${e?.message ?? 'unknown'}`);
  }
}

// ─── GET /api/content-studio/drafts ──────────────────────────────────

async function h_list_drafts(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireAdmin(req, res);
  if (!ok) return;

  // req.query is URLSearchParams (server.ts line 590)
  const status_filter = req.query?.get?.('status') as StudioDraftStatus | null;
  const concept_filter = req.query?.get?.('concept_id') ?? undefined;

  // Validate the status filter if provided — silently dropping a typo
  // would surface as "no drafts" which is misleading
  if (status_filter && !['draft', 'approved', 'rejected', 'archived'].includes(status_filter)) {
    return sendError(res, 400, "status filter must be one of: 'draft', 'approved', 'rejected', 'archived'");
  }

  const drafts = listDrafts({
    status: status_filter || undefined,
    concept_id: concept_filter,
  });

  sendJSON(res, {
    count: drafts.length,
    drafts,
  });
}

// ─── GET /api/content-studio/draft/:id ───────────────────────────────

async function h_get_draft(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireAdmin(req, res);
  if (!ok) return;
  const id = (req.params as any)?.id;
  if (!id || typeof id !== 'string') {
    return sendError(res, 400, 'draft id required');
  }
  const d = getDraft(id);
  if (!d) {
    return sendError(res, 404, 'draft not found');
  }
  sendJSON(res, d);
}

// ─── PATCH /api/content-studio/draft/:id ─────────────────────────────

async function h_edit_draft(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireAdmin(req, res);
  if (!ok) return;
  const id = (req.params as any)?.id;
  if (!id || typeof id !== 'string') {
    return sendError(res, 400, 'draft id required');
  }
  const body = (req.body as any) || {};

  // Validate edits shape — only allow specific fields, anything else
  // is silently ignored (not an error so a UI can include extra
  // metadata in the body without 400ing)
  const edits: any = {};
  if (body.title !== undefined) {
    if (typeof body.title !== 'string') return sendError(res, 400, 'title must be a string');
    edits.title = body.title;
  }
  if (body.explainer_md !== undefined) {
    if (typeof body.explainer_md !== 'string') return sendError(res, 400, 'explainer_md must be a string');
    edits.explainer_md = body.explainer_md;
  }
  if (body.worked_example_md !== undefined) {
    if (typeof body.worked_example_md !== 'string') return sendError(res, 400, 'worked_example_md must be a string');
    edits.worked_example_md = body.worked_example_md;
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) return sendError(res, 400, 'tags must be an array');
    edits.tags = body.tags;
  }
  if (body.exams !== undefined) {
    if (!Array.isArray(body.exams)) return sendError(res, 400, 'exams must be an array');
    edits.exams = body.exams;
  }
  if (body.difficulty !== undefined) {
    if (!isValidDifficulty(body.difficulty)) {
      return sendError(res, 400, "difficulty must be 'intro' | 'intermediate' | 'advanced'");
    }
    edits.difficulty = body.difficulty;
  }

  if (Object.keys(edits).length === 0) {
    return sendError(res, 400, 'at least one editable field required');
  }

  try {
    const updated = editDraft(id, edits, ok.user.id);
    if (!updated) return sendError(res, 404, 'draft not found');
    sendJSON(res, updated);
  } catch (e: any) {
    // editDraft throws if status is not 'draft'
    return sendError(res, 400, e?.message ?? 'edit failed');
  }
}

// ─── POST /api/content-studio/draft/:id/approve ──────────────────────

async function h_approve(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireAdmin(req, res);
  if (!ok) return;
  const id = (req.params as any)?.id;
  if (!id || typeof id !== 'string') {
    return sendError(res, 400, 'draft id required');
  }
  try {
    const approved = approveDraft(id, ok.user.id);
    sendJSON(res, approved);
  } catch (e: any) {
    // Either:
    //  - draft not in 'draft' status (already approved/rejected/archived)
    //  - library validation failed (bad concept_id, missing fields)
    // Both surface as 400 with the underlying error message.
    return sendError(res, 400, e?.message ?? 'approve failed');
  }
}

// ─── POST /api/content-studio/draft/:id/reject ───────────────────────

async function h_reject(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireAdmin(req, res);
  if (!ok) return;
  const id = (req.params as any)?.id;
  if (!id || typeof id !== 'string') {
    return sendError(res, 400, 'draft id required');
  }
  const body = (req.body as any) || {};
  const reason = body.reason;
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    return sendError(res, 400, 'reason (string) required');
  }
  try {
    const rejected = rejectDraft(id, ok.user.id, reason.trim());
    sendJSON(res, rejected);
  } catch (e: any) {
    return sendError(res, 400, e?.message ?? 'reject failed');
  }
}

// ─── GET /api/content-studio/underperforming ─────────────────────────
//
// GBrain feedback hook. Scans recent teaching turns for library entries
// where students are consistently struggling. Returns a list the admin
// can use to drive new draft generation (regenerate, find a better
// source, edit the live entry).
//
// Manual trigger by design — no scheduled job, no event-driven
// regeneration. Reasons:
//   - Avoids job-scheduler dependency
//   - Operators decide when to scan based on their own cadence
//   - The threshold for "underperforming" is debatable; manual review
//     before action is safer

interface Underperformer {
  concept_id:           string;
  routed_source:        string;
  turn_count:           number;
  /** Average mastery delta as a percentage (negative = students getting worse). */
  avg_mastery_delta_pct: number | null;
  /** Most recent turn that hit this entry — for the admin to investigate. */
  last_turn_at:         string;
}

async function h_underperforming(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireAdmin(req, res);
  if (!ok) return;

  // Configurable thresholds via query params; sensible defaults.
  const min_turns = Number(req.query?.get?.('min_turns') ?? 5);
  const threshold_pct = Number(req.query?.get?.('threshold_pct') ?? -2);
  const limit = Number(req.query?.get?.('limit') ?? 1000);

  if (Number.isNaN(min_turns) || min_turns < 1) {
    return sendError(res, 400, 'min_turns must be a positive integer');
  }
  if (Number.isNaN(threshold_pct)) {
    return sendError(res, 400, 'threshold_pct must be a number');
  }

  // Pull recent turns. Limit is a safety cap — the JSONL log is
  // append-only and could be huge.
  let all_turns;
  try {
    all_turns = listAllTurns(limit);
  } catch (e: any) {
    return sendError(res, 500, `failed to read teaching turns: ${e?.message}`);
  }

  // Group library-served turns by concept_id (from pre_state).
  // The teaching turn doesn't carry the seed/user/llm sub-source —
  // only `routed_source: 'library'` — so the admin sees per-concept
  // performance regardless of which sub-source served. They can
  // look up the concept in /api/content-library/concept/:id to see
  // which sub-source it currently is.
  const groups = new Map<string, {
    routed_source: string;
    turns: typeof all_turns;
    mastery_deltas: number[];
    last_turn_at: string;
  }>();

  for (const t of all_turns) {
    if (t.routed_source !== 'library') continue;
    const concept_id = t.pre_state?.concept_id;
    if (!concept_id) continue;

    let g = groups.get(concept_id);
    if (!g) {
      g = {
        routed_source: 'library',
        turns: [],
        mastery_deltas: [],
        last_turn_at: t.initiated_at ?? '',
      };
      groups.set(concept_id, g);
    }
    g.turns.push(t);
    if (t.initiated_at && t.initiated_at > g.last_turn_at) {
      g.last_turn_at = t.initiated_at;
    }
    // Compute mastery delta where the close event recorded one. Skip
    // turns where we can't measure (no Postgres-backed gbrain → no
    // delta computed).
    const delta_pct = t.mastery_delta?.delta_pct;
    if (typeof delta_pct === 'number') {
      g.mastery_deltas.push(delta_pct);
    }
  }

  // Filter to underperformers — concepts with enough turns and a low
  // average mastery delta
  const underperformers: Underperformer[] = [];
  for (const [concept_id, g] of groups.entries()) {
    if (g.turns.length < min_turns) continue;
    let avg: number | null = null;
    if (g.mastery_deltas.length > 0) {
      avg = g.mastery_deltas.reduce((a, b) => a + b, 0) / g.mastery_deltas.length;
      if (avg > threshold_pct) continue;   // healthy enough; skip
    } else {
      // No measurable mastery deltas — can't classify as underperforming
      // without data. Skip rather than guess.
      continue;
    }
    underperformers.push({
      concept_id,
      routed_source: g.routed_source,
      turn_count: g.turns.length,
      avg_mastery_delta_pct: avg,
      last_turn_at: g.last_turn_at,
    });
  }

  // Sort worst-first so the most-needs-attention rises to the top
  underperformers.sort((a, b) =>
    (a.avg_mastery_delta_pct ?? 0) - (b.avg_mastery_delta_pct ?? 0),
  );

  sendJSON(res, {
    threshold_pct,
    min_turns,
    sample_size: all_turns.length,
    library_turn_count: Array.from(groups.values()).reduce((acc, g) => acc + g.turns.length, 0),
    underperformer_count: underperformers.length,
    underperformers,
    advisory: underperformers.length === 0
      ? 'No underperforming library entries detected. This may mean (a) content is performing well, (b) too few turns to measure, or (c) mastery_delta not populated on closed turns (Postgres-backed gbrain required for delta computation).'
      : `${underperformers.length} library entries with avg mastery delta below ${threshold_pct}%. Consider regenerating drafts via POST /api/content-studio/generate.`,
  });
}

// ─── Route table ─────────────────────────────────────────────────────

export const contentStudioRoutes: Array<{
  method: string;
  path: string;
  handler: RouteHandler;
}> = [
  { method: 'POST',  path: '/api/content-studio/generate',                handler: h_generate },
  { method: 'GET',   path: '/api/content-studio/drafts',                  handler: h_list_drafts },
  { method: 'GET',   path: '/api/content-studio/underperforming',         handler: h_underperforming },
  { method: 'GET',   path: '/api/content-studio/draft/:id',               handler: h_get_draft },
  { method: 'PATCH', path: '/api/content-studio/draft/:id',               handler: h_edit_draft },
  { method: 'POST',  path: '/api/content-studio/draft/:id/approve',       handler: h_approve },
  { method: 'POST',  path: '/api/content-studio/draft/:id/reject',        handler: h_reject },
];
