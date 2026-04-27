// @ts-nocheck
/**
 * src/teaching/turn-store.ts
 *
 * Teaching turn — the unit of legibility for the teaching loop.
 *
 * What a teaching turn is:
 *
 *   One round of (student opens something → system serves content
 *   → student attempts → system observes → model updates → next
 *   thing chosen).
 *
 *   A turn captures the full trace so an admin can answer "why did
 *   the system show this to this student at this time?" and a
 *   student can see "what did I learn from this?".
 *
 * Why this exists:
 *
 *   The teaching loop is wired across content/router, rendering/
 *   enrich, gbrain/student-model, and gbrain/after-each-attempt.
 *   Each piece works. The loop as a whole isn't observable —
 *   no single record shows what state was active, what got
 *   served, what changed. That's the gap this module fills.
 *
 * What this module does NOT do:
 *
 *   - Generate content (that's content/router)
 *   - Update the student model (that's gbrain/student-model)
 *   - Render anything (that's rendering/channel-renderer)
 *   - Decide pedagogy (that's gbrain/task-reasoner)
 *
 *   It only RECORDS what happened. It's a passive observer
 *   wired into the existing loop via the signal bus.
 *
 * Persistence:
 *
 *   Append-only JSONL at .data/teaching-turns.jsonl. Linear scan
 *   on read; per-student filtered scans for the typical query
 *   ("show me Nisha's last 10 turns"). Fine up to ~100k records;
 *   beyond that, rotate by month.
 *
 * Two-phase write:
 *
 *   A turn is OPENED when a content request enters the system
 *   (intent classified, source picked) and CLOSED when the
 *   student responds (insight computed, mastery updated). Between
 *   those two events, the turn is "in flight." If the student
 *   never responds, the turn stays open — that's data, not a bug
 *   (it tells us the student bounced).
 *
 *   Implementation: open-event written immediately; close-event
 *   written when the response arrives. readAll() reconciles by
 *   turn_id so the API surface returns one merged record per turn.
 */

import { createAppendLog } from '../lib/append-log';
import crypto from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────

import type { Intent, Source } from '../content/router';
import type { AttemptInsight } from '../gbrain/after-each-attempt';

/**
 * Snapshot of student mastery on the concept(s) relevant to this turn.
 * Captured at turn-open time so we can later answer "what did the
 * system know when it chose this?".
 */
export interface MasterySnapshot {
  concept_id: string | null;       // primary concept, if any
  topic: string | null;            // higher-level grouping
  mastery_before: number | null;   // 0..1
  attempts_so_far: number | null;
  /** ZPD candidate (the concept the system thinks is "ready" next). */
  zpd_concept: string | null;
}

/**
 * Why the loop failed to close cleanly, when applicable. Captured
 * so degraded-mode turns are still legible.
 */
export type TurnDegradationReason =
  | 'no-llm-available'           // provider key missing or unreachable
  | 'verification-failed'        // generated content failed Wolfram cross-check
  | 'no-gbrain-model'            // student model not loaded; turn ran without personalisation
  | 'stale-content-detected'     // content version older than current syllabus
  | 'channel-constrained'        // pedagogy compromised by channel limits
  | 'unknown';                   // anything else — explain in detail field

export interface TurnOpenEvent {
  kind:               'open';
  turn_id:            string;
  student_id:         string;
  initiated_at:       string;     // ISO 8601
  intent:             Intent;
  /**
   * Richer intent from the GBrain task reasoner, when available.
   * Captures motivational signals (expressing_frustration,
   * expressing_confusion, greeting) that the content-router intent
   * vocabulary doesn't have. Optional — only set when the request
   * went through gbrain/task-reasoner.
   */
  student_intent?:    string;       // StudentIntent from gbrain
  pedagogical_action?: string;      // PedagogicalAction chosen by reasoner
  delivery_channel:   string;     // 'web' / 'telegram' / 'whatsapp' / etc.
  routed_source:     Source | null;
  generated_content: {
    type: 'lesson' | 'explanation' | 'problem' | 'verification' | 'snap-result' | 'chat-response' | 'other';
    summary: string;             // short human-readable description
    content_id?: string;         // ref to a stored content record if applicable
    content_version?: string;    // for stale-content detection
  };
  pre_state: MasterySnapshot;
  /** Reason this turn ran in a degraded mode, if any. */
  degraded?: {
    reason: TurnDegradationReason;
    detail: string;
  };
}

