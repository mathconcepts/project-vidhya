// @ts-nocheck
/**
 * Unit tests for the exam adapter registry — focused on the
 * adapters bundled in `src/exams/adapters/index.ts`.
 *
 * What's tested:
 *   - All 5 bundled adapters register (BITSAT, JEE Main, UGEE,
 *     NEET, GATE)
 *   - GATE adapter has the right shape (level: postgraduate, etc.)
 *   - GATE adapter's loadBaseContent returns valid ExamContent
 *   - GATE adapter's defaultGenerationSections produces work for
 *     each priority concept × difficulty combination
 *   - GATE adapter's postProcessSnapshot dedupes + injects exam-day-notes
 *   - getSyllabusTopicIds returns a non-empty list
 *   - The GATE entry exists in the gemini-prompt-validator whitelist
 *   - GATE's level field exercises the postgraduate branch of the
 *     Exam.level union (first such adapter; the other 4 are entrance)
 *
 * What's NOT tested here:
 *   - Lesson loading (GATE relies on the shared lesson bank — empty
 *     lessons[] is the design)
 *   - LLM-driven generation (covered by sample-check tests that run
 *     against any registered adapter)
 *   - Mock question quality (the 6 GATE sample questions are
 *     hand-authored and were math-verified at write time; not part
 *     of automated testing)
 */

import { describe, it, expect, beforeAll } from 'vitest';

let registry: any;

beforeAll(async () => {
  // Importing the aggregator side-effect-registers all bundled adapters.
  await import('../../../exams/adapters');
  registry = await import('../../../exam-builder/registry');
});

describe('exam adapter bundle — registration', () => {
  it('all 5 expected adapters are registered', () => {
    const all = registry.listExamAdapters();
    const ids = all.map((a: any) => a.exam_id).sort();
    expect(ids).toContain('EXM-BITSAT-MATH-SAMPLE');
    expect(ids).toContain('EXM-JEEMAIN-MATH-SAMPLE');
    expect(ids).toContain('EXM-UGEE-MATH-SAMPLE');
    expect(ids).toContain('EXM-NEET-BIO-SAMPLE');
    expect(ids).toContain('EXM-GATE-MATH-SAMPLE');
    expect(ids.length).toBeGreaterThanOrEqual(5);
  });

  it('GATE is the first postgraduate-level adapter', () => {
    const gate = registry.getExamAdapter('EXM-GATE-MATH-SAMPLE');
    expect(gate).toBeTruthy();
    expect(gate.level).toBe('postgraduate');

    // Confirm: no other bundled adapter is postgraduate
    const others = registry.listExamAdapters()
      .filter((a: any) => a.exam_id !== 'EXM-GATE-MATH-SAMPLE');
    for (const a of others) {
      expect(a.level).not.toBe('postgraduate');
    }
  });
});

