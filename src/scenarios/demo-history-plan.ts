/**
 * src/scenarios/demo-history-plan.ts — T20 (D9, OV2-2): the PURE half of
 * demo persona history seeding.
 *
 * Two responsibilities, both pure and DB-free:
 *
 *   1. `buildAttempts()` — deterministically generates a multi-day attempt
 *      sequence per a declarative concept-group spec, seeded by the SAME
 *      SHA-256-keyed mulberry32 PRNG discipline as
 *      src/scenarios/policy-runner.ts's `seededRng` (no Math.random
 *      anywhere — every draw is `seededRng(persona.id + ':' + conceptId +
 *      ':' + attemptIdx)`, so re-running the seeder against the same
 *      persona produces byte-identical history).
 *
 *   2. `simulate()` — replays that EXACT attempt sequence through the
 *      REAL, already-shipped Elo (src/gbrain/elo.ts) + FSRS
 *      (src/gbrain/fsrs.ts) + XP (src/scoring/xp.ts) + deterministic-
 *      scorer (src/scoring/deterministic-scorer.ts) pure functions — the
 *      identical math `PgStudentModel.update()` and `POST /api/practice/
 *      attempt` run in production, just without a database underneath.
 *      This is what lets T20's tests assert EXACT resulting mastery
 *      states, due-card membership, and XP totals at the data level,
 *      instead of hoping a hand-rolled approximation matches what the
 *      real seeder run (src/scenarios/demo-history-seeder.ts) will
 *      actually persist. The seeder replays this SAME plan against the
 *      real StudentModel — simulate() is the dry-run of the exact same
 *      event sequence, not a separate model.
 *
 * One item per concept, reused across every attempt on it (unrealistic
 * for a real student — a real one would see different items — but this
 * is seed data, not a lesson: fixing one object_id per concept collapses
 * "which FSRS card is this concept's card" to a 1:1 lookup, which is all
 * the due-review and mastery assertions need).
 */

import { seededRng } from './policy-runner';
import type { GateItem, GateResponse } from '../scoring/deterministic-scorer';
import { makeDeterministicScorer } from '../scoring/deterministic-scorer';
import { gateItemFromPayload } from '../api/practice-routes';
import type { LearningObject, MasteryState } from '../core/interfaces';
import {
  applyAttempt, newItemDifficulty, newStudentAbility,
  type StudentAbilityState, type ItemDifficultyState,
} from '../gbrain/elo';
import {
  initCard, reviewCard, ratingFromAttempt, type FsrsCard,
} from '../gbrain/fsrs';
import { deriveMasteryState } from '../gbrain/student-model-pg';
import { xpForAttempt } from '../scoring/xp';

// ────────────────────────────────────────────────────────────────────
// Plan spec → attempt sequence
// ────────────────────────────────────────────────────────────────────

export interface ConceptGroupSpec {
  conceptId: string;
  numAttempts: number;
  /** Probability a given attempt is correct — drives the seeded coin flip. */
  probCorrect: number;
  /** Attempts are spread evenly (oldest first) across [maxDaysAgo, minDaysAgo]. */
  minDaysAgo: number;
  maxDaysAgo: number;
}

export interface SimulatedAttempt {
  conceptId: string;
  objectId: string;
  correct: boolean;
  /** Chosen so ratingFromAttempt lands on a stable, intentional FSRS rating (see buildAttempts). */
  latencyMs: number;
  tsMs: number;
}

/** Shared by simulate() and the seeder so both apply the identical XP-window rule — see simulate()'s doc. */
export function isWithinXpWindow(tsMs: number, now: Date, xpWindowDays: number | null): boolean {
  if (xpWindowDays === null) return true;
  return now.getTime() - tsMs <= xpWindowDays * 86_400_000;
}

/**
 * `itemIdForConcept(conceptId, attemptIdx)` resolves which object id a
 * given attempt on that concept uses — callers typically cycle through
 * the concept's catalog items (`items[attemptIdx % items.length]`) so
 * Elo's item-difficulty co-adaptation (K_ITEM) doesn't chase a single
 * repeatedly-drilled item and flatten the student's own rating movement.
 * A concept the resolver can't find an item for is silently skipped —
 * never fabricated — so a caller can pass a group list wider than the
 * catalog actually covers.
 */
