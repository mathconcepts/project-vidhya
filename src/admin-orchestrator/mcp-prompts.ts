// @ts-nocheck
/**
 * MCP Prompts — structured prompt templates external agents fetch.
 *
 * This is the third MCP primitive alongside tools (side-effectful) and
 * resources (raw state). Prompts are different: the server prepares
 * context + an instruction as MCP-formatted messages, and returns them
 * verbatim. The CLIENT runs them through its own LLM. We don't pay for
 * inference — the client does.
 *
 * Shape returned by prompts/get:
 *
 *   {
 *     description: "human-readable explanation",
 *     messages: [
 *       { role: "user" | "assistant",
 *         content: { type: "text", text: "..." } },
 *       ...
 *     ]
 *   }
 *
 * Design principles
 * =================
 *
 *   1. Every prompt is READ-ONLY. No state mutation happens in this
 *      path. Mutation still flows through tools/call.
 *
 *   2. Every prompt is DETERMINISTIC. Server does not call an LLM to
 *      build a prompt. If current state is missing, prompts either
 *      trigger a scan (like resources/read of health/latest does) or
 *      return a minimal placeholder message.
 *
 *   3. Every prompt is ROLE-SCOPED. Analyst sees briefing prompts,
 *      author sees task-handoff only, owner+admin see everything.
 *
 *   4. Every prompt emits SELF-CONTAINED messages. The client doesn't
 *      need to read any resources or call any tools to use them —
 *      all relevant context is embedded in the returned text.
 *
 *   5. Token efficiency. Briefings are capped at ~1500 tokens of
 *      input. The server trims signals, tasks, and stats to the top
 *      N rather than dumping the entire run.
 *
 * Catalog
 * =======
 *
 *   daily-standup           founder's 90-second morning brief
 *   triage-briefing         context for a feedback triage session
 *   strategy-review         review proposed strategies
 *   task-handoff            pick up a task with full surrounding context
 *   week-in-review          retrospective aggregate of past 7 days
 *   content-debt-report     exams with pending feedback ready to
 *                           promote into a new course version
 */

import type { RoleId, AgentRun, Strategy, Signal, Task, Insight } from './types';

// ============================================================================
// Types
// ============================================================================

export interface PromptArgumentSpec {
  name: string;
  description: string;
  required?: boolean;
}

export interface PromptDescriptor {
  /** Stable prompt name — what the client uses in prompts/get */
  name: string;
  /** Short description for prompts/list */
  description: string;
  /** Arguments the prompt accepts; matches MCP spec */
  arguments: PromptArgumentSpec[];
  /** Roles authorized to fetch this prompt */
  authorized_roles: RoleId[];
}

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: { type: 'text'; text: string };
}

export interface PromptGetResult {
  description: string;
  messages: PromptMessage[];
}

export interface PromptGetError {
  code: 'not-found' | 'not-authorized' | 'invalid-arguments' | 'internal-error';
  message: string;
}

export interface PromptGetContext {
  role: RoleId;
  actor: string;
}

// ============================================================================
// Role scopes
// ============================================================================

const ALL_ROLES: RoleId[] = [
  'owner', 'admin', 'content-ops', 'exam-ops', 'marketing-lead',
  'qa-reviewer', 'analyst', 'author',
];
const FOUNDER_SCOPE: RoleId[] = ['owner', 'admin', 'analyst'];
const OPS_SCOPE: RoleId[] = ['owner', 'admin', 'content-ops', 'exam-ops', 'qa-reviewer', 'analyst'];

// ============================================================================
// Catalog
// ============================================================================

