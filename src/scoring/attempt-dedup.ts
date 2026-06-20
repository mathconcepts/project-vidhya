/**
 * src/scoring/attempt-dedup.ts — idempotency for StudentModel.update().
 *
 * Elo is NOT commutative on duplicate attempts: applying the same
 * (student, item, outcome) twice will drift the rating. The blueprint
 * §3.1 guardrail and the `StudentModel.update` doc contract require
 * idempotency on `(studentId, objectId, ts)` — concrete impls dedup
 * before persisting.
 *
 * This module provides two layers:
 *
 *   1. `attemptKey()` — pure function producing the canonical dedup key.
 *   2. `AttemptDedupRepo` — small contract; in-memory impl for tests,
 *      Postgres impl uses migration 030's `attempt_dedup` table with a
 *      UNIQUE(student_id, object_id, ts_ms) constraint. The Postgres
 *      impl returns `true` only when the INSERT actually committed —
 *      duplicates fail the unique constraint and return `false`.
 *
 * Caller pattern (in any concrete StudentModel.update):
 *
 *   if (!await dedup.markSeen(attempt)) return;
 *   await applyElo(attempt);
 *   await applyFsrs(attempt);
 *   await emitTelemetry(attempt);
 */

import type { Attempt } from '../core/interfaces';

/** Canonical idempotency key. */
export function attemptKey(a: Attempt): string {
  return `${a.studentId}::${a.objectId}::${a.ts}`;
}

export interface AttemptDedupRepo {
  /** Returns true if this is the first time we've seen `attempt`; false if duplicate. */
  markSeen(attempt: Attempt): Promise<boolean>;
}

// ────────────────────────────────────────────────────────────────────
// In-memory implementation — for tests + dev. Production uses Postgres.
// ────────────────────────────────────────────────────────────────────

export class InMemoryDedupRepo implements AttemptDedupRepo {
  private seen = new Set<string>();
  private readonly cap: number;

  constructor(cap = 100_000) {
    this.cap = cap;
  }

  async markSeen(attempt: Attempt): Promise<boolean> {
    const key = attemptKey(attempt);
    if (this.seen.has(key)) return false;
    // Cheap LRU-ish cap — when full, drop the oldest insertion-order entry.
    if (this.seen.size >= this.cap) {
      const oldest = this.seen.values().next().value;
      if (oldest !== undefined) this.seen.delete(oldest);
    }
    this.seen.add(key);
    return true;
  }

  /** Test helper. Not part of the contract. */
  size(): number {
    return this.seen.size;
  }
}
