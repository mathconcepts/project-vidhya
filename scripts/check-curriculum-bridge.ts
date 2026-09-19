/**
 * scripts/check-curriculum-bridge.ts — the `ci:curriculum-bridge` runner.
 *
 * Run:  npx tsx scripts/check-curriculum-bridge.ts
 * Exit: 0 when clean, 1 on any violation.
 *
 * Blocking on COVERAGE as well as contract, for the same reason
 * ci:concept-anchors is: a half-written bridge file is worse than none. The
 * concepts it silently omits are exactly the ones nobody thought about, and
 * the student sees no line at all for them — indistinguishable from a
 * concept where the board genuinely aligns.
 *
 * Logic and rationale: src/registry/curriculum-bridge.ts.
 */

import {
  loadAllBridges,
  auditBridges,
  BRIDGE_COVERAGES,
  type BridgeCoverage,
} from '../src/registry/curriculum-bridge';

function main(): void {
  const bridges = loadAllBridges(true);

  if (bridges.length === 0) {
    console.log('[curriculum-bridge] no bridge files authored — nothing to check.');
    process.exit(0);
  }

  console.log(`\n[curriculum-bridge] ${bridges.length} bridge file(s)\n`);
  for (const file of bridges) {
    const counts = {} as Record<BridgeCoverage, number>;
    for (const c of BRIDGE_COVERAGES) counts[c] = 0;
    for (const e of Object.values(file.concepts)) {
      if (counts[e.coverage] !== undefined) counts[e.coverage]++;
    }
    const probable = Object.values(file.concepts).filter((e) => e.confidence === 'probable').length;
    console.log(
      `  ${file.track_id} -> ${file.target_exam}: ${Object.keys(file.concepts).length} concept(s) ` +
        `[${BRIDGE_COVERAGES.map((c) => `${c} ${counts[c]}`).join(', ')}], ` +
        `${probable} marked probable, ${file.surplus_board_topics.length} surplus board topic(s)`,
    );
  }

  const problems = auditBridges(bridges);
  if (problems.length === 0) {
    console.log('\n✓ Every bridge covers its exam fully and passes the contract.\n');
    process.exit(0);
  }

  console.error(`\n[curriculum-bridge] FAIL — ${problems.length} problem(s):\n`);
  for (const p of problems) {
    console.error(`  ${p.file}${p.concept_id ? ` / ${p.concept_id}` : ''}: ${p.message}`);
  }
  console.error('');
  process.exit(1);
}

main();
