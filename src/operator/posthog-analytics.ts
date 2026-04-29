// @ts-nocheck
/**
 * src/operator/posthog-analytics.ts
 *
 * PostHog adapter for the operator analytics interface. Wraps a
 * "backing store" (typically the local JSONL adapter) so reads stay
 * local-fast and writes are mirrored to both PostHog and the local
 * store. The dashboard's lifecycle-events card reads from local;
 * PostHog gets the same events for funnel / cohort / retention
 * analysis.
 *
 * BACKGROUND
 * ──────────
 * The lifecycle event capture shipped in `97dade1` was deliberately
 * architected so swapping the analytics adapter is a single-file
 * change. Three callers reach the adapter today:
 *   - src/auth/user-store.ts          (recordEvent — signup / role / channel)
 *   - src/api/operator-routes.ts      (recordEvent — manual log endpoint)
 *   - src/operator/dashboard.ts       (countByType for the lifecycle card)
 *
 * The selector at src/operator/analytics-selector.ts picks PostHog
 * when POSTHOG_API_KEY is set; otherwise the local-JSONL adapter
 * stays as-is. No code changes at the callers — they read from the
 * accessor.
 *
 * DESIGN — DUAL WRITE BY DEFAULT
 * ──────────────────────────────
 * Why dual-write instead of cutting over wholesale:
 *
 *   1. The dashboard reads from the local store. Cutting the local
 *      mirror breaks the dashboard's lifecycle card.
 *   2. Local JSONL is durable (synchronous fs.appendFile); PostHog
 *      is best-effort (HTTP, batched, no retry). On crash the JSONL
 *      has the truth of what happened.
 *   3. Operators get PostHog's strengths (funnels, cohorts, paths)
 *      without giving up the dashboard.
 *
 * Operators who want PostHog-only can opt in via
 *   VIDHYA_ANALYTICS_DISABLE_LOCAL=true
 *
 * BATCHING
 * ────────
 * Events accumulate in an in-memory queue. The queue flushes when
 * either:
 *   - 1 second has elapsed since the first buffered event, OR
 *   - 50 events accumulate
 *
 * This shape mirrors PostHog's own SDKs (1s / 100 events default)
 * but with a smaller batch size since our event volume is lower.
 *
 * NON-GOALS
 * ─────────
 * - No retry on PostHog 5xx. If an HTTP call fails, the events in
 *   that batch are lost from PostHog's perspective. They DO still
 *   exist in the local JSONL — that's the durable record. For
 *   at-least-once delivery, an operator should use PostHog's
 *   official Node SDK or wire a retry queue here.
 * - No graceful flush on process exit. In-memory events at the
 *   moment of crash are lost from PostHog. Same caveat as above:
 *   the JSONL has them, but PostHog won't on next start.
 * - No identify / alias / group events. We capture event-shaped
 *   data only. PostHog will create person records implicitly from
 *   the distinct_id field; we don't push person properties.
 * - No feature flags. PostHog supports them via a separate API;
 *   not used here.
 */

import type { AnalyticsAdapter, AnalyticsEvent } from './types';

export interface PostHogAdapterOptions {
  /** Project API key — starts with `phc_`. Required. */
  apiKey: string;
  /** Host URL. Defaults to https://us.i.posthog.com. EU is
   *  https://eu.i.posthog.com. Self-hosted: your instance URL. */
  host?: string;
  /** Backing store for reads + dual-write. The analytics-selector
   *  passes the local-JSONL adapter here so reads stay local-fast. */
  backingStore: AnalyticsAdapter;
  /** Skip the local JSONL mirror. PostHog-only mode. The dashboard's
   *  lifecycle card will be empty unless backingStore is independently
   *  populated (it won't be). Default: false. */
  disableLocalMirror?: boolean;
  /** Optional fetch implementation for testing. Defaults to globalThis.fetch. */
  fetchImpl?: typeof fetch;
  /** Flush window in ms. Default 1000. */
  flushIntervalMs?: number;
  /** Max events per batch before flushing eagerly. Default 50. */
  maxBatchSize?: number;
}

