/**
 * Tests for src/gbrain/xp-store.ts — T14 (B5).
 *
 * Locks:
 *   - xpEarnedSince with a baseline filters on `awarded_at > $2`; without
 *     one (a student who has never submitted a quiz) it sums the FULL
 *     lifetime ledger instead — no baseline yet means the lifetime total
 *     IS the current cycle's total.
 *   - the award floor: a negative net ledger (mistaken/negative-marking
 *     events outweighing positive ones) never surfaces as a negative
 *     number to the student — it reads as 0.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { __resetSharedPoolForTests } from '../../storage/pool';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

beforeEach(() => {
  mockQuery.mockReset();
  __resetSharedPoolForTests(); // the shared pool caches across calls — force a fresh one per test so DATABASE_URL toggles actually take effect
  process.env.DATABASE_URL = 'postgres://test/test';
});

describe('xpEarnedSince', () => {
  it('sums the full lifetime ledger (no awarded_at filter) when sinceMs is null', async () => {
    const { xpEarnedSince } = await import('../xp-store');
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '55' }] });

    const result = await xpEarnedSince('s1', null);

    expect(result).toBe(55);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).not.toContain('awarded_at');
    expect(params).toEqual(['s1']);
  });

  it('filters on awarded_at > baseline when sinceMs is given', async () => {
    const { xpEarnedSince } = await import('../xp-store');
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '20' }] });
    const sinceMs = new Date('2026-06-15T00:00:00.000Z').getTime();

    const result = await xpEarnedSince('s1', sinceMs);

    expect(result).toBe(20);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).toContain('awarded_at > $2');
    expect(params).toEqual(['s1', new Date(sinceMs).toISOString()]);
  });

  it('floors a negative net sum at 0 rather than surfacing a negative meter', async () => {
    const { xpEarnedSince } = await import('../xp-store');
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '-12' }] });

    const result = await xpEarnedSince('s1', null);
    expect(result).toBe(0);
  });
});
