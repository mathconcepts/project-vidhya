/**
 * AtomCardRenderer — atom-kind tag colour (2026-09-05 /ui-ux-pro-max pass).
 *
 * `ATOM_PRESENTATION_MAP` gained a `tagColor` field: one of four hues
 * (teal/purple/mint/brown) per pedagogical cluster, eyebrow-label + icon
 * only. Locks in the cluster assignment so a future edit can't silently
 * drift one atom type onto the wrong hue, and confirms common_traps keeps
 * its pre-existing `var(--orange)` verbatim (this pass must not touch it —
 * AtomCardRenderer.trapVisualIdentity.test.tsx already covers that
 * assertion and is left unmodified).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtomCardRenderer, type AtomType, type ContentAtom } from './AtomCardRenderer';

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

function eyebrowStyle(label: string): string | null {
  const span = screen.getByText(label);
  const row = span.closest('div');
  return row?.getAttribute('style') ?? null;
}

const CLUSTERS: Array<{ token: string; types: Array<[AtomType, string]> }> = [
  {
    token: 'var(--teal-ink)',
    types: [
      ['hook', 'Hook'],
      ['intuition', 'Intuition'],
      ['visual_analogy', 'Visual'],
    ],
  },
  {
    token: 'var(--purple-ink)',
    types: [
      ['worked_example', 'Worked Example'],
      ['micro_exercise', 'Quick Check'],
      ['interleaved_drill', 'Drill'],
    ],
  },
  {
    token: 'var(--mint-ink)',
    types: [
      ['retrieval_prompt', 'Recall'],
      ['mnemonic', 'Mnemonic'],
    ],
  },
  {
    token: 'var(--brown-ink)',
    types: [
      ['formal_definition', 'Definition'],
      ['exam_pattern', 'Exam Pattern'],
    ],
  },
];

describe('AtomCardRenderer — atom-kind tag colour', () => {
  for (const { token, types } of CLUSTERS) {
    for (const [atom_type, label] of types) {
      it(`${atom_type} eyebrow renders in ${token}`, () => {
        const atom = makeAtom({ atom_type, content: 'plain body text' });
        const { unmount } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
        expect(eyebrowStyle(label)).toContain(token);
        unmount();
      });
    }
  }

  it('common_traps keeps its pre-existing var(--orange), not the new palette', () => {
    const atom = makeAtom({ atom_type: 'common_traps', content: '- **Trap**: detail' });
    const { unmount } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
    const style = eyebrowStyle('Common Traps');
    expect(style).toContain('var(--orange)');
    expect(style).not.toContain('var(--orange-ink)');
    for (const bad of ['var(--teal-ink)', 'var(--purple-ink)', 'var(--mint-ink)', 'var(--brown-ink)']) {
      expect(style).not.toContain(bad);
    }
    unmount();
  });

  it('never uses the reserved green or indigo accents for any atom-kind tag', () => {
    const allTypes: AtomType[] = [
      'hook', 'intuition', 'formal_definition', 'visual_analogy',
      'worked_example', 'micro_exercise', 'common_traps',
      'retrieval_prompt', 'interleaved_drill', 'mnemonic', 'exam_pattern',
    ];
    const labels: Record<AtomType, string> = {
      hook: 'Hook', intuition: 'Intuition', formal_definition: 'Definition',
      visual_analogy: 'Visual', worked_example: 'Worked Example',
      micro_exercise: 'Quick Check', common_traps: 'Common Traps',
      retrieval_prompt: 'Recall', interleaved_drill: 'Drill',
      mnemonic: 'Mnemonic', exam_pattern: 'Exam Pattern',
    };
    for (const atom_type of allTypes) {
      const atom = makeAtom({ atom_type, content: atom_type === 'common_traps' || atom_type === 'exam_pattern' ? '- **X**: y' : 'plain body text' });
      const { unmount } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
      const style = eyebrowStyle(labels[atom_type]);
      expect(style).not.toContain('var(--green');
      expect(style).not.toContain('var(--indigo');
      unmount();
    }
  });
});
