// @ts-nocheck
/**
 * Attention Primitive — shared types for session-length awareness
 * across every learning module.
 *
 * The design reality: students often have 3-8 minutes, not 45.
 * Infrastructure that assumes long sessions loses them mid-attempt.
 * Infrastructure that delivers shallow content when sessions are short
 * makes them incompetent. The attention primitive sits between these
 * failure modes — it lets every module know how much time the student
 * has RIGHT NOW, and adapt its output so N short sessions still
 * compound into real mastery.
 *
 * Modules that consume this:
 *   - src/gbrain/after-each-attempt.ts — next-step recommendations
 *   - src/exam-builder/orchestrator.ts — generation section sizing
 *   - src/sample-check/store.ts        — public view variants
 *   - src/exams/adapters/*.ts          — defaultGenerationSections +
 *                                         optional buildMicroMock
 *   - lesson delivery (future)         — component filtering
 *   - mock rendering (future)          — micro-mock vs full mock
 *
 * The must-include floor guarantee: no matter how short the session,
 * certain components are NEVER cut — the hook + one worked example +
 * the common traps for a lesson; one easy + one medium question for
 * a mock. This preserves correctness under pressure. Short != shallow.
 */

export type SessionContext =
  /** <= 3 min. Glance-and-go; commute check-ins. */
  | 'nano'
  /** 3-10 min. Typical mobile session — the sweet spot to design for. */
  | 'short'
  /** 10-25 min. Focused desk session. */
  | 'medium'
  /** > 25 min. Extended deep-work session. */
  | 'long';

/**
 * The budget the student declares (or the system infers from recent
 * session patterns). All time values in minutes.
 */
export interface AttentionBudget {
  /** How many minutes the student has available RIGHT NOW */
  minutes_available: number;
  /** Auto-classified from minutes_available */
  context: SessionContext;
  /** Optional: source of the budget signal */
  source?: 'student_declared' | 'inferred_from_history' | 'default';
  /** Optional: student's rolling average session length from past N sessions */
  historical_avg_minutes?: number;
}

/**
 * A strategy is the resolver's output: concrete instructions for every
 * consuming module about how to adapt to the current budget.
 *
 * Each field answers "what should THIS module do right now?"
 */
export interface AttentionStrategy {
  budget: AttentionBudget;

  // ── Mocks / Practice ──────────────────────────────────────────────
  /** How many mock questions to serve in this session */
  mock_question_count: number;
  /** Prefer easy/medium mix for short sessions (confidence), harder for long */
  mock_difficulty_mix: { easy: number; medium: number; hard: number };
  /** Whether to offer a "resume later" checkpoint mid-mock */
  mock_allow_checkpoint: boolean;

  // ── Lessons ───────────────────────────────────────────────────────
  /** Which lesson component kinds to surface; must-include floor always present */
  lesson_components_to_surface: Array<
    | 'hook' | 'definition' | 'intuition' | 'worked-example'
    | 'micro-exercise' | 'common-traps' | 'formal-statement' | 'connections'
  >;
  /** Whether to show the "want more depth?" CTA at the end */
  lesson_show_depth_cta: boolean;

  // ── GBrain recommendations ────────────────────────────────────────
  /** How many next-step recommendations to surface (1 for nano, 3-5 for long) */
  gbrain_max_recommendations: number;
  /**
   * Whether GBrain should prefer "quick win" concepts (near-mastery, close
   * the gap) or "prerequisite repair" (harder, longer payoff). Short
   * sessions bias to quick wins; long sessions can afford repair work.
   */
  gbrain_bias: 'quick_win' | 'balanced' | 'prerequisite_repair';

  // ── Feedback submission ───────────────────────────────────────────
  /** Whether to offer one-tap reactions vs full structured feedback form */
  feedback_mode: 'one_tap_only' | 'one_tap_plus_text' | 'full_form';

  // ── Session-continuity guarantees ─────────────────────────────────
  /** Must-include content the resolver guarantees regardless of budget */
  must_include_floor: string[];
  /** Human-readable rationale for admin/student audit */
  rationale: string;
}

/**
 * Rolling coverage tracker — the compound-competence guarantee.
 *
 * If a student always picks 'nano' budgets, the strategy resolver must
 * not let them avoid hard topics indefinitely. The tracker remembers
 * which (topic_id, difficulty) pairs have been deferred due to budget
 * constraints in recent sessions and promotes them when the student
 * accumulates enough short sessions to equal one long one.
 *
 * Stored per-student in the attention store. Pure data; no ML.
 */
export interface CumulativeCoverage {
  user_id: string;
  deferred: Array<{
    topic_id: string;
    difficulty: 'easy' | 'medium' | 'hard';
    times_deferred: number;
    first_deferred_at: string;
    last_deferred_at: string;
  }>;
  /** Total minutes of practice in the trailing 7 days */
  trailing_7d_minutes: number;
  /** Total sessions in the trailing 7 days */
  trailing_7d_sessions: number;
  updated_at: string;
}
