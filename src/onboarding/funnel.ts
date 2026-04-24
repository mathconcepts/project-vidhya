// @ts-nocheck
/**
 * src/onboarding/funnel.ts
 *
 * Owning agent: onboarding-specialist (under planner-manager, CPO).
 *
 * The activation funnel — measures how users flow from "signed up" to
 * "first compounding moment" (trailing stats > 0). Cohort-level only,
 * no per-user data leaves this module.
 *
 * Five steps:
 *   1. sign-up           user exists in users.json
 *   2. exam-registered   has an entry in student-exam-profiles.json
 *   3. first-plan        has ≥1 plan in session-plans.json
 *   4. first-attempt     has ≥1 plan with an execution recorded
 *   5. activated         trailing_7d_minutes > 0 at time-of-measurement
 *
 * Usage:
 *   import { computeActivationFunnel } from './funnel';
 *   const report = computeActivationFunnel({ cohort_weeks: 4 });
 *
 * Constitutional notes:
 *   - No per-user outputs. Every returned count is over ≥1 user;
 *     if a cohort has fewer than MIN_COHORT_SIZE members, it is
 *     reported as a single "small-cohorts-combined" bucket rather
 *     than a named week (avoids accidental fingerprinting).
 *   - No outgoing actions. This module is read-only. Any product
 *     changes prompted by findings must flow through feedback-manager.
 */

import { readFileSync, existsSync } from 'fs';

// Cohort granularity is weekly. Minimum members per reported cohort —
// below this, a week's entry is merged into "small-cohorts-combined".
const MIN_COHORT_SIZE = 5;

export interface CohortBucket {
  /** ISO week start date (YYYY-MM-DD) the user's created_at falls into */
  cohort_week: string;
  /** Total members in this cohort */
  size: number;
  /** How many crossed each step (cumulative — step N includes step N+1) */
  signed_up: number;
  exam_registered: number;
  first_plan: number;
  first_attempt: number;
  activated: number;
  /** Step-over-step conversion rates (0..1) */
  sign_to_exam: number;
  exam_to_plan: number;
  plan_to_attempt: number;
  attempt_to_activated: number;
  /** Overall conversion — signed_up → activated */
  overall_conversion: number;
}

export interface FunnelReport {
  computed_at: string;
  cohorts: CohortBucket[];
  small_cohorts_combined?: CohortBucket;
  /** Global totals across all cohorts */
  totals: Omit<CohortBucket, 'cohort_week'>;
  notes: string[];
}

// ─── main entry ───────────────────────────────────────────────────────

