// @ts-nocheck
/**
 * Unit tests for the LLM budget.
 *
 * Two test modes — these tests run with the env var UNSET so we
 * test the disabled-by-default behaviour. A separate test file
 * could be added with the env var set to test the enabled path,
 * but env vars are tricky to override at module-load time in
 * vitest. For now, we test the disabled path here and the enabled
 * path via direct manipulation.
 *
 * Covers:
 *   - When DAILY_CAP unset: tryReserveTokens always allows
 *   - When DAILY_CAP unset: getBudgetStatus reports cap=null
 *   - isBudgetCapEnabled returns false when unset
 *   - recordUsage no-ops when disabled (no throws)
 *   - cancelReservation no-ops when disabled
 */

import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(async () => {
  const m = await import('../../../lib/llm-budget');
  m._resetForTests();
});

describe('llm-budget — disabled by default', () => {
  it('tryReserveTokens always allows when cap unset', async () => {
    const { tryReserveTokens } = await import('../../../lib/llm-budget');
    const r = tryReserveTokens('user-A', 1_000_000);
    expect(r.allowed).toBe(true);
    expect(r.cap).toBeNull();
    expect(r.remaining).toBe(Infinity);
  });

  it('isBudgetCapEnabled returns false', async () => {
    const { isBudgetCapEnabled } = await import('../../../lib/llm-budget');
    expect(isBudgetCapEnabled()).toBe(false);
  });

  it('getBudgetStatus reports cap=null', async () => {
    const { getBudgetStatus } = await import('../../../lib/llm-budget');
    const s = getBudgetStatus('user-A');
    expect(s.cap).toBeNull();
    expect(s.remaining).toBeNull();
  });

  it('recordUsage and cancelReservation are safe no-ops when cap unset', async () => {
    const { recordUsage, cancelReservation } = await import('../../../lib/llm-budget');
    expect(() => recordUsage('user-A', 1000, 1500)).not.toThrow();
    expect(() => cancelReservation('user-A', 1500)).not.toThrow();
  });

  it('reservation/usage flow works end-to-end (disabled mode)', async () => {
    const { tryReserveTokens, recordUsage, getBudgetStatus } = await import('../../../lib/llm-budget');
    tryReserveTokens('user-X', 5000);
    recordUsage('user-X', 4500, 5000);
    const s = getBudgetStatus('user-X');
    // Disabled: nothing is tracked
    expect(s.used).toBe(0);
    expect(s.reserved).toBe(0);
  });
});
