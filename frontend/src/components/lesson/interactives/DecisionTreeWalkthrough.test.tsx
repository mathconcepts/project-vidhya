/**
 * DecisionTreeWalkthrough.test.tsx
 *
 * Locks the W2.5 widget contract:
 *   1. Sequential wizard — one question card per view, full-width 44px
 *      choice buttons, breadcrumb of the choices made, back navigation.
 *   2. Any branch is walkable to its leaf. The dead end IS the lesson, so
 *      a non-best leaf must render its reason and be walkable back from.
 *   3. Green marks the best leaf — the sanctioned exception. A non-best
 *      leaf gets neutral tokens and words: no red, no error styling, no
 *      hard-coded hex anywhere.
 *   4. Reason codes render as 17px sentences.
 *   5. Amendment E5: SELF-CHECK ONLY. The widget carries the honesty
 *      label and fires no request — nothing here reaches StudentModel.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { GuidedWalkthrough } from './GuidedWalkthrough';
import {
  DecisionTreeWalkthrough,
  BEST_HEADING,
  NOT_BEST_HEADING,
  SELF_CHECK_LABEL,
} from './DecisionTreeWalkthrough';
import type { GuidedWalkthroughSpec } from './types';
import { __testing } from './types';

const SPEC: GuidedWalkthroughSpec = {
  v: 1,
  kind: 'guided_walkthrough',
  title: 'Green, Stokes or Gauss?',
  steps: [{ prompt: 'What is the boundary?', answer: 'A curve or a surface.' }],
  branches: {
    v: 1,
    nodes: [
      {
        id: 'n_boundary',
        question: 'What is the integral taken over?',
        options: [
          { label: 'A closed curve C', next: 'n_flat' },
          { label: 'A surface S', next: 'leaf_gauss' },
        ],
      },
      {
        id: 'n_flat',
        question: 'Does the curve lie flat in a plane?',
        options: [
          { label: 'Yes, it is a plane curve', next: 'leaf_green' },
          { label: 'No, it is a space curve', next: 'leaf_stokes_wrong' },
        ],
      },
    ],
    leaves: [
      {
        id: 'leaf_green',
        method: "Green's theorem",
        reason: 'A flat closed curve bounds a region, so Green applies directly.',
        best: true,
      },
      {
        id: 'leaf_stokes_wrong',
        method: 'The divergence theorem',
        reason: 'A curve bounds no solid, so the divergence theorem has nothing to convert.',
        best: false,
      },
      {
        id: 'leaf_gauss',
        method: 'The Divergence Theorem',
        reason: 'A closed surface bounds a solid, so the flux becomes a triple integral.',
        best: true,
      },
    ],
  },
  caption: 'Every route is walkable.',
};

const TREE = SPEC as GuidedWalkthroughSpec & { branches: NonNullable<GuidedWalkthroughSpec['branches']> };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DecisionTreeWalkthrough — the spec routes here', () => {
  it('GuidedWalkthrough delegates to the wizard when branches are present', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    expect(screen.getByText('What is the integral taken over?')).toBeInTheDocument();
    // The linear reveal control must not also be on screen.
    expect(screen.queryByRole('button', { name: /show answer/i })).toBeNull();
  });

  it('GuidedWalkthrough still renders the linear reveal when branches are absent', () => {
    const linear: GuidedWalkthroughSpec = { ...SPEC, branches: undefined };
    render(<GuidedWalkthrough spec={linear} />);
    expect(screen.getByText('What is the boundary?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show answer/i })).toBeInTheDocument();
  });
});

describe('DecisionTreeWalkthrough — traversal', () => {
  it('shows one question at a time, then the next, then a leaf', () => {
    render(<DecisionTreeWalkthrough spec={TREE} />);
    expect(screen.getByText('What is the integral taken over?')).toBeInTheDocument();
    expect(screen.queryByText('Does the curve lie flat in a plane?')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'A closed curve C' }));
    expect(screen.queryByText('What is the integral taken over?')).toBeNull();
    expect(screen.getByText('Does the curve lie flat in a plane?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yes, it is a plane curve' }));
    expect(screen.queryByText('Does the curve lie flat in a plane?')).toBeNull();
    expect(screen.getByTestId('decision-leaf')).toBeInTheDocument();
  });

  it('renders every choice as a full-width button at the 44px touch floor', () => {
    render(<DecisionTreeWalkthrough spec={TREE} />);
    for (const label of ['A closed curve C', 'A surface S']) {
      const btn = screen.getByRole('button', { name: label });
      expect(btn.style.minHeight).toBe('44px');
      expect(btn.className).toContain('w-full');
      expect(btn.style.fontSize).toBe('var(--text-body)');
    }
  });

  it('builds a breadcrumb of the choices made', () => {
    render(<DecisionTreeWalkthrough spec={TREE} />);
    expect(screen.queryByTestId('decision-breadcrumb')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'A closed curve C' }));
    expect(screen.getByTestId('decision-breadcrumb')).toHaveTextContent('A closed curve C');

    fireEvent.click(screen.getByRole('button', { name: 'Yes, it is a plane curve' }));
    expect(screen.getByTestId('decision-breadcrumb')).toHaveTextContent(
      'A closed curve C → Yes, it is a plane curve',
    );
  });

  it('walks a wrong branch to its dead end, then walks back and re-decides', () => {
    render(<DecisionTreeWalkthrough spec={TREE} />);
    fireEvent.click(screen.getByRole('button', { name: 'A closed curve C' }));
    fireEvent.click(screen.getByRole('button', { name: 'No, it is a space curve' }));

    // The dead end IS the lesson: it is reached, not blocked, and it explains.
    const leaf = screen.getByTestId('decision-leaf');
    expect(leaf.getAttribute('data-best')).toBe('false');
    expect(within(leaf).getByText(NOT_BEST_HEADING)).toBeInTheDocument();
    expect(
      screen.getByText('A curve bounds no solid, so the divergence theorem has nothing to convert.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /walk back/i }));
    expect(screen.getByText('Does the curve lie flat in a plane?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yes, it is a plane curve' }));
    expect(screen.getByTestId('decision-leaf').getAttribute('data-best')).toBe('true');
  });

  it('start over returns to the root and clears the breadcrumb', () => {
    render(<DecisionTreeWalkthrough spec={TREE} />);
    fireEvent.click(screen.getByRole('button', { name: 'A surface S' }));
    expect(screen.getByTestId('decision-leaf')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start over/i }));
    expect(screen.getByText('What is the integral taken over?')).toBeInTheDocument();
    expect(screen.queryByTestId('decision-breadcrumb')).toBeNull();
  });

  it('disables back and start-over at the root — nowhere to go', () => {
    render(<DecisionTreeWalkthrough spec={TREE} />);
    expect(screen.getByRole('button', { name: /^back$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /start over/i })).toBeDisabled();
  });
});

describe('DecisionTreeWalkthrough — colour discipline', () => {
  it('marks the best leaf with green — the sanctioned exception', () => {
    render(<DecisionTreeWalkthrough spec={TREE} />);
    fireEvent.click(screen.getByRole('button', { name: 'A surface S' }));

    const leaf = screen.getByTestId('decision-leaf');
    expect(leaf.getAttribute('data-best')).toBe('true');
    expect(leaf.style.background).toBe('var(--green-tint)');
    expect(within(leaf).getByText(BEST_HEADING)).toHaveStyle({ color: 'var(--green-ink)' });
  });

  it('gives a non-best leaf neutral tokens and words — no red, no green', () => {
    render(<DecisionTreeWalkthrough spec={TREE} />);
    fireEvent.click(screen.getByRole('button', { name: 'A closed curve C' }));
    fireEvent.click(screen.getByRole('button', { name: 'No, it is a space curve' }));

    const leaf = screen.getByTestId('decision-leaf');
    const markup = leaf.outerHTML;
    expect(markup).not.toContain('--red');
    expect(markup).not.toContain('--green');
    expect(markup).not.toMatch(/error|danger|destructive/i);
    expect(leaf.style.background).toBe('var(--surface-card)');
    expect(leaf.style.borderColor).toBe('var(--separator)');
  });

  it('hard-codes no colour anywhere in the widget', () => {
    const { container } = render(<DecisionTreeWalkthrough spec={TREE} />);
    fireEvent.click(screen.getByRole('button', { name: 'A surface S' }));
    const markup = container.innerHTML;
    expect(markup).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(markup).not.toMatch(/rgba?\(/i);
  });
});

describe('DecisionTreeWalkthrough — 17px floor', () => {
  it('renders the question, the method and the reason sentence at the body token', () => {
    render(<DecisionTreeWalkthrough spec={TREE} />);
    expect(screen.getByText('What is the integral taken over?')).toHaveStyle({
      fontSize: 'var(--text-body)',
    });

    fireEvent.click(screen.getByRole('button', { name: 'A surface S' }));
    expect(screen.getByText('The Divergence Theorem')).toHaveStyle({ fontSize: 'var(--text-body)' });
    // Reason codes render as sentences, never codes — and never below 17px.
    const reason = screen.getByTestId('decision-leaf-reason');
    expect(reason).toHaveStyle({ fontSize: 'var(--text-body)' });
    expect(reason.textContent!.split(/\s+/).length).toBeGreaterThan(4);
  });
});

describe('DecisionTreeWalkthrough — E5: self-check only', () => {
  it('carries the honesty label', () => {
    render(<DecisionTreeWalkthrough spec={TREE} />);
    expect(screen.getByText(SELF_CHECK_LABEL)).toBeInTheDocument();
    expect(SELF_CHECK_LABEL).toContain('not exam grading');
    expect(SELF_CHECK_LABEL).toContain('no marks recorded');
  });

  it('fires no request while a student walks the whole tree', () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error('the widget must not call the network')));
    vi.stubGlobal('fetch', fetchSpy);
    const beacon = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: beacon });

    render(<DecisionTreeWalkthrough spec={TREE} />);
    fireEvent.click(screen.getByRole('button', { name: 'A closed curve C' }));
    fireEvent.click(screen.getByRole('button', { name: 'No, it is a space curve' }));
    fireEvent.click(screen.getByRole('button', { name: /walk back/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, it is a plane curve' }));
    fireEvent.click(screen.getByRole('button', { name: /start over/i }));
    fireEvent.click(screen.getByRole('button', { name: 'A surface S' }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
  });

  it('takes no grading callback — reaching a leaf cannot reach StudentModel', () => {
    // Structural, not behavioural: the component's props are {spec} alone.
    // A future onLeaf/onGraded prop would be the hole E5 closes, so the
    // source must stay free of one.
    const source = DecisionTreeWalkthrough.toString();
    expect(source).not.toMatch(/onGrade|onAnswer|onComplete|onLeaf|recordAttempt/);
  });
});

describe('DecisionTreeWalkthrough — the fixture is a legal spec', () => {
  it('passes the shared validator, so this test cannot drift from the renderer', () => {
    expect(__testing.validateSpec(SPEC).ok).toBe(true);
  });
});