export const PROMPT_CATALOG: PromptDescriptor[] = [
  {
    name: 'daily-standup',
    description:
      "Founder's 90-second morning brief. Embeds current health status, top signals, " +
      "P0/P1 strategies, and in-progress tasks into a single user message.",
    arguments: [],
    authorized_roles: FOUNDER_SCOPE,
  },
  {
    name: 'triage-briefing',
    description:
      'Context for a feedback triage session — pending-triage items grouped by topic, ' +
      'with suggested priority hints based on volume and recency.',
    arguments: [
      {
        name: 'exam_id',
        description: 'Optional — narrow the briefing to a single exam',
        required: false,
      },
    ],
    authorized_roles: ['owner', 'admin', 'content-ops', 'exam-ops', 'qa-reviewer'],
  },
  {
    name: 'strategy-review',
    description:
      'Review proposed strategies from the latest agent run, with rationale, ' +
      'evidence, and dependency graph.',
    arguments: [
      {
        name: 'priority_filter',
        description: "Optional — 'P0', 'P1', 'P2', 'P3', or 'P0+P1' (default: all)",
        required: false,
      },
    ],
    authorized_roles: FOUNDER_SCOPE,
  },
  {
    name: 'task-handoff',
    description:
      'Pick up a task with full surrounding context: the strategy it belongs to, ' +
      'related signals, and any blockers.',
    arguments: [
      {
        name: 'task_id',
        description: 'The task id to hand off',
        required: true,
      },
    ],
    authorized_roles: ALL_ROLES,
  },
  {
    name: 'week-in-review',
    description:
      'Retrospective aggregate of the past 7 days: runs completed, tasks closed, ' +
      'feedback resolved, strategies applied.',
    arguments: [
      {
        name: 'week_start',
        description: 'Optional ISO date (YYYY-MM-DD). Defaults to 7 days ago.',
        required: false,
      },
    ],
    authorized_roles: FOUNDER_SCOPE,
  },
  {
    name: 'content-debt-report',
    description:
      'Exam-by-exam breakdown of courses with pending feedback not yet promoted. ' +
      'Helps the content-ops lead decide which courses to iterate on.',
    arguments: [],
    authorized_roles: OPS_SCOPE,
  },
];

// ============================================================================
// Argument parsing
// ============================================================================

function validateArgs(
  descriptor: PromptDescriptor,
  args: Record<string, unknown> | undefined,
): { ok: true } | { ok: false; error: string } {
  const provided = args ?? {};
  for (const spec of descriptor.arguments) {
    if (spec.required && (provided[spec.name] === undefined || provided[spec.name] === null || provided[spec.name] === '')) {
      return { ok: false, error: `Required argument '${spec.name}' missing: ${spec.description}` };
    }
  }
  return { ok: true };
}

// ============================================================================
// Public API — list + get
// ============================================================================

export function listPromptsForRole(role: RoleId): {
  prompts: Array<Omit<PromptDescriptor, 'authorized_roles'>>;
} {
  return {
    prompts: PROMPT_CATALOG
      .filter(d => d.authorized_roles.includes(role))
      .map(({ authorized_roles, ...rest }) => rest),
  };
}

export async function getPrompt(
  name: string,
  args: Record<string, unknown> | undefined,
  ctx: PromptGetContext,
): Promise<PromptGetResult | { error: PromptGetError }> {
  const descriptor = PROMPT_CATALOG.find(d => d.name === name);
  if (!descriptor) {
    return { error: { code: 'not-found', message: `Prompt '${name}' is not in the catalog` } };
  }
  if (!descriptor.authorized_roles.includes(ctx.role)) {
    return {
      error: {
        code: 'not-authorized',
        message: `Role '${ctx.role}' cannot fetch prompt '${name}' (requires one of: ${descriptor.authorized_roles.join(', ')})`,
      },
    };
  }

  const validated = validateArgs(descriptor, args);
  if (!validated.ok) {
    return { error: { code: 'invalid-arguments', message: validated.error } };
  }

  try {
    switch (name) {
      case 'daily-standup':       return await buildDailyStandup(ctx);
      case 'triage-briefing':     return await buildTriageBriefing(args, ctx);
      case 'strategy-review':     return await buildStrategyReview(args, ctx);
      case 'task-handoff':        return await buildTaskHandoff(args, ctx);
      case 'week-in-review':      return await buildWeekInReview(args, ctx);
      case 'content-debt-report': return await buildContentDebtReport(ctx);
      default:
        return { error: { code: 'not-found', message: `No builder for prompt '${name}'` } };
    }
  } catch (err: any) {
    return { error: { code: 'internal-error', message: err.message ?? String(err) } };
  }
}

// ============================================================================
// Builders — each composes a PromptGetResult from current state
// ============================================================================

