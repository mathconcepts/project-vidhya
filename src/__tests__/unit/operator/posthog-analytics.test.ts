// @ts-nocheck
/**
 * Unit tests for src/operator/posthog-analytics.ts and
 * src/operator/analytics-selector.ts.
 *
 * What's tested:
 *   - createPostHogAdapter:
 *     - Hits the correct URL (`<host>/batch/`)
 *     - Sends `api_key` in body (not header) per PostHog's contract
 *     - Sends events as `batch: [{event, distinct_id, timestamp, properties}]`
 *     - Maps event_type → event, actor_id → distinct_id, at → timestamp
 *     - Mirrors recordEvent to the backing store by default
 *     - Skips local mirror when disableLocalMirror=true
 *     - Doesn't throw when fetch rejects (analytics is non-load-bearing)
 *     - Doesn't throw when PostHog returns 500
 *     - Eagerly flushes when the queue hits maxBatchSize
 *     - Delegates query/countByType to the backing store
 *   - getAnalyticsAdapter:
 *     - Returns local-JSONL when POSTHOG_API_KEY is unset (regression-safe)
 *     - Returns a PostHog-named adapter when POSTHOG_API_KEY is set
 *     - Caches across calls within a process
 *     - VIDHYA_ANALYTICS_DISABLE_LOCAL=true is honored in the name
 *
 * What's NOT tested here:
 *   - Real PostHog roundtrip (would require a live project token)
 *   - Time-based flush (1s timer) — eager-flush via maxBatchSize=1
 *     covers the same code path, simpler to test deterministically
 *   - Process-exit graceful flush (we deliberately don't do this)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AnalyticsAdapter, AnalyticsEvent } from '../../../operator/types';

// ─── Helpers ────────────────────────────────────────────────────

/** A tiny in-memory backing store for tests. */
function makeMemoryAdapter(): AnalyticsAdapter & { _events: AnalyticsEvent[] } {
  const events: AnalyticsEvent[] = [];
  return {
    enabled: true,
    name: 'mem',
    _events: events,
    async recordEvent(e) { events.push(e); },
    async query() { return [...events]; },
    async countByType() {
      const out: Record<string, number> = {};
      for (const e of events) out[e.event_type] = (out[e.event_type] ?? 0) + 1;
      return out;
    },
  };
}

function makeFetchSpy(opts: { status?: number; throwError?: Error } = {}) {
  const calls: Array<{ url: string; body: any }> = [];
  const fetchImpl = async (url: string, init: any) => {
    calls.push({ url, body: JSON.parse(init.body) });
    if (opts.throwError) throw opts.throwError;
    return {
      ok: (opts.status ?? 200) < 400,
      status: opts.status ?? 200,
      async json() { return {}; },
    } as any;
  };
  return { fetchImpl, calls };
}

// ─── createPostHogAdapter ────────────────────────────────────────

