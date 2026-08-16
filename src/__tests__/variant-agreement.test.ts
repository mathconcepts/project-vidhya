/**
 * The variant-agreement gate, tested in both directions.
 *
 * This gate went through four wrong versions before this one, and each wrong
 * version is a test below:
 *
 *   1. Emoji range included Dingbats, so U+2713 CHECK MARK in a worked example
 *      failed five accepted files. A gate that cries wolf gets switched off.
 *   2. Repetition keyed on OPENING n-grams, when the repeated idiom is
 *      trailing — it caught none of the three files it was written for.
 *   3. Repetition grouped per concept, so "the determinant of the" recurring
 *      across one concept's variants read as a cadence tic.
 *   4. Repetition counted FILES rather than concepts, so three variants of the
 *      same concept discussing row operations tripped it.
 *
 * The synthetic cases here are the contract. The corpus is about to be
 * regenerated, so tuning against today's 16 files would pin the wrong thing.
 */
import { describe, it, expect } from 'vitest';
import {
  isSubsequence,
  hasEmoji,
  headingLevels,
  fencedBlocks,
  compareBlocks,
  compareWalkthrough,
  checkPair,
  repeatedPhrases,
  MIN_FILES_FOR_REPETITION,
} from '../../scripts/check-variant-agreement';

const wt = (steps: Array<{ prompt: string; hint?: string; answer: string }>) =>
  JSON.stringify({ v: 1, kind: 'guided_walkthrough', title: 't', steps });

const block = (json: string) => '```interactive-spec\n' + json + '\n```';

const atom = (
  body: string,
  fm: Record<string, string> = {},
) =>
  `---\n${Object.entries({ concept_id: 'c', atom_type: 'intuition', ...fm })
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n---\n\n${body}`;

describe('isSubsequence', () => {
  it('accepts inserted intermediate steps', () => {
    expect(isSubsequence(['a', 'c'], ['a', 'b', 'c'])).toBe(true);
  });
  it('rejects a dropped element', () => {
    expect(isSubsequence(['a', 'b'], ['a', 'c'])).toBe(false);
  });
  it('rejects reordering', () => {
    expect(isSubsequence(['a', 'b'], ['b', 'a'])).toBe(false);
  });
  it('accepts the empty needle', () => {
    expect(isSubsequence([], ['a'])).toBe(true);
  });
});

describe('hasEmoji', () => {
  it('does NOT flag a typographic check mark', () => {
    // The regression that failed five accepted files. U+2713 is Dingbats and
    // legitimate in a worked example that ticks off a verification step.
    expect(hasEmoji('Check it: ✓ the answer holds')).toBe(false);
  });
  it('does not flag arrows or set symbols', () => {
    expect(hasEmoji('A → B, x ∈ S, 3 ≤ 4, ∀x ∃y')).toBe(false);
  });
  it('flags a pictographic emoji', () => {
    expect(hasEmoji('great work 🚀')).toBe(true);
  });
  it('flags the same check mark in EMOJI presentation', () => {
    expect(hasEmoji('done ✓\uFE0F')).toBe(true);
  });
});

describe('headingLevels', () => {
  it('counts levels and ignores hashes mid-line', () => {
    expect(headingLevels('# a\n\ntext # not a heading\n\n### c')).toEqual([1, 3]);
  });
});

describe('walkthrough comparison', () => {
  const base = fencedBlocks(
    block(wt([{ prompt: 'p1', answer: 'x=2' }, { prompt: 'p2', answer: 'y=5' }])),
  )[0];

  it('allows prompt and hint to differ — that is the scaffolding', () => {
    const v = fencedBlocks(
      block(
        wt([
          { prompt: 'much gentler p1', hint: 'a new hint', answer: 'x=2' },
          { prompt: 'gentler p2', answer: 'y=5' },
        ]),
      ),
    )[0];
    expect(compareWalkthrough(base, v, 'f')).toEqual([]);
  });

  it('allows INSERTED steps — the whole reason for the carve-out', () => {
    const v = fencedBlocks(
      block(
        wt([
          { prompt: 'p1', answer: 'x=2' },
          { prompt: 'new middle step', answer: 'interim' },
          { prompt: 'p2', answer: 'y=5' },
        ]),
      ),
    )[0];
    expect(compareWalkthrough(base, v, 'f')).toEqual([]);
  });

  it('FAILS when a base answer is dropped', () => {
    const v = fencedBlocks(block(wt([{ prompt: 'p2', answer: 'y=5' }])))[0];
    expect(compareWalkthrough(base, v, 'f').map((x) => x.rule)).toContain(
      'walkthrough-answer-dropped',
    );
  });

  it('FAILS when the final answer changes', () => {
    const v = fencedBlocks(
      block(wt([{ prompt: 'p1', answer: 'x=2' }, { prompt: 'p2', answer: 'y=6' }])),
    )[0];
    const rules = compareWalkthrough(base, v, 'f').map((x) => x.rule);
    expect(rules).toContain('walkthrough-final-answer-changed');
  });

  it('REFUSES an unparseable spec rather than passing it', () => {
    const v = fencedBlocks(block('{not json'))[0];
    expect(compareWalkthrough(base, v, 'f').map((x) => x.rule)).toContain(
      'spec-unparseable',
    );
  });
});

