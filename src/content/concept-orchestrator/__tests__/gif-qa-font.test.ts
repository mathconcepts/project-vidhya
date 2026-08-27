/**
 * gif-qa-font tests (§4.15 follow-up, W3.6/E9 media QA).
 */
import { describe, it, expect } from 'vitest';
import { drawGlyphText, textDimensions } from '../gif-qa-font';

describe('gif-qa-font', () => {
  it('measures zero size for an empty string', () => {
    expect(textDimensions('', 1)).toEqual({ width: 0, height: 0 });
    expect(textDimensions('', 2)).toEqual({ width: 0, height: 0 });
  });

  it('scales width and height with the scale factor', () => {
    const s1 = textDimensions('AB', 1);
    const s2 = textDimensions('AB', 2);
    expect(s2.width).toBe(s1.width * 2);
    expect(s2.height).toBe(s1.height * 2);
  });

  it('grows width linearly with character count at a fixed scale', () => {
    const one = textDimensions('A', 1);
    const three = textDimensions('AAA', 1);
    // 3 glyphs of width 3 + 2 gaps of width 1 = 11, vs. 1 glyph = 3.
    expect(three.width).toBe(one.width * 3 + 2);
  });

  it('draws pixels matching the measured bounding box (no overflow)', () => {
    const text = 'HI';
    const scale = 2;
    const dim = textDimensions(text, scale);
    const plotted: Array<[number, number]> = [];
    drawGlyphText(text, 10, 5, scale, (px, py) => plotted.push([px, py]));

    expect(plotted.length).toBeGreaterThan(0);
    for (const [px, py] of plotted) {
      expect(px).toBeGreaterThanOrEqual(10);
      expect(px).toBeLessThan(10 + dim.width);
      expect(py).toBeGreaterThanOrEqual(5);
      expect(py).toBeLessThan(5 + dim.height);
    }
  });

  it('draws something for a character outside the known glyph table (fallback, never silently blank)', () => {
    const plotted: Array<[number, number]> = [];
    drawGlyphText('~', 0, 0, 1, (px, py) => plotted.push([px, py]));
    expect(plotted.length).toBeGreaterThan(0);
  });

  it('treats lowercase and uppercase identically', () => {
    const lower: Array<[number, number]> = [];
    const upper: Array<[number, number]> = [];
    drawGlyphText('ab', 0, 0, 1, (px, py) => lower.push([px, py]));
    drawGlyphText('AB', 0, 0, 1, (px, py) => upper.push([px, py]));
    expect(lower).toEqual(upper);
  });

  it('draws nothing for a space glyph', () => {
    const plotted: Array<[number, number]> = [];
    drawGlyphText(' ', 0, 0, 1, (px, py) => plotted.push([px, py]));
    expect(plotted).toEqual([]);
  });
});
