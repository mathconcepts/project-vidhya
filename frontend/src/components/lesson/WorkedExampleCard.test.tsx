/**
 * WorkedExampleCard — T19a/T19b/T20 defect fixes.
 *
 * T19a: an interactive-spec fenced block must never render as visible JSON
 *       text inside a worked_example's step boxes.
 * T19b: steps render as hairline-separated rows (no per-step filled/bordered
 *       box), whether there are 2 steps or 8 — DESIGN-SYSTEM.md "Layout &
 *       density": one focal block per screen, everything else plain text or
 *       hairline-separated rows.
 * T20: applyScaffoldingFade must no-op (serve the body whole, unfaded) when
 *      the atom's served_stance is 'shaken', and must still fade normally
 *      for non-shaken atoms (regression).
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AtomCardRenderer, type ContentAtom } from './AtomCardRenderer';

/**
 * /investigate (2026-09-03, live-QA: "Solve like a progression") made steps
 * beyond the first tap-to-reveal (WorkedExampleCard's "Show next step"
 * button) — a test asserting a later step's text is now expected to click
 * through to it first. Clicks past whatever's currently the last revealed
 * step; a no-op once nothing is left to reveal.
 */
function revealAllSteps() {
  let button = screen.queryByRole('button', { name: 'Show next step' });
  while (button) {
    fireEvent.click(button);
    button = screen.queryByRole('button', { name: 'Show next step' });
  }
}

function makeAtom(overrides: Partial<ContentAtom> = {}): ContentAtom {
  return {
    id: 'determinants.worked-example',
    concept_id: 'determinants',
    atom_type: 'worked_example',
    bloom_level: 3,
    difficulty: 0.4,
    exam_ids: ['*'],
    content: 'Step one: expand along the first row.',
    ...overrides,
  };
}

const SPEC_BLOCK = [
  '```interactive-spec',
  JSON.stringify({
    v: 1,
    kind: 'guided_walkthrough',
    title: 'Walk through it',
    steps: [{ prompt: 'What next?', answer: '42' }],
  }),
  '```',
].join('\n');

describe('T19a — interactive-spec must not render as visible JSON in worked_example', () => {
  it('strips the fenced spec block out of a single-step body', () => {
    const atom = makeAtom({
      content: `Expand along the first row.\n\n${SPEC_BLOCK}`,
    });
    const { container } = render(
      <AtomCardRenderer atoms={[atom]} conceptId="determinants" studentId="s1" />,
    );
    expect(container.textContent).not.toContain('interactive-spec');
    expect(container.textContent).not.toContain('"kind":"guided_walkthrough"');
    expect(container.textContent).not.toContain('guided_walkthrough');
    expect(screen.getByText(/Expand along the first row/)).toBeInTheDocument();
  });

  it('strips the fenced spec block when it trails the last of several --- separated steps', () => {
    const atom = makeAtom({
      content: [
        'Step one: set up the matrix.',
        '---',
        `Step two: expand along the first row.\n\n${SPEC_BLOCK}`,
      ].join('\n'),
    });
    const { container } = render(
      <AtomCardRenderer atoms={[atom]} conceptId="determinants" studentId="s1" />,
    );
    expect(screen.getByText(/Step one: set up the matrix/)).toBeInTheDocument();
    revealAllSteps();
    expect(container.textContent).not.toContain('interactive-spec');
    expect(container.textContent).not.toContain('"kind"');
    expect(screen.getByText(/Step two: expand along the first row/)).toBeInTheDocument();
  });
});

describe('T19b — steps render as hairline rows, not nested filled boxes', () => {
  it('renders many steps without any per-step border/background box', () => {
    const eightSteps = Array.from({ length: 8 }, (_, i) => `Step ${i + 1} of the shaken walkthrough.`);
    const atom = makeAtom({
      id: 'eigenvalues.worked-example-shaken',
      concept_id: 'eigenvalues',
      content: eightSteps.join('\n---\n'),
    });
    const { container } = render(
      <AtomCardRenderer atoms={[atom]} conceptId="eigenvalues" studentId="s1" />,
    );
    revealAllSteps();
    // No step row should carry its own border/background box styling —
    // only the outer focal card (rendered by AtomCardRenderer itself) does.
    const stepRows = container.querySelectorAll('.py-3.text-sm.leading-relaxed');
    expect(stepRows.length).toBe(8);
    for (const row of stepRows) {
      const style = (row as HTMLElement).style;
      expect(style.background).toBe('');
      expect(style.borderRadius).toBe('');
      expect(style.border).toBe('');
    }
    for (let i = 0; i < 8; i++) {
      expect(screen.getByText(new RegExp(`Step ${i + 1} of the shaken walkthrough`))).toBeInTheDocument();
    }
  });
});

