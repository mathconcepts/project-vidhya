/**
 * kag-refresh-scanner tests.
 *
 * Off-by-default flag gate + coverage-gap-filling behavior: existing KAG
 * entries are skipped, the nightly cap stops the loop early, and failures
 * on one concept don't abort the run.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetKagEntry = vi.hoisted(() => vi.fn());
const mockIsNightlyCapReached = vi.hoisted(() => vi.fn());
const mockGenerateKagEntry = vi.hoisted(() => vi.fn());

vi.mock('../../content/kag-store', () => ({
  getKagEntry: mockGetKagEntry,
}));
vi.mock('../content-refresh-queue', () => ({
  isNightlyCapReached: mockIsNightlyCapReached,
}));
vi.mock('../../gbrain/operations/kag-concept-generator', () => ({
  generateKagEntry: mockGenerateKagEntry,
}));
vi.mock('../../constants/concept-graph', () => ({
  ALL_CONCEPTS: [
    { id: 'a', label: 'A', description: 'desc a' },
    { id: 'b', label: 'B', description: 'desc b' },
    { id: 'c', label: 'C', description: 'desc c' },
  ],
}));

import { runKagRefreshScanner } from '../kag-refresh-scanner';

describe('kag-refresh-scanner', () => {
  const prevFlag = process.env.VIDHYA_KAG_NIGHTLY;

  beforeEach(() => {
    mockGetKagEntry.mockReset();
    mockIsNightlyCapReached.mockReset();
    mockGenerateKagEntry.mockReset();
    delete process.env.VIDHYA_KAG_NIGHTLY;
  });
  afterEach(() => {
    if (prevFlag) process.env.VIDHYA_KAG_NIGHTLY = prevFlag;
    else delete process.env.VIDHYA_KAG_NIGHTLY;
  });

  it('is off by default — no calls to the generator at all', async () => {
    const r = await runKagRefreshScanner();
    expect(r.status).toBe('skipped');
    expect(r.reason).toMatch(/VIDHYA_KAG_NIGHTLY/);
    expect(mockGenerateKagEntry).not.toHaveBeenCalled();
  });

  it('skips concepts that already have a KAG entry, generates the rest', async () => {
    process.env.VIDHYA_KAG_NIGHTLY = 'on';
    mockIsNightlyCapReached.mockReturnValue(false);
    mockGetKagEntry.mockImplementation((id: string) => (id === 'a' ? { concept_id: 'a' } : null));
    mockGenerateKagEntry.mockResolvedValue({ ok: true });

    const r = await runKagRefreshScanner();

    expect(r.status).toBe('ran');
    expect(r.skipped_existing).toBe(1);
    expect(r.generated).toBe(2);
    expect(mockGenerateKagEntry).toHaveBeenCalledTimes(2);
  });

  it('stops issuing new generations once the nightly cap is reached', async () => {
    process.env.VIDHYA_KAG_NIGHTLY = 'on';
    mockGetKagEntry.mockReturnValue(null);
    mockIsNightlyCapReached
      .mockReturnValueOnce(false) // concept a
      .mockReturnValueOnce(true)  // concept b — capped
      .mockReturnValueOnce(true); // concept c — capped
    mockGenerateKagEntry.mockResolvedValue({ ok: true });

    const r = await runKagRefreshScanner();

    expect(r.generated).toBe(1);
    expect(r.skipped_cap).toBe(2);
    expect(mockGenerateKagEntry).toHaveBeenCalledTimes(1);
  });

  it('counts a failed generation without aborting the remaining concepts', async () => {
    process.env.VIDHYA_KAG_NIGHTLY = 'on';
    mockGetKagEntry.mockReturnValue(null);
    mockIsNightlyCapReached.mockReturnValue(false);
    mockGenerateKagEntry
      .mockResolvedValueOnce({ ok: false, skipped_reason: 'llm_error' })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });

    const r = await runKagRefreshScanner();

    expect(r.failed).toBe(1);
    expect(r.generated).toBe(2);
  });

  it('treats a thrown error from the generator as a failure, not a crash', async () => {
    process.env.VIDHYA_KAG_NIGHTLY = 'on';
    mockGetKagEntry.mockReturnValue(null);
    mockIsNightlyCapReached.mockReturnValue(false);
    mockGenerateKagEntry.mockRejectedValue(new Error('boom'));

    const r = await runKagRefreshScanner();

    expect(r.status).toBe('ran');
    expect(r.failed).toBe(3);
  });
});
