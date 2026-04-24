// @ts-nocheck
/**
 * src/events/signal-bus.ts
 *
 * Minimal in-process pub/sub for agent signals declared in manifests.
 *
 * The agent org declares `emits_signals` and `subscribes_to` in each
 * manifest (e.g. content-router emits 'content-routed'; retention-
 * specialist subscribes to 'activation-milestone'). Today those are
 * documentation. This module provides a runtime where emitters can
 * publish and subscribers can receive.
 *
 * Design choices:
 *   - In-process only (single-instance deploys; no IPC/Redis/Kafka)
 *   - Synchronous delivery (subscribers run in the emitter's tick)
 *   - Subscribers are isolated — one throwing doesn't block others
 *   - No persistence — signals are fire-and-forget, not an event log
 *   - Bounded-size recent buffer for /api/orchestrator/signals admin view
 *
 * When scale demands out-of-process delivery, swap for a real bus
 * behind the same publish()/subscribe() interface.
 *
 * PENDING.md §13.2 — simple signal bus.
 */

export interface SignalEvent {
  name: string;                    // matches manifest emits_signals.name
  emitter: string;                 // manifest id of the emitting agent
  payload: Record<string, any>;
  emitted_at: string;              // ISO timestamp
}

type Handler = (event: SignalEvent) => void | Promise<void>;

interface Subscription {
  name: string;
  subscriber: string;              // manifest id of subscriber
  handler: Handler;
}

const subs: Subscription[] = [];
const recent: SignalEvent[] = [];
const RECENT_CAP = 200;

// ─── Public API ──────────────────────────────────────────────────────

export function publish(
  name: string,
  emitter: string,
  payload: Record<string, any> = {},
): void {
  const event: SignalEvent = {
    name, emitter, payload,
    emitted_at: new Date().toISOString(),
  };
  // Bounded recent-buffer for admin visibility
  recent.push(event);
  if (recent.length > RECENT_CAP) recent.shift();

  // Fire-and-forget each subscriber; isolate errors
  for (const s of subs) {
    if (s.name !== name) continue;
    try {
      const r = s.handler(event);
      // If handler is async, don't await — fire-and-forget semantics.
      // But catch rejections to prevent unhandled-promise noise.
      if (r && typeof (r as Promise<void>).then === 'function') {
        (r as Promise<void>).catch(e => {
          console.error(`[signal-bus] subscriber ${s.subscriber} on ${name} rejected: ${e?.message}`);
        });
      }
    } catch (e: any) {
      console.error(`[signal-bus] subscriber ${s.subscriber} on ${name} threw: ${e?.message}`);
    }
  }
}

export function subscribe(name: string, subscriber: string, handler: Handler): () => void {
  const entry: Subscription = { name, subscriber, handler };
  subs.push(entry);
  return () => {
    const i = subs.indexOf(entry);
    if (i >= 0) subs.splice(i, 1);
  };
}

/** Admin view — recent signals + current subscribers. */
export function inspect(): {
  subscribers: Array<{ name: string; subscriber: string }>;
  recent: SignalEvent[];
} {
  return {
    subscribers: subs.map(s => ({ name: s.name, subscriber: s.subscriber })),
    recent: [...recent],
  };
}

/** Exposed for tests — remove all subscribers. */
export function _resetForTests(): void {
  subs.length = 0;
  recent.length = 0;
}
