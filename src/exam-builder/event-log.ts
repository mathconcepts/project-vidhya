// @ts-nocheck
/**
 * Build Event Log — append-only track of orchestration runs.
 *
 * Every time the orchestrator does anything (starts a build, consults
 * feedback, calls the LLM, creates a sample, promotes a course, fails),
 * a BuildEvent is written. The log is append-only and immutable.
 *
 * Consumers:
 *   - Admin UI dashboards ("what built in the last 24h, which failed, why")
 *   - Cost auditing ("how much did we spend on LLM calls per exam")
 *   - Debug traces ("what happened in build B-xyz")
 *
 * Uses the same flat-file-store primitive as every other persistence
 * module, so it's atomically durable without an extra dep.
 */

import { createFlatFileStore } from '../lib/flat-file-store';

// ============================================================================

export type BuildEventKind =
  | 'build_started'
  | 'feedback_lookup_completed'
  | 'pre_apply_completed'
  | 'llm_generation_started'
  | 'llm_generation_completed'
  | 'llm_generation_failed'
  | 'snapshot_stitched'
  | 'sample_check_created'
  | 'admin_review_required'
  | 'course_promoted'
  | 'build_completed'
  | 'build_failed'
  | 'build_aborted';

export interface BuildEvent {
  id: string;                          // "BE-{8-char-nano}"
  build_id: string;                    // "B-{base36-timestamp}"
  exam_id: string;
  kind: BuildEventKind;
  at: string;                          // ISO timestamp
  actor: string;                       // admin user_id or "system"
  /**
   * Event-kind-specific payload. Intentionally loosely typed — the
   * log is meant to be append-only and readable; over-structuring
   * it creates churn every time we add a new kind.
   */
  payload: Record<string, any>;
  /** Duration in ms if this event marks the end of a phase */
  duration_ms?: number;
  /** Cost in USD accrued in this event (LLM calls) */
  cost_usd?: number;
}

interface StoreShape {
  events: BuildEvent[];
}

const STORE_PATH = '.data/build-events.json';

const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ events: [] }),
});

// ============================================================================

function nano(n = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function newBuildId(): string {
  return `B-${Date.now().toString(36)}-${nano(4)}`;
}

export function logBuildEvent(input: Omit<BuildEvent, 'id' | 'at'>): BuildEvent {
  const event: BuildEvent = {
    id: `BE-${nano()}`,
    at: new Date().toISOString(),
    ...input,
  };
  const store = _store.read();
  store.events.push(event);
  _store.write(store);
  return event;
}

export function listEventsForBuild(build_id: string): BuildEvent[] {
  return _store.read().events.filter(e => e.build_id === build_id);
}

export function listEventsForExam(exam_id: string, limit = 200): BuildEvent[] {
  const all = _store.read().events.filter(e => e.exam_id === exam_id);
  // Newest first
  return all.slice(-limit).reverse();
}

export function listRecentEvents(limit = 100): BuildEvent[] {
  const all = _store.read().events;
  return all.slice(-limit).reverse();
}

export interface BuildSummary {
  build_id: string;
  exam_id: string;
  started_at: string;
  completed_at?: string;
  /**
   * 'running'            — no terminal event observed yet
   * 'succeeded'          — build_completed (no review items flagged)
   * 'requires_review'    — build landed but flagged items need admin attention
   * 'failed'             — build_failed (adapter missing, invalid inputs, etc.)
   * 'aborted'            — build_aborted (admin-initiated cancellation)
   */
  status: 'running' | 'succeeded' | 'requires_review' | 'failed' | 'aborted';
  total_cost_usd: number;
  event_count: number;
  final_sample_check_id?: string;
  final_course_version?: string;
}

export function summarizeBuild(build_id: string): BuildSummary | null {
  const events = listEventsForBuild(build_id).sort((a, b) => a.at.localeCompare(b.at));
  if (events.length === 0) return null;
  const first = events[0];

  // A build is terminal when we see one of the explicit terminal kinds.
  // admin_review_required is terminal-but-not-failed: the build landed,
  // produced its artifact (sample/course), and wants admin attention on
  // flagged feedback items. Treating it as 'running' would be wrong —
  // the orchestrator has exited by that point.
  const terminal = [...events].reverse().find(e =>
    e.kind === 'build_completed'
    || e.kind === 'build_failed'
    || e.kind === 'build_aborted'
    || e.kind === 'admin_review_required',
  );

  const status: BuildSummary['status'] =
    !terminal ? 'running'
    : terminal.kind === 'build_completed' ? 'succeeded'
    : terminal.kind === 'admin_review_required' ? 'requires_review'
    : terminal.kind === 'build_failed' ? 'failed'
    : 'aborted';

  const sampleEvent = events.find(e => e.kind === 'sample_check_created');
  const promoteEvent = events.find(e => e.kind === 'course_promoted');

  return {
    build_id,
    exam_id: first.exam_id,
    started_at: first.at,
    completed_at: terminal?.at,
    status,
    total_cost_usd: events.reduce((sum, e) => sum + (e.cost_usd ?? 0), 0),
    event_count: events.length,
    final_sample_check_id: sampleEvent?.payload?.sample_check_id,
    final_course_version: promoteEvent?.payload?.version_after,
  };
}
