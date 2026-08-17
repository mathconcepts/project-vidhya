import { describe, it, expect } from 'vitest';
import { estimateReadingTime, formatReadingTime, countProseWords } from './readingTime';

describe('estimateReadingTime', () => {
  it('returns minimum 5s for empty / tiny content', () => {
    expect(estimateReadingTime('')).toBe(5);
    expect(estimateReadingTime('hi')).toBe(5);
  });

  it('scales with word count (~220 wpm)', () => {
    // 220 words ≈ 60s, rounded to nearest 5 → 60
    const text = Array(220).fill('word').join(' ');
    expect(estimateReadingTime(text)).toBe(60);
  });

  it('inflates for inline math', () => {
    const plain = 'one two three four five';
    const withMath = 'one $a$ two $b$ three $c$ four $d$ five';
    expect(estimateReadingTime(withMath)).toBeGreaterThan(estimateReadingTime(plain));
  });

  it('inflates for display math more than inline', () => {
    const inline = 'word $a$ word $b$ word';
    const display = 'word $$\nx\n$$ word $$\ny\n$$ word';
    expect(estimateReadingTime(display)).toBeGreaterThan(estimateReadingTime(inline));
  });

  it('inflates for directive blocks', () => {
    const plain = 'before content after content';
    const withDirective = 'before content\n\n:::interactive{ref=foo}\n:::\n\nafter content';
    expect(estimateReadingTime(withDirective)).toBeGreaterThan(estimateReadingTime(plain));
  });

  it('reports roughly the prose time, not the JSON, for a body that is mostly an interactive-spec block', () => {
    const prose = 'This concept shows how the determinant scales area under a linear map.';
    // A realistic 20-line pretty-printed interactive-spec block — many words
    // of JSON that must NOT be read as prose.
    const specLines = [
      '```interactive-spec',
      '{',
      '  "v": 1,',
      '  "kind": "simulation",',
      '  "title": "det([[3,0],[0,2]]) = 6: the unit circle area grows 6x",',
      '  "x_expr": "3*cos(t)",',
      '  "y_expr": "2*sin(t)",',
      '  "t_min": 0,',
      '  "t_max": 6.28319,',
      '  "duration_sec": 6,',
      '  "view_box": {',
      '    "x_min": -3.2,',
      '    "x_max": 3.2,',
      '    "y_min": -3.2,',
      '    "y_max": 3.2',
      '  },',
      '  "caption": "Watch the traced curve enclose exactly 6x the original area, matching det(A) = 6."',
      '}',
      '```',
    ];
    const withSpec = `${prose}\n\n${specLines.join('\n')}`;

    // Prose-only baseline for comparison.
    const proseOnly = estimateReadingTime(prose);
    expect(estimateReadingTime(withSpec)).toBe(proseOnly);

    // Sanity check the JSON block really is large enough that counting it
    // as prose would have moved the estimate — proves the test is real.
    const jsonWordCount = specLines.join(' ').split(/\s+/).filter(Boolean).length;
    expect(jsonWordCount).toBeGreaterThan(15);
  });

  it('handles nested/multiple fenced blocks without counting their contents', () => {
    const plain = 'intro words here';
    const withFences =
      'intro words here\n\n```gif-scene\n{"type":"parametric","x":"cos(t)","y":"sin(t)"}\n```\n\n' +
      'and more text after the first fence\n\n```interactive-spec\n{"v":1,"kind":"manipulable","slider":{"min":0,"max":10}}\n```';
    // Word count from the two fences alone would swamp "intro words here" if
    // counted as prose; the estimate should track only the visible prose.
    const withFencesTime = estimateReadingTime(withFences);
    expect(withFencesTime).toBeGreaterThanOrEqual(estimateReadingTime(plain));
    expect(withFencesTime).toBeLessThan(estimateReadingTime('word '.repeat(30)));
  });

  it('does not swallow the rest of the document on an unterminated fence', () => {
    const withUnterminatedFence =
      '```interactive-spec\n{"v":1,"kind":"manipulable"\n\n' + Array(220).fill('word').join(' ');
    // The 220 trailing prose words are never closed by a matching fence, so
    // they must still be counted rather than silently dropped.
    expect(estimateReadingTime(withUnterminatedFence)).toBeGreaterThanOrEqual(60);
  });

  it('leaves plain prose with no fenced block unchanged from current behaviour', () => {
    const text = Array(220).fill('word').join(' ');
    expect(estimateReadingTime(text)).toBe(60);
  });
});

describe('countProseWords', () => {
  it('returns 0 for empty content', () => {
    expect(countProseWords('')).toBe(0);
  });

  it('strips fenced blocks entirely from the word count', () => {
    const withSpec = 'five prose words total here\n\n```interactive-spec\n{"a":1,"b":2,"c":3,"d":4}\n```';
    expect(countProseWords(withSpec)).toBe(5);
  });

  it('strips math and directives, matching the prose used by estimateReadingTime', () => {
    const text = 'alpha $x^2$ beta $$y = mx + b$$ gamma\n\n:::note\nhidden\n:::\n\ndelta';
    // alpha, beta, gamma, delta survive; math + directive contents do not.
    expect(countProseWords(text)).toBe(4);
  });

  it('does not swallow trailing prose after an unterminated fence', () => {
    const text = '```oops\nnever closed\n\none two three';
    // No matching close, so the ``` marker and everything after it stays as
    // literal text and is counted (better to over-count a stray marker than
    // silently drop real prose).
    expect(countProseWords(text)).toBeGreaterThanOrEqual(3);
  });
});

describe('formatReadingTime', () => {
  it('formats sub-minute as seconds', () => {
    expect(formatReadingTime(5)).toBe('5s');
    expect(formatReadingTime(45)).toBe('45s');
  });
  it('formats >=60s as minutes', () => {
    expect(formatReadingTime(60)).toBe('1 min');
    expect(formatReadingTime(125)).toBe('2 min');
  });
});
