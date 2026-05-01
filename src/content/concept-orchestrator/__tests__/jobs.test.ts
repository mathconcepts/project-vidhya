/**
 * jobs registry — in-memory job state with TTL.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createJob,
  getJob,
  recordProgress,
  recordResult,
  recordFailure,
  _resetJobsForTests,
  _jobCountForTests,
} from '../jobs';

describe('jobs registry', () => {
  beforeEach(() => _resetJobsForTests());

  it('createJob assigns a unique id and queued status', () => {
    const a = createJob('calc.x', 'calculus');
    const b = createJob('calc.y', 'calculus');
    expect(a.id).not.toBe(b.id);
    expect(a.status).toBe('queued');
    expect(_jobCountForTests()).toBe(2);
  });

  it('getJob returns the registered job', () => {
    const j = createJob('calc.x', 'calculus');
    expect(getJob(j.id)).toBe(j);
  });

  it('returns null for unknown id', () => {
    expect(getJob('nope')).toBeNull();
  });

  it('recordProgress appends events and updates status', () => {
    const j = createJob('calc.x', 'calculus');
    recordProgress(j.id, { type: 'start', step_index: 0, total_steps: 11 });
    expect(j.events).toHaveLength(1);
    expect(j.status).toBe('running');
    recordProgress(j.id, { type: 'atom_finished', step_index: 0, total_steps: 11, atom_type: 'hook' });
    expect(j.events).toHaveLength(2);
    recordProgress(j.id, { type: 'done', step_index: 11, total_steps: 11 });
    expect(j.status).toBe('done');
  });

  it('recordResult sets done + result', () => {
    const j = createJob('calc.x', 'calculus');
    recordResult(j.id, {
      concept_id: 'calc.x',
      topic_family: 'calculus',
      generated_at: 'now',
      total_cost_usd: 0.15,
      atoms: [],
      rejected_atoms: [],
    } as any);
    expect(j.status).toBe('done');
    expect(j.result?.total_cost_usd).toBe(0.15);
  });

  it('recordFailure sets failed + error', () => {
    const j = createJob('calc.x', 'calculus');
    recordFailure(j.id, 'something broke');
    expect(j.status).toBe('failed');
    expect(j.error).toBe('something broke');
  });

  it('events accumulate in order', () => {
    const j = createJob('x', 'y');
    recordProgress(j.id, { type: 'atom_started', step_index: 0, total_steps: 2, atom_type: 'hook' });
    recordProgress(j.id, { type: 'atom_finished', step_index: 0, total_steps: 2, atom_type: 'hook', judge_score: 8 });
    recordProgress(j.id, { type: 'atom_started', step_index: 1, total_steps: 2, atom_type: 'intuition' });
    expect(j.events.map((e) => e.type)).toEqual(['atom_started', 'atom_finished', 'atom_started']);
  });
});
