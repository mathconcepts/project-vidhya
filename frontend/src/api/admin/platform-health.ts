/**
 * Platform Health API client — Mission Control Phase 1, Health & costs
 * panel (SOTA-Facelift-CEO-Review.md §7.5). Wraps
 * GET /api/admin/platform-health.
 *
 * Auth: piggybacks on the Vidhya JWT in localStorage via authFetch (same
 * pattern as content-rd.ts).
 */

import { authFetch } from '@/lib/auth/client';

class PlatformHealthApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'PlatformHealthApiError';
  }
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = res.statusText || 'Request failed';
    try {
      const body = await res.json();
      msg = body.message || body.error || msg;
    } catch {
      /* swallow */
    }
    throw new PlatformHealthApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

export interface JobStatusSummary {
  name: string;
  description: string;
  status: {
    state: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
    progress: { done: number; total: number; skipped: number; failed: number };
    started_at: string;
    last_update: string;
    last_error: string | null;
    message: string | null;
  } | null;
}

export interface ProviderCallSummary {
  provider: string;
  calls: number;
  ok: number;
  failed: number;
}

export interface QuotaCalls24h {
  since: string;
  total_calls: number;
  by_provider: ProviderCallSummary[];
}

export interface ContentBundleSummary {
  generated_at: string | null;
  total_problems: number;
  wolfram_verified: number;
  total_explainers: number;
}

export interface PlaceholderSummary {
  total: number;
  placeholder: number;
}

export interface PriceStaleness {
  provider: string;
  pricedAt: string | null;
  ageDays: number | null;
  stale: boolean;
}

export interface DbHealth {
  ok: boolean;
  error?: string;
}

export interface PlatformHealth {
  generated_at: string;
  db: DbHealth;
  jobs: JobStatusSummary[];
  quota_calls_24h: QuotaCalls24h;
  cost_tracking: 'not_yet_implemented';
  content_bundle: ContentBundleSummary | null;
  explainer_placeholders: PlaceholderSummary | null;
  pg_allowlist_remaining: number | null;
  provider_price_staleness: PriceStaleness[];
  kill_switch_engaged: boolean;
  nightly_cron_enabled: boolean;
}

export async function getPlatformHealth(): Promise<PlatformHealth> {
  return jsonOrThrow(await authFetch('/api/admin/platform-health'));
}

export { PlatformHealthApiError };
