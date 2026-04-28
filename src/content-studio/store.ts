// @ts-nocheck
/**
 * src/content-studio/store.ts
 *
 * Draft persistence + the generation orchestrator + the promotion
 * path that ships an approved draft into the content library.
 *
 * Persistence: append-only JSONL at .data/content-drafts.jsonl,
 * using the createAppendLog helper (same pattern as the teaching
 * turn store and the content-library additions log).
 *
 * Reconcile rule: latest event for a draft_id wins. Edits replace
 * fields; approval / rejection sets the resolved fields. The full
 * event history stays on disk as the audit trail.
 */

import { createAppendLog } from '../lib/append-log';
import { addEntry as addLibraryEntry } from '../modules/content-library';
import type {
  ContentDraft,
  GenerationRequest,
  StudioEvent,
  StudioEventKind,
  StudioDraftStatus,
  SourceAttempt,
  StudioSourceKind,
} from './types';
import { tryUploadsSource } from './sources/uploads';
import { tryWolframSource } from './sources/wolfram';
import { tryUrlExtractSource } from './sources/url-extract';
import { tryLlmSource } from './sources/llm';
import type { AdapterResult } from './sources/uploads';

const DRAFTS_PATH = '.data/content-drafts.jsonl';

const drafts_log = createAppendLog<StudioEvent>({
  path: DRAFTS_PATH,
  isValid: (parsed: any) =>
    parsed && typeof parsed === 'object'
      && typeof parsed.kind === 'string'
      && typeof parsed.draft_id === 'string',
});

// ─── Helpers ──────────────────────────────────────────────────────────

