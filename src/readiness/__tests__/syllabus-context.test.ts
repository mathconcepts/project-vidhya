/**
 * Tests for src/readiness/syllabus-context.ts — Wave 5 pure helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  inferPhase,
  weeksToExam,
  pctSyllabusCovered,
  armWeightsForPhase,
  eligibleNodes,
} from '../syllabus-context';
import type { CurriculumNode, CurriculumRepo, MasteryState, StudentModel } from '../../core/interfaces';

describe('inferPhase', () => {
  it('final-week when exam is 1 week or less out', () => {
    expect(inferPhase({ weeksToExam: 1, pctSyllabusCovered: 0.5 })).toBe('final-week');
    expect(inferPhase({ weeksToExam: 0, pctSyllabusCovered: 0.9 })).toBe('final-week');
  });

  it('crunch when 2-4 weeks out', () => {
    expect(inferPhase({ weeksToExam: 2, pctSyllabusCovered: 0.5 })).toBe('crunch');
    expect(inferPhase({ weeksToExam: 4, pctSyllabusCovered: 0.5 })).toBe('crunch');
  });

  it('mid when 5-8 weeks out', () => {
    expect(inferPhase({ weeksToExam: 5, pctSyllabusCovered: 0.5 })).toBe('mid');
    expect(inferPhase({ weeksToExam: 8, pctSyllabusCovered: 0.3 })).toBe('mid');
  });

  it('early when >8 weeks AND coverage < 60%', () => {
    expect(inferPhase({ weeksToExam: 12, pctSyllabusCovered: 0.4 })).toBe('early');
  });

  it('a well-prepared student >8 weeks out reads as mid, not early', () => {
    expect(inferPhase({ weeksToExam: 12, pctSyllabusCovered: 0.7 })).toBe('mid');
  });
});

describe('weeksToExam', () => {
  it('rounds up so 8 days reads as 2 weeks', () => {
    const now = new Date('2026-06-20T00:00:00Z');
    const exam = new Date('2026-06-28T00:00:00Z');     // 8 days out
    expect(weeksToExam(exam, now)).toBe(2);
  });

  it('returns 0 for past exam dates', () => {
    const now = new Date('2026-06-20T00:00:00Z');
    const past = new Date('2026-06-15T00:00:00Z');
    expect(weeksToExam(past, now)).toBe(0);
  });

  it('returns a large number when no exam date is set', () => {
    expect(weeksToExam(null)).toBeGreaterThan(100);
    expect(weeksToExam(undefined)).toBeGreaterThan(100);
  });
});

describe('pctSyllabusCovered', () => {
  it('returns 0 with no skills tracked', () => {
    expect(pctSyllabusCovered({ states: new Map() })).toBe(0);
  });

  it('gives full credit for mastered, half for practicing', () => {
    const states = new Map<string, MasteryState>([
      ['a', 'mastered'], ['b', 'mastered'],
      ['c', 'practicing'],
      ['d', 'learning'],
    ]);
    expect(pctSyllabusCovered({ states })).toBeCloseTo((2 + 0.5) / 4, 6);
  });

  it('caps at 1.0 even if accounting drifts (defensive)', () => {
    const states = new Map<string, MasteryState>([
      ['a', 'mastered'], ['b', 'mastered'],
    ]);
    expect(pctSyllabusCovered({ states })).toBe(1);
  });
});

describe('armWeightsForPhase', () => {
  it('early favors teach', () => {
    const w = armWeightsForPhase('early');
    expect(w.teach).toBeGreaterThan(w.retain);
    expect(w.teach).toBeGreaterThan(w.practice);
  });

  it('final-week favors retain', () => {
    const w = armWeightsForPhase('final-week');
    expect(w.retain).toBeGreaterThan(w.teach);
    expect(w.retain).toBeGreaterThan(w.practice);
  });

  it('crunch favors practice + retain over teach', () => {
    const w = armWeightsForPhase('crunch');
    expect(w.practice).toBeGreaterThan(w.teach);
    expect(w.retain).toBeGreaterThan(w.teach);
  });
});

describe('eligibleNodes', () => {
  const N = (id: string, prereqs: string[] = []): CurriculumNode => ({
    id, course: 'gate-ma', kind: 'concept', title: id, prereqs, examRelevance: 0.5,
  });

  const repo = (nodes: CurriculumNode[]): CurriculumRepo => ({
    async getNode(id) { return nodes.find(n => n.id === id) ?? null; },
    async prereqsOf() { return []; },
    async objectsForNode() { return []; },
  });

  const modelWith = (states: Record<string, MasteryState>): Pick<StudentModel, 'masteryState'> => ({
    async masteryState(_s, k) { return (states[k] ?? 'not-started') as MasteryState; },
  });

  it('passes a node with no prereqs', async () => {
    const r = await eligibleNodes(['n1'], 's', {
      curriculum: repo([N('n1')]),
      studentModel: modelWith({}),
    });
    expect(r).toEqual(['n1']);
  });

  it('blocks a node whose prereq is not-started', async () => {
    const r = await eligibleNodes(['calc2'], 's', {
      curriculum: repo([N('calc2', ['calc1'])]),
      studentModel: modelWith({}),
    });
    expect(r).toEqual([]);
  });

  it('blocks a node whose prereq is only at learning state', async () => {
    const r = await eligibleNodes(['calc2'], 's', {
      curriculum: repo([N('calc2', ['calc1'])]),
      studentModel: modelWith({ calc1: 'learning' }),
    });
    expect(r).toEqual([]);
  });

  it('unblocks once the prereq reaches practicing', async () => {
    const r = await eligibleNodes(['calc2'], 's', {
      curriculum: repo([N('calc2', ['calc1'])]),
      studentModel: modelWith({ calc1: 'practicing' }),
    });
    expect(r).toEqual(['calc2']);
  });

  it('filters a mixed list', async () => {
    const r = await eligibleNodes(['a', 'b', 'c'], 's', {
      curriculum: repo([
        N('a'),
        N('b', ['pre_b']),
        N('c', ['pre_c']),
      ]),
      studentModel: modelWith({ pre_b: 'mastered', pre_c: 'learning' }),
    });
    expect(r).toEqual(['a', 'b']);
  });
});
