/**
 * Concept Anchor contract tests.
 *
 * The contract (docs/designs/2026-09-18-concept-anchor-and-rendering-agenda.md
 * §4) is what stops this slot drifting back into the exam-framed register
 * every other surface on the page already uses. These lock each rule.
 */

import { describe, it, expect } from 'vitest';
import {
  validateAnchor,
  countAnchorWords,
  loadConceptAnchors,
  MAX_ANCHOR_CHARS,
} from '../concept-anchors';

const OK = 'A delivery router checks if one driver can cover every street without repeating a road.';

describe('countAnchorWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countAnchorWords('one two three')).toBe(3);
  });

  it('ignores leading, trailing and repeated whitespace', () => {
    expect(countAnchorWords('  one   two \n three  ')).toBe(3);
  });
});

/**
 * The cap is on CHARACTERS because characters decide rendered lines, and lines
 * are what the screen-space constraint is about. Measured live at 375px: the
 * lede's container is 261px at 17px/24.65px, so ~30 characters per line. The
 * first cut of this contract capped words at 30 and every one of the 100
 * authored anchors came out at 5-7 lines — the exact paragraph-at-the-top the
 * anchor exists to avoid.
 */
describe('validateAnchor — rule 1, character cap', () => {
  it('accepts an anchor at the cap', () => {
    const atCap = 'x'.repeat(MAX_ANCHOR_CHARS);
    expect(validateAnchor(atCap)).toEqual([]);
  });

  it('rejects one character over the cap, and says the count', () => {
    const over = 'x'.repeat(MAX_ANCHOR_CHARS + 1);
    const problems = validateAnchor(over);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(`${MAX_ANCHOR_CHARS + 1} characters`);
  });

  it('is a length cap, not a word cap — many short words are fine', () => {
    const manyShortWords = Array.from({ length: 24 }, () => 'ab').join(' ');
    expect(manyShortWords.length).toBeLessThanOrEqual(MAX_ANCHOR_CHARS);
    expect(validateAnchor(manyShortWords)).toEqual([]);
  });
});

describe('validateAnchor — rule 4, no mathematical notation', () => {
  it('rejects dollar-delimited math', () => {
    expect(validateAnchor('The sum $a+b$ matters here.').join()).toContain('`$`');
  });

  it('rejects a LaTeX command', () => {
    expect(validateAnchor('It uses \\frac of the total.').join()).toContain('LaTeX');
  });

  it('rejects a bare Greek letter', () => {
    expect(validateAnchor('The rate λ sets the pace.').join()).toContain('Greek');
  });
});

describe('validateAnchor — rule 5, no exam framing', () => {
  it.each(['exam', 'exams', 'marks', 'syllabus', 'high-yield', 'commonly asked'])(
    'rejects %s',
    (term) => {
      expect(validateAnchor(`A chip designer cares about ${term} here.`).join()).toContain(
        'exam framing',
      );
    },
  );

  it('rejects the exam name in caps', () => {
    expect(validateAnchor('This shows up in GATE every year.').join()).toContain('GATE');
  });

  /**
   * The false positive this check actually shipped with on its first run: a
   * chip designer counting logic *gates* is precisely the concrete physical
   * anchor the contract asks for, and a case-insensitive GATE match rejected
   * it. Case is the discriminator — the exam is caps, the component is not.
   */
  it('ACCEPTS a lowercase logic gate — the component, not the exam', () => {
    expect(
      validateAnchor(
        "A chip designer cuts a boolean expression so fewer physical logic gates sit on the silicon.",
      ),
    ).toEqual([]);
  });
});

describe('validateAnchor — rule 2, concrete not vague', () => {
  it.each(['many fields', 'various applications', 'numerous applications'])(
    'rejects "%s"',
    (term) => {
      expect(validateAnchor(`This idea turns up in ${term} today.`).join()).toContain('vague');
    },
  );
});

describe('validateAnchor — misc', () => {
  it('rejects an emoji', () => {
    expect(validateAnchor('A bridge wobbles 🌉 in the wind.').join()).toContain('emoji');
  });

  it('treats an empty string as an authoring mistake and points at the null form', () => {
    expect(validateAnchor('   ').join()).toContain('anchor: null');
  });

  it('reports every problem at once, not just the first', () => {
    const problems = validateAnchor('It appears in the GATE exam with $x$ marks 🌉');
    expect(problems.length).toBeGreaterThan(2);
  });

  it('accepts a real anchor', () => {
    expect(validateAnchor(OK)).toEqual([]);
  });
});

describe('the committed registry', () => {
  const anchors = loadConceptAnchors();

  it('loads entries', () => {
    expect(anchors.size).toBeGreaterThan(0);
  });

  it('every authored anchor passes the contract', () => {
    const bad = [...anchors.values()]
      .filter((a) => typeof a.anchor === 'string')
      .map((a) => ({ id: a.concept_id, problems: validateAnchor(a.anchor as string) }))
      .filter((x) => x.problems.length > 0);
    expect(bad).toEqual([]);
  });

  it('every null anchor records a reason — an absence is a decision, never a gap', () => {
    const unexplained = [...anchors.values()]
      .filter((a) => a.anchor === null && !a.reason?.trim())
      .map((a) => a.concept_id);
    expect(unexplained).toEqual([]);
  });
});
