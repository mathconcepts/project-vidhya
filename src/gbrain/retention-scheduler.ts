/**
 * Retention Scheduler — spaced repetition for long-term retention.
 *
 * Built on the SM-2 family of algorithms (Piotr Wozniak, SuperMemo).
 * Each concept the student has encountered gets a `RetentionItem` record
 * tracking: how many successful reviews, ease factor, current interval,
 * and the next due-for-review date.
 *
 * Why this matters: a student can hit "mastered" on a concept today and
 * forget 70% of it within a week — the classic Ebbinghaus forgetting
 * curve. Spaced repetition is the most robust countermeasure in learning
 * science. By scheduling reviews at expanding intervals (1 day, 3 days,
 * 7 days, 16 days, ...), GBrain catches concepts just before they decay.
 *
 * Data flow:
 *   student attempts a problem on concept X
 *     -> recordEncounter(student_id, concept_id, quality)
 *        - if first encounter: schedule initial review (1 day out)
 *        - if subsequent:      update ease factor + grow interval
 *     -> next due_for_review_at saved on the item
 *
 *   student opens planner
 *     -> getDueReviews(student_id) returns items whose due_at <= now
 *     -> getUpcomingReviews(student_id, days=7) returns the forecast
 *
 * Quality score (0–5, SM-2 convention):
 *   5 — perfect: instantaneous, no hesitation
 *   4 — correct: confident
 *   3 — correct: hesitant
 *   2 — incorrect: but felt close (recall failure with familiarity)
 *   1 — incorrect: had to think hard
 *   0 — total blackout: didn't even recognise the concept
 *
 * Computed automatically from attempt outcome + time-to-answer when not
 * specified by the caller (see qualityFromAttempt).
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import { recordShadow } from './fsrs-shadow';

// ============================================================================
// Types
// ============================================================================

export interface RetentionItem {
  student_id: string;
  concept_id: string;        // 'tn-12-math.complex.de-moivre' or 'calculus' (exam topic)
  /** Number of times the student has reviewed this concept */
  repetitions: number;
  /** SM-2 ease factor — starts at 2.5, decreases on failures, never < 1.3 */
  ease_factor: number;
  /** Days between this review and the next, computed by SM-2 */
  interval_days: number;
  /** ISO timestamp of last encounter */
  last_reviewed_at: string;
  /** ISO date string for when this concept is next due for review */
  due_for_review_at: string;
  /** Cumulative qualities recorded for trend analysis */
  quality_history: number[];
  /** Last computed quality — for display */
  last_quality: number;
}

interface StoreShape { items: RetentionItem[]; }

const _store = createFlatFileStore<StoreShape>({
  path: '.data/gbrain-retention.json',
  defaultShape: () => ({ items: [] }),
});

// ============================================================================
// SM-2 core
// ============================================================================

/**
 * SM-2 scheduling step. Given an item's current state and a quality (0–5)
 * for the latest encounter, return the updated item with new interval and
 * due date. Algorithm reference: SuperMemo SM-2.
 *
 *   if quality < 3:
 *     repetitions = 0
 *     interval    = 1 day
 *   else:
 *     repetitions++
 *     if repetitions == 1: interval = 1
 *     elif repetitions == 2: interval = 6
 *     else: interval = round(previous_interval * ease_factor)
 *
 *   ease_factor = max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
 */
function applySM2(item: RetentionItem, quality: number, now: Date): RetentionItem {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let { repetitions, ease_factor, interval_days } = item;

  if (q < 3) {
    // Failure — reset repetitions but keep the ease decay
    repetitions = 0;
    interval_days = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval_days = 1;
    else if (repetitions === 2) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
  }

  // Update ease factor (SM-2 formula). Floor at 1.3 to prevent runaway decay.
  ease_factor = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02),
  );

  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + interval_days);

  const quality_history = [...item.quality_history, q].slice(-20); // keep last 20

  return {
    ...item,
    repetitions,
    ease_factor: Number(ease_factor.toFixed(3)),
    interval_days,
    last_reviewed_at: now.toISOString(),
    due_for_review_at: dueDate.toISOString(),
    last_quality: q,
    quality_history,
  };
}

/**
 * Derive a quality score (0–5) from a binary outcome + time-to-answer in seconds.
 * Used when the caller doesn't supply an explicit quality.
 *
 * Heuristics:
 *   - correct + fast       (< 15s)  -> 5
 *   - correct + medium     (< 45s)  -> 4
 *   - correct + slow                -> 3
 *   - incorrect + felt close        -> 2
 *   - incorrect + medium time       -> 1
 *   - incorrect + very fast (< 5s)  -> 0  (probably just guessed)
 */
