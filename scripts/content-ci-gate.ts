/**
 * Content CI gate (realignment item 8, plan D4.2).
 *
 * Run: npx tsx scripts/content-ci-gate.ts
 * Exit: 0 when every check passes, 1 on any violation.
 *
 * Checks:
 *   A. atoms-dir check — every directory under
 *      modules/project-vidhya-content/concepts/ is a concept-graph id.
 *      (The RC1 regression class — a silently unreachable atom dir —
 *      becomes CI-impossible.)
 *   B. retired-id grep — the pre-realignment atom-dir ids appear nowhere
 *      in src/, frontend/src/, modules/, scripts/, data/.
 *   C. placeholder ratchet — count of model:"placeholder" explainers in
 *      frontend/public/data/explainers.json must not exceed the committed
 *      baseline (82, the grandfathered pre-realignment state). With
 *      CONTENT_CI_STRICT=true the allowance is ZERO — Giri flips that env
 *      in .github/workflows/ci.yml in the same commit that lands the
 *      first real explainers.json (placeholder sequencing rule).
 *   D. golden set v0 (committed data only, 21 checks):
 *      - the 15 MCQs in data/courses/gate-em/topics/01-linear-algebra/
 *        mcqs.json each carry a non-empty correct_answer present in options
 *      - the 3 seed concepts (derivatives-basic, eigenvalues,
 *        complex-numbers) resolve through the atom loader without error,
 *        and their worked-example / micro-exercise answer keys extract
 *        non-empty (\boxed{...} / <summary>Answer</summary> block).
 *      Growing to the full 24-item LA chapter when the Cowork artifact is
 *      staged remains a TODO (spec).
 *   E. prerequisite-DAG cycle check (CEO plan Phase 0, §6) — the concept
 *      graph's prerequisite edges must form a DAG. A cycle silently breaks
 *      topologicalSort() (Kahn's algorithm just drops the cyclic nodes,
 *      no error) and would infinite-loop-adjacent code paths elsewhere.
 *      See src/curriculum/prereq-cycles.ts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ALL_CONCEPTS } from '../src/constants/concept-graph';
import { loadConceptAtoms, loadConceptMeta } from '../src/content/atom-loader';
import { findPrerequisiteCycle } from '../src/curriculum/prereq-cycles';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Placeholder ratchet baseline — the grandfathered shipped state. */
const PLACEHOLDER_BASELINE = 82;

const GOLDEN_CONCEPTS = ['derivatives-basic', 'eigenvalues', 'complex-numbers'];

/**
 * Retired ids, assembled so this file never contains the literal strings
 * it polices (the grep would otherwise flag its own guard).
 */
const RETIRED_IDS = [
  ['calculus', 'derivatives'].join('-'),
  ['linear', 'algebra', 'eigenvalues'].join('-'),
];

const failures: string[] = [];
function fail(check: string, message: string): void {
  failures.push(`[${check}] ${message}`);
}
function ok(check: string, message: string): void {
  console.log(`  ok  [${check}] ${message}`);
}

// ─── A. atoms-dir check ─────────────────────────────────────────────────

function checkAtomsDirs(): void {
  const conceptsRoot = path.join(ROOT, 'modules/project-vidhya-content/concepts');
  if (!fs.existsSync(conceptsRoot)) {
    fail('atoms-dir', `concepts root missing: ${conceptsRoot}`);
    return;
  }
  const knownIds = new Set(ALL_CONCEPTS.map((c) => c.id));
  const dirs = fs
    .readdirSync(conceptsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const unknown = dirs.filter((d) => !knownIds.has(d));
  if (unknown.length > 0) {
    fail('atoms-dir', `atom dirs are not concept-graph ids: ${unknown.join(', ')}`);
  } else {
    ok('atoms-dir', `${dirs.length} atom dirs, all are concept-graph ids`);
  }
}

// ─── B. retired-id grep ─────────────────────────────────────────────────

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.data', 'coverage']);
const TEXT_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.yaml', '.yml',
  '.txt', '.html', '.css', '.sql', '.sh',
]);