/**
 * Format helpers — keep the prompt text readable and cap token counts.
 */
function formatSignal(s: Signal, indent = '  '): string {
  return `${indent}[${s.severity}] ${s.headline} — ${s.detail} (code: ${s.code})`;
}
function formatStrategy(s: Strategy, indent = '  '): string {
  return (
    `${indent}[${s.priority}] ${s.headline}\n` +
    `${indent}  kind: ${s.kind}, affects ${s.affected_exams.length} exam(s), ${s.proposed_tasks.length} task(s)\n` +
    `${indent}  rationale: ${s.rationale}\n` +
    `${indent}  expected: ${s.expected_outcome}`
  );
}
function formatTask(t: Task, indent = '  '): string {
  return (
    `${indent}[${t.status}] ${t.title} (${t.id})\n` +
    `${indent}  role: ${t.assigned_role}, effort: ~${t.estimated_effort_minutes}m\n` +
    `${indent}  ${t.description}`
  );
}

// ─── daily-standup ───────────────────────────────────────────────────
async function buildDailyStandup(ctx: PromptGetContext): Promise<PromptGetResult> {
  const { getLatestAgentRun, runAdminAgent, listInsights } = await import('./agent');

  let run = getLatestAgentRun();
  if (!run) {
    // No runs exist — trigger a scan-only run so the prompt isn't empty
    run = await runAdminAgent({
      triggered_by: `mcp-prompt:${ctx.actor}`,
      trigger_kind: 'event-driven',
      auto_enqueue_tasks: false,
      attempt_llm_narration: false,
    });
  }

  const { listTasks } = await import('./task-store');
  const openTasks = listTasks({ statuses: ['open', 'in_progress'] });
  const insights = listInsights(5);

  const h = run.health_report.overall;
  const topSignals = run.health_report.signals.slice(0, 4);
  const highPriorityStrategies = run.strategies_proposed
    .filter(s => s.priority === 'P0' || s.priority === 'P1')
    .slice(0, 5);

  const runStamp = new Date(run.completed_at).toISOString().replace('T', ' ').slice(0, 16);
  const taskLines = openTasks.slice(0, 5).map(t => formatTask(t, '    ')).join('\n');
  const signalLines = topSignals.map(s => formatSignal(s, '    ')).join('\n');
  const strategyLines = highPriorityStrategies.map(s => formatStrategy(s, '    ')).join('\n');
  const insightLines = insights.slice(0, 3)
    .map(i => `    • ${i.headline} — ${i.detail}`)
    .join('\n');

  const text = `You are briefing a solo founder on their system's overnight state.
They have 90 seconds. Be concrete; lead with critical issues, then
acknowledge what's working. No bullet points — read it like a ship's log.

═══ SYSTEM STATE (run ${run.id}, completed ${runStamp}) ═══

Overall: ${h.status} — ${h.summary}
Counts: ${h.critical_count} critical / ${h.warning_count} warning signals,
        ${run.strategies_proposed.length} strategies proposed,
        ${run.tasks_enqueued} tasks enqueued this run, ${openTasks.length} tasks open overall.

Top signals:
${signalLines || '    (none)'}

P0/P1 strategies:
${strategyLines || '    (none — system is calm)'}

Recent cross-module insights:
${insightLines || '    (none)'}

Open tasks (oldest 5):
${taskLines || '    (empty queue — nice)'}

Write the founder's morning brief now.`;

  return {
    description: 'Morning standup brief for the founder, 90 seconds, read as prose.',
    messages: [{ role: 'user', content: { type: 'text', text } }],
  };
}

