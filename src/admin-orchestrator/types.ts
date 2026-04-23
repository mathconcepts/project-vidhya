// @ts-nocheck
/**
 * Admin Orchestrator Agent — types.
 *
 * The agent is the owner/admin's single source of truth. It SCANS every
 * module, ANALYSES patterns, PROPOSES strategies, and tracks TASKS that
 * follow from those strategies.
 *
 * Architecture:
 *
 *   [Scanner] ─── reads ───> (feedback, sample-check, course,
 *                             attention, marketing)
 *        │
 *        ▼
 *   HealthReport
 *        │
 *        ▼
 *   [Strategy Engine] ─── matches patterns ───> proposed Strategies[]
 *        │
 *        ▼
 *   [Task Generator] ── assigns to Role ───> Tasks[]
 *        │
 *        ▼
 *   [Task Store] ── admin works them off
 *
 * The agent is DETERMINISTIC. Same inputs always produce the same
 * strategies. An optional LLM hook can narrate strategies in friendlier
 * language but is never the source of the strategy itself.
 */

// ============================================================================
// ROLES
// ============================================================================

export type RoleId =
  | 'owner'
  | 'admin'
  | 'content-ops'
  | 'exam-ops'
  | 'marketing-lead'
  | 'qa-reviewer'
  | 'analyst'
  | 'author';

export interface Role {
  id: RoleId;
  label: string;
  description: string;
  responsibilities: string[];
  /** Tool ids this role can invoke (from the tool registry) */
  authorized_tool_ids: string[];
  /** Strategies that typically produce tasks for this role */
  typical_strategy_kinds: StrategyKind[];
}

// ============================================================================
// TOOLS — the capabilities the agent (and roles) can invoke
// ============================================================================

export type ToolDomain =
  | 'feedback'
  | 'sample-check'
  | 'course'
  | 'attention'
  | 'marketing'
  | 'exam-builder'
  | 'scanner'
  | 'strategy'
  | 'task'
  | 'agent';

export interface Tool {
  id: string;                          // e.g. 'feedback:list-pending-triage'
  domain: ToolDomain;
  label: string;
  description: string;
  /** Who can invoke this tool */
  required_roles: RoleId[];
  /** Human-readable input shape, for docs */
  input_schema_doc?: string;
  /**
   * Machine-readable JSON Schema (Draft 2020-12) describing the input
   * shape. Populated by getTool() from input-schemas.ts for every
   * registered tool. External agents consuming the MCP endpoint rely
   * on this for parameter validation.
   */
  input_schema?: any;
  /** Tool category for UI grouping */
  category: 'read' | 'write' | 'action' | 'analysis';
  /** True if tool performs destructive/irreversible action */
  is_destructive: boolean;
}

export interface ToolInvocation {
  id: string;
  tool_id: string;
  invoked_by: string;
  invoked_by_role: RoleId;
  input: any;
  output?: any;
  error?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

// ============================================================================
// HEALTH — what the scanner produces
// ============================================================================

export interface HealthReport {
  generated_at: string;
  generation_ms: number;

  /** Per-module health summary */
  modules: {
    feedback: FeedbackHealth;
    sample_check: SampleCheckHealth;
    course: CourseHealth;
    attention: AttentionHealth;
    marketing: MarketingHealth;
    exam_builder: ExamBuilderHealth;
  };

  /** Cross-module signals the scanner noticed */
  signals: HealthSignal[];

