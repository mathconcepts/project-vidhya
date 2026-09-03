/**
 * MarkdownAtomRenderer — content module v3 renderer tests.
 *
 * Covers the parse pipeline and fallback behavior. The provider chain
 * itself is tested in interactives/registry.test.ts — these tests verify
 * the markdown→React tree is correct.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownAtomRenderer } from './MarkdownAtomRenderer';

describe('MarkdownAtomRenderer — markdown parse', () => {
  it('renders plain markdown', () => {
    render(<MarkdownAtomRenderer atomId="test.plain" content="Hello **bold** world" />);
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('renders inline math via KaTeX', () => {
    render(<MarkdownAtomRenderer atomId="test.math" content="The slope is $f'(x) = 2x$ at any point." />);
    // KaTeX renders math into elements with .katex class
    const katexNode = document.querySelector('.katex');
    expect(katexNode).toBeTruthy();
  });

  it('renders display math via KaTeX', () => {
    render(<MarkdownAtomRenderer atomId="test.display" content={'Definition:\n\n$$\nf\'(a) = \\lim_{h \\to 0} \\frac{f(a+h) - f(a)}{h}\n$$'} />);
    const katexBlock = document.querySelector('.katex-display');
    expect(katexBlock).toBeTruthy();
  });

  it('falls back to plain text on malformed math (does not throw)', () => {
    // KaTeX with throwOnError: false renders error-style spans, not throws
    render(<MarkdownAtomRenderer atomId="test.malformed" content="Broken: $\\frac{1$" />);
    // Component must not crash; text remains visible
    expect(screen.getByText(/Broken/)).toBeInTheDocument();
  });

  it('renders headings, lists, and code blocks', () => {
    const md = `# Heading 1

- item one
- item two

\`\`\`
code
\`\`\``;
    render(<MarkdownAtomRenderer atomId="test.complex" content={md} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading 1');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('structured=false (default) does not add the structured modifier class', () => {
    const { container } = render(<MarkdownAtomRenderer atomId="test.plain2" content="- one\n- two" />);
    expect(container.querySelector('.vidhya-atom-body--structured')).toBeNull();
  });

  it('structured=true adds the modifier class for common_traps/exam_pattern-style lists', () => {
    const { container } = render(
      <MarkdownAtomRenderer atomId="test.structured" content="- **Trap one**: detail one\n- **Trap two**: detail two" structured />,
    );
    expect(container.querySelector('.vidhya-atom-body--structured')).toBeTruthy();
    // The label's colon sits outside the bold span in every authored atom —
    // must never be split onto its own line/row (see globals.css comment).
    expect(screen.getByText('Trap one').tagName).toBe('STRONG');
    expect(screen.getByText(/: detail one/)).toBeInTheDocument();
  });

  // Regression (/investigate, 2026-09-03, live-QA screenshot): a
  // `| Condition | Solutions |` GFM table in systems-of-equations's
  // formal_definition atom rendered as literal pipe-and-dash text — the
  // remark pipeline had no `remark-gfm`, so a table was never a table to
  // begin with, just an ordinary (unrecognized) paragraph.
  it('renders a GFM table as a real <table>, not literal pipe text', () => {
    const md = `| Condition | Solutions |
|---|---|
| rank(A) != rank([A\\|b]) | Zero |
| rank(A) = rank([A\\|b]) = n | Exactly one |`;
    render(<MarkdownAtomRenderer atomId="test.table" content={md} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getByText('Condition').tagName).toBe('TH');
    expect(screen.getByText('Exactly one').tagName).toBe('TD');
    // The raw markdown syntax must not leak through as visible text.
    expect(screen.queryByText(/\|---\|/)).toBeNull();
  });

  it('memoizes parse — same content+id renders identical tree on re-render', () => {
    const { rerender, container } = render(
      <MarkdownAtomRenderer atomId="test.memo" content="Stable content" />,
    );
    const html1 = container.innerHTML;
    rerender(<MarkdownAtomRenderer atomId="test.memo" content="Stable content" />);
    expect(container.innerHTML).toBe(html1);
  });
});

describe('MarkdownAtomRenderer — directive parsing', () => {
  it('renders unknown directives as quiet placeholder (does not throw)', () => {
    render(<MarkdownAtomRenderer atomId="test.unknown" content={':::nonexistent\n:::'} />);
    // The placeholder span has the marker class; just verify no throw + something rendered
    expect(document.querySelector('[data-unknown-directive]')).toBeTruthy();
  });

  it('preserves plain text adjacent to directives', () => {
    render(<MarkdownAtomRenderer atomId="test.mixed" content={'Before\n\n:::interactive{ref=foo}\n:::\n\nAfter'} />);
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });
});
