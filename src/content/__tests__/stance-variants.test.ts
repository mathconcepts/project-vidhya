/**
 * The authored confident/unconfident axis for atom bodies.
 *
 * Two failure modes matter more than the happy path, and both are silent:
 *
 *   1. A variant file leaks into the lesson as a SEPARATE atom. A beginner
 *      would then read "you can already compute these" halfway through their
 *      first exposure — worse than having no variants at all.
 *   2. A missing variant is read as a finding rather than as absence, and the
 *      student gets a blank body instead of the base one.
 *
 * Most of what follows pins those.
 */
import { describe, it, expect } from 'vitest';
import {
  foldStanceVariants,
  applyStanceVariants,
  stanceCoverage,
  isVariantEntry,
  isVariantStance,
  VARIANT_STANCES,
} from '../stance-variants';
import type { ContentAtom } from '../content-types';

function atom(id: string, extra: Partial<ContentAtom> = {}): ContentAtom {
  return {
    id,
    concept_id: 'eigenvalues',
    atom_type: 'hook',
    bloom_level: 1,
    difficulty: 0,
    exam_ids: ['*'],
    content: `base body of ${id}`,
    ...extra,
  } as ContentAtom;
}

function variant(id: string, of: string, stance: string, body: string): ContentAtom {
  return atom(id, { variant_of: of, for_stance: stance as never, content: body });
}

describe('variant detection', () => {
  it('recognises a variant only by variant_of', () => {
    expect(isVariantEntry(atom('a'))).toBe(false);
    expect(isVariantEntry({ variant_of: 'a', for_stance: 'shaken' })).toBe(true);
    // An empty string is not a base atom id; treating it as one would let a
    // typo silently promote a variant into the lesson.
    expect(isVariantEntry({ variant_of: '', for_stance: 'shaken' })).toBe(false);
  });

  it('accepts exactly the two variant stances', () => {
    expect(VARIANT_STANCES).toEqual(['shaken', 'assured']);
    expect(isVariantStance('shaken')).toBe(true);
    expect(isVariantStance('assured')).toBe(true);
    // 'steady' IS the base file. A steady variant would be a second base, with
    // readdir order deciding which one a student reads.
    expect(isVariantStance('steady')).toBe(false);
    expect(isVariantStance(undefined)).toBe(false);
  });
});

describe('foldStanceVariants', () => {
  it('returns only base atoms — a variant never renders as its own atom', () => {
    const { atoms } = foldStanceVariants([
      atom('e.hook'),
      variant('e.hook.shaken', 'e.hook', 'shaken', 'gentle'),
      variant('e.hook.assured', 'e.hook', 'assured', 'terse'),
    ]);
    expect(atoms).toHaveLength(1);
    expect(atoms[0].id).toBe('e.hook');
    expect(atoms[0].stance_variants).toEqual({ shaken: 'gentle', assured: 'terse' });
  });

  it('leaves the base body untouched while attaching variants', () => {
    const { atoms } = foldStanceVariants([
      atom('e.hook'),
      variant('e.hook.shaken', 'e.hook', 'shaken', 'gentle'),
    ]);
    expect(atoms[0].content).toBe('base body of e.hook');
  });

  it('drops an orphan variant rather than serving it', () => {
    const { atoms, warnings } = foldStanceVariants([
      atom('e.hook'),
      variant('e.intuition.shaken', 'e.intuition', 'shaken', 'orphaned'),
    ]);
    expect(atoms.map((a) => a.id)).toEqual(['e.hook']);
    expect(warnings.join(' ')).toContain('unknown base atom');
  });

  it('drops a variant with an unusable for_stance', () => {
    const { atoms, warnings } = foldStanceVariants([
      atom('e.hook'),
      variant('e.hook.steady', 'e.hook', 'steady', 'second base'),
    ]);
    expect(atoms[0].stance_variants).toBeUndefined();
    expect(warnings.join(' ')).toContain('for_stance');
  });

  it('keeps the first of two variants claiming the same slot, and says so', () => {
    // Load order otherwise decides what a student reads.
    const { atoms, warnings } = foldStanceVariants([
      atom('e.hook'),
      variant('e.hook.shaken', 'e.hook', 'shaken', 'first'),
      variant('e.hook.shaken2', 'e.hook', 'shaken', 'second'),
    ]);
    expect(atoms[0].stance_variants?.shaken).toBe('first');
    expect(warnings.join(' ')).toContain('duplicate');
  });

  it('never throws — one bad file must not blank a lesson', () => {
    expect(() =>
      foldStanceVariants([
        variant('orphan', 'nope', 'shaken', 'x'),
        variant('bad', 'nope2', 'nonsense', 'y'),
      ]),
    ).not.toThrow();
  });

  it('is a no-op on a concept with no variants authored', () => {
    const input = [atom('a'), atom('b')];
    const { atoms, warnings } = foldStanceVariants(input);
    expect(atoms).toHaveLength(2);
    expect(warnings).toEqual([]);
    expect(atoms.every((a) => a.stance_variants === undefined)).toBe(true);
  });
});

