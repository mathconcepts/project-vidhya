/**
 * Red-team fix 2 (INFORMATIONAL): pollAllInFlightBatches() is called from
 * two independent places — server boot (resumeAllInFlightBatches) and the
 * scheduler's 5-min cron tick — and a slow pass can still be in flight
 * when the next trigger fires. The per-pass run-lookup cache and bank
 * accumulator are module-level mutable state; two overlapping passes
 * would each own (and clobber) the same slot. This locks the reentrancy
 * guard: a second concurrent call awaits the pass already running rather
 * than starting a new one, and the underlying orchestrator step is
 * invoked exactly once per overlapping burst.
 *
 * The orchestrator itself is mocked out (via `../orchestrator`) so this
 * test exercises only poller.ts's own concurrency control, with no real
 * DB or network involved — createPgPersistence()/createGeminiBatchAdapter()
 * are both lazy/side-effect-free at construction time (see their own
 * files), so leaving them real here is safe.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const pollAllInFlightMock = vi.fn();

vi.mock('../orchestrator', () => ({
  createBatchOrchestrator: vi.fn(() => ({
    pollAllInFlight: pollAllInFlightMock,
    abort: vi.fn(),
  })),
}));

describe('pollAllInFlightBatches — reentrancy guard', () => {
  beforeEach(() => {
    vi.resetModules();
    pollAllInFlightMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a second concurrent call awaits the pass already in flight instead of starting a new one', async () => {
    let resolvePass: (v: Array<{ run_id: string; result: unknown }>) => void = () => {};
    pollAllInFlightMock.mockImplementation(
      () => new Promise((resolve) => { resolvePass = resolve; }),
    );

    const { pollAllInFlightBatches } = await import('../poller');

    const callA = pollAllInFlightBatches();
    const callB = pollAllInFlightBatches();

    // Only the first call should have reached the orchestrator so far —
    // the second is waiting on the same in-flight promise, not a
    // freshly-started pass.
    expect(pollAllInFlightMock).toHaveBeenCalledTimes(1);

    resolvePass([{ run_id: 'run-1', result: { state: 'processing' } as never }]);
    const [resultA, resultB] = await Promise.all([callA, callB]);

    expect(pollAllInFlightMock).toHaveBeenCalledTimes(1);
    expect(resultA).toEqual(resultB);
    expect(resultA).toEqual([{ run_id: 'run-1', result: { state: 'processing' } }]);
  });

  it('a call AFTER a pass completes starts a genuinely new pass (guard clears, not stuck forever)', async () => {
    pollAllInFlightMock
      .mockResolvedValueOnce([{ run_id: 'run-1', result: { state: 'processing' } as never }])
      .mockResolvedValueOnce([{ run_id: 'run-2', result: { state: 'complete' } as never }]);

    const { pollAllInFlightBatches } = await import('../poller');

    const first = await pollAllInFlightBatches();
    const second = await pollAllInFlightBatches();

    expect(pollAllInFlightMock).toHaveBeenCalledTimes(2);
    expect(first).toEqual([{ run_id: 'run-1', result: { state: 'processing' } }]);
    expect(second).toEqual([{ run_id: 'run-2', result: { state: 'complete' } }]);
  });

  it('the guard clears even when a pass rejects, so the next call is not wedged', async () => {
    pollAllInFlightMock
      .mockRejectedValueOnce(new Error('provider outage'))
      .mockResolvedValueOnce([{ run_id: 'run-1', result: { state: 'processing' } as never }]);

    const { pollAllInFlightBatches } = await import('../poller');

    await expect(pollAllInFlightBatches()).rejects.toThrow('provider outage');
    const out = await pollAllInFlightBatches();

    expect(pollAllInFlightMock).toHaveBeenCalledTimes(2);
    expect(out).toEqual([{ run_id: 'run-1', result: { state: 'processing' } }]);
  });

  it('three overlapping calls all resolve to the one real pass\'s result', async () => {
    let resolvePass: (v: Array<{ run_id: string; result: unknown }>) => void = () => {};
    pollAllInFlightMock.mockImplementation(
      () => new Promise((resolve) => { resolvePass = resolve; }),
    );

    const { pollAllInFlightBatches } = await import('../poller');

    const calls = [pollAllInFlightBatches(), pollAllInFlightBatches(), pollAllInFlightBatches()];
    expect(pollAllInFlightMock).toHaveBeenCalledTimes(1);

    resolvePass([{ run_id: 'run-only', result: { state: 'downloading' } as never }]);
    const results = await Promise.all(calls);

    expect(pollAllInFlightMock).toHaveBeenCalledTimes(1);
    for (const r of results) {
      expect(r).toEqual([{ run_id: 'run-only', result: { state: 'downloading' } }]);
    }
  });
});
