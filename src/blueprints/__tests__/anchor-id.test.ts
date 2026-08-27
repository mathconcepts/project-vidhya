/**
 * src/blueprints/__tests__/anchor-id.test.ts
 *
 * Contract tests for computeAnchorId() (W2.2/E12). Mirrors
 * src/generation/batch/__tests__/jsonl-builder.test.ts's determinism-proof
 * style for customIdFor(), the precedent this function follows.
 */
import { describe, it, expect } from 'vitest';
import { computeAnchorId } from '../anchor-id';

describe('computeAnchorId', () => {
  it('is deterministic: same inputs -> same anchor id', () => {
    const a = computeAnchorId('eigenvalues', 'practice', 0, 'v1.0');
    const b = computeAnchorId('eigenvalues', 'practice', 0, 'v1.0');
    expect(a).toBe(b);
  });

  it('matches the anchor- + 12 hex char format', () => {
    const id = computeAnchorId('eigenvalues', 'practice', 0, 'v1.0');
    expect(id).toMatch(/^anchor-[0-9a-f]{12}$/);
  });

  it('a different concept_id produces a different anchor id', () => {
    const a = computeAnchorId('eigenvalues', 'practice', 0, 'v1.0');
    const b = computeAnchorId('diagonalization', 'practice', 0, 'v1.0');
    expect(a).not.toBe(b);
  });

  it('a different stage_id produces a different anchor id', () => {
    const a = computeAnchorId('eigenvalues', 'practice', 0, 'v1.0');
    const b = computeAnchorId('eigenvalues', 'intuition', 0, 'v1.0');
    expect(a).not.toBe(b);
  });

  it('a different ordinal produces a different anchor id', () => {
    const a = computeAnchorId('eigenvalues', 'practice', 0, 'v1.0');
    const b = computeAnchorId('eigenvalues', 'practice', 1, 'v1.0');
    expect(a).not.toBe(b);
  });

  it('a template_version bump changes the anchor id (intentional — see module doc)', () => {
    const a = computeAnchorId('eigenvalues', 'practice', 0, 'v1.0');
    const b = computeAnchorId('eigenvalues', 'practice', 0, 'v1.1');
    expect(a).not.toBe(b);
  });

  it('is not sensitive to argument concatenation collisions (delimiter matters)', () => {
    // Without a delimiter, ('ab', 'c', ...) and ('a', 'bc', ...) could collide.
    const a = computeAnchorId('ab', 'c', 0, 'v1.0');
    const b = computeAnchorId('a', 'bc', 0, 'v1.0');
    expect(a).not.toBe(b);
  });
});
