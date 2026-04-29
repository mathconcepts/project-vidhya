// @ts-nocheck
/**
 * src/operator/analytics-selector.ts
 *
 * Single accessor `getAnalyticsAdapter()` that picks the active
 * analytics adapter based on environment configuration. The three
 * direct callers (user-store, dashboard, operator-routes) call this
 * instead of importing localAnalyticsAdapter directly.
 *
 * Resolution:
 *   POSTHOG_API_KEY set        → PostHog adapter (dual-writes to
 *                                 PostHog + local-JSONL by default;
 *                                 set VIDHYA_ANALYTICS_DISABLE_LOCAL=true
 *                                 to skip the JSONL mirror)
 *   POSTHOG_API_KEY unset      → local-JSONL adapter (regression-safe
 *                                 default — no behavioral change for
 *                                 existing deployments)
 *
 * Memoization: the adapter is constructed once per process. If env
 * vars change at runtime (they shouldn't), call `_resetSelector()`.
 *
 * NON-GOALS
 * ─────────
 * - No runtime hot-swap. Config is read at first call.
 * - No multi-adapter fan-out (e.g. PostHog + Plausible + Mixpanel
 *   simultaneously). One external destination at a time.
 */

import type { AnalyticsAdapter } from './types';
import { localAnalyticsAdapter } from './analytics';
import { createPostHogAdapter } from './posthog-analytics';

let _cached: AnalyticsAdapter | null = null;

export function getAnalyticsAdapter(): AnalyticsAdapter {
  if (_cached) return _cached;

  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) {
    // Default path — no external destination configured. Local-only.
    _cached = localAnalyticsAdapter;
    return _cached;
  }

  const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
  const disableLocalMirror = process.env.VIDHYA_ANALYTICS_DISABLE_LOCAL === 'true';

  _cached = createPostHogAdapter({
    apiKey,
    host,
    backingStore: localAnalyticsAdapter,
    disableLocalMirror,
  });
  return _cached;
}

/** Test helper — drop the cached adapter so the next call re-reads env. */
export function _resetSelectorForTests(): void {
  _cached = null;
}
