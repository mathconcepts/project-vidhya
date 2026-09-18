#!/usr/bin/env npx tsx
/**
 * scripts/check-concept-anchors.ts  —  `npm run ci:concept-anchors`
 *
 * Gates the Concept Anchor registry (data/registry/concept-anchors/*.yml):
 * the one plain sentence per concept saying what the maths is FOR.
 *
 * Checks, in order:
 *   1. COVERAGE   — every concept in the graph has an entry. A concept with
 *                   no entry at all is the failure this whole pass exists to
 *                   stop: it is how "no real-world bridge anywhere" went
 *                   unnoticed across 99 of 101 concepts in the first place.
 *   2. CONTRACT   — each authored sentence passes validateAnchor() (word
 *                   cap, no notation, no exam framing, no vague filler).
 *                   The rules live in src/registry/concept-anchors.ts and are
 *                   stated once; this script never re-implements them.
 *   3. HONESTY    — `anchor: null` requires a `reason`. An absence has to be
 *                   a recorded decision, never a silent gap.
 *   4. UNKNOWN    — an entry for a concept id the graph does not know is a
 *                   typo; it would silently never render.
 *
 * Blocking. `--report-only` prints the same table and exits 0.
 */

import { ALL_CONCEPTS } from '../src/constants/concept-graph';
import {
  loadConceptAnchors,
  validateAnchor,
  countAnchorWords,
  MAX_ANCHOR_WORDS,
} from '../src/registry/concept-anchors';

const reportOnly = process.argv.includes('--report-only');

function main(): void {
  const anchors = loadConceptAnchors();
  const known = new Set(ALL_CONCEPTS.map((c) => c.id));

  const missing: string[] = [];
  const violations: { id: string; problems: string[] }[] = [];
  const nullsNoReason: string[] = [];
  const unknown: string[] = [];
  const nulls: { id: string; reason: string }[] = [];

  let authored = 0;
  let totalWords = 0;

  for (const c of ALL_CONCEPTS) {
    const entry = anchors.get(c.id);
    if (!entry) {
      missing.push(c.id);
      continue;
    }
    if (entry.anchor === null) {
      if (!entry.reason || !entry.reason.trim()) nullsNoReason.push(c.id);
      else nulls.push({ id: c.id, reason: entry.reason.trim() });
      continue;
    }
    authored += 1;
    totalWords += countAnchorWords(entry.anchor);
    const problems = validateAnchor(entry.anchor);
    if (problems.length) violations.push({ id: c.id, problems });
  }

  for (const id of anchors.keys()) if (!known.has(id)) unknown.push(id);

  console.log(`\n[check-concept-anchors] ${ALL_CONCEPTS.length} concepts in the graph\n`);
  console.log(`  authored anchors     ${authored}`);
  console.log(`  honest nulls         ${nulls.length}`);
  console.log(`  no entry at all      ${missing.length}`);
  console.log(
    `  avg words            ${authored ? (totalWords / authored).toFixed(1) : '—'} (cap ${MAX_ANCHOR_WORDS})`,
  );
  console.log(`  total added load     ${totalWords} words across the corpus`);

  if (nulls.length) {
    console.log('\n  Honest nulls (recorded decisions, not gaps):');
    for (const n of nulls) console.log(`    ${n.id.padEnd(30)} ${n.reason}`);
  }

  let failed = false;

  if (missing.length) {
    failed = true;
    console.log(`\n  ✗ ${missing.length} concept(s) with NO anchor entry:`);
    for (const id of missing) console.log(`      ${id}`);
    console.log('    Add an entry to data/registry/concept-anchors/<topic>.yml —');
    console.log('    a real sentence, or `anchor: null` with a `reason`.');
  }

  if (violations.length) {
    failed = true;
    console.log(`\n  ✗ ${violations.length} anchor(s) violating the contract:`);
    for (const v of violations) console.log(`      ${v.id}: ${v.problems.join('; ')}`);
  }

  if (nullsNoReason.length) {
    failed = true;
    console.log(`\n  ✗ ${nullsNoReason.length} null anchor(s) with no \`reason\`:`);
    for (const id of nullsNoReason) console.log(`      ${id}`);
  }

  if (unknown.length) {
    failed = true;
    console.log(`\n  ✗ ${unknown.length} entr(y/ies) for unknown concept id(s):`);
    for (const id of unknown) console.log(`      ${id}`);
  }

  if (!failed) {
    console.log('\n✓ Every concept has an anchor or a recorded reason; all anchors pass the contract.\n');
    return;
  }
  if (reportOnly) {
    console.log('\n[check-concept-anchors] --report-only, exiting 0\n');
    return;
  }
  process.exit(1);
}

main();
