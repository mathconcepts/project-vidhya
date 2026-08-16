/**
 * The authored variants for the demo concepts, checked against the real files.
 *
 * check-demo-rails.ts already refuses to ship a rail with a missing variant.
 * This is the other half: that what IS on disk is genuinely different content,
 * loads through the real loader, and does not smuggle authoring notes onto a
 * student's screen.
 *
 * The distinctness check matters because the cheapest way to satisfy a
 * "variant exists" gate is to copy the base file, which would pass CI and show
 * one lesson to two narrated students — precisely the failure the gate exists
 * to prevent.
 */
import { describe, it, expect } from 'vitest';
import { loadConceptAtoms } from '../atom-loader';
import { applyStanceVariants, VARIANT_STANCES } from '../stance-variants';

/** The concepts the demo deck's atom rails walk. */
const DEMO_CONCEPTS = ['eigenvalues', 'determinants', 'orthogonality'];

describe('demo stance variants on disk', () => {
  for (const concept of DEMO_CONCEPTS) {
    describe(concept, () => {
      it('does not serve variant files as extra atoms', async () => {
        const atoms = await loadConceptAtoms(concept);
        expect(atoms.length).toBeGreaterThan(0);
        for (const a of atoms) {
          expect(a.variant_of, `${a.id} leaked into the lesson as its own atom`).toBeUndefined();
          expect(a.for_stance).toBeUndefined();
        }
        // Variant ids end in .shaken / .assured; none may survive as an atom.
        const leaked = atoms.filter((a) => /\.(shaken|assured)$/.test(a.id));
        expect(leaked.map((a) => a.id)).toEqual([]);
      });

      it('has at least one atom with both stances authored', async () => {
        const atoms = await loadConceptAtoms(concept);
        const covered = atoms.filter((a) =>
          VARIANT_STANCES.every((s) => Boolean(a.stance_variants?.[s])),
        );
        expect(covered.length).toBeGreaterThan(0);
      });

      it('serves genuinely different prose for each stance', async () => {
        const atoms = await loadConceptAtoms(concept);
        const base = applyStanceVariants(atoms, 'steady');
        const shaken = applyStanceVariants(atoms, 'shaken');
        const assured = applyStanceVariants(atoms, 'assured');

        for (let i = 0; i < atoms.length; i++) {
          if (!atoms[i].stance_variants) continue;
          // A variant that merely copies the base passes a file-exists gate and
          // still shows one lesson to two students.
          expect(shaken[i].content, `${atoms[i].id} shaken duplicates the base`).not.toBe(base[i].content);
          expect(assured[i].content, `${atoms[i].id} assured duplicates the base`).not.toBe(base[i].content);
          expect(shaken[i].content, `${atoms[i].id} shaken duplicates assured`).not.toBe(assured[i].content);
        }
      });

      it('keeps authoring notes out of every served body', async () => {
        // The rationale lives in YAML frontmatter comments precisely so it
        // cannot reach a reader. An HTML comment in the body would survive
        // into the markdown pipeline's input.
        const atoms = await loadConceptAtoms(concept);
        for (const stance of ['steady', ...VARIANT_STANCES] as const) {
          for (const a of applyStanceVariants(atoms, stance)) {
            expect(a.content, `${a.id} (${stance}) carries an authoring note`).not.toContain(
              'Alternative body for',
            );
            expect(a.content).not.toContain('<!--');
          }
        }
      });

      it('carries the base atom\'s interactive block into its variants unchanged', async () => {
        // Variants differ in prose only; a drifted widget spec is a second
        // thing to keep in sync and a second thing to render as nothing.
        const atoms = await loadConceptAtoms(concept);
        for (const a of atoms) {
          if (!a.stance_variants) continue;
          const baseHasSpec = a.content.includes('```interactive-spec');
          for (const s of VARIANT_STANCES) {
            const body = a.stance_variants[s];
            if (!body) continue;
            expect(
              body.includes('```interactive-spec'),
              `${a.id} ${s} variant disagrees with the base about having an interactive block`,
            ).toBe(baseHasSpec);
          }
        }
      });
    });
  }
});
