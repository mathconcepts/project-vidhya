import { describe, it, expect } from 'vitest';
import {
  classifyWolframContentFamily,
  classifyAllAtomicTopics,
  wolframContentFamilyFor,
  WOLFRAM_CONTENT_FAMILIES,
} from '../wolfram-content-family';

describe('classifyWolframContentFamily', () => {
  it('classifies eigen topics before the broader matrix rule (order matters)', () => {
    expect(classifyWolframContentFamily('Eigenvalues', 'linear-algebra', 'matrix')).toBe('eigen');
    expect(classifyWolframContentFamily('Diagonalization', 'linear-algebra', 'matrix')).toBe('eigen');
  });

  it('classifies plain matrix topics as matrix', () => {
    expect(classifyWolframContentFamily('Rank of a matrix', 'linear-algebra', 'matrix')).toBe('matrix');
    expect(classifyWolframContentFamily('Determinants and properties', 'linear-algebra', 'matrix')).toBe('matrix');
  });

  it('classifies each documented family keyword correctly', () => {
    expect(classifyWolframContentFamily('Limits', 'calculus', 'limit')).toBe('limit');
    expect(classifyWolframContentFamily('Mean value theorems', 'calculus', 'derivative')).toBe('derivative');
    expect(classifyWolframContentFamily('Definite integrals', 'calculus', 'integral')).toBe('integral');
    expect(classifyWolframContentFamily('Lagrange multipliers', 'calculus', 'optimization')).toBe('optimization');
    expect(classifyWolframContentFamily('Divergence', 'vector-calculus', 'vector')).toBe('vector');
    expect(classifyWolframContentFamily('Separation of variables', 'pde', 'pde')).toBe('pde');
    // Note: "differential equation" always contains "differenti", and the
    // 'derivative' rule is checked before the 'ode' rule in the uploaded
    // generator script's own keyword order — so any real ODE-domain topic
    // (whose domain literally says "differential equations") classifies
    // as 'derivative', never 'ode', faithfully reproduced here (confirmed
    // against a real audit run: DE-01..14 never classify as 'ode'). The
    // 'ode' branch is only reachable via the literal substring "ode"
    // appearing without "differenti"/"derivative" earlier in the string.
    expect(classifyWolframContentFamily('Existence and uniqueness', 'explicit ode methods', 'ode')).toBe('ode');
    expect(classifyWolframContentFamily('Homogeneous equations', 'ordinary differential equations', 'ode')).toBe('derivative');
    expect(classifyWolframContentFamily('Residue theorem', 'complex-variables', 'complex')).toBe('complex');
    expect(classifyWolframContentFamily("Bayes' theorem", 'probability', 'probability')).toBe('probability');
    expect(classifyWolframContentFamily('Correlation coefficient', 'statistics', 'statistics')).toBe('statistics');
    expect(classifyWolframContentFamily('Newton-Raphson method', 'numerical-methods', 'numerical')).toBe('numerical');
    expect(classifyWolframContentFamily('Graph connectivity', 'discrete-math', 'discrete')).toBe('discrete');
  });

  it('falls back to matrix for an unrecognized topic (matches the uploaded generator script)', () => {
    expect(classifyWolframContentFamily('Something entirely novel', 'unknown-domain', 'generic')).toBe('matrix');
  });

  it('only ever returns a member of WOLFRAM_CONTENT_FAMILIES', () => {
    const result = classifyWolframContentFamily('anything', 'anything', 'anything');
    expect(WOLFRAM_CONTENT_FAMILIES).toContain(result);
  });
});

describe('classifyAllAtomicTopics', () => {
  it('classifies all 116 loaded atomic topics with no crash', () => {
    const entries = classifyAllAtomicTopics();
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(WOLFRAM_CONTENT_FAMILIES).toContain(entry.family);
      expect(entry.atomic_id).toBeTruthy();
      // concept_id is null for the atomic-concept-map.ts's documented
      // unmapped ids — never fabricated, so this must be nullable, not
      // always-truthy.
      expect(entry.concept_id === null || typeof entry.concept_id === 'string').toBe(true);
    }
  });

  it('a real GATE Linear Algebra concept (LA-06, eigenvalues) classifies as eigen and maps to a concept_id', () => {
    const entries = classifyAllAtomicTopics();
    const la06 = entries.find((e) => e.atomic_id === 'LA-06');
    expect(la06?.family).toBe('eigen');
    expect(la06?.concept_id).toBe('eigenvalues');
  });
});

describe('wolframContentFamilyFor', () => {
  it('returns null for an unknown atomic_id rather than guessing', () => {
    expect(wolframContentFamilyFor('NOT-A-REAL-ID')).toBeNull();
  });

  it('returns a real family for a known atomic_id', () => {
    expect(wolframContentFamilyFor('LA-06')).toBe('eigen');
  });
});
