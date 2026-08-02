/**
 * RetentionEngineRepo — storage boundary for src/jobs/retention-engine.ts
 * (CEO plan Phase 0, §5 / §5.1 "generation + jobs modules import zero pg").
 *
 * The job file keeps email template rendering, the Resend HTTP call, IST
 * time-window gating, and the enqueue orchestration; this repo owns the
 * raw queries against email_queue, user_profiles, streaks, and auth.users.
 *
 * ENV VAR NOTE (flagged, not silently resolved): the original module-level
 * pool used `SUPABASE_DB_URL || DATABASE_URL` — same precedence as
 * src/api/funnel-routes.ts, notification-routes.ts, blog-routes.ts, and
 * server.ts's ssrPool (none of those are in scope for this migration; the
 * CEO plan §5.1 exit clause covers "generation + jobs modules" only).
 * getSharedPool() (src/storage/pool.ts) checks DATABASE_URL only — that
 * DATABASE_URL-only contract predates this session (db-preflight.ts and
 * auto-migrate.ts were migrated onto it in an earlier Phase 0 change with
 * the same convention). This migration follows that established
 * precedent rather than unilaterally changing the shared pool's env-var
 * resolution — but if production ever sets SUPABASE_DB_URL without also
 * setting DATABASE_URL, retention-engine.ts would silently go DB-less
 * post-migration where it previously would have connected. Worth a
 * one-time check against the real Render env before this ships.
 *
 * No File implementation — retention emails only mean anything against
 * real user/session data. The factory returns `null` when DATABASE_URL is
 * unset; the job's requireRepo() throws the same shape of error the
 * original unset-pool eventually would have (a 500 via server.ts's route
 * try/catch), just with a clear message instead of a raw pg connection
 * error.
 *
 * FIXED (was: MAJOR PRE-EXISTING BUG, flagged in the Phase 0 delivery doc
 * as "worth real attention before the next release touches email/
 * retention"). getPendingEmails(), getStreakReminderCandidates(), and
 * getWeeklyDigestCandidates() referenced user_profiles.email,
 * user_profiles.study_profile, and user_profiles.notification_prefs —
 * none of which ever existed on user_profiles in any migration. Every
 * real invocation of `POST /api/email/process` and
 * `POST /api/retention/enqueue` threw (no try/catch around these calls in
 * the job file) and 500'd via server.ts's route-dispatch wrapper. Product
 * decision made and implemented (2026-08-02), each backed by an existing,
 * canonical home for the data rather than a new ad-hoc column:
 *
 *   - email: read from `auth.users.email` (a real column — see
 *     000_local_auth_stub.sql for the local-dev stub, and Supabase's own
 *     auth.users in production) via a join, not from user_profiles.
 *   - streak: read from the existing `streaks` table
 *     (004_autopilot_growth.sql, keyed by `identifier` = user_id or
 *     session_id as text) — the same table src/api/streak-routes.ts
 *     already reads/writes. No `study_profile` column invented. A streak
 *     only counts as "reminder-worthy" when it mirrors streak-routes.ts's
 *     own `streakAlive` semantics: last active yesterday (IST) but not yet
 *     today — i.e. the streak is real and about to lapse.
 *   - notification_prefs: migration 037_notification_prefs.sql adds the
 *     column to user_profiles (also fixes src/api/notification-routes.ts,
 *     which was reading/writing the same nonexistent column).
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';

export type EmailStatus = 'sent' | 'skipped' | 'failed';

export interface PendingEmailRow {
  id: string;
  user_id: string;
  template: string;
  payload: Record<string, unknown> | null;
  email: string | null;
}

export interface StreakCandidateRow {
  user_id: string;
  email: string | null;
  streak: number;
}

export interface DigestCandidateRow {
  user_id: string;
}

export interface WeeklyStatsRow {
  problems_solved: string;
  accuracy: string | null;
}

export interface RetentionEngineRepo {
  /** Up to `limit` pending, due email_queue rows joined to the recipient's email. */
  getPendingEmails(limit: number): Promise<PendingEmailRow[]>;
  /** Sets status (and sent_at when status is 'sent') on one email_queue row. */
  setEmailStatus(id: string, status: EmailStatus): Promise<void>;
  /** Users with a >=3-day streak, opted in, inactive today, not already queued a reminder today. */
  getStreakReminderCandidates(): Promise<StreakCandidateRow[]>;
  /** Users opted into the weekly digest who haven't been queued one in the last 6 days. */
  getWeeklyDigestCandidates(): Promise<DigestCandidateRow[]>;
  /** Problems-solved count + accuracy over the trailing 7 days for one user. */
  getWeeklyStats(userId: string): Promise<WeeklyStatsRow>;
  /** Queues a single templated email. */
  enqueueEmail(userId: string, template: string, payload: Record<string, unknown>, scheduledAt: Date): Promise<void>;
  /** Queues the 3-email day0/day3/day7 welcome sequence in one insert. */
  enqueueWelcomeSequence(userId: string, day3: Date, day7: Date): Promise<void>;
}