// ─── triage-briefing ─────────────────────────────────────────────────
async function buildTriageBriefing(
  args: Record<string, any> | undefined,
  ctx: PromptGetContext,
): Promise<PromptGetResult> {
  const examId = args?.exam_id as string | undefined;
  const FB = await import('../feedback/store');

  const pending = FB.listFeedback({ states: ['submitted'] })
    .filter(f => !examId || f.target.exam_id === examId);

  // Group by topic to surface high-volume topics
  const byTopic: Record<string, typeof pending> = {};
  for (const f of pending) {
    const key = (f.target as any).topic_id || '(unknown)';
    if (!byTopic[key]) byTopic[key] = [];
    byTopic[key].push(f);
  }

  const sortedTopics = Object.entries(byTopic)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);

  const groupLines = sortedTopics.map(([topic, items]) => {
    const priorityHint =
      items.length >= 4 ? 'P1' :
      items.length >= 2 ? 'P2' :
      'P3';
    const sample = items.slice(0, 3).map(f => `      • [${f.kind}] ${f.description}`).join('\n');
    return (
      `  topic: ${topic} (${items.length} items, suggested priority: ${priorityHint})\n${sample}` +
      (items.length > 3 ? `\n      ... +${items.length - 3} more` : '')
    );
  }).join('\n\n');

  const scope = examId ? `Scope: ${examId}` : 'Scope: all exams';
  const text = `You are preparing someone for a feedback-triage session. They will
assign a priority (P0-P3) to each of the items below. Your job is to
help them go fast by summarising what's common across items and
highlighting anything that should jump to the front of the queue.

═══ PENDING-TRIAGE FEEDBACK ═══
${scope}
Total: ${pending.length} items across ${sortedTopics.length} topics.

${groupLines || '  (no items awaiting triage — nice)'}

Brief the triage session:
  1. Lead with the single highest-impact item (if any).
  2. Call out high-volume topics that suggest a systematic issue.
  3. Suggest priorities for the grouped items.
Keep it under 300 words.`;

  return {
    description:
      `Context for a feedback-triage session. ${pending.length} pending items. ` +
      (examId ? `Filtered to exam ${examId}.` : 'All exams.'),
    messages: [{ role: 'user', content: { type: 'text', text } }],
  };
}

// ─── strategy-review ─────────────────────────────────────────────────
async function buildStrategyReview(
  args: Record<string, any> | undefined,
  ctx: PromptGetContext,
): Promise<PromptGetResult> {
  const { getLatestAgentRun, runAdminAgent } = await import('./agent');
  let run = getLatestAgentRun();
  if (!run) {
    run = await runAdminAgent({
      triggered_by: `mcp-prompt:${ctx.actor}`,
      trigger_kind: 'event-driven',
      auto_enqueue_tasks: false,
      attempt_llm_narration: false,
    });
  }

  const filter = (args?.priority_filter as string | undefined)?.toUpperCase() ?? '';
  const wanted = filter === 'P0+P1' ? ['P0', 'P1']
    : filter ? [filter]
    : ['P0', 'P1', 'P2', 'P3'];

  const strategies = run.strategies_proposed.filter(s => wanted.includes(s.priority));
  const lines = strategies.map((s, i) => {
    const evidence = (s.evidence || []).slice(0, 3).map(e => `      • ${e}`).join('\n');
    const tasks = s.proposed_tasks.map(t => `      • [${t.assigned_role}] ${t.title} (~${t.estimated_effort_minutes}m)`).join('\n');
    return (
      `  ${i + 1}. [${s.priority}] ${s.headline}\n` +
      `      kind: ${s.kind}\n` +
      `      rationale: ${s.rationale}\n` +
      `      expected outcome: ${s.expected_outcome}\n` +
      `      evidence:\n${evidence || '      (none recorded)'}\n` +
      `      proposed tasks (${s.proposed_tasks.length}):\n${tasks || '      (none)'}`
    );
  }).join('\n\n');

  const text = `You are reviewing proposed strategies for a solo founder. They want
to know which to approve, which to defer, and which to kill. Base your
review on the evidence each strategy cites and the effort each will
cost. Be decisive.

═══ STRATEGIES FOR REVIEW ═══
Filter: ${wanted.join(', ')}
Count:  ${strategies.length}
Run:    ${run.id} at ${run.completed_at}

${lines || '  (no strategies match this filter)'}

For each strategy, decide: approve, defer, or kill. Give a one-sentence
reason. Consider dependencies — highest-priority strategies whose tasks
unlock other strategies are best approved first. When done, summarise
the overall week's priority.`;

  return {
    description: `Review of ${strategies.length} strategies from run ${run.id}.`,
    messages: [{ role: 'user', content: { type: 'text', text } }],
  };
}

