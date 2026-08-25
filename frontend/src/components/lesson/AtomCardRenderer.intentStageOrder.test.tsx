/**
 * AtomCardRenderer — intent-ordered default sequence (T4).
 *
 * Covers: `applyIntentStageOrder` as a pure stable sort (no-op when
 * stageOrder is absent/empty, reorders by stage-kind rank, unknown-mapped
 * atom types keep their relative position at the end), plus an
 * integration check that the rendered card stack reflects the reordered
 * sequence when `intentStageOrder` is passed to AtomCardRenderer and is
 * byte-identical to the original order when it isn't.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtomCardRenderer, applyIntentStageOrder, type ContentAtom } from './AtomCardRenderer';

function atom(id: string, atom_type: ContentAtom['atom_type']): ContentAtom {
  return {
    id,
    concept_id: 'eigenvalues',
    atom_type,
    bloom_level: 1,
    difficulty: 0.5,
    exam_ids: [],
    content: `body for ${id}`,
  };
}

// Authored order mirrors how a concept's atoms are typically authored:
// hook → intuition → formal_definition → worked_example → micro_exercise
// → common_traps.
const AUTHORED_ORDER: ContentAtom[] = [
  atom('a-hook', 'hook'),
  atom('a-intuition', 'intuition'),
  atom('a-formal', 'formal_definition'),
  atom('a-worked', 'worked_example'),
  atom('a-micro', 'micro_exercise'),
  atom('a-traps', 'common_traps'),
];

describe('applyIntentStageOrder (pure function)', () => {
  it('is a no-op when stageOrder is undefined', () => {
    expect(applyIntentStageOrder(AUTHORED_ORDER, undefined)).toEqual(AUTHORED_ORDER);
  });

  it('is a no-op when stageOrder is empty', () => {
    expect(applyIntentStageOrder(AUTHORED_ORDER, [])).toEqual(AUTHORED_ORDER);
  });

  it('reorders a pyq_targeted_practice sequence (pyq_anchor, practice) to the front', () => {
    // pyq_anchor has no direct atom_type mapping in this fixture set — only
    // 'practice' does (micro_exercise). Practice-mapped atoms move to the
    // front; everything else (unmapped stage-kinds for THIS stageOrder)
    // is unranked and keeps its authored relative order at the end.
    const reordered = applyIntentStageOrder(AUTHORED_ORDER, ['pyq_anchor', 'practice']);
    expect(reordered.map((a) => a.id)).toEqual([
      'a-micro', // practice — ranked
      'a-hook', // unranked, authored order preserved
      'a-intuition',
      'a-formal',
      'a-worked',
      'a-traps',
    ]);
  });

  it('reorders an intuition-first sequence and keeps unmapped kinds (common_traps) at the end', () => {
    const reordered = applyIntentStageOrder(AUTHORED_ORDER, ['intuition', 'formalism', 'worked_example', 'practice']);
    expect(reordered.map((a) => a.id)).toEqual([
      'a-hook', // intuition
      'a-intuition', // intuition
      'a-formal', // formalism
      'a-worked', // worked_example
      'a-micro', // practice
      'a-traps', // unmapped — stays at the end, relative order preserved
    ]);
  });

  it('is stable: atoms mapped to the same stage keep their authored relative order', () => {
    const list: ContentAtom[] = [
      atom('a-hook', 'hook'), // intuition
      atom('a-visual', 'visual_analogy'), // intuition
      atom('a-intuition', 'intuition'), // intuition
    ];
    const reordered = applyIntentStageOrder(list, ['intuition']);
    expect(reordered.map((a) => a.id)).toEqual(['a-hook', 'a-visual', 'a-intuition']);
  });
});

describe('AtomCardRenderer — intentStageOrder prop', () => {
  it('renders the first atom in authored order when intentStageOrder is absent', () => {
    render(<AtomCardRenderer atoms={AUTHORED_ORDER} conceptId="eigenvalues" studentId="s1" />);
    expect(screen.getByText('body for a-hook')).toBeInTheDocument();
  });

  it('renders the first atom per the reordered sequence when intentStageOrder is provided', () => {
    render(
      <AtomCardRenderer
        atoms={AUTHORED_ORDER}
        conceptId="eigenvalues"
        studentId="s1"
        intentStageOrder={['pyq_anchor', 'practice']}
      />,
    );
    // micro_exercise (mapped to 'practice') should now be first on screen.
    expect(screen.getByText('body for a-micro')).toBeInTheDocument();
  });
});
