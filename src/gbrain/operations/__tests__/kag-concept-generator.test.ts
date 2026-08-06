/**
 * kag-concept-generator tests.
 *
 * Restored 2026-08-06 after an unrelated dead-code sweep (#73) deleted this
 * file believing it was unreferenced (it was the only caller of
 * content-refresh-queue.ts's enqueueKagEntry, and scripts/kag-corpus-builder.ts
 * imported it directly — deleting it broke both, silently, since neither had
 * test coverage). This file had zero tests before either; covers the nightly
 * cap short-circuit, graceful degradation when Wolfram/LLM are unavailable,
 * and that bypass_nightly_cap routes around the queue.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWolframSolve = vi.hoisted(() => vi.fn());
vi.mock('../../../services/wolfram-service', () => ({
  wolframSolve: mockWolframSolve,
}));

const mockIsNightlyCapReached = vi.hoisted(() => vi.fn());
const mockEnqueueKagEntry = vi.hoisted(() => vi.fn());
vi.mock('../../../jobs/content-refresh-queue', () => ({
  isNightlyCapReached: mockIsNightlyCapReached,
  enqueueKagEntry: mockEnqueueKagEntry,
}));

const mockAddKagEntry = vi.hoisted(() => vi.fn());
vi.mock('../../../content/kag-store', () => ({
  addKagEntry: mockAddKagEntry,
}));

// LLMClient construction reaches for real config/network without keys —
// force it down the catch/fallback path deterministically instead of
// depending on the sandbox having no credentials configured.
vi.mock('../../../llm/index', () => ({
  LLMClient: vi.fn(() => {
    throw new Error('no LLM configured in test');
  }),
}));
vi.mock('../../../llm/registry', () => ({
  loadLlmConfig: vi.fn(() => ({})),
}));

import { generateKagEntry } from '../kag-concept-generator';

const REQ = { concept_id: 'limits', concept_label: 'Limits', description: 'epsilon-delta' };

describe('kag-concept-generator', () => {
  beforeEach(() => {
    mockWolframSolve.mockReset();
    mockIsNightlyCapReached.mockReset();
    mockEnqueueKagEntry.mockReset();
    mockAddKagEntry.mockReset();
  });

  it('short-circuits on a reached nightly cap without calling Wolfram or the LLM', async () => {
    mockIsNightlyCapReached.mockReturnValue(true);
    const r = await generateKagEntry(REQ);
    expect(r.ok).toBe(false);
    expect(r.skipped_reason).toBe('nightly_cap');
    expect(mockWolframSolve).not.toHaveBeenCalled();
  });

  it('degrades gracefully to the fallback stub content when Wolfram and the LLM are both unavailable', async () => {
    mockIsNightlyCapReached.mockReturnValue(false);
    mockWolframSolve.mockResolvedValue({ available: false, query: '', answer: null, steps: [], interpretation: null, pods: [], latency_ms: 0 });
    mockEnqueueKagEntry.mockReturnValue(true);

    const r = await generateKagEntry(REQ);

    expect(r.ok).toBe(true);
    expect(r.wolfram_available).toBe(false);
    expect(r.entry?.content).toContain('Limits');
    expect(mockEnqueueKagEntry).toHaveBeenCalledTimes(1);
    expect(mockAddKagEntry).not.toHaveBeenCalled();
  });

  it('reports nightly_cap when enqueueKagEntry itself refuses (race with another caller)', async () => {
    mockIsNightlyCapReached.mockReturnValue(false);
    mockWolframSolve.mockResolvedValue({ available: false, query: '', answer: null, steps: [], interpretation: null, pods: [], latency_ms: 0 });
    mockEnqueueKagEntry.mockReturnValue(false);

    const r = await generateKagEntry(REQ);

    expect(r.ok).toBe(false);
    expect(r.skipped_reason).toBe('nightly_cap');
  });

  it('bypass_nightly_cap writes directly via addKagEntry, skipping the queue entirely', async () => {
    mockWolframSolve.mockResolvedValue({ available: false, query: '', answer: null, steps: [], interpretation: null, pods: [], latency_ms: 0 });

    const r = await generateKagEntry({ ...REQ, bypass_nightly_cap: true });

    expect(r.ok).toBe(true);
    expect(mockAddKagEntry).toHaveBeenCalledTimes(1);
    expect(mockEnqueueKagEntry).not.toHaveBeenCalled();
    expect(mockIsNightlyCapReached).not.toHaveBeenCalled();
  });

  it('includes Wolfram grounding in the stored entry when available', async () => {
    mockIsNightlyCapReached.mockReturnValue(false);
    mockWolframSolve.mockResolvedValue({
      available: true,
      query: '', answer: '42', steps: [], interpretation: null,
      pods: [{ title: 'Result', plaintext: '42' }],
      latency_ms: 5,
    });
    mockEnqueueKagEntry.mockReturnValue(true);

    const r = await generateKagEntry(REQ);

    expect(r.wolfram_available).toBe(true);
    expect(r.wolfram_grounding).toContain('42');
    expect(r.entry?.wolfram_grounding).toContain('42');
  });
});
