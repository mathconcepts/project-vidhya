/**
 * Locks the answer-disclosure contract.
 *
 * The defect these tests exist to prevent: `remark-rehype`'s
 * `allowDangerousHtml: false` silently dropped the `<details>`/`</details>`
 * markers while KEEPING the answer paragraphs between them, so all 200
 * `micro_exercise` + `retrieval_prompt` atoms rendered their own answer
 * openly beneath the question. A regression here is invisible to the eye in
 * a diff (the answer still renders — just always), so it is asserted on the
 * one thing that distinguishes the two states: whether the answer text is in
 * the DOM before the student asks for it.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownAtomRenderer } from './MarkdownAtomRenderer';

/** The exact authored shape used by all 200 retrieval atoms on disk. */
const AUTHORED = `Classify the PDE. What type is it?

- **(A)** Heat equation (parabolic)
- **(B)** Wave equation (hyperbolic)

<details>
<summary>Answer</summary>

**A**. The given PDE is the heat equation.

Key feature: first-order time derivative.

</details>
`;

describe('AnswerReveal — hidden answers stay hidden', () => {
  it('does not render the answer body before the student reveals it', () => {
    render(<MarkdownAtomRenderer content={AUTHORED} atomId="t1" />);
    // The question and its options are visible...
    expect(screen.getByText(/Classify the PDE/)).toBeInTheDocument();
    expect(screen.getByText(/Heat equation \(parabolic\)/)).toBeInTheDocument();
    // ...and the answer is not in the DOM at all (not merely visually hidden:
    // a `display:none` answer is still reachable by find-in-page and by a
    // screen reader, which defeats the point of withholding it).
    expect(screen.queryByText(/The given PDE is the heat equation/)).toBeNull();
    expect(screen.queryByText(/first-order time derivative/)).toBeNull();
  });

  it('renders an actionable trigger, not a bare noun', () => {
    render(<MarkdownAtomRenderer content={AUTHORED} atomId="t2" />);
    const trigger = screen.getByTestId('answer-reveal-trigger');
    expect(trigger).toHaveTextContent(/show answer/i);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('reveals the full answer body on tap', async () => {
    const user = userEvent.setup();
    render(<MarkdownAtomRenderer content={AUTHORED} atomId="t3" />);
    await user.click(screen.getByTestId('answer-reveal-trigger'));
    expect(screen.getByText(/The given PDE is the heat equation/)).toBeInTheDocument();
    expect(screen.getByText(/first-order time derivative/)).toBeInTheDocument();
    expect(screen.getByTestId('answer-reveal-trigger')).toHaveAttribute('aria-expanded', 'true');
  });

  it('never leaks the raw <details> or <summary> markup as visible text', () => {
    const { container } = render(<MarkdownAtomRenderer content={AUTHORED} atomId="t4" />);
    expect(container.textContent).not.toMatch(/<\/?details/i);
    expect(container.textContent).not.toMatch(/<\/?summary/i);
  });

  it('uses the authored summary label when it is not "Answer"', () => {
    const md = `Question?\n\n<details>\n<summary>Solution</summary>\n\nBody text here.\n\n</details>\n`;
    render(<MarkdownAtomRenderer content={md} atomId="t5" />);
    expect(screen.getByTestId('answer-reveal-trigger')).toHaveTextContent(/show solution/i);
  });

  it('fails closed on an unclosed <details> — the answer still does not leak', () => {
    // An authoring typo (missing `</details>`) must not spill the answer.
    const md = `Question?\n\n<details>\n<summary>Answer</summary>\n\nSecret answer body.\n`;
    render(<MarkdownAtomRenderer content={md} atomId="t6" />);
    expect(screen.queryByText(/Secret answer body/)).toBeNull();
    expect(screen.getByTestId('answer-reveal-trigger')).toBeInTheDocument();
  });

  it('leaves atoms with no <details> block completely unchanged', () => {
    render(<MarkdownAtomRenderer content={'Just prose.\n\nSecond paragraph.'} atomId="t7" />);
    expect(screen.getByText('Just prose.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
    expect(screen.queryByTestId('answer-reveal')).toBeNull();
  });

  it('still renders math inside a revealed answer through the KaTeX pipeline', async () => {
    const user = userEvent.setup();
    const md = `Q?\n\n<details>\n<summary>Answer</summary>\n\nThe value is $x^2$ exactly.\n\n</details>\n`;
    const { container } = render(<MarkdownAtomRenderer content={md} atomId="t8" />);
    await user.click(screen.getByTestId('answer-reveal-trigger'));
    // KaTeX emits .katex spans; a plain-text `$x^2$` would mean the answer
    // body bypassed remark-math when it was folded into the disclosure.
    expect(container.querySelector('.katex')).toBeTruthy();
    expect(container.textContent).not.toContain('$x^2$');
  });
});