describe('applyStanceVariants', () => {
  const folded = foldStanceVariants([
    atom('e.hook'),
    atom('e.intuition', { atom_type: 'intuition' }),
    variant('e.hook.shaken', 'e.hook', 'shaken', 'gentle hook'),
    variant('e.hook.assured', 'e.hook', 'assured', 'terse hook'),
  ]).atoms;

  it('serves the base body to a steady student', () => {
    const out = applyStanceVariants(folded, 'steady');
    expect(out[0].content).toBe('base body of e.hook');
    expect(out[0].served_stance).toBeUndefined();
  });

  it('serves nothing when the concept is only PARTLY covered', () => {
    // Changed deliberately. This fixture covers the hook but not the
    // intuition, and serving per atom would give a shaken student gentle,
    // then abruptly terse, then gentle again inside one lesson. Whiplash
    // mid-concept is more disorienting than uniform base text, because the
    // voice teaching them keeps changing with no explanation.
    const out = applyStanceVariants(folded, 'shaken');
    expect(out[0].content).toBe('base body of e.hook');
    expect(out.every((a) => a.served_stance === undefined)).toBe(true);
  });

  it('falls back to the base body for an atom with no variant', () => {
    // Absence is not an error and must never produce a blank.
    const out = applyStanceVariants(folded, 'shaken');
    const intuition = out.find((a) => a.atom_type === 'intuition')!;
    expect(intuition.content).toBe('base body of e.intuition');
    expect(intuition.served_stance).toBeUndefined();
  });

  it('serves the matching body once every narrative atom is covered', () => {
    const full = folded.map((a) =>
      a.atom_type === 'intuition'
        ? { ...a, stance_variants: { shaken: 'gentle intuition', assured: 'terse intuition' } }
        : a,
    );
    const shaken = applyStanceVariants(full, 'shaken');
    expect(shaken[0].content).toBe('gentle hook');
    expect(shaken[0].served_stance).toBe('shaken');
    expect(applyStanceVariants(full, 'assured')[0].content).toBe('terse hook');
  });

  it('ignores non-narrative atoms when deciding coverage', () => {
    // A formal_definition has no stance variant by design. Counting it would
    // make full coverage unreachable and switch the axis off everywhere.
    const withDef = [
      ...folded.map((a) =>
        a.atom_type === 'intuition'
          ? { ...a, stance_variants: { shaken: 'gentle intuition' } }
          : a,
      ),
      {
        id: 'e.formal',
        concept_id: 'e',
        atom_type: 'formal_definition',
        bloom_level: 3,
        difficulty: 0.4,
        exam_ids: ['*'],
        content: 'a definition',
      },
    ] as typeof folded;
    expect(applyStanceVariants(withDef, 'shaken')[0].served_stance).toBe('shaken');
  });

  it('does not mutate its input', () => {
    const before = folded.map((a) => a.content);
    applyStanceVariants(folded, 'shaken');
    expect(folded.map((a) => a.content)).toEqual(before);
  });

  it('is idempotent — applying twice serves the same body', () => {
    const once = applyStanceVariants(folded, 'shaken');
    const twice = applyStanceVariants(once, 'shaken');
    expect(twice.map((a) => a.content)).toEqual(once.map((a) => a.content));
  });
});

describe('stanceCoverage', () => {
  it('counts an atom as fully covered only with every variant stance authored', () => {
    const atoms = foldStanceVariants([
      atom('a'),
      atom('b'),
      atom('c'),
      variant('a.s', 'a', 'shaken', 'x'),
      variant('a.a', 'a', 'assured', 'y'),
      variant('b.s', 'b', 'shaken', 'z'),
    ]).atoms;
    expect(stanceCoverage(atoms)).toEqual({
      total: 3,
      fully_covered: 1,
      by_stance: { shaken: 2, assured: 1 },
    });
  });

  it('reports zero coverage without claiming a problem', () => {
    expect(stanceCoverage([atom('a')])).toEqual({
      total: 1,
      fully_covered: 0,
      by_stance: { shaken: 0, assured: 0 },
    });
  });
});
