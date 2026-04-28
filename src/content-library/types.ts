// @ts-nocheck
/**
 * src/content-library/types.ts
 *
 * Schema for the content library — a runtime-augmentable, DB-free
 * store of teaching materials (explainers + worked examples)
 * keyed by concept_id.
 *
 * Two layers feed the library at runtime:
 *
 *   1. SEED  — JSON files committed to data/content-library/seed/
 *              Read-only, ships with the codebase. The "predefined"
 *              part of the original request: a fresh deployment has
 *              something to teach with on day one.
 *
 *   2. ADDITIONS — append-only JSONL log at
 *                  .data/content-library-additions.jsonl
 *                  When admins (and, behind a feature flag, others)
 *                  POST a new entry, it appends here. Survives
 *                  restarts on a writable disk.
 *
 * Design constraint repeated from the request: avoid DB dependencies.
 * Both layers are flat-file. The store builds an in-memory index at
 * boot for O(1) lookup; total memory is a few MB even for thousands
 * of concepts.
 *
 * The schema mirrors the existing community-content meta.yaml shape
 * used in modules/project-vidhya-content/concepts/. The two surfaces
 * stay separate (the subrepo is for git-committed external
 * contributions; the library is for runtime-augmentable starter
 * content + LLM/admin additions), but the field set is the same so
 * concept files can move between them without translation.
 */

/**
 * Difficulty band. Matches the values present in the existing
 * `modules/project-vidhya-content/concepts/<id>/meta.yaml` files
 * — don't invent a parallel vocabulary.
 */
export type LibraryDifficulty =
  | 'intro'
  | 'intermediate'
  | 'advanced';

/**
 * Where this entry came from.
 *   seed       — committed in data/content-library/seed/, ships with repo
 *   user       — an admin POSTed it via /api/content-library/concept
 *   llm        — an LLM was wired up to POST it (deployment-specific)
 */
export type LibrarySource = 'seed' | 'user' | 'llm';

/**
 * A single content-library entry. One concept_id → one entry.
 *
 * If you want multiple difficulty levels for the same concept, give
 * them different concept_ids (e.g. derivatives-intro vs
 * derivatives-advanced). This keeps lookup O(1) and avoids the
 * "which one for this student?" question becoming a ranking problem.
 * Personalisation by difficulty band still works — the
 * `findEntries(...)` helper filters by difficulty.
 */
export interface LibraryEntry {
  concept_id: string;
  title: string;
  difficulty: LibraryDifficulty;
  /** Subjects/themes — calculus, polar-form, etc. Free-text, no enum. */
  tags: string[];
  /** Exam IDs this entry is relevant to. Empty array = exam-agnostic. */
  exams: string[];
  /** Concept_ids the student should know first. */
  prereqs?: string[];
  /** Markdown explainer body. */
  explainer_md: string;
  /** Markdown worked-example body (optional but encouraged). */
  worked_example_md?: string;
  /** Where the entry came from in the system. */
  source: LibrarySource;
  /** When the entry first appeared. ISO 8601. */
  added_at: string;
  /** Identity of the contributor — user_id, 'system', or 'llm:<provider>'. */
  added_by: string;
  /** SPDX-style identifier or a known token like "MIT", "shipped-default". */
  licence: string;
  /** Whether this concept is amenable to Wolfram cross-checking. */
  wolfram_checkable: boolean;
}

/**
 * Compact summary used by /api/content-library/concepts (the list
 * endpoint). Avoids shipping the full markdown bodies in list views.
 */
export interface LibrarySummary {
  concept_id: string;
  title: string;
  difficulty: LibraryDifficulty;
  source: LibrarySource;
  tags: string[];
  exams: string[];
  has_worked_example: boolean;
}

/**
 * Filters for findEntries(). All fields optional; absent means
 * "don't filter on this".
 */
export interface FindEntriesOptions {
  /**
   * Personalisation hint: filter by difficulty band derived from
   * the student's mastery on the concept. Caller computes the band
   * (e.g. mastery < 0.3 → 'intro', 0.3..0.7 → 'intermediate',
   * > 0.7 → 'advanced').
   */
  prefer_difficulty?: LibraryDifficulty;
  /** Filter to entries tagged with one of these exam IDs. */
  exam_id?: string;
  /** Filter to entries tagged with all of these tags. */
  tags?: string[];
}

/**
 * What a POST-add request looks like, server-side. Some fields are
 * filled in by the store (added_at, source) — caller doesn't supply.
 */
export interface AddEntryRequest {
  concept_id: string;
  title: string;
  difficulty: LibraryDifficulty;
  tags: string[];
  exams?: string[];
  prereqs?: string[];
  explainer_md: string;
  worked_example_md?: string;
  added_by: string;
  /** 'user' or 'llm' — 'seed' is reserved for the boot loader. */
  source: 'user' | 'llm';
  licence?: string;          // defaults to 'user-contributed' if absent
  wolfram_checkable?: boolean;
}