describe('createPostHogAdapter — wire shape', () => {
  it('POSTs to <host>/batch/ with api_key in body', async () => {
    const { createPostHogAdapter } = await import('../../../operator/posthog-analytics');
    const { fetchImpl, calls } = makeFetchSpy();
    const backing = makeMemoryAdapter();

    const adapter = createPostHogAdapter({
      apiKey: 'phc_test_token',
      host: 'https://us.i.posthog.com',
      backingStore: backing,
      fetchImpl,
      maxBatchSize: 1, // flush immediately for deterministic test
    });

    await adapter.recordEvent({
      event_type: 'signup',
      at: '2026-04-29T10:00:00Z',
      actor_id: 'user_abc',
      props: { role: 'student' },
    });

    // Wait a microtask for the flush to settle
    await new Promise(r => setTimeout(r, 10));

    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe('https://us.i.posthog.com/batch/');
    expect(calls[0].body.api_key).toBe('phc_test_token');
    expect(calls[0].body.historical_migration).toBe(false);
    expect(calls[0].body.batch).toHaveLength(1);
  });

  it('maps AnalyticsEvent fields to PostHog wire shape', async () => {
    const { createPostHogAdapter } = await import('../../../operator/posthog-analytics');
    const { fetchImpl, calls } = makeFetchSpy();
    const backing = makeMemoryAdapter();
    const adapter = createPostHogAdapter({
      apiKey: 'phc_x', backingStore: backing, fetchImpl, maxBatchSize: 1,
    });

    await adapter.recordEvent({
      event_type: 'role_changed',
      at: '2026-04-29T10:00:00Z',
      actor_id: 'user_target',
      props: { from_role: 'student', to_role: 'teacher' },
    });
    await new Promise(r => setTimeout(r, 10));

    const evt = calls[0].body.batch[0];
    expect(evt.event).toBe('role_changed');
    expect(evt.distinct_id).toBe('user_target');
    expect(evt.timestamp).toBe('2026-04-29T10:00:00Z');
    expect(evt.properties).toEqual({ from_role: 'student', to_role: 'teacher' });
  });

  it('falls back to "anonymous" distinct_id when actor_id is unset', async () => {
    const { createPostHogAdapter } = await import('../../../operator/posthog-analytics');
    const { fetchImpl, calls } = makeFetchSpy();
    const adapter = createPostHogAdapter({
      apiKey: 'phc_x', backingStore: makeMemoryAdapter(), fetchImpl, maxBatchSize: 1,
    });
    await adapter.recordEvent({
      event_type: 'page_view',
      at: '2026-04-29T10:00:00Z',
      // no actor_id
    });
    await new Promise(r => setTimeout(r, 10));
    expect(calls[0].body.batch[0].distinct_id).toBe('anonymous');
  });

  it('strips trailing slash from host', async () => {
    const { createPostHogAdapter } = await import('../../../operator/posthog-analytics');
    const { fetchImpl, calls } = makeFetchSpy();
    const adapter = createPostHogAdapter({
      apiKey: 'phc_x',
      host: 'https://us.i.posthog.com/',
      backingStore: makeMemoryAdapter(),
      fetchImpl,
      maxBatchSize: 1,
    });
    await adapter.recordEvent({ event_type: 'x', at: '2026-04-29T10:00:00Z' });
    await new Promise(r => setTimeout(r, 10));
    expect(calls[0].url).toBe('https://us.i.posthog.com/batch/');
  });
});

describe('createPostHogAdapter — local mirror', () => {
  it('mirrors recordEvent to the backing store by default', async () => {
    const { createPostHogAdapter } = await import('../../../operator/posthog-analytics');
    const { fetchImpl } = makeFetchSpy();
    const backing = makeMemoryAdapter();
    const adapter = createPostHogAdapter({
      apiKey: 'phc_x', backingStore: backing, fetchImpl, maxBatchSize: 1,
    });

    await adapter.recordEvent({
      event_type: 'signup',
      at: '2026-04-29T10:00:00Z',
      actor_id: 'u1',
    });
    await new Promise(r => setTimeout(r, 10));

    // Backing store should have the event
    expect(backing._events.length).toBe(1);
    expect(backing._events[0].event_type).toBe('signup');
  });

  it('skips local mirror when disableLocalMirror=true', async () => {
    const { createPostHogAdapter } = await import('../../../operator/posthog-analytics');
    const { fetchImpl } = makeFetchSpy();
    const backing = makeMemoryAdapter();
    const adapter = createPostHogAdapter({
      apiKey: 'phc_x',
      backingStore: backing,
      fetchImpl,
      maxBatchSize: 1,
      disableLocalMirror: true,
    });

    await adapter.recordEvent({
      event_type: 'signup',
      at: '2026-04-29T10:00:00Z',
      actor_id: 'u1',
    });
    await new Promise(r => setTimeout(r, 10));

    expect(backing._events.length).toBe(0);
  });
});

describe('createPostHogAdapter — failure swallowing', () => {
  it('does not throw when fetch rejects', async () => {
    const { createPostHogAdapter } = await import('../../../operator/posthog-analytics');
    const { fetchImpl } = makeFetchSpy({ throwError: new Error('network down') });
    const backing = makeMemoryAdapter();
    const adapter = createPostHogAdapter({
      apiKey: 'phc_x', backingStore: backing, fetchImpl, maxBatchSize: 1,
    });

    // Should not throw
    await expect(adapter.recordEvent({
      event_type: 'signup',
      at: '2026-04-29T10:00:00Z',
      actor_id: 'u1',
    })).resolves.toBeUndefined();
    await new Promise(r => setTimeout(r, 10));

    // Local mirror still happened
    expect(backing._events.length).toBe(1);
  });

  it('does not throw when PostHog returns 500', async () => {
    const { createPostHogAdapter } = await import('../../../operator/posthog-analytics');
    const { fetchImpl, calls } = makeFetchSpy({ status: 500 });
    const backing = makeMemoryAdapter();
    const adapter = createPostHogAdapter({
      apiKey: 'phc_x', backingStore: backing, fetchImpl, maxBatchSize: 1,
    });
    await expect(adapter.recordEvent({
      event_type: 'signup',
      at: '2026-04-29T10:00:00Z',
      actor_id: 'u1',
    })).resolves.toBeUndefined();
    await new Promise(r => setTimeout(r, 10));
    expect(calls.length).toBe(1);                  // request was sent
    expect(backing._events.length).toBe(1);        // local mirror succeeded
  });
});

