/**
 * Platform Health routes — Mission Control Phase 1, "Health & costs" panel
 * (SOTA-Facelift-CEO-Review.md §7.5, §14). First slice of the cockpit: "no
 * new dashboard framework — every panel is a query over ledgers that
 * already exist", so this is a thin read-only aggregator over signals
 * that already live on disk or in the DB. Nothing here writes anything.
 *
 * Honesty note (register law #1, "labels never lie"): the quota ledger
 * (.data/jobs/quota-ledger.jsonl, written by job-runner.ts's
 * recordProviderCall()) now carries an optional `cost_usd` per line —
 * content-generation-job.ts passes the atom's meta.cost_usd (the SAME
 * per-atom-type estimate already trusted platform-wide for generation
 * budget gating, src/content/concept-orchestrator/orchestrator.ts's
 * ESTIMATED_COST_USD), and wolfram-verify-job.ts passes the flat
 * WOLFRAM_PER_CALL_USD estimate from src/generation/cost-meter.ts.
 * Neither is metered provider billing — both are estimates the codebase
 * already relies on elsewhere. So `cost_tracking` reports 'estimated',
 * never 'exact', and `cost_tracking_note` carries the one-sentence
 * caveat so the cockpit UI says so instead of implying a real invoice.
 * A ledger line written before this change (or by a caller that didn't
 * pass a cost) has no `cost_usd` field at all — summed as 0, never
 * guessed at.
 *
 *   GET /api/admin/platform-health
 */

import type { ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { sendJSON, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAnyRole } from '../auth/middleware';
import type { Role } from '../auth/types';
import { listJobs, jobsDir } from '../jobs/job-runner';
import { preflightDatabase } from '../jobs/db-preflight';
import { loadProvidersRegistry, checkPriceStaleness, type PriceStaleness } from '../llm/registry';
import { getChatSpendStatus } from '../lib/chat-spend';

const ADMIN_ROLES: Role[] = ['admin', 'owner', 'institution'];

interface ProviderCallSummary {
  provider: string;
  calls: number;
  ok: number;
  failed: number;
  cost_usd: number;
}

interface QuotaLedgerSummary {
  since: string;
  total_calls: number;
  total_cost_usd: number;
  by_provider: ProviderCallSummary[];
}

/** Aggregate the last 24h of quota-ledger.jsonl by provider. Tolerates a missing/corrupt file — never throws. */
function readQuotaLedger24h(now: Date = new Date()): QuotaLedgerSummary {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const byProvider = new Map<string, { calls: number; ok: number; failed: number; cost_usd: number }>();
  let total_calls = 0;
  let total_cost_usd = 0;
  const file = path.join(jobsDir(), 'quota-ledger.jsonl');
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      let rec: { ts?: string; provider?: string; ok?: boolean; cost_usd?: number };
      try {
        rec = JSON.parse(line);
      } catch {
        continue; // one malformed ledger line never breaks the whole panel
      }
      if (!rec.ts || !rec.provider) continue;
      const ts = new Date(rec.ts);
      if (Number.isNaN(ts.getTime()) || ts < since) continue;
      // A missing/non-numeric cost_usd means "unknown", summed as 0 — never
      // guessed at (see the file-level honesty note).
      const cost = typeof rec.cost_usd === 'number' && Number.isFinite(rec.cost_usd) ? rec.cost_usd : 0;
      total_calls++;
      total_cost_usd += cost;
      const cur = byProvider.get(rec.provider) ?? { calls: 0, ok: 0, failed: 0, cost_usd: 0 };
      cur.calls++;
      cur.cost_usd += cost;
      if (rec.ok) cur.ok++;
      else cur.failed++;
      byProvider.set(rec.provider, cur);
    }
  }
  return {
    since: since.toISOString(),
    total_calls,
    total_cost_usd,
    by_provider: [...byProvider.entries()]
      .map(([provider, v]) => ({ provider, ...v }))
      .sort((a, b) => b.calls - a.calls),
  };
}

interface ContentBundleSummary {
  generated_at: string | null;
  total_problems: number;
  wolfram_verified: number;
  total_explainers: number;
}

