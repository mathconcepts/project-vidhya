/**
 * Tests for src/scenarios/demo-history-seeder.ts's guard (T20/OV2-2).
 *
 * The guard MUST run — and refuse — before any database work happens.
 * These tests mock only `../auth/user-store` and deliberately do NOT
 * mock the catalog/student-model modules `seedDemoUserHistory` also
 * imports: if the guard didn't fire before touching them, these tests
 * would fail with a real connection error instead of the intended
 * refusal message, which is itself part of what's being verified.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUserById = vi.fn();
vi.mock('../../auth/user-store', () => ({
  getUserById: (...args: any[]) => mockGetUserById(...args),
}));

const { isDemoMintedUserId, assertDemoMintedUserId, seedDemoUserHistory } = await import('../demo-history-seeder');

describe('isDemoMintedUserId / assertDemoMintedUserId', () => {
  beforeEach(() => mockGetUserById.mockReset());

  it('accepts a user whose google_sub carries the demo- prefix', () => {
    mockGetUserById.mockReturnValue({ id: 'user_abc123', google_sub: 'demo-persona-meera-gate-la-anxious' });
    expect(isDemoMintedUserId('user_abc123')).toBe(true);
    expect(() => assertDemoMintedUserId('user_abc123')).not.toThrow();
  });

  it('accepts every demo/seed.ts role prefix (owner/admin/teacher/student/persona)', () => {
    for (const sub of ['demo-owner-0001', 'demo-admin-0002', 'demo-teacher-0003', 'demo-student-priya', 'demo-persona-meera-gate-la-anxious']) {
      mockGetUserById.mockReturnValue({ id: 'u', google_sub: sub });
      expect(isDemoMintedUserId('u'), sub).toBe(true);
    }
  });

  it('refuses an unknown user id', () => {
    mockGetUserById.mockReturnValue(null);
    expect(isDemoMintedUserId('user_ghost')).toBe(false);
    expect(() => assertDemoMintedUserId('user_ghost')).toThrow(/no such user/i);
  });

  it('refuses a real user whose google_sub is a genuine Google subject claim', () => {
    mockGetUserById.mockReturnValue({ id: 'user_real1', google_sub: '108234982374982374' });
    expect(isDemoMintedUserId('user_real1')).toBe(false);
    expect(() => assertDemoMintedUserId('user_real1')).toThrow(/not demo-minted/i);
  });

  it('refuses a scenario-namespace persona id (0aded0a0- prefix) — different mechanism entirely', () => {
    mockGetUserById.mockReturnValue(null); // scenario personas aren't in the auth user-store at all
    expect(isDemoMintedUserId('0aded0a0-1234-5678-9abc-def012345678')).toBe(false);
  });
});

describe('seedDemoUserHistory refuses BEFORE touching the database', () => {
  beforeEach(() => mockGetUserById.mockReset());

  it('throws synchronously-ish (before any catalog/student-model call) for a non-demo id', async () => {
    mockGetUserById.mockReturnValue({ id: 'user_real1', google_sub: 'not-a-demo-sub' });
    await expect(
      seedDemoUserHistory('user_real1', 'meera-gate-la-anxious', []),
    ).rejects.toThrow(/not demo-minted/i);
  });

  it('throws for an unknown id', async () => {
    mockGetUserById.mockReturnValue(null);
    await expect(
      seedDemoUserHistory('user_ghost', 'meera-gate-la-anxious', []),
    ).rejects.toThrow(/no such user/i);
  });
});
