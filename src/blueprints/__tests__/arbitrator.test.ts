import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  proposeBlueprint,
  applyOverlay,
  buildJudgePrompt,
  parseJudgeOutput,
  type LlmJudgeOutput,
} from '../arbitrator';
import { buildTemplateBlueprint } from '../template-engine';

describe('proposeBlueprint — judge disabled', () => {
  let prev: string | undefined;
  beforeEach(() => { prev = process.env.VIDHYA_BLUEPRINT_LLM_JUDGE; delete process.env.VIDHYA_BLUEPRINT_LLM_JUDGE; });
  afterEach(() => { if (prev !== undefined) process.env.VIDHYA_BLUEPRINT_LLM_JUDGE = prev; });

  it('returns the template baseline with TEMPLATE_CONFIDENCE when no judge supplied + flag off', async () => {
    const r = await proposeBlueprint({
      concept_id: 'limits-jee',
      exam_pack_id: 'jee-main',
      target_difficulty: 'medium',
      topic_family: 'calculus',
    });
    expect(r.confidence).toBe(0.6);
    expect(r.llm_judge_status).toBe('disabled');
    expect(r.requires_review).toBe(true); // 0.6 < default 0.7 threshold
    expect(r.decisions).toEqual(buildTemplateBlueprint({
      concept_id: 'limits-jee', exam_pack_id: 'jee-main', target_difficulty: 'medium', topic_family: 'calculus',
    }));
  });
});

describe('proposeBlueprint — injected judge', () => {
  it('overlays a valid judge response and bumps confidence to 0.85', async () => {
    const judge = vi.fn(async (): Promise<LlmJudgeOutput> => ({
      stage_overrides: { intuition: { atom_kind: 'simulation', rationale_id: 'concept_is_geometric', rationale_note: 'Plot the slope as h shrinks.' } },
      override_summary: 'Overall: prefer dynamic over static visuals for limits.',
    }));
    const r = await proposeBlueprint({
      concept_id: 'limits-jee', exam_pack_id: 'jee-main', target_difficulty: 'medium', topic_family: 'calculus',
      llmJudge: judge,
    });
    expect(r.llm_judge_status).toBe('invoked_ok');
    expect(r.confidence).toBe(0.85);
    expect(r.requires_review).toBe(false);
    const intuition = r.decisions.stages.find((s) => s.id === 'intuition')!;
    expect(intuition.atom_kind).toBe('simulation');
    expect(intuition.rationale_note).toBe('Plot the slope as h shrinks.');
    expect(judge).toHaveBeenCalledOnce();
  });

  it('falls back to template when judge returns null', async () => {
    const r = await proposeBlueprint({
      concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium',
      llmJudge: async () => null,
    });
    expect(r.llm_judge_status).toBe('no_change');
    expect(r.confidence).toBe(0.6);
  });

  it('falls back to template when judge throws', async () => {
    const r = await proposeBlueprint({
      concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium',
      llmJudge: async () => { throw new Error('boom'); },
    });
    expect(r.llm_judge_status).toBe('invoked_failed');
    expect(r.confidence).toBe(0.6);
  });

  it('falls back to template when judge produces an invalid blueprint', async () => {
    const r = await proposeBlueprint({
      concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium',
      llmJudge: async () => ({
        stage_overrides: { intuition: { atom_kind: 'pep_talk' as any } },
      }),
    });
    expect(r.llm_judge_status).toBe('invoked_invalid');
    expect(r.confidence).toBe(0.6);
  });

  it('respects VIDHYA_BLUEPRINT_REVIEW_THRESHOLD env var', async () => {
    process.env.VIDHYA_BLUEPRINT_REVIEW_THRESHOLD = '0.5';
    try {
      const r = await proposeBlueprint({
        concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'medium',
      });
      // confidence 0.6, threshold 0.5 → no review needed
      expect(r.requires_review).toBe(false);
    } finally {
      delete process.env.VIDHYA_BLUEPRINT_REVIEW_THRESHOLD;
    }
  });
});

describe('applyOverlay', () => {
  const baseline = buildTemplateBlueprint({
    concept_id: 'limits-jee', exam_pack_id: 'jee-main', target_difficulty: 'medium', topic_family: 'calculus',
  });

  it('does not mutate the baseline', () => {
    const baselineCopy = JSON.parse(JSON.stringify(baseline));
    applyOverlay(baseline, { stage_overrides: { intuition: { atom_kind: 'simulation' } } });
    expect(baseline).toEqual(baselineCopy);
  });

  it('preserves stage order even when only some are overridden', () => {
    const out = applyOverlay(baseline, { stage_overrides: { practice: { rationale_note: 'x' } } });
    expect(out.stages.map((s) => s.id)).toEqual(baseline.stages.map((s) => s.id));
  });

  it('attaches override_summary to the first stage when no per-stage note exists', () => {
    const out = applyOverlay(baseline, { override_summary: 'top-level rationale' });
    expect(out.stages[0].rationale_note).toBe('top-level rationale');
  });

  it('per-stage rationale_note wins over override_summary on the first stage', () => {
    const out = applyOverlay(baseline, {
      stage_overrides: { intuition: { rationale_note: 'specific' } },
      override_summary: 'general',
    });
    expect(out.stages[0].rationale_note).toBe('specific');
  });
});

describe('buildJudgePrompt', () => {
  it('embeds the template blueprint as JSON', () => {
    const baseline = buildTemplateBlueprint({ concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'easy' });
    const prompt = buildJudgePrompt({
      concept_id: 'x', exam_pack_id: 'p', target_difficulty: 'easy', topic_family: undefined,
      template_blueprint: baseline,
    });
    expect(prompt).toContain('Template baseline:');
    expect(prompt).toContain('"version": 1');
    expect(prompt).toContain('only override if you have a strong pedagogical reason');
  });
});

describe('parseJudgeOutput', () => {
  it('parses raw JSON', () => {
    const out = parseJudgeOutput('{"stage_overrides":{"intuition":{"atom_kind":"simulation"}}}');
    expect(out?.stage_overrides?.intuition?.atom_kind).toBe('simulation');
  });

  it('parses code-fenced JSON with prose preamble', () => {
    const raw = "Here's my decision:\n```json\n{\"stage_overrides\": {}}\n```\nThanks.";
    const out = parseJudgeOutput(raw);
    expect(out).not.toBeNull();
  });

  it('returns null on malformed responses', () => {
    expect(parseJudgeOutput('not json')).toBeNull();
    expect(parseJudgeOutput('')).toBeNull();
  });
});
