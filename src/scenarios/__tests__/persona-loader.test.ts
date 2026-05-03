import { describe, it, expect } from 'vitest';
import { loadPersona, listPersonaIds, validatePersona } from '../persona-loader';

describe('persona-loader', () => {
  it('loads the locked priya persona with the expected seed', () => {
    const p = loadPersona('priya-cbse-12-anxious');
    expect(p.schema_version).toBe(1);
    expect(p.id).toBe('priya-cbse-12-anxious');
    expect(p.seed.representation_mode).toBe('geometric');
    expect(p.seed.motivation_state).toBe('anxious');
    expect(p.seed.knowledge_track_id).toBe('CBSE-12-MATH');
    expect(p.seed.recent_misconceptions).toContain('m_inverts_chain_rule');
    expect(p.answer_policy.type).toBe('scripted');
    expect(p.answer_policy.rules.length).toBeGreaterThan(0);
  });

  it('loads the locked arjun persona with driven motivation + algebraic mode', () => {
    const p = loadPersona('arjun-iit-driven');
    expect(p.seed.motivation_state).toBe('driven');
    expect(p.seed.representation_mode).toBe('algebraic');
  });

  it('listPersonaIds returns both locked personas (sorted)', () => {
    const ids = listPersonaIds();
    expect(ids).toContain('priya-cbse-12-anxious');
    expect(ids).toContain('arjun-iit-driven');
  });

  it('rejects an unknown schema_version', () => {
    expect(() =>
      validatePersona({ schema_version: 999 }, 'test'),
    ).toThrow(/schema_version/);
  });

  it('rejects an id with uppercase letters or spaces', () => {
    expect(() =>
      validatePersona(
        { schema_version: 1, id: 'Bad ID', display_name: 'x', description: '' },
        'test',
      ),
    ).toThrow(/id/);
  });

  it('rejects an out-of-range mastery value', () => {
    expect(() =>
      validatePersona(
        {
          schema_version: 1,
          id: 'p',
          display_name: 'P',
          description: '',
          seed: {
            representation_mode: 'balanced',
            motivation_state: 'steady',
            knowledge_track_id: 'CBSE-12-MATH',
            exam_id: 'jee-main',
            initial_mastery: { 'limits-jee': 1.5 },
            recent_misconceptions: [],
          },
          answer_policy: { type: 'scripted', rules: [] },
        },
        'test',
      ),
    ).toThrow(/mastery/);
  });

  it('rejects a non-scripted answer_policy.type', () => {
    expect(() =>
      validatePersona(
        {
          schema_version: 1,
          id: 'p',
          display_name: 'P',
          description: '',
          seed: {
            representation_mode: 'balanced',
            motivation_state: 'steady',
            knowledge_track_id: 'CBSE-12-MATH',
            exam_id: 'jee-main',
            initial_mastery: {},
            recent_misconceptions: [],
          },
          answer_policy: { type: 'llm-driven', rules: [] },
        },
        'test',
      ),
    ).toThrow(/scripted/);
  });
});
