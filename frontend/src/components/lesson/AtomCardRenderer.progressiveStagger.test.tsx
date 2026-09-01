/**
 * AtomCardRenderer — `.vidhya-atom-body--progressive` className wiring.
 *
 * Attention-span pass (/investigate, 2026-09-01): visual_analogy and
 * mnemonic atoms get the paragraph-stagger modifier class; every other
 * atom type (including formal_definition, deliberately — see the
 * definition/mnemonic engagement-framework proposal doc) renders without
 * it, same as before this pass.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
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

function renderSingleAtom(atom: ContentAtom) {
  return render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
}

describe('AtomCardRenderer — progressive stagger className', () => {
  it('applies vidhya-atom-body--progressive to a visual_analogy atom', () => {
    const { container } = renderSingleAtom(
      makeAtom({ id: 'c.visual', atom_type: 'visual_analogy', content: 'A visual caption.' }),
    );
    expect(container.querySelector('.vidhya-atom-body--progressive')).not.toBeNull();
  });

  it('applies vidhya-atom-body--progressive to a mnemonic atom', () => {
    const { container } = renderSingleAtom(
      makeAtom({ id: 'c.mnem', atom_type: 'mnemonic', content: 'A memory device.' }),
    );
    expect(container.querySelector('.vidhya-atom-body--progressive')).not.toBeNull();
  });

  it('does NOT apply the progressive class to a formal_definition atom (motion is the wrong lever there)', () => {
    const { container } = renderSingleAtom(
      makeAtom({ id: 'c.def', atom_type: 'formal_definition', content: 'The precise statement.' }),
    );
    expect(container.querySelector('.vidhya-atom-body--progressive')).toBeNull();
  });

  it('does NOT apply the progressive class to a plain intuition atom', () => {
    const { container } = renderSingleAtom(
      makeAtom({ id: 'c.int', atom_type: 'intuition', content: 'Some intuition prose.' }),
    );
    expect(container.querySelector('.vidhya-atom-body--progressive')).toBeNull();
  });
});
