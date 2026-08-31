#!/usr/bin/env npx tsx
/**
 * lint-interactive-specs — validate every ```interactive-spec block in the
 * content module against the schema the renderer actually enforces.
 *
 * Why this exists: `interactive-spec` blocks are hand-authored (no generator
 * emits them). The renderer's failure mode is silent — `InteractiveSidecar`
 * returns null on a bad spec, so a typo ships as a missing widget that nobody
 * notices until a student (or a visitor at a demo) sees a lesson with a hole
 * in it. This turns that silence into a build failure.
 *
 * It deliberately imports the REAL validator from
 * `frontend/src/components/lesson/interactives/types.ts` rather than
 * reimplementing it. A second copy of the rules would drift, and content that
 * passes the linter but fails the renderer is the exact bug this is meant to
 * prevent.
 *
 * Beyond shape validation it EXERCISES the specs, which the renderer's
 * validator does not:
 *   - manipulable: evaluates every output formula at the min / midpoint / max
 *     of every input, catching unknown identifiers, unsupported functions,
 *     NaN and Infinity — all of which pass `validateManipulable` but throw or
 *     render garbage at runtime.
 *   - simulation: samples x_expr / y_expr across [t_min, t_max] for the same
 *     reason.
 *   - guided_walkthrough with a `branches` tree (W2.5): walks every
 *     root-to-leaf path the student can take, and holds the leaf prose to
 *     the design contract — a reason renders as a 17px sentence, never a
 *     code, so a committed leaf must actually read as one.
 *
 * Usage:
 *   npx tsx scripts/lint-interactive-specs.ts            # lint all content
 *   npx tsx scripts/lint-interactive-specs.ts --census   # also print a kind census
 *   npx tsx scripts/lint-interactive-specs.ts --dir path # lint a subtree
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseInteractiveSpec,
  evalFormula,
  type InteractiveSpec,
  type ManipulableSpec,
  type SimulationSpec,
  type GuidedWalkthroughSpec,
  type BranchNode,
} from '../frontend/src/components/lesson/interactives/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIR = path.join(ROOT, 'modules/project-vidhya-content/concepts');

/** Sample count across a simulation's t-range. Cheap; catches asymptotes. */
const SIM_SAMPLES = 25;

interface Failure {
  file: string;
  reason: string;
}

const failures: Failure[] = [];
const census: Record<string, number> = {};
let specCount = 0;

function fail(file: string, reason: string): void {
  failures.push({ file: path.relative(ROOT, file), reason });
}

/**
 * Walk a manipulable's input space and evaluate every output formula.
 * Three points per input (min, mid, max) held independently while the other
 * inputs sit at their initial value — enough to catch the real authoring
 * mistakes (typo'd identifier, divide-by-zero at an endpoint, log of a
 * negative) without a combinatorial sweep.
 */
function exerciseManipulable(file: string, spec: ManipulableSpec): void {
  const baseline: Record<string, number> = {};
  for (const inp of spec.inputs) {
    baseline[inp.id] = typeof inp.initial === 'number' ? inp.initial : inp.min;
  }

  for (const inp of spec.inputs) {
    const probes = [inp.min, (inp.min + inp.max) / 2, inp.max];
    for (const probe of probes) {
      const vars = { ...baseline, [inp.id]: probe };
      for (const out of spec.outputs) {
        let value: number;
        try {
          value = evalFormula(out.formula, vars);
        } catch (e) {
          fail(
            file,
            `output "${out.label}" formula \`${out.formula}\` threw at ${inp.id}=${probe}: ${(e as Error).message}`,
          );
          continue;
        }
        if (!Number.isFinite(value)) {
          fail(
            file,
            `output "${out.label}" formula \`${out.formula}\` produced ${value} at ${inp.id}=${probe} ` +
              `(a student can reach this by dragging the slider)`,
          );
        }
      }
    }
  }
}

/** Sample a simulation's parametric expressions across its declared t-range. */
function exerciseSimulation(file: string, spec: SimulationSpec): void {
  if (spec.linear_map) {
    // A linear-map scene has no t-sampled expressions to exercise; its one
    // semantic hazard — a claimed eigenpair that isn't one — is already
    // re-verified numerically by the shared validator (checkLinearMap), so
    // a false pair fails parseInteractiveSpec above before reaching here.
    return;
  }
  if (
    typeof spec.x_expr !== 'string' || typeof spec.y_expr !== 'string' ||
    typeof spec.t_min !== 'number' || typeof spec.t_max !== 'number'
  ) {
    fail(file, 'simulation without linear_map is missing x_expr/y_expr/t_min/t_max');
    return;
  }
  const span = spec.t_max - spec.t_min;
  for (let i = 0; i <= SIM_SAMPLES; i++) {
    const t = spec.t_min + (span * i) / SIM_SAMPLES;
    for (const [axis, expr] of [
      ['x_expr', spec.x_expr],
      ['y_expr', spec.y_expr],
    ] as const) {
      let value: number;
      try {
        value = evalFormula(expr, { t });
      } catch (e) {
        fail(file, `${axis} \`${expr}\` threw at t=${t.toFixed(3)}: ${(e as Error).message}`);
        return;
      }
      if (!Number.isFinite(value)) {
        fail(file, `${axis} \`${expr}\` produced ${value} at t=${t.toFixed(3)}`);
        return;
      }
    }
  }
}

