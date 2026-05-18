/**
 * Tests for the feedback store + auto-flag-for-regen logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import {
  saveFeedback, computeSummary, listFeedbackForContent,
  mappingFeedbackOverview,
} from '../../../syllabus-bridge/feedback-store';
import {
  saveGeneratedContent, getGeneratedContent,
} from '../../../syllabus-bridge/store';
import type { ContentFeedback, GeneratedContent, FeedbackRating } from '../../../syllabus-bridge/types';

const STORES = [
  '.data/syllabus-bridge-content.json',
  '.data/syllabus-bridge-batches.json',
  '.data/syllabus-bridge-feedback.json',
];

function clearStores() {
  for (const p of STORES) if (existsSync(p)) rmSync(p);
}

function makeContent(content_id = 'CNT-fb-test'): GeneratedContent {
  return {
    content_id,
    unit_id: 'u-fb-test',
    unit_type: 'worked-example',
    mapping_id: 'TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE',
    mapping_entry_id: 'matrices.inverse',
    title: 'Test',
    body_markdown: '## test',
    source: 'mock',
    generated_at: new Date().toISOString(),
  };
}

function makeFb(content_id: string, rating: FeedbackRating, i = 0): ContentFeedback {
  return {
    feedback_id: `FB-${rating}-${i}`,
    content_id,
    unit_id: 'u-fb-test',
    mapping_id: 'TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE',
    user_id: `u-${i}`,
    role: 'student',
    rating,
    created_at: new Date(Date.now() + i).toISOString(),
  };
}

describe('feedback-store: saving + listing', () => {
  beforeEach(clearStores);

  it('save then list returns the same entry', () => {
    saveGeneratedContent(makeContent());
    const entry = makeFb('CNT-fb-test', 'helpful');
    saveFeedback(entry);
    const list = listFeedbackForContent('CNT-fb-test');
    expect(list.length).toBe(1);
    expect(list[0].rating).toBe('helpful');
  });
});

describe('feedback-store: computeSummary', () => {
  beforeEach(clearStores);

  it('zero feedback => total=0, needs_regen=false', () => {
    saveGeneratedContent(makeContent());
    const s = computeSummary('CNT-fb-test');
    expect(s.total).toBe(0);
    expect(s.needs_regen).toBe(false);
    expect(s.regen_reason).toBe('ok');
  });

  it('3+ "wrong" -> needs_regen with reason', () => {
    saveGeneratedContent(makeContent());
    saveFeedback(makeFb('CNT-fb-test', 'wrong', 1));
    saveFeedback(makeFb('CNT-fb-test', 'wrong', 2));
    saveFeedback(makeFb('CNT-fb-test', 'wrong', 3));
    const s = computeSummary('CNT-fb-test');
    expect(s.needs_regen).toBe(true);
    expect(s.regen_reason).toMatch(/wrong/);
  });

  it('4+ not-helpful with low helpful ratio -> needs_regen', () => {
    saveGeneratedContent(makeContent());
    for (let i = 0; i < 4; i++) saveFeedback(makeFb('CNT-fb-test', 'not-helpful', i));
    const s = computeSummary('CNT-fb-test');
    expect(s.needs_regen).toBe(true);
    expect(s.regen_reason).toMatch(/not-helpful/);
  });

  it('4 not-helpful + many helpful -> NOT flagged (helpful ratio rescues)', () => {
    saveGeneratedContent(makeContent());
    for (let i = 0; i < 4; i++) saveFeedback(makeFb('CNT-fb-test', 'not-helpful', i));
    for (let i = 0; i < 20; i++) saveFeedback(makeFb('CNT-fb-test', 'helpful', 100 + i));
    const s = computeSummary('CNT-fb-test');
    expect(s.needs_regen).toBe(false);
  });

  it('3+ unclear with low helpful ratio -> needs_regen', () => {
    saveGeneratedContent(makeContent());
    for (let i = 0; i < 3; i++) saveFeedback(makeFb('CNT-fb-test', 'unclear', i));
    const s = computeSummary('CNT-fb-test');
    expect(s.needs_regen).toBe(true);
    expect(s.regen_reason).toMatch(/unclear/);
  });
});

describe('feedback-store: auto-flag-for-regen side effect', () => {
  beforeEach(clearStores);

  it('saving the 3rd "wrong" flips flagged_for_regen on the content', () => {
    saveGeneratedContent(makeContent());
    expect(getGeneratedContent('CNT-fb-test')?.flagged_for_regen).toBeFalsy();
    saveFeedback(makeFb('CNT-fb-test', 'wrong', 1));
    saveFeedback(makeFb('CNT-fb-test', 'wrong', 2));
    expect(getGeneratedContent('CNT-fb-test')?.flagged_for_regen).toBeFalsy();
    saveFeedback(makeFb('CNT-fb-test', 'wrong', 3));
    expect(getGeneratedContent('CNT-fb-test')?.flagged_for_regen).toBe(true);
  });
});

describe('feedback-store: mappingFeedbackOverview', () => {
  beforeEach(clearStores);

  it('aggregates flagged content across a mapping', () => {
    // Two different content pieces in the same mapping
    saveGeneratedContent({ ...makeContent('CNT-a'), unit_id: 'u-a' });
    saveGeneratedContent({ ...makeContent('CNT-b'), unit_id: 'u-b' });
    // Flag CNT-a
    saveFeedback(makeFb('CNT-a', 'wrong', 1));
    saveFeedback(makeFb('CNT-a', 'wrong', 2));
    saveFeedback(makeFb('CNT-a', 'wrong', 3));
    // Healthy CNT-b
    saveFeedback(makeFb('CNT-b', 'helpful', 4));

    const overview = mappingFeedbackOverview('TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE');
    expect(overview.total_feedback).toBe(4);
    expect(overview.flagged_content_count).toBe(1);
    expect(overview.top_complaints[0].content_id).toBe('CNT-a');
  });

  it('keeps recent_comments capped at 5', () => {
    saveGeneratedContent(makeContent());
    for (let i = 0; i < 10; i++) {
      const fb = makeFb('CNT-fb-test', 'helpful', i);
      fb.comment = `comment ${i}`;
      saveFeedback(fb);
    }
    const s = computeSummary('CNT-fb-test');
    expect(s.recent_comments.length).toBe(5);
  });
});
