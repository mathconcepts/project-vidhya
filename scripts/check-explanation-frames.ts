#!/usr/bin/env npx tsx
/**
 * ci:explanation-frame — every concept must be framable, and every frame
 * must pass the contract.
 *
 * "Framable" means the five required roles can all be filled from authored
 * content on disk. The check that matters is G1: composing with NO signals
 * must still produce a complete explanation. A concept that fails it does
 * not error at runtime — it quietly serves a student an explanation with a
 * hole where the trap or the check should have been, and nothing notices.
 *
 * Blocking, with a baseline. Concepts listed in
 * `scripts/explanation-frame-baseline.json` are known, reasoned gaps and do
 * not fail the build; anything NEW does. Same shape as
 * `golden-answer-key-baseline.json` — the baseline exists so the gate can be
 * turned on today rather than after the last gap is closed, and every entry
 * carries the reason it is there.
 *
 *   npx tsx scripts/check-explanation-frames.ts [--report-only]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_CONCEPTS } from '../src/constants/concept-graph';
import {
  buildFrameForConcept,
  composeExplanation,
  checkFrame,
  checkComposition,
  NO_SIGNALS,
} from '../src/content/explanation-frame';

// Anchored to this file, not cwd — the gate runs from the repo root in CI
// and from anywhere by hand (the convention check-syllabus-floor.ts uses).
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASELINE = path.resolve(HERE, 'explanation-frame-baseline.json');

interface Baseline {
  _comment?: string;
  grandfathered: Record<string, string>;
}

function loadBaseline(): Baseline {
  try {
    return JSON.parse(fs.readFileSync(BASELINE, 'utf-8')) as Baseline;
  } catch {
    return { grandfathered: {} };
  }
}

async function main(): Promise<void> {
  const reportOnly = process.argv.includes('--report-only');
  const baseline = loadBaseline();

  const failures: string[] = [];
  const grandfathered: string[] = [];
  let framable = 0;

  for (const concept of ALL_CONCEPTS) {
    const { frame, missing, resolvers } = await buildFrameForConcept(concept.id);

    if (!frame) {
      const reason = baseline.grandfathered[concept.id];
      if (reason) {
        grandfathered.push(`${concept.id} (${missing.join(', ')}) — ${reason}`);
      } else {
        failures.push(`${concept.id}: cannot be framed — missing ${missing.join(', ')}`);
      }
      continue;
    }

    framable += 1;

    for (const problem of checkFrame(frame)) {
      failures.push(`${concept.id}: [${problem.code}] ${problem.detail}`);
    }

    // The real assertion: the floor holds, and a rich signal bundle does not
    // regress it. Signals are built from this concept's own graph data so the
    // adaptive path is genuinely exercised rather than declining everywhere.
    const rich = {
      stance: 'shaken',
      shaky_prerequisites: (concept.prerequisites ?? []) as string[],
      track_id: 'TN-HSE-12-MATH',
    };
    for (const problem of checkComposition(
      frame,
      (f, s) => composeExplanation(f, s, resolvers),
      rich,
    )) {
      failures.push(`${concept.id}: [${problem.code}] ${problem.detail}`);
    }

    // Belt and braces: the floor must render real text, not just be
    // structurally present.
    const floor = composeExplanation(frame, NO_SIGNALS, resolvers);
    if (floor.enrichment_level !== 0) {
      failures.push(`${concept.id}: floor composed with enrichment_level ${floor.enrichment_level} — a resolver fired with no signals`);
    }
  }

  console.log(`Checked ${ALL_CONCEPTS.length} concepts | framable: ${framable} | grandfathered: ${grandfathered.length} | failures: ${failures.length}`);
  for (const g of grandfathered) console.log(`  (baseline) ${g}`);
  for (const f of failures) console.log(`  FAIL ${f}`);

  if (failures.length > 0 && !reportOnly) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
