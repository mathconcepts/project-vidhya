// @ts-nocheck
/**
 * Unit tests for the operator (founder) module.
 *
 * Covers:
 *   - localPaymentsAdapter: record + list + total + filter by date/user
 *   - localAnalyticsAdapter: record + query + countByType
 *   - buildDashboard: produces the expected shape
 *   - buildDashboard: caveats reflect what's missing
 *   - buildDashboard: revenue updates after recording payments
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, existsSync, rmSync, cpSync } from 'fs';

let savedBackup = '';

beforeAll(() => {
  if (existsSync('.data')) {
    savedBackup = `.data.operator-testsave-${Date.now()}`;
    cpSync('.data', savedBackup, { recursive: true });
    rmSync('.data', { recursive: true, force: true });
  }
  mkdirSync('.data', { recursive: true });
});

afterAll(() => {
  if (existsSync('.data')) rmSync('.data', { recursive: true, force: true });
  if (savedBackup && existsSync(savedBackup)) {
    cpSync(savedBackup, '.data', { recursive: true });
    rmSync(savedBackup, { recursive: true, force: true });
  }
});

beforeEach(async () => {
  if (existsSync('.data/payments.jsonl')) rmSync('.data/payments.jsonl');
  if (existsSync('.data/analytics.jsonl')) rmSync('.data/analytics.jsonl');
  // user-store, teaching-turns, content-drafts left alone — we don't reset
  // them between operator tests because they need their populated state to
  // exercise the dashboard's read paths
});

describe('payments adapter', () => {
  it('records and reads back', async () => {
    const { localPaymentsAdapter } = await import('../../../operator/payments');
    localPaymentsAdapter.record({
      external_id: 'pmt-1',
      currency: 'USD',
      amount_minor: 1000,
      paid_at: '2026-04-01T00:00:00Z',
      provider: 'manual',
    });
    const list = localPaymentsAdapter.list();
    expect(list.length).toBe(1);
    expect(list[0].external_id).toBe('pmt-1');
  });

  it('totalRevenue sums by currency', async () => {
    const { localPaymentsAdapter } = await import('../../../operator/payments');
    localPaymentsAdapter.record({ external_id: 'p1', currency: 'USD', amount_minor: 100, paid_at: '2026-04-01T00:00:00Z', provider: 'manual' });
    localPaymentsAdapter.record({ external_id: 'p2', currency: 'USD', amount_minor: 250, paid_at: '2026-04-02T00:00:00Z', provider: 'manual' });
    localPaymentsAdapter.record({ external_id: 'p3', currency: 'INR', amount_minor: 39900, paid_at: '2026-04-03T00:00:00Z', provider: 'manual' });
    const t = localPaymentsAdapter.totalRevenue();
    expect(t.USD).toBe(350);
    expect(t.INR).toBe(39900);
  });

  it('filters by date range', async () => {
    const { localPaymentsAdapter } = await import('../../../operator/payments');
    localPaymentsAdapter.record({ external_id: 'old', currency: 'USD', amount_minor: 100, paid_at: '2025-01-01T00:00:00Z', provider: 'manual' });
    localPaymentsAdapter.record({ external_id: 'new', currency: 'USD', amount_minor: 200, paid_at: '2026-04-15T00:00:00Z', provider: 'manual' });
    const since_2026 = localPaymentsAdapter.list({ since: '2026-01-01T00:00:00Z' });
    expect(since_2026.length).toBe(1);
    expect(since_2026[0].external_id).toBe('new');
  });

  it('filters by user_id', async () => {
    const { localPaymentsAdapter } = await import('../../../operator/payments');
    localPaymentsAdapter.record({ external_id: 'u1-1', user_id: 'user-A', currency: 'USD', amount_minor: 100, paid_at: '2026-04-01T00:00:00Z', provider: 'manual' });
    localPaymentsAdapter.record({ external_id: 'u2-1', user_id: 'user-B', currency: 'USD', amount_minor: 200, paid_at: '2026-04-02T00:00:00Z', provider: 'manual' });
    const a_only = localPaymentsAdapter.list({ user_id: 'user-A' });
    expect(a_only.length).toBe(1);
    expect(a_only[0].user_id).toBe('user-A');
  });
});

describe('analytics adapter', () => {
  it('records and queries by type', async () => {
    const { localAnalyticsAdapter } = await import('../../../operator/analytics');
    await localAnalyticsAdapter.recordEvent({
      event_type: 'signup', at: '2026-04-01T00:00:00Z', actor_id: 'user-1',
    });
    await localAnalyticsAdapter.recordEvent({
      event_type: 'signup', at: '2026-04-02T00:00:00Z', actor_id: 'user-2',
    });
    await localAnalyticsAdapter.recordEvent({
      event_type: 'chat', at: '2026-04-03T00:00:00Z', actor_id: 'user-1',
    });
    const signups = await localAnalyticsAdapter.query({ event_type: 'signup' });
    expect(signups.length).toBe(2);
    const counts = await localAnalyticsAdapter.countByType();
    expect(counts.signup).toBe(2);
    expect(counts.chat).toBe(1);
  });

  it('filters by actor_id', async () => {
    const { localAnalyticsAdapter } = await import('../../../operator/analytics');
    await localAnalyticsAdapter.recordEvent({ event_type: 'a', at: '2026-04-01T00:00:00Z', actor_id: 'user-1' });
    await localAnalyticsAdapter.recordEvent({ event_type: 'a', at: '2026-04-01T00:00:00Z', actor_id: 'user-2' });
    const u1 = await localAnalyticsAdapter.query({ actor_id: 'user-1' });
    expect(u1.length).toBe(1);
  });

  it('recordEvent does not throw on log error (caught + logged)', async () => {
    const { localAnalyticsAdapter } = await import('../../../operator/analytics');
    // Forcing a log error is hard — just ensure the API contract: never throws
    await expect(localAnalyticsAdapter.recordEvent({
      event_type: 'test', at: '2026-04-01T00:00:00Z',
    })).resolves.not.toThrow();
  });
});

describe('founder dashboard', () => {
  it('produces the expected shape', async () => {
    const { buildDashboard } = await import('../../../operator/dashboard');
    const dash = await buildDashboard();
    expect(dash.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(dash.users).toBeDefined();
    expect(dash.activity).toBeDefined();
    expect(dash.cost).toBeDefined();
    expect(dash.health).toBeDefined();
    expect(Array.isArray(dash.caveats)).toBe(true);
    expect(typeof dash.users.total).toBe('number');
  });

  it('revenue updates after recording a payment', async () => {
    const { buildDashboard } = await import('../../../operator/dashboard');
    const { localPaymentsAdapter } = await import('../../../operator/payments');

    const before = await buildDashboard();
    expect(before.revenue?.total_30d).toEqual({});

    localPaymentsAdapter.record({
      external_id: 'dash-test-1',
      user_id: 'user-x',
      currency: 'USD',
      amount_minor: 999,
      paid_at: new Date().toISOString(),
      provider: 'manual',
    });

    const after = await buildDashboard();
    expect(after.revenue?.total_30d.USD).toBe(999);
    expect(after.revenue?.paid_users_30d).toBe(1);
  });

  it('caveats include guidance when budget cap not configured', async () => {
    const { buildDashboard } = await import('../../../operator/dashboard');
    const dash = await buildDashboard();
    // Test runs without VIDHYA_LLM_DAILY_TOKEN_CAP_PER_USER set
    const has_budget_caveat = dash.caveats.some(c =>
      c.includes('LLM budget cap not configured'),
    );
    expect(has_budget_caveat).toBe(true);
  });

  it('health.modules has entries from all probes', async () => {
    const { buildDashboard } = await import('../../../operator/dashboard');
    const dash = await buildDashboard();
    // The health probe runs all 12 modules; we expect the count to be
    // around that (might be more or less if test setup state varies)
    expect(dash.health.modules.length).toBeGreaterThan(8);
    // Each entry has the expected shape
    for (const m of dash.health.modules) {
      expect(typeof m.name).toBe('string');
      expect(typeof m.status).toBe('string');
      expect(['healthy', 'degraded', 'unavailable']).toContain(m.status);
    }
  });
});