export function computeActivationFunnel(opts?: {
  cohort_weeks?: number;    // limit to last N weeks (default: all)
  now?: Date;
}): FunnelReport {
  const now = opts?.now ?? new Date();
  const limitWeeks = opts?.cohort_weeks ?? Infinity;

  // Pull all the stores
  const users        = _readStore('.data/users.json',                  'users', { keyed: true }) ?? {};
  const examProfiles = _readStore('.data/student-exam-profiles.json', 'profiles')                ?? [];
  const plans        = _readStore('.data/session-plans.json',         'plans')                   ?? [];
  const practice     = _readStore('.data/practice-sessions.json',     'entries')                 ?? [];

  const notes: string[] = [];

  // Build per-user flags
  type UserFlags = {
    cohort_week: string;
    signed_up: boolean;
    exam_registered: boolean;
    first_plan: boolean;
    first_attempt: boolean;
    activated: boolean;
  };

  const flagsByUser: Record<string, UserFlags> = {};

  const examStudents = new Set(
    (Array.isArray(examProfiles) ? examProfiles : [])
      .map((p: any) => p?.student_id)
      .filter(Boolean),
  );
  const planStudents = new Set(
    (Array.isArray(plans) ? plans : [])
      .map((p: any) => p?.request?.student_id)
      .filter(Boolean),
  );
  const attemptStudents = new Set(
    (Array.isArray(plans) ? plans : [])
      .filter((p: any) => p?.execution?.completed_at)
      .map((p: any) => p?.request?.student_id)
      .filter(Boolean),
  );
  const activatedStudents = _computeActivated(practice, now);

  // Iterate users
  for (const uid of Object.keys(users)) {
    const u = users[uid];
    if (!u || u.role !== 'student') continue;   // only students
    if (u.deletion_requested_at) continue;       // exclude pending-delete

    flagsByUser[uid] = {
      cohort_week: _isoWeekStart(u.created_at ?? now.toISOString()),
      signed_up: true,
      exam_registered: examStudents.has(uid),
      first_plan: planStudents.has(uid),
      first_attempt: attemptStudents.has(uid),
      activated: activatedStudents.has(uid),
    };
  }

  // Group by cohort_week
  const byCohort: Record<string, UserFlags[]> = {};
  for (const f of Object.values(flagsByUser)) {
    (byCohort[f.cohort_week] ||= []).push(f);
  }

  // Filter to cohort_weeks window
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - limitWeeks * 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // Separate small from reportable cohorts
  const reportable: CohortBucket[] = [];
  const smallCohortMembers: UserFlags[] = [];

  for (const [week, members] of Object.entries(byCohort).sort()) {
    if (week < cutoffStr) continue;
    if (members.length < MIN_COHORT_SIZE) {
      smallCohortMembers.push(...members);
    } else {
      reportable.push(_cohortBucketOf(week, members));
    }
  }

  // Build the combined bucket if there are any small cohorts
  let small: CohortBucket | undefined;
  if (smallCohortMembers.length > 0) {
    small = _cohortBucketOf('small-cohorts-combined', smallCohortMembers);
    notes.push(
      `${smallCohortMembers.length} user(s) across cohorts under size ${MIN_COHORT_SIZE} ` +
      `were merged into the "small-cohorts-combined" bucket — avoids fingerprinting.`,
    );
  }

  // Global totals
  const allMembers: UserFlags[] = Object.values(flagsByUser);
  const totalsBucket = _cohortBucketOf('totals', allMembers);
  const { cohort_week: _, ...totals } = totalsBucket;

  if (allMembers.length === 0) {
    notes.push('No students found — funnel is empty.');
  } else if (reportable.length === 0 && !small) {
    notes.push('All populated cohorts fall outside the requested window.');
  }

  return {
    computed_at: now.toISOString(),
    cohorts: reportable,
    small_cohorts_combined: small,
    totals,
    notes,
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

/**
 * Returns the ISO date string (YYYY-MM-DD) for the Monday of the week
 * containing the given timestamp. Weekly cohorts use Monday as the
 * start of week — aligns with ISO 8601.
 */
function _isoWeekStart(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const day = d.getUTCDay();                            // 0 = Sunday
  const diff = (day === 0 ? -6 : 1 - day);              // shift to Monday
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

/**
 * For the trailing-stats check: does this user have ≥1 minute of
 * practice in the last 7 days?
 */
function _computeActivated(
  practice: any[],
  now: Date,
): Set<string> {
  const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const set = new Set<string>();
  for (const e of Array.isArray(practice) ? practice : []) {
    if (!e?.student_id) continue;
    const t = new Date(e.completed_at ?? 0).getTime();
    if (t >= cutoff && (e.minutes ?? 0) > 0) set.add(e.student_id);
  }
  return set;
}

function _cohortBucketOf(week: string, members: Array<{
  signed_up: boolean;
  exam_registered: boolean;
  first_plan: boolean;
  first_attempt: boolean;
  activated: boolean;
}>): CohortBucket {
  const signed_up       = members.length;
  const exam_registered = members.filter(m => m.exam_registered).length;
  const first_plan      = members.filter(m => m.first_plan).length;
  const first_attempt   = members.filter(m => m.first_attempt).length;
  const activated       = members.filter(m => m.activated).length;

  const safeDiv = (n: number, d: number) => (d === 0 ? 0 : +(n / d).toFixed(3));

  return {
    cohort_week: week,
    size: members.length,
    signed_up,
    exam_registered,
    first_plan,
    first_attempt,
    activated,
    sign_to_exam:        safeDiv(exam_registered, signed_up),
    exam_to_plan:        safeDiv(first_plan,      exam_registered),
    plan_to_attempt:     safeDiv(first_attempt,   first_plan),
    attempt_to_activated: safeDiv(activated,      first_attempt),
    overall_conversion:  safeDiv(activated,       signed_up),
  };
}
