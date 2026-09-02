import { describe, it, expect, beforeEach } from 'vitest';
import {
  ensureBuiltInPromptResourcesRegistered,
  resolvePromptResources,
  listPromptResources,
  __resetPromptRegistryModuleForTests,
} from '../index';
import { runPromptResourceContract } from '../contract';

describe('ensureBuiltInPromptResourcesRegistered', () => {
  beforeEach(() => __resetPromptRegistryModuleForTests());

  it('registers exactly the expected built-in resources, is idempotent', () => {
    ensureBuiltInPromptResourcesRegistered();
    const firstCount = listPromptResources().length;
    ensureBuiltInPromptResourcesRegistered(); // second call must be a no-op, not a duplicate-id throw
    expect(listPromptResources()).toHaveLength(firstCount);

    const ids = listPromptResources().map((r) => r.resource_id).sort();
    expect(ids).toEqual([
      'modifier.exam_timed',
      'modifier.hindi_glossary',
      'modifier.prerequisite_repair',
      'modifier.simple_words',
      'modifier.tone_register',
      'modifier.visual_first',
      'persona.student_context',
      'teach.pain_point_block',
      'teach.pedagogy_pattern_block',
      'teach.resonance_beat_block',
    ]);
  });

  it('re-registering after a test reset produces a fresh, fully-populated registry', () => {
    ensureBuiltInPromptResourcesRegistered();
    __resetPromptRegistryModuleForTests();
    expect(listPromptResources()).toHaveLength(0);
    ensureBuiltInPromptResourcesRegistered();
    expect(listPromptResources().length).toBeGreaterThan(0);
  });

  it('every released/pilot built-in resource passes its own contract', async () => {
    ensureBuiltInPromptResourcesRegistered();
    for (const r of listPromptResources()) {
      if (r.approval_state !== 'released' && r.approval_state !== 'pilot') continue;
      const result = await runPromptResourceContract(r);
      expect(result.ok, `${r.resource_id}: ${result.errors.join('; ')}`).toBe(true);
    }
  });
});

describe('teach.tone_register (modifier)', () => {
  beforeEach(() => __resetPromptRegistryModuleForTests());

  it('resolves for every topic and returns the same unconditional text', () => {
    ensureBuiltInPromptResourcesRegistered();
    const [resource] = resolvePromptResources('modifier', ['anything']).filter((r) => r.resource_id === 'modifier.tone_register');
    const output = resource.build({ concept_id: 'c', topic_family: 'anything', atom_type: 'hook' });
    expect(output).toContain('Indian English');
    expect(output).toContain('ELI5');
  });
});

describe('teach.resonance_beat_block (teaching_function)', () => {
  beforeEach(() => __resetPromptRegistryModuleForTests());

  it('gives nothing for a non-beat atom type', () => {
    ensureBuiltInPromptResourcesRegistered();
    const [resource] = resolvePromptResources('teaching_function', ['linear-algebra']).filter((r) => r.resource_id === 'teach.resonance_beat_block');
    expect(resource.build({ concept_id: 'eigenvalues', topic_family: 'linear-algebra', atom_type: 'common_traps', generation_context: 'batch' })).toBe('');
  });

  it('gives nothing for a hook atom under personalized generation_context', () => {
    ensureBuiltInPromptResourcesRegistered();
    const [resource] = resolvePromptResources('teaching_function', ['linear-algebra']).filter((r) => r.resource_id === 'teach.resonance_beat_block');
    expect(resource.build({ concept_id: 'eigenvalues', topic_family: 'linear-algebra', atom_type: 'hook', generation_context: 'personalized' })).toBe('');
  });

  it('gives the beat-scripting instruction for a hook atom in batch context', () => {
    ensureBuiltInPromptResourcesRegistered();
    const [resource] = resolvePromptResources('teaching_function', ['linear-algebra']).filter((r) => r.resource_id === 'teach.resonance_beat_block');
    const output = resource.build({ concept_id: 'eigenvalues', topic_family: 'linear-algebra', atom_type: 'hook', generation_context: 'batch' });
    expect(output).toContain('narration_steps');
    expect(output).toContain('trap');
  });
});

describe('persona.student_context', () => {
  beforeEach(() => __resetPromptRegistryModuleForTests());

  it('returns "" when student_context is absent', () => {
    ensureBuiltInPromptResourcesRegistered();
    const [resource] = resolvePromptResources('persona', ['*']).filter((r) => r.resource_id === 'persona.student_context');
    expect(resource.build({ concept_id: 'c', topic_family: 't', atom_type: 'hook' })).toBe('');
  });
});

