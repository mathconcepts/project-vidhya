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
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  GuidedWalkthrough,
  EASE_STANDARD,
  DUR_FAST_S,
  revealTransitionDuration,
} from './GuidedWalkthrough';
import type { GuidedWalkthroughSpec } from './types';

// The engagement gate (/design-review, 2026-09-06 — see
// useEngagementGate.ts) disables the advance button until a minimum
// think-time elapses after each phase transition. Every test below that
// clicks the advance button now runs under fake timers and advances past
// the gate's 5000ms ceiling first, so these tests keep asserting the
// SAME reveal-pacing behavior they always did — the gate itself has its
// own dedicated describe block + useEngagementGate.test.ts.
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});
async function clearGate() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(6000);
  });
}

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

    // Prompt/hint/answer now route through MarkdownAtomRenderer (T-latex-fix)
    // so KaTeX renders instead of raw source; the 17px floor comes from the
    // `.vidhya-atom-body` class (globals.css) rather than an inline style.
    const prompt = screen.getByText('What is the characteristic polynomial?');
    expect(prompt.closest('.vidhya-atom-body')).not.toBeNull();
    FORBIDDEN_TEXT_SIZES.forEach((cls) => expect(prompt.className).not.toContain(cls));
  });

  it('renders the eqn block at the body token', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    const eqn = screen.getByText('det(A - lambda*I) = 0');
    expect(eqn.style.fontSize).toBe('var(--text-body)');
  });

  it('renders the hint at the body token once revealed', async () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    const hint = screen.getByText('Look at det(A − λI).');
    expect(hint.closest('.vidhya-atom-body')).not.toBeNull();
  });

  it('renders the answer — the payoff — at the body token, not text-xs', async () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    const answer = screen.getByText('λ² − 5λ + 6.');
    expect(answer.closest('.vidhya-atom-body')).not.toBeNull();
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
  it('never sets an indigo token or literal anywhere in the rendered tree', async () => {
    const { container } = render(<GuidedWalkthrough spec={SPEC} />);
    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    await clearGate();
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
  it('the revealed answer is NOT rendered in mastery green', async () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    const answer = screen.getByText('λ² − 5λ + 6.');
    expect(answer.style.color).not.toBe('var(--green-ink)');
    expect(answer.style.color).not.toBe('var(--green)');
  });

  it('progress dots for revealed steps use a neutral fill, never green or indigo', async () => {
    const { container } = render(<GuidedWalkthrough spec={SPEC} />);
    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    await clearGate();
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

describe('GuidedWalkthrough — LaTeX renders, not raw source (bug #3, live QA)', () => {
  const LATEX_SPEC: GuidedWalkthroughSpec = {
    v: 1,
    kind: 'guided_walkthrough',
    title: 'Find rank and nullity',
    steps: [
      {
        prompt: 'Find the rank of $A = \\begin{pmatrix} 1 & 2 \\\\ 2 & 4 \\end{pmatrix}$.',
        hint: 'Row-reduce: $R_2 \\to R_2 - 2R_1$.',
        answer: 'rank$(A) = 1$, so nullity$(A) = 2 - 1 = 1$.',
      },
    ],
  };

  // KaTeX's own MathML fallback legitimately embeds the raw $-delimited
  // source in a screen-reader-only <annotation> node — that's correct
  // accessibility behavior, not the bug. The bug (and the regression this
  // guards) is the whole raw markdown string flowing as ONE flat text
  // node, exactly as the old `<p>{currentStep.prompt}</p>` interpolation
  // rendered it. So assert no element's full textContent equals the raw
  // source verbatim, and that KaTeX actually produced `.katex` output.
  function queryExactText(container: HTMLElement, raw: string) {
    return Array.from(container.querySelectorAll('p, div')).find((el) => el.textContent === raw) ?? null;
  }

  it('renders the prompt through KaTeX instead of showing raw $...$ source', () => {
    const { container } = render(<GuidedWalkthrough spec={LATEX_SPEC} />);
    expect(queryExactText(container, LATEX_SPEC.steps[0].prompt)).toBeNull();
    expect(container.querySelector('.katex')).not.toBeNull();
  });

  it('renders the hint and (once revealed) the answer through KaTeX too', async () => {
    const { container } = render(<GuidedWalkthrough spec={LATEX_SPEC} />);
    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    expect(queryExactText(container, LATEX_SPEC.steps[0].hint!)).toBeNull();
    // A second .katex block for the hint's inline math.
    expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(2);

    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    expect(queryExactText(container, LATEX_SPEC.steps[0].answer)).toBeNull();
    expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(3);
  });
});

describe('GuidedWalkthrough — reveal pacing (unchanged behavior)', () => {
  it('advances prompt -> hint -> answer -> next step, and disables on the final answer', async () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    expect(screen.getByText(/Step 1 \/ 2/)).toBeInTheDocument();
    expect(screen.queryByText('Look at det(A − λI).')).not.toBeInTheDocument();

    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));
    expect(screen.getByText('Look at det(A − λI).')).toBeInTheDocument();

    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    expect(screen.getByText('λ² − 5λ + 6.')).toBeInTheDocument();

    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /next step/i }));
    expect(screen.getByText(/Step 2 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText('Now factor it.')).toBeInTheDocument();

    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    const doneBtn = screen.getByRole('button', { name: /done/i });
    expect(doneBtn).toBeDisabled();
  });
});

