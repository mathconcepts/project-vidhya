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
    // ...and the label backs the claim up while the switch is actually in effect.
    expect(screen.getByText(/streak switched modality/)).toBeInTheDocument();
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

    // Adversarial review (/ship, 2026-09-01): the footer label's own render
    // condition didn't check showVisually, so it kept claiming "switched
    // modality" even after this manual toggle-off put the ordering back to
    // normal — the same false-claim bug reintroduced through the one path
    // the earlier fixes didn't touch.
    expect(screen.queryByText(/streak switched modality/)).not.toBeInTheDocument();
  });

  it('a manual toggle-off still sticks even when visual mode was ALREADY on before the streak crossed 3 (cycle-2 fix)', async () => {
    // Bug (pre-landing review cycle 2, /ship 2026-09-01 — testing AND
    // red-team re-checks both independently found this): the cycle-1 fix
    // only marked `autoSwitchedRef` true when the effect itself performed
    // the flip. If showVisually was ALREADY true when the streak first hit
    // 3 (here: the student manually toggled it on before missing anything),
    // the effect returned via the `showVisually` branch without ever
    // marking the ref — so a manual toggle-OFF afterward, with the streak
    // still >= 3, found ref=false and got forced straight back on. Same
    // failure shape as the cycle-1 bug, reached through different state
    // ordering.
    render(<AtomCardRenderer atoms={ATOMS} conceptId="c" studentId="s1" />);

    // Student turns visual mode on manually, BEFORE missing anything.
    fireEvent.click(screen.getByLabelText('Show visual atoms first'));
    await waitFor(() => expect(screen.getByText('Visual card.')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Next')); // -> hook (reordered atoms[1])
    await waitFor(() => expect(screen.getByText('Hook card.')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Next')); // -> q1 (reordered atoms[2])
    await waitFor(() => expect(screen.getByText('Q1.')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Not yet')); // miss 1, -> q2
    await waitFor(() => expect(screen.getByText('Q2.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 2, -> q3
    await waitFor(() => expect(screen.getByText('Q3.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 3 — streak crosses 3 while ALREADY showing visually

    // Nothing to flip (already on) — stays on q3, no visible change.
    await waitFor(() => expect(screen.getByText('Q3.')).toBeInTheDocument());

    // Now the student manually turns visual mode back OFF.
    fireEvent.click(screen.getByLabelText('Show all atoms'));

    // Must land on the original (unreordered) front card and STAY there —
    // the broken cycle-1-only fix would immediately snap back to visual.
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
