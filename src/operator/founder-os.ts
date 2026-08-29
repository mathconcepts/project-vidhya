// @ts-nocheck
/**
 * src/operator/founder-os.ts
 *
 * "Complete AND Paid" — the 90-day operating system for a time-starved
 * founder. Two halves, one view:
 *   - Complete: milestones toward a 90-day goal window, tracked here.
 *   - Paid: revenue collected in that window, read from the existing
 *     payments adapter (src/operator/payments.ts) — not a second
 *     revenue store; the operator module already has one.
 *
 * Owner-only surface (see requireOwner() in src/api/operator-routes.ts)
 * — this is "master rights" territory, a strict superset of what an
 * admin can reach.
 *
 * Storage: flat-file, matching every other operator-module store
 * (payments.jsonl, users.json). Durable-mirrored (the migration-043
 * pattern via src/storage/durable-flat-file.ts) because a founder's
 * own execution plan is exactly the "nothing can recompute this"
 * data that pattern exists for.
 *
 * `plan_id` keys every record so a second 90-day plan (a different
 * goal set — "another topic") can run alongside or after this one
 * with no schema change. Default plan: 'complete-and-paid'.
 */

import crypto from 'crypto';
import { createFlatFileStore } from '../lib/flat-file-store';
import { durableCollection, registerDurable } from '../storage/durable-flat-file';
import { localPaymentsAdapter } from './payments';
import type { FounderOsMilestone, FounderOsSettings, FounderOsView } from './types';

const STORE_PATH = '.data/founder-os.json';
export const DEFAULT_PLAN_ID = 'complete-and-paid';
const DEFAULT_WINDOW_DAYS = 90;

interface StoreShape {
  milestones: FounderOsMilestone[];
  settings:   FounderOsSettings[];   // one row per plan_id
}

const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ milestones: [], settings: [] }),
  isValid: (parsed: any) =>
    parsed && Array.isArray(parsed.milestones) && Array.isArray(parsed.settings),
});

const _durableMilestones = registerDurable('founder-os-milestones', durableCollection<FounderOsMilestone>({
  collection: 'founder-os-milestones',
  idOf: (m) => m.id,
  scopeOf: (m) => m.plan_id,
  readLocal: () => _store.read().milestones ?? [],
  writeLocal: (items) => _store.write({ ..._store.read(), milestones: items } as never),
}));

const _durableSettings = registerDurable('founder-os-settings', durableCollection<FounderOsSettings>({
  collection: 'founder-os-settings',
  idOf: (s) => s.plan_id,
  scopeOf: (s) => s.plan_id,
  readLocal: () => _store.read().settings ?? [],
  writeLocal: (items) => _store.write({ ..._store.read(), settings: items } as never),
}));

function newId(): string {
  return 'fos_' + crypto.randomBytes(9).toString('base64url');
}

function nowIso(): string {
  return new Date().toISOString();
}

// ============================================================================
// Settings
// ============================================================================

function defaultSettings(plan_id: string): FounderOsSettings {
  const now = nowIso();
  return {
    plan_id,
    window_start: now,
    window_days: DEFAULT_WINDOW_DAYS,
    revenue_target_minor: null,
    revenue_target_currency: 'USD',
    weekly_hours_budget: null,
    created_at: now,
    updated_at: now,
  };
}

/** Read settings for a plan. Returns an unpersisted default if none exist yet. */
export function getSettings(plan_id: string = DEFAULT_PLAN_ID): FounderOsSettings {
  const store = _store.read();
  return store.settings.find(s => s.plan_id === plan_id) ?? defaultSettings(plan_id);
}

export function updateSettings(
  plan_id: string,
  patch: Partial<Pick<FounderOsSettings,
    'window_start' | 'window_days' | 'revenue_target_minor' | 'revenue_target_currency' | 'weekly_hours_budget'
  >>,
): FounderOsSettings {
  const store = _store.read();
  let s = store.settings.find(x => x.plan_id === plan_id);
  if (!s) {
    s = defaultSettings(plan_id);
    store.settings.push(s);
  }
  Object.assign(s, patch, { updated_at: nowIso() });
  _store.write(store);
  _durableSettings.mirror();
  return s;
}

// ============================================================================
// Milestones — "Complete"
// ============================================================================

export function listMilestones(plan_id: string = DEFAULT_PLAN_ID): FounderOsMilestone[] {
  return _store.read().milestones
    .filter(m => m.plan_id === plan_id)
    .sort((a, b) => (a.target_date || '9999-99-99').localeCompare(b.target_date || '9999-99-99'));
}

export function createMilestone(params: {
  plan_id?:     string;
  title:        string;
  description?: string;
  category?:    string;
  target_date?: string;
}): { ok: boolean; reason?: string; milestone?: FounderOsMilestone } {
  if (!params.title || !params.title.trim()) {
    return { ok: false, reason: 'title required' };
  }
  const store = _store.read();
  const now = nowIso();
  const m: FounderOsMilestone = {
    id: newId(),
    plan_id: params.plan_id ?? DEFAULT_PLAN_ID,
    title: params.title.trim(),
    description: params.description,
    category: params.category,
    target_date: params.target_date,
    status: 'not_started',
    created_at: now,
    updated_at: now,
  };
  store.milestones.push(m);
  _store.write(store);
  _durableMilestones.mirror();
  return { ok: true, milestone: m };
}

