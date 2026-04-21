// @ts-nocheck
/**
 * Spaced Scheduler — SM-2
 *
 * Implements a simplified SuperMemo-2 algorithm for scheduling when a
 * concept should be re-visited for retrieval practice. Pure, stateless:
 * takes the student's previous visit data + their micro-exercise result
 * and returns the next interval + ease factor.
 *
 * We diverge from the stock SM-2 in one respect: we cap `q` at 4 (not 5).
 * A student tapping "I got it" in the UI is quality-4 at best; true
 * quality-5 requires spaced evidence we don't try to infer in real time.
 *
 * Reference: https://super-memory.com/english/ol/sm2.htm
 */

// ============================================================================
// Types
// ============================================================================

export interface VisitState {
  sm2_interval_days: number;   // Days until the next review (0 = "today")
  sm2_ease_factor: number;     // "How easy is this concept?" — 1.3..2.5+
  visit_count: number;
  last_visited_at: string;     // ISO timestamp
}

export interface VisitUpdate {
  // 0..4 quality rating for the visit just completed
  quality: 0 | 1 | 2 | 3 | 4;
}

export interface ReviewSuggestion {
  concept_id: string;
  days_overdue: number;        // Negative = not yet due
  last_visited_at: string;
  visit_count: number;
  priority: number;            // Higher = more urgent
}

// ============================================================================
// SM-2 compute
// ============================================================================

/**
 * Compute the next VisitState given the previous state and a quality rating.
 *
 * Quality meaning:
 *   4 — "Perfect, easy" (clicked I got it + correct micro-exercise)
 *   3 — "Correct with effort"
 *   2 — "Correct but had to think hard"
 *   1 — "Incorrect but recognized the right approach"
 *   0 — "Total blank / wrong"
 */
export function updateVisitState(prev: VisitState | null, update: VisitUpdate): VisitState {
  const q = Math.max(0, Math.min(4, update.quality));
  const now = new Date().toISOString();

  if (!prev || prev.visit_count === 0) {
    return {
      sm2_interval_days: q >= 3 ? 1 : 0,  // Failed first attempt → review today
      sm2_ease_factor: 2.5,
      visit_count: 1,
      last_visited_at: now,
    };
  }

  // SM-2 update to ease factor (using the classic formula with capped q)
  // q5 maps to 5 in the formula for consistency with classical SM-2
  const q_for_formula = q + 1; // shift 0..4 to 1..5
  let ef = prev.sm2_ease_factor + (0.1 - (5 - q_for_formula) * (0.08 + (5 - q_for_formula) * 0.02));
  ef = Math.max(1.3, Math.min(3.0, ef));

  let interval: number;
  if (q < 3) {
    // Failure or low quality — restart the interval
    interval = 1;
  } else if (prev.visit_count === 1) {
    interval = 3;
  } else if (prev.visit_count === 2) {
    interval = 6;
  } else {
    interval = Math.max(1, Math.round(prev.sm2_interval_days * ef));
  }
  // Cap at 180 days to avoid runaway intervals in case of data weirdness
  interval = Math.min(180, interval);

  return {
    sm2_interval_days: interval,
    sm2_ease_factor: Math.round(ef * 100) / 100,
    visit_count: prev.visit_count + 1,
    last_visited_at: now,
  };
}

// ============================================================================
// Compute "due date" for a visit state
// ============================================================================

export function dueDate(state: VisitState): Date {
  const last = new Date(state.last_visited_at);
  last.setDate(last.getDate() + state.sm2_interval_days);
  return last;
}

export function isDue(state: VisitState, asOf: Date = new Date()): boolean {
  return dueDate(state).getTime() <= asOf.getTime();
}

// ============================================================================
// Surface "review today" concepts from a student's full visit map
// ============================================================================

export function findDueReviews(
  lastLessonVisit: Record<string, VisitState> | undefined,
  asOf: Date = new Date(),
): ReviewSuggestion[] {
  if (!lastLessonVisit) return [];
  const suggestions: ReviewSuggestion[] = [];
  for (const [concept_id, state] of Object.entries(lastLessonVisit)) {
    const due = dueDate(state);
    const daysOverdue = Math.floor((asOf.getTime() - due.getTime()) / (24 * 3600 * 1000));
    if (daysOverdue < 0) continue; // Not due yet

    // Priority: how overdue + inverse of ease factor (harder concepts prioritized)
    const priority = daysOverdue + (3.0 - state.sm2_ease_factor) * 2;

    suggestions.push({
      concept_id,
      days_overdue: daysOverdue,
      last_visited_at: state.last_visited_at,
      visit_count: state.visit_count,
      priority,
    });
  }
  // Most overdue + hardest concepts first
  suggestions.sort((a, b) => b.priority - a.priority);
  return suggestions;
}

/**
 * Infer a quality rating from engagement signals. Used when the client
 * reports engagement events but doesn't explicitly rate difficulty.
 */
export function inferQualityFromEngagement(params: {
  micro_exercise_correct?: boolean;
  micro_exercise_duration_ms?: number;
  explicit_difficulty_rating?: number; // 1 (easy) to 5 (hard) — from UI slider
  skipped_components_count?: number;
  completed_components_count?: number;
}): 0 | 1 | 2 | 3 | 4 {
  const {
    micro_exercise_correct,
    micro_exercise_duration_ms,
    explicit_difficulty_rating,
    skipped_components_count = 0,
    completed_components_count = 0,
  } = params;

  // Explicit rating takes precedence (student told us directly)
  if (explicit_difficulty_rating) {
    // 1 = easy → q=4; 5 = hard → q=1
    const mapped = Math.max(0, Math.min(4, 5 - explicit_difficulty_rating));
    return mapped as 0 | 1 | 2 | 3 | 4;
  }

  // Micro-exercise correct + reasonably fast = q4; correct but slow = q3; incorrect = q1
  if (micro_exercise_correct === true) {
    if (micro_exercise_duration_ms && micro_exercise_duration_ms < 30_000) return 4;
    return 3;
  }
  if (micro_exercise_correct === false) {
    return 1;
  }

  // No micro-exercise data — fall back to completion ratio
  const total = skipped_components_count + completed_components_count;
  if (total === 0) return 2;
  const completionRatio = completed_components_count / total;
  if (completionRatio >= 0.75) return 3;
  if (completionRatio >= 0.5) return 2;
  return 1;
}
