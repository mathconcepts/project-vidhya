/**
 * Platform Health routes — Mission Control Phase 1, "Health & costs" panel
 * (SOTA-Facelift-CEO-Review.md §7.5, §14). First slice of the cockpit: "no
 * new dashboard framework — every panel is a query over ledgers that
 * already exist", so this is a thin read-only aggregator over signals
 * that already live on disk or in the DB. Nothing here writes anything.
 *
 * Honesty note (register law #1, "labels never lie"): the quota ledger
 * (.data/jobs/quota-ledger.jsonl, written by job-runner.ts's
 * recordProviderCall()) records call counts and success/failure per
 * provider — it does NOT record a dollar/rupee cost per call. Wiring a
 * real ₹-per-concept cost figure means threading token usage through
 * every provider call site into the ledger, which is real, separate work
 * (touches the content-generation and wolfram-verify job internals) — out
 * of scope for this thin-wrapper panel. Rather than fabricate a cost
 * number the platform can't back with a receipt, this endpoint reports
 * real call volume/success-rate (a genuine health signal) and leaves cost
 * as an explicit `cost_tracking: 'not_yet_implemented'` field so the
 * cockpit UI can say so honestly instead of inventing a ₹ figure.
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

const ADMIN_ROLES: Role[] = ['admin', 'owner', 'institution'];

interface ProviderCallSummary {
  provider: string;
  calls: number;
  ok: number;
  failed: number;
}

interface QuotaLedgerSummary {
  since: string;
  total_calls: number;
  by_provider: ProviderCallSummary[];
}

/** Aggregate the last 24h of quota-ledger.jsonl by provider. Tolerates a missing/corrupt file — never throws. */
function readQuotaLedger24h(now: Date = new Date()): QuotaLedgerSummary {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const byProvider = new Map<string, { calls: number; ok: number; failed: number }>();
  let total_calls = 0;
  const file = path.join(jobsDir(), 'quota-ledger.jsonl');
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      let rec: { ts?: string; provider?: string; ok?: boolean };
      try {
        rec = JSON.parse(line);
      } catch {
        continue; // one malformed ledger line never breaks the whole panel
      }
      if (!rec.ts || !rec.provider) continue;
      const ts = new Date(rec.ts);
      if (Number.isNaN(ts.getTime()) || ts < since) continue;
      total_calls++;
      const cur = byProvider.get(rec.provider) ?? { calls: 0, ok: 0, failed: 0 };
      cur.calls++;
      if (rec.ok) cur.ok++;
      else cur.failed++;
      byProvider.set(rec.provider, cur);
    }
  }
  return {
    since: since.toISOString(),
    total_calls,
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

  sendJSON(res, {
    generated_at: new Date().toISOString(),
    db,
    jobs: listJobs(),
    quota_calls_24h: readQuotaLedger24h(),
    cost_tracking: 'not_yet_implemented',
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
