/**
 * Tests for src/teaching/motivation-aware-policy.ts — Wave 6.
 */

import { describe, it, expect } from 'vitest';
import { makeMotivationAwarePolicy } from '../motivation-aware-policy';
import { InMemoryMotivationSource } from '../motivation-source';
import type { CurriculumNode, LearningObject, TeachingPolicyContext } from '../../core/interfaces';

const NODE: CurriculumNode = {
  id: 'algebra', course: 'gate-ma', kind: 'skill',
  title: 'Algebra', prereqs: [], examRelevance: 0.5,
};

const OBJ = (id: string, type: LearningObject['type'], estMinutes = 3, difficulty = 1500): LearningObject => ({
  id, nodeId: 'algebra', type, difficulty, estMinutes, prereqs: [],
  verification: 'cas_passed', payload: {},
});

const CTX = (over: Partial<TeachingPolicyContext> = {}): TeachingPolicyContext => ({
  timeBudgetMin: 10,
  ...over,
});

describe('MotivationAwareTeachingPolicy', () => {
  it('a driven student gets a worked example first', async () => {
    const motivation = new InMemoryMotivationSource({ s1: 'driven' });
    const policy = makeMotivationAwarePolicy({ motivation });
    const r = await policy.selectObject('s1', NODE, [
      OBJ('s', 'story'),
      OBJ('w', 'worked_example'),
      OBJ('p', 'practice'),
    ], CTX());
    expect(r?.id).toBe('w');
  });

  it('a flagging student gets a story first', async () => {
    const motivation = new InMemoryMotivationSource({ s1: 'flagging' });
    const policy = makeMotivationAwarePolicy({ motivation });
    const r = await policy.selectObject('s1', NODE, [
      OBJ('w', 'worked_example'),
      OBJ('s', 'story'),
    ], CTX());
    expect(r?.id).toBe('s');
  });

  it('a frustrated student gets manim first', async () => {
    const motivation = new InMemoryMotivationSource({ s1: 'frustrated' });
    const policy = makeMotivationAwarePolicy({ motivation });
    const r = await policy.selectObject('s1', NODE, [
      OBJ('w', 'worked_example'),
      OBJ('m', 'manim'),
      OBJ('i', 'interactive'),
    ], CTX());
    expect(r?.id).toBe('m');
  });

  it('an anxious student gets worked_example, NEVER practice last-resort', async () => {
    const motivation = new InMemoryMotivationSource({ s1: 'anxious' });
    const policy = makeMotivationAwarePolicy({ motivation });
    const r = await policy.selectObject('s1', NODE, [
      OBJ('p', 'practice'),
      OBJ('w', 'worked_example'),
    ], CTX());
    expect(r?.id).toBe('w');
  });

  it('null motivation falls back to default ranking (worked_example first)', async () => {
    const motivation = new InMemoryMotivationSource();         // empty
    const policy = makeMotivationAwarePolicy({ motivation });
    const r = await policy.selectObject('s1', NODE, [
      OBJ('p', 'practice'),
      OBJ('s', 'story'),
      OBJ('w', 'worked_example'),
    ], CTX());
    expect(r?.id).toBe('w');
  });

  it('hasSeenWorkedExample demotes worked_example so a different modality wins', async () => {
    const motivation = new InMemoryMotivationSource({ s1: 'driven' });
    const policy = makeMotivationAwarePolicy({ motivation });
    const r = await policy.selectObject('s1', NODE, [
      OBJ('w', 'worked_example'),
      OBJ('p', 'practice'),
    ], CTX({ hasSeenWorkedExample: true }));
    expect(r?.id).toBe('p');
  });

  it('time-budget filter pushes oversize candidates out of the pool', async () => {
    const motivation = new InMemoryMotivationSource({ s1: 'driven' });
    const policy = makeMotivationAwarePolicy({ motivation });
    const r = await policy.selectObject('s1', NODE, [
      OBJ('w_long', 'worked_example', 20),       // doesn't fit a 5 min budget
      OBJ('p_short', 'practice', 3),
    ], CTX({ timeBudgetMin: 5 }));
    expect(r?.id).toBe('p_short');
  });

  it('falls back gracefully when nothing fits the time budget', async () => {
    const motivation = new InMemoryMotivationSource({ s1: 'driven' });
    const policy = makeMotivationAwarePolicy({ motivation });
    const r = await policy.selectObject('s1', NODE, [
      OBJ('w_long', 'worked_example', 30),
      OBJ('p_long', 'practice', 30),
    ], CTX({ timeBudgetMin: 5 }));
    expect(r).not.toBeNull();
    expect(['w_long', 'p_long']).toContain(r?.id);
  });

  it('within a chosen modality, picks the lowest difficulty', async () => {
    const motivation = new InMemoryMotivationSource({ s1: 'driven' });
    const policy = makeMotivationAwarePolicy({ motivation });
    const r = await policy.selectObject('s1', NODE, [
      OBJ('w_hard', 'worked_example', 3, 1900),
      OBJ('w_easy', 'worked_example', 3, 1300),
    ], CTX());
    expect(r?.id).toBe('w_easy');
  });

  it('returns null on empty candidate list', async () => {
    const motivation = new InMemoryMotivationSource({ s1: 'driven' });
    const policy = makeMotivationAwarePolicy({ motivation });
    const r = await policy.selectObject('s1', NODE, [], CTX());
    expect(r).toBeNull();
  });
});