function* walkFiles(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walkFiles(path.join(dir, entry.name));
    } else if (entry.isFile()) {
      if (TEXT_EXTS.has(path.extname(entry.name))) yield path.join(dir, entry.name);
    }
  }
}

function checkRetiredIds(): void {
  const scanRoots = ['src', 'frontend/src', 'modules', 'scripts', 'data']
    .map((p) => path.join(ROOT, p))
    .filter((p) => fs.existsSync(p));
  const selfPath = path.join(ROOT, 'scripts', 'content-ci-gate.ts');
  const hits: string[] = [];
  for (const root of scanRoots) {
    for (const file of walkFiles(root)) {
      if (file === selfPath) continue; // this guard assembles the ids from parts anyway
      let content: string;
      try {
        content = fs.readFileSync(file, 'utf-8');
      } catch {
        continue;
      }
      for (const id of RETIRED_IDS) {
        if (content.includes(id)) hits.push(`${path.relative(ROOT, file)} contains '${id}'`);
      }
    }
  }
  if (hits.length > 0) {
    fail('retired-ids', `retired concept ids found:\n    ${hits.join('\n    ')}`);
  } else {
    ok('retired-ids', `no retired ids in src/, frontend/src/, modules/, scripts/, data/`);
  }
}

// ─── C. placeholder ratchet ─────────────────────────────────────────────

function checkPlaceholderRatchet(): void {
  const explainersPath = path.join(ROOT, 'frontend/public/data/explainers.json');
  if (!fs.existsSync(explainersPath)) {
    fail('placeholder-ratchet', `missing ${path.relative(ROOT, explainersPath)}`);
    return;
  }
  let count = 0;
  try {
    const raw = JSON.parse(fs.readFileSync(explainersPath, 'utf-8'));
    const byConcept: Record<string, { model?: string }> = raw.by_concept ?? {};
    count = Object.values(byConcept).filter((e) => e?.model === 'placeholder').length;
  } catch (e: any) {
    fail('placeholder-ratchet', `explainers.json unreadable: ${e?.message}`);
    return;
  }
  const strict = process.env.CONTENT_CI_STRICT === 'true';
  const allowed = strict ? 0 : PLACEHOLDER_BASELINE;
  if (count > allowed) {
    fail(
      'placeholder-ratchet',
      strict
        ? `CONTENT_CI_STRICT=true requires ZERO placeholder explainers; found ${count}`
        : `placeholder explainers increased: ${count} > baseline ${PLACEHOLDER_BASELINE}`,
    );
  } else {
    ok(
      'placeholder-ratchet',
      `${count} placeholder explainers (allowed ${allowed}${strict ? ', STRICT' : ''})`,
    );
  }
}

// ─── D. golden set v0 ───────────────────────────────────────────────────

function checkGoldenMcqs(): void {
  const mcqPath = path.join(ROOT, 'data/courses/gate-em/topics/01-linear-algebra/mcqs.json');
  if (!fs.existsSync(mcqPath)) {
    fail('golden-mcqs', `missing ${path.relative(ROOT, mcqPath)}`);
    return;
  }
  let questions: Array<{ id?: string; correct_answer?: string; options?: Record<string, string> }>;
  try {
    questions = JSON.parse(fs.readFileSync(mcqPath, 'utf-8')).questions ?? [];
  } catch (e: any) {
    fail('golden-mcqs', `mcqs.json unreadable: ${e?.message}`);
    return;
  }
  if (questions.length < 15) {
    fail('golden-mcqs', `expected the 15-item golden set, found ${questions.length}`);
  }
  for (const q of questions) {
    const label = q.id ?? '(missing id)';
    const key = (q.correct_answer ?? '').trim();
    if (!key) {
      fail('golden-mcqs', `${label}: empty correct_answer`);
      continue;
    }
    const options = q.options ?? {};
    if (!(key in options) || !String(options[key] ?? '').trim()) {
      fail('golden-mcqs', `${label}: correct_answer '${key}' not present in options`);
    }
  }
  if (failures.every((f) => !f.startsWith('[golden-mcqs]'))) {
    ok('golden-mcqs', `${questions.length} MCQs, every correct_answer resolves in options`);
  }
}

