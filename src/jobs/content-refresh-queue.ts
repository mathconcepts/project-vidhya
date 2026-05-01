// @ts-nocheck
/**
 * src/jobs/content-refresh-queue.ts
 *
 * Nightly content-refresh queue with a hard cap of MAX_PER_NIGHT generations.
 * This file owns the invariant — callers (content-flywheel, kag-corpus-builder
 * nightly job) MUST go through enqueue() rather than generating directly.
 *
 * Midnight UTC resets the counter automatically via the isNewNight() check.
 */

import { addKagEntry, type KagEntry } from '../content/kag-store';

const MAX_PER_NIGHT = 5;

interface QueueState {
  date_utc: string;    // YYYY-MM-DD of last reset
  count: number;       // generations today
}

let _state: QueueState = { date_utc: '', count: 0 };

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function resetIfNewNight(): void {
  const today = todayUtc();
  if (_state.date_utc !== today) {
    _state = { date_utc: today, count: 0 };
  }
}

/** True when the nightly cap has been reached. */
export function isNightlyCapReached(): boolean {
  resetIfNewNight();
  return _state.count >= MAX_PER_NIGHT;
}

/** Current count for the night (0-based, resets at midnight UTC). */
export function nightlyCount(): number {
  resetIfNewNight();
  return _state.count;
}

/**
 * Enqueue a KAG entry for storage. Returns false if the nightly cap is
 * already reached (caller should log and skip). Returns true on success.
 */
export function enqueueKagEntry(entry: KagEntry): boolean {
  resetIfNewNight();
  if (_state.count >= MAX_PER_NIGHT) return false;
  addKagEntry(entry);
  _state.count++;
  return true;
}

/** Reset counter — test helper only. */
export function _resetQueueForTests(): void {
  _state = { date_utc: '', count: 0 };
}
