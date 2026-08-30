/**
 * REGRESSION — every seed atom must render without throwing under the v3
 * markdown pipeline. The contract from the eng review: atoms NEVER fail to
 * render. If a parser change breaks an atom, this test catches it before it
 * ships.
 *
 * The concept list is derived from disk, not hardcoded. It used to be a
 * hardcoded 28 while the corpus reached 101, so roughly 73 concepts of
 * authored content were never mounted through a real render by any test —
 * ci:katex-fences checks that the math parses, and ci:la-walkthrough's
 * "interactive" leg checks the `interactive-spec` JSON schema, but neither
 * puts an atom through React. Deriving the list means new content is covered
 * the moment it lands.
 *
 * The 880 base atoms are pinned, so a seed atom cannot silently disappear.
 * Authored stance
 * variants (`*.shaken.md` / `*.assured.md`, see src/content/stance-variants.ts)
 * are counted dynamically — they are expected to grow as concepts gain a
 * confident/unconfident axis, and pinning them would make every authoring
 * change a test edit. They still get the same per-file render assertion, which
 * is the part that actually protects a reader.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { MarkdownAtomRenderer } from './MarkdownAtomRenderer';

const CONTENT_ROOT = path.resolve(__dirname, '../../../../modules/project-vidhya-content/concepts');

/**
 * Every concept with an atoms/ directory, read from disk rather than listed
 * here. A hardcoded list silently stops covering new content the moment the
 * corpus outgrows it — which is exactly what happened: this array pinned 28
 * concepts while the corpus reached 101, so roughly 73 concepts of authored
 * content were never mounted through a real render by any test. Deriving it
 * means the test grows with the content and cannot fall behind again.
 */
const CONCEPTS = fs
  .readdirSync(CONTENT_ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && fs.existsSync(path.join(CONTENT_ROOT, e.name, 'atoms')))
  .map((e) => e.name)
  .sort();


interface AtomFile {
  concept: string;
  file: string;
  id: string;
  body: string;
  /** True for an authored alternative body rather than a base seed atom. */
  isVariant: boolean;
}

function loadAtoms(): AtomFile[] {
  const out: AtomFile[] = [];
  for (const concept of CONCEPTS) {
    const dir = path.join(CONTENT_ROOT, concept, 'atoms');
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, content } = matter(raw);
      out.push({
        concept,
        file,
        id: (data.id as string) ?? `${concept}.${file.replace('.md', '')}`,
        body: content,
        isVariant: typeof data.variant_of === 'string' && data.variant_of.length > 0,
      });
    }
  }
  return out;
}

describe('MarkdownAtomRenderer — regression on seed atoms', () => {
  const atoms = loadAtoms();

  it('covers every concept that has an atoms/ directory', () => {
    // The list is derived, so this asserts the derivation actually found the
    // corpus rather than an empty or truncated slice of it.
    expect(CONCEPTS.length).toBe(101);
  });

  it('loads all 880 base seed atoms', () => {
    // Pinned so a seed atom cannot silently disappear. Recompute and update
    // deliberately when base content is genuinely added or removed; a change
    // here should always be something an author meant to do.
    expect(atoms.filter((a) => !a.isVariant).length).toBe(880);
  });

  it('loads the authored stance variants too', () => {
    // Not a fixed count — the point is that variants are picked up and get the
    // same render guarantee, not that there is a particular number of them.
    const variants = atoms.filter((a) => a.isVariant);
    expect(variants.length).toBeGreaterThan(0);
    for (const v of variants) {
      expect(v.file, `${v.file} does not follow the <base>-<stance>.md convention`)
        .toMatch(/-(shaken|assured)\.md$/);
    }
  });

  it.each(atoms)('renders $concept/$file without throwing', ({ id, body }) => {
    const { container } = render(<MarkdownAtomRenderer atomId={id} content={body} />);
    expect(container.firstChild).toBeTruthy();
    // Must produce some text content (not an empty div).
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });
});
