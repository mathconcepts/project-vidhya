// @ts-nocheck
/**
 * src/operator/dashboard.ts
 *
 * Aggregates the metrics a solo founder cares about into one view.
 *
 * Pulled from:
 *   - User store (counts, role distribution, growth)
 *   - Payments adapter (revenue)
 *   - Teaching turn store (chat activity, plans run, library views)
 *   - Content-studio store (drafts pending review)
 *   - Health probes (per-module health status)
 *
 * The dashboard reads from existing modules' public APIs. It does
 * NOT introduce new persistence. If a module reports something
 * important, the dashboard pulls it; if not, the dashboard says
 * so in the `caveats` array.
 *
 * Honest about what's missing — the caveats array is part of the
 * response so the founder reading the dashboard knows what they
 * can trust and what they can't.
 */

import { localPaymentsAdapter } from './payments';
import type { FounderDashboard } from './types';

function daysAgoIso(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export async function buildDashboard(): Promise<FounderDashboard> {
  const caveats: string[] = [];

  // ─── Users ─────────────────────────────────────────────────────
  let users = { total: 0, active_7d: 0, new_30d: 0, by_role: {} as Record<string, number> };
  try {
    const { listUsers } = await import('../auth/user-store');
    const all = listUsers();
    const now = Date.now();
    const seven_days_ago = now - 7 * 24 * 60 * 60 * 1000;
    const thirty_days_ago = now - 30 * 24 * 60 * 60 * 1000;

    users.total = all.length;
    for (const u of all) {
      users.by_role[u.role] = (users.by_role[u.role] ?? 0) + 1;
      if (u.created_at) {
        const ts = new Date(u.created_at).getTime();
        if (ts >= thirty_days_ago) users.new_30d += 1;
      }
      if (u.last_seen_at) {
        const ts = new Date(u.last_seen_at).getTime();
        if (ts >= seven_days_ago) users.active_7d += 1;
      }
    }
  } catch (e: any) {
    caveats.push(`user-store read failed: ${e?.message ?? 'unknown'}`);
  }

  // ─── Revenue ───────────────────────────────────────────────────
  let revenue: FounderDashboard['revenue'] | undefined;
  try {
    const since = daysAgoIso(30);
    const total_30d = localPaymentsAdapter.totalRevenue({ since });
    const events_30d = localPaymentsAdapter.list({ since });
    const paid_user_set = new Set<string>();
    for (const e of events_30d) {
      if (e.user_id) paid_user_set.add(e.user_id);
    }
    const arpu_30d: Record<string, number> = {};
    for (const cur of Object.keys(total_30d)) {
      arpu_30d[cur] = paid_user_set.size === 0
        ? 0
        : Math.round(total_30d[cur] / paid_user_set.size);
    }
    revenue = {
      total_30d,
      paid_users_30d: paid_user_set.size,
      arpu_30d,
    };
    if (events_30d.length === 0) {
      caveats.push('no payment events recorded yet — set up the payments adapter and webhook to start tracking revenue (see FOUNDER.md)');
    }
  } catch (e: any) {
    caveats.push(`payments read failed: ${e?.message ?? 'unknown'}`);
  }

  // ─── Activity ──────────────────────────────────────────────────
  const activity = {
    chat_sent_7d: 0,
    plans_run_7d: 0,
    library_views_7d: 0,
    studio_drafts_7d: 0,
  };
  try {
    const { listAllTurns } = await import('../modules/teaching');
    const turns = listAllTurns(10000);   // grab a generous window
    const seven_days_ago_iso = daysAgoIso(7);
    for (const t of turns) {
      if (t.initiated_at < seven_days_ago_iso) continue;
      if (t.generated_content?.type === 'chat-response') activity.chat_sent_7d += 1;
      if (t.generated_content?.type === 'lesson')        activity.plans_run_7d += 1;
      if (t.routed_source === 'library')                  activity.library_views_7d += 1;
    }
  } catch (e: any) {
    caveats.push(`teaching-turn read failed: ${e?.message ?? 'unknown'}`);
  }

  try {
    const { listDrafts } = await import('../modules/content-studio');
    const drafts = listDrafts({ status: 'draft' });
    activity.studio_drafts_7d = drafts.length;
  } catch (e: any) {
    caveats.push(`content-studio read failed: ${e?.message ?? 'unknown'}`);
  }

  // ─── Cost ──────────────────────────────────────────────────────
  // We don't have a global usage counter today — only per-user. The
  // honest answer: aggregate per-user usage from the budget module
  // if it's enabled, else "unknown".
  const cost = {
    llm_tokens_7d: 0,
    llm_estimated_usd_7d: null as number | null,
    budget_used_today: 0,
  };
  try {
    const { isBudgetCapEnabled, getBudgetStatus } = await import('../lib/llm-budget');
    if (isBudgetCapEnabled()) {
      // Sum used_today across known users
      const { listUsers } = await import('../auth/user-store');
      const all = listUsers();
      for (const u of all) {
        const s = getBudgetStatus(u.id);
        cost.budget_used_today += s.used + s.reserved;
      }
      // Gemini 2.5 Flash mixed pricing: ~$0.13 per million tokens
      cost.llm_estimated_usd_7d = (cost.budget_used_today / 1_000_000) * 0.13;
    } else {
      caveats.push('LLM budget cap not configured — set VIDHYA_LLM_DAILY_TOKEN_CAP_PER_USER to track per-user spending');
    }
  } catch (e: any) {
    caveats.push(`budget read failed: ${e?.message ?? 'unknown'}`);
  }

  // ─── Health ────────────────────────────────────────────────────
  const health = {
    modules: [] as Array<{ name: string; status: string; detail: string }>,
    tests_status: 'last verified: see CI badge in README',
  };
  try {
    const { computeOrgHealth } = await import('../orchestrator/health');
    const org = await computeOrgHealth();
    health.modules = org.modules.map(m => ({
      name: m.name,
      status: m.status,
      detail: m.detail,
    }));
  } catch (e: any) {
    caveats.push(`health probes failed: ${e?.message ?? 'unknown'}`);
  }

  return {
    generated_at: new Date().toISOString(),
    users,
    revenue,
    activity,
    cost,
    health,
    caveats,
  };
}
