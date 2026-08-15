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
  census[spec.kind] = (census[spec.kind] ?? 0) + 1;

  if (spec.kind === 'manipulable') exerciseManipulable(file, spec);
  else if (spec.kind === 'simulation') exerciseSimulation(file, spec);
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
