// @ts-nocheck
/**
 * Session Planner — types
 *
 * The student-facing answer to "given my current state + time + exam,
 * what should I do in the next N minutes?"
 *
 * This module is deliberately thin on I/O and heavy on composition —
 * it takes the outputs of existing primitives (priority engine,
 * attention resolver) and intersects them into an ordered,
 * time-budgeted list of concrete actions.
 *
 * Design invariants (mirror the other server-side modules):
 *
 *   1. PURE CORE. The `planSession` function is a pure function of
 *      its inputs. No DB access, no network, no mutation. This
 *      makes tests deterministic and lets the HTTP layer + any
 *      future CLI or MCP tool share the same planner.
 *
 *   2. NEVER RECOMMEND WHAT WE CAN'T DELIVER. Every action carries
 *      a `content_hint` (topic + difficulty + kind) that the caller
 *      can verify against the content resolver. The planner itself
 *      doesn't call the resolver — that would violate purity —
 *      but the hint is structured so the caller can check in O(1).
 *
 *   3. BUDGET-RESPECTING. Sum of all action.estimated_minutes is
 *      always ≤ budget.minutes_available. The resolver-derived
 *      action count caps this naturally; the planner also refuses
 *      to over-pack.
 *
 *   4. EXPLICIT RATIONALE. Every action carries a human-readable
 *      `rationale` that explains why THIS action was chosen given
 *      THIS student's state.
 *
 *   5. DETERMINISTIC WITH SEED. The same request produces the same
 *      plan. No randomness in the core; randomness, if ever needed,
 *      lives at a boundary (e.g. shuffle ties) and is seeded.
 */

import type { SessionContext, AttentionStrategy, AttentionBudget } from '../attention/types';
import type { TopicPriority } from '../engine/priority-engine';

// ============================================================================
// Request — single-exam (original) + multi-exam (v2.31)
// ============================================================================

export interface PlanRequest {
  /** Stable id for the student — could be auth user id or session id */
  student_id: string;
  /** Which exam the plan should target */
  exam_id: string;
  /** Minutes the student says they have right now (1-180) */
  minutes_available: number;
  /** ISO date of the student's target exam — drives proximity factor */
  exam_date: string;
  /** Topic confidence self-reports (1-5 per topic). Optional. */
  topic_confidence?: Record<string, number>;
  /** Latest diagnostic scores (0-1 per topic). Optional. */
  diagnostic_scores?: Record<string, number>;
  /**
   * Trailing spaced-repetition stats — accuracy + session counts +
   * last_practice_date per topic. Empty array OK (planner falls back
   * to confidence/diagnostic signals).
   */
  sr_stats?: Array<{
    topic: string;
    accuracy: number;
    sessions_count: number;
    accuracy_first_5: number;
    accuracy_last_5: number;
    last_practice_date: string | null;
  }>;
  /**
   * Weekly target hours — orients the daily-task scale. Defaults to 8
   * if not provided (a reasonable prep baseline).
   */
  weekly_hours?: number;
  /**
   * Trailing-7-day minutes of study — if provided, the attention
   * resolver uses it to relax the strategy on a student who has been
   * compounding short sessions. If omitted, the HTTP layer derives
   * it from the student's recent plan executions.
   */
  trailing_7d_minutes?: number;
  /**
   * Anchor time for all date math. Defaults to `new Date()` at call
   * time. Tests pass a fixed Date for determinism.
   */
  now?: Date;
}

/**
 * MultiExamPlanRequest — for students prepping for more than one exam
 * concurrently (e.g. JEE Main + BITSAT). The planner interleaves
 * actions across exams, weighted by exam-proximity: the closest exam
 * gets more attention on any given session.
 */
