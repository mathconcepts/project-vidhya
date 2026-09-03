#!/usr/bin/env npx tsx
/**
 * scripts/check-reading-load.ts
 *
 * /design-review (2026-09-03, "content delivery... how to explain more in
 * less, which areas to concentrate on"). Report-only, non-blocking by
 * design — always exits 0. There is no existing ground-truth ceiling for
 * most atom types (only hook/intuition/worked_example have an
 * `ASSURED_PROSE_BUDGET` entry, and only for the `assured` stance), so this
 * is a measurement tool a human reads, not a new CI gate a build can fail —
 * see docs/designs/2026-09-03-content-delivery-first-principles-review.md
 * for what it found and why turning this into a blocking gate needs an
 * editorial ceiling decision first, not a code decision.
 *
 * Two things this measures that nothing else in the repo does:
 *
 *   1. Real per-atom reading load for the DEFAULT ("steady") stance —
 *      `countTotalReadingLoad`'s prose-outside-fence + beat-narration-text
 *      sum (src/content/prose-budget.ts) — vs. what `countProseWords`
 *      alone reports (what the existing `variant-agreement.ts` CI gate
 *      sees). A beat-carrying atom's gate-visible count can be a fraction
 *      of what a student actually reads, because the beat text lives
 *      inside the `` ```interactive-spec``` `` fence `countProseWords`
 *      strips whole.
 *
 *   2. `common_traps` word counts specifically — the one atom type with NO
 *      `ASSURED_PROSE_BUDGET` entry, no `stances:` guidance block in any
 *      topic template (`modules/project-vidhya-content/templates/*.yaml`),
 *      and (per pedagogy-engine.ts's error-streak handling) the atom
 *      type force-injected to the front of the queue after 3 consecutive
 *      wrong answers — the exact moment a student's cognitive load is
 *      already highest.
 *
 * Usage:
 *   npx tsx scripts/check-reading-load.ts             # full report
 *   npx tsx scripts/check-reading-load.ts --top=30     # widen the ranked list
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { ALL_CONCEPTS } from '../src/constants/concept-graph';
import { countProseWords, countTotalReadingLoad, ASSURED_PROSE_BUDGET } from '../src/content/prose-budget';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONCEPTS_ROOT = path.join(ROOT, 'modules', 'project-vidhya-content', 'concepts');

interface AtomMeasurement {
  concept_id: string;
  file: string;
  atom_type: string;
  stance: 'shaken' | 'assured' | undefined;
  gate_visible_words: number; // what countProseWords / variant-agreement.ts sees today
  real_reading_load: number; // countTotalReadingLoad — includes beat narration text
  has_beat: boolean;
}

/**
 * Filenames are kebab-case (`common-traps.md`, `worked-example-assured.md`);
 * `AtomType` (src/content/content-types.ts) is snake_case
 * (`common_traps`, `worked_example`). A plain global hyphen->underscore
 * replace is safe here because none of the 11 authored atom-type stems use
 * a hyphen for anything other than the word separator kebab-case itself
 * introduces.
 */
function stanceAndAtomTypeFromFilename(file: string): { atom_type: string; stance: 'shaken' | 'assured' | undefined } {
  const stem = file.replace(/\.md$/, '');
  const toAtomType = (s: string) => s.replace(/-/g, '_');
  if (stem.endsWith('-shaken')) return { atom_type: toAtomType(stem.slice(0, -'-shaken'.length)), stance: 'shaken' };
  if (stem.endsWith('-assured')) return { atom_type: toAtomType(stem.slice(0, -'-assured'.length)), stance: 'assured' };
  return { atom_type: toAtomType(stem), stance: undefined };
}

async function measureConceptAtoms(concept_id: string): Promise<AtomMeasurement[]> {
  const dir = path.join(CONCEPTS_ROOT, concept_id, 'atoms');
  if (!fs.existsSync(dir)) return [];
  const out: AtomMeasurement[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { content } = matter(raw);
    const { atom_type, stance } = stanceAndAtomTypeFromFilename(file);
    const gate_visible_words = countProseWords(content);
    const real_reading_load = await countTotalReadingLoad(content, stance);
    out.push({
      concept_id,
      file,
      atom_type,
      stance,
      gate_visible_words,
      real_reading_load,
      has_beat: real_reading_load > gate_visible_words,
    });
  }
  return out;
}

async function main() {
  const topFlag = process.argv.find((a) => a.startsWith('--top='));
  const top = topFlag ? parseInt(topFlag.split('=')[1], 10) : 20;

  const all: AtomMeasurement[] = [];
  for (const concept of ALL_CONCEPTS) {
    all.push(...(await measureConceptAtoms(concept.id)));
  }

  console.log(`[check-reading-load] measured ${all.length} atom files across ${ALL_CONCEPTS.length} concepts\n`);

  // ── 1. The beat-blind-spot finding ──────────────────────────────────────
  const beatCarrying = all.filter((a) => a.has_beat);
  const undercounted = beatCarrying
    .map((a) => ({ ...a, ratio: a.gate_visible_words > 0 ? a.real_reading_load / a.gate_visible_words : Infinity }))
    .sort((a, b) => b.ratio - a.ratio);

  console.log(`── Beat-carrying atoms: ${beatCarrying.length} ──`);
  console.log(`These atoms have narration text a student reads that countProseWords/variant-agreement.ts never sees.\n`);
  console.log('concept_id / file'.padEnd(45) + 'gate sees'.padStart(10) + '  real load'.padStart(12) + '  ratio'.padStart(8));
  for (const a of undercounted.slice(0, top)) {
    const label = `${a.concept_id}/${a.file}`;
    console.log(
      label.padEnd(45) +
        String(a.gate_visible_words).padStart(10) +
        String(a.real_reading_load).padStart(12) +
        `  ${a.ratio === Infinity ? '∞' : a.ratio.toFixed(1) + 'x'}`,
    );
  }

  // ── 2. common_traps — the unbudgeted, highest-load-moment atom type ────
  const traps = all.filter((a) => a.atom_type === 'common_traps' && a.stance === undefined);
  const trapWords = traps.map((a) => a.real_reading_load).sort((a, b) => b - a);
  const avg = trapWords.length ? trapWords.reduce((s, n) => s + n, 0) / trapWords.length : 0;
  const widestBudget = Math.max(...Object.values(ASSURED_PROSE_BUDGET));

  console.log(`\n── common_traps: ${traps.length} base atoms, no ASSURED_PROSE_BUDGET entry ──`);
  console.log(`average ${avg.toFixed(0)} words | widest existing budget (any atom type, assured stance) is ${widestBudget}`);
  console.log(`${trapWords.filter((n) => n > widestBudget).length} of ${traps.length} exceed that ${widestBudget}-word ceiling anyway\n`);
  console.log('Largest common_traps atoms:');
  const trapsSorted = [...traps].sort((a, b) => b.real_reading_load - a.real_reading_load);
  for (const a of trapsSorted.slice(0, Math.min(top, 10))) {
    console.log(`  ${a.concept_id.padEnd(35)} ${a.real_reading_load} words`);
  }

  console.log(`\n[check-reading-load] report-only — never fails the build. See docs/designs/2026-09-03-content-delivery-first-principles-review.md`);
  process.exit(0);
}

if (process.argv[1]?.endsWith('check-reading-load.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { measureConceptAtoms, stanceAndAtomTypeFromFilename };
