/**
 * src/personalization/types.ts
 *
 * Shared types for the PersonalizedSelector. The selector is a TRANSFORM:
 * given a list of atoms returned from loadConceptAtoms() and a context,
 * it returns the same atoms reordered (and possibly filtered).
 *
 * Locked: 5-layer weighted-sum scoring + dedup hard-filter (eng review).
 *
 * Surveillance-cliff invariants enforced by tests in this module:
 *   - No new schema columns named personalized_*, tracked_*, behavior_*
 *   - Realtime layer's only state is in-memory (no INSERT INTO from
 *     realtime-nudge.ts)
 *   - No public route exposes the per-atom scores
 *   - No frontend imports anything from src/personalization/
 *
 * The student SEES outcomes, not labels. The selector is invisible.
 */

/** Subset of fields we read off the existing ContentAtom shape. */
export interface AtomShape {
  id: string;
  concept_id: string;
  atom_type: string;
  /**
   * Optional: target_misconception is only present on atoms generated
   * via the orchestrator (PR #28+). Older / scraped atoms lack this.
   * The user-error-match scorer falls through to neutral (0) when missing.
   */
  target_misconception?: string | null;
}

/**
 * The session-scoped, request-scoped context the selector needs. All
 * queries the selector runs are derived from this — keep the surface
 * small so the dedup invariant test ("no INSERT INTO from realtime")
 * can be verified by static read of the scorer module imports.
 */
export interface RankingContext {
  session_id: string;
  /** UUID of the student (from student_model.user_id). May be null for
   * anonymous sessions; the user-mastery and user-error layers degrade
   * to neutral (0) in that case. */
  student_id: string | null;
  concept_id: string;
  exam_pack_id: string;

  /** A/B treatment bucket. 'control' returns atoms unchanged. */
  ab_bucket: 'control' | 'treatment';

  /**
   * Realtime signals — passed in by the caller, computed in-process,
   * NEVER persisted. The shape is intentionally narrow: anything that
   * would feel surveillance-y goes here and dies with the request.
   */
  realtime?: {
    /** Atoms the student has SEEN this session (in-memory dedup). */
    seen_this_session?: Set<string>;
    /** Was the student's last attempt correct? Drives "warm-up vs push" nudge. */
    last_correct?: boolean;
    /** Local hour of day (0-23). Drives gentle pace nudge — don't push hard at 2am. */
    local_hour?: number;
  };
}

export interface ScoredAtom {
  atom: AtomShape;
  /** Sum of all layer contributions in [0, 1]. */
  score: number;
  /** Per-layer contribution (debug only — never exposed to students). */
  layers: {
    syllabus: number;
    exam: number;
    cohort: number;
    user_mastery: number;
    user_error: number;
    realtime: number;
  };
  /** True when this atom got hard-dropped by dedup. */
  dropped_by_dedup: boolean;
  /** Reason for the drop, if any (debug only). */
  drop_reason?: string;
}

/**
 * The selector's public interface.
 *
 * Returns atoms RE-ORDERED by score (descending), with dedup-dropped
 * atoms excluded. Caller can take .slice(0, N) for top-N.
 *
 * For ab_bucket='control', returns the input unchanged. The selector
 * is the sole behavioral difference between control and treatment.
 */
export type PersonalizedSelectorFn = (
  atoms: AtomShape[],
  ctx: RankingContext,
) => Promise<AtomShape[]>;

// ============================================================================
// Layer weights (locked from eng review)
// ============================================================================
//
// Total = 1.0 across the 6 positive-signal layers. Dedup is a HARD floor
// (atom dropped entirely), not a weight.

export const LAYER_WEIGHTS = Object.freeze({
  syllabus: 0.10,
  exam: 0.05,
  cohort: 0.30,
  user_mastery: 0.30,
  user_error: 0.15,
  realtime: 0.10,
}) as Readonly<Record<keyof ScoredAtom['layers'], number>>;
