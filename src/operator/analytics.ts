// @ts-nocheck
/**
 * src/operator/analytics.ts
 *
 * Default analytics adapter — local JSONL append log at
 * .data/analytics.jsonl.
 *
 * Why local-first: a solo founder shouldn't need Plausible /
 * PostHog / Mixpanel signed up to know how many people used the
 * app today. The local adapter is enough to answer "how many
 * sign-ups this week" or "what's the chat-to-attempt conversion."
 *
 * Operators wanting external analytics swap the adapter export at
 * the bottom of this file. The shape is small enough that adding
 * a Plausible / PostHog implementation is a ~50-line addition; we
 * don't ship those today because each one adds a network call
 * and a credential to manage.
 *
 * The recordEvent function never throws — analytics shouldn't
 * break the request. Failures log to stderr and continue.
 *
 * Performance: in the local-JSONL mode, every recordEvent does a
 * synchronous file append. At ~10ms/append this would slow down
 * a hot path. The hot paths (chat, etc.) DO NOT call this directly;
 * the founder dashboard endpoint reads aggregated data from the
 * log on demand. Operators who want real-time per-request
 * analytics should swap to a non-blocking adapter.
 */

import { createAppendLog } from '../lib/append-log';
import type { AnalyticsEvent, AnalyticsAdapter } from './types';

const ANALYTICS_PATH = '.data/analytics.jsonl';

const log = createAppendLog<AnalyticsEvent>({
  path: ANALYTICS_PATH,
  isValid: (parsed: any) =>
    parsed && typeof parsed === 'object'
      && typeof parsed.event_type === 'string'
      && typeof parsed.at === 'string',
});

function inRange(event: AnalyticsEvent, since?: string, until?: string): boolean {
  if (since && event.at < since) return false;
  if (until && event.at > until) return false;
  return true;
}

export const localAnalyticsAdapter: AnalyticsAdapter = {
  enabled: true,
  name: 'local-jsonl',

  async recordEvent(event: AnalyticsEvent) {
    try {
      log.append(event);
    } catch (e: any) {
      console.error('[analytics] recordEvent failed:', e?.message);
    }
  },

  async query(opts) {
    const since = opts?.since;
    const until = opts?.until;
    const event_type = opts?.event_type;
    const actor_id = opts?.actor_id;
    return log.readAll().filter(e =>
      inRange(e, since, until)
        && (event_type === undefined || e.event_type === event_type)
        && (actor_id === undefined || e.actor_id === actor_id),
    );
  },

  async countByType(opts) {
    const events = await this.query({ since: opts?.since, until: opts?.until });
    const out: Record<string, number> = {};
    for (const e of events) {
      out[e.event_type] = (out[e.event_type] ?? 0) + 1;
    }
    return out;
  },
};

/** Test helper. */
export function _resetForTests(): void {
  log.truncate();
}
