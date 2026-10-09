#!/usr/bin/env npx tsx
/**
 * scripts/check-la-walkthrough.ts
 *
 * Linear Algebra Complete Walkthrough CI gate — the "any and every concept"
 * guarantee, made mechanical.
 *
 * For every concept with `topic === 'linear-algebra'` in
 * `src/constants/concept-graph.ts` (derived from the concept graph, never
 * hardcoded — currently 26), checks four legs of the demo walkthrough:
 *
 *   1. explanation — a real explainer entry in
 *      `frontend/public/data/explainers.json`'s `by_concept`. Reuses
 *      `isRealExplainer` + `loadExplainersJson` from
 *      `scripts/check-syllabus-floor.ts` rather than re-implementing the
 *      "is this real, not a placeholder" predicate — a second copy would
 *      drift, and this gate exists precisely to catch drift, not add it.
 *
 *   2. interactive — >=1 atom under
 *      `modules/project-vidhya-content/concepts/<id>/atoms/` carrying a
 *      fenced ` ```interactive-spec\n{...}\n``` ` block that PARSES.
 *      Reuses the renderer's own `parseInteractiveSpec` (same import
 *      `scripts/lint-interactive-specs.ts` uses) so a spec that parses
 *      here is a spec the student will actually see, not a syntactically
 *      hopeful one.
 *
 *   3. practice — >=5 gradable items for the concept, counted the way the
 *      SERVER counts them: `FileLearningObjectCatalog` (the DB-less
 *      catalog `/api/practice/item/:id` falls back to) resolves the raw
 *      `data/practice-items/*.json` banks into `LearningObject`s, and
 *      `gateItemFromPayload` (the exact function
 *      `POST /api/practice/attempt` uses to decide gradability) decides
 *      whether each one is actually gradable. "Gradable" here means what
 *      the runtime means, not what the JSON claims — an item with a typo'd
 *      marking column counts as zero, same as it would for a real student.
 *      Only items whose OWN `concept_id` is this concept count toward the
 *      >=5 floor; items that reach this concept only via `also_tests` are
 *      reported as separate secondary coverage, never counted toward the
 *      floor (an item's real primary concept is the one it was authored
 *      to teach).
 *
 *   4. test — >=1 exam-style question mapped to the concept in
 *      `frontend/public/data/pyq-bank.json`. Read defensively: prefer each
 *      problem's `concept_ids` array, fall back to `concept_id`. As of
 *      this gate's introduction NEITHER field exists anywhere in the
 *      shipped bank (a sibling lane is landing the mapping) — every
 *      concept legitimately fails this leg today. See the gate's own
 *      report output for the live list.
 *
 *      EXCEPTION — `exam_tested: false` concepts (see the doc comment on
 *      `ConceptNode.exam_tested` in `src/constants/concept-graph.ts`): a
 *      handful of concepts are prerequisites real exam papers assume
 *      rather than directly test (e.g. the chain rule). Zero mapped
 *      questions is a correct, permanent property of those concepts, not
 *      a gap — the test leg passes them WITHOUT a question, but the table
 *      marks that pass distinctly (`— (not examined)`, never `✓`) so a
 *      reader can always tell "correct by design" from "has a question",
 *      and the summary line reports the two counts separately rather than
 *      folding a flagged pass into the same number as a real one.
 *
 * Usage:
 *   npx tsx scripts/check-la-walkthrough.ts               # blocking (default)
 *   npx tsx scripts/check-la-walkthrough.ts --report-only  # prints, exits 0
 *
 * Exit: 0 = every concept clears all 4 legs (or --report-only was passed).
 *       1 = at least one concept is missing at least one leg, blocking.
 *
 * Test isolation: `LA_WALKTHROUGH_EXPLAINERS_PATH`,
 * `LA_WALKTHROUGH_CONTENT_ROOT`, and `LA_WALKTHROUGH_PYQ_BANK_PATH`
 * override the three ROOT-relative read paths (all default to the real
 * repo paths below when unset). The practice-item leg has no override —
 * it reuses `FileLearningObjectCatalog`, which is intentionally
 * `process.cwd()`-relative like the runtime it mirrors, so an isolated
 * test spawns this script with a fixture `cwd` instead (matching
 * `FileLearningObjectCatalog`'s own resolution, not a parallel one that
 * could drift from it).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ALL_CONCEPTS } from '../src/constants/concept-graph';
import { isRealExplainer, loadExplainersJson } from './check-syllabus-floor';
import { parseInteractiveSpec } from '../frontend/src/components/lesson/interactives/types';
import { FileLearningObjectCatalog } from '../src/scoring/learning-object-catalog-file';
import type { AuthoredItem } from '../src/scoring/learning-object-catalog-file';
import { gateItemFromPayload } from '../src/api/practice-routes';
import { canCiteExamPaper } from '../src/content/pyq-provenance';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Which topic to walk. Defaults to linear-algebra — the topic this gate was
 * written for and the only one blocking in CI today — but `--topic=<id>` lets
 * the same four legs be measured against any topic in the concept graph.
 *
 * The parameter exists because the gate is the instrument as well as the gate:
 * filling a new topic to the Linear Algebra standard needs the same four
 * numbers reported the same way, and a second hand-written checker would drift
 * from this one the moment either changed.
 */