export interface TurnCloseEvent {
  kind:           'close';
  turn_id:        string;
  closed_at:      string;          // ISO 8601
  /**
   * The attempt outcome (if the student responded). Some turns close
   * without an attempt (informational lesson with no question).
   */
  attempt_outcome?: {
    correct:        boolean;
    response_time_ms: number;
    response_text?: string;       // truncated for privacy
  };
  /** Output of computeInsight() if it ran. */
  insight?:       AttemptInsight;
  /** Mastery delta as plain numbers — duplicated from insight for easy querying. */
  mastery_delta?: {
    before:    number;
    after:     number;
    delta_pct: number;
  };
  /** Total wall-time for this turn. Useful for latency tracking. */
  duration_ms:    number;
}

export type TurnEvent = TurnOpenEvent | TurnCloseEvent;

/**
 * The reconciled view — one record per turn, merging open + close.
 * This is what the read API returns.
 */
export interface TeachingTurn {
  turn_id:          string;
  student_id:       string;
  initiated_at:     string;
  closed_at?:       string;        // absent if turn is still open
  status:           'open' | 'closed';
  intent:           Intent;
  student_intent?:    string;
  pedagogical_action?: string;
  delivery_channel: string;
  routed_source:    Source | null;
  generated_content: TurnOpenEvent['generated_content'];
  pre_state:        MasterySnapshot;
  degraded?:        TurnOpenEvent['degraded'];
  attempt_outcome?: TurnCloseEvent['attempt_outcome'];
  insight?:         AttemptInsight;
  mastery_delta?:   TurnCloseEvent['mastery_delta'];
  duration_ms?:     number;
}

// ─── Persistence ──────────────────────────────────────────────────────

const STORE_PATH = '.data/teaching-turns.jsonl';

const log = createAppendLog<TurnEvent>({
  path: STORE_PATH,
  isValid: (parsed: any) => {
    return parsed && typeof parsed === 'object'
        && typeof parsed.turn_id === 'string'
        && (parsed.kind === 'open' || parsed.kind === 'close');
  },
});

// ─── Public API ───────────────────────────────────────────────────────

export function newTurnId(): string {
  return 'turn_' + crypto.randomBytes(8).toString('base64url');
}

/**
 * Record a turn-open event. Caller is the content router.
 *
 * Returns the turn_id so the caller can use it later for closeTurn().
 */
export function openTurn(
  params: Omit<TurnOpenEvent, 'kind' | 'turn_id' | 'initiated_at'> & { turn_id?: string }
): string {
  const turn_id = params.turn_id ?? newTurnId();
  const event: TurnOpenEvent = {
    kind: 'open',
    turn_id,
    initiated_at: new Date().toISOString(),
    student_id: params.student_id,
    intent: params.intent,
    student_intent: params.student_intent,
    pedagogical_action: params.pedagogical_action,
    delivery_channel: params.delivery_channel,
    routed_source: params.routed_source,
    generated_content: params.generated_content,
    pre_state: params.pre_state,
    degraded: params.degraded,
  };
  log.append(event);
  return turn_id;
}

/**
 * Record a turn-close event. Caller is whichever module observed
 * the student's response (chat-routes, notebook-insight-routes, etc.).
 *
 * Idempotent in spirit — if a turn has already been closed, the
 * second close is appended but readAll() returns the first close
 * (earliest-wins). This keeps the log as a true audit trail rather
 * than overwriting.
 */
export function closeTurn(
  params: Omit<TurnCloseEvent, 'kind' | 'closed_at'>
): void {
  const event: TurnCloseEvent = {
    kind: 'close',
    turn_id: params.turn_id,
    closed_at: new Date().toISOString(),
    attempt_outcome: params.attempt_outcome,
    insight: params.insight,
    mastery_delta: params.mastery_delta,
    duration_ms: params.duration_ms,
  };
  log.append(event);
}

