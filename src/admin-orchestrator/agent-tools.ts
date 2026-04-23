// @ts-nocheck
/**
 * LLM-backed agent tools — the 4 tools introduced in v2.23.0.
 *
 * Each tool:
 *   1. Does deterministic work first (scan, pick strategy, sort tasks,
 *      enumerate capabilities) — this always succeeds.
 *   2. Optionally enriches with LLM-generated narration via the bridge.
 *      If the bridge returns null (no config, no key, adapter error),
 *      the tool returns its deterministic output with narration=null.
 *
 * External MCP agents calling these tools always get a useful result.
 * The LLM layer is icing on top.
 */

import { callLLMWithConfig, describeLLMAvailability } from './llm-bridge';
import { TOOLS } from './tool-registry';
import { ROLES } from './role-registry';
import type { Strategy, HealthReport, RoleId, Task } from './types';

// ============================================================================
// agent:narrate-strategy
// ============================================================================

export interface NarrateStrategyInput {
  strategy_id: string;
  run_id?: string;
}

export interface NarrateStrategyOutput {
  strategy_id: string;
  /** Deterministic 1-line summary from strategy fields — always present */
  deterministic_summary: string;
  /** LLM-generated 2-sentence narration — null when no LLM configured or call failed */
  llm_narration: string | null;
  /** Metadata about the LLM call attempt */
  llm_meta: {
    attempted: boolean;
    provider?: string;
    model?: string;
    latency_ms?: number;
    skip_reason?: string;
    error?: string;
  };
}

export async function narrateStrategyTool(input: NarrateStrategyInput): Promise<NarrateStrategyOutput> {
  const { getAgentRun, getLatestAgentRun } = await import('./agent');

  const run = input.run_id ? getAgentRun(input.run_id) : getLatestAgentRun();
  if (!run) {
    return {
      strategy_id: input.strategy_id,
      deterministic_summary: 'No agent run available — trigger POST /api/admin/agent/run first.',
      llm_narration: null,
      llm_meta: { attempted: false, skip_reason: 'no-run' },
    };
  }

  const strategy = run.strategies_proposed.find(s => s.id === input.strategy_id);
  if (!strategy) {
    return {
      strategy_id: input.strategy_id,
      deterministic_summary: `Strategy ${input.strategy_id} not found in run ${run.id}.`,
      llm_narration: null,
      llm_meta: { attempted: false, skip_reason: 'strategy-not-found' },
    };
  }

  const deterministic_summary =
    `[${strategy.priority}] ${strategy.headline}. ` +
    `Affects ${strategy.affected_exams.length} exam(s), ${strategy.proposed_tasks.length} task(s).`;

  // LLM call
  const prompt =
    `You are summarizing an admin strategy for a busy founder. Write TWO short sentences — ` +
    `no more. First sentence: what the strategy does. Second sentence: why it matters now.

` +
    `Strategy headline: ${strategy.headline}
` +
    `Kind: ${strategy.kind}
` +
    `Priority: ${strategy.priority}
` +
    `Rationale: ${strategy.rationale}
` +
    `Expected outcome: ${strategy.expected_outcome}
` +
    `Task count: ${strategy.proposed_tasks.length}`;

  const { output, meta } = await callLLMWithConfig({
    system: 'You are a concise technical writer. Two sentences max. No preamble.',
    user: prompt,
    task_type: 'summarization',
    max_tokens: 120,
    temperature: 0.3,
    agent_id: 'admin-orchestrator:narrate-strategy',
  });

  return {
    strategy_id: strategy.id,
    deterministic_summary,
    llm_narration: output?.content ?? null,
    llm_meta: {
      attempted: meta.attempted,
      provider: output?.provider,
      model: output?.model,
      latency_ms: output?.latency_ms,
      skip_reason: meta.skip_reason,
      error: meta.error,
    },
  };
}

// ============================================================================
// agent:summarize-health
// ============================================================================

export interface SummarizeHealthInput {
  run_id?: string;
}

export interface SummarizeHealthOutput {
  run_id: string;
  deterministic_summary: string;
  llm_summary: string | null;
  signal_count: number;
  critical_count: number;
  overall_status: string;
  llm_meta: NarrateStrategyOutput['llm_meta'];
}

