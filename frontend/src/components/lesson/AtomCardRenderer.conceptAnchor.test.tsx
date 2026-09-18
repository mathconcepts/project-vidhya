/**
 * AtomCardRenderer — the Concept Anchor lede (2026-09-18 /investigate pass).
 *
 * One plain sentence saying what the maths is FOR, shown once at the top of
 * the concept's FIRST card before any mathematics. The gap it closes: every
 * other framing surface on a lesson page is exam-framed by construction, and
 * ~99 of 101 concepts carried no real-world bridge at all.
 *
 * The invariants worth locking:
 *   - it renders on the first card and ONLY the first card (one lede per
 *     concept, not one per atom);
 *   - it is keyed on index 0, not on atom_type === 'hook' — the stack gets
 *     re-ordered under the student, so "the hook" is not reliably first and
 *     being first is the anchor's entire job;
 *   - an unauthored concept renders nothing at all, never a placeholder.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtomCardRenderer, type ContentAtom } from './AtomCardRenderer';

// vi.hoisted, not a plain const: vi.mock is hoisted above every top-level
// binding, so a factory closing over a normal const throws "cannot access
// before initialization".
const { ANCHOR } = vi.hoisted(() => ({
  ANCHOR: 'A bridge wobble that grows instead of dying out is ruled out on one number.',
}));

vi.mock('@/generated/concept-anchors.gen', () => ({
  CONCEPT_ANCHORS: { anchored: ANCHOR },
  conceptAnchor: (id: string | undefined) => (id === 'anchored' ? ANCHOR : null),
}));

function makeAtom(overrides: Partial<ContentAtom> = {}): ContentAtom {
  return {
    id: 'c.a',
    concept_id: 'c',
    atom_type: 'hook',
    bloom_level: 1,
    difficulty: 0.1,
    exam_ids: ['*'],
    content: 'body text',
    ...overrides,
  };
}

function renderStack(conceptId: string, atoms: ContentAtom[]) {
  return render(
    <AtomCardRenderer atoms={atoms} conceptId={conceptId} studentId="s1" onComplete={() => {}} />,
  );
}

describe('ConceptAnchorLede', () => {
  it('renders the anchor on the first card', () => {
    renderStack('anchored', [makeAtom()]);
    expect(screen.getByTestId('concept-anchor')).toHaveTextContent(ANCHOR);
  });

  it('renders nothing for a concept with no authored anchor', () => {
    renderStack('not-anchored', [makeAtom()]);
    expect(screen.queryByTestId('concept-anchor')).toBeNull();
  });

  it('renders on the first card even when that card is not the hook', () => {
    // The stack is re-ordered under the student (applyIntentStageOrder, the
    // error-streak visual switch), so keying on atom_type would drop the
    // lede off the screen the student actually sees first.
    renderStack('anchored', [
      makeAtom({ id: 'c.v', atom_type: 'visual_analogy' }),
      makeAtom({ id: 'c.h', atom_type: 'hook' }),
    ]);
    expect(screen.getByTestId('concept-anchor')).toHaveTextContent(ANCHOR);
  });

  it('appears exactly once, not once per atom', () => {
    renderStack('anchored', [
      makeAtom({ id: 'c.h', atom_type: 'hook' }),
      makeAtom({ id: 'c.i', atom_type: 'intuition' }),
      makeAtom({ id: 'c.f', atom_type: 'formal_definition' }),
    ]);
    expect(screen.getAllByTestId('concept-anchor')).toHaveLength(1);
  });

  it('carries no accent colour — green means mastery and indigo means AI/tutor, this is neither', () => {
    renderStack('anchored', [makeAtom()]);
    const style = screen.getByTestId('concept-anchor').getAttribute('style') ?? '';
    expect(style).not.toMatch(/--green|--indigo/);
    expect(style).toContain('var(--text-primary)');
  });

  it('is body-size text, not metadata — a student actually reads it', () => {
    renderStack('anchored', [makeAtom()]);
    expect(screen.getByTestId('concept-anchor').getAttribute('style') ?? '').toContain(
      'var(--text-body)',
    );
  });
});