/** Reads the shipped stats block from content-bundle.json. Returns null when the bundle hasn't been built yet — never fabricated. */
function readContentBundleSummary(): ContentBundleSummary | null {
  const file = path.resolve(process.cwd(), 'frontend/public/data/content-bundle.json');
  if (!fs.existsSync(file)) return null;
  try {
    const bundle = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return {
      generated_at: bundle.generated_at ?? null,
      total_problems: bundle.stats?.total_problems ?? 0,
      wolfram_verified: bundle.stats?.wolfram_verified ?? 0,
      total_explainers: bundle.stats?.total_explainers ?? 0,
    };
  } catch {
    return null;
  }
}

interface PlaceholderSummary {
  total: number;
  placeholder: number;
}

/** Counts explainers.json entries still on model:"placeholder" (RC2's regression class). Mirrors the CI content-gate's placeholder ratchet, read-only here. */
function readExplainerPlaceholderSummary(): PlaceholderSummary | null {
  const file = path.resolve(process.cwd(), 'frontend/public/data/explainers.json');
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const entries = Object.values(data.by_concept ?? {}) as Array<{ model?: string }>;
    return {
      total: entries.length,
      placeholder: entries.filter((e) => e.model === 'placeholder').length,
    };
  } catch {
    return null;
  }
}

/** Number of files still importing `pg` directly outside src/storage/ (CEO plan §5.1 ratchet — should only ever shrink). Null when the allowlist file is missing (nothing to ratchet). */
function readPgAllowlistCount(): number | null {
  const file = path.resolve(process.cwd(), 'scripts/pg-import-allowlist.json');
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return Array.isArray(data.files) ? data.files.length : null;
  } catch {
    return null;
  }
}

async function handlePlatformHealth(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAnyRole(req, res, ADMIN_ROLES);
  if (!auth) return;

  const db = await preflightDatabase();

  let provider_price_staleness: PriceStaleness[] = [];
  try {
    provider_price_staleness = checkPriceStaleness(loadProvidersRegistry());
  } catch (err) {
    // config/providers.yaml missing or unparsable — surface as an empty
    // list rather than 500ing the whole health panel over one bad file.
    provider_price_staleness = [];
  }

  // T19 — durable daily chat-spend cap status (src/lib/chat-spend.ts).
  // Counts only: today's estimated USD spend, the configured cap, and how
  // many refusals it caused today. No session id, user id, or message
  // content ever passes through this endpoint (surveillance invariants).
  const chat_spend = getChatSpendStatus();

  sendJSON(res, {
    generated_at: new Date().toISOString(),
    db,
    jobs: listJobs(),
    quota_calls_24h: readQuotaLedger24h(),
    chat_spend: {
      spent_today_usd: chat_spend.spent_today_usd,
      cap_usd: chat_spend.cap_usd,
      cap_tripped_today: chat_spend.trip_count_today,
      cap_status: chat_spend.allowed ? 'ok' : 'tripped',
    },
    cost_tracking: 'estimated',
    cost_tracking_note:
      'Costs are per-atom-type / per-call estimates already used elsewhere for generation budget ' +
      'gating (concept-orchestrator ESTIMATED_COST_USD, cost-meter WOLFRAM_PER_CALL_USD), not metered ' +
      'provider billing. Ledger lines written before this estimate existed count as $0, not "free".',
    content_bundle: readContentBundleSummary(),
    explainer_placeholders: readExplainerPlaceholderSummary(),
    pg_allowlist_remaining: readPgAllowlistCount(),
    provider_price_staleness,
    kill_switch_engaged: process.env.CONTENT_JOBS_DISABLED === 'true',
    nightly_cron_enabled: process.env.CONTENT_CRON_ENABLED === 'true',
  });
}

export const platformHealthRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET', path: '/api/admin/platform-health', handler: handlePlatformHealth },
];

export const __testing = { readQuotaLedger24h, readContentBundleSummary, readExplainerPlaceholderSummary, readPgAllowlistCount };
