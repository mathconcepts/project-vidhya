/**
 * Unit tests for ContentStudioPage's pure derivation logic added by the
 * review-queue elevation work (queue-age staleness). The interactive parts
 * (fetching the live library entry, rendering the diff, polling drafts) are
 * exercised manually — these tests pin the pure functions so a refactor
 * can't silently change which drafts get flagged as stale.
 */

import { describe, it, expect } from 'vitest';
import { __testing } from './ContentStudioPage';

const { daysSince, staleDrafts, QUEUE_AGE_WARNING_DAYS } = __testing;

const NOW = new Date('2026-08-03T12:00:00.000Z');

function draft(overrides: Partial<{
  draft_id: string;
  status: 'draft' | 'approved' | 'rejected' | 'archived';
  generated_at: string;
}> = {}) {
  const { draft_id = 'd1', status = 'draft', generated_at = NOW.toISOString() } = overrides;
  return {
    draft_id,
    concept_id: 'c1',
    title: 'Test concept',
    difficulty: 'intro' as const,
    tags: [],
    exams: [],
    explainer_md: 'body',
    status,
    generation: {
      request: {},
      used_source: 'llm' as const,
      attempts: [],
      generated_at,
      duration_ms: 100,
    },
  };
}

describe('ContentStudioPage.daysSince', () => {
  it('returns 0 for a timestamp at exactly now', () => {
    expect(daysSince(NOW.toISOString(), NOW)).toBe(0);
  });

  it('returns whole days elapsed, floored', () => {
    const tenDaysAgo = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysSince(tenDaysAgo, NOW)).toBe(10);

    const almostTwoDays = new Date(NOW.getTime() - (2 * 24 * 60 * 60 * 1000 - 1000)).toISOString();
    expect(daysSince(almostTwoDays, NOW)).toBe(1);
  });

  it('never returns negative days for a timestamp in the future', () => {
    const future = new Date(NOW.getTime() + 24 * 60 * 60 * 1000).toISOString();
    expect(daysSince(future, NOW)).toBe(0);
  });

  it('returns 0 for an unparseable timestamp rather than NaN', () => {
    expect(daysSince('not-a-date', NOW)).toBe(0);
  });
});

describe('ContentStudioPage.staleDrafts', () => {
  it('flags drafts at or past the warning threshold', () => {
    const fresh = draft({ draft_id: 'fresh', generated_at: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() });
    const exactlyAtThreshold = draft({
      draft_id: 'threshold',
      generated_at: new Date(NOW.getTime() - QUEUE_AGE_WARNING_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    });
    const veryStale = draft({ draft_id: 'stale', generated_at: new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() });

    const result = staleDrafts([fresh, exactlyAtThreshold, veryStale], QUEUE_AGE_WARNING_DAYS, NOW);

    expect(result.map((d) => d.draft_id)).toEqual(['threshold', 'stale']);
  });

  it('ignores non-draft statuses even if old', () => {
    const oldApproved = draft({
      draft_id: 'approved-old',
      status: 'approved',
      generated_at: new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const oldRejected = draft({
      draft_id: 'rejected-old',
      status: 'rejected',
      generated_at: new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    expect(staleDrafts([oldApproved, oldRejected], QUEUE_AGE_WARNING_DAYS, NOW)).toEqual([]);
  });

  it('respects a custom threshold', () => {
    const threeDaysOld = draft({ draft_id: 'three', generated_at: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() });
    expect(staleDrafts([threeDaysOld], 2, NOW)).toHaveLength(1);
    expect(staleDrafts([threeDaysOld], 4, NOW)).toHaveLength(0);
  });

  it('returns an empty array when nothing is stale', () => {
    const fresh = draft({ generated_at: NOW.toISOString() });
    expect(staleDrafts([fresh], QUEUE_AGE_WARNING_DAYS, NOW)).toEqual([]);
  });
});
