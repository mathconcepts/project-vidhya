/**
 * Stance pinning — hold a learner's stance steady for the length of a concept.
 *
 * ── The problem this closes ─────────────────────────────────────────────
 *
 * Stance is derived fresh on every compose (`lesson-routes.ts`, both the
 * anonymous snapshot path and the student-model path). That was harmless while
 * a struggling student could never stop being struggling. Once recovery lands
 * — motivation lifts to `steady` after two correct answers in a row — it stops
 * being harmless: a student can open a lesson shaken, answer two questions
 * correctly, and have every remaining body silently become different text.
 * Scroll position, the atom index, a half-read paragraph and the "revisit"
 * count all refer to content that no longer exists.
 *
 * A student improving is exactly what the product wants. Rewriting the lesson
 * underneath them mid-read is not the way to reflect it. The register changes
 * at the next concept boundary, which is a moment they already experience as a
 * transition.
 *
 * ── Why in-memory ───────────────────────────────────────────────────────
 *
 * The demo instance runs without a database, and stance variants are the only
 * content personalisation that survives that. Persisting the pin would make
 * the fix work everywhere except the deployment it matters most for. So the
 * pin lives in process, keyed by (session, concept), and its absence degrades
 * to today's behaviour — derive fresh — rather than to an error.
 *
 * A restart therefore drops pins. That is acceptable: the failure mode is one
 * re-derivation at the moment the process restarts, which is indistinguishable
 * from the student having started the concept a moment later.
 */

import type { LearnerStance } from './learner-framing';

interface Pin {
  stance: LearnerStance;
  at: number;
}

/**
 * How long a pin survives without being touched.
 *
 * Long enough to cover reading a concept end to end with pauses, short enough
 * that returning tomorrow re-derives against current state rather than serving
 * a register the student has grown out of.
 */
export const PIN_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Bound on distinct pins held. A demo instance serves a handful of sessions,
 * but an unbounded map keyed by client-supplied session ids is a slow leak,
 * and eviction is cheaper to reason about than a leak is to notice.
 */
export const MAX_PINS = 5_000;

const _pins = new Map<string, Pin>();

function key(sessionId: string, conceptId: string): string {
  return `${sessionId}::${conceptId}`;
}

function evictIfNeeded(now: number): void {
  for (const [k, v] of _pins) {
    if (now - v.at > PIN_TTL_MS) _pins.delete(k);
  }
  if (_pins.size <= MAX_PINS) return;
  // Oldest-first. Map preserves insertion order and every write re-inserts,
  // so iteration order is least-recently-pinned first.
  const excess = _pins.size - MAX_PINS;
  let i = 0;
  for (const k of _pins.keys()) {
    if (i++ >= excess) break;
    _pins.delete(k);
  }
}

/**
 * The stance to serve for this (session, concept).
 *
 * First call in a concept pins whatever `derive` returns. Later calls return
 * the pinned value and never consult `derive` again, which is the point: the
 * derivation may legitimately have changed and must not take effect yet.
 *
 * `sessionId` absent means an anonymous caller with no continuity to protect,
 * so it derives every time — the same behaviour as before.
 */
export function stanceForConcept(
  sessionId: string | null | undefined,
  conceptId: string,
  derive: () => LearnerStance,
): LearnerStance {
  if (!sessionId) return derive();
  const now = Date.now();
  const k = key(sessionId, conceptId);
  const hit = _pins.get(k);
  if (hit && now - hit.at <= PIN_TTL_MS) {
    // Refresh recency without changing the pinned value.
    _pins.delete(k);
    _pins.set(k, { stance: hit.stance, at: now });
    return hit.stance;
  }
  const stance = derive();
  _pins.set(k, { stance, at: now });
  evictIfNeeded(now);
  return stance;
}

/**
 * Drop the pin for a concept, so the next compose re-derives.
 *
 * Called when a student leaves a concept. Not calling it is safe — the TTL
 * covers it — so no caller has to be careful.
 */
export function releaseStancePin(sessionId: string | null | undefined, conceptId: string): void {
  if (!sessionId) return;
  _pins.delete(key(sessionId, conceptId));
}

/** Test-only. */
export function __resetStancePinsForTests(): void {
  _pins.clear();
}

/** Test-only visibility into the pin count, for the eviction tests. */
export function __pinCountForTests(): number {
  return _pins.size;
}
