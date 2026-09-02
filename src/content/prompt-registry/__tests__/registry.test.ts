import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerPromptResource,
  resolvePromptResources,
  listPromptResources,
  getPromptResource,
  __resetPromptResourceRegistryForTests,
} from '../registry';
import type { PromptResource } from '../types';

function makeResource(overrides: Partial<PromptResource> = {}): PromptResource {
  return {
    resource_id: 'test.resource',
    version: '1.0.0',
    category: 'teaching_function',
    topics: ['*'],
    required_inputs: [],
    outputs: [],
    approval_state: 'released',
    evidence_requirements: [],
    compatibility: [],
    rollback_target: null,
    test_fixtures: ['fixture-1'],
    build: () => 'built',
    ...overrides,
  };
}

describe('registerPromptResource', () => {
  beforeEach(() => __resetPromptResourceRegistryForTests());

  it('registers a resource retrievable by id', () => {
    registerPromptResource(makeResource());
    expect(getPromptResource('test.resource')?.resource_id).toBe('test.resource');
  });

  it('throws on a duplicate resource_id', () => {
    registerPromptResource(makeResource());
    expect(() => registerPromptResource(makeResource())).toThrow(/duplicate resource_id/);
  });

  it('listPromptResources returns everything registered, any state', () => {
    registerPromptResource(makeResource({ resource_id: 'a', approval_state: 'draft' }));
    registerPromptResource(makeResource({ resource_id: 'b', approval_state: 'blocked' }));
    expect(listPromptResources().map((r) => r.resource_id).sort()).toEqual(['a', 'b']);
  });
});

describe('resolvePromptResources', () => {
  beforeEach(() => __resetPromptResourceRegistryForTests());

  it('returns released and pilot resources for a matching topic', () => {
    registerPromptResource(makeResource({ resource_id: 'released-one', approval_state: 'released', topics: ['linear-algebra'] }));
    registerPromptResource(makeResource({ resource_id: 'pilot-one', approval_state: 'pilot', topics: ['linear-algebra'] }));
    const found = resolvePromptResources('teaching_function', ['linear-algebra']).map((r) => r.resource_id).sort();
    expect(found).toEqual(['pilot-one', 'released-one']);
  });

  it('never returns draft, benchmarked, deprecated, or blocked resources', () => {
    for (const approval_state of ['draft', 'benchmarked', 'deprecated', 'blocked'] as const) {
      __resetPromptResourceRegistryForTests();
      registerPromptResource(makeResource({ resource_id: `x-${approval_state}`, approval_state, topics: ['*'] }));
      expect(resolvePromptResources('teaching_function', ['anything'])).toHaveLength(0);
    }
  });

  it('a resource with topics ["*"] matches every topic', () => {
    registerPromptResource(makeResource({ resource_id: 'wildcard', topics: ['*'] }));
    expect(resolvePromptResources('teaching_function', ['some-unrelated-topic'])).toHaveLength(1);
  });

  it('a topic-scoped resource does not resolve for a non-matching topic', () => {
    registerPromptResource(makeResource({ resource_id: 'scoped', topics: ['calculus'] }));
    expect(resolvePromptResources('teaching_function', ['linear-algebra'])).toHaveLength(0);
  });

  it('filters by category — a modifier never resolves as a teaching_function', () => {
    registerPromptResource(makeResource({ resource_id: 'a-modifier', category: 'modifier', topics: ['*'] }));
    expect(resolvePromptResources('teaching_function', ['*'])).toHaveLength(0);
    expect(resolvePromptResources('modifier', ['*'])).toHaveLength(1);
  });
});
