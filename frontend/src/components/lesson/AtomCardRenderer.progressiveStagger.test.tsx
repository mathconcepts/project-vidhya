/**
 * AtomCardRenderer — `.vidhya-atom-body--progressive` className wiring.
 *
 * Attention-span pass (/investigate, 2026-09-01): visual_analogy and
 * mnemonic atoms got the paragraph-stagger modifier class first.
 *
 * Widened (/investigate, 2026-09-02, "just static text is provided...
 * needs to be resonant... using motion"): every other DefaultAtomCard type
 * (hook, intuition, micro_exercise, retrieval_prompt, interleaved_drill)
 * now gets it too — those atom types had zero motion not by design
 * decision but because the mechanism had never been extended to them.
 * `formal_definition` stays the one deliberate holdout (see the
 * definition/mnemonic engagement-framework proposal doc — Sweller's
 * split-attention effect). `exam_pattern` is excluded too, but only
 * because it already animates via the `structured` list-row stagger
 * instead — `progressive` targets `> p` and its markup is a bullet list,
 * so adding it would be an inert no-op, not a second animation.
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

  it('does NOT apply the progressive class to an exam_pattern atom (already animates via structured)', () => {
    const { container } = renderSingleAtom(
      makeAtom({ id: 'c.exam', atom_type: 'exam_pattern', content: '- **NAT trap**: watch the sign.' }),
    );
    expect(container.querySelector('.vidhya-atom-body--progressive')).toBeNull();
    expect(container.querySelector('.vidhya-atom-body--structured')).not.toBeNull();
  });

  it('applies the progressive class to a plain intuition atom', () => {
    const { container } = renderSingleAtom(
      makeAtom({ id: 'c.int', atom_type: 'intuition', content: 'Some intuition prose.' }),
    );
    expect(container.querySelector('.vidhya-atom-body--progressive')).not.toBeNull();
  });

  it('applies the progressive class to a hook atom', () => {
    const { container } = renderSingleAtom(
      makeAtom({ id: 'c.hook', atom_type: 'hook', content: 'Some hook prose.' }),
    );
    expect(container.querySelector('.vidhya-atom-body--progressive')).not.toBeNull();
  });

  it('applies the progressive class to micro_exercise, retrieval_prompt, and interleaved_drill atoms', () => {
    for (const atom_type of ['micro_exercise', 'retrieval_prompt', 'interleaved_drill'] as const) {
      const { container } = renderSingleAtom(
        makeAtom({ id: `c.${atom_type}`, atom_type, content: 'Some prose.' }),
      );
      expect(container.querySelector('.vidhya-atom-body--progressive')).not.toBeNull();
    }
  });
});