function newDraftId(): string {
  // Same shape as turn_id / entry_id — 'draft_' + 11 base32 chars
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'draft_';
  for (let i = 0; i < 11; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

/**
 * Reconcile the JSONL event stream into current state for each draft.
 * Latest event wins; we walk forward and accumulate.
 */
function reconcile(): Map<string, ContentDraft> {
  const out = new Map<string, ContentDraft>();
  for (const ev of drafts_log.readAll()) {
    if (ev.kind === 'created') {
      if (ev.draft) out.set(ev.draft_id, { ...ev.draft });
      continue;
    }
    const cur = out.get(ev.draft_id);
    if (!cur) continue;   // event for a draft we never saw 'created' for — skip
    if (ev.kind === 'edited' && ev.edits) {
      const e = ev.edits;
      if (e.title !== undefined) cur.title = e.title;
      if (e.explainer_md !== undefined) cur.explainer_md = e.explainer_md;
      if (e.worked_example_md !== undefined) cur.worked_example_md = e.worked_example_md;
      if (e.tags !== undefined) cur.tags = e.tags;
      if (e.exams !== undefined) cur.exams = e.exams;
      if (e.difficulty !== undefined) cur.difficulty = e.difficulty;
      cur.edited_at = ev.at;
      cur.edited_by = ev.edited_by;
    }
    if (ev.kind === 'approved') {
      cur.status = 'approved';
      cur.resolved_at = ev.at;
      cur.resolved_by = ev.approved_by;
      cur.promoted_as = ev.promoted_as;
    }
    if (ev.kind === 'rejected') {
      cur.status = 'rejected';
      cur.resolved_at = ev.at;
      cur.resolved_by = ev.rejected_by;
      cur.rejection_reason = ev.rejection_reason;
    }
    if (ev.kind === 'archived') {
      cur.status = 'archived';
      cur.resolved_at = ev.at;
      cur.resolved_by = ev.archived_by;
    }
  }
  return out;
}

// ─── Read API ─────────────────────────────────────────────────────────

export function getDraft(draft_id: string): ContentDraft | null {
  return reconcile().get(draft_id) ?? null;
}

export function listDrafts(filter?: {
  status?:     StudioDraftStatus;
  concept_id?: string;
}): ContentDraft[] {
  const all = Array.from(reconcile().values());
  let out = all;
  if (filter?.status) out = out.filter(d => d.status === filter.status);
  if (filter?.concept_id) out = out.filter(d => d.concept_id === filter.concept_id);
  // Newest first by generated_at
  out.sort((a, b) => b.generation.generated_at.localeCompare(a.generation.generated_at));
  return out;
}

// ─── Generation orchestrator ──────────────────────────────────────────

/**
 * Walk req.sources_to_try in order. First adapter to return a non-null
 * AdapterResult wins. Earlier failures are recorded in the attempts
 * array so the admin reviewer can see the chain.
 *
 * Returns a freshly-created draft (status='draft'), already persisted.
 */
export async function generateDraft(
  req: GenerationRequest,
  actor_id: string,
): Promise<ContentDraft> {
  const draft_id = newDraftId();
  const start = Date.now();
  const attempts: SourceAttempt[] = [];
  let used_source: StudioSourceKind | null = null;
  let chosen: AdapterResult | null = null;

  for (const src of req.sources_to_try) {
    if (chosen) {
      attempts.push({
        source: src,
        outcome: 'skipped',
        detail: 'a higher-priority source already produced a result',
        duration_ms: 0,
      });
      continue;
    }
    const t0 = Date.now();
    let res: AdapterResult | null = null;
    let outcome: SourceAttempt['outcome'] = 'empty';
    let detail = '';
    try {
      switch (src) {
        case 'uploads':     res = await tryUploadsSource(req, actor_id); break;
        case 'wolfram':     res = await tryWolframSource(req); break;
        case 'url-extract': res = await tryUrlExtractSource(req); break;
        case 'llm':         res = await tryLlmSource(req); break;
        default:
          // Unknown source — record and continue
          attempts.push({
            source: src,
            outcome: 'errored',
            detail: `unknown source kind: ${src}`,
            duration_ms: Date.now() - t0,
          });
          continue;
      }
      if (res) {
        outcome = 'used';
        detail = res.detail;
        chosen = res;
        used_source = src;
      } else {
        outcome = 'empty';
        detail = source_empty_reason(src, req);
      }
    } catch (e: any) {
      outcome = 'errored';
      detail = e?.message ?? 'adapter threw';
    }
    attempts.push({
      source: src,
      outcome,
      detail,
      duration_ms: Date.now() - t0,
    });
  }

  // If nothing produced a body, still create a draft — the admin sees
  // the empty draft + the attempts and can decide to retry, edit a
  // body in by hand, or reject.
  const explainer_md = chosen?.body ?? `# ${req.title}\n\n*(No source produced content. See generation.attempts for why each source returned empty.)*`;
  const worked_example_md = chosen?.worked_example;

  const draft: ContentDraft = {
    draft_id,
    concept_id: req.concept_id,
    title: req.title,
    difficulty: req.difficulty,
    tags: req.tags ?? [],
    exams: req.exams ?? [],
    explainer_md,
    worked_example_md,
    status: 'draft',
    generation: {
      request: req,
      used_source,
      attempts,
      generated_at: new Date().toISOString(),
      duration_ms: Date.now() - start,
    },
  };

  drafts_log.append({
    kind: 'created',
    draft_id,
    at: draft.generation.generated_at,
    draft,
  });

  return draft;
}

function source_empty_reason(src: StudioSourceKind, req: GenerationRequest): string {
  switch (src) {
    case 'uploads':     return req.source_upload_id
                          ? `upload ${req.source_upload_id} has no extracted_text`
                          : `no uploads tagged with concept_id='${req.concept_id}' have extracted_text`;
    case 'wolfram':     return 'wolfram returned no answer (no key configured, query not understood, or timeout)';
    case 'url-extract': return req.source_url
                          ? `URL fetch failed or extracted < 100 chars from ${req.source_url}`
                          : 'no source_url provided';
    case 'llm':         return 'LLM not available (no GEMINI_API_KEY) or returned empty';
    default:            return 'unknown source';
  }
}

// ─── Edit / approve / reject ─────────────────────────────────────────

export function editDraft(
  draft_id: string,
  edits: StudioEvent['edits'],
  edited_by: string,
): ContentDraft | null {
  const cur = getDraft(draft_id);
  if (!cur) return null;
  if (cur.status !== 'draft') {
    throw new Error(`cannot edit draft in status='${cur.status}'`);
  }
  drafts_log.append({
    kind: 'edited',
    draft_id,
    at: new Date().toISOString(),
    edits,
    edited_by,
  });
  return getDraft(draft_id);
}

/**
 * Approve a draft. This:
 *   1. Appends an 'approved' event to the studio log
 *   2. Promotes the draft into the content library by calling
 *      addLibraryEntry. The library's source field is set to 'llm'
 *      if the draft used the LLM source, else 'user' (uploads,
 *      wolfram, url-extract are all human-curated upstream)
 *
 * Returns the now-approved draft. Throws if not in 'draft' status.
 *
 * Promotion uses the library's existing addEntry which validates
 * kebab-case concept_id and required fields; if the draft fails
 * validation (e.g. bad concept_id slipped through) the library
 * throws and we leave the draft unapproved.
 */
export function approveDraft(
  draft_id: string,
  approved_by: string,
): ContentDraft {
  const cur = getDraft(draft_id);
  if (!cur) throw new Error(`draft ${draft_id} not found`);
  if (cur.status !== 'draft') {
    throw new Error(`cannot approve draft in status='${cur.status}'`);
  }

  // Determine library source kind from the draft's used_source
  const lib_source: 'user' | 'llm' = cur.generation.used_source === 'llm' ? 'llm' : 'user';

  // Promote — the library's addEntry will throw on validation
  // failure; we let that propagate so the caller sees a 400.
  addLibraryEntry({
    concept_id: cur.concept_id,
    title: cur.title,
    difficulty: cur.difficulty,
    tags: cur.tags,
    exams: cur.exams,
    explainer_md: cur.explainer_md,
    worked_example_md: cur.worked_example_md,
    added_by: approved_by,
    source: lib_source,
    licence: 'studio-promoted',
    wolfram_checkable: cur.generation.used_source === 'wolfram',
  });

  // Persist the approval event AFTER promotion succeeds. If promotion
  // failed (validation error), the draft stays in 'draft' status and
  // the admin can fix it.
  const now = new Date().toISOString();
  drafts_log.append({
    kind: 'approved',
    draft_id,
    at: now,
    approved_by,
    promoted_as: cur.concept_id,
  });

  return { ...cur, status: 'approved', resolved_at: now, resolved_by: approved_by, promoted_as: cur.concept_id };
}

export function rejectDraft(
  draft_id: string,
  rejected_by: string,
  reason: string,
): ContentDraft {
  const cur = getDraft(draft_id);
  if (!cur) throw new Error(`draft ${draft_id} not found`);
  if (cur.status !== 'draft') {
    throw new Error(`cannot reject draft in status='${cur.status}'`);
  }
  const now = new Date().toISOString();
  drafts_log.append({
    kind: 'rejected',
    draft_id,
    at: now,
    rejected_by,
    rejection_reason: reason,
  });
  return { ...cur, status: 'rejected', resolved_at: now, resolved_by: rejected_by, rejection_reason: reason };
}

// ─── Stats / health ───────────────────────────────────────────────────

export function getStats(): {
  total: number;
  by_status: Record<StudioDraftStatus, number>;
  by_source: Record<StudioSourceKind | 'none', number>;
} {
  const by_status: Record<StudioDraftStatus, number> = { draft: 0, approved: 0, rejected: 0, archived: 0 };
  const by_source: Record<string, number> = { uploads: 0, wolfram: 0, 'url-extract': 0, llm: 0, none: 0 };
  let total = 0;
  for (const d of reconcile().values()) {
    total += 1;
    by_status[d.status] += 1;
    const src = d.generation.used_source ?? 'none';
    by_source[src] = (by_source[src] ?? 0) + 1;
  }
  return { total, by_status, by_source: by_source as any };
}

/**
 * Reset for tests — truncates the log and clears any in-memory state.
 * No in-memory cache to clear today (reconcile reads fresh each call),
 * but exposed for symmetry with the library store.
 */
export function _resetForTests(): void {
  drafts_log.truncate();
}