const TOPIC = (() => {
  const flag = process.argv.find((a) => a.startsWith('--topic='));
  return flag ? flag.slice('--topic='.length) : 'linear-algebra';
})();
const PRACTICE_FLOOR = 5;

const EXPLAINERS_PATH = process.env.LA_WALKTHROUGH_EXPLAINERS_PATH
  ? path.resolve(process.env.LA_WALKTHROUGH_EXPLAINERS_PATH)
  : path.join(ROOT, 'frontend/public/data/explainers.json');
const CONTENT_ROOT = process.env.LA_WALKTHROUGH_CONTENT_ROOT
  ? path.resolve(process.env.LA_WALKTHROUGH_CONTENT_ROOT)
  : path.join(ROOT, 'modules/project-vidhya-content/concepts');
const PYQ_BANK_PATH = process.env.LA_WALKTHROUGH_PYQ_BANK_PATH
  ? path.resolve(process.env.LA_WALKTHROUGH_PYQ_BANK_PATH)
  : path.join(ROOT, 'frontend/public/data/pyq-bank.json');
// Mirrors FileLearningObjectCatalog's own ITEMS_DIR resolution exactly —
// deliberately NOT overridable independently, so this can never read a
// different bank than the catalog it is cross-checking against.
const PRACTICE_ITEMS_DIR = path.join(process.cwd(), 'data', 'practice-items');

// ---------------------------------------------------------------------------
// Leg 1 — explanation
// ---------------------------------------------------------------------------

function countRealExplainers(
  conceptId: string,
  explainersJson: Record<string, unknown[]> | null,
): number {
  const atoms = explainersJson?.[conceptId] ?? [];
  return (atoms as Array<Parameters<typeof isRealExplainer>[0]>).filter(isRealExplainer).length;
}

// ---------------------------------------------------------------------------
// Leg 2 — interactive
// ---------------------------------------------------------------------------

interface InteractiveScan {
  valid: number;
  invalid: number;
}

