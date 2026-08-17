/**
 * Prose measurement and the budgets that depend on it.
 *
 * ── Why this is its own module ──────────────────────────────────────────
 *
 * Three places need to agree on "how long is this atom": the CI gate that
 * refuses an oversized variant, the cadence that tells the generator its
 * limit, and the reading-time estimate a student sees on the card.
 *
 * They cannot all import each other. `tsconfig.json` sets `rootDir: ./src`, so
 * a file under `src/` that imports from `scripts/` pulls that file into the
 * program and fails the build, and the same applies to `frontend/`. The first
 * attempt at sharing this did exactly that and broke CI.
 *
 * So the canonical implementation lives here, inside `src/`, where the gate
 * and the cadence can both reach it. `frontend/src/lib/readingTime.ts` keeps
 * its own copy because the frontend is a separate compilation unit, and
 * `prose-count-agreement.test.ts` asserts the two produce identical counts on
 * a shared corpus. A test file may cross the boundary that source files
 * cannot, since tsconfig excludes tests from the typecheck.
 *
 * ── Why LaTeX and fenced blocks do not count ────────────────────────────
 *
 * `wc -w` on a maths body counts tokens inside `$...$`. One base atom scores
 * 311 raw words and has 33 words of actual prose; the rest is a matrix
 * literal. A budget built on the raw count measures LaTeX density, not reading
 * load, and would punish exactly the atoms that are terse because their maths
 * is dense.
 */

/**
 * Words a student actually reads: LaTeX, fenced blocks and directive markers
 * removed.
 *
 * Fenced blocks go first. An `interactive-spec` is 15-30 lines of JSON that is
 * swapped for a rendered widget and never shown as text, and stripping it
 * first also stops `$` and `:::` inside JSON strings from confusing the later
 * patterns.
 */
export function countProseWords(content: string): number {
  if (!content) return 0;

  // Byte-identical to frontend/src/lib/readingTime.ts. Kept in lockstep by
  // prose-count-agreement.test.ts, which compares both against every atom in
  // the corpus. An earlier version of this function differed only in replacing
  // matches with a space rather than an empty string, and in two quantifiers,
  // and disagreed with the frontend on 74 real files — enough to make a CI
  // word-count failure impossible to reproduce from the rendered page.
  let stripped = content;
  stripped = stripped.replace(/```[\s\S]*?```/g, '');
  stripped = stripped.replace(/\$\$[\s\S]+?\$\$/g, '');
  stripped = stripped.replace(/\$[^\n$]+\$/g, '');
  stripped = stripped.replace(/:::[\s\S]+?:::/g, '');

  return stripped.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Prose ceilings for `assured`, per atom type.
 *
 * `shaken` is deliberately absent: it is capped against its own base atom's
 * length instead. The reason is signal rather than volume — a struggling
 * reader is never told they were given a gentler path, so the only thing they
 * can perceive is that this screen is longer than the one that already
 * defeated them, and length reads as difficulty. An absolute ceiling still
 * permits nearly 3x expansion over a terse base.
 *
 * For `assured` the risk runs the other way. Terseness is the intent, the
 * reader is not fragile, and the failure mode is padding — so an absolute
 * ceiling is the right shape there.
 */
export const ASSURED_PROSE_BUDGET: Record<string, number> = {
  hook: 130,
  intuition: 200,
  worked_example: 220,
};
