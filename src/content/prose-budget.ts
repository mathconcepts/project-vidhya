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

import { loadInteractiveSpecParser } from './interactive-spec-loader';

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
 * Counts words in a bare string of already-extracted text (a beat's `text`,
 * a trap's `text`/`avoid`) — the same LaTeX-stripping rule as
 * `countProseWords`, minus the fenced-block/directive stripping those never
 * contain. A beat routinely carries inline `$...$` (see any resonance hook),
 * and counting the LaTeX source as "words" would measure notation density,
 * not reading load — the exact distortion `countProseWords` was built to
 * avoid for atom bodies.
 */
function countWordsInBareText(text: string): number {
  if (!text) return 0;
  const stripped = text.replace(/\$\$[\s\S]+?\$\$/g, '').replace(/\$[^\n$]+\$/g, '');
  return stripped.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * /design-review (2026-09-03, "content delivery... how to explain more in
 * less"): a resonance-beat scene's `narration_steps` text lives inside the
 * `` ```interactive-spec``` `` fence that `countProseWords` strips whole —
 * by design, since that fence is normally 15-30 lines of layout JSON never
 * shown as text. For a beat-carrying hook/intuition atom this is no longer
 * true: the narration text INSIDE the fence is the majority of what a
 * student actually reads, and `countProseWords`/`ASSURED_PROSE_BUDGET` are
 * completely blind to it. Verified on `eigenvalues.hook`: the gate reports
 * 64 words (the one intro paragraph); the real reading load for a single
 * playthrough — one stance's text per beat, summed, plus the trap once
 * revealed — is closer to 220.
 *
 * Mirrors `resolveBeatText`'s exact per-stance fallback
 * (`frontend/src/components/lesson/interactives/Simulation.tsx`) rather than
 * a second copy of that rule: `text_<stance>` when present for a matching
 * stance, else the base `text`. `trap.text`/`trap.avoid` are counted
 * unconditionally — `TrapRow` renders them for every stance once the trap
 * beat is reached, never a stance-varied trap. Async because the shared
 * `interactive-spec-loader` import is; returns 0 (never throws) when no
 * fence is present, the fence isn't a `simulation` kind, or the validator is
 * unreachable in this process (the demo-image degradation case) — a caller
 * measuring reading load must treat that as "couldn't measure", same
 * contract as the loader's own doc comment, not "zero beats".
 */
export async function countBeatProseWords(
  content: string,
  stance?: 'shaken' | 'assured',
): Promise<number> {
  if (!content || !content.includes('```interactive-spec')) return 0;
  const parse = await loadInteractiveSpecParser();
  if (!parse) return 0;
  const result = parse(content);
  if (!result.ok) return 0;
  const spec = result.spec;
  if (spec?.kind !== 'simulation' || !Array.isArray(spec.narration_steps)) return 0;

  let total = 0;
  for (const step of spec.narration_steps) {
    const text =
      (stance === 'shaken' && step.text_shaken) ||
      (stance === 'assured' && step.text_assured) ||
      step.text ||
      '';
    total += countWordsInBareText(text);
    if (step.trap) {
      total += countWordsInBareText(step.trap.text ?? '');
      total += countWordsInBareText(step.trap.avoid ?? '');
    }
  }
  return total;
}

/**
 * The real reading load of an atom body for one served stance: the prose
 * outside any fence, plus (for a beat-carrying atom) the narration text the
 * fence hides from `countProseWords`. Async for the same reason
 * `countBeatProseWords` is — see its doc comment for what a 0 beat
 * contribution can mean when the validator is unreachable.
 */
export async function countTotalReadingLoad(
  content: string,
  stance?: 'shaken' | 'assured',
): Promise<number> {
  return countProseWords(content) + (await countBeatProseWords(content, stance));
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
