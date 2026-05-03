import { describe, it, expect } from 'vitest';
import { listPresets, getPreset, __testing } from '../presets';
import { validateDecisions } from '../validator';
import { buildTemplateBlueprint } from '../template-engine';

describe('PRESETS — locked v1 library', () => {
  it('contains at least the JEE-Main TN-anxious preset', () => {
    const ids = listPresets().map((p) => p.id);
    expect(ids).toContain('jee-main-tn-anxious');
  });

  it('every preset has a non-empty name + exam_pack_id + at least one ruleset and one blueprint', () => {
    for (const p of __testing.PRESETS) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.exam_pack_id.length).toBeGreaterThan(0);
      expect(p.rulesets.length).toBeGreaterThan(0);
      expect(p.blueprints.length).toBeGreaterThan(0);
    }
  });

  it('every preset blueprint resolves to a structurally-valid template blueprint', () => {
    for (const p of __testing.PRESETS) {
      for (const spec of p.blueprints) {
        const decisions = buildTemplateBlueprint({
          concept_id: spec.concept_id,
          exam_pack_id: p.exam_pack_id,
          target_difficulty: spec.target_difficulty,
          topic_family: spec.topic_family,
          requires_pyq_anchor: spec.requires_pyq_anchor,
        });
        const v = validateDecisions(decisions);
        expect(v.ok, `${p.id}/${spec.concept_id}: ${v.errors.map((e) => e.path).join(',')}`).toBe(true);
      }
    }
  });

  it('preset rulesets are all under 2000 chars (matches createRuleset bound)', () => {
    for (const p of __testing.PRESETS) {
      for (const rule of p.rulesets) {
        expect(rule.rule_text.length).toBeLessThan(2000);
      }
    }
  });

  it('preset rule_text contains no surveillance-y substrings', () => {
    const FORBIDDEN = /\b(user_id|session_id|student_id|tracked_|behavior_)/i;
    for (const p of __testing.PRESETS) {
      for (const rule of p.rulesets) {
        expect(FORBIDDEN.test(rule.rule_text)).toBe(false);
      }
    }
  });

  it('getPreset returns null for unknown id', () => {
    expect(getPreset('not-a-real-preset')).toBeNull();
  });

  it('getPreset returns the descriptor for the locked TN-anxious preset', () => {
    const p = getPreset('jee-main-tn-anxious');
    expect(p).not.toBeNull();
    expect(p!.exam_pack_id).toBe('jee-main');
    expect(p!.rulesets.length).toBeGreaterThanOrEqual(4);
  });
});
