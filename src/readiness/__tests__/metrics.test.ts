/**
 * Tests for src/readiness/metrics.ts — T15: in-process readiness
 * observability counters.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordArmSelection,
  recordObjectIdOutcome,
  recordRedirectFired,
  recordDiagnoseFallback,
  readinessMetricsSnapshot,
  resetReadinessMetrics,
} from '../metrics';

beforeEach(() => {
  resetReadinessMetrics();
});

describe('readiness metrics', () => {
  it('starts at zero with a null objectId rate', () => {
    const snap = readinessMetricsSnapshot();
    expect(snap.next_action_with_object_id).toBe(0);
    expect(snap.next_action_without_object_id).toBe(0);
    expect(snap.next_action_object_id_rate).toBeNull();
    expect(snap.redirect_fired).toBe(0);
    expect(snap.diagnose_fallback).toBe(0);
    expect(snap.arm_selections).toEqual({ diagnose: 0, teach: 0, practice: 0, retain: 0 });
  });

  it('carries a since timestamp that is a valid ISO string', () => {
    const snap = readinessMetricsSnapshot();
    expect(() => new Date(snap.since).toISOString()).not.toThrow();
    expect(new Date(snap.since).toISOString()).toBe(snap.since);
  });

  it('tallies arm selections independently per kind', () => {
    recordArmSelection('teach');
    recordArmSelection('teach');
    recordArmSelection('practice');
    recordArmSelection('retain');
    const snap = readinessMetricsSnapshot();
    expect(snap.arm_selections).toEqual({ diagnose: 0, teach: 2, practice: 1, retain: 1 });
  });

  it('computes the objectId rate from with/without counts', () => {
    recordObjectIdOutcome(true);
    recordObjectIdOutcome(true);
    recordObjectIdOutcome(true);
    recordObjectIdOutcome(false);
    const snap = readinessMetricsSnapshot();
    expect(snap.next_action_with_object_id).toBe(3);
    expect(snap.next_action_without_object_id).toBe(1);
    expect(snap.next_action_object_id_rate).toBeCloseTo(0.75);
  });

  it('counts redirect fires independently of the objectId rate', () => {
    recordRedirectFired();
    recordRedirectFired();
    expect(readinessMetricsSnapshot().redirect_fired).toBe(2);
  });

  it('counts diagnose-fallback responses', () => {
    recordDiagnoseFallback();
    expect(readinessMetricsSnapshot().diagnose_fallback).toBe(1);
  });

  it('resetReadinessMetrics clears every counter and advances `since`', async () => {
    recordArmSelection('teach');
    recordObjectIdOutcome(true);
    recordRedirectFired();
    recordDiagnoseFallback();
    const before = readinessMetricsSnapshot().since;

    await new Promise((r) => setTimeout(r, 2));
    resetReadinessMetrics();

    const snap = readinessMetricsSnapshot();
    expect(snap.arm_selections).toEqual({ diagnose: 0, teach: 0, practice: 0, retain: 0 });
    expect(snap.next_action_with_object_id).toBe(0);
    expect(snap.next_action_without_object_id).toBe(0);
    expect(snap.redirect_fired).toBe(0);
    expect(snap.diagnose_fallback).toBe(0);
    expect(snap.since).not.toBe(before);
  });
});