/** Brace-balanced \boxed{...} extractor (mirrors rubric-grader's rule). */
function extractBoxed(text: string): string | null {
  const marker = '\\boxed{';
  const start = text.indexOf(marker);
  if (start === -1) return null;
  let depth = 1;
  let i = start + marker.length;
  const begin = i;
  while (i < text.length && depth > 0) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') depth -= 1;
    i += 1;
  }
  if (depth !== 0) return null;
  const inner = text.slice(begin, i - 1).trim();
  return inner.length > 0 ? inner : null;
}

/** <summary>Answer</summary> details-block extractor. */
function extractAnswerBlock(text: string): string | null {
  const m = text.match(/<summary>\s*Answer\s*<\/summary>([\s\S]*?)<\/details>/i);
  if (!m) return null;
  const inner = m[1].trim();
  return inner.length > 0 ? inner : null;
}

async function checkGoldenConcepts(): Promise<void> {
  for (const conceptId of GOLDEN_CONCEPTS) {
    try {
      const atoms = await loadConceptAtoms(conceptId);
      await loadConceptMeta(conceptId);
      if (atoms.length === 0) {
        fail('golden-atoms', `${conceptId}: loader returned zero atoms`);
        continue;
      }

      const workedExamples = atoms.filter((a) => a.atom_type === 'worked_example');
      if (workedExamples.length === 0) {
        fail('golden-atoms', `${conceptId}: no worked_example atom`);
      }
      for (const atom of workedExamples) {
        const key = extractBoxed(atom.content ?? '');
        if (!key) {
          fail('golden-atoms', `${conceptId}/${atom.id}: no non-empty \\boxed{...} answer key`);
        }
      }

      const microExercises = atoms.filter((a) => a.atom_type === 'micro_exercise');
      if (microExercises.length === 0) {
        fail('golden-atoms', `${conceptId}: no micro_exercise atom`);
      }
      for (const atom of microExercises) {
        const key = extractAnswerBlock(atom.content ?? '');
        if (!key) {
          fail('golden-atoms', `${conceptId}/${atom.id}: no non-empty <summary>Answer</summary> block`);
        }
      }
    } catch (e: any) {
      fail('golden-atoms', `${conceptId}: atom loader threw — ${e?.message}`);
    }
  }
  if (failures.every((f) => !f.startsWith('[golden-atoms]'))) {
    ok('golden-atoms', `${GOLDEN_CONCEPTS.join(', ')} resolve with non-empty answer keys`);
  }
}

// ─── E. prerequisite-DAG cycle check ────────────────────────────────────

function checkPrerequisiteCycles(): void {
  const cycle = findPrerequisiteCycle(ALL_CONCEPTS);
  if (cycle) {
    fail('cycle-check', `prerequisite DAG has a cycle: ${cycle.join(' -> ')}`);
  } else {
    ok('cycle-check', `${ALL_CONCEPTS.length}-node prerequisite graph is a valid DAG (no cycles)`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('content-ci-gate — checks A-E (plan D4.2 + CEO plan Phase 0 §6)\n');
  checkAtomsDirs();
  checkRetiredIds();
  checkPlaceholderRatchet();
  checkGoldenMcqs();
  await checkGoldenConcepts();
  checkPrerequisiteCycles();

  if (failures.length > 0) {
    console.error(`\nFAIL — ${failures.length} violation(s):`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log('\nPASS — content gate clean');
}

main().catch((e) => {
  console.error(`content-ci-gate crashed: ${e?.stack ?? e}`);
  process.exit(1);
});
