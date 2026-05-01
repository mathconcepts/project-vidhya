/**
 * estimateReadingTime — approximate seconds to read an atom's body.
 *
 * Strategy: word count at 220 wpm baseline, but math/directive blocks are
 * inflated since they're slower than prose.
 *
 *   - Each `$...$` inline math chunk: +2s
 *   - Each `$$...$$` display block: +5s
 *   - Each `:::directive` block: +8s (interactives invite play)
 *
 * Returns whole seconds, minimum 5. Rounded to the nearest 5 for UI calm.
 */

const WORDS_PER_MINUTE = 220;
const INLINE_MATH_SECONDS = 2;
const DISPLAY_MATH_SECONDS = 5;
const DIRECTIVE_SECONDS = 8;

export function estimateReadingTime(content: string): number {
  if (!content) return 5;

  // Strip math + directives for a clean word count.
  let stripped = content;
  const displayMatches = stripped.match(/\$\$[\s\S]+?\$\$/g) ?? [];
  stripped = stripped.replace(/\$\$[\s\S]+?\$\$/g, '');
  const inlineMatches = stripped.match(/\$[^\n$]+\$/g) ?? [];
  stripped = stripped.replace(/\$[^\n$]+\$/g, '');
  const directiveMatches = stripped.match(/^:::[a-z-]+/gim) ?? [];
  stripped = stripped.replace(/:::[\s\S]+?:::/g, '');

  const words = stripped.trim().split(/\s+/).filter(Boolean).length;
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
