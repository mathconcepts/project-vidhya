/**
 * REGRESSION — every existing seed atom (3 concepts × 6 atoms = 18 files)
 * must render without throwing under the v3 markdown pipeline.
 *
 * The contract from the eng review: atoms NEVER fail to render. If a parser
 * change breaks an atom, this test catches it before it ships.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { MarkdownAtomRenderer } from './MarkdownAtomRenderer';

const CONTENT_ROOT = path.resolve(__dirname, '../../../../modules/project-vidhya-content/concepts');
const CONCEPTS = ['calculus-derivatives', 'complex-numbers', 'linear-algebra-eigenvalues'];

interface AtomFile {
  concept: string;
  file: string;
  id: string;
  body: string;
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
      });
    }
  }
  return out;
}

describe('MarkdownAtomRenderer — regression on seed atoms', () => {
  const atoms = loadAtoms();

  it('loads all 18 seed atoms', () => {
    expect(atoms.length).toBe(18);
  });

  it.each(atoms)('renders $concept/$file without throwing', ({ id, body }) => {
    const { container } = render(<MarkdownAtomRenderer atomId={id} content={body} />);
    expect(container.firstChild).toBeTruthy();
    // Must produce some text content (not an empty div).
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });
});
