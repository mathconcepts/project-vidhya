/**
 * REGRESSION — every seed atom must render without throwing under the v3
 * markdown pipeline. The contract from the eng review: atoms NEVER fail to
 * render. If a parser change breaks an atom, this test catches it before it
 * ships.
 *
 * Base atoms (derivatives-basic: 9, complex-numbers: 8, eigenvalues: 8 = 25)
 * are pinned, so a seed atom cannot silently disappear. Authored stance
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
const CONCEPTS = ['derivatives-basic', 'complex-numbers', 'eigenvalues'];

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

  it('loads all 25 base seed atoms', () => {
    expect(atoms.filter((a) => !a.isVariant).length).toBe(25);
  });

  it('loads the authored stance variants too', () => {
    // Not a fixed count — the point is that variants are picked up and get the
    // same render guarantee, not that there is a particular number of them.
    const variants = atoms.filter((a) => a.isVariant);
    expect(variants.length).toBeGreaterThan(0);
    for (const v of variants) {
      expect(v.file, `${v.file} does not follow the <base>.<stance>.md convention`)
        .toMatch(/\.(shaken|assured)\.md$/);
    }
  });

  it.each(atoms)('renders $concept/$file without throwing', ({ id, body }) => {
    const { container } = render(<MarkdownAtomRenderer atomId={id} content={body} />);
    expect(container.firstChild).toBeTruthy();
    // Must produce some text content (not an empty div).
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });
});
