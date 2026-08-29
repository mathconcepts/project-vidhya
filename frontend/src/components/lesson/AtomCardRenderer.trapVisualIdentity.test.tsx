/**
 * AtomCardRenderer — common_traps/exam_pattern visual identity.
 *
 * Both atom types are authored as "- **label**: detail" lists but, before
 * this, rendered with identical chrome to every other atom type (hook,
 * intuition, ...) — the direct cause of "exam pattern info is good but not
 * displayed to capture attention... mundane" and the equivalent common_traps
 * feedback. Two changes, both reusing tokens the design system already
 * licenses rather than inventing a third accent:
 *   - common_traps' icon+eyebrow now renders in --orange (Clarity's existing
 *     warning token, previously only shown inside the cohort-stat callout,
 *     which needs >=10 students of data and so is invisible on any new or
 *     low-traffic concept) permanently, not gated on cohort data.
 *   - common_traps and exam_pattern both get MarkdownAtomRenderer's
 *     `structured` modifier, turning the label-list into hairline-separated
 *     scannable rows instead of a flowing bullet wall.
 * Every other atom type must render unchanged.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtomCardRenderer, type ContentAtom } from './AtomCardRenderer';

function makeAtom(overrides: Partial<ContentAtom> = {}): ContentAtom {
  return {
    id: 'c.a',
    concept_id: 'c',
    atom_type: 'intuition',
    bloom_level: 2,
    difficulty: 0.1,
    exam_ids: ['*'],
    content: 'body text',
    ...overrides,
  };
}

function eyebrowColor(label: string): string | null {
  const span = screen.getAllByText(label).find((el) => el.tagName === 'SPAN');
  const row = span?.closest('div');
  return row ? getComputedStyle(row).color : null;
}

describe('AtomCardRenderer — common_traps/exam_pattern visual identity', () => {
  it('common_traps eyebrow renders in --orange, permanently (not cohort-gated)', () => {
    const atom = makeAtom({ atom_type: 'common_traps', content: '- **Trap**: detail' });
    render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
    // jsdom does not resolve custom properties to their computed rgb value,
    // but it does preserve the literal var(...) expression in the inline
    // style attribute — assert on that instead of getComputedStyle's color.
    const span = screen.getByText('Common Traps');
    const row = span.closest('div');
    expect(row?.getAttribute('style')).toContain('var(--orange)');
  });

  it('hook/intuition/mnemonic eyebrows stay neutral (not orange)', () => {
    for (const atom_type of ['hook', 'intuition', 'mnemonic'] as const) {
      const atom = makeAtom({ atom_type, content: 'plain text' });
      const { unmount } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
      const label = { hook: 'Hook', intuition: 'Intuition', mnemonic: 'Mnemonic' }[atom_type];
      const span = screen.getByText(label);
      const row = span.closest('div');
      expect(row?.getAttribute('style')).not.toContain('var(--orange)');
      unmount();
    }
  });

  it('common_traps gets the structured modifier class', () => {
    const atom = makeAtom({ atom_type: 'common_traps', content: '- **Trap**: detail' });
    const { container } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
    expect(container.querySelector('.vidhya-atom-body--structured')).toBeTruthy();
  });

  it('exam_pattern gets the structured modifier class', () => {
    const atom = makeAtom({ atom_type: 'exam_pattern', content: '- **Pattern**: detail' });
    const { container } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
    expect(container.querySelector('.vidhya-atom-body--structured')).toBeTruthy();
  });

  it('other atom types do not get the structured modifier class', () => {
    for (const atom_type of ['hook', 'intuition', 'formal_definition', 'mnemonic'] as const) {
      const atom = makeAtom({ atom_type, content: '- one\n- two' });
      const { container, unmount } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
      expect(container.querySelector('.vidhya-atom-body--structured')).toBeNull();
      unmount();
    }
  });
});
