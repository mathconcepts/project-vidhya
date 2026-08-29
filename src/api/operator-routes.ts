// @ts-nocheck
/**
 * src/api/operator-routes.ts
 *
 * HTTP surface for the operator (founder) module:
 *
 *   GET    /api/operator/dashboard                    admin only — aggregated metrics
 *   POST   /api/operator/payments/record               admin only — manual payment entry
 *   POST   /api/operator/payments/webhook               shared-secret — provider webhooks
 *   POST   /api/operator/analytics/event                admin only — manual event entry
 *   GET    /api/operator/founder-os                    owner only — "Complete AND Paid" 90-day OS view
 *   POST   /api/operator/founder-os/milestones          owner only
 *   PATCH  /api/operator/founder-os/milestones/:id      owner only
 *   DELETE /api/operator/founder-os/milestones/:id      owner only
 *   PATCH  /api/operator/founder-os/settings            owner only
 *
 * The dashboard is the primary surface; the others are integration
 * points for external tools. founder-os/* is master-rights territory —
 * a strict superset of what admin can reach — so it gates on the
 * `owner` role specifically rather than the admin/owner/institution
 * membership check the older endpoints use.
 *
 * Webhook auth: a shared secret in the header X-Operator-Webhook-Secret
 * matches OPERATOR_WEBHOOK_SECRET env var. If env var unset, webhook
 * endpoint returns 503 — operators must configure before using.
 */

import type { ServerResponse } from 'http';
import {
  sendJSON,
  sendError,
  sendNoContent,
  type ParsedRequest,
  type RouteHandler,
} from '../lib/route-helpers';
import { getCurrentUser } from '../auth/middleware';
import { roleGte } from '../auth/types';
import { localPaymentsAdapter } from '../operator/payments';
import { getAnalyticsAdapter } from '../operator/analytics-selector';
import { buildDashboard } from '../operator/dashboard';
import {
  getOsView, createMilestone, updateMilestone, deleteMilestone,
  updateSettings, DEFAULT_PLAN_ID,
} from '../operator/founder-os';
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

/**
 * Owner-only gate — the founder's "master rights" surface. Uses the real
 * role hierarchy (roleGte) rather than an explicit membership list, so it
 * stays correct if a higher role is ever added above owner (institution
 * already is, per src/auth/types.ts, though unreachable by default).
 */
async function requireOwner(req: ParsedRequest, res: ServerResponse): Promise<{ user: any } | null> {
  const auth = await getCurrentUser(req);
  if (!auth) {
    sendError(res, 401, 'authentication required');
    return null;
  }
  if (!roleGte(auth.user.role, 'owner')) {
    sendError(res, 403, 'owner role required — this is founder-only');
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

// ─── GET /api/operator/founder-os ───────────────────────────────
// "Complete AND Paid" — the 90-day operating system view.

async function h_founder_os_view(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireOwner(req, res);
  if (!ok) return;
  try {
    const plan_id = req.query.get('plan_id') || DEFAULT_PLAN_ID;
    sendJSON(res, getOsView(plan_id));
  } catch (e: any) {
    sendError(res, 500, `founder-os view failed: ${e?.message ?? 'unknown'}`);
  }
}

// ─── POST /api/operator/founder-os/milestones ───────────────────

async function h_founder_os_create_milestone(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireOwner(req, res);
  if (!ok) return;
  const body = (req.body as any) || {};
  if (!body.title || typeof body.title !== 'string') {
    return sendError(res, 400, 'title required');
  }
  const result = createMilestone({
    plan_id: body.plan_id,
    title: body.title,
    description: body.description,
    category: body.category,
    target_date: body.target_date,
  });
  if (!result.ok) return sendError(res, 400, result.reason ?? 'create failed');
  sendJSON(res, { ok: true, milestone: result.milestone }, 201);
}

// ─── PATCH /api/operator/founder-os/milestones/:id ──────────────

async function h_founder_os_update_milestone(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireOwner(req, res);
  if (!ok) return;
  const body = (req.body as any) || {};
  const result = updateMilestone(req.params.id, {
    title: body.title,
    description: body.description,
    category: body.category,
    target_date: body.target_date,
    status: body.status,
  });
  if (!result.ok) {
    return sendError(res, result.reason === 'milestone not found' ? 404 : 400, result.reason ?? 'update failed');
  }
  sendJSON(res, { ok: true, milestone: result.milestone });
}

// ─── DELETE /api/operator/founder-os/milestones/:id ─────────────

async function h_founder_os_delete_milestone(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireOwner(req, res);
  if (!ok) return;
  const deleted = deleteMilestone(req.params.id);
  if (!deleted) return sendError(res, 404, 'milestone not found');
  sendNoContent(res);
}

// ─── PATCH /api/operator/founder-os/settings ────────────────────

async function h_founder_os_update_settings(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ok = await requireOwner(req, res);
  if (!ok) return;
  const body = (req.body as any) || {};
  if (body.window_days !== undefined && (typeof body.window_days !== 'number' || body.window_days <= 0)) {
    return sendError(res, 400, 'window_days must be a positive number');
  }
  if (body.window_start !== undefined && isNaN(new Date(body.window_start).getTime())) {
    return sendError(res, 400, 'window_start must be a valid ISO date string');
  }
  if (body.revenue_target_minor !== undefined && body.revenue_target_minor !== null
      && (typeof body.revenue_target_minor !== 'number' || body.revenue_target_minor < 0)) {
    return sendError(res, 400, 'revenue_target_minor must be a non-negative number or null');
  }
  if (body.weekly_hours_budget !== undefined && body.weekly_hours_budget !== null
      && (typeof body.weekly_hours_budget !== 'number' || body.weekly_hours_budget < 0)) {
    return sendError(res, 400, 'weekly_hours_budget must be a non-negative number or null');
  }
  const settings = updateSettings(body.plan_id || DEFAULT_PLAN_ID, {
    window_start: body.window_start,
    window_days: body.window_days,
    revenue_target_minor: body.revenue_target_minor,
    revenue_target_currency: body.revenue_target_currency,
    weekly_hours_budget: body.weekly_hours_budget,
  });
  sendJSON(res, { ok: true, settings });
}

// ─── Route table ─────────────────────────────────────────────────

export const operatorRoutes: Array<{
  method: string;
  path: string;
  handler: RouteHandler;
}> = [
  { method: 'GET',    path: '/api/operator/dashboard',                     handler: h_dashboard },
  { method: 'POST',   path: '/api/operator/payments/record',               handler: h_record_payment },
  { method: 'POST',   path: '/api/operator/payments/webhook',              handler: h_payment_webhook },
  { method: 'POST',   path: '/api/operator/analytics/event',               handler: h_record_event },
  { method: 'GET',    path: '/api/operator/founder-os',                    handler: h_founder_os_view },
  { method: 'POST',   path: '/api/operator/founder-os/milestones',         handler: h_founder_os_create_milestone },
  { method: 'PATCH',  path: '/api/operator/founder-os/milestones/:id',     handler: h_founder_os_update_milestone },
  { method: 'DELETE', path: '/api/operator/founder-os/milestones/:id',     handler: h_founder_os_delete_milestone },
  { method: 'PATCH',  path: '/api/operator/founder-os/settings',           handler: h_founder_os_update_settings },
];
