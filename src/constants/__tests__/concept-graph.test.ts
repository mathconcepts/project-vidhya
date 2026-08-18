/**
 * Tests for src/constants/concept-graph.ts — the thin loader over
 * data/curriculum/gate-ma.yml's `concepts:` section (CEO plan §6 registry
 * unification). Locks the exact API surface + data shape so the YAML
 * migration never silently regresses the 97-concept graph dozens of
 * consumers depend on.
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_CONCEPTS,
  CONCEPT_MAP,
  getConceptsForTopic,
  getPrerequisites,
  getDependents,
  traceWeakestPrerequisite,
  topologicalSort,
} from '../concept-graph';

describe('concept-graph.ts (thin YAML loader)', () => {
  it('loads exactly 97 concepts', () => {
    expect(ALL_CONCEPTS.length).toBe(97);
  });

  it('every concept has the full ConceptNode shape', () => {
    for (const c of ALL_CONCEPTS) {
      expect(typeof c.id).toBe('string');
      expect(c.id.length).toBeGreaterThan(0);
      expect(typeof c.topic).toBe('string');
      expect(typeof c.label).toBe('string');
      expect(typeof c.description).toBe('string');
      expect(typeof c.difficulty_base).toBe('number');
      expect(['high', 'medium', 'low', 'rare']).toContain(c.gate_frequency);
      expect(Array.isArray(c.prerequisites)).toBe(true);
    }
  });

  it('CONCEPT_MAP has one entry per concept, keyed by id', () => {
    expect(CONCEPT_MAP.size).toBe(ALL_CONCEPTS.length);
    for (const c of ALL_CONCEPTS) {
      expect(CONCEPT_MAP.get(c.id)).toBe(c);
    }
  });

  it('every prerequisite id resolves to a real node', () => {
    for (const c of ALL_CONCEPTS) {
      for (const p of c.prerequisites) {
        expect(CONCEPT_MAP.has(p)).toBe(true);
      }
    }
  });

  it('spot check: eigenvalues has the expected shape', () => {
    const node = CONCEPT_MAP.get('eigenvalues');
    expect(node).toBeDefined();
    expect(node!.topic).toBe('linear-algebra');
    expect(node!.gate_frequency).toBe('high');
    expect(node!.prerequisites.sort()).toEqual(['determinants', 'systems-of-equations']);
  });

  it('getConceptsForTopic filters by topic', () => {
    const calc = getConceptsForTopic('calculus');
    expect(calc.length).toBeGreaterThan(0);
    expect(calc.every((c) => c.topic === 'calculus')).toBe(true);
  });

  it('getPrerequisites / getDependents are inverse-consistent', () => {
    const deps = getDependents('eigenvalues');
    expect(deps.map((d) => d.id)).toContain('diagonalization');
    const prereqs = getPrerequisites('diagonalization');
    expect(prereqs.map((p) => p.id)).toContain('eigenvalues');
  });

  it('getPrerequisites/getDependents return [] for an unknown id', () => {
    expect(getPrerequisites('not-a-real-concept')).toEqual([]);
    expect(getDependents('not-a-real-concept')).toEqual([]);
  });

  it('traceWeakestPrerequisite sorts ancestors weakest-first', () => {
    const masteryVector = {
      eigenvalues: { score: 0.1 },
      'vector-spaces': { score: 0.2 },
      determinants: { score: 0 },
      'systems-of-equations': { score: 0 },
      'rank-nullity': { score: 0 },
    };
    const weak = traceWeakestPrerequisite('diagonalization', masteryVector, 0.3);
    expect(weak.length).toBeGreaterThan(0);
    expect(weak.map((w) => w.id)).toContain('eigenvalues');
    expect(weak.map((w) => w.id)).toContain('vector-spaces');
    // weakest-first: every entry's mastery score is <= the next one's
    const scores = weak.map((w) => masteryVector[w.id as keyof typeof masteryVector]?.score ?? 0);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
  });

  it('topologicalSort returns every concept exactly once, prerequisites before dependents', () => {
    const order = topologicalSort();
    expect(order.length).toBe(ALL_CONCEPTS.length);
    expect(new Set(order).size).toBe(ALL_CONCEPTS.length);
    const position = new Map(order.map((id, i) => [id, i]));
    for (const c of ALL_CONCEPTS) {
      for (const p of c.prerequisites) {
        expect(position.get(p)!).toBeLessThan(position.get(c.id)!);
      }
    }
  });
});

// ── T11 (B1): encompasses: edges — schema shape ────────────────────────────

describe('concept-graph.ts — encompasses: schema (T11/B1)', () => {
  it('when present, encompasses is an array of {id, weight}', () => {
    for (const c of ALL_CONCEPTS) {
      if (c.encompasses === undefined) continue;
      expect(Array.isArray(c.encompasses)).toBe(true);
      for (const e of c.encompasses) {
        expect(typeof e.id).toBe('string');
        expect(e.id.length).toBeGreaterThan(0);
        expect(typeof e.weight).toBe('number');
      }
    }
  });

  it('every encompasses id resolves to a real concept', () => {
    for (const c of ALL_CONCEPTS) {
      for (const e of c.encompasses ?? []) {
        expect(CONCEPT_MAP.has(e.id)).toBe(true);
      }
    }
  });

  it('no concept encompasses itself', () => {
    for (const c of ALL_CONCEPTS) {
      for (const e of c.encompasses ?? []) {
        expect(e.id).not.toBe(c.id);
      }
    }
  });

  it('spot check: eigenvalues encompasses determinants (~0.7) and systems-of-equations (~0.5)', () => {
    const node = CONCEPT_MAP.get('eigenvalues')!;
    const byId = new Map((node.encompasses ?? []).map((e) => [e.id, e.weight]));
    expect(byId.get('determinants')).toBeCloseTo(0.7, 5);
    expect(byId.get('systems-of-equations')).toBeCloseTo(0.5, 5);
  });

  it('spot check: gram-schmidt encompasses inner-product-spaces (~0.8)', () => {
    const node = CONCEPT_MAP.get('gram-schmidt')!;
    const byId = new Map((node.encompasses ?? []).map((e) => [e.id, e.weight]));
    expect(byId.get('inner-product-spaces')).toBeCloseTo(0.8, 5);
  });

  it('spot check: matrix-inverse encompasses determinants (~0.6) and matrix-operations (~0.85)', () => {
    const node = CONCEPT_MAP.get('matrix-inverse')!;
    const byId = new Map((node.encompasses ?? []).map((e) => [e.id, e.weight]));
    expect(byId.get('determinants')).toBeCloseTo(0.6, 5);
    expect(byId.get('matrix-operations')).toBeCloseTo(0.85, 5);
  });

  it('spot check: svd encompasses eigenvalues (~0.7) and orthogonality (~0.6)', () => {
    const node = CONCEPT_MAP.get('svd')!;
    const byId = new Map((node.encompasses ?? []).map((e) => [e.id, e.weight]));
    expect(byId.get('eigenvalues')).toBeCloseTo(0.7, 5);
    expect(byId.get('orthogonality')).toBeCloseTo(0.6, 5);
  });
});
