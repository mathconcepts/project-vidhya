/**
 * concept-cost tests — DB-less mode (graceful degradation).
 *
 * The DB path is exercised in integration tests. Here we just verify the
 * no-DB fallback returns sane state so dev/free-tier doesn't crash.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { canSpend, readState, recordSpend, DEFAULT_MONTHLY_CAP_USD } from '../concept-cost';

describe('concept-cost (DB unavailable)', () => {
  const originalDbUrl = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (originalDbUrl) process.env.DATABASE_URL = originalDbUrl; });

  it('readState returns zero spend without DB', async () => {
    const s = await readState('test-concept');
    expect(s.spent_usd).toBe(0);
    expect(s.exhausted).toBe(false);
    expect(s.near_limit).toBe(false);
  });

  it('canSpend returns allowed=true without DB', async () => {
    const r = await canSpend('test-concept');
    expect(r.allowed).toBe(true);
  });

  it('recordSpend is a no-op without DB', async () => {
    const s = await recordSpend('test-concept', 5.0);
    expect(s.spent_usd).toBe(0);
  });

  it('canSpend honors a custom cap', async () => {
    const r = await canSpend('test-concept', 50);
    expect(r.state.cap_usd).toBe(50);
  });

  it('default cap is 10 USD per month', () => {
    expect(DEFAULT_MONTHLY_CAP_USD).toBe(10);
  });
});
