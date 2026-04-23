// @ts-nocheck
/**
 * Admin Orchestrator Agent — main entry point.
 *
 * runAdminAgent() performs the full cycle:
 *   1. Scan — reads every module, produces HealthReport
 *   2. Analyse — strategy engine emits proposed strategies
 *   3. Enqueue — strategies materialize as Tasks (opt-in)
 *   4. Narrate — optional LLM narration via content resolver
 *   5. Persist — the full AgentRun is stored for audit trail
 *
 * Insights are computed alongside — cross-module correlations that
 * don't fit into a single strategy (e.g. "calculus feedback AND
 * attention deferrals both rising").
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type { AgentRun, AgentInsight, Strategy, HealthReport } from './types';
import { runScan } from './scanner';
import { proposeStrategies } from './strategy-engine';
import { createTasksFromStrategy } from './task-store';

// ============================================================================

interface StoreShape {
  runs: AgentRun[];
  insights: AgentInsight[];
}

const STORE_PATH = '.data/admin-orchestrator-runs.json';
const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ runs: [], insights: [] }),
});

function shortId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

// ============================================================================
// Main runner
// ============================================================================

export interface RunAdminAgentInput {
  triggered_by: string;
  trigger_kind?: 'manual' | 'scheduled' | 'event-driven';
  trigger_event?: string;
  /** If true, auto-create tasks from proposed strategies */
  auto_enqueue_tasks?: boolean;
  /** If true, attempt LLM narration of each strategy (opt-in) */
  attempt_llm_narration?: boolean;
}

export async function runAdminAgent(input: RunAdminAgentInput): Promise<AgentRun> {
  const id = shortId('RUN');
  const started_at = new Date().toISOString();
  const t0 = Date.now();
  const notes: string[] = [];

  // Step 1: Scan
  const health_report = await runScan();
  notes.push(`Scanner: ${health_report.generation_ms}ms, ${health_report.signals.length} signals (${health_report.overall.status})`);

  // Step 2: Analyse
  const strategies = proposeStrategies(health_report, id);
  notes.push(`Strategy engine: ${strategies.length} strategies proposed`);

  // Step 3: Enqueue tasks
  let tasks_enqueued = 0;
  if (input.auto_enqueue_tasks) {
    for (const strategy of strategies) {
      const created = createTasksFromStrategy(strategy, 'agent');
      tasks_enqueued += created.length;
    }
    notes.push(`Auto-enqueued ${tasks_enqueued} tasks`);
  }

  // Step 4: LLM narration (optional; never blocks)
  // Routes through the LLM bridge which uses the existing LLMConfig
  // discovery path (env vars or request header). Returns null gracefully
  // when no LLM is configured.
  let llm_narration_attempted = false;
  let llm_narration_succeeded = false;
  if (input.attempt_llm_narration && strategies.length > 0) {
    llm_narration_attempted = true;
    try {
      const { callLLMWithConfig } = await import('./llm-bridge');
      for (const strategy of strategies) {
        try {
          const { output } = await callLLMWithConfig({
            system: 'You are a concise technical writer. Two sentences max. No preamble.',
            user:
              `Summarize this admin strategy for a busy founder. TWO sentences only.\n\n` +
              `Headline: ${strategy.headline}\n` +
              `Priority: ${strategy.priority}\n` +
              `Rationale: ${strategy.rationale}\n` +
              `Expected outcome: ${strategy.expected_outcome}`,
            task_type: 'summarization',
            max_tokens: 120,
            temperature: 0.3,
            agent_id: 'admin-orchestrator:run-narration',
          });
          if (output?.content) strategy.llm_narration = output.content;
        } catch {
          // Non-fatal per-strategy
        }
      }
      llm_narration_succeeded = strategies.some(s => !!s.llm_narration);
      notes.push(`LLM narration: ${llm_narration_succeeded ? 'succeeded (partial or full)' : 'fell back to deterministic rationale'}`);
    } catch (err: any) {
      notes.push(`LLM narration unavailable: ${err.message ?? 'bridge not reachable'}`);
    }
  }

  // Step 5: Persist the run
  const completed_at = new Date().toISOString();
  const duration_ms = Date.now() - t0;

  const run: AgentRun = {
    id,
    started_at,
    completed_at,
    duration_ms,
    triggered_by: input.triggered_by,
    trigger_kind: input.trigger_kind ?? 'manual',
    trigger_event: input.trigger_event,
    health_report,
    strategies_proposed: strategies,
    tasks_enqueued,
    llm_narration_attempted,
    llm_narration_succeeded,
    notes,
  };

  const store = _store.read();
  store.runs.push(run);
  // Keep only last 50 runs
  if (store.runs.length > 50) store.runs = store.runs.slice(-50);

  // Compute + persist insights alongside
  const insights = computeInsights(health_report);
  store.insights.push(...insights);
  if (store.insights.length > 200) store.insights = store.insights.slice(-200);

  _store.write(store);

  return run;
}

