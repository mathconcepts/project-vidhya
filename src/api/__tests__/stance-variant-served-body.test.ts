/**
 * Extends the demo-persona-stance guarantee — "served_stance differs for
 * shaken vs assured" — to EVERY concept with authored stance variants, not
 * only the three the demo deck happens to walk.
 *
 * demo-persona-stance.test.ts proves the claim end-to-end through real
 * persona YAML for eigenvalues / determinants / orthogonality. Personas
 * carry mastery only for the concepts the demo deck was built around, so a
 * newly authored concept (T17: matrix-operations, matrix-inverse,
 * systems-of-equations, lu-factorization, trace, rank-nullity,
 * linear-independence, null-space-column-space, and whatever lands after)
 * has no persona to route through. This file checks the same underlying
 * guarantee — applyStanceVariants() actually swaps the served body per
 * stance — directly against the content module, which does not require a
 * persona fixture for every concept.
 *
 * Concepts are AUTO-DISCOVERED from disk via listConceptIds() +
 * loadConceptAtoms(), never hardcoded. A concept's variant files start being
 * checked here the moment they land — including the fifteen concepts a
 * sibling effort is authoring concurrently — with no edit to this file.
 */
import { describe, it, expect } from 'vitest';
import { listConceptIds, loadConceptAtoms } from '../../content/atom-loader';
import { applyStanceVariants, NARRATIVE_ATOM_TYPES } from '../../content/stance-variants';
import type { ContentAtom } from '../../content/content-types';

/**
 * Concepts whose narrative atoms (hook, intuition, worked_example) are
 * FULLY covered for both variant stances.
 *
 * applyStanceVariants() is deliberately all-or-nothing across a concept's
 * narrative atoms (see stance-variants.ts) — a concept missing even one
 * variant file falls back to base text for every atom, silently. Filtering
 * to full coverage here keeps this suite reporting the axis actually
 * working, rather than false-negative on a concept mid-authoring.
 */
async function conceptsWithFullStanceCoverage(): Promise<string[]> {
  const ids: string[] = [];
  for (const id of listConceptIds()) {
    let atoms: ContentAtom[];
    try {
      atoms = await loadConceptAtoms(id);
    } catch {
      continue;
    }
    const narrative = atoms.filter((a) => NARRATIVE_ATOM_TYPES.includes(a.atom_type));
    if (narrative.length === 0) continue;
    const fullyCovered = narrative.every(
      (a) => a.stance_variants?.shaken && a.stance_variants?.assured,
    );
    if (fullyCovered) ids.push(id);
  }
  return ids.sort();
}

// Top-level await: the discovery must happen before describe.each below is
// evaluated, since vitest collects the test tree synchronously.
const COVERED_CONCEPTS = await conceptsWithFullStanceCoverage();

describe('served body differs by stance, for every concept with authored variants', () => {
  it('discovered at least one fully-covered concept', () => {
    // A regression here means either the corpus emptied out or discovery
    // itself broke. Either way, an empty describe.each below would silently
    // run zero assertions instead of failing loudly.
    expect(COVERED_CONCEPTS.length).toBeGreaterThan(0);
  });

  describe.each(COVERED_CONCEPTS)('%s', (conceptId) => {
    it('shaken and assured each read different words than the base, and than each other, on every narrative atom', async () => {
      const atoms = await loadConceptAtoms(conceptId);
      const shaken = applyStanceVariants(atoms, 'shaken');
      const assured = applyStanceVariants(atoms, 'assured');

      const narrativeIdx = atoms
        .map((a, i) => [a, i] as const)
        .filter(([a]) => NARRATIVE_ATOM_TYPES.includes(a.atom_type));

      expect(narrativeIdx.length).toBeGreaterThan(0);

      for (const [base, i] of narrativeIdx) {
        expect(shaken[i].served_stance).toBe('shaken');
        expect(assured[i].served_stance).toBe('assured');
        expect(shaken[i].content).not.toBe(assured[i].content);
        expect(shaken[i].content).not.toBe(base.content);
        expect(assured[i].content).not.toBe(base.content);
      }
    });

    it('an unsignalled (steady) read gets the base body untouched', async () => {
      const atoms = await loadConceptAtoms(conceptId);
      const steady = applyStanceVariants(atoms, 'steady');
      // steady is a documented no-op (see stance-variants.ts) — same
      // reference back, not a copy that merely looks equal.
      expect(steady).toBe(atoms);
    });
  });
});
