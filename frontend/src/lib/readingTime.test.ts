import { describe, it, expect } from 'vitest';
import { estimateReadingTime, formatReadingTime } from './readingTime';

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