export function buildAttempts(
  personaId: string,
  groups: ReadonlyArray<ConceptGroupSpec>,
  now: Date,
  itemIdForConcept: (conceptId: string, attemptIdx: number) => string | null,
): SimulatedAttempt[] {
  const attempts: SimulatedAttempt[] = [];

  for (const group of groups) {
    for (let i = 0; i < group.numAttempts; i++) {
      const objectId = itemIdForConcept(group.conceptId, i);
      if (!objectId) continue;

      const rng = seededRng(`${personaId}:${group.conceptId}:${i}`);
      const correct = rng() < group.probCorrect;

      // Spread attempts evenly oldest→newest across the day window;
      // a few hours of jitter (seeded) keeps timestamps from landing on
      // the exact same instant across concepts.
      const span = group.numAttempts > 1 ? group.numAttempts - 1 : 1;
      const daysAgo = group.maxDaysAgo - ((group.maxDaysAgo - group.minDaysAgo) * i) / span;
      const jitterHours = rng() * 6;
      const tsMs = now.getTime() - Math.round(daysAgo * 86_400_000) - Math.round(jitterHours * 3_600_000);

      // Latency is chosen, not drawn — it decides the FSRS rating
      // (ratingFromAttempt: <10s→Easy, <45s→Good, else→Hard on a
      // correct attempt; any incorrect→Again). "Good" (20s) is the
      // intentional default: neither the shortest nor the longest
      // stability jump, so the resulting due dates are the FSRS-typical
      // case, not an edge case.
      const latencyMs = correct ? 20_000 : 15_000;

      attempts.push({ conceptId: group.conceptId, objectId, correct, latencyMs, tsMs });
    }
  }

  return attempts;
}

// ────────────────────────────────────────────────────────────────────
// Response synthesis — always a VALID response for the item's real
// answer key, matching or deliberately missing it. Reuses the real
// GateItem/GateResponse shapes so grading below is byte-identical to
// the production attempt path.
// ────────────────────────────────────────────────────────────────────

export function responseForOutcome(item: GateItem, wantCorrect: boolean): GateResponse {
  if (item.kind === 'mcq') {
    const n = (item.options as unknown[]).length;
    const correctIdx = item.answerIndex ?? 0;
    return { kind: 'mcq', selectedIndex: wantCorrect ? correctIdx : (correctIdx + 1) % n };
  }
  if (item.kind === 'msq') {
    const want = item.answerIndices ?? [];
    if (wantCorrect) return { kind: 'msq', selectedIndices: [...want] };
    const n = (item.options as unknown[]).length;
    const wrongIdx = Array.from({ length: n }, (_, i) => i).find((i) => !want.includes(i)) ?? 0;
    return { kind: 'msq', selectedIndices: want.length > 1 ? want.slice(1) : [wrongIdx] };
  }
  // nat
  const [lo, hi] = item.answerRange ?? [0, 0];
  return { kind: 'nat', value: wantCorrect ? (lo + hi) / 2 : hi + 1 };
}

// ────────────────────────────────────────────────────────────────────
// Simulation — replays attempts through the REAL Elo/FSRS/XP math.
// ────────────────────────────────────────────────────────────────────

export interface ConceptOutcome {
  conceptId: string;
  rating: number;
  n: number;
  masteryState: MasteryState;
  /** null iff the concept was never attempted. */
  card: FsrsCard | null;
  cardObjectId: string | null;
}

/**
 * One graded attempt, ready to replay as a real `Attempt` (Elo+FSRS via
 * `StudentModel.update()`) plus its XP award — this is what
 * src/scenarios/demo-history-seeder.ts iterates to persist the identical
 * sequence `simulate()` just computed, so the seeder's DB writes and this
 * module's in-memory projection can never drift apart.
 */
export interface GradedAttempt {
  conceptId: string;
  objectId: string;
  correct: boolean;
  earned: number;
  max: number;
  perCriterion: Record<string, number>;
  latencyMs: number;
  tsMs: number;
  /** 0 when outside the XP window — the seeder skips awardXp() for these, not `update()`. */
  xpAmount: number;
  withinXpWindow: boolean;
}

export interface DemoHistorySimulation {
  attemptsInOrder: SimulatedAttempt[];
  gradedAttempts: GradedAttempt[];
  concepts: Record<string, ConceptOutcome>;
  /** Floored at 0 — matches src/gbrain/xp-store.ts's read-time floor (negative net history never shows). */
  totalXpMinutes: number;
  /** Concepts whose card is due (due_at <= now) AND has reps > 0 — the retain-arm / FIRe knock-out candidates. */
  dueConceptIds: string[];
}

/**
 * `getById` resolves an item's full LearningObject (marks/options/answer
 * key) — pass the file catalog's getById directly; it's DB-free.
 *
 * `opts.xpWindowDays`, when set, awards XP ONLY for attempts within that
 * many days of `now` — Elo/FSRS still apply to EVERY attempt regardless.
 * This is a seeding-only device (documented on the seeder, not a
 * production behavior): building genuine multi-week mastery on several
 * concepts takes far more graded attempts than a "mid-meter ~64/100"
 * demo total can absorb if every one of those attempts also earned XP.
 * Bounding the XP-eligible window to recent activity keeps the visible
 * meter mid-scale while the mastery data underneath it is real and
 * fully-attempted — "she's been practising for weeks; her current XP
 * cycle is fresh." The real per-cycle reset this stands in for
 * (baselining off the last completed quiz) isn't implemented — see the
 * seeder's module doc for that as a tracked follow-up, not a silent gap.
 */
