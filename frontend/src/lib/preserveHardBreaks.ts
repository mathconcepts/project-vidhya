/**
 * preserveHardBreaks — make plain-text line breaks survive a markdown render.
 *
 * Problem-solution text in this codebase is not cleanly one format. Measured
 * across the 620 authored explanations in `data/courses/`:
 *
 *   353 rely on single newlines as hard line breaks
 *   134 contain real markdown (bullets, headings, bold, ordered lists)
 *   123 contain BOTH
 *
 * So neither rendering strategy alone is correct. Rendering as pre-formatted
 * text leaves `**bold**` and `- bullets` on screen as literal syntax. Rendering
 * as markdown collapses every single newline into a space, which turns
 *
 *   Sum = 10: (4,6),(5,5),(6,4) → 3 outcomes
 *   Sum = 11: (5,6),(6,5) → 2 outcomes
 *
 * into one run-on line. That is a regression for the majority of the corpus.
 *
 * CommonMark already has the answer: two trailing spaces before a newline is a
 * hard break. This promotes each single newline to one, so authored structure
 * and authored line breaks both survive.
 *
 * Fenced code blocks are left alone. Inside a fence, whitespace is content —
 * and the ```interactive-spec / ```gif-scene blocks carry JSON that must not be
 * touched.
 */

const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

export function preserveHardBreaks(src: string): string {
  if (!src) return src;

  const lines = src.split('\n');
  const out: string[] = [];
  let fenceMarker: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(FENCE);

    if (fenceMarker) {
      // Inside a fence: copy verbatim, and close on a matching fence.
      out.push(line);
      if (m && m[1][0] === fenceMarker[0] && m[1].length >= fenceMarker.length) fenceMarker = null;
      continue;
    }
    if (m) {
      fenceMarker = m[1];
      out.push(line);
      continue;
    }

    const next = lines[i + 1];
    const isLast = i === lines.length - 1;
    // A blank line already separates paragraphs — leave it to markdown.
    // A line that is itself blank needs no break marker.
    const needsBreak =
      !isLast &&
      line.trim() !== '' &&
      next !== undefined &&
      next.trim() !== '' &&
      !/ {2}$/.test(line) &&
      !/\\$/.test(line);

    out.push(needsBreak ? `${line}  ` : line);
  }

  return out.join('\n');
}
