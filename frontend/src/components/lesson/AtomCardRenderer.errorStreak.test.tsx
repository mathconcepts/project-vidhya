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

  it('a fourth consecutive miss, after the switch already happened, does not re-jump the student back to the front', async () => {
    // Idempotency guard on the effect (`!showVisually`): once the switch has
    // fired, a later miss must not keep dragging the student's own
    // navigation back to index 0 every render — it should just advance
    // normally, same as any other miss.
    render(<AtomCardRenderer atoms={ATOMS} conceptId="c" studentId="s1" />);
    fireEvent.click(screen.getByLabelText('Next')); // -> q1
    await waitFor(() => expect(screen.getByText('Q1.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 1, -> q2
    await waitFor(() => expect(screen.getByText('Q2.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 2, -> q3
    await waitFor(() => expect(screen.getByText('Q3.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 3 — switch fires, jumps to index 0

    await waitFor(() => expect(screen.getByText('Visual card.')).toBeInTheDocument());

    // The student navigates forward past the promoted visual atom on their own.
    fireEvent.click(screen.getByLabelText('Next')); // -> hook (reordered atoms[1])
    await waitFor(() => expect(screen.getByText('Hook card.')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Next')); // -> q1 (reordered atoms[2])
    await waitFor(() => expect(screen.getByText('Q1.')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Not yet')); // miss 4 — errorStreak >= 3 again, but showVisually is already true

    // Advances normally to the next card in the reordered sequence (q2), not
    // reset back to the visual card at index 0.
    await waitFor(() => expect(screen.getByText('Q2.')).toBeInTheDocument());
    expect(screen.queryByText('Visual card.')).not.toBeInTheDocument();
  });

  it('a manual toggle-off after the auto-switch sticks, even though the streak is still >= 3 (red-team CRITICAL fix)', async () => {
    // Bug (pre-landing review, /ship 2026-09-01): the original effect
    // guard was `errorStreak < 3 || showVisually` — once the streak hit 3
    // and never dropped (only a CORRECT answer resets it), toggling
    // showVisually back to false for ANY reason, including the student's
    // own manual tap, made the guard true again on the very next render
    // and the effect silently flipped it straight back to true. The
    // manual "show me visually" control was effectively dead until the
    // student happened to get a recall right.
    render(<AtomCardRenderer atoms={ATOMS} conceptId="c" studentId="s1" />);
    fireEvent.click(screen.getByLabelText('Next')); // -> q1
    await waitFor(() => expect(screen.getByText('Q1.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 1, -> q2
    await waitFor(() => expect(screen.getByText('Q2.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 2, -> q3
    await waitFor(() => expect(screen.getByText('Q3.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 3 — auto-switch fires

    await waitFor(() => expect(screen.getByText('Visual card.')).toBeInTheDocument());

    // Student manually turns visual mode back off via the eye-icon toggle.
    fireEvent.click(screen.getByLabelText('Show all atoms'));

    // Must land back on the ORIGINAL (unreordered) front card and STAY
    // there — errorStreak is still 3, so a broken guard would immediately
    // re-flip showVisually and snap right back to the visual card.
    await waitFor(() => expect(screen.getByText('Hook card.')).toBeInTheDocument());
    expect(screen.queryByText('Visual card.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Show visual atoms first')).toBeInTheDocument();
  });

  it('never claims a modality switch when the concept has no visual-modality atom to switch to', async () => {
    // Bug (pre-landing review, /ship 2026-09-01): flipping showVisually on
    // a concept with no visual/visual_analogy atom is a no-op on ordering
    // (the `atoms` memo's own `visual.length === 0` fallback), but the
    // effect still reset the carousel to index 0 and the footer still
    // claimed "· streak switched modality" — the exact "label claims
    // something that didn't happen" bug class this whole feature exists
    // to close, just triggered a different way.
    const noVisualAtoms: ContentAtom[] = [
      makeAtom({ id: 'c.hook', atom_type: 'hook', modality: 'text', content: 'Hook card.' }),
      makeAtom({ id: 'c.q1', atom_type: 'micro_exercise', content: 'Q1.' }),
      makeAtom({ id: 'c.q2', atom_type: 'micro_exercise', content: 'Q2.' }),
      makeAtom({ id: 'c.q3', atom_type: 'micro_exercise', content: 'Q3.' }),
      makeAtom({ id: 'c.q4', atom_type: 'micro_exercise', content: 'Q4.' }),
    ];
    render(<AtomCardRenderer atoms={noVisualAtoms} conceptId="c" studentId="s1" />);
    fireEvent.click(screen.getByLabelText('Next')); // -> q1
    await waitFor(() => expect(screen.getByText('Q1.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 1, -> q2
    await waitFor(() => expect(screen.getByText('Q2.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 2, -> q3
    await waitFor(() => expect(screen.getByText('Q3.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 3 — crosses the threshold, nothing to switch to

    // Advances normally to q4 — no reset to index 0, no false claim.
    await waitFor(() => expect(screen.getByText('Q4.')).toBeInTheDocument());
    expect(screen.queryByText(/streak switched modality/)).not.toBeInTheDocument();
  });
});