// ─── task-handoff ────────────────────────────────────────────────────
async function buildTaskHandoff(
  args: Record<string, any> | undefined,
  ctx: PromptGetContext,
): Promise<PromptGetResult> {
  const taskId = args?.task_id as string;
  const { getTask } = await import('./task-store');
  const task = getTask(taskId);
  if (!task) {
    throw new Error(`Task '${taskId}' not found`);
  }

  // Pull the strategy the task belongs to (if any) from the latest run
  const { getLatestAgentRun } = await import('./agent');
  const run = getLatestAgentRun();
  const strategy = run?.strategies_proposed.find(s => s.id === task.strategy_id);
  // evidence is string[] of signal codes / data-point descriptors. Match
  // any run-level signals whose code appears as a substring of an
  // evidence string.
  const relatedSignals = strategy && run
    ? run.health_report.signals.filter(sig =>
        (strategy.evidence || []).some(e => typeof e === 'string' && e.includes(sig.code)))
    : [];

  const activityLines = (task.activity_log || []).slice(-5)
    .map(e => `      ${e.at} · ${e.actor} · ${e.action}${e.note ? ' — ' + e.note : ''}`)
    .join('\n');

  const signalsSection = relatedSignals.length > 0
    ? relatedSignals.map(s => formatSignal(s, '    ')).join('\n')
    : '    (none linked to this task)';

  const strategySection = strategy
    ? (
      `  strategy: [${strategy.priority}] ${strategy.headline}\n` +
      `    kind: ${strategy.kind}\n` +
      `    rationale: ${strategy.rationale}\n` +
      `    expected outcome: ${strategy.expected_outcome}`
    )
    : '  strategy: (task has no parent strategy — ad-hoc task)';

  const text = `You are briefing someone who is about to pick up a task. Give them
enough context to start work immediately without having to dig through
the rest of the system. Keep it tight and practical.

═══ TASK HANDOFF ═══

Task: ${task.id}
Title: ${task.title}
Role: ${task.assigned_role}
Status: ${task.status}
Effort: ~${task.estimated_effort_minutes} minutes
Tools suggested: ${task.suggested_tool_ids?.join(', ') || '(none — use your judgment)'}

Description:
  ${task.description}

Parent strategy:
${strategySection}

Related signals that motivated this work:
${signalsSection}

Recent activity on this task:
${activityLines || '      (no prior activity — this is a fresh pickup)'}

Brief the person picking up this task:
  1. Why does this task exist?
  2. What's the fastest path to completion?
  3. What should they double-check before marking done?
Keep it under 200 words.`;

  return {
    description: `Handoff briefing for task ${task.id}: "${task.title}".`,
    messages: [{ role: 'user', content: { type: 'text', text } }],
  };
}

