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
