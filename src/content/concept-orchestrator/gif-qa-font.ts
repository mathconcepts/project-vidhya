/**
 * gif-qa-font.ts — a tiny, deterministic 3x5 pixel bitmap font used to draw
 * labels (scene titles, discrete-bar labels) directly into the pre-encoding
 * RGBA frame buffer inside gif-generator.ts (§4.15 follow-up, W3.6/E9 media
 * QA). gifenc is encode-only — it cannot render text — so any label the
 * renderer wants legible in the final GIF has to be rasterized by hand here,
 * BEFORE the frame is handed to gifenc.
 *
 * Deliberately coarse: this is not a typography deliverable. Every glyph is
 * a fixed 3 (wide) x 5 (tall) monochrome block, uppercase-only (lowercase
 * input is upper-cased before lookup — real titles read fine in caps at
 * this size), covering digits, letters, and the punctuation that actually
 * appears in committed `gif-scene` titles/labels today (space, comma,
 * colon, parens, equals, period, hyphen, apostrophe, slash). Any character
 * not in the table falls back to a small filled box rather than silently
 * dropping the glyph — a QA pass that renders as blank text is worse than
 * one that renders as a placeholder block, since ink-density and bounding-
 * box measurements both depend on *something* being drawn for every
 * character actually present in the string.
 */

/** One glyph = 5 rows, each a 3-character string of '#' (lit) / '.' (unlit). */
const FONT_3X5: Record<string, string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['###', '..#', '###', '#..', '###'],
  '3': ['###', '..#', '###', '..#', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '###', '..#', '###'],
  '6': ['###', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '..#', '..#', '..#'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '###'],
  'A': ['.#.', '#.#', '###', '#.#', '#.#'],
  'B': ['##.', '#.#', '##.', '#.#', '##.'],
  'C': ['.##', '#..', '#..', '#..', '.##'],
  'D': ['##.', '#.#', '#.#', '#.#', '##.'],
  'E': ['###', '#..', '##.', '#..', '###'],
  'F': ['###', '#..', '##.', '#..', '#..'],
  'G': ['.##', '#..', '#.#', '#.#', '.##'],
  'H': ['#.#', '#.#', '###', '#.#', '#.#'],
  'I': ['###', '.#.', '.#.', '.#.', '###'],
  'J': ['..#', '..#', '..#', '#.#', '.#.'],
  'K': ['#.#', '#.#', '##.', '#.#', '#.#'],
  'L': ['#..', '#..', '#..', '#..', '###'],
  'M': ['#.#', '###', '###', '#.#', '#.#'],
  'N': ['#.#', '##.', '#.#', '.##', '#.#'],
  'O': ['.#.', '#.#', '#.#', '#.#', '.#.'],
  'P': ['##.', '#.#', '##.', '#..', '#..'],
  'Q': ['.#.', '#.#', '#.#', '.#.', '..#'],
  'R': ['##.', '#.#', '##.', '#.#', '#.#'],
  'S': ['.##', '#..', '.#.', '..#', '##.'],
  'T': ['###', '.#.', '.#.', '.#.', '.#.'],
  'U': ['#.#', '#.#', '#.#', '#.#', '###'],
  'V': ['#.#', '#.#', '#.#', '#.#', '.#.'],
  'W': ['#.#', '#.#', '#.#', '###', '#.#'],
  'X': ['#.#', '#.#', '.#.', '#.#', '#.#'],
  'Y': ['#.#', '#.#', '.#.', '.#.', '.#.'],
  'Z': ['###', '..#', '.#.', '#..', '###'],
  ' ': ['...', '...', '...', '...', '...'],
  '.': ['...', '...', '...', '...', '.#.'],
  ',': ['...', '...', '...', '.#.', '#..'],
  ':': ['...', '.#.', '...', '.#.', '...'],
  ';': ['...', '.#.', '...', '.#.', '#..'],
  "'": ['.#.', '.#.', '...', '...', '...'],
  '"': ['#.#', '#.#', '...', '...', '...'],
  '(': ['.#.', '#..', '#..', '#..', '.#.'],
  ')': ['.#.', '..#', '..#', '..#', '.#.'],
  '[': ['##.', '#..', '#..', '#..', '##.'],
  ']': ['.##', '..#', '..#', '..#', '.##'],
  '=': ['...', '###', '...', '###', '...'],
  '-': ['...', '...', '###', '...', '...'],
  '+': ['...', '.#.', '###', '.#.', '...'],
  '/': ['..#', '..#', '.#.', '#..', '#..'],
  '*': ['#.#', '.#.', '###', '.#.', '#.#'],
};

/** Placeholder glyph for any character not in FONT_3X5 — never silently blank. */
const FONT_FALLBACK: string[] = ['###', '#.#', '#.#', '#.#', '###'];

const GLYPH_COLS = 3;
const GLYPH_ROWS = 5;
const GLYPH_GAP = 1;

function glyphRows(ch: string): string[] {
  const upper = ch.toUpperCase();
  return FONT_3X5[upper] ?? FONT_FALLBACK;
}

/**
 * Measured size (px) of `text` rendered at `scale`, WITHOUT drawing it.
 * Kept in lockstep with drawGlyphText below by construction (both derive
 * from the same GLYPH_COLS/ROWS/GAP constants) so bounding-box math used
 * for QA overlap detection can never drift from what actually gets drawn.
 */
export function textDimensions(text: string, scale = 1): { width: number; height: number } {
  if (text.length === 0) return { width: 0, height: 0 };
  const charW = GLYPH_COLS * scale;
  const gap = GLYPH_GAP * scale;
  const width = charW * text.length + gap * (text.length - 1);
  const height = GLYPH_ROWS * scale;
  return { width, height };
}

/**
 * Draw `text` into an RGBA buffer at (x, y) (top-left), calling `plot` for
 * every lit pixel. `plot` is injected rather than importing gif-generator's
 * putPixel directly, so this module stays presentation-only and testable
 * without a real frame buffer.
 */
export function drawGlyphText(
  text: string,
  x: number,
  y: number,
  scale: number,
  plot: (px: number, py: number) => void,
): void {
  const charW = GLYPH_COLS * scale;
  const gap = GLYPH_GAP * scale;
  let cursorX = x;
  for (const ch of text) {
    const rows = glyphRows(ch);
    for (let ry = 0; ry < GLYPH_ROWS; ry++) {
      for (let rx = 0; rx < GLYPH_COLS; rx++) {
        if (rows[ry][rx] !== '#') continue;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            plot(cursorX + rx * scale + sx, y + ry * scale + sy);
          }
        }
      }
    }
    cursorX += charW + gap;
  }
}