describe('creation rules', () => {
  const none: ReturnType<typeof fencedBlocks> = [];
  const added = fencedBlocks(block(wt([{ prompt: 'p', answer: 'a' }])));

  it('lets a shaken variant author a walkthrough where the base has none', () => {
    expect(compareBlocks(none, added, 'shaken', 'f')).toEqual([]);
  });

  it('FORBIDS an assured variant adding one', () => {
    expect(compareBlocks(none, added, 'assured', 'f').map((v) => v.rule)).toContain(
      'assured-added-scaffolding',
    );
  });

  it('FORBIDS inventing a manipulable, for either stance', () => {
    const m = fencedBlocks(block(JSON.stringify({ v: 1, kind: 'manipulable' })));
    expect(compareBlocks(none, m, 'shaken', 'f').map((v) => v.rule)).toContain(
      'interactive-invented',
    );
  });

  it('FAILS when a non-walkthrough block differs byte-for-byte', () => {
    const b = fencedBlocks(block(JSON.stringify({ v: 1, kind: 'manipulable', min: 0 })));
    const x = fencedBlocks(block(JSON.stringify({ v: 1, kind: 'manipulable', min: 9 })));
    expect(compareBlocks(b, x, 'shaken', 'f').map((v) => v.rule)).toContain(
      'interactive-not-identical',
    );
  });
});

describe('prose budget', () => {
  const long = 'word '.repeat(60);
  const short = 'word '.repeat(20);

  it('FAILS a shaken variant longer than its base', () => {
    const r = checkPair(atom(short), atom(long, { variant_of: 'b', for_stance: 'shaken' }), 'f');
    expect(r.map((v) => v.rule)).toContain('shaken-longer-than-base');
  });

  it('passes a shaken variant shorter than its base', () => {
    const r = checkPair(atom(long), atom(short, { variant_of: 'b', for_stance: 'shaken' }), 'f');
    expect(r.map((v) => v.rule)).not.toContain('shaken-longer-than-base');
  });

  it('holds assured to an absolute ceiling, not to the base', () => {
    // 300 words is over the intuition ceiling of 200 even though the base is
    // longer still — assured is capped absolutely because terseness is the point.
    const r = checkPair(
      atom('word '.repeat(400)),
      atom('word '.repeat(300), { variant_of: 'b', for_stance: 'assured' }),
      'f',
    );
    expect(r.map((v) => v.rule)).toContain('assured-over-budget');
  });

  it('does not count LaTeX or fenced blocks as prose', () => {
    const mathy = `$$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$$\n\n${block(
      wt([{ prompt: 'p', answer: 'a' }]),
    )}\n\nword word`;
    const r = checkPair(
      atom('word word word'),
      atom(mathy, { variant_of: 'b', for_stance: 'shaken' }),
      'f',
    );
    expect(r.map((v) => v.rule)).not.toContain('shaken-longer-than-base');
  });
});

describe('structure rules', () => {
  it('FAILS an h1 in an atom body', () => {
    const r = checkPair(atom('x'), atom('# Title\n\nx', { variant_of: 'b', for_stance: 'shaken' }), 'f');
    expect(r.map((v) => v.rule)).toContain('h1-in-atom-body');
  });

  it('FAILS more than base+1 headings', () => {
    const r = checkPair(
      atom('plain'),
      atom('## a\n\n## b\n\n## c', { variant_of: 'b', for_stance: 'shaken' }),
      'f',
    );
    expect(r.map((v) => v.rule)).toContain('too-many-headings');
  });

  it('FAILS an invalid for_stance and stops there', () => {
    const r = checkPair(atom('x'), atom('x', { variant_of: 'b', for_stance: 'steady' }), 'f');
    expect(r).toHaveLength(1);
    expect(r[0].rule).toBe('bad-for-stance');
  });

  it('FAILS a concept_id that does not match the base', () => {
    const r = checkPair(
      atom('x', { concept_id: 'a' }),
      atom('x', { concept_id: 'b', variant_of: 'b', for_stance: 'shaken' }),
      'f',
    );
    expect(r.map((v) => v.rule)).toContain('concept-id-mismatch');
  });
});

describe('repetition', () => {
  // Surrounding words differ per file on purpose. Identical padding would
  // create n-grams that straddle the phrase boundary and are absent from the
  // bases, which is an artefact of the fixture rather than of the content.
  const many = (phrase: string, conceptsWithIt: number, total = 10) =>
    Array.from({ length: total }, (_, i) => ({
      file: `c${i}/v.md`,
      concept: `c${i}`,
      body:
        i < conceptsWithIt
          ? `alpha${i} beta${i} ${phrase} gamma${i} delta${i}`
          : // every word distinct per file, so the control group cannot itself
            // trip the check and mask what is being measured
            `w${i}a w${i}b w${i}c w${i}d w${i}e w${i}f`,
    }));

  it('flags a construction recurring across concepts', () => {
    const r = repeatedPhrases(many('one vector at a time', 4));
    expect(r.some((x) => x.phrase.includes('one vector at a'))).toBe(true);
  });

  it('does NOT flag a phrase confined to a single concept', () => {
    // Four files, all the same concept — that is subject matter, not a tic.
    const files = Array.from({ length: 10 }, (_, i) => ({
      file: `same/v${i}.md`,
      concept: i < 4 ? 'determinants' : `other${i}`,
      body: i < 4 ? 'adding a multiple of a row' : `unrelated ${i}`,
    }));
    expect(repeatedPhrases(files).some((x) => x.phrase.includes('adding a multiple'))).toBe(
      false,
    );
  });

  it('does NOT flag vocabulary that the base atoms already use', () => {
    const files = many('the characteristic polynomial of', 5);
    const bases = ['we compute the characteristic polynomial of the matrix'];
    expect(repeatedPhrases(files, bases)).toEqual([]);
  });

  it('stays silent below the small-n guard', () => {
    expect(MIN_FILES_FOR_REPETITION).toBeGreaterThan(1);
    expect(repeatedPhrases(many('one vector at a time', 3, MIN_FILES_FOR_REPETITION - 1))).toEqual(
      [],
    );
  });
});