  /** Overall system status */
  overall: {
    status: 'healthy' | 'attention-needed' | 'degraded';
    summary: string;
    critical_count: number;
    warning_count: number;
  };
}

export interface FeedbackHealth {
  total_items: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  oldest_open_age_hours: number;
  high_volume_topics: Array<{ topic_id: string; count: number }>;
  recent_application_count_7d: number;
}

export interface SampleCheckHealth {
  open_samples_by_exam: Array<{ exam_id: string; count: number; oldest_age_hours: number }>;
  total_open: number;
  total_closed_resolved: number;
  total_closed_superseded: number;
  exams_with_no_sample: string[];  // exam_ids
}

export interface CourseHealth {
  live_courses: Array<{
    exam_id: string;
    version: string;
    last_promoted_at: string;
    age_days_since_promotion: number;
  }>;
  exams_without_course: string[];
  exams_with_pending_applied_feedback: Array<{ exam_id: string; pending_count: number }>;
}

export interface AttentionHealth {
  total_tracked_students: number;
  trailing_7d_session_count: number;
  top_deferred_topics: Array<{ topic_id: string; difficulty: string; times_deferred: number; times_accumulated: number }>;
  students_with_overdue_deferrals: number;
}

export interface MarketingHealth {
  article_totals: Record<string, number>;
  stale_article_count: number;
  stale_reasons_unique: string[];
  published_without_campaign: number;
  active_campaigns: number;
  social_cards_total: number;
  last_published_age_days: number | null;
}

export interface ExamBuilderHealth {
  registered_exams: Array<{ exam_id: string; exam_code: string; exam_name: string; topic_count: number }>;
  total_adapters: number;
}

// ============================================================================
// SIGNALS — specific observations the scanner makes
// ============================================================================

export type HealthSignalSeverity = 'info' | 'warning' | 'critical';

export interface HealthSignal {
  id: string;
  severity: HealthSignalSeverity;
  domain: ToolDomain;
  code: string;                         // e.g. 'feedback:high-volume-topic'
  headline: string;                     // short one-liner for the dashboard
  detail: string;                       // paragraph-length explanation
  affected_entity_ids?: string[];       // IDs the admin can drill into
  detected_at: string;
}

// ============================================================================
// STRATEGIES — what the agent proposes
// ============================================================================

export type StrategyKind =
  | 'expand-content-corpus'
  | 'triage-feedback-backlog'
  | 'iterate-and-promote-course'
  | 'rereview-stale-articles'
  | 'launch-marketing-campaign'
  | 'review-cross-exam-signal'
  | 'calibrate-topic-weights'
  | 'nudge-aging-sample-checks'
  | 'generate-social-push'
  | 'address-attention-deferrals';

export interface Strategy {
  id: string;
  kind: StrategyKind;
  headline: string;
  rationale: string;                    // WHY the agent proposes this
  evidence: string[];                   // The signal IDs + data points that triggered it
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  affected_exams: string[];
  affected_topic_ids: string[];
  /** Role-oriented task list this strategy produces when approved */
  proposed_tasks: ProposedTask[];
  /** Human-readable expected outcome if executed */
  expected_outcome: string;
  /** Optional LLM-narrated summary; filled in opportunistically */
  llm_narration?: string;
  generated_at: string;
  generation_run_id: string;
}

export interface ProposedTask {
  title: string;
  description: string;
  assigned_role: RoleId;
  suggested_tool_ids: string[];
  inputs_hint?: any;
  estimated_effort_minutes: number;
  depends_on_indices?: number[];        // Indices of other proposed_tasks that must complete first
}

// ============================================================================
// TASKS — what admins actually work on
// ============================================================================

export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled';

export interface Task {
  id: string;
  strategy_id: string;
  title: string;
  description: string;
  assigned_role: RoleId;
  assigned_to?: string;                 // Specific user_id when claimed
  status: TaskStatus;
  suggested_tool_ids: string[];
  inputs_hint?: any;
  estimated_effort_minutes: number;
  depends_on_task_ids: string[];
  activity_log: TaskActivityEntry[];
  created_at: string;
  claimed_at?: string;
  completed_at?: string;
  completed_by?: string;
  completion_note?: string;
}

export interface TaskActivityEntry {
  at: string;
  actor: string;
  kind: 'created' | 'claimed' | 'status_change' | 'note' | 'tool_invoked' | 'blocked' | 'unblocked' | 'completed';
  payload?: any;
}

// ============================================================================
// AGENT RUN — the full scan→analyse→propose cycle
// ============================================================================

export interface AgentRun {
  id: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  triggered_by: string;
  trigger_kind: 'manual' | 'scheduled' | 'event-driven';
  trigger_event?: string;
  health_report: HealthReport;
  strategies_proposed: Strategy[];
  tasks_enqueued: number;               // Count of tasks auto-created
  llm_narration_attempted: boolean;
  llm_narration_succeeded: boolean;
  notes: string[];
}

// ============================================================================
// INSIGHTS — cross-module correlations the agent finds
// ============================================================================

export interface AgentInsight {
  id: string;
  generated_at: string;
  kind:
    | 'feedback-attention-correlation'    // e.g. "calculus feedback up AND deferrals up"
    | 'marketing-content-gap'              // "published articles missing for topics with high engagement"
    | 'course-feedback-debt'               // "applied feedback pending in course not yet promoted"
    | 'campaign-opportunity'               // "article corpus dense enough for a named campaign"
    | 'cross-exam-learning';               // "BITSAT feedback pattern applies to UGEE"
  headline: string;
  detail: string;
  data_points: Array<{ label: string; value: string | number }>;
  suggested_strategy_kinds: StrategyKind[];
}
