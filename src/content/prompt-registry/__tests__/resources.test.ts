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
