#!/usr/bin/env npx tsx
/**
 * scripts/check-ci-aggregate-drift.ts — D12 ("CI ergonomics") drift check.
 *
 * package.json's `ci` script and .github/workflows/ci.yml's `backend` job
 * are two independent statements of the same fact: "these are the blocking
 * gates." Nothing enforced they stay in sync — an operator running `npm run
 * ci` locally before pushing could get a green result that CI itself would
 * not reproduce, silently, the moment either list drifted from the other.
 * This is the "parallel truths" bug class named in CLAUDE.md §5c: it
 * mechanizes ONE more of the recurring instances instead of trusting the
 * next person to keep two lists in step by hand.
 *
 * Reads:
 *   - package.json's `scripts.ci` — an `&&`-chained sequence of `npm run
 *     <name>` invocations (an optional `KEY=value ` env-var prefix per
 *     segment is stripped before comparison).
 *   - .github/workflows/ci.yml's `jobs.backend.steps[].run` — every step
 *     whose `run` is (or contains) `npm run <name>`, in step order, minus
 *     `typecheck` (a real gate, deliberately excluded from the aggregate
 *     per D12: "Do NOT change typecheck/vitest steps — only the gate
 *     steps"). `npm test`/`npm ci` steps don't match the `npm run` shape
 *     and are naturally excluded.
 *
 * Compares the two ORDERED lists exactly (D6/D12: "in the workflow's
 * order") and fails loudly, naming the exact difference, on any mismatch.
 *
 * Run: npx tsx scripts/check-ci-aggregate-drift.ts
 * Exit: 0 when package.json's `ci` script and the workflow's backend gate
 *       steps name the identical sequence of `npm run` scripts, 1 otherwise.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');

/**
 * Script names excluded from the comparison on purpose: `typecheck` is a
 * real gate deliberately left out of the `ci` aggregate (see the header
 * comment), and `ci:aggregate-drift` is THIS check's own workflow step —
 * without excluding it, the check would trip on its own presence in the
 * workflow the moment it was added.
 */
const EXCLUDED_SCRIPT_NAMES = new Set(['typecheck', 'ci:aggregate-drift']);

const NPM_RUN_RE = /npm run ([\w:.-]+)/;

/** Extracts the ordered `npm run <name>` sequence out of an `&&`-chained package.json script string. */
function scriptNamesFromAggregate(aggregate: string): string[] {
  return aggregate
    .split('&&')
    .map((segment) => segment.trim())
    .map((segment) => segment.match(NPM_RUN_RE)?.[1])
    .filter((name): name is string => !!name);
}

interface WorkflowStep {
  name?: string;
  run?: string;
}

interface Workflow {
  jobs?: Record<string, { steps?: WorkflowStep[] }>;
}

/** Extracts the ordered `npm run <name>` sequence out of the backend job's steps, minus EXCLUDED_SCRIPT_NAMES. */
function scriptNamesFromWorkflow(workflow: Workflow): string[] {
  const steps = workflow.jobs?.backend?.steps ?? [];
  const names: string[] = [];
  for (const step of steps) {
    const match = step.run?.match(NPM_RUN_RE);
    if (match && !EXCLUDED_SCRIPT_NAMES.has(match[1])) names.push(match[1]);
  }
  return names;
}

function main(): void {
  console.log('check-ci-aggregate-drift — D12 (package.json `ci` ↔ .github/workflows/ci.yml)\n');

  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const aggregate: string | undefined = pkg.scripts?.ci;
  if (!aggregate) {
    console.error('FAIL — package.json has no `scripts.ci` aggregate to check against the workflow.');
    process.exit(1);
  }

  const workflow = parseYaml(fs.readFileSync(WORKFLOW_PATH, 'utf8')) as Workflow;
  const fromAggregate = scriptNamesFromAggregate(aggregate);
  const fromWorkflow = scriptNamesFromWorkflow(workflow);

  if (fromAggregate.length === 0) {
    console.error('FAIL — could not extract any `npm run <name>` steps from package.json\'s `ci` script.');
    process.exit(1);
  }
  if (fromWorkflow.length === 0) {
    console.error('FAIL — could not extract any `npm run <name>` gate steps from the workflow\'s backend job.');
    process.exit(1);
  }

  const maxLen = Math.max(fromAggregate.length, fromWorkflow.length);
  const mismatches: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    const a = fromAggregate[i];
    const w = fromWorkflow[i];
    if (a !== w) {
      mismatches.push(`  position ${i}: aggregate has '${a ?? '(nothing)'}', workflow has '${w ?? '(nothing)'}'`);
    }
  }

  if (mismatches.length > 0) {
    console.error(
      `FAIL — package.json's \`ci\` script and .github/workflows/ci.yml's backend gate steps have drifted:\n` +
        `${mismatches.join('\n')}\n\n` +
        `  aggregate (${fromAggregate.length}): ${fromAggregate.join(', ')}\n` +
        `  workflow  (${fromWorkflow.length}): ${fromWorkflow.join(', ')}\n\n` +
        `  Fix: edit package.json's \`ci\` script (or the workflow's backend steps) so the two\n` +
        `  name the identical ordered sequence of \`npm run\` gates.`,
    );
    process.exit(1);
  }

  console.log(`✓ ${fromAggregate.length} gate(s) match, in order, between package.json's \`ci\` and the workflow's backend job.`);
}

main();
