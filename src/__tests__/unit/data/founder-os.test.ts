// @ts-nocheck
/**
 * Unit tests for src/operator/founder-os.ts — "Complete AND Paid," the
 * 90-day operating system for a time-starved founder.
 *
 * Covers:
 *   - milestone CRUD (create/list/update/delete), scoped by plan_id
 *   - settings (window, revenue target, weekly hours) read/write
 *   - getOsView aggregation: window math, completion %, pace note,
 *     revenue read from the existing payments adapter (not a second store)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, existsSync, rmSync, cpSync } from 'fs';

let savedBackup = '';

beforeAll(() => {
  if (existsSync('.data')) {
    savedBackup = `.data.founder-os-testsave-${Date.now()}`;
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
  const { _resetForTests } = await import('../../../operator/founder-os');
  _resetForTests();
  if (existsSync('.data/payments.jsonl')) rmSync('.data/payments.jsonl');
});

describe('milestones', () => {
  it('creates and lists a milestone, defaulting to the complete-and-paid plan', async () => {
    const { createMilestone, listMilestones, DEFAULT_PLAN_ID } = await import('../../../operator/founder-os');
    const result = createMilestone({ title: 'Ship pilot batch' });
    expect(result.ok).toBe(true);
    expect(result.milestone?.plan_id).toBe(DEFAULT_PLAN_ID);
    expect(result.milestone?.status).toBe('not_started');

    const list = listMilestones();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('Ship pilot batch');
  });

  it('rejects a milestone with no title', async () => {
    const { createMilestone } = await import('../../../operator/founder-os');
    const result = createMilestone({ title: '   ' });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/title/);
  });

  it('scopes milestones by plan_id — a second plan does not leak into the default list', async () => {
    const { createMilestone, listMilestones } = await import('../../../operator/founder-os');
    createMilestone({ title: 'default plan item' });
    createMilestone({ plan_id: 'another-topic', title: 'other plan item' });
    expect(listMilestones().length).toBe(1);
    expect(listMilestones('another-topic').length).toBe(1);
    expect(listMilestones('another-topic')[0].title).toBe('other plan item');
  });

  it('sorts milestones by target_date, undated ones last', async () => {
    const { createMilestone, listMilestones } = await import('../../../operator/founder-os');
    createMilestone({ title: 'no date' });
    createMilestone({ title: 'later', target_date: '2026-11-01' });
    createMilestone({ title: 'earlier', target_date: '2026-09-15' });
    const titles = listMilestones().map(m => m.title);
    expect(titles).toEqual(['earlier', 'later', 'no date']);
  });

  it('updates status and stamps completed_at only on done', async () => {
    const { createMilestone, updateMilestone } = await import('../../../operator/founder-os');
    const { milestone } = createMilestone({ title: 'Set up payments' });
    const inProgress = updateMilestone(milestone!.id, { status: 'in_progress' });
    expect(inProgress.ok).toBe(true);
    expect(inProgress.milestone?.completed_at).toBeUndefined();

    const done = updateMilestone(milestone!.id, { status: 'done' });
    expect(done.milestone?.status).toBe('done');
    expect(done.milestone?.completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Reverting out of done clears completed_at again.
    const reverted = updateMilestone(milestone!.id, { status: 'in_progress' });
    expect(reverted.milestone?.completed_at).toBeUndefined();
  });

  it('rejects an invalid status', async () => {
    const { createMilestone, updateMilestone } = await import('../../../operator/founder-os');
    const { milestone } = createMilestone({ title: 'x' });
    const result = updateMilestone(milestone!.id, { status: 'archived' as any });
    expect(result.ok).toBe(false);
  });

  it('update on a missing id fails with a clear reason', async () => {
    const { updateMilestone } = await import('../../../operator/founder-os');
    const result = updateMilestone('nope', { status: 'done' });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('milestone not found');
  });

  it('deletes a milestone', async () => {
    const { createMilestone, deleteMilestone, listMilestones } = await import('../../../operator/founder-os');
    const { milestone } = createMilestone({ title: 'temp' });
    expect(deleteMilestone(milestone!.id)).toBe(true);
    expect(listMilestones().length).toBe(0);
    expect(deleteMilestone(milestone!.id)).toBe(false);
  });
});

describe('settings', () => {
  it('returns an unpersisted default when none has been written', async () => {
    const { getSettings, DEFAULT_PLAN_ID } = await import('../../../operator/founder-os');
    const s = getSettings();
    expect(s.plan_id).toBe(DEFAULT_PLAN_ID);
    expect(s.window_days).toBe(90);
    expect(s.revenue_target_minor).toBeNull();
  });

  it('persists updates and merges partial patches', async () => {
    const { getSettings, updateSettings, DEFAULT_PLAN_ID } = await import('../../../operator/founder-os');
    updateSettings(DEFAULT_PLAN_ID, { revenue_target_minor: 500000, revenue_target_currency: 'USD' });
    updateSettings(DEFAULT_PLAN_ID, { weekly_hours_budget: 12 });
    const s = getSettings(DEFAULT_PLAN_ID);
    expect(s.revenue_target_minor).toBe(500000);
    expect(s.weekly_hours_budget).toBe(12);
  });
});

describe('getOsView — aggregation', () => {
  it('computes window math from window_start/window_days', async () => {
    const { getOsView, updateSettings, DEFAULT_PLAN_ID } = await import('../../../operator/founder-os');
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
    updateSettings(DEFAULT_PLAN_ID, { window_start: start, window_days: 90 });
    const view = getOsView();
    expect(view.window.days_total).toBe(90);
    expect(view.window.days_elapsed).toBeGreaterThanOrEqual(29);
    expect(view.window.days_elapsed).toBeLessThanOrEqual(31);
    expect(view.window.days_remaining).toBeGreaterThanOrEqual(59);
    expect(view.window.days_remaining).toBeLessThanOrEqual(61);
  });

  it('pct_complete and done/total reflect milestone status', async () => {
    const { getOsView, createMilestone, updateMilestone } = await import('../../../operator/founder-os');
    const a = createMilestone({ title: 'a' }).milestone!;
    createMilestone({ title: 'b' });
    createMilestone({ title: 'c' });
    updateMilestone(a.id, { status: 'done' });
    const view = getOsView();
    expect(view.complete.total).toBe(3);
    expect(view.complete.done).toBe(1);
    expect(view.complete.pct_complete).toBe(33);
  });

  it('pace_note is null until at least one milestone is done', async () => {
    const { getOsView, createMilestone } = await import('../../../operator/founder-os');
    createMilestone({ title: 'a' });
    expect(getOsView().complete.pace_note).toBeNull();
  });

  it('"Paid" reads the existing payments adapter for the window, not a separate store', async () => {
    const { getOsView, updateSettings, DEFAULT_PLAN_ID } = await import('../../../operator/founder-os');
    const { localPaymentsAdapter } = await import('../../../operator/payments');

    const start = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    updateSettings(DEFAULT_PLAN_ID, { window_start: start, window_days: 90, revenue_target_minor: 1000, revenue_target_currency: 'USD' });

    localPaymentsAdapter.record({
      external_id: 'fos-1', currency: 'USD', amount_minor: 250,
      paid_at: new Date().toISOString(), provider: 'manual',
    });

    const view = getOsView();
    expect(view.paid.collected_minor).toBe(250);
    expect(view.paid.currency).toBe('USD');
    expect(view.paid.pct_of_target).toBe(25);
  });

  it('pct_of_target is null (not zero) when no target is set', async () => {
    const { getOsView } = await import('../../../operator/founder-os');
    expect(getOsView().paid.pct_of_target).toBeNull();
  });

  it('never throws even with a corrupt window_start', async () => {
    const { getOsView, updateSettings, DEFAULT_PLAN_ID } = await import('../../../operator/founder-os');
    updateSettings(DEFAULT_PLAN_ID, { window_start: 'not-a-date' as any });
    expect(() => getOsView()).not.toThrow();
  });
});
