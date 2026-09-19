/**
 * Row-kind badges on `exam_pattern` rows.
 *
 * `/investigate` 2026-09-18, live-QA finding #4: "exam pattern — good info.
 * But convey them using better design aesthetics that resonate the message
 * being conveyed, colors, contrasts, highlights, clustering."
 *
 * The clustering was already in the content and the renderer discarded it.
 * Every committed `exam_pattern` atom authors `- **lead-in**: detail` rows,
 * and the lead-in names the kind of fact. Measured over all 101 committed
 * atoms (436 bold-label rows): 247 name a question format, 85 a time budget,
 * 36 a trap, 68 plain prose.
 *
 * The fixtures below are REAL committed lead-ins, copied from
 * `modules/project-vidhya-content/concepts/*​/atoms/exam-pattern.md`, not
 * invented strings — a classifier tested only against tidy synthetic labels
 * would pass while mis-reading the corpus it exists for.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownAtomRenderer, classifyStructuredRow } from './MarkdownAtomRenderer';

describe('classifyStructuredRow — trap wins over format', () => {
  // Six real committed labels have this shape: they name a question format
  // AND are about a trap. Classifying them as `format` would hide exactly
  // the rows a student most needs to spot.
  it('classifies a trap that also mentions a format as a trap', () => {
    expect(classifyStructuredRow('The trap GATE likes on NAT questions')).toEqual({
      kind: 'trap',
      badge: 'Trap',
    });
  });

  it.each([
    'Trap',
    'Second trap',
    'The semi-definite trap',
    'The uniqueness trap',
    'Traps GATE sets',
  ])('classifies real committed trap label %s', (label) => {
    expect(classifyStructuredRow(label)?.kind).toBe('trap');
  });
});

describe('classifyStructuredRow — time is anchored to the start', () => {
  it('classifies the near-universal "Time budget" row (85 of 101 atoms)', () => {
    expect(classifyStructuredRow('Time budget')).toEqual({ kind: 'time', badge: 'Time' });
  });

  it('does NOT claim a row that merely mentions time later in its text', () => {
    // Anchoring matters: this is a method row, not a pacing row.
    expect(classifyStructuredRow('Use Sylvester, not eigenvalues — it saves time')).toBeNull();
  });
});

describe('classifyStructuredRow — acronyms are matched case-sensitively', () => {
  it.each([
    ['NAT questions', 'NAT'],
    ['MCQ questions', 'MCQ'],
    ['MSQ', 'MSQ'],
    ['NAT (numeric answer)', 'NAT'],
  ])('classifies %s as format with badge %s', (label, badge) => {
    expect(classifyStructuredRow(label)).toEqual({ kind: 'format', badge });
  });

  it('keeps both acronyms when a row genuinely covers both formats', () => {
    // Real committed label — 3 atoms carry this exact shape.
    expect(classifyStructuredRow('MCQ/MSQ "which statement is true" questions')).toEqual({
      kind: 'format',
      badge: 'MCQ/MSQ',
    });
  });

  it('does not read a lowercase word containing the letters as an acronym', () => {
    // Case-insensitive matching would badge this "NAT". It is prose.
    expect(classifyStructuredRow('Natural logarithms show up in the integrand')).toBeNull();
  });
});

describe('classifyStructuredRow — conservative by default', () => {
  it.each([
    'Worked instance',
    'The homogeneity check',
    'When one entry is asked, compute one entry',
    '',
    '   ',
  ])('returns null rather than guessing a kind for %s', (label) => {
    expect(classifyStructuredRow(label)).toBeNull();
  });
});

// A shortened but structurally faithful copy of a real exam_pattern body
// (positive-definite-matrices), covering all four row kinds in one atom.
const EXAM_PATTERN_BODY = [
  '**How GATE actually asks this.**',
  '',
  '- **NAT: "for what range of $k$ is $A$ positive definite?"** The single most common shape.',
  '',
  '- **Use Sylvester, not eigenvalues.** Three determinants versus factoring a cubic.',
  '',
  '- **The semi-definite trap.** Leading principal minors test positive definiteness only.',
  '',
  '- **Time budget:** a $2\\times2$ check is two determinants, under 60 seconds.',
].join('\n');

describe('MarkdownAtomRenderer — rowKinds rendering', () => {
  it('renders a badge per classifiable row, in the exam’s own vocabulary', () => {
    render(
      <MarkdownAtomRenderer
        atomId="pdm.exam-pattern"
        content={EXAM_PATTERN_BODY}
        structured
        rowKinds
      />,
    );
    expect(screen.getByText('NAT')).toBeInTheDocument();
    expect(screen.getByText('Trap')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  it('leaves an unclassifiable row unbadged rather than inventing a marker', () => {
    render(
      <MarkdownAtomRenderer
        atomId="pdm.exam-pattern"
        content={EXAM_PATTERN_BODY}
        structured
        rowKinds
      />,
    );
    // 4 rows authored, 3 classify.
    expect(document.querySelectorAll('.vidhya-row-badge')).toHaveLength(3);
    expect(document.querySelectorAll('li[data-row-kind]')).toHaveLength(3);
  });

  it('stamps data-row-kind so CSS can tint only the trap row', () => {
    render(
      <MarkdownAtomRenderer
        atomId="pdm.exam-pattern"
        content={EXAM_PATTERN_BODY}
        structured
        rowKinds
      />,
    );
    expect(screen.getByText('Trap').getAttribute('data-row-badge')).toBe('trap');
    expect(screen.getByText('NAT').getAttribute('data-row-badge')).toBe('format');
  });

  it('badges nothing when rowKinds is omitted — common_traps must stay untouched', () => {
    // Every common_traps row is a trap by definition; badging all of them
    // "Trap" would be noise, not clustering. That atom type passes
    // `structured` without `rowKinds`, so this is the path it takes.
    render(
      <MarkdownAtomRenderer atomId="pdm.common-traps" content={EXAM_PATTERN_BODY} structured />,
    );
    expect(document.querySelectorAll('.vidhya-row-badge')).toHaveLength(0);
    expect(document.querySelectorAll('li[data-row-kind]')).toHaveLength(0);
  });

  it('keeps the row prose intact alongside the badge', () => {
    render(
      <MarkdownAtomRenderer
        atomId="pdm.exam-pattern"
        content={EXAM_PATTERN_BODY}
        structured
        rowKinds
      />,
    );
    // The badge is prepended, never a replacement for the authored lead-in.
    expect(screen.getByText(/The single most common shape/)).toBeInTheDocument();
    expect(screen.getByText('Use Sylvester, not eigenvalues.').tagName).toBe('STRONG');
  });
});

describe('a badged row that carries more than one block', () => {
  // 67 of the 101 committed exam_pattern atoms have at least one bolded row
  // with a second paragraph or a nested list under it. The badged <li> is a
  // flex row, so left as direct children those extra blocks each became a flex
  // item on the SAME line — landing beside the lead-in at roughly half width
  // instead of beneath it. The fix wraps the row's own content in one element.
  const MULTI_BLOCK = [
    '- **NAT questions**: the common shape.',
    '',
    '  Example: compute the rank, enter an integer.',
    '',
    '- **Time budget**: two minutes.',
    '',
    '  - sub point one',
    '  - sub point two',
    '',
  ].join('\n');

  it('puts every authored block inside ONE sibling of the badge', () => {
    render(
      <MarkdownAtomRenderer atomId="x.exam-pattern" content={MULTI_BLOCK} structured rowKinds />,
    );
    const rows = document.querySelectorAll('li[data-row-kind]');
    expect(rows.length).toBe(2);
    for (const row of Array.from(rows)) {
      // Exactly two flex children: the badge, and the body wrapper.
      expect(row.children.length).toBe(2);
      expect(row.children[0].classList.contains('vidhya-row-badge')).toBe(true);
      expect(row.children[1].classList.contains('vidhya-row-body')).toBe(true);
    }
  });

  it('keeps the follow-up paragraph and the nested list as row content', () => {
    render(
      <MarkdownAtomRenderer atomId="x.exam-pattern" content={MULTI_BLOCK} structured rowKinds />,
    );
    const body = document.querySelectorAll('li[data-row-kind] > .vidhya-row-body');
    expect(body[0].querySelectorAll('p').length).toBe(2);
    expect(body[1].querySelector('ul')).not.toBeNull();
  });

  it('does not badge a nested item, or label a row with a nested item\'s lead-in', () => {
    // The lead-in search stops at a nested list, so an outer row with no bold
    // of its own cannot inherit a sub-item's badge.
    const NESTED_ONLY = ['- outer row, no bold here', '', '  - **Trap**: inner bold', ''].join('\n');
    render(
      <MarkdownAtomRenderer atomId="x.exam-pattern" content={NESTED_ONLY} structured rowKinds />,
    );
    expect(document.querySelectorAll('li[data-row-kind]')).toHaveLength(1);
    // ...and it is the INNER one, which is the row that actually has the lead-in.
    const badged = document.querySelector('li[data-row-kind]')!;
    expect(badged.closest('ul')!.parentElement!.tagName).toBe('LI');
  });

  it('classifies a lead-in containing inline math without KaTeX source bleeding in', () => {
    // Row classification runs BEFORE rehype-katex. After it, collectText would
    // also walk KaTeX's hidden MathML <annotation>, which holds the raw LaTeX.
    const MATHY = '- **Trap on $\\operatorname{rank}(A)$**: students count rows.\n';
    render(<MarkdownAtomRenderer atomId="x.exam-pattern" content={MATHY} structured rowKinds />);
    const badge = document.querySelector('.vidhya-row-badge');
    expect(badge?.textContent).toBe('Trap');
    expect(document.querySelector('.katex')).not.toBeNull();
  });
});
