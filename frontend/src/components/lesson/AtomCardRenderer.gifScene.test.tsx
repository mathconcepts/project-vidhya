/**
 * AtomCardRenderer — gif-scene fence stripping.
 *
 * visual_analogy atoms embed a fenced ```gif-scene\n{...}\n``` block (§4.15)
 * that the server renders into a GIF, served via atom.media.gif_url and
 * shown by MediaSidecar. Before this fix, DefaultAtomCard/WorkedExampleCard/
 * CommonTrapsCard only stripped the sibling ```interactive-spec``` fence —
 * the gif-scene fence passed straight through to MarkdownAtomRenderer, which
 * has no choice but to render an unrecognized fenced block as a literal
 * <pre><code> block: the raw scene JSON, visible to the student as "code".
 * Reported live via screenshot on systems-of-equations' visual_analogy atom
 * ("where do 3 planes meet"). All 70 committed visual_analogy atoms carry
 * this fence, so this bug was platform-wide, not concept-specific.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtomCardRenderer, type ContentAtom } from './AtomCardRenderer';

function makeAtom(overrides: Partial<ContentAtom> = {}): ContentAtom {
  return {
    id: 'c.a',
    concept_id: 'c',
    atom_type: 'intuition',
    bloom_level: 2,
    difficulty: 0.1,
    exam_ids: ['*'],
    content: 'body text',
    ...overrides,
  };
}

const GIF_SCENE_BODY = [
  'Every linear equation in three unknowns defines a plane. Where do three planes meet?',
  '',
  '```gif-scene',
  '{',
  '  "type": "function-trace",',
  '  "expression": "x - 0.5*x^2 + 1",',
  '  "x_range": [-3, 3],',
  '  "y_range": [-2, 4]',
  '}',
  '```',
  '',
  '## Three Planes, Three Stories',
  '',
  'The three planes meet at a single point.',
].join('\n');

describe('AtomCardRenderer — gif-scene fence stripping', () => {
  it('visual_analogy (DefaultAtomCard): renders prose, never the raw scene JSON', () => {
    const atom = makeAtom({ atom_type: 'visual_analogy', content: GIF_SCENE_BODY });
    render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
    expect(screen.getByText(/Where do three planes meet/)).toBeInTheDocument();
    expect(screen.getByText(/The three planes meet at a single point/)).toBeInTheDocument();
    expect(screen.queryByText(/function-trace/)).not.toBeInTheDocument();
    expect(screen.queryByText(/x_range/)).not.toBeInTheDocument();
  });

  it('worked_example: strips the fence from step prose too', () => {
    const atom = makeAtom({
      atom_type: 'worked_example',
      content: `Setup.\n\n\`\`\`gif-scene\n{"type": "parametric-curve"}\n\`\`\`\n\n---\n\nStep two prose.`,
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
    expect(screen.getByText('Setup.')).toBeInTheDocument();
    expect(screen.queryByText(/parametric-curve/)).not.toBeInTheDocument();
  });

  it('common_traps: strips the fence from trap prose too', () => {
    const atom = makeAtom({
      atom_type: 'common_traps',
      content: `Watch out.\n\n\`\`\`gif-scene\n{"type": "level-set"}\n\`\`\`\n\nThat's the trap.`,
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
    expect(screen.getByText('Watch out.')).toBeInTheDocument();
    expect(screen.queryByText(/level-set/)).not.toBeInTheDocument();
  });

  it('an atom with no gif-scene fence renders unchanged', () => {
    const atom = makeAtom({ atom_type: 'hook', content: 'Plain hook text, no fences at all.' });
    render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
    expect(screen.getByText('Plain hook text, no fences at all.')).toBeInTheDocument();
  });
});
