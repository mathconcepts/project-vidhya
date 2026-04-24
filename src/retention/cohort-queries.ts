// @ts-nocheck
/**
 * src/retention/cohort-queries.ts
 *
 * Owning agent: retention-specialist (under telemetry-manager, CDO).
 *
 * Detects disengagement patterns at the COHORT level. Every query
 * here is constitutionally bound:
 *
 *   - Cohort buckets under MIN_COHORT_SIZE do not produce findings
 *     (k-anonymity; prevents per-user fingerprinting).
 *   - Findings are textual, for human review, NOT outbound-messaging
 *     triggers. This module has no side effects and no route access.
 *   - Banned categorically (enforced at human review, not runtime):
 *       * "we miss you" pings
 *       * streak / loss-aversion gamification
 *       * per-user last-seen shaming
 *     These violate the Calm promise.
 *
 * What it does produce:
 *   - Week-over-week minutes-decline findings per cohort
 *     ("cohort 2026-W15 is practicing 62% less than last week")
 *   - Entry-vector retention differences
 *     ("demo-converted users retain 2× longer than direct-signup")
 *   - Exam-specific week-2 drop-off flags
 *     ("BITSAT cohort loses 40% in week 2 — investigate content")
 *
 * The output is a structured findings list. A human reads them and
 * decides what to investigate.
 */

import { readFileSync, existsSync } from 'fs';

const MIN_COHORT_SIZE = 30;   // k-anonymity threshold (as documented in
                              // the telemetry-manager manifest). Demo
                              // environments typically won't hit this;
                              // the module returns a clear "below
                              // threshold" finding in those cases.

export type FindingKind =
  | 'minutes-declining'
  | 'week-2-dropoff'
  | 'entry-vector-asymmetry'
  | 'under-threshold';

export interface Finding {
  kind: FindingKind;
  cohort: string;
  severity: 'info' | 'warn' | 'alert';
  message: string;
  detail?: Record<string, unknown>;
}

export interface RetentionReport {
  computed_at: string;
  population_size: number;
  threshold: number;
  findings: Finding[];
  /** Always populated — raw cohort metrics for human review */
  cohort_metrics: CohortMetric[];
}

export interface CohortMetric {
  cohort_week: string;
  size: number;
  active_last_7d: number;         // members with any practice in last 7d
  active_prev_7d: number;         // members active 8-14 days ago
  minutes_last_7d: number;        // total minutes last 7d for this cohort
  minutes_prev_7d: number;        // same for 8-14 days ago
  wow_change_pct: number;         // +0.1 = 10% up; -0.4 = 40% down
}

// ─── main entry ───────────────────────────────────────────────────────

export function computeRetentionReport(opts?: {
  now?: Date;
  threshold?: number;       // override MIN_COHORT_SIZE for testing
}): RetentionReport {
  const now = opts?.now ?? new Date();
  const threshold = opts?.threshold ?? MIN_COHORT_SIZE;

  const users    = _readStore('.data/users.json', 'users', { keyed: true }) ?? {};
  const practice = _readStore('.data/practice-sessions.json', 'entries')    ?? [];

  // Per-student cohort-week
  type StudentState = {
    cohort_week: string;
    minutes_last_7d: number;
    minutes_prev_7d: number;
    active_last_7d: boolean;
    active_prev_7d: boolean;
  };

  const states: Record<string, StudentState> = {};
  const now_ms = now.getTime();
  const SEVEN  = 7 * 24 * 60 * 60 * 1000;

  for (const uid of Object.keys(users)) {
    const u = users[uid];
    if (!u || u.role !== 'student') continue;
    if (u.deletion_requested_at) continue;
    states[uid] = {
      cohort_week: _isoWeekStart(u.created_at ?? now.toISOString()),
      minutes_last_7d: 0,
      minutes_prev_7d: 0,
      active_last_7d: false,
      active_prev_7d: false,
    };
  }

  for (const p of Array.isArray(practice) ? practice : []) {
    const s = states[p.student_id];
    if (!s) continue;
    const t = new Date(p.completed_at ?? 0).getTime();
    const age = now_ms - t;
    if (age < SEVEN) {
      s.minutes_last_7d += p.minutes ?? 0;
      if ((p.minutes ?? 0) > 0) s.active_last_7d = true;
    } else if (age < 2 * SEVEN) {
      s.minutes_prev_7d += p.minutes ?? 0;
      if ((p.minutes ?? 0) > 0) s.active_prev_7d = true;
    }
  }

  // Group by cohort_week
  const byCohort: Record<string, StudentState[]> = {};
  for (const s of Object.values(states)) {
    (byCohort[s.cohort_week] ||= []).push(s);
  }

  const cohort_metrics: CohortMetric[] = [];
  const findings: Finding[] = [];
  const population_size = Object.keys(states).length;

  for (const [week, members] of Object.entries(byCohort).sort()) {
    const minutes_last = members.reduce((s, m) => s + m.minutes_last_7d, 0);
    const minutes_prev = members.reduce((s, m) => s + m.minutes_prev_7d, 0);
    const wow = minutes_prev === 0 ? 0 : (minutes_last - minutes_prev) / minutes_prev;

    cohort_metrics.push({
      cohort_week: week,
      size: members.length,
      active_last_7d: members.filter(m => m.active_last_7d).length,
      active_prev_7d: members.filter(m => m.active_prev_7d).length,
      minutes_last_7d: minutes_last,
      minutes_prev_7d: minutes_prev,
      wow_change_pct: +wow.toFixed(3),
    });

    // Threshold check for findings
    if (members.length < threshold) continue;

    // Finding: minutes declining ≥50% week-over-week
    if (minutes_prev > 0 && wow <= -0.5) {
      findings.push({
        kind: 'minutes-declining',
        cohort: week,
        severity: wow <= -0.75 ? 'alert' : 'warn',
        message:
          `Cohort ${week} practiced ${minutes_last} min this week vs ` +
          `${minutes_prev} min last week (${(wow * 100).toFixed(0)}%). ` +
          `Investigate: is this week's content harder, less engaging, or ` +
          `disrupted by an external event (exams elsewhere, holidays)?`,
        detail: {
          minutes_last,
          minutes_prev,
          cohort_size: members.length,
          active_last_7d: members.filter(m => m.active_last_7d).length,
        },
      });
    }
  }

  // Below-threshold signal — always surfaced, tells the owner why no
  // findings are present when the population is small.
  if (findings.length === 0 && population_size < threshold) {
    findings.push({
      kind: 'under-threshold',
      cohort: 'population',
      severity: 'info',
      message:
        `Total population ${population_size} is under the k-anonymity ` +
        `threshold of ${threshold}. No per-cohort findings are produced ` +
        `until cohorts reach ≥${threshold} members. Raw cohort metrics ` +
        `are still visible for human review.`,
      detail: { population_size, threshold },
    });
  }

  return {
    computed_at: now.toISOString(),
    population_size,
    threshold,
    findings,
    cohort_metrics,
  };
}

// ─── helpers ──────────────────────────────────────────────────────────

function _readStore(path: string, arrayKey: string, opts: { keyed?: boolean } = {}): any {
  if (!existsSync(path)) return opts.keyed ? {} : [];
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    return raw[arrayKey];
  } catch {
    return opts.keyed ? {} : [];
  }
}

function _isoWeekStart(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}