/**
 * Depth bound on a walk through a branching walkthrough. The validator
 * already refuses cycles, so this only catches a tree so deep that a
 * student would give up before reaching a leaf — and it keeps the path
 * enumeration below from exploding on a pathological spec.
 */
const MAX_BRANCH_DEPTH = 10;
/** A leaf reason renders as a sentence. Fewer words than this is a code. */
const MIN_REASON_WORDS = 4;

/**
 * Walk every route a student can take through a `branches` tree.
 *
 * The validator (shared with the renderer) already guarantees the tree is
 * acyclic, fully reachable and free of dangling targets. What it cannot
 * judge is whether the committed CONTENT holds up: a leaf whose reason is
 * `wrong_method` passes every structural rule and renders as a dead end
 * that teaches nothing.
 */
function exerciseBranches(file: string, spec: GuidedWalkthroughSpec): void {
  const branches = spec.branches;
  if (!branches) return;

  const byId = new Map<string, BranchNode>(branches.nodes.map((n) => [n.id, n]));
  const leafIds = new Set(branches.leaves.map((l) => l.id));
  const reachedLeaves = new Set<string>();

  function walk(id: string, depth: number, path: string[]): void {
    if (depth > MAX_BRANCH_DEPTH) {
      fail(file, `branch path ${path.join(' → ')} exceeds ${MAX_BRANCH_DEPTH} questions deep`);
      return;
    }
    if (leafIds.has(id)) {
      reachedLeaves.add(id);
      return;
    }
    const node = byId.get(id);
    if (!node) return;  // validator already refused this case
    for (const o of node.options) walk(o.next, depth + 1, [...path, o.label]);
  }
  walk(branches.nodes[0].id, 0, []);

  for (const leaf of branches.leaves) {
    if (!reachedLeaves.has(leaf.id)) {
      fail(file, `branch leaf "${leaf.id}" is not reachable by any sequence of choices`);
    }
    const words = leaf.reason.trim().split(/\s+/).filter(Boolean);
    if (words.length < MIN_REASON_WORDS) {
      fail(
        file,
        `branch leaf "${leaf.id}" reason is ${words.length} word(s): "${leaf.reason}". ` +
          `A reason renders as a sentence to the student, never a code — write at least ${MIN_REASON_WORDS} words.`,
      );
    }
  }
}

function lintFile(file: string): void {
  const body = fs.readFileSync(file, 'utf8');
  if (!body.includes('```interactive-spec')) return;

  const parsed = parseInteractiveSpec(body);
  if (!parsed.ok) {
    fail(file, parsed.reason);
    return;
  }

  specCount++;
  const spec: InteractiveSpec = parsed.spec;
  const censusKey =
    spec.kind === 'guided_walkthrough' && spec.branches
      ? 'guided_walkthrough (branching)'
      : spec.kind;
  census[censusKey] = (census[censusKey] ?? 0) + 1;

  if (spec.kind === 'manipulable') exerciseManipulable(file, spec);
  else if (spec.kind === 'simulation') exerciseSimulation(file, spec);
  else if (spec.kind === 'guided_walkthrough') exerciseBranches(file, spec);
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function main(): void {
  const argv = process.argv.slice(2);
  const dirFlag = argv.indexOf('--dir');
  const target = dirFlag >= 0 ? path.resolve(argv[dirFlag + 1]) : DEFAULT_DIR;

  if (!fs.existsSync(target)) {
    console.error(`lint-interactive-specs: no such directory: ${target}`);
    process.exit(1);
  }

  for (const file of walk(target)) lintFile(file);

  if (argv.includes('--census')) {
    console.log('\ninteractive-spec census:');
    for (const [kind, n] of Object.entries(census).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${kind.padEnd(20)} ${n}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n✗ ${failures.length} invalid interactive-spec block(s):\n`);
    for (const f of failures) console.error(`  ${f.file}\n      ${f.reason}`);
    console.error('');
    process.exit(1);
  }

  console.log(`✓ ${specCount} interactive-spec block(s) valid and exercised`);
}

main();
