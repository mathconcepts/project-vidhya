// @ts-nocheck
/**
 * src/content-studio/types.ts
 *
 * Schema for the content-studio module — admin-driven content
 * generation with a draft → review → approve workflow.
 *
 * A ContentDraft is what the studio produces. It looks like a
 * LibraryEntry with two extra concepts:
 *
 *   1. status — drafts are not live until promoted. The library only
 *      sees approved drafts (which become 'user' or 'llm' source
 *      additions on promotion).
 *
 *   2. generation — how this draft was made. Records the source
 *      adapter chain that produced it, so an admin reviewing a
 *      draft can see "this came from URL X plus an LLM cleanup pass"
 *      and trust accordingly.
 *
 * Drafts persist to .data/content-drafts.jsonl (separate from the
 * library's additions log). Approved drafts get copied into the
 * library via promoteToLibrary(); the draft record itself stays in
 * the studio log as the audit trail.
 */

/**
 * Where the draft body came from.
 *
 *   uploads      — admin's previously-uploaded files (PDFs, images,
 *                  text). Free, highest fidelity if the upload is
 *                  on-topic.
 *   wolfram      — verified-correct math via Wolfram Alpha. Useful
 *                  for problem statements or symbolic results, not
 *                  for prose explainers.
 *   url-extract  — admin-supplied URL, fetch + extract main content.
 *                  No crawling, no allowlist (admin is trusted).
 *   llm          — last-resort generation via an LLM provider. Lowest
 *                  trust; the draft is marked accordingly so the
 *                  admin reviews carefully.
 *
 * Each adapter returns null if it can't produce anything; the
 * orchestrator falls through to the next source.
 */
export type StudioSourceKind =
  | 'uploads'
  | 'wolfram'
  | 'url-extract'
  | 'llm';

/**
 * Lifecycle states for a draft.
 *
 *   draft     — just generated, awaiting admin review
 *   approved  — admin approved + promoted into the content library
 *   rejected  — admin rejected; the draft stays in the log for audit
 *   archived  — superseded by a newer draft for the same concept_id
 *
 * Forward-only transitions; the JSONL log keeps each transition.
 */
export type StudioDraftStatus =
  | 'draft'
  | 'approved'
  | 'rejected'
  | 'archived';

/**
 * What the admin requested when they kicked off generation.
 * Recorded on the draft so a reviewer can see the original intent.
 */
export interface GenerationRequest {
  concept_id:        string;
  title:             string;
  difficulty:        'intro' | 'intermediate' | 'advanced';
  /**
   * Sources to try, in priority order. The orchestrator walks the
   * list and returns the first non-null result. Admin chooses the
   * order; default in the UI is uploads → wolfram → url-extract →
   * llm because that's free → verified → admin-curated → last-resort.
   */
  sources_to_try:    StudioSourceKind[];
  /** For url-extract: the URL to fetch. Required if 'url-extract' is in sources_to_try. */
  source_url?:       string;
  /** For uploads: a specific upload_id to consult. If absent, all uploads tagged with concept_id are tried. */
  source_upload_id?: string;
  /** For wolfram: the math query. If absent, defaults to "explain {title}". */
  wolfram_query?:    string;
  /**
   * For llm: extra context. The orchestrator builds a base prompt;
   * this string is appended to it. Useful for "make it more
   * advanced" or "include more worked examples" steering.
   */
  llm_extra_prompt?: string;
  /** Tags for the resulting library entry. */
  tags:              string[];
  /** Exam IDs the entry is relevant to. */
  exams?:            string[];
}

/**
 * Per-source attempt record. The orchestrator records every source
 * it tried and the outcome — succeeded, returned null, or threw.
 * Admin can see the full chain in the review UI.
 */
export interface SourceAttempt {
  source:        StudioSourceKind;
  outcome:       'used' | 'empty' | 'errored' | 'skipped';
  /** Brief detail; full body lives elsewhere if used */
  detail:        string;
  duration_ms:   number;
}

/**
 * The draft record itself. A LibraryEntry-like record plus generation
 * metadata.
 */
export interface ContentDraft {
  draft_id:           string;       // 'draft_<base32>'
  concept_id:         string;
  title:              string;
  difficulty:         'intro' | 'intermediate' | 'advanced';
  tags:               string[];
  exams:              string[];
  /** The body that will become explainer_md when promoted. */
  explainer_md:       string;
  /** Optional worked example. */
  worked_example_md?: string;
  status:             StudioDraftStatus;
  generation: {
    request:          GenerationRequest;
    /** The source that produced the body that's in this draft. */
    used_source:      StudioSourceKind | null;
    /** Every source attempted, in order. */
    attempts:         SourceAttempt[];
    /** When generation completed. */
    generated_at:     string;
    /** Total wall time across all source attempts. */
    duration_ms:      number;
  };
  /** When the draft was last edited by an admin (PATCH). null if never edited. */
  edited_at?:         string;
  /** Who edited last. */
  edited_by?:         string;
  /** When the draft was approved/rejected/archived. */
  resolved_at?:       string;
  /** Who resolved it. */
  resolved_by?:       string;
  /** When approved, the library concept_id this got promoted as (usually equal to draft.concept_id). */
  promoted_as?:       string;
  /** When rejected, the admin's reason. */
  rejection_reason?:  string;
}

/**
 * Append-log event types. Each forward transition writes one line.
 *
 *   created   — initial draft generation completed
 *   edited    — admin PATCHed the draft body
 *   approved  — admin approved + promoted to library
 *   rejected  — admin rejected
 *   archived  — superseded by another draft for the same concept
 *
 * Reconcile rule: latest event for a draft_id wins. If a draft was
 * edited then approved, the reconciled state is approved with
 * the latest body.
 */
export type StudioEventKind = 'created' | 'edited' | 'approved' | 'rejected' | 'archived';

export interface StudioEvent {
  kind:       StudioEventKind;
  draft_id:   string;
  at:         string;
  /** For 'created' — the full ContentDraft record. */
  draft?:     ContentDraft;
  /** For 'edited' — the new body fields. */
  edits?:     {
    title?:               string;
    explainer_md?:        string;
    worked_example_md?:   string;
    tags?:                string[];
    exams?:               string[];
    difficulty?:          'intro' | 'intermediate' | 'advanced';
  };
  edited_by?: string;
  /** For 'approved' — the actor + the library entry promoted to. */
  approved_by?:  string;
  promoted_as?:  string;
  /** For 'rejected' — the actor + reason. */
  rejected_by?:  string;
  rejection_reason?: string;
  /** For 'archived' — what superseded it. */
  archived_by?:    string;
  superseded_by?:  string;
}
