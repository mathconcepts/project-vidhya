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
