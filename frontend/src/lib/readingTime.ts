/**
 * estimateReadingTime — approximate seconds to read an atom's body.
 *
 * Strategy: word count at 220 wpm baseline, but math/directive blocks are
 * inflated since they're slower than prose.
 *
 *   - Each `$...$` inline math chunk: +2s
 *   - Each `$$...$$` display block: +5s
 *   - Each `:::directive` block: +8s (interactives invite play)
 *   - Each fenced ``` ``` block (e.g. `interactive-spec`, `gif-scene`):
 *     stripped from the word count, +0s. Its JSON source is authoring
 *     metadata the student never reads as text — unlike inline/display
 *     math or `:::directives`, which remain visible on the rendered page
 *     and so still cost real reading time, a fenced block's content is
 *     swapped for a rendered widget/media element entirely. Any time the
 *     widget itself takes to play with is a separate concern this
 *     function doesn't estimate.
 *
 * Returns whole seconds, minimum 5. Rounded to the nearest 5 for UI calm.
 */

const WORDS_PER_MINUTE = 220;
const INLINE_MATH_SECONDS = 2;
const DISPLAY_MATH_SECONDS = 5;
const DIRECTIVE_SECONDS = 8;

/**
 * countProseWords — strip math/directive/fenced-block syntax and return the
 * remaining word count. Exported so any future consumer (e.g. a CI word-count
 * gate) shares this one definition instead of reimplementing the strip chain.
 */
export function countProseWords(content: string): number {
  if (!content) return 0;

  let stripped = content;
  // Fenced blocks first: their contents may themselves contain `$`/`:::`-like
  // text (JSON strings, etc.) that would otherwise confuse the later strips.
  // Non-greedy + /g so multiple/back-to-back fences are each stripped in
  // turn; an unterminated ``` (no matching close) simply never matches, so
  // it — and everything after it — is left in place as prose rather than
  // being swallowed.
  stripped = stripped.replace(/```[\s\S]*?```/g, '');
  stripped = stripped.replace(/\$\$[\s\S]+?\$\$/g, '');
  stripped = stripped.replace(/\$[^\n$]+\$/g, '');
  stripped = stripped.replace(/:::[\s\S]+?:::/g, '');

  return stripped.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadingTime(content: string): number {
  if (!content) return 5;

  // Count math/directive occurrences (each contributes its own inflation
  // below) on the fenced-block-stripped body, so a `$` or `:::` sitting
  // inside a fence's JSON never gets mistaken for real math/directive
  // syntax. Fenced blocks themselves are the exception: stripped for the
  // word count but intentionally worth no bonus seconds — see the doc
  // comment above.
  const withoutFences = content.replace(/```[\s\S]*?```/g, '');
  const displayMatches = withoutFences.match(/\$\$[\s\S]+?\$\$/g) ?? [];
  const withoutDisplay = withoutFences.replace(/\$\$[\s\S]+?\$\$/g, '');
  const inlineMatches = withoutDisplay.match(/\$[^\n$]+\$/g) ?? [];
  const withoutInline = withoutDisplay.replace(/\$[^\n$]+\$/g, '');
  const directiveMatches = withoutInline.match(/^:::[a-z-]+/gim) ?? [];

  // Final clean word count reuses the same strip chain via countProseWords
  // so the two never drift apart.
  const words = countProseWords(content);
  const proseSeconds = (words / WORDS_PER_MINUTE) * 60;
  const total =
    proseSeconds +
    inlineMatches.length * INLINE_MATH_SECONDS +
    displayMatches.length * DISPLAY_MATH_SECONDS +
    directiveMatches.length * DIRECTIVE_SECONDS;

  const rounded = Math.max(5, Math.round(total / 5) * 5);
  return rounded;
}

export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.round(seconds / 60);
  return `${m} min`;
}
