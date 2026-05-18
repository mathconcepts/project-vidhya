/**
 * Explicit feedback store for syllabus-bridge generated content.
 *
 * The flat-file pattern matches the other syllabus-bridge stores.
 * Aggregation is computed on read (cheap — most content has < 50 feedbacks).
 *
 * Auto-flag-for-regen rules (see computeSummary):
 *   - 3+ 'wrong' ratings           -> needs_regen (factual error claimed)
 *   - 4+ 'not-helpful' AND less than 25% 'helpful' -> needs_regen (wrong angle)
 *   - 3+ 'unclear' AND less than 33% 'helpful'     -> needs_regen (re-write for clarity)
 *   - Otherwise: needs_regen = false
 *
 * When needs_regen becomes true we also flip GeneratedContent.flagged_for_regen
 * so the admin UI can highlight it.
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type { ContentFeedback, FeedbackSummary, FeedbackRating } from './types';
import { getGeneratedContent, saveGeneratedContent } from './store';

interface StoreShape { entries: ContentFeedback[]; }

const _feedback = createFlatFileStore<StoreShape>({
  path: '.data/syllabus-bridge-feedback.json',
  defaultShape: () => ({ entries: [] }),
});

const ALL_RATINGS: FeedbackRating[] = [
  'helpful', 'not-helpful', 'wrong', 'unclear', 'too-easy', 'too-hard',
];

// ----------------------------------------------------------------------------

export function saveFeedback(entry: ContentFeedback): void {
  _feedback.update(s => {
    s.entries.push(entry);
    return s;
  });
  // After saving, re-evaluate whether the parent content is now flagged.
  const summary = computeSummary(entry.content_id);
  if (summary.needs_regen) {
    const content = getGeneratedContent(entry.content_id);
    if (content && !content.flagged_for_regen) {
      content.flagged_for_regen = true;
      saveGeneratedContent(content);
    }
  }
}

export function listFeedbackForContent(content_id: string): ContentFeedback[] {
  return _feedback.read().entries.filter(e => e.content_id === content_id);
}

export function listFeedbackForMapping(mapping_id: string): ContentFeedback[] {
  return _feedback.read().entries.filter(e => e.mapping_id === mapping_id);
}

/** Aggregate one content piece's feedback into a summary. Pure function over the store. */
export function computeSummary(content_id: string): FeedbackSummary {
  const entries = listFeedbackForContent(content_id);
  const by_rating = ALL_RATINGS.reduce<Record<FeedbackRating, number>>(
    (acc, r) => { acc[r] = 0; return acc; },
    {} as Record<FeedbackRating, number>,
  );
  for (const e of entries) by_rating[e.rating] += 1;

  const total = entries.length;
  const helpfulRatio = total > 0 ? by_rating.helpful / total : 1;

  // Decide regen
  let needs_regen = false;
  let regen_reason = 'ok';
  if (by_rating.wrong >= 3) {
    needs_regen = true;
    regen_reason = `${by_rating.wrong} 'wrong' reports — likely factual error`;
  } else if (by_rating['not-helpful'] >= 4 && helpfulRatio < 0.25) {
    needs_regen = true;
    regen_reason = `${by_rating['not-helpful']} 'not-helpful' votes with low approval — wrong angle`;
  } else if (by_rating.unclear >= 3 && helpfulRatio < 0.33) {
    needs_regen = true;
    regen_reason = `${by_rating.unclear} 'unclear' reports — re-write for clarity`;
  }

  const recent_comments = entries
    .filter(e => !!e.comment?.trim())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
    .map(e => ({
      user_id: e.user_id,
      role: e.role,
      rating: e.rating,
      comment: e.comment ?? '',
      created_at: e.created_at,
    }));

  return { content_id, total, by_rating, recent_comments, needs_regen, regen_reason };
}

/** Quick stats across a whole mapping — used by the admin overview. */
export function mappingFeedbackOverview(mapping_id: string): {
  total_feedback: number;
  flagged_content_count: number;
  top_complaints: Array<{ content_id: string; total: number; reason: string }>;
} {
  const entries = listFeedbackForMapping(mapping_id);
  const byContent = new Map<string, ContentFeedback[]>();
  for (const e of entries) {
    const list = byContent.get(e.content_id) ?? [];
    list.push(e);
    byContent.set(e.content_id, list);
  }
  const summaries = [...byContent.keys()].map(cid => computeSummary(cid));
  const flagged = summaries.filter(s => s.needs_regen);
  return {
    total_feedback: entries.length,
    flagged_content_count: flagged.length,
    top_complaints: flagged
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(s => ({ content_id: s.content_id, total: s.total, reason: s.regen_reason })),
  };
}
