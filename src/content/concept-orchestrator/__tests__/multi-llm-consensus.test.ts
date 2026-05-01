/**
 * multi-llm-consensus tests — math-atom agreement detection (E2).
 */

import { describe, it, expect } from 'vitest';
import { compareMathAtoms, requiresConsensus } from '../multi-llm-consensus';

describe('requiresConsensus', () => {
  it('true for math atom types', () => {
    expect(requiresConsensus('formal_definition')).toBe(true);
    expect(requiresConsensus('worked_example')).toBe(true);
  });
  it('false for other atom types', () => {
    expect(requiresConsensus('intuition')).toBe(false);
    expect(requiresConsensus('hook')).toBe(false);
    expect(requiresConsensus('common_traps')).toBe(false);
  });
});

describe('compareMathAtoms — worked_example', () => {
  it('agrees when answers match exactly', () => {
    const a = 'Steps...\nAnswer: 2*x';
    const b = 'Different prose...\nAnswer: 2*x';
    const r = compareMathAtoms('worked_example', a, b);
    expect(r.agreed).toBe(true);
  });

  it('agrees modulo whitespace and casing', () => {
    const a = 'Answer: 2 * X';
    const b = 'Answer: 2*x';
    const r = compareMathAtoms('worked_example', a, b);
    expect(r.agreed).toBe(true);
  });

  it('disagrees when answers differ', () => {
    const a = 'Answer: 2*x';
    const b = 'Answer: 3*x';
    const r = compareMathAtoms('worked_example', a, b);
    expect(r.agreed).toBe(false);
    expect(r.reason).toMatch(/answers differ/);
  });

  it('disagrees when one is missing the Answer line', () => {
    const a = 'Answer: 2*x';
    const b = 'No final answer here';
    const r = compareMathAtoms('worked_example', a, b);
    expect(r.agreed).toBe(false);
    expect(r.reason).toMatch(/missing/);
  });
});

describe('compareMathAtoms — formal_definition', () => {
  it('agrees when same definition with different prose (Jaccard >= 0.55)', () => {
    const a = 'The derivative of f at a equals the limit as h approaches zero of f a plus h minus f a divided by h. This represents the rate of change.';
    const b = 'The derivative limit definition: as h approaches zero, f a plus h minus f a divided by h gives the rate of change at point a.';
    const r = compareMathAtoms('formal_definition', a, b);
    expect(r.agreed).toBe(true);
  });

  it('disagrees when definitions diverge', () => {
    const a = 'The derivative measures rate of change at a point in calculus.';
    const b = 'Eigenvalues are scalar multiples of eigenvectors in linear algebra.';
    const r = compareMathAtoms('formal_definition', a, b);
    expect(r.agreed).toBe(false);
  });
});

describe('compareMathAtoms — non-math types pass through', () => {
  it('non-math atom types always agree', () => {
    const r = compareMathAtoms('intuition', 'A', 'B');
    expect(r.agreed).toBe(true);
  });
});