export async function summarizeHealthTool(input: SummarizeHealthInput): Promise<SummarizeHealthOutput> {
  const { getAgentRun, getLatestAgentRun, runAdminAgent } = await import('./agent');

  // If no run_id given and no runs exist, trigger a lightweight scan-only run
  let run = input.run_id ? getAgentRun(input.run_id) : getLatestAgentRun();
  if (!run) {
    run = await runAdminAgent({
      triggered_by: 'agent:summarize-health',
      trigger_kind: 'event-driven',
      auto_enqueue_tasks: false,
      attempt_llm_narration: false,
    });
  }

  const r = run.health_report;
  const deterministic_summary =
    `Status: ${r.overall.status}. ${r.overall.summary}. ` +
    `Feedback: ${r.modules.feedback.total_items} items (${r.modules.feedback.high_volume_topics.length} high-volume topics). ` +
    `Sample-check: ${r.modules.sample_check.total_open} open. ` +
    `Marketing: ${r.modules.marketing.article_totals['published'] ?? 0} published, ${r.modules.marketing.stale_article_count} stale.`;

  const signalSummary = r.signals.slice(0, 6)
    .map(s => `- [${s.severity}] ${s.headline}`)
    .join('\n');

  const prompt =
    `Summarize this system health for a founder in 2-3 sentences. Be specific; use the numbers.\n\n` +
    `Overall: ${r.overall.status} (${r.overall.summary})\n` +
    `Module totals:\n` +
    `- Feedback: ${r.modules.feedback.total_items} items, ${r.modules.feedback.high_volume_topics.length} high-volume topics\n` +
    `- Sample-check: ${r.modules.sample_check.total_open} open\n` +
    `- Course: ${r.modules.course.live_courses.length} live\n` +
    `- Marketing: ${r.modules.marketing.article_totals['published'] ?? 0} published, ${r.modules.marketing.stale_article_count} stale\n` +
    `Top signals:\n${signalSummary}`;

  const { output, meta } = await callLLMWithConfig({
    system: 'You write tight operational status summaries for executives. 2-3 sentences. No hedging.',
    user: prompt,
    task_type: 'summarization',
    max_tokens: 180,
    temperature: 0.2,
    agent_id: 'admin-orchestrator:summarize-health',
  });

  return {
    run_id: run.id,
    deterministic_summary,
    llm_summary: output?.content ?? null,
    signal_count: r.signals.length,
    critical_count: r.overall.critical_count,
    overall_status: r.overall.status,
    llm_meta: {
      attempted: meta.attempted,
      provider: output?.provider,
      model: output?.model,
      latency_ms: output?.latency_ms,
      skip_reason: meta.skip_reason,
      error: meta.error,
    },
  };
}

// ============================================================================
// agent:suggest-next-action
// ============================================================================

export interface SuggestNextActionInput {
  role: RoleId;
}

export interface SuggestNextActionOutput {
  role: RoleId;
  suggested_task: Task | null;
  reason: string;
  llm_reason: string | null;
  alternative_tasks: Array<{ id: string; title: string; priority_hint?: string }>;
  llm_meta: NarrateStrategyOutput['llm_meta'];
}

