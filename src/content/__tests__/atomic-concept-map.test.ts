import { describe, it, expect } from 'vitest';
import { ALL_CONCEPTS } from '../../constants/concept-graph';
import { loadAtomicTopicSpecs } from '../atomic-topic-spec';
import {
  ATOMIC_TO_CONCEPT,
  UNMAPPED_ATOMIC_IDS,
  getConceptIdForAtomicId,
  getAtomicIdsForConceptId,
  mappingCoverage,
} from '../atomic-concept-map';

const VALID_CONCEPT_IDS = new Set(ALL_CONCEPTS.map((c) => c.id));

describe('atomic-concept-map (real committed docs/content-spec/ + concept-graph.ts)', () => {
  it('every mapped concept_id is a real, registered concept', () => {
    for (const [atomicId, conceptId] of Object.entries(ATOMIC_TO_CONCEPT)) {
      expect(VALID_CONCEPT_IDS.has(conceptId), `${atomicId} -> "${conceptId}" is not a real concept_id`).toBe(true);
    }
  });

  it('every key in both maps is a real atomic_id from docs/content-spec/', () => {
    const realIds = new Set(loadAtomicTopicSpecs().keys());
    for (const atomicId of Object.keys(ATOMIC_TO_CONCEPT)) {
      expect(realIds.has(atomicId), `"${atomicId}" (mapped) is not a real atomic_id`).toBe(true);
    }
    for (const atomicId of Object.keys(UNMAPPED_ATOMIC_IDS)) {
      expect(realIds.has(atomicId), `"${atomicId}" (unmapped) is not a real atomic_id`).toBe(true);
    }
  });

  it('mapped and unmapped are disjoint and together account for every atomic_id', () => {
    const mapped = new Set(Object.keys(ATOMIC_TO_CONCEPT));
    const unmapped = new Set(Object.keys(UNMAPPED_ATOMIC_IDS));
    const overlap = [...mapped].filter((id) => unmapped.has(id));
    expect(overlap).toEqual([]);

    const allRealIds = new Set(loadAtomicTopicSpecs().keys());
    const accounted = new Set([...mapped, ...unmapped]);
    const missing = [...allRealIds].filter((id) => !accounted.has(id));
    expect(missing, `atomic_ids present in docs/content-spec/ but neither mapped nor recorded as unmapped: ${missing.join(', ')}`).toEqual([]);
  });

  it('every unmapped reason is a non-trivial explanation, not a placeholder', () => {
    for (const [atomicId, reason] of Object.entries(UNMAPPED_ATOMIC_IDS)) {
      expect(reason.length, `${atomicId}'s reason is too short to be a real explanation`).toBeGreaterThan(20);
    }
  });

  it('spot-checks known correct mappings', () => {
    expect(getConceptIdForAtomicId('LA-06')).toBe('eigenvalues');
    expect(getConceptIdForAtomicId('LA-07')).toBe('eigenvalues'); // eigenvectors folds into the same concept
    expect(getConceptIdForAtomicId('CX-09')).toBe('taylor-laurent');
    expect(getConceptIdForAtomicId('DE-11')).toBe('ode-second-order-nonhomo');
  });

  it('returns null (not a guess) for a deliberately unmapped atomic_id', () => {
    expect(getConceptIdForAtomicId('VC-11')).toBeNull();
    expect(getConceptIdForAtomicId('DE-08')).toBeNull();
  });

  it('returns null for an unknown atomic_id', () => {
    expect(getConceptIdForAtomicId('ZZ-99')).toBeNull();
  });

  it('getAtomicIdsForConceptId finds every atomic_id folded into a many-to-one concept', () => {
    // All 8 PDE atomic topics fold into the app's single pde-basics concept.
    const pdeIds = getAtomicIdsForConceptId('pde-basics');
    expect(pdeIds.sort()).toEqual(['PD-01', 'PD-02', 'PD-03', 'PD-04', 'PD-05', 'PD-06', 'PD-07', 'PD-08']);
  });

  it('getAtomicIdsForConceptId returns empty for a concept with no atomic_id', () => {
    // vector-spaces is one of the 15 richer LA concepts added beyond the base atomic spec.
    expect(getAtomicIdsForConceptId('vector-spaces')).toEqual([]);
  });

  it('mappingCoverage reports honest, internally consistent totals', () => {
    const coverage = mappingCoverage();
    expect(coverage.total_atomic_ids).toBe(116);
    expect(coverage.mapped + coverage.unmapped).toBe(coverage.total_atomic_ids);
    expect(coverage.mapped).toBe(Object.keys(ATOMIC_TO_CONCEPT).length);
    expect(Object.keys(coverage.unmapped_reasons).length).toBe(coverage.unmapped);
    expect(coverage.concepts_with_multiple_atomic_ids['pde-basics']).toHaveLength(8);
    expect(coverage.concepts_without_atomic_id).toContain('vector-spaces');
    expect(coverage.concepts_without_atomic_id).not.toContain('eigenvalues');
  });
});
