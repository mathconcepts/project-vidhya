/**
 * The gate has one declaring pack to look at today (gate-ma), so a test that
 * only ran the live path would never exercise the failing branch. That is the
 * exact shape of bug that let LM_SPEC's +/-45 degree eigenvectors hide a
 * broken eigen-highlight for months. These drive the pure collision finder
 * with synthetic claims so the red path is proven, not assumed.
 */
import { describe, it, expect } from 'vitest';
import {
  findTopicCollisions,
  collectTopicClaims,
  type TopicClaim,
} from '../topic-namespace';

const claim = (topic: string, exam_id: string, ids: string[] = ['x']): TopicClaim => ({
  topic,
  exam_id,
  concept_ids: ids,
});

describe('findTopicCollisions', () => {
  it('reports nothing when every topic belongs to exactly one pack', () => {
    expect(
      findTopicCollisions([claim('calculus', 'gate-ma'), claim('jee-calculus', 'jee-main')]),
    ).toEqual([]);
  });

  it('reports a topic string claimed by two packs, naming both', () => {
    const collisions = findTopicCollisions([
      claim('calculus', 'gate-ma', ['limits', 'derivatives-basic']),
      claim('calculus', 'jee-main', ['limits-jee']),
    ]);
    expect(collisions).toHaveLength(1);
    const [topic, cs] = collisions[0];
    expect(topic).toBe('calculus');
    expect(cs.map((c) => c.exam_id).sort()).toEqual(['gate-ma', 'jee-main']);
  });

  it('does not treat one pack owning many topics as a collision', () => {
    expect(
      findTopicCollisions([
        claim('calculus', 'gate-ma'),
        claim('linear-algebra', 'gate-ma'),
        claim('graph-theory', 'gate-ma'),
      ]),
    ).toEqual([]);
  });

  it('reports every colliding topic, not just the first', () => {
    const collisions = findTopicCollisions([
      claim('calculus', 'gate-ma'),
      claim('calculus', 'jee-main'),
      claim('probability-statistics', 'gate-ma'),
      claim('probability-statistics', 'jee-main'),
    ]);
    expect(collisions.map(([t]) => t).sort()).toEqual(['calculus', 'probability-statistics']);
  });

  it('catches a three-way collision as one entry naming all three packs', () => {
    const collisions = findTopicCollisions([
      claim('calculus', 'gate-ma'),
      claim('calculus', 'jee-main'),
      claim('calculus', 'bitsat'),
    ]);
    expect(collisions).toHaveLength(1);
    expect(collisions[0][1]).toHaveLength(3);
  });
});

describe('collectTopicClaims against the real concept graph', () => {
  it('is currently collision-free', () => {
    expect(findTopicCollisions(collectTopicClaims())).toEqual([]);
  });

  it('attributes every claim to a pack, with at least one concept behind it', () => {
    const claims = collectTopicClaims();
    expect(claims.length).toBeGreaterThan(0);
    for (const c of claims) {
      expect(c.exam_id).toBeTruthy();
      expect(c.concept_ids.length).toBeGreaterThan(0);
    }
  });
});
