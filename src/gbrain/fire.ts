/**
 * src/gbrain/fire.ts — FIRe-lite credit propagation (T11 / Milestone B2).
 *
 * FIRe = "Fractional Implicit Repetition" (Skycak). A random problem on an
 * advanced concept X implicitly practices whatever X "encompasses" — e.g.
 * an eigenvalues problem implicitly exercises the determinant computation
 * inside it. `data/curriculum/gate-ma.yml`'s `encompasses: [{id, weight}]`
 * edges (loaded via `src/constants/concept-graph.ts`, T11/B1) declare
 * those relationships for the 26 linear-algebra concepts.
 *
 * This module is PURE — no DB, no clock ownership (the caller passes
 * `now`), no I/O. `src/gbrain/student-model-pg.ts`'s `update()` transaction
 * is the only caller that persists the result, gated on
 * `process.env.VIDHYA_FIRE === 'on'`.
 *
 * Mechanism (ENG-D4.3 — pinned, do not "improve" without re-reading this):
 * FSRS has NO fractional rating API (`Rating = 1|2|3|4` only), so credit is
 * NOT expressed as a fake in-between rating. Instead:
 *
 *   CREDIT (attempt correct, flows DOWN the encompassing edges — from the
 *   attempted concept toward what it encompasses): blend the card's
 *   stability toward a HYPOTHETICAL good review (`reviewCard(card, 3,
 *   now)`), discounted by `credit × CREDIT_DISCOUNT`. `lastReviewAt` is
 *   left UNCHANGED — an implicit review doesn't reset the review clock,
 *   it just makes the existing schedule a little more generous, which is
 *   exactly why it's discounted rather than treated as a real review.
 *   `dueAt` is recomputed from the (unchanged) `lastReviewAt` plus the new
 *   stability's retention interval, because `recallProbability` reads
 *   `stability` (not `dueAt`) — a due-date-only write would be invisible.
 *
 *   PENALTY (attempt incorrect, flows UP the encompassing edges — from the
 *   attempted concept toward whatever ENCOMPASSES it): the same blend
 *   toward a hypothetical lapse (`reviewCard(card, 1, now)`), discounted by
 *   `credit × PENALTY_DISCOUNT`, but bounded so a single slip can never
 *   crater a whole dependent chain: `newStability` never drops below
 *   `max(0.5, card.stability × 0.5)`.
 *
 * Granularity (outside-voice amendment #2): encompassing edges are
 * concept-level; FSRS cards are item-level. This module works at the
 * concept level — `cardsByConcept` maps ONE representative card per
 * concept. When a student model has multiple physical cards sharing a
 * `skill_id` (multiple items practicing the same concept), the caller
 * applies the same per-concept credit to each of that concept's cards
 * (see `student-model-pg.ts`'s wiring) — the credit is not split across
 * them, since the blend is a discount toward a fixed target, not a fixed
 * quantity to divide. A concept in the closure with NO existing card is a
 * no-op: "nothing due = semantically correct" (nothing to nudge).
 */

import { intervalForRetention, reviewCard, FSRS_DEFAULT_TARGET, type FsrsCard, type Rating } from './fsrs';
import { ALL_CONCEPTS } from '../constants/concept-graph';

// ────────────────────────────────────────────────────────────────────
// Constants — locked here so callers can't silently drift them.
// ────────────────────────────────────────────────────────────────────

/** Depth cap for the transitive encompassing closure (B1/B2 spec). */
export const FIRE_MAX_DEPTH = 2;

/** How much of a hypothetical good review's stability gain an implicit
 *  credit actually grants — implicit reviews are worth less than real ones. */
export const CREDIT_DISCOUNT = 0.5;

/** Same idea for penalties — discounted so one slip doesn't overreact. */
export const PENALTY_DISCOUNT = 0.5;

/** A penalized card's stability never drops below this fraction of what
 *  it was — "one careless slip must not crater a chain" (B2 spec). */
export const PENALTY_STABILITY_FLOOR_RATIO = 0.5;

/** ...nor below FSRS's own absolute stability floor. */
export const PENALTY_STABILITY_ABSOLUTE_FLOOR = 0.5;

/** Hypothetical ratings used to compute the blend target. Never persisted
 *  as a real FSRS rating — only `target.stability` is read off the result. */
const HYPOTHETICAL_GOOD: Rating = 3;
const HYPOTHETICAL_AGAIN: Rating = 1;

export type ConceptId = string;

export interface EncompassingEdge {
  id: ConceptId;
  weight: number;
}

// ────────────────────────────────────────────────────────────────────
// Closure — pure graph algorithm, exported so tests can exercise it
// against synthetic edge maps without touching the real YAML graph.
// ────────────────────────────────────────────────────────────────────

/**
 * Depth-capped transitive closure over a directed weighted edge map.
 * Credit for a multi-hop path is the PRODUCT of its edge weights; when a
 * concept is reachable by more than one path within the depth cap, the
 * MAX credit across those paths wins. The start concept is always
 * excluded from its own closure (defensive — the loader already refuses
 * to load a cyclic encompassing graph, so this should never matter, but a
 * self-referencing edge must never self-amplify).
 *
 * Deterministic: for the same edge map and start id, always returns the
 * same credit for every reachable concept, regardless of traversal order.
 */
