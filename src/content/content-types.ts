/**
 * Content module types — consolidated.
 *
 * This file is the single source of truth for the content module's domain types
 * (RouteRequest, RouteResult, ResolvedContent, etc.). Pre-2026-04 these types
 * were defined inline in router.ts and resolver.ts; consolidating here lets
 * engineers find them in one place and lets the index.ts re-export them as the
 * module's public surface.
 *
 * For Intent (the closed enum of student request types), see intent-classifier.ts.
 * For blog/marketing types, see blog-types.ts.
 */

import type { Intent } from './intent-classifier';

// ─── Sources the router can pull from ────────────────────────────────────

export type Source =
  | 'subscription'        // user-subscribed community bundle
  | 'library'             // content-library module (seeds + additions)
  | 'bundle'              // shipped default bundle (legacy)
  | 'cache'               // server-side cache
  | 'uploads'             // user's own uploads (intent-gated)
  | 'uploads-blended'     // user's uploads, surfaced alongside primary source
  | 'community'           // community repo (unsubscribed)
  | 'kag'                 // KAG corpus (pre-verified, Wolfram-grounded)
  | 'generated'           // LLM live generation
  | 'wolfram'             // Wolfram live query
  | 'declined';           // intentionally declined

// ─── Session mode (knowledge vs exam-prep cadence) ───────────────────────

/**
 * The cadence/strategy mode for this request.
 *
 *   - 'knowledge'  : broad explanation, no exam pressure (default)
 *   - 'exam-prep'  : exam-aligned filtering, prioritize syllabus weight
 *   - 'revision'   : weakness-weighted, recall-driven
 *
 * Defaults to 'knowledge' when omitted on RouteRequest.
 */
export type SessionMode = 'knowledge' | 'exam-prep' | 'revision';

// ─── Router request/response ─────────────────────────────────────────────

/**
 * A request flowing into the content router.
 *
 * Callers compute personalisation hints (preferred_difficulty, preferred_exam_id)
 * from the gbrain student model and pass them in. The router stays decoupled.
 */
export interface RouteRequest {
  /** Stable user id (hashed before any signal emission). */
  user_id: string;
  /** Raw student input. */
  text: string;
  /** Pre-resolved concept id, if the caller already knows it (e.g. from URL). */
  concept_id?: string;
  /** Per-request opt-in for live LLM generation (Tier 6). */
  allow_generation?: boolean;
  /** Per-request opt-in for Wolfram (Tier 7). */
  allow_wolfram?: boolean;
  /**
   * Cadence mode for this request. Defaults to 'knowledge' when omitted.
   * See {@link SessionMode}.
   */
  session_mode?: SessionMode;
  /** Days until the student's next exam, if known. Used by CadenceStrategy. */
  exam_proximity_days?: number;
  /** Difficulty hint, usually masteryToDifficulty(mastery). */
  preferred_difficulty?: 'intro' | 'intermediate' | 'advanced';
  /** The student's current exam id (e.g. 'EXM-BITSAT-MATH-SAMPLE'). */
  preferred_exam_id?: string;
}

/**
 * Why a tier was skipped or why a route declined to deliver content.
 * Surfaced via {@link ResolvedContent.declined_reason} and the debug trace.
 */
export type DeclinedReason =
  | 'rag-threshold-not-met'
  | 'wolfram-timeout'
  | 'wolfram-limit-hit'
  | 'generation-disabled'
  | 'no-concept-match'
  | 'verifier-timeout'
  | 'all-verifiers-failed';

export interface RouteResult {
  ok: boolean;
  intent: Intent;
  source: Source;
  content: string | null;
  concept_id: string | null;
  source_ref: string | null;
  licence: string | null;
  /** Always present — the disclosure string the student will see. */
  disclosure: string;
  considered: Source[];
  rejected_because: Record<string, string>;
  reason?: string;
  /** Optional blended upload payload when concept matches user's uploads. */
  blended_uploads?: Array<{ id: string; filename: string; note?: string }>;
}

// ─── Resolver (verification cascade) ─────────────────────────────────────

export type ContentSource =
  | 'tier-0-bundle-exact'
  | 'tier-0-explainer'
  | 'tier-1-rag'
  | 'tier-2-generated'
  | 'tier-3-wolfram-verified'
  | 'miss';

export interface ResolvedContent {
  source: ContentSource;
  problem?: unknown;
  explainer?: unknown;
  confidence: number;
  latency_ms: number;
  wolfram_verified?: boolean;
  cost_estimate_usd: number;
  /**
   * When source === 'miss' or a tier was skipped, why?
   * Set by the tier that declined; aggregated in the debug trace.
   */
  declined_reason?: DeclinedReason;
  /**
   * Async pedagogy score, set when PedagogyReviewer has reviewed this content.
   * Absent on first delivery; populated in subsequent cache hits after async review.
   * Range: 0-1, where 1 is the rubric ceiling.
   */
  pedagogy_score?: number;
}

// ─── ContentAtom v2 (typed atomic content units) ─────────────────────────

