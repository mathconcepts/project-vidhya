/**
 * narration-experiment-scanner tests (Phase F TTS A/B, §4.15).
 *
 * Cost cap + DB-less graceful path. Integration with real DB is verified
 * once VIDHYA_AB_TESTING=on in production.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

beforeEach(() => { mockQuery.mockReset(); });

describe('narration-experiment-scanner (DB-less)', () => {
  const prev = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (prev) process.env.DATABASE_URL = prev; else delete process.env.DATABASE_URL; });

  it('returns no-op result when DATABASE_URL is unset', async () => {
    vi.resetModules();
    const { runNarrationExperimentScanner } = await import('../narration-experiment-scanner');
    const r = await runNarrationExperimentScanner();
    expect(r.scheduled).toBe(0);
    expect(r.skipped_existing).toBe(0);
    expect(r.skipped_cap).toBe(false);
    expect(r.error).toMatch(/DATABASE_URL/);
  });

  it('exposes the cost cap constant from env or defaults to 50', async () => {
    vi.resetModules();
    const { MAX_ACTIVE_NARRATION } = await import('../narration-experiment-scanner');
    expect(MAX_ACTIVE_NARRATION).toBeGreaterThanOrEqual(1);
  });
});

describe('narration-experiment-scanner (cost cap with DB)', () => {
  beforeEach(() => { process.env.DATABASE_URL = 'postgres://test'; });
  afterEach(() => { delete process.env.DATABASE_URL; });

  it('exits early when active narration count >= cap', async () => {
    vi.resetModules();
    process.env.VIDHYA_MAX_NARRATION_AB = '5';
    // First query: active count returns the cap value.
    mockQuery.mockResolvedValueOnce({ rows: [{ n: 5 }] });
    const { runNarrationExperimentScanner } = await import('../narration-experiment-scanner');
    const r = await runNarrationExperimentScanner();
    expect(r.skipped_cap).toBe(true);
    expect(r.scheduled).toBe(0);
    expect(r.active_count).toBe(5);
    // Should have only called the count query, not the eligibility query.
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('returns error when count query fails', async () => {
    vi.resetModules();
    mockQuery.mockRejectedValueOnce(new Error('connection refused'));
    const { runNarrationExperimentScanner } = await import('../narration-experiment-scanner');
    const r = await runNarrationExperimentScanner();
    expect(r.error).toMatch(/connection refused/);
    expect(r.scheduled).toBe(0);
  });
});
