// @ts-nocheck
/**
 * src/operator/types.ts
 *
 * Types for the operator (founder) module.
 *
 * The operator module is a small set of integration points for the
 * external tools a solo founder uses to run the business: payments,
 * analytics, support. The module is NOT trying to replicate what
 * Stripe / Plausible / etc. do — it's the seam where they plug in.
 *
 * Each adapter has the shape:
 *
 *   interface XAdapter {
 *     enabled: boolean;
 *     name: string;
 *     ...domain-specific methods, all returning typed results...
 *   }
 *
 * If an adapter isn't configured, `enabled: false` and methods
 * return safe defaults (null, [], 0). Callers check `enabled`
 * before assuming the adapter has anything useful.
 *
 * See FOUNDER.md for the full runbook — this file is just the
 * type contracts the runbook references.
 */

// ─── Payments ────────────────────────────────────────────────────

export interface PaymentEvent {
  /** Stable identifier — Stripe payment_intent_id, etc. */
  external_id:    string;
  /** Internal user this payment is associated with, if any. */
  user_id?:       string;
  /** ISO 4217 (USD, INR, EUR, ...) */
  currency:       string;
  /** Smallest unit (cents, paise). 5 USD = 500. */
  amount_minor:   number;
  /** When the payment cleared. */
  paid_at:        string;
  /** Free-text note (plan name, "course", "subscription"). */
  description?:   string;
  /** Provider name — 'stripe' / 'razorpay' / 'manual'. */
  provider:       string;
}

export interface PaymentsAdapter {
  enabled:        boolean;
  name:           string;
  /** All payment events, optionally filtered by date range. */
  list(opts?: {
    since?: string;     // ISO date
    until?: string;
    user_id?: string;
  }): PaymentEvent[];
  /** Total revenue across the date range, summed in minor units per currency. */
  totalRevenue(opts?: {
    since?: string;
    until?: string;
  }): Record<string, number>;   // currency → total_minor
  /** Append a payment event. Used by webhooks. */
  record(event: PaymentEvent): void;
}

// ─── Analytics ───────────────────────────────────────────────────

export interface AnalyticsEvent {
  /** Type — 'signup' / 'chat_sent' / 'plan_completed' / etc. */
  event_type:    string;
  /** When the event happened. */
  at:            string;
  /** User this event belongs to, if any. anon_<sessionId> for anon. */
  actor_id?:     string;
  /** Free-form properties, JSON-shaped. */
  props?:        Record<string, any>;
}

export interface AnalyticsAdapter {
  enabled:       boolean;
  name:          string;
  /** Record an event. Async because external services may take a beat. */
  recordEvent(event: AnalyticsEvent): Promise<void>;
  /** Query events. Local adapter supports filters; external adapters may not. */
  query?(opts?: {
    since?:      string;
    until?:      string;
    event_type?: string;
    actor_id?:   string;
  }): Promise<AnalyticsEvent[]>;
  /** Aggregate counts per event type for a date range. */
  countByType?(opts?: {
    since?:      string;
    until?:      string;
  }): Promise<Record<string, number>>;
}

// ─── Founder OS — "Complete AND Paid" ───────────────────────────────
//
// The 90-day operating system for a time-starved founder. Two halves:
//   - Complete: milestones toward a 90-day goal window (this file).
//   - Paid: revenue collected in that window — reads PaymentsAdapter
//     above, not a separate store.
//
// `plan_id` keys every record so a second 90-day plan (a different
// goal set, run alongside or after this one) needs no schema change —
// default plan is 'complete-and-paid'. Owner-only surface; see
// requireOwner() in src/api/operator-routes.ts.

export interface FounderOsMilestone {
  id:            string;
  plan_id:       string;
  title:         string;
  description?:  string;
  category?:     string;
  /** ISO date this milestone is targeted for, within the 90-day window. */
  target_date?:  string;
  status:        'not_started' | 'in_progress' | 'done';
  created_at:    string;
  updated_at:    string;
  completed_at?: string;
}

export interface FounderOsSettings {
  plan_id:                  string;
  /** ISO timestamp — start of the 90-day (or however long) window. */
  window_start:             string;
  window_days:               number;
  /** Revenue target for the window, minor units. null = no target set. */
  revenue_target_minor:     number | null;
  revenue_target_currency:  string;
  /** How many hours/week the founder actually has — the "time-starved" input. */
  weekly_hours_budget:      number | null;
  created_at:               string;
  updated_at:                string;
}

export interface FounderOsView {
  plan_id: string;
  window: {
    start:         string;
    end:           string;
    days_total:    number;
    days_elapsed:  number;
    days_remaining: number;
    pct_elapsed:   number;
  };
  complete: {
    milestones:    FounderOsMilestone[];
    total:         number;
    done:          number;
    pct_complete:  number;
    /** Plain-English pace read — null until there's at least one done milestone. */
    pace_note:     string | null;
  };
  paid: {
    collected_minor: number;
    currency:        string;
    target_minor:    number | null;
    /** null when no target is set — never fabricate a percentage against nothing. */
    pct_of_target:   number | null;
  };
  time_budget: {
    weekly_hours: number | null;
  };
  settings: FounderOsSettings;
}

// ─── Founder dashboard ─────────────────────────────────────────────

export interface FounderDashboard {
  generated_at:      string;
  /** User counts. */
  users: {
    total:           number;
    active_7d:       number;
    new_30d:         number;
    by_role:         Record<string, number>;
  };
  /** Revenue (only populated if payments adapter enabled). */
  revenue?: {
    total_30d:       Record<string, number>;   // currency → minor units
    paid_users_30d:  number;
    /** average revenue per paid user, minor units, per currency */
    arpu_30d:        Record<string, number>;
  };
  /** Activity. */
  activity: {
    chat_sent_7d:        number;
    plans_run_7d:        number;
    library_views_7d:    number;
    studio_drafts_7d:    number;
  };
  /** Lifecycle events from the operator analytics adapter (signup,
   *  channel_linked, role_changed). Last 30 days. */
  lifecycle: {
    signups_30d:          number;
    channels_linked_30d:  number;
    role_changes_30d:     number;
  };
  /** Cost. */
  cost: {
    /** Estimated LLM spend across all users in the last 7d, in tokens. */
    llm_tokens_7d:        number;
    /** Estimated dollar cost — null if no pricing model is configured. */
    llm_estimated_usd_7d: number | null;
    /** Total budget reservations consumed today (sum across users). */
    budget_used_today:    number;
  };
  /** Health. */
  health: {
    /** Live module status from /api/orchestrator/health. */
    modules:        Array<{ name: string; status: string; detail: string }>;
    /** Tests passing (manual update from CI). */
    tests_status:   string;
  };
  /** Honest non-data — what's NOT in this view yet. */
  caveats: string[];
}
