import { describe, it, expect } from 'vitest';
import { preserveHardBreaks } from './preserveHardBreaks';

/**
 * These lock the exact shapes found in the authored corpus. The measurement
 * that motivated this helper: of 620 explanations, 353 rely on single-newline
 * breaks, 134 contain markdown, 123 contain both.
 */
describe('preserveHardBreaks', () => {
  it('promotes a single newline to a markdown hard break', () => {
    // Real shape from data/courses/.../05-probability-statistics/mcqs.json
    const src = 'Sum = 10: 3 outcomes\nSum = 11: 2 outcomes\nSum = 12: 1 outcome';
    expect(preserveHardBreaks(src)).toBe(
      'Sum = 10: 3 outcomes  \nSum = 11: 2 outcomes  \nSum = 12: 1 outcome',
    );
  });

  it('leaves paragraph breaks alone', () => {
    // A blank line is already a paragraph split; adding a break marker to the
    // line before it would be noise.
    const src = 'Total outcomes: 36\n\nFavorable: 6';
    expect(preserveHardBreaks(src)).toBe('Total outcomes: 36\n\nFavorable: 6');
  });

  it('does not touch content inside a fenced block', () => {
    // The interactive-spec and gif-scene fences carry JSON. Trailing spaces
    // inside them are content, and mangling that JSON is how a widget silently
    // stops rendering.
    const src = 'before\n```interactive-spec\n{"v":1,\n"kind":"manipulable"}\n```\nafter line\nnext';
    const out = preserveHardBreaks(src);
    expect(out).toContain('{"v":1,\n"kind":"manipulable"}');
    expect(out).not.toContain('{"v":1,  \n');
    // ...but text after the fence still gets breaks.
    expect(out).toContain('after line  \nnext');
  });

  it('preserves markdown list structure', () => {
    const src = '- A: not necessarily positive\n- C: not necessarily zero';
    const out = preserveHardBreaks(src);
    // Hard breaks are harmless inside list items; the bullets still parse.
    expect(out.split('\n').every((l) => l.startsWith('- '))).toBe(true);
  });

  it('is idempotent on already-marked breaks', () => {
    const src = 'one  \ntwo';
    expect(preserveHardBreaks(src)).toBe('one  \ntwo');
  });

  it('leaves a backslash hard break alone', () => {
    const src = 'one\\\ntwo';
    expect(preserveHardBreaks(src)).toBe('one\\\ntwo');
  });

  it('handles empty and single-line input', () => {
    expect(preserveHardBreaks('')).toBe('');
    expect(preserveHardBreaks('just one line')).toBe('just one line');
  });

  it('never drops or reorders content', () => {
    const src = 'a\nb\n\nc\n```\nd\n```\ne';
    const out = preserveHardBreaks(src);
    expect(out.replace(/ {2}$/gm, '')).toBe(src);
  });
});