// ============================================================================
// Insights — cross-module correlations
// ============================================================================

function computeInsights(report: HealthReport): AgentInsight[] {
  const out: AgentInsight[] = [];
  const now = new Date().toISOString();

  // Insight 1: feedback ↔ attention correlation
  const highVolumeTopics = new Set(report.modules.feedback.high_volume_topics.map(h => h.topic_id));
  const deferredTopics = new Set(report.modules.attention.top_deferred_topics.map(d => d.topic_id));
  const overlap = [...highVolumeTopics].filter(t => deferredTopics.has(t));
  if (overlap.length > 0) {
    out.push({
      id: shortId('INS'),
      generated_at: now,
      kind: 'feedback-attention-correlation',
      headline: `${overlap.length} topic${overlap.length > 1 ? 's show' : ' shows'} both high feedback AND rising deferrals: ${overlap.join(', ')}`,
      detail:
        `When students give feedback AND defer the same topic, the content itself is likely the issue — ` +
        `not just difficulty. Prioritize content-ops review on these topics.`,
      data_points: overlap.map(t => ({ label: t, value: 'feedback+deferrals' })),
      suggested_strategy_kinds: ['address-attention-deferrals', 'triage-feedback-backlog'],
    });
  }

  // Insight 2: course-feedback-debt
  const pendingEntries = report.modules.course.exams_with_pending_applied_feedback;
  if (pendingEntries.length > 0) {
    out.push({
      id: shortId('INS'),
      generated_at: now,
      kind: 'course-feedback-debt',
      headline: `${pendingEntries.reduce((n, e) => n + e.pending_count, 0)} applied feedback items waiting for course promotion`,
      detail:
        `Students are seeing outdated content. Admin-approved improvements exist in the feedback store but ` +
        `haven't been baked into a new LiveCourse version via iterate-build.`,
      data_points: pendingEntries.map(e => ({ label: e.exam_id, value: e.pending_count })),
      suggested_strategy_kinds: ['iterate-and-promote-course'],
    });
  }

  // Insight 3: campaign opportunity
  const pub = report.modules.marketing.article_totals['published'] ?? 0;
  if (pub >= 3 && report.modules.marketing.active_campaigns === 0) {
    out.push({
      id: shortId('INS'),
      generated_at: now,
      kind: 'campaign-opportunity',
      headline: `${pub} published articles but zero active campaigns — acquisition funnel inactive`,
      detail:
        `Content corpus has reached ${pub} published articles yet no campaign is amplifying them. ` +
        `Campaign-level UTM attribution is missing.`,
      data_points: [{ label: 'published', value: pub }, { label: 'active campaigns', value: 0 }],
      suggested_strategy_kinds: ['launch-marketing-campaign'],
    });
  }

  // Insight 4: marketing content gap (published articles for exam with stale content)
  if (report.modules.marketing.stale_article_count > 0 && pub > 0) {
    const staleRatio = report.modules.marketing.stale_article_count / (pub + report.modules.marketing.stale_article_count);
    if (staleRatio >= 0.3) {
      out.push({
        id: shortId('INS'),
        generated_at: now,
        kind: 'marketing-content-gap',
        headline: `${Math.round(staleRatio * 100)}% of the recent article corpus is stale`,
        detail:
          `High stale-to-published ratio suggests feature churn is outpacing content updates. Consider ` +
          `either slowing feature announcements or building content capacity.`,
        data_points: [
          { label: 'stale', value: report.modules.marketing.stale_article_count },
          { label: 'published', value: pub },
          { label: 'stale ratio', value: `${Math.round(staleRatio * 100)}%` },
        ],
        suggested_strategy_kinds: ['rereview-stale-articles'],
      });
    }
  }

  return out;
}

// ============================================================================
// Queries
// ============================================================================

export function getAgentRun(id: string): AgentRun | null {
  return _store.read().runs.find(r => r.id === id) ?? null;
}

export function listAgentRuns(limit = 20): AgentRun[] {
  const runs = _store.read().runs;
  return runs.slice(-limit).reverse(); // Newest first
}

export function getLatestAgentRun(): AgentRun | null {
  const runs = _store.read().runs;
  return runs.length > 0 ? runs[runs.length - 1] : null;
}

export function listInsights(limit = 20): AgentInsight[] {
  const insights = _store.read().insights;
  return insights.slice(-limit).reverse();
}

// ============================================================================
// Utility: reset for smoke tests
// ============================================================================

export function _resetAgentStore(): void {
  _store.write({ runs: [], insights: [] });
}