describe('T20 — shaken stance must not be faded', () => {
  it('serves the shaken variant whole and unfaded, even on repeated revisits', () => {
    const atom = makeAtom({
      id: 'eigenvalues.worked-example-shaken',
      concept_id: 'eigenvalues',
      scaffold_fade: true,
      engagement_count: 3,
      served_stance: 'shaken',
      content: [
        'Step one: set up the characteristic equation.',
        '---',
        'Step two: solve for lambda.',
        '---',
        'Step three: verify — plug lambda back in. Answer: lambda = 2, -1.',
      ].join('\n'),
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="eigenvalues" studentId="s1" />);
    revealAllSteps();
    // The verification/answer step must be visible, not blanked.
    expect(screen.getByText(/Answer: lambda = 2, -1/)).toBeInTheDocument();
    expect(screen.queryByText('(work this step out yourself)')).toBeNull();
  });

  it('regression: a non-shaken atom still fades trailing steps on revisit', () => {
    const atom = makeAtom({
      id: 'eigenvalues.worked-example',
      concept_id: 'eigenvalues',
      scaffold_fade: true,
      engagement_count: 2,
      // served_stance intentionally unset — base body, not a stance variant
      content: [
        'Step one: set up the characteristic equation.',
        '---',
        'Step two: solve for lambda.',
        '---',
        'Step three: verify — plug lambda back in. Answer: lambda = 2, -1.',
      ].join('\n'),
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="eigenvalues" studentId="s1" />);
    expect(screen.getByText(/Step one: set up the characteristic equation/)).toBeInTheDocument();
    // engagement_count=2 blanks the last min(2, 2)=2 steps.
    expect(screen.queryByText(/Answer: lambda = 2, -1/)).toBeNull();
    const blanked = screen.getAllByText('(work this step out yourself)');
    expect(blanked.length).toBe(2);
  });

  it('regression: assured stance still fades normally (only shaken is exempt)', () => {
    const atom = makeAtom({
      id: 'eigenvalues.worked-example-assured',
      concept_id: 'eigenvalues',
      scaffold_fade: true,
      engagement_count: 1,
      served_stance: 'assured',
      content: [
        'Step one: set up the characteristic equation.',
        '---',
        'Step two: verify — Answer: lambda = 2, -1.',
      ].join('\n'),
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="eigenvalues" studentId="s1" />);
    expect(screen.queryByText(/Answer: lambda = 2, -1/)).toBeNull();
    expect(screen.getByText('(work this step out yourself)')).toBeInTheDocument();
  });
});

// Regression (/investigate, 2026-09-03, live-QA: "Solve like a progression.
// A visual delight can provide better context"). Every step used to land
// on screen within the same render pass — a cosmetic stagger, not an
// actual reveal, since `blanked` is 0 on a first view. Steps within
// `visibleCount` (the scaffold-fade ceiling) now reveal one tap at a time.
describe('Progressive step reveal (/investigate, 2026-09-03)', () => {
  it('shows only step one on first render, with a Show next step button', () => {
    const atom = makeAtom({
      content: ['Step one: setup.', '---', 'Step two: solve.', '---', 'Step three: verify.'].join('\n'),
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="determinants" studentId="s1" />);
    expect(screen.getByText(/Step one: setup/)).toBeInTheDocument();
    expect(screen.queryByText(/Step two: solve/)).toBeNull();
    expect(screen.queryByText(/Step three: verify/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Show next step' })).toBeInTheDocument();
  });

  it('reveals one more step per click, accumulating rather than replacing', () => {
    const atom = makeAtom({
      content: ['Step one: setup.', '---', 'Step two: solve.', '---', 'Step three: verify.'].join('\n'),
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="determinants" studentId="s1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Show next step' }));
    expect(screen.getByText(/Step one: setup/)).toBeInTheDocument();
    expect(screen.getByText(/Step two: solve/)).toBeInTheDocument();
    expect(screen.queryByText(/Step three: verify/)).toBeNull();
  });

  it('the button disappears once every workable step has been revealed', () => {
    const atom = makeAtom({
      content: ['Step one: setup.', '---', 'Step two: solve.'].join('\n'),
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="determinants" studentId="s1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Show next step' }));
    expect(screen.getByText(/Step two: solve/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show next step' })).toBeNull();
  });

  it('a single-step worked example needs no button at all', () => {
    const atom = makeAtom({ content: 'Step one: the whole thing.' });
    render(<AtomCardRenderer atoms={[atom]} conceptId="determinants" studentId="s1" />);
    expect(screen.getByText(/Step one: the whole thing/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show next step' })).toBeNull();
  });

  it('a scaffold-blanked repeat view never grows a reveal button for steps it must not show', () => {
    // visibleCount = 1 (2 steps, engagement_count=1 blanks the last 1) —
    // nothing left to progressively reveal beyond the one workable step.
    const atom = makeAtom({
      scaffold_fade: true,
      engagement_count: 1,
      content: ['Step one: setup.', '---', 'Step two: solve. Answer: 7.'].join('\n'),
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="determinants" studentId="s1" />);
    expect(screen.getByText(/Step one: setup/)).toBeInTheDocument();
    expect(screen.getByText('(work this step out yourself)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show next step' })).toBeNull();
  });
});

// Regression (/investigate, 2026-09-03). \boxed{} is the standard KaTeX
// command for a final boxed answer — the step containing it renders through
// the dedicated settle-flash wrapper instead of the plain per-step fade
// every other step gets, without changing what text is on screen.
describe('Boxed-answer settle flash', () => {
  it('renders a step containing \\boxed{} through the highlighted wrapper', () => {
    const atom = makeAtom({
      content: ['Step one: setup.', '---', 'Step two: $\\boxed{x = 7}$'].join('\n'),
    });
    const { container } = render(<AtomCardRenderer atoms={[atom]} conceptId="determinants" studentId="s1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Show next step' }));
    // KaTeX renders \boxed{} into its own markup — assert on the VISIBLE
    // rendering (`.katex-html`), not `container.textContent` as a whole,
    // which also picks up KaTeX's own hidden MathML accessibility
    // annotation that legitimately embeds the raw LaTeX source by design.
    expect(container.querySelector('.katex')).not.toBeNull();
    const visible = container.querySelector('.katex-html');
    expect(visible?.textContent ?? '').not.toContain('\\boxed');
  });

  it('a step with no boxed answer renders through the plain path (no crash, same text)', () => {
    const atom = makeAtom({ content: 'Step one: no boxed answer here.' });
    render(<AtomCardRenderer atoms={[atom]} conceptId="determinants" studentId="s1" />);
    expect(screen.getByText(/Step one: no boxed answer here/)).toBeInTheDocument();
  });
});
