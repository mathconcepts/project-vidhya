/**
 * AtomCardRenderer — error-streak auto modality switch.
 *
 * Bug (/investigate, 2026-09-01, "Recall section -> no wow, no learning
 * intuition"): the nav footer already printed "· streak switched modality"
 * once errorStreak reached 3, but nothing in the code ever switched the
 * modality — showVisually only ever flipped from the eye-icon button's own
 * manual tap. This locks in the real behavior: three consecutive "Not yet"
 * taps pulls the concept's visual-modality atoms to the front, same as the
 * student manually asking to "show me visually".
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  makeAtom({ id: 'c.hook', atom_type: 'hook', modality: 'text', content: 'Hook card.' }),
  makeAtom({ id: 'c.q1', atom_type: 'micro_exercise', content: 'Q1.' }),
  makeAtom({ id: 'c.q2', atom_type: 'micro_exercise', content: 'Q2.' }),
  makeAtom({ id: 'c.q3', atom_type: 'micro_exercise', content: 'Q3.' }),
  makeAtom({ id: 'c.visual', atom_type: 'visual_analogy', modality: 'visual', content: 'Visual card.' }),
];

describe('AtomCardRenderer — error-streak auto modality switch', () => {
  it('three consecutive "Not yet" taps promotes the visual-modality atom to the front', async () => {
    render(<AtomCardRenderer atoms={ATOMS} conceptId="c" studentId="s1" />);
    expect(screen.getByText('Hook card.')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Next')); // -> q1
    await waitFor(() => expect(screen.getByText('Q1.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 1, -> q2

    await waitFor(() => expect(screen.getByText('Q2.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 2, -> q3

    await waitFor(() => expect(screen.getByText('Q3.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 3 — crosses the threshold

    // The claimed switch is now real: the visual atom is pulled to the front
    // and the carousel jumps there.
    await waitFor(() => expect(screen.getByText('Visual card.')).toBeInTheDocument());
  });

  it('two misses (no third) never switches modality', async () => {
    render(<AtomCardRenderer atoms={ATOMS} conceptId="c" studentId="s1" />);
    fireEvent.click(screen.getByLabelText('Next')); // -> q1
    await waitFor(() => expect(screen.getByText('Q1.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 1, -> q2

    await waitFor(() => expect(screen.getByText('Q2.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 2, -> q3

    await waitFor(() => expect(screen.getByText('Q3.')).toBeInTheDocument());
    expect(screen.queryByText('Visual card.')).not.toBeInTheDocument();
  });
});
