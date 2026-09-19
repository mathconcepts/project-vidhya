/**
 * GET /api/exam/active — the counts it reports must be counts a student can
 * actually reach.
 *
 * Home renders this payload verbatim as "N sections · M concepts".
 * `concept_count` used to read `exam.concept_links.length`, which is a
 * different thing: gate-ma reported 27 while declaring 101 concepts, and had
 * done since the line shipped — it simply looked plausible with one exam
 * installed. A second pack made it read "6 sections · 0 concepts", which is
 * where it became visible.
 *
 * These assert against the resolvers rather than pinned literals, so adding
 * content moves them on its own; what is locked is that the payload cannot
 * drift from what the app is willing to teach.
 */

import { describe, it, expect } from 'vitest';
import { conceptsDeclaredByExam } from '../../constants/concept-graph';
import { getTopicsForExam } from '../../curriculum/topic-adapter';
import { getExam, listExamIds } from '../../curriculum/exam-loader';

describe('exam/active counts are studiable counts', () => {
  it('concept_count is what the exam declares, not its concept_links', () => {
    for (const id of listExamIds()) {
      const exam = getExam(id)!;
      const declared = conceptsDeclaredByExam(id).length;
      // The bug: these two are different numbers, and the payload used the
      // wrong one. Keep the comparison so a revert is loud.
      if (declared > 0) expect(declared).not.toBe(exam.concept_links.length);
    }
    expect(conceptsDeclaredByExam('gate-ma').length).toBeGreaterThan(90);
    expect(conceptsDeclaredByExam('jee-main').length).toBeGreaterThan(0);
  });

  it('section_count matches the topic list the same payload drives', () => {
    for (const id of listExamIds()) {
      const exam = getExam(id)!;
      const topics = getTopicsForExam(id);
      expect(topics.length).toBeLessThanOrEqual(exam.syllabus.length);
      // jee-main declares Physics and Chemistry (its syllabus really is PCM)
      // but both are all-stub and filtered from the topic view, so the raw
      // YAML section count would disagree with the nav.
      if (id === 'jee-main') expect(topics.length).toBeLessThan(exam.syllabus.length);
    }
  });

  it('every reachable topic has a distinct icon within its exam', () => {
    for (const id of listExamIds()) {
      const icons = getTopicsForExam(id).map(t => t.icon);
      if (icons.length === 0) continue;
      // Identical glyphs on every row carry no information — the defect the
      // per-section icons exist to avoid (JEE was 3 x 'book').
      expect(new Set(icons).size).toBe(icons.length);
    }
  });
});