/**
 * Reconcile open + close events into one TeachingTurn record per
 * turn_id. Linear scan — fine for the per-student query pattern.
 *
 * If a turn has multiple open events (shouldn't happen, but the log
 * is append-only so we don't reject) we keep the first. If a turn
 * has multiple close events, we also keep the first — earliest-wins.
 */
function reconcile(events: TurnEvent[]): TeachingTurn[] {
  const open_by_id = new Map<string, TurnOpenEvent>();
  const close_by_id = new Map<string, TurnCloseEvent>();
  for (const e of events) {
    if (e.kind === 'open' && !open_by_id.has(e.turn_id)) open_by_id.set(e.turn_id, e);
    else if (e.kind === 'close' && !close_by_id.has(e.turn_id)) close_by_id.set(e.turn_id, e);
  }
  const turns: TeachingTurn[] = [];
  for (const [turn_id, open] of open_by_id) {
    const close = close_by_id.get(turn_id);
    turns.push({
      turn_id,
      student_id:       open.student_id,
      initiated_at:     open.initiated_at,
      closed_at:        close?.closed_at,
      status:           close ? 'closed' : 'open',
      intent:           open.intent,
      student_intent:   open.student_intent,
      pedagogical_action: open.pedagogical_action,
      delivery_channel: open.delivery_channel,
      routed_source:    open.routed_source,
      generated_content: open.generated_content,
      pre_state:        open.pre_state,
      degraded:         open.degraded,
      attempt_outcome:  close?.attempt_outcome,
      insight:          close?.insight,
      mastery_delta:    close?.mastery_delta,
      duration_ms:      close?.duration_ms,
    });
  }
  // Most-recent-first
  turns.sort((a, b) => b.initiated_at.localeCompare(a.initiated_at));
  return turns;
}

export function listTurnsForStudent(student_id: string, limit?: number): TeachingTurn[] {
  const all = reconcile(log.readAll());
  const mine = all.filter(t => t.student_id === student_id);
  return typeof limit === 'number' ? mine.slice(0, limit) : mine;
}

export function getTurn(turn_id: string): TeachingTurn | null {
  const matches = reconcile(log.filter(e => e.turn_id === turn_id));
  return matches[0] ?? null;
}

export function listAllTurns(limit?: number): TeachingTurn[] {
  const all = reconcile(log.readAll());
  return typeof limit === 'number' ? all.slice(0, limit) : all;
}

/**
 * Compute the per-student "improvement summary" — a roll-up of
 * mastery changes across recent closed turns. Used by the student-
 * facing /api/teaching/summary endpoint.
 */
export function summariseStudent(student_id: string, recent_n: number = 20): {
  total_turns:        number;
  closed_turns:       number;
  total_attempts:     number;
  correct_attempts:   number;
  avg_mastery_delta_pct: number;
  recent_turns:       TeachingTurn[];
  trend: 'improving' | 'flat' | 'declining' | 'insufficient-data';
} {
  const turns = listTurnsForStudent(student_id);
  const closed = turns.filter(t => t.status === 'closed');
  const recent = turns.slice(0, recent_n);
  const with_attempts = closed.filter(t => t.attempt_outcome);
  const correct = with_attempts.filter(t => t.attempt_outcome!.correct).length;

  const deltas = closed
    .filter(t => t.mastery_delta && typeof t.mastery_delta.delta_pct === 'number')
    .map(t => t.mastery_delta!.delta_pct);
  const avg_delta = deltas.length > 0
    ? deltas.reduce((s, d) => s + d, 0) / deltas.length
    : 0;

  let trend: 'improving' | 'flat' | 'declining' | 'insufficient-data';
  if (deltas.length < 5) trend = 'insufficient-data';
  else if (avg_delta > 1) trend = 'improving';
  else if (avg_delta < -1) trend = 'declining';
  else trend = 'flat';

  return {
    total_turns:    turns.length,
    closed_turns:   closed.length,
    total_attempts: with_attempts.length,
    correct_attempts: correct,
    avg_mastery_delta_pct: Math.round(avg_delta * 10) / 10,
    recent_turns:   recent,
    trend,
  };
}

/**
 * Test/admin helper.
 */
export function _resetForTests(): void {
  log.truncate();
}
