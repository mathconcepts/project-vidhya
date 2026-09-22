/**
 * Explanation Frame — the declared static/variable split for an explanation.
 *
 * ── The problem this exists to solve ────────────────────────────────────
 *
 * Every personalisation mechanism this codebase has today substitutes a
 * WHOLE atom body:
 *
 *   - `stance-variants.ts` swaps in a sibling `.md` file written for a
 *     different learner stance. 606 authored pairs: the same explanation,
 *     written out three times.
 *   - `personalized-regen.ts` regenerates an entire body into
 *     `student_atom_overrides`, database-only, one trigger, 14-day expiry.
 *   - `applyPersonalizedRanking` reorders and, by its own docblock, never
 *     rewrites.
 *
 * Nothing anywhere declares which PART of an explanation is invariant and
 * which part may move. Three consequences follow, and all three are felt:
 *
 *   1. Personalisation costs O(variants x concepts) in authoring. A third
 *      stance, a lower-prior-competency register, or a regional-language
 *      gloss means writing the corpus again. That is what "hardcoded" means
 *      in practice.
 *   2. There is no floor. `ci:variant-agreement` has to police drift with
 *      heuristics — prose-word budgets, byte-identical fences, repeated
 *      4-grams — precisely because no file states what MUST survive a
 *      rewrite.
 *   3. Enrichment is binary. A student with rich signal and a student with
 *      none get two different FILES, not a shared floor plus more help.
 *
 * ── The contract ───────────────────────────────────────────────────────
 *
 * An `ExplanationFrame` is a list of slots. Each slot declares its ROLE and
 * how it is FILLED:
 *
 *   - `static`   — authored once, identical for every learner, always
 *                  rendered. The floor.
 *   - `adaptive` — may be replaced or added by a resolver when the learner's
 *                  signals support it, and ALWAYS declares the static text
 *                  it degrades to.
 *
 * Two guarantees follow, and both are enforced in `contract.ts` rather than
 * left to reviewer discipline:
 *
 *   G1 (floor). Composing a frame against zero signals yields a complete,
 *      correct explanation — every required role present and non-empty.
 *      "Minimum content gives a reasonable explanation" is a property of
 *      the type, not an aspiration.
 *
 *   G2 (monotonic enrichment). A resolver may only replace a slot's static
 *      text or fill an optional slot. It can never delete a required role,
 *      and a resolver returning null is indistinguishable from that
 *      resolver not existing. More signal therefore never produces a WORSE
 *      explanation than less signal.
 *
 * ── What this deliberately is NOT ──────────────────────────────────────
 *
 * Not a tracking surface. Resolvers receive `LearnerSignals` — a plain,
 * caller-supplied value object — and this module never reads a database,
 * never writes one, and adds no schema column (surveillance invariant 1).
 * `StudentContext` (src/personalization/student-context.ts) satisfies
 * `LearnerSignals` structurally; the dependency is deliberately one-way and
 * type-only, so the content path does not drag the personalisation module
 * (or its pool) in behind it.
 *
 * Not a second atom pipeline. A frame composes text that already exists —
 * authored atom bodies, the concept-anchor registry, the curriculum-bridge
 * registry. Generation is a separate, later concern, which is the order the
 * work was explicitly asked for: framework first, content second.
 */

// ============================================================================
// Learner signals
// ============================================================================

/**
 * The signals a resolver may read. A structural subset of `StudentContext`,
 * restated here so `src/content/` does not import `src/personalization/`.
 *
 * Every field is optional on purpose: the zero-signal case is not an error
 * state to guard against, it is the DEFAULT this framework is designed
 * around. An anonymous first-time visitor is the common case on a demo
 * deployment, and they must still get a real explanation.
 */
export interface LearnerSignals {
  /** 'shaken' | 'steady' | 'assured' — drives register, not content. */
  stance?: string | null;
  /** 0..1 mastery of the concept being explained. */
  mastery?: number | null;
  /** Prerequisite concept ids the learner is weak on. */
  shaky_prerequisites?: readonly string[] | null;
  /** Misconception ids tripped recently on this concept. */
  recent_misconceptions?: readonly string[] | null;
  /** Registered knowledge track, e.g. 'TN-HSE-12-MATH'. */
  track_id?: string | null;
  /** 'geometric' | 'algebraic' | 'balanced'. */
  representation_mode?: string | null;
}

