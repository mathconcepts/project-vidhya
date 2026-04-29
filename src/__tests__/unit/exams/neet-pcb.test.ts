// @ts-nocheck
/**
 * Unit tests for the NEET PCB adapters (Physics + Chemistry).
 *
 * Together with the existing NEET Biology adapter, these complete
 * the NEET-UG triad. Tests verify:
 *
 * REGISTRY:
 *   - All 7 bundled adapters are registered (was 5 before this commit)
 *   - The three NEET adapters are all entrance-level
 *
 * NEET PHYSICS:
 *   - Adapter loads and surfaces 8-question sample mock
 *   - All questions are MCQs (NEET Physics is 100% single-correct MCQ)
 *   - Priority concepts cover ~60% of marks (mechanics/EM/modern)
 *   - postProcessSnapshot injects pacing-discipline note (Physics is
 *     the time-sink subject)
 *
 * NEET CHEMISTRY:
 *   - Adapter loads and surfaces 9-question sample mock
 *   - Questions span all 3 sub-disciplines (physical/organic/inorganic)
 *   - Topic weights sum near-equally across the 3 branches
 *   - postProcessSnapshot injects branch-balance note
 *
 * VALIDATOR INTEGRATION:
 *   - All three NEET subjects are whitelisted in the prompt validator
 *   - Cross-subject prompts (Phys student sending Chem prefix) rejected
 *
 * What's NOT tested:
 *   - Real LLM-generated questions (covered by sample-check tests)
 *   - Mock question correctness (hand-verified at write time, not
 *     part of automated testing — same scope discipline as GATE)
 *   - Lesson loading (PCB adapters ship with empty lessons[] — relies
 *     on shared lesson bank, by design)
 */

import { describe, it, expect, beforeAll } from 'vitest';

let registry: any;

beforeAll(async () => {
  // Importing the aggregator side-effect-registers all bundled adapters.
  await import('../../../exams/adapters');
  registry = await import('../../../exam-builder/registry');
});

// ─── REGISTRY ────────────────────────────────────────────────────

describe('NEET PCB — registry', () => {
  it('all 7 expected adapters are registered after this commit', () => {
    const all = registry.listExamAdapters();
    const ids = all.map((a: any) => a.exam_id).sort();
    expect(ids).toContain('EXM-BITSAT-MATH-SAMPLE');
    expect(ids).toContain('EXM-JEEMAIN-MATH-SAMPLE');
    expect(ids).toContain('EXM-UGEE-MATH-SAMPLE');
    expect(ids).toContain('EXM-NEET-BIO-SAMPLE');
    expect(ids).toContain('EXM-NEET-PHYS-SAMPLE');
    expect(ids).toContain('EXM-NEET-CHEM-SAMPLE');
    expect(ids).toContain('EXM-GATE-MATH-SAMPLE');
    expect(ids.length).toBeGreaterThanOrEqual(7);
  });

  it('all three NEET adapters are entrance-level', () => {
    for (const id of ['EXM-NEET-BIO-SAMPLE', 'EXM-NEET-PHYS-SAMPLE', 'EXM-NEET-CHEM-SAMPLE']) {
      const a = registry.getExamAdapter(id);
      expect(a).toBeTruthy();
      expect(a.level).toBe('entrance');
    }
  });

  it('all three NEET adapters share the same issuing body (NTA)', () => {
    for (const id of ['EXM-NEET-BIO-SAMPLE', 'EXM-NEET-PHYS-SAMPLE', 'EXM-NEET-CHEM-SAMPLE']) {
      const content = registry.getExamAdapter(id).loadBaseContent();
      expect(content.exam.issuing_body).toMatch(/NTA|National Testing Agency/);
    }
  });
});

// ─── NEET PHYSICS ────────────────────────────────────────────────

