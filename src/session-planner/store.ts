// @ts-nocheck
/**
 * Session plan store — persists generated plans for audit + history.
 *
 * Append-only convention matching the admin-orchestrator stores.
 * Stores plans keyed by id with a secondary index on student_id so
 * "show me my recent plans" is O(entries) but fast enough for
 * realistic scale (a student generates maybe 5-10 plans per day).
 *
 * Separation of concerns: the pure planner in planner.ts doesn't
 * touch this. The HTTP route calls the planner, then asks this
 * module to persist the result.
 *
 * v2.31: execution tracking — plans grow an optional `execution`
 * field when the student posts completion. This enables:
 *   - trailing-7d-minutes derivation for the attention resolver
 *   - projected sr_stats for subsequent plans
 *   - per-student history with actual outcomes
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type {
  SessionPlan, PlanExecution, ActionOutcome,
} from './types';

interface StoreShape {
  plans: SessionPlan[];
}

const STORE_PATH = '.data/session-plans.json';
const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ plans: [] }),
});

// Soft cap: keep last N plans per student. Older plans are pruned
// lazily on writes so the store doesn't grow unbounded across months.
const MAX_PLANS_PER_STUDENT = 50;

export function savePlan(plan: SessionPlan): void {
  const store = _store.read();
  store.plans.push(plan);
  _store.write({ plans: prunePlans(store.plans) });
}

function prunePlans(plans: SessionPlan[]): SessionPlan[] {
  const byStudent = new Map<string, SessionPlan[]>();
  for (const p of plans) {
    const key = p.request.student_id;
    if (!byStudent.has(key)) byStudent.set(key, []);
    byStudent.get(key)!.push(p);
  }
  const pruned: SessionPlan[] = [];
  for (const [, ps] of byStudent) {
    ps.sort((a, b) => b.generated_at.localeCompare(a.generated_at));
    pruned.push(...ps.slice(0, MAX_PLANS_PER_STUDENT));
  }
  return pruned;
}

export function getPlan(id: string): SessionPlan | null {
  const store = _store.read();
  return store.plans.find(p => p.id === id) ?? null;
}

export function listPlansForStudent(student_id: string, limit = 20): SessionPlan[] {
  const store = _store.read();
  return store.plans
    .filter(p => p.request.student_id === student_id)
    .sort((a, b) => b.generated_at.localeCompare(a.generated_at))
    .slice(0, limit);
}

export function listAllPlans(limit = 100): SessionPlan[] {
  const store = _store.read();
  return store.plans
    .slice()
    .sort((a, b) => b.generated_at.localeCompare(a.generated_at))
    .slice(0, limit);
}

// ============================================================================
// Execution tracking (v2.31)
// ============================================================================

/**
 * Record a PlanExecution inline on the referenced plan. Returns the
 * updated plan; throws if the plan doesn't exist or doesn't belong
 * to `student_id` (scope check).
 *
 * Idempotent-ish: re-posting overwrites the previous execution.
 * That's appropriate because completion is the student's own
 * self-report, and they may refine "oh wait I got 3 right not 2"
 * after reflection. Audit semantics are "latest wins".
 */
export function recordExecution(
  plan_id: string,
  student_id: string,
  execution: PlanExecution,
): SessionPlan {
  const store = _store.read();
  const idx = store.plans.findIndex(p => p.id === plan_id);
  if (idx < 0) {
    throw new Error(`Plan '${plan_id}' not found`);
  }
  const plan = store.plans[idx];
  if (plan.request.student_id !== student_id) {
    throw new Error(`Plan '${plan_id}' does not belong to student '${student_id}'`);
  }
  const updated: SessionPlan = { ...plan, execution };
  store.plans[idx] = updated;
  _store.write({ plans: prunePlans(store.plans) });
  return updated;
}

/**
 * Sum up the `actual_minutes_spent` across this student's completed
 * plans in the trailing N days, PLUS free-form practice sessions
 * logged outside of any plan (v2.32). Used to derive trailing_7d_minutes
 * server-side so the client doesn't have to self-report it.
 *
 * Two sources:
 *   1. Plan executions (this store) — structured session outcomes
 *   2. Ad-hoc practice log (practice-session-log.ts) — free-form
 *      sessions that aren't tied to a plan
 *
 * Union avoids double-counting: if a plan-execution recorded itself
 * into both stores (belt + braces), we'd over-report. The practice
 * log entries carry plan_id when they came from a plan so we can
 * skip them here.
 */