export async function simulate(
  personaId: string,
  attempts: ReadonlyArray<SimulatedAttempt>,
  now: Date,
  getById: (objectId: string) => Promise<LearningObject | null>,
  opts: { xpWindowDays?: number } = {},
): Promise<DemoHistorySimulation> {
  const scorer = makeDeterministicScorer();
  const sorted = [...attempts].sort((a, b) => a.tsMs - b.tsMs);

  const abilityByConcept = new Map<string, StudentAbilityState>();
  const itemDifficultyByObject = new Map<string, ItemDifficultyState>();
  const cardByObject = new Map<string, FsrsCard>();
  const objectsByConcept = new Map<string, string[]>();
  const lastTouchedObjectByConcept = new Map<string, string>();
  const gradedAttempts: GradedAttempt[] = [];
  let totalXpRaw = 0;

  for (const a of sorted) {
    const obj = await getById(a.objectId);
    if (!obj) continue; // catalog can't resolve — skip rather than fabricate a grade

    const itemOrReason = gateItemFromPayload(a.objectId, obj.payload);
    if (typeof itemOrReason === 'string') continue; // item not gradable — skip

    const response = responseForOutcome(itemOrReason, a.correct);
    const grade = await scorer.grade(itemOrReason, response);
    const gradedCorrect = grade.casFinalAnswerCorrect === true;

    // Elo
    const sState = abilityByConcept.get(a.conceptId) ?? newStudentAbility(personaId, a.conceptId);
    const iState = itemDifficultyByObject.get(a.objectId) ?? newItemDifficulty(a.objectId, a.conceptId);
    applyAttempt(sState, iState, gradedCorrect);
    abilityByConcept.set(a.conceptId, sState);
    itemDifficultyByObject.set(a.objectId, iState);

    // FSRS — each object_id carries its own card, exactly as fsrs_cards
    // is keyed (student_id, object_id) in production.
    const rating = ratingFromAttempt(gradedCorrect, a.latencyMs / 1000);
    const attemptDate = new Date(a.tsMs);
    const existingCard = cardByObject.get(a.objectId);
    const newCard = existingCard ? reviewCard(existingCard, rating, attemptDate).card : initCard(rating, attemptDate);
    cardByObject.set(a.objectId, newCard);
    lastTouchedObjectByConcept.set(a.conceptId, a.objectId);
    const existingList = objectsByConcept.get(a.conceptId) ?? [];
    if (!existingList.includes(a.objectId)) existingList.push(a.objectId);
    objectsByConcept.set(a.conceptId, existingList);

    // XP
    const withinXpWindow = isWithinXpWindow(a.tsMs, now, opts.xpWindowDays ?? null);
    const xpAmount = withinXpWindow ? xpForAttempt({ earned: grade.earned, max: grade.max }, obj.estMinutes) : 0;
    if (withinXpWindow) totalXpRaw += xpAmount;

    gradedAttempts.push({
      conceptId: a.conceptId, objectId: a.objectId, correct: gradedCorrect,
      earned: grade.earned, max: grade.max, perCriterion: grade.perCriterion,
      latencyMs: a.latencyMs, tsMs: a.tsMs, xpAmount, withinXpWindow,
    });
  }

  const concepts: Record<string, ConceptOutcome> = {};
  const dueConceptIds: string[] = [];
  for (const [conceptId, sState] of abilityByConcept) {
    const objectIds = objectsByConcept.get(conceptId) ?? [];
    const cards = objectIds.map((id) => cardByObject.get(id)).filter((c): c is FsrsCard => Boolean(c));
    // The "representative" card for at-risk display purposes is whichever
    // item was touched LAST — the concept's freshest signal.
    const lastObjectId = lastTouchedObjectByConcept.get(conceptId) ?? null;
    const representativeCard = lastObjectId ? cardByObject.get(lastObjectId) ?? null : null;

    const masteryState = deriveMasteryState(
      { rating: sState.rating, n: sState.n },
      representativeCard ? [{ stability: representativeCard.stability, lastReviewAt: representativeCard.lastReviewAt }] : [],
      now,
    );
    concepts[conceptId] = { conceptId, rating: sState.rating, n: sState.n, masteryState, card: representativeCard, cardObjectId: lastObjectId };

    // A concept is "due for review" iff ANY of its cards is due — the
    // retain arm surfaces the concept, not a specific card.
    const anyDue = cards.some((c) => c.reps > 0 && new Date(c.dueAt).getTime() <= now.getTime());
    if (anyDue) dueConceptIds.push(conceptId);
  }

  return {
    attemptsInOrder: sorted,
    gradedAttempts,
    concepts,
    totalXpMinutes: Math.max(0, Math.round(totalXpRaw)),
    dueConceptIds,
  };
}
