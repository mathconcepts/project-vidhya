// @ts-nocheck
/**
 * Tool Registry — declares what the admin orchestrator agent can DO.
 *
 * Every tool delegates to an existing module function. The registry is
 * the agent's capability surface — the thing a role can be authorized
 * against, the thing strategies suggest when proposing tasks.
 *
 * Tools are catalogued across 8 domains. Each tool has:
 *   - A stable id (used in role authorization + task suggestions)
 *   - A category (read / write / action / analysis)
 *   - A destructive flag (write/action tools that can't be undone)
 *   - Required roles (minimum authorization)
 *
 * Tool invocation goes through invokeTool() which:
 *   - Checks role authorization
 *   - Logs the invocation
 *   - Delegates to the underlying module
 *   - Captures output + timing
 */

import type { Tool, ToolInvocation, RoleId } from './types';

// ============================================================================
// Tool catalogue
// ============================================================================

export const TOOLS: Tool[] = [
  // ─── FEEDBACK domain ─────────────────────────────────────────────
  {
    id: 'feedback:list-pending-triage',
    domain: 'feedback',
    label: 'List feedback pending triage',
    description: 'Returns all feedback items in status=open or status=triaged needing admin attention',
    required_roles: ['owner', 'admin', 'qa-reviewer', 'analyst'],
    category: 'read',
    is_destructive: false,
  },
  {
    id: 'feedback:list-by-exam',
    domain: 'feedback',
    label: 'List feedback for an exam',
    description: 'Returns all feedback items filtered by exam_id',
    required_roles: ['owner', 'admin', 'qa-reviewer', 'analyst', 'exam-ops'],
    category: 'read',
    is_destructive: false,
    input_schema_doc: '{ exam_id: string }',
  },
  {
    id: 'feedback:triage',
    domain: 'feedback',
    label: 'Triage a feedback item',
    description: 'Assigns a priority (P0-P3) to a feedback item',
    required_roles: ['owner', 'admin', 'qa-reviewer'],
    category: 'write',
    is_destructive: false,
    input_schema_doc: '{ feedback_id: string, priority: "P0"|"P1"|"P2"|"P3" }',
  },
  {
    id: 'feedback:approve',
    domain: 'feedback',
    label: 'Approve feedback',
    description: 'Moves a triaged feedback item to approved state',
    required_roles: ['owner', 'admin'],
    category: 'write',
    is_destructive: false,
    input_schema_doc: '{ feedback_id: string }',
  },
  {
    id: 'feedback:apply',
    domain: 'feedback',
    label: 'Apply feedback',
    description: 'Records that a feedback item has been applied in a release',
    required_roles: ['owner', 'admin', 'content-ops'],
    category: 'write',
    is_destructive: false,
    input_schema_doc: '{ feedback_id: string, release_tag: string, change_description: string }',
  },

  // ─── SAMPLE-CHECK domain ─────────────────────────────────────────
  {
    id: 'sample-check:list-open',
    domain: 'sample-check',
    label: 'List open sample-checks',
    description: 'Returns all non-resolved sample checks across exams',
    required_roles: ['owner', 'admin', 'exam-ops', 'analyst'],
    category: 'read',
    is_destructive: false,
  },
  {
    id: 'sample-check:get-latest-for-exam',
    domain: 'sample-check',
    label: 'Get latest open sample-check',
    description: 'Returns the most recent open sample-check for a given exam',
    required_roles: ['owner', 'admin', 'exam-ops', 'qa-reviewer'],
    category: 'read',
    is_destructive: false,
    input_schema_doc: '{ exam_id: string }',
  },
  {
    id: 'sample-check:close-resolved',
    domain: 'sample-check',
    label: 'Close sample-check as resolved',
    description: 'Closes a sample-check as resolved (requires no open or approved-pending items)',
    required_roles: ['owner', 'admin', 'exam-ops'],
    category: 'action',
    is_destructive: false,
    input_schema_doc: '{ sample_id: string }',
  },

  // ─── COURSE domain ───────────────────────────────────────────────
  {
    id: 'course:get-for-exam',
    domain: 'course',
    label: 'Get live course for exam',
    description: 'Returns the latest LiveCourse for a given exam',
    required_roles: ['owner', 'admin', 'content-ops', 'exam-ops', 'analyst'],
    category: 'read',
    is_destructive: false,
    input_schema_doc: '{ exam_id: string }',
  },
  {
    id: 'course:list-all',
    domain: 'course',
    label: 'List all live courses',
    description: 'Returns every LiveCourse across all exams',
    required_roles: ['owner', 'admin', 'content-ops', 'exam-ops', 'analyst'],
    category: 'read',
    is_destructive: false,
  },
  {
    id: 'course:list-promotions',
    domain: 'course',
    label: 'List promotion records for exam',
    description: 'Returns all PromotionRecord entries for an exam (audit lineage)',
    required_roles: ['owner', 'admin', 'content-ops', 'exam-ops', 'analyst'],
    category: 'read',
    is_destructive: false,
    input_schema_doc: '{ exam_id?: string }',
  },

  // ─── EXAM-BUILDER domain ─────────────────────────────────────────
  {
    id: 'exam-builder:list-adapters',
    domain: 'exam-builder',
    label: 'List registered exam adapters',
    description: 'Returns all exam adapters currently registered in the registry',
    required_roles: ['owner', 'admin', 'exam-ops', 'analyst'],
    category: 'read',
    is_destructive: false,
  },
  {
    id: 'exam-builder:build-or-update',
    domain: 'exam-builder',
    label: 'Build or iterate exam course',
    description: 'Runs the master orchestrator for a given exam; iterate requires source_sample_ids',
    required_roles: ['owner', 'admin', 'exam-ops'],
    category: 'action',
    is_destructive: false,
    input_schema_doc: '{ exam_id: string, build_kind: "new"|"iterate", options?: {...} }',
  },

  // ─── ATTENTION domain ────────────────────────────────────────────
  {
    id: 'attention:get-overdue-deferrals',
    domain: 'attention',
    label: 'Get overdue deferrals',
    description: 'Returns deferred content items overdue for a student',
    required_roles: ['owner', 'admin', 'content-ops', 'analyst'],
    category: 'read',
    is_destructive: false,
    input_schema_doc: '{ user_id: string, threshold_days?: number }',
  },
  {
    id: 'attention:coverage-for-user',
    domain: 'attention',
    label: 'Get cumulative coverage for user',
    description: 'Returns the 7-day attention coverage stats for a student',
    required_roles: ['owner', 'admin', 'content-ops', 'analyst'],
    category: 'read',
    is_destructive: false,
    input_schema_doc: '{ user_id: string }',
  },

  // ─── MARKETING domain ────────────────────────────────────────────
  {
    id: 'marketing:list-stale-articles',
    domain: 'marketing',
    label: 'List stale articles',
    description: 'Returns articles marked stale by drift detection',
    required_roles: ['owner', 'admin', 'marketing-lead', 'content-ops'],
    category: 'read',
    is_destructive: false,
  },
  {
    id: 'marketing:list-articles-for-exam',
    domain: 'marketing',
    label: 'List articles for exam',
    description: 'Returns all articles with the given exam in their scope',
    required_roles: ['owner', 'admin', 'marketing-lead', 'content-ops', 'analyst'],
    category: 'read',
    is_destructive: false,
    input_schema_doc: '{ exam_id: string }',
  },
  {
    id: 'marketing:get-dashboard',
    domain: 'marketing',
    label: 'Get marketing dashboard',
    description: 'Returns the single-pane-of-glass marketing health summary',
    required_roles: ['owner', 'admin', 'marketing-lead', 'analyst'],
    category: 'read',
    is_destructive: false,
  },
  {
    id: 'marketing:detect-drift',
    domain: 'marketing',
    label: 'Trigger drift detection for feature',
    description: 'Marks articles referencing a given feature as stale',
    required_roles: ['owner', 'admin', 'marketing-lead'],
    category: 'action',
    is_destructive: false,
    input_schema_doc: '{ feature_id: string, change_summary: string }',
  },
  {
    id: 'marketing:launch-campaign',
    domain: 'marketing',
    label: 'Launch campaign',
    description: 'Launches a marketing campaign (auto-generates social cards + landing variants)',
    required_roles: ['owner', 'admin', 'marketing-lead'],
    category: 'action',
    is_destructive: false,
    input_schema_doc: '{ campaign_id: string }',
  },

  // ─── SCANNER / STRATEGY / TASK domains ───────────────────────────
  {
    id: 'scanner:run-full-scan',
    domain: 'scanner',
    label: 'Run full system scan',
    description: 'Produces a unified HealthReport across all modules',
    required_roles: ['owner', 'admin', 'analyst'],
    category: 'analysis',
    is_destructive: false,
  },
  {
    id: 'strategy:list-proposed',
    domain: 'strategy',
    label: 'List proposed strategies',
    description: 'Returns strategies from the most recent agent run',
    required_roles: ['owner', 'admin', 'analyst'],
    category: 'read',
    is_destructive: false,
  },
  {
    id: 'task:list-open',
    domain: 'task',
    label: 'List open tasks',
    description: 'Returns tasks in open/in_progress/blocked status, optionally filtered',
    required_roles: ['owner', 'admin', 'content-ops', 'exam-ops', 'marketing-lead', 'qa-reviewer', 'author', 'analyst'],
    category: 'read',
    is_destructive: false,
    input_schema_doc: '{ role?: RoleId, strategy_id?: string }',
  },
  {
    id: 'task:claim',
    domain: 'task',
    label: 'Claim a task',
    description: 'Assigns an open task to the claiming user',
    required_roles: ['owner', 'admin', 'content-ops', 'exam-ops', 'marketing-lead', 'qa-reviewer', 'author'],
    category: 'write',
    is_destructive: false,
    input_schema_doc: '{ task_id: string }',
  },
  {
    id: 'task:complete',
    domain: 'task',
    label: 'Complete a task',
    description: 'Marks a task as done with an optional completion note',
    required_roles: ['owner', 'admin', 'content-ops', 'exam-ops', 'marketing-lead', 'qa-reviewer', 'author'],
    category: 'write',
    is_destructive: false,
    input_schema_doc: '{ task_id: string, note?: string }',
  },

  // ─── LLM-BACKED TOOLS (v2.23.0) ──────────────────────────────────
  // These 4 tools route through the LLM bridge (llm-bridge.ts) which
  // reuses the existing LLMConfig discovery path. Each tool has a
  // deterministic fallback when no LLM is configured.
  {
    id: 'agent:narrate-strategy',
    domain: 'agent',
    label: 'Narrate a strategy',
    description:
      'Generate a 2-sentence human narration of a strategy for a busy admin. ' +
      'Uses the configured LLM provider; falls back to template output when no LLM configured.',
    required_roles: ['owner', 'admin', 'analyst', 'marketing-lead', 'content-ops', 'exam-ops'],
    category: 'analysis',
    is_destructive: false,
    input_schema_doc: '{ strategy_id: string, run_id?: string }',
  },
  {
    id: 'agent:summarize-health',
    domain: 'agent',
    label: 'Summarize health report',
    description:
      'Return a plain-English single-paragraph summary of the system health report. ' +
      'Used by owner dashboards + external LLM agents exploring the system.',
    required_roles: ['owner', 'admin', 'analyst'],
    category: 'analysis',
    is_destructive: false,
    input_schema_doc: '{ run_id?: string }',
  },
  {
    id: 'agent:suggest-next-action',
    domain: 'agent',
    label: 'Suggest next action for a role',
    description:
      'Given a role, pick the single highest-impact task they should do next. ' +
      'Uses deterministic priority sorting; LLM optionally enriches with a one-line reason.',
    required_roles: ['owner', 'admin', 'content-ops', 'exam-ops', 'marketing-lead', 'qa-reviewer', 'analyst', 'author'],
    category: 'analysis',
    is_destructive: false,
    input_schema_doc: '{ role: RoleId }',
  },
  {
    id: 'agent:describe-capabilities',
    domain: 'agent',
    label: 'Describe agent capabilities (self-introspection)',
    description:
      'Return a catalog of every tool, role, strategy kind, signal code, and insight kind ' +
      'the agent understands. Intended for MCP clients on first connect.',
    required_roles: ['owner', 'admin', 'content-ops', 'exam-ops', 'marketing-lead', 'qa-reviewer', 'analyst', 'author'],
    category: 'read',
    is_destructive: false,
  },

  // ── Student session planner (v2.31) ──────────────────────────────
  // Analytics-style tools — admin/analyst can query any student's
  // planner history. The student-facing HTTP surface (which forces
  // student_id from JWT) is separate; this tool path is for
  // orchestrator-level introspection.
  {
    id: 'student:plan-session',
    domain: 'student',
    label: 'Generate a session plan for a student',
    description:
      'Run the session planner for a given student — returns an ordered list of ' +
      'action recommendations (practice, review, spaced-review, micro-mock) that fit ' +
      'within the provided minutes budget. Pure function; does not persist.',
    required_roles: ['owner', 'admin', 'analyst'],
    category: 'analysis',
    is_destructive: false,
    input_schema_doc:
      '{ student_id, exam_id, exam_date, minutes_available, ' +
      'topic_confidence?, diagnostic_scores?, sr_stats?, weekly_hours?, trailing_7d_minutes? }',
  },
  {
    id: 'student:list-plans',
    domain: 'student',
    label: 'List recent session plans for a student',
    description:
      'Returns the most recent session plans (up to 50 per student) with their ' +
      'execution outcomes where recorded. Useful for cohort analysis and longitudinal ' +
      'review of study patterns.',
    required_roles: ['owner', 'admin', 'analyst'],
    category: 'read',
    is_destructive: false,
    input_schema_doc: '{ student_id: string, limit?: number (1-50) }',
  },
  {
    id: 'student:get-plan',
    domain: 'student',
    label: 'Get a specific session plan by id',
    description:
      'Fetch a single session plan by id including its execution record if any. ' +
      'Returns null if no plan exists with that id.',
    required_roles: ['owner', 'admin', 'analyst'],
    category: 'read',
    is_destructive: false,
    input_schema_doc: '{ plan_id: string }',
  },
  {
    id: 'student:get-plan-with-execution',
    domain: 'student',
    label: 'Get a plan plus aggregated outcomes in one shape',
    description:
      'Fetch a plan AND compute roll-up outcome stats in a single call — total attempts, ' +
      'total correct, accuracy, minutes-planned vs minutes-actual, per-topic breakdown. ' +
      'Coaching tools use this to avoid stitching two separate calls.',
    required_roles: ['owner', 'admin', 'analyst'],
    category: 'analysis',
    is_destructive: false,
    input_schema_doc: '{ plan_id: string }',
  },
];