describe('GATE adapter — loadBaseContent', () => {
  it('returns exam, mocks, lessons, strategies', () => {
    const gate = registry.getExamAdapter('EXM-GATE-MATH-SAMPLE');
    const content = gate.loadBaseContent();
    expect(content.exam).toBeDefined();
    expect(content.exam.id).toBe('EXM-GATE-MATH-SAMPLE');
    expect(content.exam.code).toBe('GATE-MATH-2026');
    expect(content.mocks).toHaveLength(1);
    expect(content.mocks[0].id).toBe('MOCK-GATE-MATH-2026-SAMPLE');
    // GATE deliberately ships no exam-specific lessons (relies on shared bank)
    expect(content.lessons).toEqual([]);
    expect(content.strategies.length).toBeGreaterThanOrEqual(3);
  });

  it('mock has 6 questions covering all 3 GATE formats (MCQ + MSQ + NAT)', () => {
    const gate = registry.getExamAdapter('EXM-GATE-MATH-SAMPLE');
    const mock = gate.loadBaseContent().mocks[0];
    expect(mock.questions).toHaveLength(6);
    const kinds = new Set(mock.questions.map((q: any) => q.kind));
    expect(kinds).toEqual(new Set(['mcq', 'msq', 'nat']));
  });

  it('MSQ questions have correct_option_ids array (multiple-correct)', () => {
    const gate = registry.getExamAdapter('EXM-GATE-MATH-SAMPLE');
    const msqs = gate.loadBaseContent().mocks[0].questions
      .filter((q: any) => q.kind === 'msq');
    expect(msqs.length).toBeGreaterThan(0);
    for (const q of msqs) {
      expect(Array.isArray(q.correct_option_ids)).toBe(true);
      expect(q.correct_option_ids.length).toBeGreaterThanOrEqual(1);
      // MSQs should reference 2+ correct options to actually exercise
      // the multiple-correct format (otherwise they're just single-MCQs)
      // but at least one in the sample should have multiple
    }
    const hasMultiCorrect = msqs.some((q: any) => q.correct_option_ids.length >= 2);
    expect(hasMultiCorrect).toBe(true);
  });

  it('NAT questions have a numeric answer + tolerance', () => {
    const gate = registry.getExamAdapter('EXM-GATE-MATH-SAMPLE');
    const nats = gate.loadBaseContent().mocks[0].questions
      .filter((q: any) => q.kind === 'nat');
    expect(nats.length).toBeGreaterThan(0);
    for (const q of nats) {
      expect(typeof q.correct_numeric_answer).toBe('number');
      expect(typeof q.numeric_tolerance).toBe('number');
      expect(q.numeric_tolerance).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('GATE adapter — getSyllabusTopicIds', () => {
  it('returns a non-empty list of topic ids', () => {
    const gate = registry.getExamAdapter('EXM-GATE-MATH-SAMPLE');
    const topics = gate.getSyllabusTopicIds();
    expect(topics.length).toBeGreaterThanOrEqual(5);
    expect(topics).toContain('linear-algebra');     // GATE-emphasized
    expect(topics).toContain('transform-theory');   // GATE-distinctive
    expect(topics).toContain('numerical-methods');  // GATE-distinctive
  });
});

describe('GATE adapter — defaultGenerationSections', () => {
  it('produces sections for each priority concept × 3 difficulties by default', () => {
    const gate = registry.getExamAdapter('EXM-GATE-MATH-SAMPLE');
    const sections = gate.defaultGenerationSections();
    // Default: 6 priority concepts × 3 difficulties = 18 sections
    expect(sections.length).toBeGreaterThanOrEqual(15);
    const difficulties = new Set(sections.map((s: any) => s.difficulty));
    expect(difficulties).toEqual(new Set(['easy', 'medium', 'hard']));
  });

  it('respects topic_ids option', () => {
    const gate = registry.getExamAdapter('EXM-GATE-MATH-SAMPLE');
    const sections = gate.defaultGenerationSections({
      topic_ids: ['linear-algebra'],
      count_per_topic: 2,
    });
    // 1 topic × 2 = 2 sections
    expect(sections.length).toBe(2);
    expect(sections.every((s: any) => s.topic_id === 'linear-algebra')).toBe(true);
  });
});

describe('GATE adapter — postProcessSnapshot', () => {
  it('dedupes questions by id', () => {
    const gate = registry.getExamAdapter('EXM-GATE-MATH-SAMPLE');
    const snapshot = {
      mocks: [
        {
          questions: [
            { id: 'X', prompt: 'one' },
            { id: 'Y', prompt: 'two' },
            { id: 'X', prompt: 'duplicate of one' },
            { id: 'Z', prompt: 'three' },
          ],
        },
      ],
    };
    const out = gate.postProcessSnapshot(snapshot);
    expect(out.mocks[0].questions).toHaveLength(3);
    expect(out.mocks[0].questions.map((q: any) => q.id).sort()).toEqual(['X', 'Y', 'Z']);
  });

  it('injects exam-day notes including MSQ rule (GATE-specific)', () => {
    const gate = registry.getExamAdapter('EXM-GATE-MATH-SAMPLE');
    const snapshot = { mocks: [] };
    const out = gate.postProcessSnapshot(snapshot);
    expect(out._exam_day_notes).toBeDefined();
    expect(out._exam_day_notes.msq_rule).toMatch(/all-or-nothing/i);
    expect(out._exam_day_notes.negative_marking).toMatch(/MSQ.*zero|zero.*MSQ/i);
  });
});

describe('GATE prompt-validator integration', () => {
  it('GATE exam_id is whitelisted in the prompt validator', async () => {
    const { getAllowedPromptPrefixes, validateSystemPrompt } = await import(
      '../../../api/gemini-prompt-validator'
    );
    const prefixes = getAllowedPromptPrefixes('EXM-GATE-MATH-SAMPLE');
    expect(prefixes.length).toBeGreaterThanOrEqual(1);
    expect(prefixes[0]).toMatch(/GATE Engineering Mathematics/);

    // Happy path: a GATE student can use a GATE prefix
    const ok = validateSystemPrompt(
      'You are GBrain, an expert GATE Engineering Mathematics tutor.\n\nstudent context...',
      'EXM-GATE-MATH-SAMPLE',
    );
    expect(ok.ok).toBe(true);

    // Cross-exam: a GATE student cannot use a NEET prefix
    const cross = validateSystemPrompt(
      'You are an expert NEET Biology tutor.',
      'EXM-GATE-MATH-SAMPLE',
    );
    expect(cross.ok).toBe(false);
  });
});