describe('NEET Physics adapter', () => {
  it('loadBaseContent returns valid structure', () => {
    const a = registry.getExamAdapter('EXM-NEET-PHYS-SAMPLE');
    const c = a.loadBaseContent();
    expect(c.exam.id).toBe('EXM-NEET-PHYS-SAMPLE');
    expect(c.exam.code).toBe('NEET-PHYS-2026');
    expect(c.exam.total_marks).toBe(180);
    expect(c.mocks).toHaveLength(1);
    expect(c.mocks[0].questions.length).toBeGreaterThanOrEqual(8);
    // Empty lessons by design (relies on shared bank)
    expect(c.lessons).toEqual([]);
    expect(c.strategies.length).toBeGreaterThanOrEqual(3);
  });

  it('all mock questions are single-correct MCQs (NEET is 100% MCQ)', () => {
    const a = registry.getExamAdapter('EXM-NEET-PHYS-SAMPLE');
    const questions = a.loadBaseContent().mocks[0].questions;
    for (const q of questions) {
      expect(typeof q.correct_index).toBe('number');
      expect(q.options.length).toBe(4);
    }
  });

  it('priority concepts cover the high-weight topics (mech/EM/modern)', () => {
    const a = registry.getExamAdapter('EXM-NEET-PHYS-SAMPLE');
    const priority = a.loadBaseContent().exam.priority_concepts;
    expect(priority).toContain('neet-phys-mechanics');
    expect(priority).toContain('neet-phys-electromagnetism');
    expect(priority).toContain('neet-phys-modern-physics');
  });

  it('postProcessSnapshot injects physics-specific pacing-discipline note', () => {
    const a = registry.getExamAdapter('EXM-NEET-PHYS-SAMPLE');
    const out = a.postProcessSnapshot({ mocks: [] });
    expect(out._exam_day_notes).toBeDefined();
    expect(out._exam_day_notes.time_discipline).toMatch(/2 min|never/i);
    expect(out._exam_day_notes.pacing_target).toMatch(/time-sink|67 sec/i);
  });

  it('defaultGenerationSections produces work for all priority concepts', () => {
    const a = registry.getExamAdapter('EXM-NEET-PHYS-SAMPLE');
    const sections = a.defaultGenerationSections();
    // 3 priority concepts × 3 difficulties = 9 sections by default
    expect(sections.length).toBeGreaterThanOrEqual(9);
    const topics = new Set(sections.map((s: any) => s.topic_id));
    expect(topics.has('neet-phys-mechanics')).toBe(true);
  });
});

// ─── NEET CHEMISTRY ──────────────────────────────────────────────