// ============================================================================
// Query helpers — every read hydrates the tool with its JSON input_schema
// ============================================================================

import { INPUT_SCHEMAS } from './input-schemas';

function hydrate(tool: Tool): Tool {
  if (tool.input_schema) return tool;
  return { ...tool, input_schema: INPUT_SCHEMAS[tool.id] ?? INPUT_SCHEMAS['agent:describe-capabilities'] };
}

export function getTool(id: string): Tool | null {
  const raw = TOOLS.find(t => t.id === id);
  return raw ? hydrate(raw) : null;
}

export function listToolsByDomain(domain: string): Tool[] {
  return TOOLS.filter(t => t.domain === domain).map(hydrate);
}

export function listToolsForRole(role: RoleId): Tool[] {
  return TOOLS.filter(t => t.required_roles.includes(role)).map(hydrate);
}

export function canRoleInvoke(role: RoleId, tool_id: string): boolean {
  const tool = getTool(tool_id);
  if (!tool) return false;
  return tool.required_roles.includes(role);
}

// ============================================================================
// Tool invocation — delegates to existing module functions
// ============================================================================

function shortId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

export async function invokeTool(
  tool_id: string,
  input: any,
  actor: string,
  actor_role: RoleId,
): Promise<ToolInvocation> {
  const tool = getTool(tool_id);
  const id = shortId('INV');
  const started_at = new Date().toISOString();

  if (!tool) {
    return {
      id, tool_id, invoked_by: actor, invoked_by_role: actor_role, input,
      error: `Tool '${tool_id}' not found`,
      started_at, completed_at: started_at, duration_ms: 0,
    };
  }

  if (!canRoleInvoke(actor_role, tool_id)) {
    return {
      id, tool_id, invoked_by: actor, invoked_by_role: actor_role, input,
      error: `Role '${actor_role}' not authorized to invoke '${tool_id}' (requires one of: ${tool.required_roles.join(', ')})`,
      started_at, completed_at: started_at, duration_ms: 0,
    };
  }

  const t0 = Date.now();
  try {
    const output = await _dispatch(tool_id, input);
    const completed_at = new Date().toISOString();
    return {
      id, tool_id, invoked_by: actor, invoked_by_role: actor_role, input, output,
      started_at, completed_at, duration_ms: Date.now() - t0,
    };
  } catch (err: any) {
    const completed_at = new Date().toISOString();
    return {
      id, tool_id, invoked_by: actor, invoked_by_role: actor_role, input,
      error: err.message ?? String(err),
      started_at, completed_at, duration_ms: Date.now() - t0,
    };
  }
}

