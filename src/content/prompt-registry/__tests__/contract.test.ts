import { describe, it, expect } from 'vitest';
import { runPromptResourceContract } from '../contract';
import type { PromptResource } from '../types';

function makeResource(overrides: Partial<PromptResource> = {}): PromptResource {
  return {
    resource_id: 'test.resource',
    version: '1.0.0',
    category: 'teaching_function',
    topics: ['linear-algebra'],
    required_inputs: [],
    outputs: [],
    approval_state: 'released',
    evidence_requirements: [],
    compatibility: [],
    rollback_target: null,
    test_fixtures: ['fixture-1'],
    build: (args) => (args.topic_family === 'linear-algebra' ? 'built' : ''),
    ...overrides,
  };
}

describe('runPromptResourceContract', () => {
  it('passes a well-formed released resource with fixtures and correct topic scoping', async () => {
    const result = await runPromptResourceContract(makeResource());
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails a released resource with zero test_fixtures', async () => {
    const result = await runPromptResourceContract(makeResource({ test_fixtures: [] }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /test_fixture/.test(e))).toBe(true);
  });

  it('fails a resource whose build() throws on a synthetic call', async () => {
    const result = await runPromptResourceContract(makeResource({ build: () => { throw new Error('boom'); } }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /threw/.test(e))).toBe(true);
  });

  it('fails a topic-scoped resource that leaks output for an out-of-scope topic', async () => {
    const leaky = makeResource({ build: () => 'always returns something' });
    const result = await runPromptResourceContract(leaky);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /outside its declared/.test(e))).toBe(true);
  });

  it('does not run the leakage check for a wildcard-topic resource', async () => {
    const wildcard = makeResource({ topics: ['*'], build: () => 'always something' });
    const result = await runPromptResourceContract(wildcard);
    expect(result.ok).toBe(true);
  });

  it('a draft resource with zero test_fixtures still passes (only released/pilot require fixtures)', async () => {
    const draft = makeResource({ approval_state: 'draft', test_fixtures: [], build: () => { throw new Error('not implemented'); } });
    // build() still must not throw on the synthetic contract call even in draft —
    // a resource that intentionally throws (like this repo's draftModifier
    // stubs) is expected to FAIL the contract until it has a real build(),
    // which is exactly why draft modifiers never get promoted to released.
    const result = await runPromptResourceContract(draft);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /threw/.test(e))).toBe(true);
  });
});
