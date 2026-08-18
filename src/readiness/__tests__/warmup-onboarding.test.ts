/**
 * Tests for src/readiness/warmup-onboarding.ts — the T8 onboarding policy
 * layered on top of diagnostic-warmup.ts's per-skill bracketing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  WARMUP_SPINE_CONCEPTS,
  COMPETENCE_THRESHOLD,
  spineConceptLabels,
  computePlacement,
  inferPlacedAncestors,
  applyWarmupPriors,
  type PerConceptWarmupResult,
} from '../warmup-onboarding';
import { CONCEPT_MAP, getPrerequisites } from '../../constants/concept-graph';

function result(overrides: Partial<PerConceptWarmupResult> & { skillId: string }): PerConceptWarmupResult {
  return {
    converged: true,
    abilityEstimate: 1200,
    probesUsed: 4,
    predictedSuccessAtClose: 0.6,
    ...overrides,
  };
}

describe('WARMUP_SPINE_CONCEPTS (OV2-8 scope lock)', () => {
  it('is 4-6 concepts (locked scope, never all 26)', () => {
    expect(WARMUP_SPINE_CONCEPTS.length).toBeGreaterThanOrEqual(4);
    expect(WARMUP_SPINE_CONCEPTS.length).toBeLessThanOrEqual(6);
  });

  it('every spine id is a real linear-algebra concept-graph node', () => {
    for (const id of WARMUP_SPINE_CONCEPTS) {
      const node = CONCEPT_MAP.get(id);
      expect(node, `${id} must exist in the concept graph`).toBeDefined();
      expect(node!.topic).toBe('linear-algebra');
    }
  });

  it('is in real topological (prerequisite) order — every concept only depends on earlier spine concepts', () => {
    const seenSoFar = new Set<string>();
    for (const id of WARMUP_SPINE_CONCEPTS) {
      const prereqs = getPrerequisites(id).map((p) => p.id);
      for (const p of prereqs) {
        if (WARMUP_SPINE_CONCEPTS.includes(p)) {
          expect(seenSoFar.has(p), `${id} depends on ${p}, which must appear earlier in the spine`).toBe(true);
        }
      }
      seenSoFar.add(id);
    }
  });
});

describe('spineConceptLabels', () => {
  it('returns a label for every spine concept, sourced from the concept graph', () => {
    const labels = spineConceptLabels();
    expect(labels.length).toBe(WARMUP_SPINE_CONCEPTS.length);
    for (const { id, label } of labels) {
      expect(CONCEPT_MAP.get(id)?.label).toBe(label);
    }
  });
});

describe('computePlacement', () => {
  it('places every concept when all converge with high predicted success', () => {
    const results = WARMUP_SPINE_CONCEPTS.map((id) => result({ skillId: id }));
    const { placedConceptIds, frontierConceptId } = computePlacement(results);
    expect(placedConceptIds).toEqual([...WARMUP_SPINE_CONCEPTS]);
    expect(frontierConceptId).toBeNull();
  });

  it('stops at the first weak point — later concepts are never placed even if they look converged', () => {
    const results = [
      result({ skillId: 'matrix-operations', predictedSuccessAtClose: 0.9 }),
      result({ skillId: 'determinants', converged: false, predictedSuccessAtClose: 0.9 }), // frontier
      result({ skillId: 'matrix-inverse', converged: true, predictedSuccessAtClose: 0.95 }), // NOT placed
    ];
    const { placedConceptIds, frontierConceptId } = computePlacement(results);
    expect(placedConceptIds).toEqual(['matrix-operations']);
    expect(frontierConceptId).toBe('determinants');
  });

  it('a converged-but-low-success result is NOT treated as demonstrated (algorithm terminated != competence)', () => {
    const results = [
      result({ skillId: 'matrix-operations', converged: true, predictedSuccessAtClose: COMPETENCE_THRESHOLD - 0.01 }),
    ];
    const { placedConceptIds, frontierConceptId } = computePlacement(results);
    expect(placedConceptIds).toEqual([]);
    expect(frontierConceptId).toBe('matrix-operations');
  });

  it('empty results (Stop-here before answering anything) place nothing and name no frontier', () => {
    const { placedConceptIds, frontierConceptId } = computePlacement([]);
    expect(placedConceptIds).toEqual([]);
    expect(frontierConceptId).toBeNull();
  });
});

describe('inferPlacedAncestors', () => {
  it('includes the placed concepts themselves', () => {
    const closure = inferPlacedAncestors(['eigenvalues']);
    expect(closure).toContain('eigenvalues');
  });

  it('walks the REAL prerequisite closure, not just the curated spine', () => {
    // eigenvalues <- determinants, systems-of-equations
    // systems-of-equations <- matrix-inverse <- determinants <- matrix-operations
    const closure = new Set(inferPlacedAncestors(['eigenvalues']));
    expect(closure.has('determinants')).toBe(true);
    expect(closure.has('systems-of-equations')).toBe(true);
    expect(closure.has('matrix-inverse')).toBe(true);
    expect(closure.has('matrix-operations')).toBe(true);
  });

  it('deduplicates when multiple placed concepts share ancestors', () => {
    const closure = inferPlacedAncestors(['determinants', 'matrix-inverse']);
    const unique = new Set(closure);
    expect(closure.length).toBe(unique.size);
  });

  it('is a no-op closure add for a root concept with no prerequisites', () => {
    const closure = inferPlacedAncestors(['matrix-operations']);
    expect(closure).toEqual(['matrix-operations']);
  });

  it('never throws on an unknown id and does not expand it', () => {
    const closure = inferPlacedAncestors(['not-a-real-concept']);
    expect(closure).toEqual(['not-a-real-concept']);
  });

  it('handles the empty placement (Stop-here before any competence)', () => {
    expect(inferPlacedAncestors([])).toEqual([]);
  });
});

describe('applyWarmupPriors — DB-less honesty', () => {
  const savedUrl = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (savedUrl) process.env.DATABASE_URL = savedUrl; });

  it('returns recorded:false and attempts no write when DATABASE_URL is unset', async () => {
    const results = [result({ skillId: 'matrix-operations', predictedSuccessAtClose: 0.9 })];
    const out = await applyWarmupPriors('student-x', results);
    expect(out.recorded).toBe(false);
    expect(out.placed).toContain('matrix-operations');
  });

  it('still computes placement + frontier honestly even DB-less', async () => {
    const results = [
      result({ skillId: 'matrix-operations', predictedSuccessAtClose: 0.9 }),
      result({ skillId: 'determinants', converged: false, predictedSuccessAtClose: 0.9 }),
    ];
    const out = await applyWarmupPriors('student-x', results);
    expect(out.frontier).toBe('determinants');
    expect(out.recorded).toBe(false);
  });
});
