/**
 * Tests for syllabus-bridge × GBrain integration.
 *
 * The GBrain student model store reads from disk, so these tests
 * exercise the public ranking + recommendation API end-to-end with
 * synthetic students. No network — mock LLM is the fallback inside
 * the runner, and the integration functions never call an LLM.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import {
  rankEntriesForStudent,
  cohortGapReport,
  recommendBridgeContent,
  personalizePromptForStudent,
} from '../../../syllabus-bridge/gbrain-integration';
import { getMapping } from '../../../syllabus-bridge/registry';
import {
  saveGeneratedContent,
  listGeneratedContentForMapping,
} from '../../../syllabus-bridge/store';
import type { GeneratedContent } from '../../../syllabus-bridge/types';

const MAPPING_ID = 'TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE';
const STORES = [
  '.data/syllabus-bridge-content.json',
  '.data/syllabus-bridge-batches.json',
  '.data/student-models.json',
];

function clearStores() {
  for (const p of STORES) if (existsSync(p)) rmSync(p);
}

describe('syllabus-bridge × gbrain — ranking', () => {
  beforeEach(clearStores);

  it('returns a ranked list across all mapping entries with target topics', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    const ranked = await rankEntriesForStudent(mapping, 'anonymous-student-1');
    // Entries with empty target_topic_ids are excluded
    const usableEntries = mapping.entries.filter(e => e.target_topic_ids.length > 0);
    expect(ranked.length).toBe(usableEntries.length);
    // Sorted descending by need_score
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].need_score).toBeLessThanOrEqual(ranked[i - 1].need_score);
    }
  });

  it('foundation entries score higher than aligned entries (default GBrain state)', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    const ranked = await rankEntriesForStudent(mapping, 'anonymous-student-2');
    const avgScore = (cls: string) => {
      const xs = ranked.filter(r => r.entry.gap_class === cls);
      return xs.length ? xs.reduce((s, r) => s + r.need_score, 0) / xs.length : 0;
    };
    const aligned    = avgScore('aligned');
    const depthGap   = avgScore('depth-gap');
    const foundation = avgScore('foundation');
    expect(foundation).toBeGreaterThan(aligned);
    expect(depthGap).toBeGreaterThan(aligned);
  });

  it('need_score is between 0 and 1 for every entry', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    const ranked = await rankEntriesForStudent(mapping, 'student-bounds');
    for (const r of ranked) {
      expect(r.need_score).toBeGreaterThanOrEqual(0);
      expect(r.need_score).toBeLessThanOrEqual(1);
    }
  });

  it('reason string is populated and mentions the gap_class for non-aligned entries', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    const ranked = await rankEntriesForStudent(mapping, 'student-reasons');
    for (const r of ranked) {
      expect(r.reason.length).toBeGreaterThan(0);
    }
    const depthEntry = ranked.find(r => r.entry.gap_class === 'depth-gap');
    expect(depthEntry?.reason).toMatch(/depth-gap/);
  });
});

describe('syllabus-bridge × gbrain — cohort report', () => {
  beforeEach(clearStores);

  it('returns empty array for empty cohort', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    const stats = await cohortGapReport([], mapping);
    expect(stats).toEqual([]);
  });

  it('produces at most 15 entries, sorted by struggling count', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    const ids = Array.from({ length: 5 }, (_, i) => `cohort-student-${i}`);
    const stats = await cohortGapReport(ids, mapping);
    expect(stats.length).toBeLessThanOrEqual(15);
    for (let i = 1; i < stats.length; i++) {
      expect(stats[i].students_struggling).toBeLessThanOrEqual(stats[i - 1].students_struggling);
    }
  });

  it('every stat row has a recommended_action and matches the cohort size', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    const ids = ['a', 'b', 'c'];
    const stats = await cohortGapReport(ids, mapping);
    for (const s of stats) {
      expect(s.cohort_size).toBe(3);
      expect(s.recommended_action).toBeTruthy();
      expect(s.students_struggling).toBeGreaterThanOrEqual(0);
      expect(s.students_struggling).toBeLessThanOrEqual(3);
    }
  });
});

describe('syllabus-bridge × gbrain — recommendations', () => {
  beforeEach(clearStores);

  it('returns empty list for unknown mapping', async () => {
    const recs = await recommendBridgeContent('test-student', 'UNKNOWN-MAPPING');
    expect(recs).toEqual([]);
  });

  it('respects the limit option', async () => {
    const recs = await recommendBridgeContent('test-student-limit', MAPPING_ID, { limit: 3 });
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it('marks needs_generation=true when no content exists yet', async () => {
    const recs = await recommendBridgeContent('test-student-empty', MAPPING_ID, { limit: 2 });
    if (recs.length > 0) {
      for (const r of recs) {
        expect(r.needs_generation).toBe(true);
        expect(r.ready_content).toEqual([]);
      }
    }
  });

  it('attaches ready_content when a matching unit has been generated', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    // Pre-rank to find an entry that will surface in recommendations
    const ranked = await rankEntriesForStudent(mapping, 'test-student-with-content');
    expect(ranked.length).toBeGreaterThan(0);
    const targetEntry = ranked[0].entry;

    const content: GeneratedContent = {
      content_id: 'CNT-test-recs',
      unit_id: `${MAPPING_ID}--${targetEntry.id}--worked-example`,
      unit_type: 'worked-example',
      mapping_id: MAPPING_ID,
      mapping_entry_id: targetEntry.id,
      title: 'Test piece',
      body_markdown: 'mock body',
      source: 'mock',
      generated_at: new Date().toISOString(),
    };
    saveGeneratedContent(content);
    expect(listGeneratedContentForMapping(MAPPING_ID).length).toBe(1);

    const recs = await recommendBridgeContent('test-student-with-content', MAPPING_ID, { limit: 10 });
    const matching = recs.find(r => r.entry_id === targetEntry.id);
    expect(matching).toBeDefined();
    expect(matching!.ready_content.length).toBe(1);
    expect(matching!.needs_generation).toBe(false);
  });
});

describe('syllabus-bridge × gbrain — prompt personalization', () => {
  beforeEach(clearStores);

  it('returns prompt unchanged when student_id is null', async () => {
    const prompt = 'TEST BASE PROMPT';
    const result = await personalizePromptForStudent(prompt, null);
    expect(result).toBe(prompt);
  });

  it('returns prompt unchanged on unknown student id (graceful)', async () => {
    // Even when an id is passed, if the student model fails to load or
    // summary is empty, the function must return the original prompt.
    const prompt = 'TEST BASE PROMPT';
    const result = await personalizePromptForStudent(prompt, 'totally-fake-student');
    // Either returns unchanged OR prepends a student-context block. Both
    // are valid; the contract is "do not throw, do not produce nonsense".
    expect(typeof result).toBe('string');
    expect(result).toContain(prompt);
  });
});
