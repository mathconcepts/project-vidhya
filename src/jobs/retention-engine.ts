// @ts-nocheck
/**
 * Retention Engine — Email queue + push notifications + cron processor
 *
 * Cron endpoints (Bearer CRON_SECRET):
 *   POST /api/email/process       — process pending emails (Resend or skip)
 *   POST /api/retention/enqueue   — check streaks + enqueue retention emails
 *
 * Email sending is optional — if RESEND_API_KEY is not set,
 * emails are logged and marked 'skipped'.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { BRAND_NAME, FROM_EMAIL, BASE_URL } from '../lib/brand';
import { getRetentionEngineRepo, type RetentionEngineRepo } from '../storage/repositories/retention-engine-repo';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

// Raw queries moved to src/storage/repositories/retention-engine-repo.ts
// (CEO plan Phase 0 §5.1). requireRepo() throws when DATABASE_URL isn't
// configured; server.ts's route dispatch already wraps every handler in
// try/catch and turns a thrown error into a 500 — same wire behavior the
// original unset-connectionString pool would have eventually produced,
// just with a clear message instead of a raw pg connection error.
function requireRepo(): RetentionEngineRepo {
  const repo = getRetentionEngineRepo();
  if (!repo) throw new Error('[retention] DATABASE_URL not configured');
  return repo;
}

// ── Auth helper ───────────────────────────────────────────────────────────────

function isCronAuthorized(req: ParsedRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.authorization as string;
  return auth === `Bearer ${secret}`;
}

// ── Email templates ───────────────────────────────────────────────────────────

interface EmailTemplate {
  subject: string;
  html: string;
}

export function renderEmailTemplate(template: string, payload: Record<string, unknown>): EmailTemplate {
  switch (template) {
    case 'welcome_day0':
      return {
        subject: `Welcome to ${BRAND_NAME} — Your Study Plan Starts Now`,
        html: `<div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h1 style="color:#0f172a;font-size:24px;margin-bottom:16px">Welcome to ${BRAND_NAME}.</h1>
          <p style="color:#334155;line-height:1.6">You've taken the first step. ${BRAND_NAME} is an exam-agnostic adaptive prep platform — it builds your daily study plan around your strengths, weaknesses, and exam date.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${BASE_URL}/onboard" style="display:inline-block;background:#10b981;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600">Start your diagnostic</a>
          </div>
          <p style="color:#64748b;font-size:14px">The diagnostic takes about 10 minutes and helps us build your plan.</p>
        </div>`,
      };

    case 'welcome_day3':
      return {
        subject: `Your ${BRAND_NAME} study plan is ready`,
        html: `<div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h1 style="color:#0f172a;font-size:24px;margin-bottom:16px">Your plan is ready.</h1>
          <p style="color:#334155;line-height:1.6">Based on your diagnostic, we've built a daily plan focused on what moves your score most. Each session is time-bounded and prioritised.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${BASE_URL}/planned" style="display:inline-block;background:#10b981;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600">See today's plan</a>
          </div>
        </div>`,
      };

    case 'welcome_day7':
      return {
        subject: `Your first week with ${BRAND_NAME}`,
        html: `<div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h1 style="color:#0f172a;font-size:24px;margin-bottom:16px">Week 1.</h1>
          <p style="color:#334155;line-height:1.6">You've been with ${BRAND_NAME} for a week. ${payload.problems_solved ? `You've solved ${payload.problems_solved} problems so far. Every rep adds.` : 'Time to start practising — every rep adds.'}</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${BASE_URL}/progress" style="display:inline-block;background:#10b981;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600">See your progress</a>
          </div>
        </div>`,
      };

    case 'streak_reminder':
      return {
        subject: `${payload.streak_count} days. Keep it going.`,
        html: `<div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h1 style="color:#0f172a;font-size:24px;margin-bottom:16px">${payload.streak_count} days in a row.</h1>
          <p style="color:#334155;line-height:1.6">One problem today and your streak holds. Compounding works — what you cracked yesterday is still with you.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${BASE_URL}/planned" style="display:inline-block;background:#10b981;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600">Quick practice</a>
          </div>
        </div>`,
      };

    case 'weekly_digest': {
      const stats = payload as { problems_solved?: number; accuracy?: number; streak?: number; weak_topics?: string[] };
      return {
        subject: `Your weekly ${BRAND_NAME} digest`,
        html: `<div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h1 style="color:#0f172a;font-size:24px;margin-bottom:16px">Weekly Progress</h1>
          <div style="display:flex;gap:24px;margin:24px 0">
            <div style="text-align:center"><div style="font-size:32px;font-weight:800;color:#10b981">${stats.problems_solved || 0}</div><div style="color:#64748b;font-size:12px">Problems</div></div>
            <div style="text-align:center"><div style="font-size:32px;font-weight:800;color:#3b82f6">${stats.accuracy || 0}%</div><div style="color:#64748b;font-size:12px">Accuracy</div></div>
            <div style="text-align:center"><div style="font-size:32px;font-weight:800;color:#f59e0b">${stats.streak || 0}</div><div style="color:#64748b;font-size:12px">Day Streak</div></div>
          </div>
          ${stats.weak_topics?.length ? `<p style="color:#334155;margin-top:16px">Focus areas this week: <strong>${stats.weak_topics.join(', ')}</strong></p>` : ''}
          <div style="text-align:center;margin:32px 0">
            <a href="${BASE_URL}/digest" style="display:inline-block;background:#10b981;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600">See full digest</a>
          </div>
        </div>`,
      };
    }

    default:
      return {
        subject: `${BRAND_NAME} update`,
        html: `<p>You have an update from ${BRAND_NAME}. <a href="${BASE_URL}/planned">Visit the app</a>.</p>`,
      };
  }
}

// ── Send email (Resend or skip) ───────────────────────────────────────────────

async function sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.log(`[retention] Email skipped (no RESEND_API_KEY): to=${to} subject="${template.subject}"`);
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[retention] Resend API error: ${response.status} ${error}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[retention] Email send failed:', err);
    return false;
  }
}

// ── Process email queue ───────────────────────────────────────────────────────

async function handleProcessEmails(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!isCronAuthorized(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const repo = requireRepo();
  const pending = await repo.getPendingEmails(20);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of pending) {
    if (!row.email) {
      await repo.setEmailStatus(row.id, 'skipped');
      skipped++;
      continue;
    }

    const template = renderEmailTemplate(row.template, row.payload || {});
    const success = await sendEmail(row.email, template);

    if (success) {
      await repo.setEmailStatus(row.id, 'sent');
      sent++;
    } else if (!process.env.RESEND_API_KEY) {
      await repo.setEmailStatus(row.id, 'skipped');
      skipped++;
    } else {
      await repo.setEmailStatus(row.id, 'failed');
      failed++;
    }
  }

  console.log(`[retention] Processed ${pending.length} emails: ${sent} sent, ${skipped} skipped, ${failed} failed`);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ processed: pending.length, sent, skipped, failed }));
}

// ── Enqueue retention emails (streak checks + welcome sequence) ───────────────

async function handleEnqueueRetention(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!isCronAuthorized(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const repo = requireRepo();
  let enqueued = 0;
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const istHour = istNow.getUTCHours();
  const istDay = istNow.getUTCDay(); // 0 = Sunday

  // 1. Streak reminders (6pm IST check)
  if (istHour >= 17 && istHour <= 19) {
    const streakUsers = await repo.getStreakReminderCandidates();

    for (const user of streakUsers) {
      await repo.enqueueEmail(user.user_id, 'streak_reminder', { streak_count: user.streak }, new Date());
      enqueued++;
    }
  }

  // 2. Weekly digest (Sunday 10am IST)
  if (istDay === 0 && istHour >= 9 && istHour <= 11) {
    const digestUsers = await repo.getWeeklyDigestCandidates();

    for (const user of digestUsers) {
      // Get stats for the week
      const stats = await repo.getWeeklyStats(user.user_id);

      await repo.enqueueEmail(user.user_id, 'weekly_digest', {
        problems_solved: parseInt(stats.problems_solved || '0'),
        accuracy: Math.round(parseFloat(stats.accuracy || '0')),
      }, new Date());
      enqueued++;
    }
  }

  console.log(`[retention] Enqueued ${enqueued} emails`);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ enqueued }));
}

// ── Enqueue welcome sequence (called when signup_complete funnel event fires) ─

export async function enqueueWelcomeSequence(userId: string): Promise<void> {
  const now = new Date();
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const repo = requireRepo();
  await repo.enqueueWelcomeSequence(userId, day3, day7);
}

// ── Export ─────────────────────────────────────────────────────────────────────

export const retentionRoutes: RouteDefinition[] = [
  { method: 'POST', path: '/api/email/process', handler: handleProcessEmails },
  { method: 'POST', path: '/api/retention/enqueue', handler: handleEnqueueRetention },
];