export function buildEncompassingClosure(
  edgesByConcept: ReadonlyMap<ConceptId, ReadonlyArray<EncompassingEdge>>,
  startId: ConceptId,
  maxDepth: number = FIRE_MAX_DEPTH,
): Map<ConceptId, number> {
  const best = new Map<ConceptId, number>();
  let frontier: Array<{ id: ConceptId; credit: number; depth: number }> = [
    { id: startId, credit: 1, depth: 0 },
  ];

  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const node of frontier) {
      if (node.depth >= maxDepth) continue;
      for (const edge of edgesByConcept.get(node.id) ?? []) {
        if (edge.id === startId) continue; // exclude self
        const credit = node.credit * edge.weight;
        const existing = best.get(edge.id);
        if (existing === undefined || credit > existing) best.set(edge.id, credit);
        next.push({ id: edge.id, credit, depth: node.depth + 1 });
      }
    }
    frontier = next;
  }

  return best;
}

// ────────────────────────────────────────────────────────────────────
// Module-load precompute — the real gate-ma.yml encompassing graph.
// ────────────────────────────────────────────────────────────────────

/** DOWN edges: concept -> what it encompasses (as declared in the YAML). */
const DOWN_EDGES: Map<ConceptId, EncompassingEdge[]> = new Map(
  ALL_CONCEPTS.map((c) => [c.id, c.encompasses ?? []]),
);

/** UP edges: concept -> concepts that encompass IT (the reverse graph). */
const UP_EDGES: Map<ConceptId, EncompassingEdge[]> = (() => {
  const up = new Map<ConceptId, EncompassingEdge[]>();
  for (const c of ALL_CONCEPTS) {
    for (const edge of c.encompasses ?? []) {
      if (!up.has(edge.id)) up.set(edge.id, []);
      up.get(edge.id)!.push({ id: c.id, weight: edge.weight });
    }
  }
  return up;
})();

const DOWN_CLOSURE_CACHE: Map<ConceptId, Map<ConceptId, number>> = new Map(
  ALL_CONCEPTS.map((c) => [c.id, buildEncompassingClosure(DOWN_EDGES, c.id)]),
);

const UP_CLOSURE_CACHE: Map<ConceptId, Map<ConceptId, number>> = new Map(
  ALL_CONCEPTS.map((c) => [c.id, buildEncompassingClosure(UP_EDGES, c.id)]),
);

/** Concepts + credit that `conceptId` (attempted, correct) implicitly
 *  credits — depth-≤2 closure DOWN the encompassing edges. Empty for any
 *  concept with no encompassing edges (every non-LA concept today). */
export function downClosureFor(conceptId: ConceptId): Map<ConceptId, number> {
  return DOWN_CLOSURE_CACHE.get(conceptId) ?? new Map();
}

/** Concepts + credit that `conceptId` (attempted, incorrect) implicitly
 *  penalizes — depth-≤2 closure UP the encompassing edges (concepts that
 *  encompass the attempted one). Empty for any concept nothing encompasses. */
export function upClosureFor(conceptId: ConceptId): Map<ConceptId, number> {
  return UP_CLOSURE_CACHE.get(conceptId) ?? new Map();
}

// ────────────────────────────────────────────────────────────────────
// Card math
// ────────────────────────────────────────────────────────────────────

/** Recompute `dueAt` from a FIXED `lastReviewAt` and a new stability —
 *  mirrors fsrs.ts's own rounding convention (whole days, minimum 1). */
function recomputeDueAt(lastReviewAt: string, stability: number, target = FSRS_DEFAULT_TARGET): string {
  const intervalDays = Math.max(1, Math.round(intervalForRetention(stability, target)));
  const dueAt = new Date(lastReviewAt);
  dueAt.setDate(dueAt.getDate() + intervalDays);
  return dueAt.toISOString();
}

export interface FireAttempt {
  skillId: ConceptId;
  correct: boolean;
}

export interface ImplicitReview {
  conceptId: ConceptId;
  newCard: FsrsCard;
}

/**
 * Computes the FSRS card updates FIRe grants for one attempt, against an
 * ALREADY-FETCHED map of one representative card per closure concept.
 * Pure — the caller persists `newCard` for each returned `conceptId`.
 *
 * - No encompassing edges for `attempt.skillId` → `[]` (non-LA concepts
 *   are byte-identical to no-FIRe behavior).
 * - A closure concept with no card in `cardsByConcept` → skipped
 *   entirely (no-op; "nothing due" is semantically correct, not an error).
 */
export function computeImplicitReviews(
  attempt: FireAttempt,
  cardsByConcept: ReadonlyMap<ConceptId, FsrsCard>,
  now: Date,
): ImplicitReview[] {
  const closure = attempt.correct ? downClosureFor(attempt.skillId) : upClosureFor(attempt.skillId);
  if (closure.size === 0) return [];

  const results: ImplicitReview[] = [];

  for (const [conceptId, credit] of closure) {
    const card = cardsByConcept.get(conceptId);
    if (!card) continue; // no existing card for this concept — no-op

    if (attempt.correct) {
      const target = reviewCard(card, HYPOTHETICAL_GOOD, now).card;
      const newStability = card.stability + credit * CREDIT_DISCOUNT * (target.stability - card.stability);
      results.push({
        conceptId,
        newCard: {
          ...card,
          stability: newStability,
          dueAt: recomputeDueAt(card.lastReviewAt, newStability),
          // lastReviewAt / difficulty / reps / lapses UNCHANGED — this is
          // not a real review event.
        },
      });
    } else {
      const target = reviewCard(card, HYPOTHETICAL_AGAIN, now).card;
      const blended = card.stability + credit * PENALTY_DISCOUNT * (target.stability - card.stability);
      const floor = Math.max(PENALTY_STABILITY_ABSOLUTE_FLOOR, card.stability * PENALTY_STABILITY_FLOOR_RATIO);
      const newStability = Math.max(blended, floor);
      results.push({
        conceptId,
        newCard: {
          ...card,
          stability: newStability,
          dueAt: recomputeDueAt(card.lastReviewAt, newStability),
        },
      });
    }
  }

  return results;
}
