/**
 * Tests for src/readiness/content-gate.ts — U1-5's "LA-chain on-ramp"
 * pure logic: a prerequisite redirect fires only when every node in the
 * unmet-prereq chain has real explainer content.
 */

import { describe, it, expect } from 'vitest';
import { findPrereqRedirect, findFirstPrereqRedirect, type ContentExistenceChecker } from '../content-gate';
import type { CurriculumNode, CurriculumRepo, MasteryState, StudentModel } from '../../core/interfaces';

const N = (id: string, prereqs: string[] = []): CurriculumNode => ({
  id, course: 'gate-ma', kind: 'skill', title: id, prereqs, examRelevance: 0.5,
});

const repoOf = (nodes: CurriculumNode[]): CurriculumRepo => ({
  async getNode(id) { return nodes.find(n => n.id === id) ?? null; },
  async prereqsOf() { return []; },
  async objectsForNode() { return []; },
});

const modelWith = (states: Record<string, MasteryState>): Pick<StudentModel, 'masteryState'> => ({
  async masteryState(_s, k) { return (states[k] ?? 'not-started') as MasteryState; },
});

/** A checker backed by a plain allowlist — the test-friendly fake. */
const contentAllowing = (ids: string[]): ContentExistenceChecker => ({
  async hasContent(id) { return ids.includes(id); },
});

describe('findPrereqRedirect', () => {
  it('returns null when the node has no unmet prereqs (no gap at all)', async () => {
    const redirect = await findPrereqRedirect('eigenvalues', 's', {
      curriculum: repoOf([N('eigenvalues', ['determinants'])]),
      studentModel: modelWith({ determinants: 'mastered' }),
      content: contentAllowing(['determinants']),
    });
    expect(redirect).toBeNull();
  });

  it('fires when the single unmet prereq is content-backed', async () => {
    const redirect = await findPrereqRedirect('eigenvalues', 's', {
      curriculum: repoOf([
        N('eigenvalues', ['determinants']),
        N('determinants', ['matrix-operations']),
        N('matrix-operations'),
      ]),
      studentModel: modelWith({ determinants: 'not-started', 'matrix-operations': 'mastered' }),
      content: contentAllowing(['determinants']),
    });
    expect(redirect).not.toBeNull();
    expect(redirect!.redirectTo).toBe('determinants');
    expect(redirect!.chain).toEqual(['determinants']);
    expect(redirect!.originalNodeId).toBe('eigenvalues');
  });

  it('walks the FULL chain back to the mastered boundary, foundational-first', async () => {
    // eigenvalues <- determinants <- matrix-operations (both unmet)
    const redirect = await findPrereqRedirect('eigenvalues', 's', {
      curriculum: repoOf([
        N('eigenvalues', ['determinants']),
        N('determinants', ['matrix-operations']),
        N('matrix-operations'),
      ]),
      studentModel: modelWith({ determinants: 'learning', 'matrix-operations': 'not-started' }),
      content: contentAllowing(['determinants', 'matrix-operations']),
    });
    expect(redirect).not.toBeNull();
    // foundational-first: matrix-operations (the true entry point) before determinants
    expect(redirect!.chain).toEqual(['matrix-operations', 'determinants']);
    expect(redirect!.redirectTo).toBe('matrix-operations');
  });

  it('suppresses the WHOLE redirect when exactly one link in the chain lacks content (never partial)', async () => {
    const redirect = await findPrereqRedirect('eigenvalues', 's', {
      curriculum: repoOf([
        N('eigenvalues', ['determinants']),
        N('determinants', ['matrix-operations']),
        N('matrix-operations'),
      ]),
      studentModel: modelWith({ determinants: 'learning', 'matrix-operations': 'not-started' }),
      // matrix-operations has NO content — the whole chain must be
      // rejected, not just that one node.
      content: contentAllowing(['determinants']),
    });
    expect(redirect).toBeNull();
  });

  it('treats a content checker that throws as "no content" (fail closed, never fabricate)', async () => {
    const throwingChecker: ContentExistenceChecker = {
      async hasContent() { throw new Error('disk read failed'); },
    };
    const redirect = await findPrereqRedirect('eigenvalues', 's', {
      curriculum: repoOf([N('eigenvalues', ['determinants']), N('determinants')]),
      studentModel: modelWith({ determinants: 'not-started' }),
      content: throwingChecker,
    });
    expect(redirect).toBeNull();
  });

  it('does not revisit a shared prerequisite twice in a diamond-shaped graph', async () => {
    // target -> [b, c], b -> [d], c -> [d]. d must appear once, before b and c.
    const redirect = await findPrereqRedirect('target', 's', {
      curriculum: repoOf([
        N('target', ['b', 'c']),
        N('b', ['d']),
        N('c', ['d']),
        N('d'),
      ]),
      studentModel: modelWith({ b: 'not-started', c: 'not-started', d: 'learning' }),
      content: contentAllowing(['b', 'c', 'd']),
    });
    expect(redirect).not.toBeNull();
    expect(redirect!.chain.filter(id => id === 'd')).toHaveLength(1);
    expect(redirect!.chain.indexOf('d')).toBeLessThan(redirect!.chain.indexOf('b'));
    expect(redirect!.chain.indexOf('d')).toBeLessThan(redirect!.chain.indexOf('c'));
  });
});

describe('findFirstPrereqRedirect', () => {
  it('returns the first candidate whose chain is fully content-backed', async () => {
    const deps = {
      curriculum: repoOf([
        N('topicA-concept', ['topicA-prereq']),
        N('topicA-prereq'),
        N('la-concept', ['la-prereq']),
        N('la-prereq'),
      ]),
      studentModel: modelWith({ 'topicA-prereq': 'not-started', 'la-prereq': 'not-started' }),
      content: contentAllowing(['la-prereq']), // only the LA-side prereq has real content
    };
    const redirect = await findFirstPrereqRedirect(['topicA-concept', 'la-concept'], 's', deps);
    expect(redirect).not.toBeNull();
    expect(redirect!.originalNodeId).toBe('la-concept');
    expect(redirect!.redirectTo).toBe('la-prereq');
  });

  it('returns null when none of the candidates has a content-backed chain', async () => {
    const deps = {
      curriculum: repoOf([N('a', ['pre-a']), N('pre-a')]),
      studentModel: modelWith({ 'pre-a': 'not-started' }),
      content: contentAllowing([]), // nothing has content
    };
    const redirect = await findFirstPrereqRedirect(['a'], 's', deps);
    expect(redirect).toBeNull();
  });
});
