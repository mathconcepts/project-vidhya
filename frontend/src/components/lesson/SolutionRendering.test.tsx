/**
 * End-to-end proof for the practice-solution rendering fix, using text copied
 * verbatim from the authored corpus and from the reported screenshot.
 *
 * Two failure modes, opposite directions, both real:
 *
 *   Rendering as pre-formatted text  → `**bold**` and `- bullets` appear as
 *                                      literal syntax (what was on screen).
 *   Rendering as plain markdown      → single newlines collapse to spaces, so
 *                                      line-per-step solutions run together.
 *
 * 353 of 620 authored explanations depend on the second, 134 on the first, and
 * 123 on both at once. This asserts the combination handles all three.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownAtomRenderer } from './MarkdownAtomRenderer';
import { preserveHardBreaks } from '@/lib/preserveHardBreaks';

function renderSolution(src: string) {
  return render(<MarkdownAtomRenderer content={preserveHardBreaks(src)} atomId="t" />);
}

describe('practice solution rendering', () => {
  it('keeps a line-per-case solution on separate lines', () => {
    // data/courses/gate-em/topics/05-probability-statistics/mcqs.json
    const src =
      'Total outcomes: 6×6 = 36\n\nFavorable outcomes (sum > 9):\nSum = 10: (4,6),(5,5),(6,4) → 3 outcomes\nSum = 11: (5,6),(6,5) → 2 outcomes\nSum = 12: (6,6) → 1 outcome';
    const { container } = renderSolution(src);

    // The regression this guards: without hard breaks these three cases render
    // as one run-on sentence. Assert per-line, because textContent renders a
    // <br> as a newline — so a whitespace-tolerant regex would pass either way.
    expect(container.querySelectorAll('br').length).toBeGreaterThanOrEqual(3);
    const lines = (container.textContent ?? '').split('\n').map((l) => l.trim());
    expect(lines).toContain('Sum = 10: (4,6),(5,5),(6,4) → 3 outcomes');
    expect(lines).toContain('Sum = 11: (5,6),(6,5) → 2 outcomes');
    expect(lines).toContain('Sum = 12: (6,6) → 1 outcome');
  });

  it('renders authored markdown as structure, not as syntax', () => {
    // Shape from the reported screenshot: a numbered proof then a bullet list.
    const src =
      'For a real symmetric matrix A:\n\n1. All eigenvalues are REAL\n2. Eigenvectors for distinct eigenvalues are orthogonal\n3. A is always diagonalizable\n\n**Why other options are wrong:**\n\n- A: not necessarily positive\n- C: not necessarily zero';
    const { container } = renderSolution(src);

    expect(container.querySelector('ol')).not.toBeNull();
    expect(container.querySelector('ul')).not.toBeNull();
    expect(container.querySelector('strong')).not.toBeNull();
    // The literal asterisks must not survive to the screen.
    expect(container.textContent).not.toContain('**');
  });

  it('handles an explanation that mixes both', () => {
    const src = '**Step 1**\nP(D) = 0.01\nP(T+|D) = 0.95\n\n- conclusion follows';
    const { container } = renderSolution(src);
    expect(container.querySelector('strong')?.textContent).toBe('Step 1');
    expect(container.querySelectorAll('br').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('ul')).not.toBeNull();
  });

  it('does not corrupt an embedded interactive-spec fence', () => {
    // InteractiveSidecar parses this JSON out of the same raw string. If the
    // transform touched fence contents the widget would silently stop
    // rendering, which is the exact bug class this branch has been closing.
    const src = 'See below.\n\n```interactive-spec\n{"v":1,\n"kind":"manipulable"}\n```';
    expect(preserveHardBreaks(src)).toContain('{"v":1,\n"kind":"manipulable"}');
  });

  it('renders plain single-paragraph text unchanged', () => {
    renderSolution('The determinant scales area by |det(A)|.');
    expect(screen.getByText(/scales area by/)).toBeInTheDocument();
  });
});
