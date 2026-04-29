// @ts-nocheck
/**
 * src/api/operator-routes.ts
 *
 * HTTP surface for the operator (founder) module:
 *
 *   GET  /api/operator/dashboard           admin only — aggregated metrics
 *   POST /api/operator/payments/record     admin only — manual payment entry
 *   POST /api/operator/payments/webhook    shared-secret — provider webhooks
 *   POST /api/operator/analytics/event     admin only — manual event entry
 *
 * The dashboard is the primary surface; the others are integration
 * points for external tools.
 *
 * Webhook auth: a shared secret in the header X-Operator-Webhook-Secret
 * matches OPERATOR_WEBHOOK_SECRET env var. If env var unset, webhook
 * endpoint returns 503 — operators must configure before using.
 */

import type { ServerResponse } from 'http';
import {
  sendJSON,
  sendError,
  type ParsedRequest,
  type RouteHandler,
} from '../lib/route-helpers';
import { getCurrentUser } from '../auth/middleware';
import { localPaymentsAdapter } from '../operator/payments';
import { getAnalyticsAdapter } from '../operator/analytics-selector';
import { buildDashboard } from '../operator/dashboard';
import type { PaymentEvent, AnalyticsEvent } from '../operator/types';

async function requireAdmin(req: ParsedRequest, res: ServerResponse): Promise<{ user: any } | null> {
  const auth = await getCurrentUser(req);
  if (!auth) {
    sendError(res, 401, 'authentication required');
    return null;
  }
  const role = auth.user.role;
  if (!['admin', 'owner', 'institution'].includes(role)) {
    sendError(res, 403, 'admin role required');
    return null;
  }
  return { user: auth.user };
}

// ─── GET /api/operator/dashboard ────────────────────────────────

async function h_dashboard(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireAdmin(req, res);
  if (!ok) return;
  try {
    const dash = await buildDashboard();
    sendJSON(res, dash);
  } catch (e: any) {
    sendError(res, 500, `dashboard build failed: ${e?.message ?? 'unknown'}`);
  }
}

// ─── POST /api/operator/payments/record ─────────────────────────

async function h_record_payment(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireAdmin(req, res);
  if (!ok) return;

  const body = (req.body as any) || {};
  if (!body.external_id || typeof body.external_id !== 'string') {
    return sendError(res, 400, 'external_id required');
  }
  if (typeof body.amount_minor !== 'number' || body.amount_minor < 0) {
    return sendError(res, 400, 'amount_minor must be a non-negative number');
  }
  if (!body.currency || typeof body.currency !== 'string') {
    return sendError(res, 400, 'currency required (ISO 4217)');
  }

  const event: PaymentEvent = {
    external_id: body.external_id,
    user_id: body.user_id,
    currency: body.currency.toUpperCase(),
    amount_minor: body.amount_minor,
    paid_at: body.paid_at ?? new Date().toISOString(),
    description: body.description,
    provider: body.provider ?? 'manual',
  };

  try {
    localPaymentsAdapter.record(event);
    sendJSON(res, { ok: true, event }, 201);
  } catch (e: any) {
    sendError(res, 500, `payment record failed: ${e?.message ?? 'unknown'}`);
  }
}

// ─── POST /api/operator/payments/webhook ────────────────────────
// Provider webhooks (Stripe, Razorpay) call this. Auth via shared
// secret because the actor is the provider, not a logged-in user.

async function h_payment_webhook(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const secret = process.env.OPERATOR_WEBHOOK_SECRET;
  if (!secret) {
    return sendError(res, 503, 'webhook not configured (OPERATOR_WEBHOOK_SECRET unset)');
  }
  const provided = req.headers?.['x-operator-webhook-secret']
    ?? req.headers?.['X-Operator-Webhook-Secret'];
  if (provided !== secret) {
    return sendError(res, 401, 'invalid webhook secret');
  }

  const body = (req.body as any) || {};
  // Each provider sends a different shape. The operator is responsible
  // for normalising before calling this endpoint OR adding a small
  // shim adapter that maps the provider's shape to PaymentEvent.
  // The default expectation is: the body IS already in PaymentEvent
  // shape. See FOUNDER.md for the recommended shim pattern.
  if (!body.external_id || typeof body.amount_minor !== 'number' || !body.currency) {
    return sendError(res, 400,
      'webhook body must be normalised to PaymentEvent shape — see FOUNDER.md');
  }

  const event: PaymentEvent = {
    external_id: body.external_id,
    user_id: body.user_id,
    currency: body.currency.toUpperCase(),
    amount_minor: body.amount_minor,
    paid_at: body.paid_at ?? new Date().toISOString(),
    description: body.description,
    provider: body.provider ?? 'webhook',
  };

  try {
    localPaymentsAdapter.record(event);
    sendJSON(res, { ok: true }, 200);
  } catch (e: any) {
    sendError(res, 500, `webhook record failed: ${e?.message ?? 'unknown'}`);
  }
}

// ─── POST /api/operator/analytics/event ─────────────────────────

async function h_record_event(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireAdmin(req, res);
  if (!ok) return;
  const body = (req.body as any) || {};
  if (!body.event_type || typeof body.event_type !== 'string') {
    return sendError(res, 400, 'event_type required');
  }
  const event: AnalyticsEvent = {
    event_type: body.event_type,
    at: body.at ?? new Date().toISOString(),
    actor_id: body.actor_id,
    props: body.props,
  };
  try {
    await getAnalyticsAdapter().recordEvent(event);
    sendJSON(res, { ok: true, event }, 201);
  } catch (e: any) {
    sendError(res, 500, `event record failed: ${e?.message ?? 'unknown'}`);
  }
}

// ─── Route table ─────────────────────────────────────────────────

export const operatorRoutes: Array<{
  method: string;
  path: string;
  handler: RouteHandler;
}> = [
  { method: 'GET',  path: '/api/operator/dashboard',          handler: h_dashboard },
  { method: 'POST', path: '/api/operator/payments/record',    handler: h_record_payment },
  { method: 'POST', path: '/api/operator/payments/webhook',   handler: h_payment_webhook },
  { method: 'POST', path: '/api/operator/analytics/event',    handler: h_record_event },
];
