// @ts-nocheck
/**
 * src/operator/payments.ts
 *
 * Default payments adapter — a local JSONL append log.
 *
 * Why local-first: a solo founder shouldn't need Stripe configured
 * to start tracking revenue. They might have one customer paying
 * via UPI / bank transfer; they should be able to record it with a
 * one-line POST.
 *
 * Stripe (and Razorpay, and others) plug in via webhook: the
 * operator configures the provider's webhook to POST to
 * /api/operator/payments/record, and the events land in the same
 * JSONL log. This means the rest of the system (dashboard, totals)
 * doesn't care which provider sent the data.
 *
 * Persistence: .data/payments.jsonl, append-only.
 *
 * Auth model (where this is read): admin-only via the dashboard
 * endpoint. The webhook itself uses a shared-secret check to
 * authenticate the provider (see the route handler).
 */

import { createAppendLog } from '../lib/append-log';
import type { PaymentEvent, PaymentsAdapter } from './types';

const PAYMENTS_PATH = '.data/payments.jsonl';

const log = createAppendLog<PaymentEvent>({
  path: PAYMENTS_PATH,
  isValid: (parsed: any) =>
    parsed && typeof parsed === 'object'
      && typeof parsed.external_id === 'string'
      && typeof parsed.amount_minor === 'number'
      && typeof parsed.currency === 'string'
      && typeof parsed.paid_at === 'string',
});

function inRange(event: PaymentEvent, since?: string, until?: string): boolean {
  if (since && event.paid_at < since) return false;
  if (until && event.paid_at > until) return false;
  return true;
}

export const localPaymentsAdapter: PaymentsAdapter = {
  enabled: true,
  name: 'local-jsonl',

  list(opts) {
    const since = opts?.since;
    const until = opts?.until;
    const user_id = opts?.user_id;
    return log.readAll().filter(e =>
      inRange(e, since, until)
        && (user_id === undefined || e.user_id === user_id),
    );
  },

  totalRevenue(opts) {
    const events = this.list({ since: opts?.since, until: opts?.until });
    const totals: Record<string, number> = {};
    for (const e of events) {
      totals[e.currency] = (totals[e.currency] ?? 0) + e.amount_minor;
    }
    return totals;
  },

  record(event) {
    log.append(event);
  },
};

/**
 * Test helper.
 */
export function _resetForTests(): void {
  log.truncate();
}