describe('NEET Chemistry adapter', () => {
  it('loadBaseContent returns valid structure', () => {
    const a = registry.getExamAdapter('EXM-NEET-CHEM-SAMPLE');
    const c = a.loadBaseContent();
    expect(c.exam.id).toBe('EXM-NEET-CHEM-SAMPLE');
    expect(c.exam.code).toBe('NEET-CHEM-2026');
    expect(c.exam.total_marks).toBe(180);
    expect(c.mocks).toHaveLength(1);
    expect(c.mocks[0].questions.length).toBeGreaterThanOrEqual(9);
    expect(c.lessons).toEqual([]);
    expect(c.strategies.length).toBeGreaterThanOrEqual(3);
  });

  it('mock questions span all 3 sub-disciplines', () => {
    const a = registry.getExamAdapter('EXM-NEET-CHEM-SAMPLE');
    const questions = a.loadBaseContent().mocks[0].questions;
    const branches = new Set(questions.map((q: any) => q.branch));
    expect(branches).toEqual(new Set(['physical', 'organic', 'inorganic']));
  });

  it('topic weights distribute roughly equally across the 3 branches (~33% each)', () => {
    const a = registry.getExamAdapter('EXM-NEET-CHEM-SAMPLE');
    const weights = a.loadBaseContent().exam.topic_weights;
    let phys = 0, org = 0, inorg = 0;
    for (const [topic, w] of Object.entries(weights)) {
      if (topic.includes('mole-concept') || topic.includes('thermodynamics') ||
          topic.includes('equilibrium') || topic.includes('electrochemistry') ||
          topic.includes('kinetics') || topic.includes('solutions')) {
        phys += w as number;
      } else if (topic.includes('hydrocarbons') || topic.includes('haloalkanes') ||
                 topic.includes('alcohols') || topic.includes('biomolecules') ||
                 topic.includes('amines') || topic.includes('isomerism')) {
        org += w as number;
      } else {
        inorg += w as number;
      }
    }
    // Each branch within 0.25-0.40 (roughly 33% target with some give)
    for (const [name, w] of [['physical', phys], ['organic', org], ['inorganic', inorg]]) {
      expect(w).toBeGreaterThanOrEqual(0.25);
      expect(w).toBeLessThanOrEqual(0.40);
    }
  });

  it('all mock questions are single-correct MCQs', () => {
    const a = registry.getExamAdapter('EXM-NEET-CHEM-SAMPLE');
    const questions = a.loadBaseContent().mocks[0].questions;
    for (const q of questions) {
      expect(typeof q.correct_index).toBe('number');
      expect(q.options.length).toBe(4);
    }
  });

  it('postProcessSnapshot injects branch-balance note', () => {
    const a = registry.getExamAdapter('EXM-NEET-CHEM-SAMPLE');
    const out = a.postProcessSnapshot({ mocks: [] });
    expect(out._exam_day_notes).toBeDefined();
    expect(out._exam_day_notes.branch_balance).toMatch(/Physical.*Organic.*Inorganic|three sub-disciplines/i);
  });
});

// ─── VALIDATOR INTEGRATION ───────────────────────────────────────

describe('NEET PCB — prompt validator integration', () => {
  it('all three NEET subjects are whitelisted', async () => {
    const { getAllowedPromptPrefixes } = await import('../../../api/gemini-prompt-validator');
    expect(getAllowedPromptPrefixes('EXM-NEET-BIO-SAMPLE').length).toBeGreaterThanOrEqual(1);
    expect(getAllowedPromptPrefixes('EXM-NEET-PHYS-SAMPLE').length).toBeGreaterThanOrEqual(1);
    expect(getAllowedPromptPrefixes('EXM-NEET-CHEM-SAMPLE').length).toBeGreaterThanOrEqual(1);
  });

  it('NEET Physics student can use Physics prefix, not Biology or Chemistry', async () => {
    const { validateSystemPrompt } = await import('../../../api/gemini-prompt-validator');

    // Same-subject: ok
    expect(validateSystemPrompt(
      'You are GBrain, an expert NEET Physics tutor.',
      'EXM-NEET-PHYS-SAMPLE',
    ).ok).toBe(true);

    // Cross-subject within NEET: rejected
    expect(validateSystemPrompt(
      'You are GBrain, an expert NEET Biology tutor.',
      'EXM-NEET-PHYS-SAMPLE',
    ).ok).toBe(false);

    expect(validateSystemPrompt(
      'You are GBrain, an expert NEET Chemistry tutor.',
      'EXM-NEET-PHYS-SAMPLE',
    ).ok).toBe(false);
  });

  it('NEET Chemistry student can use Chemistry prefix, not Physics or Biology', async () => {
    const { validateSystemPrompt } = await import('../../../api/gemini-prompt-validator');

    expect(validateSystemPrompt(
      'You are GBrain, an expert NEET Chemistry tutor.',
      'EXM-NEET-CHEM-SAMPLE',
    ).ok).toBe(true);

    expect(validateSystemPrompt(
      'You are GBrain, an expert NEET Physics tutor.',
      'EXM-NEET-CHEM-SAMPLE',
    ).ok).toBe(false);

    expect(validateSystemPrompt(
      'You are GBrain, an expert NEET Biology tutor.',
      'EXM-NEET-CHEM-SAMPLE',
    ).ok).toBe(false);
  });
});