/** Zero signals. G1 is stated against exactly this value. */
export const NO_SIGNALS: LearnerSignals = Object.freeze({});

// ============================================================================
// Slots
// ============================================================================

/**
 * Slot roles.
 *
 * REQUIRED roles are the floor, and they are not invented here: they are the
 * research framework's own Micro contract as already encoded in
 * `delivery-length.ts`'s MICRO_ATOM_TYPES, plus `anchor` — the one-line
 * "what is this actually for" that the concept-anchor registry added and
 * that a student with low confidence needs before any notation.
 *
 * OPTIONAL roles are the enrichment surface. Every one of them is backed by
 * a signal that genuinely exists today; none is speculative.
 */
export const REQUIRED_ROLES = [
  'anchor',
  'core_idea',
  'worked_example',
  'trap',
  'check',
] as const;

export const OPTIONAL_ROLES = [
  'prerequisite_bridge',
  'board_bridge',
  'misconception_callout',
] as const;

export type RequiredRole = (typeof REQUIRED_ROLES)[number];
export type OptionalRole = (typeof OPTIONAL_ROLES)[number];
export type SlotRole = RequiredRole | OptionalRole;

export const ALL_ROLES: readonly SlotRole[] = Object.freeze([
  ...REQUIRED_ROLES,
  ...OPTIONAL_ROLES,
]);

export function isRequiredRole(r: string): r is RequiredRole {
  return (REQUIRED_ROLES as readonly string[]).includes(r);
}

export interface Slot {
  /** Stable id, unique within the frame. */
  id: string;
  role: SlotRole;
  /**
   * The authored text for this slot, rendered when no resolver applies.
   *
   * Required roles must carry non-empty text — that is G1. Optional roles
   * may carry '' (the slot simply does not render), which is how "nothing
   * to say unless the learner needs it" is expressed without a null.
   */
  static_text: string;
  /**
   * Resolver ids that MAY fill this slot, in priority order. First
   * non-null wins. Empty (the default) makes the slot purely static.
   */
  adaptive?: readonly string[];
}

export interface ExplanationFrame {
  /** Locked at 1. A shape change ships as version 2, never in place. */
  version: 1;
  concept_id: string;
  slots: readonly Slot[];
}

// ============================================================================
// Resolvers
// ============================================================================

export interface ResolverContext {
  concept_id: string;
  /** The slot being filled, so a resolver can key alternates by slot. */
  slot_id: string;
  role: SlotRole;
  signals: LearnerSignals;
  /** The slot's own authored text, so a resolver can extend rather than replace. */
  static_text: string;
}

export interface SlotResolver {
  id: string;
  /** Roles this resolver is allowed to fill. Checked at registration. */
  roles: readonly SlotRole[];
  /** One line on what signal it reads, surfaced by the admin readout. */
  reads: string;
  /**
   * Returns replacement text, or null to decline.
   *
   * Declining is normal and must stay cheap: a resolver with no signal to
   * act on returns null and the slot renders its static text. A resolver
   * MUST NOT return '' to mean "remove this slot" — that would break G2, and
   * `compose` treats an empty string from a resolver as a decline.
   */
  resolve(ctx: ResolverContext): string | null;
}

// ============================================================================
// Composition result
// ============================================================================

export interface SlotResolution {
  slot_id: string;
  role: SlotRole;
  text: string;
  source: 'static' | 'adaptive';
  /** Which resolver filled it, when source is 'adaptive'. */
  resolver_id?: string;
}

export interface ComposedExplanation {
  concept_id: string;
  slots: readonly SlotResolution[];
  /**
   * How many slots a resolver actually filled. 0 is the floor and is always
   * a complete explanation; higher is more resonant, never more correct.
   * This is the number an experiment groups by.
   */
  enrichment_level: number;
}