export async function suggestNextActionTool(input: SuggestNextActionInput): Promise<SuggestNextActionOutput> {
  const { listTasks } = await import('./task-store');
  const { getLatestAgentRun } = await import('./agent');

  // Find open tasks for this role; prefer by strategy priority
  const openTasks = listTasks({ statuses: ['open'], role: input.role });
  if (openTasks.length === 0) {
    return {
      role: input.role,
      suggested_task: null,
      reason: 'No open tasks for this role.',
      llm_reason: null,
      alternative_tasks: [],
      llm_meta: { attempted: false, skip_reason: 'nothing-to-do' },
    };
  }

  // Deterministic: pick the task whose strategy has the highest priority.
  // Ties broken by estimated_effort_minutes asc (smaller tasks first to
  // unblock dependencies faster).
  const latestRun = getLatestAgentRun();
  const strategyPriority: Record<string, number> = {};
  if (latestRun) {
    for (const s of latestRun.strategies_proposed) {
      strategyPriority[s.id] = ({ P0: 0, P1: 1, P2: 2, P3: 3 } as any)[s.priority] ?? 4;
    }
  }
  const sorted = [...openTasks].sort((a, b) => {
    const pA = strategyPriority[a.strategy_id] ?? 4;
    const pB = strategyPriority[b.strategy_id] ?? 4;
    if (pA !== pB) return pA - pB;
    return a.estimated_effort_minutes - b.estimated_effort_minutes;
  });

  const picked = sorted[0];
  const alternatives = sorted.slice(1, 4).map(t => ({
    id: t.id, title: t.title,
    priority_hint: Object.entries(strategyPriority).find(([sid]) => sid === t.strategy_id)?.[1] !== undefined
      ? `P${strategyPriority[t.strategy_id]}` : undefined,
  }));

  const priorityLabel = strategyPriority[picked.strategy_id] !== undefined
    ? `P${strategyPriority[picked.strategy_id]}` : 'unranked';
  const reason =
    `Highest-priority (${priorityLabel}) open task for ${input.role}: ${picked.title}. ` +
    `Estimated ${picked.estimated_effort_minutes} minutes.`;

  const prompt =
    `You're advising a ${input.role}. They have ${openTasks.length} open tasks. ` +
    `The deterministic sort picked: "${picked.title}" (${priorityLabel}, ~${picked.estimated_effort_minutes}m). ` +
    `Write ONE sentence explaining why this is the right first task for this role.\n\n` +
    `Task description: ${picked.description}`;

  const { output, meta } = await callLLMWithConfig({
    system: 'You give concise operational guidance. One sentence. No hedging.',
    user: prompt,
    task_type: 'summarization',
    max_tokens: 80,
    temperature: 0.3,
    agent_id: 'admin-orchestrator:suggest-next-action',
  });

  return {
    role: input.role,
    suggested_task: picked,
    reason,
    llm_reason: output?.content ?? null,
    alternative_tasks: alternatives,
    llm_meta: {
      attempted: meta.attempted,
      provider: output?.provider,
      model: output?.model,
      latency_ms: output?.latency_ms,
      skip_reason: meta.skip_reason,
      error: meta.error,
    },
  };
}

// ============================================================================
// agent:describe-capabilities — self-introspection (no LLM needed)
// ============================================================================

export interface DescribeCapabilitiesOutput {
  version: string;
  /** JSON Schema version used for input_schema */
  schema_dialect: string;
  tool_count: number;
  role_count: number;
  strategy_kinds: string[];
  signal_codes: string[];
  insight_kinds: string[];
  llm_availability: ReturnType<typeof describeLLMAvailability>;
}

export function describeCapabilitiesTool(): DescribeCapabilitiesOutput {
  // Strategy kinds are declared as a union type — enumerate the literal values
  // in the order the strategy engine tries them.
  const strategy_kinds = [
    'triage-feedback-backlog',
    'nudge-aging-sample-checks',
    'iterate-and-promote-course',
    'rereview-stale-articles',
    'launch-marketing-campaign',
    'address-attention-deferrals',
    'expand-content-corpus',
    'review-cross-exam-signal',
    'calibrate-topic-weights',
    'generate-social-push',
  ];
  const signal_codes = [
    'feedback:high-volume-topic',
    'feedback:stale-open-items',
    'sample-check:aging-sample',
    'sample-check:exam-with-no-sample',
    'course:pending-feedback-not-promoted',
    'course:exam-has-no-live-course',
    'course:aging-since-last-promotion',
    'attention:rising-deferrals',
    'marketing:stale-articles',
    'marketing:publish-gap-no-campaign',
    'marketing:publishing-cadence-slow',
  ];
  const insight_kinds = [
    'feedback-attention-correlation',
    'course-feedback-debt',
    'campaign-opportunity',
    'marketing-content-gap',
    'cross-exam-learning',
  ];

  // Count tools + roles from the top-level imports (ESM-safe)
  return {
    version: '2.24.0',
    schema_dialect: 'https://json-schema.org/draft/2020-12/schema',
    tool_count: TOOLS.length,
    role_count: Object.keys(ROLES).length,
    strategy_kinds,
    signal_codes,
    insight_kinds,
    llm_availability: describeLLMAvailability(),
  };
}