const VALID_STATUSES = new Set(['not_started', 'in_progress', 'done']);

export function updateMilestone(
  id: string,
  patch: Partial<Pick<FounderOsMilestone, 'title' | 'description' | 'category' | 'target_date' | 'status'>>,
): { ok: boolean; reason?: string; milestone?: FounderOsMilestone } {
  if (patch.status && !VALID_STATUSES.has(patch.status)) {
    return { ok: false, reason: `invalid status — must be one of ${[...VALID_STATUSES].join(', ')}` };
  }
  const store = _store.read();
  const m = store.milestones.find(x => x.id === id);
  if (!m) return { ok: false, reason: 'milestone not found' };

  const wasStatus = m.status;
  Object.assign(m, patch);
  m.updated_at = nowIso();
  if (patch.status && patch.status !== wasStatus) {
    m.completed_at = patch.status === 'done' ? nowIso() : undefined;
  }

  _store.write(store);
  _durableMilestones.mirror();
  return { ok: true, milestone: m };
}

export function deleteMilestone(id: string): boolean {
  const store = _store.read();
  const before = store.milestones.length;
  store.milestones = store.milestones.filter(m => m.id !== id);
  if (store.milestones.length === before) return false;
  _store.write(store);
  _durableMilestones.mirror();
  return true;
}

// ============================================================================
// Aggregated view — the "Complete AND Paid" read model
// ============================================================================

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

export function getOsView(plan_id: string = DEFAULT_PLAN_ID): FounderOsView {
  const settings = getSettings(plan_id);
  const milestones = listMilestones(plan_id);

  // A malformed window_start (bad manual edit, pre-validation data) must
  // degrade to "start counting from now" rather than propagate an Invalid
  // Date into .toISOString() below, which throws.
  const parsedStart = new Date(settings.window_start);
  const windowStart = isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
  const windowDays = settings.window_days > 0 ? settings.window_days : DEFAULT_WINDOW_DAYS;
  const windowEnd = new Date(windowStart.getTime() + windowDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const days_elapsed = Math.max(0, daysBetween(windowStart, now));
  const days_remaining = Math.max(0, daysBetween(now, windowEnd));
  const pct_elapsed = Math.min(100, Math.round((days_elapsed / windowDays) * 100));

  const done = milestones.filter(m => m.status === 'done').length;
  const total = milestones.length;
  const pct_complete = total === 0 ? 0 : Math.round((done / total) * 100);

  // "Paid" — read the existing payments adapter for this window. Never a
  // second revenue store; the operator module already owns that data.
  let collected_minor = 0;
  let currency = settings.revenue_target_currency ?? 'USD';
  try {
    const totals = localPaymentsAdapter.totalRevenue({
      since: windowStart.toISOString(),
      until: windowEnd.toISOString(),
    });
    currency = settings.revenue_target_currency && totals[settings.revenue_target_currency] !== undefined
      ? settings.revenue_target_currency
      : (Object.keys(totals)[0] ?? currency);
    collected_minor = totals[currency] ?? 0;
  } catch {
    // Payments adapter unreachable — report zero, never throw. The OS
    // view must survive a broken revenue read the same way the founder
    // dashboard's own caveats-array pattern does.
  }

  const pct_of_target = settings.revenue_target_minor
    ? Math.min(100, Math.round((collected_minor / settings.revenue_target_minor) * 100))
    : null;

  // Pace note: at the current daily completion rate, will the remaining
  // milestones finish inside what's left of the window? Needs >=1 done
  // milestone first — otherwise "0 done in 0 days" reads as "you'll never
  // finish," which is a false alarm on day one, not a real signal.
  let pace_note: string | null = null;
  if (done > 0 && days_elapsed > 0) {
    const per_day = done / days_elapsed;
    const remaining_needed = total - done;
    if (remaining_needed <= 0) {
      pace_note = 'All milestones complete.';
    } else if (per_day > 0) {
      const days_to_finish = Math.ceil(remaining_needed / per_day);
      pace_note = days_to_finish <= days_remaining
        ? `On pace — ${remaining_needed} milestone(s) left, projected to finish in ~${days_to_finish}d (${days_remaining}d remain in the window).`
        : `Behind pace — ${remaining_needed} milestone(s) left, projected to take ~${days_to_finish}d, but only ${days_remaining}d remain in the window.`;
    }
  }

  return {
    plan_id,
    window: {
      start: settings.window_start,
      end: windowEnd.toISOString(),
      days_total: windowDays,
      days_elapsed,
      days_remaining,
      pct_elapsed,
    },
    complete: { milestones, total, done, pct_complete, pace_note },
    paid: { collected_minor, currency, target_minor: settings.revenue_target_minor, pct_of_target },
    time_budget: { weekly_hours: settings.weekly_hours_budget },
    settings,
  };
}

/** Test helper. */
export function _resetForTests(): void {
  _store.write({ milestones: [], settings: [] });
}