// ─── week-in-review ──────────────────────────────────────────────────
async function buildWeekInReview(
  args: Record<string, any> | undefined,
  ctx: PromptGetContext,
): Promise<PromptGetResult> {
  const weekStart = args?.week_start
    ? new Date(String(args.week_start))
    : new Date(Date.now() - 7 * 86400000);
  if (isNaN(weekStart.getTime())) {
    throw new Error(`Invalid week_start: ${args?.week_start}`);
  }
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const { listAgentRuns, listInsights } = await import('./agent');
  const { listTasks } = await import('./task-store');
  const allRuns = listAgentRuns();
  const runsInWeek = allRuns.filter(r => {
    const t = new Date(r.completed_at).getTime();
    return t >= weekStart.getTime() && t < weekEnd.getTime();
  });

  const allTasks = listTasks({});
  const completedThisWeek = allTasks.filter(t => {
    if (t.status !== 'done') return false;
    const lastDone = (t.activity_log || []).find(e => e.action === 'completed');
    if (!lastDone) return false;
    const dt = new Date(lastDone.at).getTime();
    return dt >= weekStart.getTime() && dt < weekEnd.getTime();
  });

  const tasksByRole: Record<string, number> = {};
  for (const t of completedThisWeek) {
    tasksByRole[t.assigned_role] = (tasksByRole[t.assigned_role] || 0) + 1;
  }
  const tasksByRoleLine = Object.entries(tasksByRole)
    .sort((a, b) => b[1] - a[1])
    .map(([r, n]) => `${r}=${n}`)
    .join(', ') || '(none)';

  const insights = listInsights(20).filter(i => {
    const dt = new Date(i.generated_at).getTime();
    return dt >= weekStart.getTime() && dt < weekEnd.getTime();
  });

  // Aggregate signals across the week
  const signalCounts: Record<string, number> = {};
  for (const r of runsInWeek) {
    for (const s of r.health_report.signals) {
      signalCounts[s.code] = (signalCounts[s.code] || 0) + 1;
    }
  }
  const topSignalCodes = Object.entries(signalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, n]) => `    • ${code} — raised ${n}× this week`)
    .join('\n');

  const text = `You are writing a founder's weekly retrospective. They want to see
what shipped, what stayed broken, and what's trending. Keep it honest;
don't paper over problems.

═══ WEEK-IN-REVIEW (${iso(weekStart)} → ${iso(weekEnd)}) ═══

Agent runs:      ${runsInWeek.length}
Tasks closed:    ${completedThisWeek.length}  (${tasksByRoleLine})
Insights:        ${insights.length} generated
Top signals:
${topSignalCodes || '    (none detected)'}

Insights this week:
${insights.slice(0, 5).map(i => `    • [${i.kind}] ${i.headline}`).join('\n') || '    (none)'}

Narrate the week for the founder:
  1. What shipped. Tasks closed, by role.
  2. What trended up. Which signal codes fired repeatedly.
  3. What's stuck. What didn't get closed and why.
  4. One concrete action for next week.
Write it as 3-4 short paragraphs, not bullets.`;

  return {
    description: `Week-in-review from ${iso(weekStart)} to ${iso(weekEnd)}.`,
    messages: [{ role: 'user', content: { type: 'text', text } }],
  };
}

// ─── content-debt-report ─────────────────────────────────────────────
async function buildContentDebtReport(ctx: PromptGetContext): Promise<PromptGetResult> {
  const { listCourses } = await import('../course/promoter');
  const FB = await import('../feedback/store');

  const courses = listCourses();
  const debtByExam: Array<{
    exam_id: string;
    current_version: string;
    last_promoted_at: string;
    pending_feedback: number;
    applied_since_promotion: number;
  }> = [];

  for (const c of courses) {
    const exam = c.exam_id;
    const pending = FB.listFeedback({ states: ['submitted', 'triaged', 'approved'] })
      .filter(f => f.target.exam_id === exam).length;
    const lastPromotedMs = new Date(c.last_promoted_at).getTime();
    const applied = FB.listFeedback({ states: ['applied'] })
      .filter(f => f.target.exam_id === exam)
      .filter(f => {
        if (!f.applied_at) return false;
        return new Date(f.applied_at).getTime() > lastPromotedMs;
      }).length;
    debtByExam.push({
      exam_id: exam,
      current_version: c.current_version?.value ?? '(unknown)',
      last_promoted_at: c.last_promoted_at,
      pending_feedback: pending,
      applied_since_promotion: applied,
    });
  }
  debtByExam.sort((a, b) => (b.applied_since_promotion + b.pending_feedback) - (a.applied_since_promotion + a.pending_feedback));

  const examLines = debtByExam.map(e => {
    const ready = e.applied_since_promotion >= 3 ? '  ← READY TO PROMOTE' : '';
    return (
      `    ${e.exam_id}: live v${e.current_version} (promoted ${e.last_promoted_at.slice(0, 10)})\n` +
      `      ${e.pending_feedback} pending fb, ${e.applied_since_promotion} applied since promotion${ready}`
    );
  }).join('\n\n');

  const text = `You are advising the content-ops lead on which courses to iterate
next. They want one exam to focus on this week. Use the signals below
to pick.

═══ CONTENT DEBT BY EXAM ═══

Total exams with live courses: ${debtByExam.length}

${examLines || '    (no live courses — build some first)'}

Recommend ONE exam to iterate next week. Justify in two sentences.
Note: "applied_since_promotion ≥ 3" is the usual threshold for when
a new course version pays for its rollout cost.`;

  return {
    description: `Content debt across ${debtByExam.length} live courses.`,
    messages: [{ role: 'user', content: { type: 'text', text } }],
  };
}
