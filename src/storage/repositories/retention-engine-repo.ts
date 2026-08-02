/**
 * RetentionEngineRepo — storage boundary for src/jobs/retention-engine.ts
 * (CEO plan Phase 0, §5 / §5.1 "generation + jobs modules import zero pg").
 *
 * The job file keeps email template rendering, the Resend HTTP call, IST
 * time-window gating, and the enqueue orchestration; this repo owns the
 * raw queries against email_queue, user_profiles, and sr_sessions.
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
 * MAJOR PRE-EXISTING BUG, preserved verbatim, NOT fixed here — flagged for
 * a real product/schema decision, not a migration-time fix:
 *
 * getPendingEmails(), getStreakReminderCandidates(), and
 * getWeeklyDigestCandidates() all reference user_profiles.email,
 * user_profiles.study_profile, and/or user_profiles.notification_prefs.
 * None of those three columns have ever existed on user_profiles in any
 * migration (checked every migration touching user_profiles —
 * 005_chat_and_roles.sql is the only one, and it only adds id/role/
 * display_name/avatar_url/session_id/created_at/updated_at). Confirmed
 * against the live schema during this migration (2026-08-02):
 *   - email actually lives on auth.users, not user_profiles
 *   - "current_streak" isn't tracked anywhere — the real study_profiles
 *     table (plural, a different table entirely — user_id/exam_date/
 *     target_score/weekly_hours/topic_confidence/diagnostic_scores) has
 *     no streak column
 *   - notification_prefs doesn't exist anywhere in the schema at all,
 *     despite src/api/notification-routes.ts (out of scope for this
 *     migration) ALSO reading/writing it on user_profiles
 *
 * Unlike every other bug found during this Phase 0 pass (a stale column
 * rename in content-prioritizer-repo.ts, a stale column rename in
 * regen-scanner-repo.ts), this isn't a typo with an unambiguous fix —
 * there's no existing column anywhere holding streak or notification-
 * preference data to redirect these queries to. A real fix means a new
 * migration and a product decision about where that data lives, which is
 * out of scope for "migrate pg imports off files."
 *
 * Practical impact: unlike the other repos' bugs (silently caught,
 * degrading to defaults), retention-engine.ts's handlers have NO
 * try/catch around these calls. Every real invocation of
 * `POST /api/email/process` and `POST /api/retention/enqueue` throws,
 * is caught by server.ts's route-dispatch try/catch, and 500s. The
 * entire retention-email feature (streak reminders, weekly digest,
 * queue processing) has never functioned against this schema.
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
              up.email
       FROM email_queue eq
       LEFT JOIN user_profiles up ON eq.user_id = up.id
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
    const { rows } = await this.pool.query<StreakCandidateRow>(
      `SELECT up.id as user_id, up.email,
              COALESCE((up.study_profile->>'current_streak')::int, 0) as streak
       FROM user_profiles up
       WHERE COALESCE((up.study_profile->>'current_streak')::int, 0) >= 3
         AND up.notification_prefs->>'streak_reminders' != 'false'
         AND NOT EXISTS (
           SELECT 1 FROM sr_sessions ss
           WHERE ss.user_id = up.id::text
             AND ss.updated_at >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date
         )
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
       WHERE up.notification_prefs->>'email_digest' != 'false'
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