function scanInteractiveSpecs(conceptId: string): InteractiveScan {
  const atomsDir = path.join(CONTENT_ROOT, conceptId, 'atoms');
  const result: InteractiveScan = { valid: 0, invalid: 0 };
  if (!fs.existsSync(atomsDir)) return result;

  for (const file of fs.readdirSync(atomsDir)) {
    if (!file.endsWith('.md')) continue;
    const body = fs.readFileSync(path.join(atomsDir, file), 'utf-8');
    if (!body.includes('```interactive-spec')) continue;
    const parsed = parseInteractiveSpec(body);
    if (parsed.ok) result.valid++;
    else result.invalid++;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Leg 3 — practice
// ---------------------------------------------------------------------------

interface PracticeResult {
  gradablePrimary: number;
  secondaryCoverage: number;
}

/**
 * `also_tests` coverage, read straight from the raw banks (not through the
 * catalog, which drops the field when it maps onto `LearningObject`).
 * Informational only — it never counts toward the >=5 floor.
 */
function loadSecondaryCoverage(dir: string = PRACTICE_ITEMS_DIR): Map<string, number> {
  const counts = new Map<string, number>();
  if (!fs.existsSync(dir)) return counts;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    let raw: { items?: AuthoredItem[] };
    try {
      raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    } catch {
      // A malformed bank is check-practice-items.ts's job to fail loudly on.
      // This gate only reads also_tests metadata from it; skip silently.
      continue;
    }
    for (const item of raw.items ?? []) {
      for (const also of item.also_tests ?? []) {
        counts.set(also, (counts.get(also) ?? 0) + 1);
      }
    }
  }
  return counts;
}

async function checkPractice(
  conceptId: string,
  catalog: FileLearningObjectCatalog,
  secondaryCoverage: Map<string, number>,
): Promise<PracticeResult> {
  const items = await catalog.query({ skillId: conceptId, limit: 500 });
  let gradable = 0;
  for (const item of items) {
    // Same function POST /api/practice/attempt uses to decide gradability —
    // "gradable" here means what the runtime means.
    const resolved = gateItemFromPayload(item.id, item.payload);
    if (typeof resolved !== 'string') gradable++;
  }
  return {
    gradablePrimary: gradable,
    secondaryCoverage: secondaryCoverage.get(conceptId) ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Leg 4 — test (PYQ)
// ---------------------------------------------------------------------------

class PyqBankParseError extends Error {
  constructor(file: string, cause: unknown) {
    super(`pyq bank failed to parse: ${file} — ${(cause as Error)?.message ?? String(cause)}`);
    this.name = 'PyqBankParseError';
  }
}

/** Per concept: how many questions are mapped, and how many of those were read against a real paper. */
export interface PyqCoverage {
  total: number;
  /** Rows where `canCiteExamPaper` holds — a recorded paper, at a reviewed evidence level. */
  reviewed: number;
}

/**
 * Concept id -> PYQ coverage. Prefers each problem's `concept_ids` array,
 * falls back to a single `concept_id`.
 * Absent bank = 0 coverage everywhere (a deployment may ship without one).
 * A bank that EXISTS but fails to parse throws loudly — same discipline as
 * `check-syllabus-floor.ts`'s `PracticeItemParseError`: a bank nobody can
 * read must never silently count as "no PYQs here".
 *
 * `reviewed` is counted through `canCiteExamPaper` (src/content/pyq-provenance.ts)
 * rather than a second copy of the rule, so this gate and the surfaces that
 * render a citation always agree on what counts as a paper question.
 */
function loadPyqConceptCounts(bankPath: string): Map<string, PyqCoverage> {
  const counts = new Map<string, PyqCoverage>();
  if (!fs.existsSync(bankPath)) return counts;

  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
  } catch (err) {
    throw new PyqBankParseError(bankPath, err);
  }

  const problems: unknown[] = Array.isArray((data as { problems?: unknown[] })?.problems)
    ? (data as { problems: unknown[] }).problems
    : (Array.isArray(data) ? (data as unknown[]) : []);

  for (const raw of problems) {
    const p = raw as { concept_ids?: unknown; concept_id?: unknown };
    let ids: string[] = [];
    if (Array.isArray(p.concept_ids) && p.concept_ids.length > 0) {
      ids = p.concept_ids.filter((x): x is string => typeof x === 'string');
    } else if (typeof p.concept_id === 'string') {
      ids = [p.concept_id];
    }
    const reviewed = canCiteExamPaper(raw as Record<string, unknown>) ? 1 : 0;
    for (const id of ids) {
      const prev = counts.get(id) ?? { total: 0, reviewed: 0 };
      counts.set(id, { total: prev.total + 1, reviewed: prev.reviewed + reviewed });
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Per-concept evaluation
// ---------------------------------------------------------------------------

interface Leg {
  pass: boolean;
  detail: string;
  /**
   * Set only on a leg that passes for a reason OTHER than real evidence.
   * Printing and counting code must treat a flagged pass distinctly from a
   * real one (see mark()/printTable() and the per-leg summary in main()); a
   * flag that reads identically to "has a question" would be worse than no
   * flag at all.
   */
  flagged?: boolean;
  /**
   * Why the pass is flagged, so two different exemptions never collapse
   * into one number:
   *   'not-examined'          — `exam_tested: false`, a concept real papers
   *                             assume rather than directly test.
   *   'unreviewed-provenance' — questions ARE mapped, but not one of them
   *                             was read against a paper
   *                             (`canCiteExamPaper` false on all of them).
   *                             The leg passes because the concept has
   *                             exam-level practice; it is not a ✓ because
   *                             nothing here is evidence about the paper.
   */
  flag_reason?: 'not-examined' | 'unreviewed-provenance';
}

export interface ConceptWalkthrough {
  concept_id: string;
  explanation: Leg;
  interactive: Leg;
  practice: Leg;
  test: Leg;
  allPass: boolean;
}

export async function evaluateWalkthrough(
  concepts: ReadonlyArray<{ id: string; exam_tested?: boolean }>,
  explainersJson: Record<string, unknown[]> | null,
  pyqCounts: Map<string, PyqCoverage>,
  secondaryCoverage: Map<string, number>,
  catalog: FileLearningObjectCatalog,
): Promise<ConceptWalkthrough[]> {
  const out: ConceptWalkthrough[] = [];
  for (const c of concepts) {
    const explainCount = countRealExplainers(c.id, explainersJson);
    const interactive = scanInteractiveSpecs(c.id);
    const practice = await checkPractice(c.id, catalog, secondaryCoverage);
    const testCoverage = pyqCounts.get(c.id) ?? { total: 0, reviewed: 0 };
    const testCount = testCoverage.total;
    // Default-true, same "absent ⇒ tested" contract as ConceptNode.exam_tested.
    const isExamTested = c.exam_tested !== false;

    const explanation: Leg = {
      pass: explainCount >= 1,
      detail: `${explainCount}`,
    };
    const interactiveLeg: Leg = {
      pass: interactive.valid >= 1,
      detail: interactive.invalid > 0 ? `${interactive.valid} (+${interactive.invalid} invalid)` : `${interactive.valid}`,
    };
    const practiceLeg: Leg = {
      pass: practice.gradablePrimary >= PRACTICE_FLOOR,
      detail: practice.secondaryCoverage > 0
        ? `${practice.gradablePrimary}/${PRACTICE_FLOOR} (+${practice.secondaryCoverage} secondary)`
        : `${practice.gradablePrimary}/${PRACTICE_FLOOR}`,
    };
    // A flagged concept passes with zero questions BY DESIGN (see the
    // interface doc comment on `flagged` and the file header) — but only
    // when it actually HAS zero questions. A real question mapped to a
    // flagged concept anyway is still real evidence, so it's reported and
    // counted exactly like any other concept's — the flag exempts an
    // absence, it never hides or relabels a presence.
    // Three ways this leg can land, and they are deliberately not one
    // number. A concept with two authored exam-pattern questions has real
    // practice at exam level, so it passes; but it has no evidence about
    // what a paper asked, so it must not print the same ✓ as a concept
    // backed by a reviewed paper question. Collapsing the two is how a
    // bank of authored questions starts reading as a bank of past papers.
    const test: Leg = !isExamTested && testCount === 0
      ? { pass: true, detail: 'not examined', flagged: true, flag_reason: 'not-examined' }
      : testCount === 0
        ? { pass: false, detail: '0' }
        : testCoverage.reviewed >= 1
          ? { pass: true, detail: `${testCount} (${testCoverage.reviewed} reviewed)` }
          : {
              pass: true,
              detail: `${testCount}, none reviewed`,
              flagged: true,
              flag_reason: 'unreviewed-provenance',
            };

    out.push({
      concept_id: c.id,
      explanation,
      interactive: interactiveLeg,
      practice: practiceLeg,
      test,
      allPass: explanation.pass && interactiveLeg.pass && practiceLeg.pass && test.pass,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

const LEG_NAMES = ['explanation', 'interactive', 'practice', 'test'] as const;
type LegName = (typeof LEG_NAMES)[number];

function mark(leg: Leg): string {
  if (leg.flagged) return '—'; // pass by design, not by evidence — never a bare ✓
  return leg.pass ? '✓' : '✗';
}

function cell(leg: Leg): string {
  return `${mark(leg)} (${leg.detail})`;
}

function printTable(results: ConceptWalkthrough[]): void {
  const idWidth = Math.max('concept_id'.length, ...results.map((r) => r.concept_id.length)) + 2;
  const legWidth = (legName: LegName): number =>
    Math.max(legName.length, ...results.map((r) => cell(r[legName]).length)) + 2;
  const widths: Record<LegName, number> = {
    explanation: legWidth('explanation'),
    interactive: legWidth('interactive'),
    practice: legWidth('practice'),
    test: legWidth('test'),
  };

  const header =
    'concept_id'.padEnd(idWidth) +
    LEG_NAMES.map((leg) => leg.padEnd(widths[leg])).join('');
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const r of results) {
    const row =
      r.concept_id.padEnd(idWidth) +
      LEG_NAMES.map((leg) => cell(r[leg]).padEnd(widths[leg])).join('');
    console.log(row);
  }
}

function printFailures(results: ConceptWalkthrough[]): string[] {
  const lines: string[] = [];
  for (const r of results) {
    for (const legName of LEG_NAMES) {
      const leg = r[legName as LegName];
      if (!leg.pass) {
        lines.push(`  ✗ [${r.concept_id}] ${legName} leg failing (have ${leg.detail})`);
      }
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const reportOnly = process.argv.includes('--report-only');

  console.log(
    `\n[check-la-walkthrough] Checking every "${TOPIC}" concept across 4 legs ` +
    `(explanation, interactive, practice, test)\n`,
  );

  const concepts = ALL_CONCEPTS.filter((c) => c.topic === TOPIC);
  if (concepts.length === 0) {
    console.error(`[check-la-walkthrough] FATAL — no concepts with topic="${TOPIC}" found in concept-graph.ts`);
    process.exit(1);
    return;
  }

  const explainersJson = loadExplainersJson(EXPLAINERS_PATH);

  let pyqCounts: Map<string, PyqCoverage>;
  try {
    pyqCounts = loadPyqConceptCounts(PYQ_BANK_PATH);
  } catch (err) {
    if (err instanceof PyqBankParseError) {
      console.error(`[check-la-walkthrough] FATAL — ${err.message}\n`);
      process.exit(1);
      return;
    }
    throw err;
  }

  const secondaryCoverage = loadSecondaryCoverage();
  const catalog = new FileLearningObjectCatalog();

  const results = await evaluateWalkthrough(concepts, explainersJson, pyqCounts, secondaryCoverage, catalog);

  printTable(results);

  const passCount = results.filter((r) => r.allPass).length;
  const failCount = results.length - passCount;

  const legPassCounts = Object.fromEntries(
    LEG_NAMES.map((leg) => [leg, results.filter((r) => r[leg as LegName].pass).length]),
  );

  // The test leg is the one leg that can pass two different ways (a real
  // mapped question, or the exam_tested:false exemption) — reported
  // separately so the summary line never claims coverage the bank does not
  // have. `legPassCounts.test` (all passes, real+flagged) is intentionally
  // NOT what gets printed for this leg below.
  const notExaminedCount = results.filter((r) => r.test.flag_reason === 'not-examined').length;
  const unreviewedCount = results.filter((r) => r.test.flag_reason === 'unreviewed-provenance').length;
  const testRealPassCount = results.filter((r) => r.test.pass && !r.test.flagged).length;
  const testNotes = [
    notExaminedCount > 0 ? `+${notExaminedCount} not examined` : null,
    unreviewedCount > 0 ? `+${unreviewedCount} mapped but no reviewed paper question` : null,
  ].filter(Boolean);
  const testSummary = testNotes.length > 0
    ? `test ${testRealPassCount}/${results.length} (${testNotes.join(', ')})`
    : `test ${legPassCounts.test}/${results.length}`;

  console.log(
    `\nChecked ${results.length} concepts | Full walkthrough: ${passCount} pass, ${failCount} fail`,
  );
  console.log(
    `Per-leg: explanation ${legPassCounts.explanation}/${results.length}, ` +
    `interactive ${legPassCounts.interactive}/${results.length}, ` +
    `practice ${legPassCounts.practice}/${results.length}, ` +
    `${testSummary}`,
  );

  if (failCount === 0) {
    console.log(`\n✓ Every "${TOPIC}" concept has a complete 4-leg walkthrough.\n`);
    process.exit(0);
    return;
  }

  console.log(`\n${'-'.repeat(60)}`);
  console.log(`MISSING LEGS (${reportOnly ? 'REPORT-ONLY' : 'BLOCKING'})`);
  console.log('-'.repeat(60));
  for (const line of printFailures(results)) console.log(line);
  console.log('-'.repeat(60));

  if (reportOnly) {
    console.log(
      `\n[check-la-walkthrough] ${failCount} concept(s) incomplete — not blocking (--report-only)\n`,
    );
    process.exit(0);
  } else {
    console.error(`\n[check-la-walkthrough] ${failCount} concept(s) incomplete — build FAILED\n`);
    process.exit(1);
  }
}

// Only run when invoked as a CLI. Without this guard, importing the module
// to test its pure functions would execute main() and call process.exit().
if (process.argv[1]?.endsWith('check-la-walkthrough.ts')) {
  main().catch((e) => {
    console.error('[check-la-walkthrough] Fatal error:', e);
    process.exit(1);
  });
}
