/**
 * GuidedWalkthrough.test.tsx
 *
 * T11 — GuidedWalkthrough is 105 of 125 interactive uses in the corpus, so
 * these tests lock the DESIGN-SYSTEM.md non-negotiables it was violating:
 *   1. 17px floor for anything a student reads (13px only for the step
 *      counter and caption — genuine metadata).
 *   2. 44px minimum touch target on the advance button.
 *   3. Indigo stays reserved for AI/tutor/study-plan surfaces; this is a
 *      lesson control, so it gets neutral tokens instead.
 *   4. Revealed ≠ correct: the answer reveal must not use the mastery-green
 *      "correct" treatment, and progress dots must not imply grading.
 *   5. Motion honors the token curve/duration and prefers-reduced-motion.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  GuidedWalkthrough,
  EASE_STANDARD,
  DUR_FAST_S,
  revealTransitionDuration,
} from './GuidedWalkthrough';
import type { GuidedWalkthroughSpec } from './types';

const SPEC: GuidedWalkthroughSpec = {
  v: 1,
  kind: 'guided_walkthrough',
  title: 'Solve det(A) = 0',
  steps: [
    {
      prompt: 'What is the characteristic polynomial?',
      hint: 'Look at det(A − λI).',
      answer: 'λ² − 5λ + 6.',
      eqn: 'det(A - lambda*I) = 0',
    },
    {
      prompt: 'Now factor it.',
      answer: '(λ − 2)(λ − 3).',
    },
  ],
  caption: 'Eigenvalues of a 2x2 matrix.',
};

const FORBIDDEN_TEXT_SIZES = ['text-xs', 'text-sm', 'text-[11px]', 'text-[10px]'];

describe('GuidedWalkthrough — 17px floor', () => {
  it('renders the title and prompt at the body token (17px), not a Tailwind sub-body class', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    const title = screen.getByText('Solve det(A) = 0');
    expect(title.style.fontSize).toBe('var(--text-body)');
    FORBIDDEN_TEXT_SIZES.forEach((cls) => expect(title.className).not.toContain(cls));

    const prompt = screen.getByText('What is the characteristic polynomial?');
    expect(prompt.style.fontSize).toBe('var(--text-body)');
    FORBIDDEN_TEXT_SIZES.forEach((cls) => expect(prompt.className).not.toContain(cls));
  });

  it('renders the eqn block at the body token', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    const eqn = screen.getByText('det(A - lambda*I) = 0');
    expect(eqn.style.fontSize).toBe('var(--text-body)');
  });

  it('renders the hint at the body token once revealed', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    const hint = screen.getByText('Look at det(A − λI).');
    expect(hint.style.fontSize).toBe('var(--text-body)');
  });

  it('renders the answer — the payoff — at the body token, not text-xs', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    const answer = screen.getByText('λ² − 5λ + 6.');
    expect(answer.style.fontSize).toBe('var(--text-body)');
    FORBIDDEN_TEXT_SIZES.forEach((cls) => expect(answer.className).not.toContain(cls));
  });

  it('renders the advance button label at the body token', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    const btn = screen.getByRole('button', { name: /show hint/i });
    expect(btn.style.fontSize).toBe('var(--text-body)');
  });

  it('permits 13px (--text-footnote) ONLY for the step counter and caption — genuine metadata, not content', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    const counter = screen.getByText('Step 1 / 2');
    expect(counter.style.fontSize).toBe('var(--text-footnote)');
    const caption = screen.getByText('Eigenvalues of a 2x2 matrix.');
    expect(caption.style.fontSize).toBe('var(--text-footnote)');
  });
});

describe('GuidedWalkthrough — 44px touch target', () => {
  it('the advance button meets the 44px minimum touch target', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    const btn = screen.getByRole('button', { name: /show hint/i });
    expect(btn.style.minHeight).toBe('44px');
    expect(btn.className).not.toMatch(/py-1\.5/);
  });
});

describe('GuidedWalkthrough — reserved indigo', () => {
  it('never sets an indigo token or literal anywhere in the rendered tree', () => {
    const { container } = render(<GuidedWalkthrough spec={SPEC} />);
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    const html = container.innerHTML;
    expect(html).not.toMatch(/--indigo/);
    expect(html).not.toMatch(/rgba\(88,\s*86,\s*214/);
    expect(html).not.toMatch(/#5856d6/i);
    expect(html).not.toMatch(/#4340b5/i);
  });

  it('uses the neutral --surface-fill-strong token on the advance button, not --indigo', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    const btn = screen.getByRole('button', { name: /show hint/i });
    expect(btn.style.background).toBe('var(--surface-fill-strong)');
  });
});

describe('GuidedWalkthrough — revealed ≠ correct', () => {
  it('the revealed answer is NOT rendered in mastery green', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    const answer = screen.getByText('λ² − 5λ + 6.');
    expect(answer.style.color).not.toBe('var(--green-ink)');
    expect(answer.style.color).not.toBe('var(--green)');
  });

  it('progress dots for revealed steps use a neutral fill, never green or indigo', () => {
    const { container } = render(<GuidedWalkthrough spec={SPEC} />);
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    fireEvent.click(screen.getByRole('button', { name: /show answer/i })); // step 1 now "revealed"
    const dots = container.querySelectorAll<HTMLElement>('.flex-1.h-1.rounded-full');
    expect(dots.length).toBe(2);
    const revealedDot = dots[0];
    expect(revealedDot.style.background).toBe('var(--surface-fill-strong)');
    expect(revealedDot.style.background).not.toMatch(/52,\s*199,\s*89/); // no green
    expect(revealedDot.style.background).not.toMatch(/88,\s*86,\s*214/); // no indigo
  });
});

describe('GuidedWalkthrough — motion', () => {
  it('the token curve and --dur-fast are the values the component actually uses', () => {
    expect(EASE_STANDARD).toEqual([0.32, 0.72, 0, 1]);
    expect(DUR_FAST_S).toBe(0.18);
  });

  it('collapses to ~1ms under prefers-reduced-motion, matching the CSS token contract', () => {
    expect(revealTransitionDuration(false)).toBe(0.18);
    expect(revealTransitionDuration(true)).toBe(0.001);
  });
});

describe('GuidedWalkthrough — reveal pacing (unchanged behavior)', () => {
  it('advances prompt -> hint -> answer -> next step, and disables on the final answer', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    expect(screen.getByText(/Step 1 \/ 2/)).toBeInTheDocument();
    expect(screen.queryByText('Look at det(A − λI).')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    expect(screen.getByText('Look at det(A − λI).')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    expect(screen.getByText('λ² − 5λ + 6.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next step/i }));
    expect(screen.getByText(/Step 2 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText('Now factor it.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    const doneBtn = screen.getByRole('button', { name: /done/i });
    expect(doneBtn).toBeDisabled();
  });
});
