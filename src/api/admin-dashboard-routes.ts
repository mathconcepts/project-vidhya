// @ts-nocheck
/**
 * Admin Dashboard Routes
 *
 * One-shot deployment-health view for owners and admins. Consolidates
 * what was previously spread across /api/admin/users, /api/admin/cohort-summary,
 * /api/auth/config, and /api/llm/providers into a single request.
 *
 * Designed around the admin journey — on first sign-in, the owner sees
 * at a glance: are my channels configured, is my LLM set up, how many
 * users are active, what's my cohort's learning state.
 */

import type { ServerResponse } from 'http';
import { sendJSON, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireRole } from '../auth/middleware';
import { listUsers, getUserById } from '../auth/user-store';
import { getOrCreateStudentModel } from '../gbrain/student-model';
import { summarizeCohort } from '../gbrain/integration';

// ============================================================================

interface DashboardSummary {
  deployment: {
    channels: { web: boolean; telegram: boolean; whatsapp: boolean };
    llm_configured: boolean;
    llm_provider: string | null;
  };
  users: {
    total: number;
    by_role: Record<string, number>;
    active_today: number;
    active_7d: number;
    signed_up_7d: number;
  };
  cohort: {
    total_students: number;
    avg_mastery: number;
    struggling_concepts: Array<{ concept_id: string; students_affected: number; avg_mastery: number }>;
    frustrated_count: number;
    anxious_count: number;
    flagged_for_teacher_attention: number;
  };
  active_users_sparkline: number[]; // 7-day count, oldest → newest
  checklist: Array<{ id: string; label: string; done: boolean; href: string }>;
}

async function handleDashboardSummary(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;

  // ── Deployment status ─────────────────────────────────────────────────
  const channels = {
    web: true,
    telegram: !!process.env.TELEGRAM_BOT_TOKEN,
    whatsapp: !!process.env.WHATSAPP_ACCESS_TOKEN,
  };
  const llm_configured = !!(
    process.env.VIDHYA_LLM_PRIMARY_PROVIDER ||
    process.env.GEMINI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY
  );
  const llm_provider = process.env.VIDHYA_LLM_PRIMARY_PROVIDER ||
    (process.env.GEMINI_API_KEY ? 'google-gemini' :
     process.env.ANTHROPIC_API_KEY ? 'anthropic' :
     process.env.OPENAI_API_KEY ? 'openai' : null);

  // ── User counts ───────────────────────────────────────────────────────
  const allUsers = listUsers();
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const oneDayAgo = now - DAY;
  const sevenDaysAgo = now - 7 * DAY;

  const byRole: Record<string, number> = { owner: 0, admin: 0, teacher: 0, student: 0 };
  let activeToday = 0;
  let active7d = 0;
  let signedUp7d = 0;
  // For sparkline — map of day-ago-bucket (0=today, 6=6 days ago) to count
  const sparklineBuckets = new Array(7).fill(0);

  for (const u of allUsers) {
    if (byRole[u.role] !== undefined) byRole[u.role]++;

    const lastSeen = u.last_seen_at ? new Date(u.last_seen_at).getTime() : 0;
    if (lastSeen >= oneDayAgo) activeToday++;
    if (lastSeen >= sevenDaysAgo) {
      active7d++;
      const daysAgo = Math.floor((now - lastSeen) / DAY);
      if (daysAgo >= 0 && daysAgo < 7) {
        sparklineBuckets[6 - daysAgo]++;
      }
    }

    const created = u.created_at ? new Date(u.created_at).getTime() : 0;
    if (created >= sevenDaysAgo) signedUp7d++;
  }

  // ── Cohort summary (from GBrain bridge) ───────────────────────────────
  const students = allUsers.filter(u => u.role === 'student');
  const models: any[] = [];
  for (const s of students) {
    try {
      const m = await getOrCreateStudentModel(s.id, s.id);
      models.push(m);
    } catch {
      models.push(null);
    }
  }
  const cohort = summarizeCohort(models);

  // ── Setup checklist ───────────────────────────────────────────────────
  const checklist = [
    {
      id: 'llm',
      label: 'Configure AI provider',
      done: llm_configured,
      href: '/llm-config',
    },
    {
      id: 'users',
      label: 'Invite your first students',
      done: allUsers.length >= 2,
      href: '/admin/users',
    },
    {
      id: 'teacher',
      label: 'Promote a teacher',
      done: byRole.teacher >= 1,
      href: '/admin/users',
    },
    {
      id: 'channels',
      label: 'Enable a chat channel (optional)',
      done: channels.telegram || channels.whatsapp,
      href: '/owner/settings',
    },
    {
      id: 'cohort',
      label: 'Review your first cohort data',
      done: cohort.total_students > 0,
      href: '/owner/dashboard',
    },
  ];

  const summary: DashboardSummary = {
    deployment: {
      channels,
      llm_configured,
      llm_provider,
    },
    users: {
      total: allUsers.length,
      by_role: byRole,
      active_today: activeToday,
      active_7d: active7d,
      signed_up_7d: signedUp7d,
    },
    cohort,
    active_users_sparkline: sparklineBuckets,
    checklist,
  };

  sendJSON(res, summary);
}

// ============================================================================

export const adminDashboardRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET', path: '/api/admin/dashboard-summary', handler: handleDashboardSummary },
];