export class PgRetentionEngineRepo implements RetentionEngineRepo {
  constructor(private pool: Pool) {}

  async getPendingEmails(limit: number): Promise<PendingEmailRow[]> {
    const { rows } = await this.pool.query<PendingEmailRow>(
      `SELECT eq.id, eq.user_id, eq.template, eq.payload,
              au.email
       FROM email_queue eq
       LEFT JOIN auth.users au ON eq.user_id = au.id
       WHERE eq.status = 'pending' AND eq.scheduled_at <= NOW()
       ORDER BY eq.scheduled_at ASC
       LIMIT $1`,
      [limit],
    );
    return rows;
  }

  async setEmailStatus(id: string, status: EmailStatus): Promise<void> {
    if (status === 'sent') {
      await this.pool.query(`UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = $1`, [id]);
    } else {
      await this.pool.query(`UPDATE email_queue SET status = $2 WHERE id = $1`, [id, status]);
    }
  }

  async getStreakReminderCandidates(): Promise<StreakCandidateRow[]> {
    // Streak source of truth is the `streaks` table (identifier = user_id
    // as text — same convention src/api/streak-routes.ts uses), not a
    // nonexistent user_profiles.study_profile column. "Reminder-worthy"
    // mirrors streak-routes.ts's own streakAlive check: last active
    // yesterday IST (streak is real and about to lapse) but not yet today
    // (no reminder needed if they've already shown up).
    const { rows } = await this.pool.query<StreakCandidateRow>(
      `SELECT up.id as user_id, au.email,
              s.current_streak as streak
       FROM user_profiles up
       JOIN streaks s ON s.identifier = up.id::text
       LEFT JOIN auth.users au ON au.id = up.id
       WHERE s.current_streak >= 3
         AND s.last_active_date = ((NOW() AT TIME ZONE 'Asia/Kolkata')::date - INTERVAL '1 day')
         AND COALESCE(up.notification_prefs->>'streak_reminders', 'true') != 'false'
         AND NOT EXISTS (
           SELECT 1 FROM email_queue eq
           WHERE eq.user_id = up.id AND eq.template = 'streak_reminder'
             AND eq.created_at >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date
         )`,
    );
    return rows;
  }

  async getWeeklyDigestCandidates(): Promise<DigestCandidateRow[]> {
    const { rows } = await this.pool.query<DigestCandidateRow>(
      `SELECT up.id as user_id
       FROM user_profiles up
       WHERE COALESCE(up.notification_prefs->>'email_digest', 'true') != 'false'
         AND NOT EXISTS (
           SELECT 1 FROM email_queue eq
           WHERE eq.user_id = up.id AND eq.template = 'weekly_digest'
             AND eq.created_at >= NOW() - INTERVAL '6 days'
         )`,
    );
    return rows;
  }

  async getWeeklyStats(userId: string): Promise<WeeklyStatsRow> {
    const { rows } = await this.pool.query<WeeklyStatsRow>(
      `SELECT
         COUNT(*) as problems_solved,
         AVG(CASE WHEN correct_count > 0 THEN correct_count::float / NULLIF(attempts, 0) ELSE 0 END) * 100 as accuracy
       FROM sr_sessions
       WHERE user_id = $1 AND updated_at >= NOW() - INTERVAL '7 days'`,
      [userId],
    );
    return rows[0] ?? { problems_solved: '0', accuracy: null };
  }

  async enqueueEmail(userId: string, template: string, payload: Record<string, unknown>, scheduledAt: Date): Promise<void> {
    await this.pool.query(
      `INSERT INTO email_queue (user_id, template, payload, scheduled_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, template, JSON.stringify(payload), scheduledAt.toISOString()],
    );
  }

  async enqueueWelcomeSequence(userId: string, day3: Date, day7: Date): Promise<void> {
    await this.pool.query(
      `INSERT INTO email_queue (user_id, template, payload, scheduled_at) VALUES
       ($1, 'welcome_day0', '{}', NOW()),
       ($1, 'welcome_day3', '{}', $2),
       ($1, 'welcome_day7', '{}', $3)`,
      [userId, day3.toISOString(), day7.toISOString()],
    );
  }
}

/** Test/reference only — never returned by the factory. */
export class NullRetentionEngineRepo implements RetentionEngineRepo {
  async getPendingEmails(): Promise<PendingEmailRow[]> {
    return [];
  }
  async setEmailStatus(): Promise<void> {}
  async getStreakReminderCandidates(): Promise<StreakCandidateRow[]> {
    return [];
  }
  async getWeeklyDigestCandidates(): Promise<DigestCandidateRow[]> {
    return [];
  }
  async getWeeklyStats(): Promise<WeeklyStatsRow> {
    return { problems_solved: '0', accuracy: null };
  }
  async enqueueEmail(): Promise<void> {}
  async enqueueWelcomeSequence(): Promise<void> {}
}

/** Factory: Postgres-backed when DATABASE_URL is set, `null` otherwise. */
export function getRetentionEngineRepo(): RetentionEngineRepo | null {
  const pool = getSharedPool();
  return pool ? new PgRetentionEngineRepo(pool) : null;
}
