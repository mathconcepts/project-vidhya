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
  MAX_ANCHOR_WORDS,
} from '../concept-anchors';

const OK =
  'A delivery company can instantly check whether one driver can cover every street without repeating a road.';

describe('countAnchorWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countAnchorWords('one two three')).toBe(3);
  });

  it('ignores leading, trailing and repeated whitespace', () => {
    expect(countAnchorWords('  one   two \n three  ')).toBe(3);
  });
});

describe('validateAnchor — rule 1, word cap', () => {
  it('accepts an anchor at the cap', () => {
    const atCap = Array.from({ length: MAX_ANCHOR_WORDS }, (_, i) => `w${i}`).join(' ');
    expect(validateAnchor(atCap)).toEqual([]);
  });

  it('rejects one word over the cap, and says the count', () => {
    const over = Array.from({ length: MAX_ANCHOR_WORDS + 1 }, (_, i) => `w${i}`).join(' ');
    const problems = validateAnchor(over);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(`${MAX_ANCHOR_WORDS + 1} words`);
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
        "A chip designer simplifies a circuit's boolean expression so fewer physical logic gates sit on the silicon.",
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