/**
 * Bloom's Taxonomy levels (numeric so comparisons work, e.g. `bloom_level >= 3`).
 * 1 = remember, 2 = understand, 3 = apply, 4 = analyze, 5 = evaluate, 6 = create.
 */
export type BloomLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Pedagogical purpose of an atom — orthogonal to modality.
 *
 *   - hook              : grab attention; usually 1-2 sentences with a question or surprise
 *   - intuition         : informal "why this works" before formalism
 *   - formal_definition : the precise statement
 *   - visual_analogy    : geometric/diagrammatic intuition
 *   - worked_example    : step-by-step solution; supports scaffolding fade
 *   - micro_exercise    : one-question check; produces recall_correct signal
 *   - common_traps      : enumeration of mistakes students make; cohort callout target
 *   - retrieval_prompt  : flashcard-style recall; produces recall_correct signal
 *   - interleaved_drill : multi-concept drill; used in solidifying tier
 *   - mnemonic          : memory device
 *   - exam_pattern      : exam-specific cue/format; gated by preferred_exam_id
 */
export type AtomType =
  | 'hook'
  | 'intuition'
  | 'formal_definition'
  | 'visual_analogy'
  | 'worked_example'
  | 'micro_exercise'
  | 'common_traps'
  | 'retrieval_prompt'
  | 'interleaved_drill'
  | 'mnemonic'
  | 'exam_pattern';

/**
 * Animation preset names — declarative mapping in LessonPage.
 * Each AtomType gets a default in ATOM_ANIMATION_MAP; atoms can override
 * via frontmatter `animation_preset`.
 */
export type AnimationPreset =
  | 'fade-in'
  | 'slide-up'
  | 'reveal-highlight'
  | 'step-unfold'
  | 'scale-in'
  | 'bounce-alert'
  | 'shake-then-settle'
  | 'flip-reveal';

/**
 * Encoding modality, orthogonal to AtomType. A worked_example can be visual
 * or text; a hook can be mnemonic or drill. Phase 1 ignores this; Phase 2
 * uses it for modality-profile personalisation.
 */
export type Modality = 'visual' | 'text' | 'mnemonic' | 'drill';

/**
 * One atomic unit of content. Authored as a markdown file under
 * `concepts/{concept_id}/atoms/*.md` with YAML frontmatter.
 *
 * Loaded by atom-loader.ts; selected by PedagogyEngine; rendered by LessonPage.
 *
 * Engagement enrichment (engagement_count, last_recall_correct, cohort_error_pct)
 * is added by lesson-routes.ts AFTER PedagogyEngine.selectAtoms() returns —
 * the engine itself stays sync and pure.
 */
export interface ContentAtom {
  // ── Required (frontmatter) ─────────────────────────────────────────────
  id: string;                           // e.g. "calculus-derivatives.worked-example.product-rule"
  concept_id: string;
  atom_type: AtomType;
  bloom_level: BloomLevel;
  /** Serve when student mastery >= this value (0.0–1.0). */
  difficulty: number;
  /** ["*"] = universal eligibility; or ["EXM-GATE-CS"] for exam-specific. */
  exam_ids: string[];
  /** Markdown body (after frontmatter). */
  content: string;

  // ── Optional (frontmatter) ─────────────────────────────────────────────
  /** Only honoured when atom_type === 'worked_example'. */
  scaffold_fade?: boolean;
  /** Override default ATOM_ANIMATION_MAP preset. */
  animation_preset?: AnimationPreset;
  modality?: Modality;
  /** Only on common_traps atoms — links to a related micro_exercise for cohort signal. */
  tested_by_atom?: string;
  retention_tags?: string[];
  estimated_minutes?: number;
  depth_weight?: number;

  // ── Server-side enrichment (added by lesson-routes.ts) ────────────────
  engagement_count?: number;
  last_recall_correct?: boolean | null;
  cohort_error_pct?: number;
  cohort_n_seen?: number;

  // ── Concept-orchestrator v1 enrichment (added by atom-loader extensions)
  /** ISO timestamp of the active atom version's generated_at. The frontend
   *  shows the "Improved" badge when this is newer than the student's
   *  last_seen_at for the atom. Populated by applyImprovedSince(). */
  improved_since?: string;
  /** Plain-English reason copy for the Improved tooltip. From the
   *  active version's atom_versions.improvement_reason field. */
  improvement_reason?: string | null;
  /** True when the served content is a per-student variant from
   *  student_atom_overrides instead of the canonical atom. */
  is_student_override?: boolean;
}

/**
 * Session-local context held in-memory per request. NEVER persisted to
 * `student_models` table. Reset when a new session starts.
 *
 * E5 (Error Streak Modality Switch) reads error_streak; resets on correct answer.
 */
export interface SessionContext {
  error_streak: number;
  last_error_atom_type: AtomType | null;
  /** Mirrored from RouteRequest.exam_proximity_days for E6 convenience. */
  exam_proximity_days?: number;
}

