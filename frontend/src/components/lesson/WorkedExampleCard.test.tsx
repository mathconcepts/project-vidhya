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
import { render, screen } from '@testing-library/react';
import { AtomCardRenderer, type ContentAtom } from './AtomCardRenderer';

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
    expect(container.textContent).not.toContain('interactive-spec');
    expect(container.textContent).not.toContain('"kind"');
    expect(screen.getByText(/Step one: set up the matrix/)).toBeInTheDocument();
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