export interface MultiExamPlanRequest {
  student_id: string;
  minutes_available: number;
  /** One entry per exam the student is prepping for. 1-5 exams supported. */
  exams: Array<{
    exam_id: string;
    exam_date: string;
    topic_confidence?: Record<string, number>;
    diagnostic_scores?: Record<string, number>;
    sr_stats?: PlanRequest['sr_stats'];
  }>;
  weekly_hours?: number;
  trailing_7d_minutes?: number;
  now?: Date;
}

// ============================================================================
// Action
// ============================================================================

export type ActionKind =
  /** Practice one or more questions on a topic */
  | 'practice'
  /** Review concept explainer — no questions, just the worked example */
  | 'review'
  /** Take a micro-mock (short, mixed-topic simulated test) */
  | 'micro-mock'
  /** Revisit a recently-missed question (spaced repetition) */
  | 'spaced-review';

export interface ContentHint {
  /** Topic id — matches the MARKS_WEIGHTS keys */
  topic: string;
  /** Target difficulty the content resolver should prefer */
  difficulty: 'easy' | 'medium' | 'hard';
  /** How many items the frontend should fetch */
  count: number;
  /** Optional concept narrowing (specific sub-concept within the topic) */
  concept_id?: string;
}

export interface ActionRecommendation {
  /** Stable id per-plan — "ACT-1", "ACT-2", ... */
  id: string;
  kind: ActionKind;
  /** Student-visible title */
  title: string;
  /** Why this action was chosen for this student right now */
  rationale: string;
  /** Estimated minutes this action will take at student's current pace */
  estimated_minutes: number;
  /** Structured content hint — use this to fetch the actual content */
  content_hint: ContentHint;
  /** Priority score from the engine (0-10ish). Higher = more important. */
  priority_score: number;
  /**
   * Which exam this action targets. For single-exam plans this is the
   * plan's exam_id; for multi-exam plans it tags each action back to
   * its source exam. Always populated.
   */
  exam_id: string;
}

// ============================================================================
// Plan
// ============================================================================

export interface SessionPlan {
  /** Stable id: "PLN-<8 char>" */
  id: string;
  /** When the plan was generated (ISO) */
  generated_at: string;
  /** Echoes the request verbatim for auditability */
  request: PlanRequest;
  /** Resolved attention budget (echoed for transparency) */
  budget: AttentionBudget;
  /** Resolved attention strategy (echoed for transparency) */
  strategy: AttentionStrategy;
  /** Computed topic priorities at plan time (top 10) */
  top_priorities: TopicPriority[];
  /** Ordered list of actions — sum(estimated_minutes) ≤ budget.minutes_available */
  actions: ActionRecommendation[];
  /** Sum of estimated minutes across all actions */
  total_estimated_minutes: number;
  /** Human-readable one-sentence summary for the top of the screen */
  headline: string;
  /**
   * Populated when the student posts completion. Null/absent for
   * plans that haven't been executed yet. One-shot: a plan is
   * completed once; re-completion overwrites.
   */
  execution?: PlanExecution;
}

/**
 * A PlanExecution records what actually happened during a session.
 * Stored inline on the SessionPlan for audit locality — same file,
 * same pruning cycle.
 */
export interface PlanExecution {
  /** ISO timestamp the plan was marked complete */
  completed_at: string;
  /** Actual minutes the student spent (self-reported or measured client-side) */
  actual_minutes_spent: number;
  /** Per-action outcomes, keyed by action_id */
  actions_completed: ActionOutcome[];
  /** Optional student-visible note on the session as a whole */
  session_note?: string;
}

export interface ActionOutcome {
  /** References ActionRecommendation.id (e.g. "ACT-1") */
  action_id: string;
  /** Did the student actually attempt this action? */
  completed: boolean;
  /** Number of questions attempted (for practice / spaced-review / micro-mock) */
  attempts?: number;
  /** Number of correct answers */
  correct?: number;
  /** Minutes spent on this action specifically (may differ from estimated) */
  actual_minutes?: number;
  /** Optional per-action student note */
  note?: string;
}