describe('the 5 opt-in modifiers (visual_first / simple_words / exam_timed / prerequisite_repair / hindi_glossary)', () => {
  beforeEach(() => __resetPromptRegistryModuleForTests());

  const baseArgs = { concept_id: 'eigenvalues', topic_family: 'linear-algebra', atom_type: 'hook' as const };

  function resourceById(id: string) {
    ensureBuiltInPromptResourcesRegistered();
    const [r] = resolvePromptResources('modifier', ['linear-algebra']).filter((x) => x.resource_id === id);
    if (!r) throw new Error(`${id} did not resolve — check its approval_state`);
    return r;
  }

  it('all 5 are pilot (not draft, not released) — real but not yet usage-proven', () => {
    ensureBuiltInPromptResourcesRegistered();
    for (const id of ['modifier.visual_first', 'modifier.simple_words', 'modifier.exam_timed', 'modifier.prerequisite_repair', 'modifier.hindi_glossary']) {
      const r = listPromptResources().find((x) => x.resource_id === id);
      expect(r?.approval_state, id).toBe('pilot');
    }
  });

  it('every one of the 5 returns "" when not in active_modifiers (opt-in, not unconditional)', () => {
    for (const id of ['modifier.visual_first', 'modifier.simple_words', 'modifier.exam_timed', 'modifier.prerequisite_repair', 'modifier.hindi_glossary']) {
      const r = resourceById(id);
      expect(r.build({ ...baseArgs, active_modifiers: ['some.other.modifier'] }), id).toBe('');
      expect(r.build(baseArgs), id).toBe('');
    }
  });

  it('modifier.visual_first returns the visual-first directive when active', () => {
    const r = resourceById('modifier.visual_first');
    const out = r.build({ ...baseArgs, active_modifiers: ['modifier.visual_first'] });
    expect(out).toContain('visual');
    expect(out.toLowerCase()).toContain('before introducing symbolic notation');
  });

  it('modifier.simple_words returns the escalated-simplicity directive when active', () => {
    const r = resourceById('modifier.simple_words');
    const out = r.build({ ...baseArgs, active_modifiers: ['modifier.simple_words'] });
    expect(out).toContain('shortest word');
  });

  it('modifier.exam_timed returns the time-budget directive when active, and explicitly prohibits omitting a required condition', () => {
    const r = resourceById('modifier.exam_timed');
    const out = r.build({ ...baseArgs, active_modifiers: ['modifier.exam_timed'] });
    expect(out).toContain('target time');
    expect(out.toLowerCase()).toContain('without ever telling the student to skip a required condition');
  });

  it('modifier.prerequisite_repair refuses to fire without a real prerequisite_gap, even when active', () => {
    const r = resourceById('modifier.prerequisite_repair');
    expect(r.build({ ...baseArgs, active_modifiers: ['modifier.prerequisite_repair'] })).toBe('');
  });

  it('modifier.prerequisite_repair names the real gap concept when both active_modifiers and prerequisite_gap are present', () => {
    const r = resourceById('modifier.prerequisite_repair');
    const out = r.build({
      ...baseArgs,
      active_modifiers: ['modifier.prerequisite_repair'],
      prerequisite_gap: { concept_id: 'determinants', label: 'determinants' },
    });
    expect(out).toContain('determinants');
  });

  it('modifier.hindi_glossary returns real curated glosses when active, never a fabricated one', () => {
    const r = resourceById('modifier.hindi_glossary');
    const out = r.build({ ...baseArgs, active_modifiers: ['modifier.hindi_glossary'] });
    expect(out).toContain('eigenvalue');
    // The Devanagari gloss for "matrix" must be the curated one, not invented inline.
    expect(out).toContain('आव्यूह');
  });

  it('every one of the 5 passes its own contract at pilot state', async () => {
    ensureBuiltInPromptResourcesRegistered();
    const { runPromptResourceContract } = await import('../contract');
    for (const id of ['modifier.visual_first', 'modifier.simple_words', 'modifier.exam_timed', 'modifier.prerequisite_repair', 'modifier.hindi_glossary']) {
      const r = listPromptResources().find((x) => x.resource_id === id)!;
      const result = await runPromptResourceContract(r);
      expect(result.ok, `${id}: ${result.errors.join('; ')}`).toBe(true);
    }
  });
});
