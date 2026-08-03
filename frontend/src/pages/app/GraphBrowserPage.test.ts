/**
 * Unit tests for GraphBrowserPage's pure derivation logic (topic
 * grouping, frequency/DAG-health tones). The interactive parts (fetching
 * the summary, the topic/exam pickers) are exercised manually / by the
 * backend's own admin-graph-routes.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { __testing } from './GraphBrowserPage';
import type { ConceptSummary } from '@/api/admin/graph';

const { groupByTopic, frequencyTone, dagHealthTone } = __testing;

function concept(overrides: Partial<ConceptSummary> = {}): ConceptSummary {
  return {
    id: 'c1',
    topic: 'linear-algebra',
    label: 'Concept',
    difficulty_base: 0.5,
    gate_frequency: 'medium',
    prerequisites: [],
    ...overrides,
  };
}

describe('GraphBrowserPage.groupByTopic', () => {
  it('groups concepts by topic and sorts topics alphabetically', () => {
    const concepts = [
      concept({ id: 'z1', topic: 'zeta' }),
      concept({ id: 'a1', topic: 'alpha' }),
      concept({ id: 'a2', topic: 'alpha' }),
    ];
    const grouped = groupByTopic(concepts);
    expect(grouped.map((g) => g.topic)).toEqual(['alpha', 'zeta']);
    expect(grouped[0].concepts).toHaveLength(2);
  });

  it('sorts concepts within a topic by id', () => {
    const concepts = [
      concept({ id: 'b', topic: 'x' }),
      concept({ id: 'a', topic: 'x' }),
    ];
    const grouped = groupByTopic(concepts);
    expect(grouped[0].concepts.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('returns an empty array for no concepts', () => {
    expect(groupByTopic([])).toEqual([]);
  });
});

describe('GraphBrowserPage.frequencyTone', () => {
  it('maps high to good, medium to neutral, low/rare to warn', () => {
    expect(frequencyTone('high')).toBe('good');
    expect(frequencyTone('medium')).toBe('neutral');
    expect(frequencyTone('low')).toBe('warn');
    expect(frequencyTone('rare')).toBe('warn');
  });
});

describe('GraphBrowserPage.dagHealthTone', () => {
  it('is neutral before the summary loads', () => {
    expect(dagHealthTone(null)).toBe('neutral');
  });

  it('is good when the DAG is clean', () => {
    expect(dagHealthTone({ ok: true, cycle: null })).toBe('good');
  });

  it('is bad when a cycle is present', () => {
    expect(dagHealthTone({ ok: false, cycle: ['a', 'b', 'a'] })).toBe('bad');
  });
});