export function qualityFromAttempt(
  correct: boolean,
  time_seconds: number | undefined,
  felt_close = false,
): number {
  const t = time_seconds ?? 30;
  if (correct) {
    if (t < 15) return 5;
    if (t < 45) return 4;
    return 3;
  }
  if (felt_close) return 2;
  if (t < 5) return 0;
  return 1;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Record an encounter on a concept. Creates the retention item if it doesn't
 * exist, applies SM-2, and persists. Idempotent on item shape — caller can
 * call multiple times safely.
 */
export function recordEncounter(
  student_id: string,
  concept_id: string,
  quality: number,
  now: Date = new Date(),
): RetentionItem {
  const initial: RetentionItem = {
    student_id,
    concept_id,
    repetitions: 0,
    ease_factor: 2.5,
    interval_days: 0,
    last_reviewed_at: now.toISOString(),
    due_for_review_at: now.toISOString(),
    quality_history: [],
    last_quality: 0,
  };

  let result: RetentionItem = initial;
  let prior: RetentionItem | null = null;
  _store.update(s => {
    const i = s.items.findIndex(
      x => x.student_id === student_id && x.concept_id === concept_id,
    );
    const current = i >= 0 ? s.items[i] : initial;
    prior = i >= 0 ? current : null;
    result = applySM2(current, quality, now);
    if (i >= 0) s.items[i] = result;
    else s.items.push(result);
    return s;
  });

  // Wave 12 / A7 shadow mode: log what FSRS would have scheduled.
  // Fire-and-forget; the SM-2 write above is UNCHANGED.
  const priorItem = prior as RetentionItem | null;
  recordShadow({
    site: 'retention',
    studentId: student_id,
    itemKey: concept_id,
    prior: priorItem && priorItem.interval_days > 0 ? {
      intervalDays: priorItem.interval_days,
      easeFactor: priorItem.ease_factor,
      lastReviewedAt: priorItem.last_reviewed_at,
      reps: priorItem.repetitions,
    } : null,
    quality,
    sm2DueAt: result.due_for_review_at,
    now,
  });

  return result;
}

/** List all retention items for a student. */
export function listRetentionItems(student_id: string): RetentionItem[] {
  return _store.read().items.filter(i => i.student_id === student_id);
}

/**
 * Items due for review right now — i.e. due_for_review_at <= now.
 * Returned in oldest-due-first order so the student tackles overdue
 * concepts before fresh ones.
 */
export function getDueReviews(student_id: string, now: Date = new Date()): RetentionItem[] {
  const nowMs = now.getTime();
  return listRetentionItems(student_id)
    .filter(i => new Date(i.due_for_review_at).getTime() <= nowMs)
    .sort((a, b) => a.due_for_review_at.localeCompare(b.due_for_review_at));
}

/**
 * What's coming up — items whose due date falls within the next `horizon` days.
 * Includes overdue items (they're "due" today regardless of when scheduled).
 */
export function getUpcomingReviews(
  student_id: string,
  horizon_days = 7,
  now: Date = new Date(),
): RetentionItem[] {
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + horizon_days);
  const horizonMs = horizon.getTime();
  return listRetentionItems(student_id)
    .filter(i => new Date(i.due_for_review_at).getTime() <= horizonMs)
    .sort((a, b) => a.due_for_review_at.localeCompare(b.due_for_review_at));
}

/**
 * High-level retention health snapshot for a student. Used by the planner
 * card + the gbrain prompt enricher.
 */
export interface RetentionSnapshot {
  total_concepts_tracked: number;
  due_now: number;
  due_in_24h: number;
  due_in_7d: number;
  /** Avg ease factor across tracked concepts — proxy for overall retention health */
  avg_ease_factor: number;
  /** Concepts the student has reviewed 3+ times — stable in long-term memory */
  stable_concepts: number;
  /** Concepts with last_quality < 3 — fragile, recently failed */
  fragile_concepts: number;
}

export function retentionSnapshot(student_id: string, now: Date = new Date()): RetentionSnapshot {
  const items = listRetentionItems(student_id);
  const due_now = items.filter(i => new Date(i.due_for_review_at).getTime() <= now.getTime()).length;
  const in24 = new Date(now); in24.setHours(in24.getHours() + 24);
  const in7  = new Date(now); in7.setDate(in7.getDate() + 7);
  const due_in_24h = items.filter(i => new Date(i.due_for_review_at).getTime() <= in24.getTime()).length;
  const due_in_7d  = items.filter(i => new Date(i.due_for_review_at).getTime() <= in7.getTime()).length;
  const avg_ease_factor = items.length
    ? Number((items.reduce((s, i) => s + i.ease_factor, 0) / items.length).toFixed(2))
    : 2.5;
  const stable_concepts = items.filter(i => i.repetitions >= 3).length;
  // Fragile = encountered at least once, last attempt was poor. The earlier
  // 'repetitions > 0' guard was wrong because SM-2 resets reps to 0 on
  // failure — that's exactly the state we want to flag.
  const fragile_concepts = items.filter(i => i.last_quality < 3 && i.quality_history.length > 0).length;
  return { total_concepts_tracked: items.length, due_now, due_in_24h, due_in_7d, avg_ease_factor, stable_concepts, fragile_concepts };
}