describe('createPostHogAdapter — query delegation', () => {
  it('query delegates to backing store', async () => {
    const { createPostHogAdapter } = await import('../../../operator/posthog-analytics');
    const { fetchImpl } = makeFetchSpy();
    const backing = makeMemoryAdapter();
    const adapter = createPostHogAdapter({
      apiKey: 'phc_x', backingStore: backing, fetchImpl, maxBatchSize: 1,
    });

    await adapter.recordEvent({ event_type: 'signup', at: '2026-04-29T10:00:00Z', actor_id: 'u1' });
    await adapter.recordEvent({ event_type: 'role_changed', at: '2026-04-29T11:00:00Z', actor_id: 'u2' });
    await new Promise(r => setTimeout(r, 10));

    const all = await adapter.query!({});
    expect(all.length).toBe(2);

    const counts = await adapter.countByType!({});
    expect(counts.signup).toBe(1);
    expect(counts.role_changed).toBe(1);
  });
});

describe('createPostHogAdapter — batching', () => {
  it('eagerly flushes when queue hits maxBatchSize', async () => {
    const { createPostHogAdapter } = await import('../../../operator/posthog-analytics');
    const { fetchImpl, calls } = makeFetchSpy();
    const backing = makeMemoryAdapter();
    const adapter = createPostHogAdapter({
      apiKey: 'phc_x',
      backingStore: backing,
      fetchImpl,
      maxBatchSize: 3,
      flushIntervalMs: 99999, // disable time-based flush in this test
    });

    // Send 3 events — should trigger one batch flush of size 3
    for (let i = 0; i < 3; i++) {
      await adapter.recordEvent({
        event_type: 'signup',
        at: `2026-04-29T10:00:0${i}Z`,
        actor_id: `u${i}`,
      });
    }
    await new Promise(r => setTimeout(r, 10));

    expect(calls.length).toBe(1);
    expect(calls[0].body.batch.length).toBe(3);
  });
});

// ─── getAnalyticsAdapter ─────────────────────────────────────────

describe('getAnalyticsAdapter — selector', () => {
  beforeEach(async () => {
    const { _resetSelectorForTests } = await import('../../../operator/analytics-selector');
    _resetSelectorForTests();
    delete process.env.POSTHOG_API_KEY;
    delete process.env.POSTHOG_HOST;
    delete process.env.VIDHYA_ANALYTICS_DISABLE_LOCAL;
  });

  it('returns local-JSONL when POSTHOG_API_KEY is unset', async () => {
    const { getAnalyticsAdapter } = await import('../../../operator/analytics-selector');
    const adapter = getAnalyticsAdapter();
    expect(adapter.name).toBe('local-jsonl');
  });

  it('returns PostHog-named adapter when POSTHOG_API_KEY is set', async () => {
    process.env.POSTHOG_API_KEY = 'phc_test';
    const { getAnalyticsAdapter, _resetSelectorForTests } = await import('../../../operator/analytics-selector');
    _resetSelectorForTests();
    const adapter = getAnalyticsAdapter();
    expect(adapter.name).toMatch(/^posthog/);
  });

  it('caches the adapter across calls', async () => {
    const { getAnalyticsAdapter } = await import('../../../operator/analytics-selector');
    const a1 = getAnalyticsAdapter();
    const a2 = getAnalyticsAdapter();
    expect(a1).toBe(a2);
  });

  it('VIDHYA_ANALYTICS_DISABLE_LOCAL=true is reflected in the name', async () => {
    process.env.POSTHOG_API_KEY = 'phc_test';
    process.env.VIDHYA_ANALYTICS_DISABLE_LOCAL = 'true';
    const { getAnalyticsAdapter, _resetSelectorForTests } = await import('../../../operator/analytics-selector');
    _resetSelectorForTests();
    const adapter = getAnalyticsAdapter();
    expect(adapter.name).toBe('posthog'); // not "posthog+local"
  });
});