// ============================================================================
// Dispatcher — maps tool ids to underlying module calls
// ============================================================================

async function _dispatch(tool_id: string, input: any): Promise<any> {
  switch (tool_id) {
    // feedback
    case 'feedback:list-pending-triage': {
      const { listFeedback } = await import('../feedback/store');
      const open = listFeedback({ status: 'open' });
      const triaged = listFeedback({ status: 'triaged' });
      return [...open, ...triaged];
    }
    case 'feedback:list-by-exam': {
      const { listFeedback } = await import('../feedback/store');
      return listFeedback({ exam_id: input.exam_id });
    }
    case 'feedback:triage': {
      const { triageFeedback } = await import('../feedback/store');
      return triageFeedback(input.feedback_id, input.actor ?? 'agent', input.priority);
    }
    case 'feedback:approve': {
      const { approveFeedback } = await import('../feedback/store');
      return approveFeedback(input.feedback_id, input.actor ?? 'agent');
    }
    case 'feedback:apply': {
      const { applyFeedback } = await import('../feedback/store');
      return applyFeedback(input.feedback_id, input.actor ?? 'agent', input.release_tag, input.change_description);
    }

    // sample-check
    case 'sample-check:list-open': {
      const { listSamplesForExam } = await import('../sample-check/store');
      const { listExamAdapters } = await import('../exam-builder/registry');
      const out: any[] = [];
      for (const a of listExamAdapters()) {
        out.push(...listSamplesForExam(a.exam_id).filter(s => s.status === 'open'));
      }
      return out;
    }
    case 'sample-check:get-latest-for-exam': {
      const { getLatestOpenSample } = await import('../sample-check/store');
      return getLatestOpenSample(input.exam_id);
    }
    case 'sample-check:close-resolved': {
      const { closeSampleResolved } = await import('../sample-check/store');
      return closeSampleResolved(input.sample_id, input.actor ?? 'agent');
    }

    // course
    case 'course:get-for-exam': {
      const { getCourseByExam } = await import('../course/promoter');
      return getCourseByExam(input.exam_id);
    }
    case 'course:list-all': {
      const { listCourses } = await import('../course/promoter');
      return listCourses();
    }
    case 'course:list-promotions': {
      const { listPromotionRecords } = await import('../course/promoter');
      return listPromotionRecords(input?.exam_id);
    }

    // exam-builder
    case 'exam-builder:list-adapters': {
      const { listExamAdapters } = await import('../exam-builder/registry');
      return listExamAdapters().map(a => ({
        exam_id: a.exam_id, exam_code: a.exam_code, exam_name: a.exam_name,
        adapter_version: a.adapter_version,
      }));
    }
    case 'exam-builder:build-or-update': {
      const { buildOrUpdateCourse } = await import('../exam-builder/orchestrator');
      return buildOrUpdateCourse(input);
    }

    // attention
    case 'attention:get-overdue-deferrals': {
      const { getOverdueDeferrals } = await import('../attention/store');
      return getOverdueDeferrals(input.user_id, input.threshold_days);
    }
    case 'attention:coverage-for-user': {
      const { getCoverage } = await import('../attention/store');
      return getCoverage(input.user_id);
    }

    // marketing
    case 'marketing:list-stale-articles': {
      const { listArticles } = await import('../marketing/blog-store');
      return listArticles({ status: 'stale' });
    }
    case 'marketing:list-articles-for-exam': {
      const { listArticles } = await import('../marketing/blog-store');
      return listArticles({ exam_id: input.exam_id });
    }
    case 'marketing:get-dashboard': {
      const { getDashboardSummary } = await import('../marketing/sync-engine');
      return getDashboardSummary();
    }
    case 'marketing:detect-drift': {
      const { detectDriftFromFeatureChange } = await import('../marketing/sync-engine');
      return detectDriftFromFeatureChange(input.feature_id, input.change_summary, input.actor ?? 'agent');
    }
    case 'marketing:launch-campaign': {
      const { launchCampaign } = await import('../marketing/campaign-store');
      return launchCampaign(input.campaign_id);
    }

    // scanner / strategy / task — dispatched at higher level
    case 'scanner:run-full-scan': {
      const { runScan } = await import('./scanner');
      return await runScan();
    }
    case 'strategy:list-proposed': {
      const { getLatestAgentRun } = await import('./agent');
      const run = getLatestAgentRun();
      return run?.strategies_proposed ?? [];
    }
    case 'task:list-open': {
      const { listTasks } = await import('./task-store');
      return listTasks({ statuses: ['open', 'in_progress', 'blocked'], role: input?.role, strategy_id: input?.strategy_id });
    }
    case 'task:claim': {
      const { claimTask } = await import('./task-store');
      return claimTask(input.task_id, input.actor ?? 'agent');
    }
    case 'task:complete': {
      const { completeTask } = await import('./task-store');
      return completeTask(input.task_id, input.actor ?? 'agent', input.note);
    }

    // ─── LLM-BACKED TOOLS (v2.23.0) ──────────────────────────────────
    case 'agent:narrate-strategy': {
      const { narrateStrategyTool } = await import('./agent-tools');
      return narrateStrategyTool(input);
    }
    case 'agent:summarize-health': {
      const { summarizeHealthTool } = await import('./agent-tools');
      return summarizeHealthTool(input);
    }
    case 'agent:suggest-next-action': {
      const { suggestNextActionTool } = await import('./agent-tools');
      return suggestNextActionTool(input);
    }
    case 'agent:describe-capabilities': {
      const { describeCapabilitiesTool } = await import('./agent-tools');
      return describeCapabilitiesTool();
    }

    // Student session planner (v2.31) ────────────────────────────────
    case 'student:plan-session': {
      const { planSession, savePlan } = await import('../session-planner');
      const plan = await planSession({
        student_id: String(input?.student_id ?? ''),
        exam_id: String(input?.exam_id ?? ''),
        exam_date: String(input?.exam_date ?? ''),
        minutes_available: Number(input?.minutes_available ?? 0),
        topic_confidence: input?.topic_confidence,
        diagnostic_scores: input?.diagnostic_scores,
        sr_stats: input?.sr_stats,
        weekly_hours: input?.weekly_hours,
        trailing_7d_minutes: input?.trailing_7d_minutes,
      });
      // Persist as a side effect so the audit trail is consistent
      // across HTTP and MCP paths. Non-fatal on failure.
      try { savePlan(plan); } catch { /* best-effort */ }
      return plan;
    }
    case 'student:list-plans': {
      const { listPlansForStudent, listAllPlans } = await import('../session-planner');
      const limit = typeof input?.limit === 'number'
        ? Math.min(50, Math.max(1, input.limit))
        : 20;
      const student_id = String(input?.student_id ?? '');
      // '*' wildcard → cross-student recent-activity view for the
      // admin dashboard. Role gating at the tool level (analyst+)
      // already prevents students from hitting this.
      const plans = student_id === '*'
        ? listAllPlans(limit)
        : listPlansForStudent(student_id, limit);
      return { plans, count: plans.length };
    }
    case 'student:get-plan': {
      const { getPlan } = await import('../session-planner');
      const plan = getPlan(String(input?.plan_id ?? ''));
      return plan ?? { error: `Plan '${input?.plan_id}' not found` };
    }
    case 'student:get-plan-with-execution': {
      const { getPlan } = await import('../session-planner');
      const plan = getPlan(String(input?.plan_id ?? ''));
      if (!plan) {
        return { error: `Plan '${input?.plan_id}' not found` };
      }
      // Aggregate outcomes into a flat rollup for one-call coaching UX.
      const exec = plan.execution;
      let totalAttempts = 0, totalCorrect = 0, actualMinutes = 0;
      const perTopic: Record<string, { attempts: number; correct: number; minutes: number }> = {};
      if (exec) {
        actualMinutes = exec.actual_minutes_spent;
        for (const outcome of exec.actions_completed) {
          const action = plan.actions.find((a: any) => a.id === outcome.action_id);
          if (!action) continue;
          const attempts = outcome.attempts ?? 0;
          const correct = outcome.correct ?? 0;
          const minutes = outcome.actual_minutes ?? 0;
          totalAttempts += attempts;
          totalCorrect += correct;
          const topic = action.content_hint?.topic ?? 'unknown';
          if (!perTopic[topic]) perTopic[topic] = { attempts: 0, correct: 0, minutes: 0 };
          perTopic[topic].attempts += attempts;
          perTopic[topic].correct += correct;
          perTopic[topic].minutes += minutes;
        }
      }
      return {
        plan,
        rollup: {
          executed: !!exec,
          total_attempts: totalAttempts,
          total_correct: totalCorrect,
          accuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : null,
          minutes_planned: plan.total_estimated_minutes,
          minutes_actual: actualMinutes,
          adherence_ratio: plan.total_estimated_minutes > 0
            ? actualMinutes / plan.total_estimated_minutes
            : null,
          per_topic: perTopic,
        },
      };
    }

    default:
      throw new Error(`No dispatch handler for tool '${tool_id}'`);
  }
}