export async function sumTrailingMinutes(student_id: string, days = 7, now = new Date()): Promise<number> {
  const store = _store.read();
  const cutoffMs = now.getTime() - days * 24 * 60 * 60 * 1000;
  let total = 0;
  for (const p of store.plans) {
    if (p.request.student_id !== student_id) continue;
    if (!p.execution) continue;
    const executedAt = new Date(p.execution.completed_at).getTime();
    if (executedAt < cutoffMs) continue;
    total += p.execution.actual_minutes_spent || 0;
  }

  // Add ad-hoc practice sessions (v2.32). Skip entries tagged with a
  // plan_id — those are already counted via plan executions above.
  try {
    const mod = await import('./practice-session-log');
    const entries = mod._enumerateEntriesForTest();
    for (const e of entries) {
      if (e.student_id !== student_id) continue;
      if (e.plan_id) continue;            // already counted via plan execution
      const t = new Date(e.completed_at).getTime();
      if (isNaN(t) || t < cutoffMs) continue;
      total += e.minutes || 0;
    }
  } catch {
    // Module not available — skip ad-hoc integration gracefully.
  }
  return total;
}

/**
 * Sync variant — only counts plan executions (no practice-log union).
 * Used when we can't await (e.g. planner.ts pure-core path that
 * doesn't want async propagation). Returns just the plan-execution
 * portion of the trailing minutes.
 */
export function sumTrailingMinutesSync(student_id: string, days = 7, now = new Date()): number {
  const store = _store.read();
  const cutoffMs = now.getTime() - days * 24 * 60 * 60 * 1000;
  let total = 0;
  for (const p of store.plans) {
    if (p.request.student_id !== student_id) continue;
    if (!p.execution) continue;
    const executedAt = new Date(p.execution.completed_at).getTime();
    if (executedAt < cutoffMs) continue;
    total += p.execution.actual_minutes_spent || 0;
  }
  return total;
}

/**
 * Project an updated set of sr_stats for this student from their
 * recent plan executions. Useful for the NEXT plan request — if the
 * client doesn't provide fresh sr_stats, the HTTP layer can call
 * this to get a server-derived baseline.
 *
 * Aggregation:
 *   For each topic, find all ActionOutcomes whose action's
 *   content_hint.topic matches. Accuracy = sum(correct) / sum(attempts).
 *   last_practice_date = most recent execution completion date.
 *
 * This is deliberately simple — it's a projection, not a replacement
 * for the real gbrain mastery model. It lets the planner self-bootstrap
 * without requiring a separate sr_stats store.
 */
export function projectSrStatsFromExecutions(
  student_id: string,
  now = new Date(),
  lookback_days = 30,
): Array<{
  topic: string;
  accuracy: number;
  sessions_count: number;
  accuracy_first_5: number;
  accuracy_last_5: number;
  last_practice_date: string | null;
}> {
  const store = _store.read();
  const cutoffMs = now.getTime() - lookback_days * 24 * 60 * 60 * 1000;

  // Collect per-topic outcomes chronologically
  type PerOutcome = { at: string; attempts: number; correct: number };
  const perTopic = new Map<string, PerOutcome[]>();

  for (const plan of store.plans) {
    if (plan.request.student_id !== student_id) continue;
    if (!plan.execution) continue;
    const executedAt = plan.execution.completed_at;
    if (new Date(executedAt).getTime() < cutoffMs) continue;

    for (const outcome of plan.execution.actions_completed) {
      if (!outcome.completed) continue;
      const action = plan.actions.find(a => a.id === outcome.action_id);
      if (!action) continue;
      const topic = action.content_hint.topic;
      const attempts = outcome.attempts ?? 0;
      const correct = outcome.correct ?? 0;
      if (attempts <= 0) continue;
      if (!perTopic.has(topic)) perTopic.set(topic, []);
      perTopic.get(topic)!.push({ at: executedAt, attempts, correct });
    }
  }

  const out: Array<ReturnType<typeof projectSrStatsFromExecutions>[number]> = [];
  for (const [topic, items] of perTopic) {
    items.sort((a, b) => a.at.localeCompare(b.at));
    const totalAttempts = items.reduce((s, i) => s + i.attempts, 0);
    const totalCorrect = items.reduce((s, i) => s + i.correct, 0);
    const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

    const first5 = items.slice(0, 5);
    const last5 = items.slice(-5);
    const first5Acc = first5.length > 0
      ? first5.reduce((s, i) => s + i.correct, 0) / Math.max(1, first5.reduce((s, i) => s + i.attempts, 0))
      : 0;
    const last5Acc = last5.length > 0
      ? last5.reduce((s, i) => s + i.correct, 0) / Math.max(1, last5.reduce((s, i) => s + i.attempts, 0))
      : 0;

    out.push({
      topic,
      accuracy,
      sessions_count: items.length,
      accuracy_first_5: first5Acc,
      accuracy_last_5: last5Acc,
      last_practice_date: items[items.length - 1]?.at ?? null,
    });
  }
  return out;
}

/** Test-only reset. */
export function _resetPlanStore(): void {
  _store.write({ plans: [] });
}
