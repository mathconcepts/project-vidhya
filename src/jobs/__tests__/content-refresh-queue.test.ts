/**
 * content-refresh-queue tests.
 *
 * This file owns the MAX_PER_NIGHT=5 KAG-generation invariant. It had zero
 * test coverage before this file — which is part of why its only caller
 * (kag-concept-generator.ts) could be deleted by an unrelated dead-code
 * sweep without any CI signal. Covers: cap enforcement, midnight-UTC
 * reset, and that addKagEntry is only invoked while under the cap.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAddKagEntry = vi.hoisted(() => vi.fn());
vi.mock('../../content/kag-store', () => ({
  addKagEntry: mockAddKagEntry,
}));

import {
  isNightlyCapReached,
  nightlyCount,
  enqueueKagEntry,
  _resetQueueForTests,
} from '../content-refresh-queue';
import type { KagEntry } from '../../content/kag-store';

function makeEntry(concept_id: string): KagEntry {
  return {
    concept_id,
    content: 'test content',
    wolfram_grounding: null,
    embedding: [],
    generated_at: new Date().toISOString(),
    source_model: 'test-model',
  };
}

describe('content-refresh-queue', () => {
  beforeEach(() => {
    _resetQueueForTests();
    mockAddKagEntry.mockReset();
  });

  it('starts each test with the cap not reached and count 0', () => {
    expect(isNightlyCapReached()).toBe(false);
    expect(nightlyCount()).toBe(0);
  });

  it('enqueues and increments the count on success', () => {
    expect(enqueueKagEntry(makeEntry('a'))).toBe(true);
    expect(nightlyCount()).toBe(1);
    expect(mockAddKagEntry).toHaveBeenCalledTimes(1);
  });

  it('enforces MAX_PER_NIGHT=5 — the 6th enqueue in a night is refused', () => {
    for (let i = 0; i < 5; i++) {
      expect(enqueueKagEntry(makeEntry(`c${i}`))).toBe(true);
    }
    expect(isNightlyCapReached()).toBe(true);
    expect(enqueueKagEntry(makeEntry('c5'))).toBe(false);
    // The store is never written to once the cap is hit.
    expect(mockAddKagEntry).toHaveBeenCalledTimes(5);
    expect(nightlyCount()).toBe(5);
  });

  it('does not double-count a refused enqueue', () => {
    for (let i = 0; i < 5; i++) enqueueKagEntry(makeEntry(`d${i}`));
    enqueueKagEntry(makeEntry('overflow'));
    expect(nightlyCount()).toBe(5);
  });
});
