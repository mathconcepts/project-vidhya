/**
 * Tests for src/readiness/expected-score.ts — the headline metric math.
 */

import { describe, it, expect } from 'vitest';
import { computeExpectedScore, expectedShareFromRating, ELO_MID } from '../expected-score';
import type { CurriculumNode, LearningObject, StudentModel } from '../../core/interfaces';

const NODE_A: CurriculumNode = {
  id: 'algebra', course: 'gate-ma', kind: 'skill',
  title: 'Algebra', prereqs: [], examRelevance: 0.5,
};
const NODE_B: CurriculumNode = {
  id: 'calc', course: 'gate-ma', kind: 'skill',
  title: 'Calculus', prereqs: [], examRelevance: 1.0,
};

function studentAt(rating: number): Pick<StudentModel, 'abilityFor'> {
  return {
    async abilityFor() { return { rating, confidence: 0.8, n: 50 }; },
  };
}

function repoWith(nodes: CurriculumNode[], obj?: Partial<LearningObject>) {
  return {
    async getNode(id: string) { return nodes.find(n => n.id === id) ?? null; },
    async prereqsOf() { return []; },
    async objectsForNode() { return obj ? [{ ...defaultObj, ...obj }] : []; },
  };
}

const defaultObj: LearningObject = {
  id: 'o1', nodeId: 'x', type: 'practice',
  difficulty: 1500, estMinutes: 3, prereqs: [],
  verification: 'cas_passed', payload: { maxMarks: 6 },
};

describe('expectedShareFromRating', () => {
  it('returns 0.5 at the Elo midpoint', () => {
    expect(expectedShareFromRating(ELO_MID)).toBeCloseTo(0.5, 6);
  });

  it('is monotonic in rating', () => {
    expect(expectedShareFromRating(1400)).toBeLessThan(expectedShareFromRating(1500));
    expect(expectedShareFromRating(1500)).toBeLessThan(expectedShareFromRating(1600));
  });

  it('saturates near the extremes', () => {
    expect(expectedShareFromRating(2300)).toBeGreaterThan(0.95);
    expect(expectedShareFromRating(700)).toBeLessThan(0.05);
  });
});

describe('computeExpectedScore', () => {
  it('returns zeros when there are no nodes', async () => {
    const r = await computeExpectedScore('s', [], {
      studentModel: studentAt(1500),
      curriculum: repoWith([]),
    });
    expect(r.realized).toBe(0);
    expect(r.potential).toBe(0);
    expect(r.ratio).toBeNull();
  });

  it('reflects exam_relevance weighting', async () => {
    const r = await computeExpectedScore('s', ['algebra', 'calc'], {
      studentModel: studentAt(1500),                 // share = 0.5 everywhere
      curriculum: repoWith([NODE_A, NODE_B]),
    });
    // realised at midpoint = 0.5 * potential
    expect(r.ratio).toBeCloseTo(0.5, 6);
    // potential = 0.5*4 + 1.0*4 = 6
    expect(r.potential).toBeCloseTo(6, 6);
    expect(r.realized).toBeCloseTo(3, 6);
  });

  it('a stronger student realises more', async () => {
    const weak = await computeExpectedScore('s', ['algebra'], {
      studentModel: studentAt(1200), curriculum: repoWith([NODE_A]),
    });
    const strong = await computeExpectedScore('s', ['algebra'], {
      studentModel: studentAt(1800), curriculum: repoWith([NODE_A]),
    });
    expect(strong.realized).toBeGreaterThan(weak.realized);
    expect(weak.potential).toBeCloseTo(strong.potential);    // same items
  });

  it('reads maxMarks from a curriculum object when available', async () => {
    const r = await computeExpectedScore('s', ['algebra'], {
      studentModel: studentAt(1500),
      curriculum: repoWith([NODE_A], { payload: { maxMarks: 10 } }),
    });
    // potential = 0.5 (relevance) * 10 (maxMarks) = 5
    expect(r.potential).toBeCloseTo(5, 6);
  });

  it('skips unknown nodes silently', async () => {
    const r = await computeExpectedScore('s', ['algebra', 'unknown'], {
      studentModel: studentAt(1500),
      curriculum: repoWith([NODE_A]),
    });
    expect(r.byNode).toHaveLength(1);
  });

  it('filters by course when supplied', async () => {
    const otherCourse: CurriculumNode = { ...NODE_B, id: 'foreign', course: 'jee-main' };
    const r = await computeExpectedScore('s', ['algebra', 'foreign'], {
      studentModel: studentAt(1500),
      curriculum: repoWith([NODE_A, otherCourse]),
      course: 'gate-ma',
    });
    expect(r.byNode.map(b => b.nodeId)).toEqual(['algebra']);
  });
});
