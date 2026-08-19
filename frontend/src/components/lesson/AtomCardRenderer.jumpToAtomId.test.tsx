/**
 * AtomCardRenderer — jumpToAtomId prop (walkthrough rail's Interactive leg:
 * "jump to the first interactive atom").
 *
 * The prop is additive and optional — every pre-existing call site that
 * omits it (PracticePage, DailyCardsPage, the tests above this file) must
 * render exactly as before.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

const ATOMS: ContentAtom[] = [
  makeAtom({ id: 'c.hook', atom_type: 'hook', content: 'First card — the hook.' }),
  makeAtom({ id: 'c.intuition', atom_type: 'intuition', content: 'Second card — the intuition.' }),
  makeAtom({ id: 'c.worked', atom_type: 'worked_example', content: 'Third card — a worked example.\n\nProblem text here.' }),
];

describe('AtomCardRenderer — jumpToAtomId', () => {
  it('omitted (undefined): renders the first atom, same as before the prop existed', () => {
    render(<AtomCardRenderer atoms={ATOMS} conceptId="c" studentId="s1" />);
    expect(screen.getByText('First card — the hook.')).toBeInTheDocument();
  });

  it('jumps straight to the requested atom on initial render', async () => {
    render(<AtomCardRenderer atoms={ATOMS} conceptId="c" studentId="s1" jumpToAtomId="c.worked" />);
    await waitFor(() => expect(screen.getByText(/Third card/)).toBeInTheDocument());
    expect(screen.queryByText('First card — the hook.')).not.toBeInTheDocument();
  });

  it('an id not present in atoms is a no-op — stays on the current card', async () => {
    render(<AtomCardRenderer atoms={ATOMS} conceptId="c" studentId="s1" jumpToAtomId="not-a-real-atom-id" />);
    await waitFor(() => expect(screen.getByText('First card — the hook.')).toBeInTheDocument());
  });

  it('re-jumps when the prop changes to a different atom id after mount', async () => {
    const { rerender } = render(
      <AtomCardRenderer atoms={ATOMS} conceptId="c" studentId="s1" jumpToAtomId={null} />,
    );
    await waitFor(() => expect(screen.getByText('First card — the hook.')).toBeInTheDocument());

    rerender(<AtomCardRenderer atoms={ATOMS} conceptId="c" studentId="s1" jumpToAtomId="c.intuition" />);
    await waitFor(() => expect(screen.getByText('Second card — the intuition.')).toBeInTheDocument());
  });
});