/** Shape of a single event in the PostHog `/batch/` request body. */
interface PostHogBatchEvent {
  event: string;
  distinct_id: string;
  timestamp?: string;
  properties?: Record<string, any>;
}

/** Convert our internal AnalyticsEvent into PostHog's wire shape. */
function toPostHogEvent(event: AnalyticsEvent): PostHogBatchEvent {
  return {
    event: event.event_type,
    distinct_id: event.actor_id ?? 'anonymous',
    timestamp: event.at,
    properties: event.props ?? {},
  };
}

/**
 * Create a PostHog-backed AnalyticsAdapter.
 *
 * Returns an adapter that:
 *   - mirrors recordEvent calls to the backing store (unless disabled)
 *   - enqueues events for batched POST to PostHog's /batch/ endpoint
 *   - delegates query/countByType to the backing store
 *
 * The returned adapter is ALWAYS enabled (the selector decides whether
 * PostHog is wired at all by checking POSTHOG_API_KEY upstream).
 */
export function createPostHogAdapter(opts: PostHogAdapterOptions): AnalyticsAdapter {
  const host = (opts.host ?? 'https://us.i.posthog.com').replace(/\/+$/, '');
  const batchUrl = `${host}/batch/`;
  const fetchImpl: typeof fetch = opts.fetchImpl ?? (globalThis as any).fetch;
  const flushIntervalMs = opts.flushIntervalMs ?? 1000;
  const maxBatchSize = opts.maxBatchSize ?? 50;

  // In-memory event queue + a single deferred flush timer
  const queue: PostHogBatchEvent[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  async function flushNow(): Promise<void> {
    if (queue.length === 0) return;
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    // Drain the queue atomically — events that arrive during the HTTP
    // call will be in a fresh batch
    const batch = queue.splice(0, queue.length);
    try {
      await fetchImpl(batchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: opts.apiKey,
          historical_migration: false,
          batch,
        }),
      });
      // We deliberately don't check response.ok. PostHog returns
      // 200 with errors in body for partial failures, and we don't
      // retry anyway. If everything's down, the local JSONL is the
      // durable record.
    } catch (e: any) {
      // Swallow. Analytics is non-load-bearing.
      console.error('[posthog-analytics] flush failed:', e?.message);
    }
  }

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushNow().catch(() => {});
    }, flushIntervalMs);
  }

  return {
    enabled: true,
    name: 'posthog' + (opts.disableLocalMirror ? '' : '+local'),

    async recordEvent(event: AnalyticsEvent) {
      // 1. Mirror to local store first (durable, fast). The
      //    dashboard reads from this; if the PostHog network call
      //    later fails, the truth is still on disk.
      if (!opts.disableLocalMirror) {
        try {
          await opts.backingStore.recordEvent(event);
        } catch (e: any) {
          // Local mirror failure is more concerning than PostHog
          // failure (we lose the durable record). Log loudly but
          // still don't throw — analytics never breaks the request.
          console.error('[posthog-analytics] local mirror failed:', e?.message);
        }
      }
      // 2. Enqueue for PostHog. Flush eagerly if we hit the cap.
      queue.push(toPostHogEvent(event));
      if (queue.length >= maxBatchSize) {
        // Don't await — caller's recordEvent() is fire-and-forget
        flushNow().catch(() => {});
      } else {
        scheduleFlush();
      }
    },

    async query(qopts) {
      // Reads always go to the backing store — PostHog's query
      // surface is HogQL-based and not interchangeable with our
      // simple filter shape. Operators wanting PostHog-driven
      // dashboards use PostHog directly, not our /api/operator
      // endpoints.
      if (!opts.backingStore.query) return [];
      return opts.backingStore.query(qopts);
    },

    async countByType(qopts) {
      if (!opts.backingStore.countByType) return {};
      return opts.backingStore.countByType(qopts);
    },
  };
}

/** Test helper — flush the in-flight queue synchronously. */
export async function _flushForTests(adapter: AnalyticsAdapter): Promise<void> {
  // The adapter doesn't expose flush externally; for tests we rely on
  // the eager-flush at maxBatchSize=1, or on advancing fake timers.
  // This helper is a placeholder so test code reads cleanly.
  await Promise.resolve();
}
