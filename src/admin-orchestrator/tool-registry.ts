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
];

// ============================================================================
// Query helpers
// ============================================================================

export function getTool(id: string): Tool | null {
  return TOOLS.find(t => t.id === id) ?? null;
}

export function listToolsByDomain(domain: string): Tool[] {
  return TOOLS.filter(t => t.domain === domain);
}

export function listToolsForRole(role: RoleId): Tool[] {
  return TOOLS.filter(t => t.required_roles.includes(role));
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

    default:
      throw new Error(`No dispatch handler for tool '${tool_id}'`);
  }
}