describe('GuidedWalkthrough — engagement gate (/design-review, 2026-09-06)', () => {
  it('disables the advance button immediately after a new phase appears', () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    expect(screen.getByRole('button', { name: /show hint/i })).toBeDisabled();
  });

  it('shows "Read this, then continue" while gated, and it disappears once ready', async () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    expect(screen.getByText('Read this, then continue')).toBeInTheDocument();
    await clearGate();
    expect(screen.queryByText('Read this, then continue')).not.toBeInTheDocument();
  });

  it('a click before the gate elapses is a no-op; the button works once ready', async () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    const btn = screen.getByRole('button', { name: /show hint/i });
    fireEvent.click(btn);
    expect(screen.queryByText('Look at det(A − λI).')).not.toBeInTheDocument();

    await clearGate();
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(screen.getByText('Look at det(A − λI).')).toBeInTheDocument();
  });

  it('re-arms on every phase transition — revealing the hint locks "Show answer" again', async () => {
    render(<GuidedWalkthrough spec={SPEC} />);
    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show hint/i }));

    const answerBtn = screen.getByRole('button', { name: /show answer/i });
    expect(answerBtn).toBeDisabled();

    await clearGate();
    expect(answerBtn).not.toBeDisabled();
  });

  it('does not show the gate microcopy on the final disabled "Done" state', async () => {
    const ONE_STEP_SPEC: GuidedWalkthroughSpec = {
      v: 1,
      kind: 'guided_walkthrough',
      title: 'One-step check',
      steps: [{ prompt: 'Prompt.', answer: 'Answer.' }],
    };
    render(<GuidedWalkthrough spec={ONE_STEP_SPEC} />);
    await clearGate();
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    expect(screen.getByRole('button', { name: /done/i })).toBeDisabled();
    expect(screen.queryByText('Read this, then continue')).not.toBeInTheDocument();
  });
});

describe('GuidedWalkthrough — header layout (live-QA, /investigate 2026-09-07)', () => {
  // items-center vertically centered the "Step X / Y" badge against the
  // FULL HEIGHT of a wrapped multi-line title, landing the badge beside an
  // interior line instead of the first one — reading as the badge box
  // spilling into the middle of the sentence. items-start pins both boxes
  // to the top of the row instead.
  const LONG_TITLE_SPEC: GuidedWalkthroughSpec = {
    v: 1,
    kind: 'guided_walkthrough',
    title: 'Walk through: finding null space and column space',
    steps: [{ prompt: 'Prompt.', answer: 'Answer.' }],
  };

  it('aligns the header to the top, not the center, so a wrapped title never straddles the step badge', () => {
    const { container } = render(<GuidedWalkthrough spec={LONG_TITLE_SPEC} />);
    const header = container.querySelector('header');
    expect(header).not.toBeNull();
    expect(header!.className).toContain('items-start');
    expect(header!.className).not.toContain('items-center');
  });

  it('gives the title flex-1 min-w-0 so it wraps within its own column instead of squeezing the badge', () => {
    render(<GuidedWalkthrough spec={LONG_TITLE_SPEC} />);
    const title = screen.getByText(LONG_TITLE_SPEC.title);
    expect(title.className).toContain('flex-1');
    expect(title.className).toContain('min-w-0');
  });

  it('keeps the step badge flex-shrink-0 so it never gets compressed by a long title', () => {
    render(<GuidedWalkthrough spec={LONG_TITLE_SPEC} />);
    const badge = screen.getByText('Step 1 / 1');
    expect(badge.className).toContain('flex-shrink-0');
  });
});
