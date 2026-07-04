/**
 * Tests for src/curriculum/curriculum-repo.ts — ConceptGraphCurriculumRepo.
 */

import { describe, it, expect } from 'vitest';
import {
  ConceptGraphCurriculumRepo,
  makeConceptGraphCurriculumRepo,
  allTopicNodes,
  allConceptNodes,
  GATE_TOPIC_IDS,
  GATE_MA_COURSE,
} from '../curriculum-repo';
import { InMemoryCatalog } from '../../scoring/learning-object-catalog';
import { ALL_CONCEPTS } from '../../constants/concept-graph';
import type { LearningObject } from '../../core/interfaces';

describe('GATE_TOPIC_IDS', () => {
  it('returns exactly the 10 GATE Engineering Mathematics topics', () => {
    expect(GATE_TOPIC_IDS).toHaveLength(10);
    expect(new Set(GATE_TOPIC_IDS).size).toBe(10);
  });

  it('matches the topics derived from ALL_CONCEPTS', () => {
    const derived = new Set(ALL_CONCEPTS.map(c => c.topic));
    expect(new Set(GATE_TOPIC_IDS)).toEqual(derived);
  });
});

describe('allTopicNodes', () => {
  it('returns 10 CurriculumNode entries of kind exam_topic', () => {
    const nodes = allTopicNodes();
    expect(nodes).toHaveLength(10);
    for (const n of nodes) {
      expect(n.kind).toBe('exam_topic');
      expect(n.course).toBe(GATE_MA_COURSE);
      expect(n.prereqs).toEqual([]);
      expect(n.examRelevance).toBeGreaterThan(0);
      expect(n.examRelevance).toBeLessThanOrEqual(1);
    }
  });
});

describe('allConceptNodes', () => {
  it('returns one CurriculumNode per concept in the graph, kind skill', () => {
    const nodes = allConceptNodes();
    expect(nodes).toHaveLength(ALL_CONCEPTS.length);
    for (const n of nodes) expect(n.kind).toBe('skill');
  });

  it('preserves real prerequisite edges from the concept graph', () => {
    const nodes = allConceptNodes();
    const chainRule = nodes.find(n => n.id === 'chain-rule');
    expect(chainRule).toBeDefined();
    expect(chainRule!.prereqs).toContain('derivatives-basic');
  });
});

function emptyRepo(): ConceptGraphCurriculumRepo {
  return new ConceptGraphCurriculumRepo({ catalog: new InMemoryCatalog([]) });
}

describe('ConceptGraphCurriculumRepo.getNode', () => {
  it('resolves a concept id to a skill-kind node', async () => {
    const repo = emptyRepo();
    const node = await repo.getNode('eigenvalues');
    expect(node).not.toBeNull();
    expect(node!.kind).toBe('skill');
    expect(node!.title).toBe('Eigenvalues & Eigenvectors');
  });

  it('resolves a topic id to an exam_topic-kind node', async () => {
    const repo = emptyRepo();
    const node = await repo.getNode('linear-algebra');
    expect(node).not.toBeNull();
    expect(node!.kind).toBe('exam_topic');
  });

  it('returns null for an unknown id', async () => {
    const repo = emptyRepo();
    expect(await repo.getNode('not-a-real-concept')).toBeNull();
  });
});

describe('ConceptGraphCurriculumRepo.prereqsOf', () => {
  it('returns real prerequisite nodes for a concept with prereqs', async () => {
    const repo = emptyRepo();
    const prereqs = await repo.prereqsOf('chain-rule');
    expect(prereqs.map(p => p.id)).toContain('derivatives-basic');
  });

  it('returns an empty array for a root concept', async () => {
    const repo = emptyRepo();
    const prereqs = await repo.prereqsOf('matrix-operations');
    expect(prereqs).toEqual([]);
  });
});

describe('ConceptGraphCurriculumRepo.objectsForNode', () => {
  it('delegates to the injected catalog, scoped by skillId', async () => {
    const obj: LearningObject = {
      id: 'o1', nodeId: 'eigenvalues', type: 'practice',
      difficulty: 1500, estMinutes: 3, prereqs: [],
      verification: 'cas_passed', payload: { skillId: 'eigenvalues' },
    };
    const repo = makeConceptGraphCurriculumRepo({ catalog: new InMemoryCatalog([obj]) });
    const objs = await repo.objectsForNode('eigenvalues');
    expect(objs).toHaveLength(1);
    expect(objs[0].id).toBe('o1');
  });

  it('returns an empty array when the catalog is empty (DB-less)', async () => {
    const repo = emptyRepo();
    const objs = await repo.objectsForNode('eigenvalues');
    expect(objs).toEqual([]);
  });
});
