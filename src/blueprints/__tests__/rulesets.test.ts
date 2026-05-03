import { describe, it, expect } from 'vitest';
import { rulesetsToConstraints, type BlueprintRuleset } from '../rulesets';

const RS = (id: string, rule_text: string): BlueprintRuleset => ({
  id,
  exam_pack_id: 'jee-main',
  concept_pattern: '%',
  rule_text,
  enabled: true,
  created_by: 'admin',
  created_at: '2026-05-03T00:00:00Z',
  updated_at: '2026-05-03T00:00:00Z',
});

describe('rulesetsToConstraints', () => {
  it('maps each ruleset to a constraint with source=ruleset', () => {
    const out = rulesetsToConstraints([RS('rs_1', 'rule one'), RS('rs_2', 'rule two')]);
    expect(out).toEqual([
      { id: 'rs_1', source: 'ruleset', note: 'rule one' },
      { id: 'rs_2', source: 'ruleset', note: 'rule two' },
    ]);
  });

  it('returns [] for empty input', () => {
    expect(rulesetsToConstraints([])).toEqual([]);
  });

  it('is pure (same input → same output)', () => {
    const input = [RS('rs_x', 'x')];
    const a = rulesetsToConstraints(input);
    const b = rulesetsToConstraints(input);
    expect(a).toEqual(b);
  });
});
