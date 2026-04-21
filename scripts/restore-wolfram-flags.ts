// @ts-nocheck
/**
 * Restore Wolfram-verified flags after bundle rebuild.
 *
 * build-bundle.ts regenerates from raw corpus files, which don't carry
 * the wolfram_verified flag — that flag is set by verify-wolfram-batch.ts
 * and written into content-bundle.json directly.
 *
 * After any bundle rebuild, this script re-applies the known-verified
 * flags from the canonical list below. The list was captured from the
 * previously-verified bundle (git HEAD before v2.5.1).
 */

import fs from 'fs';
import path from 'path';

const BUNDLE_PATH = path.resolve(process.cwd(), 'frontend/public/data/content-bundle.json');

const VERIFIED_IDS = new Set([
  'gate-2024-eigenvalues-0',
  'gate-2023-matrix-rank-3',
  'gate-2022-graph-coloring-9',
  'gate-2022-taylor-series-11',
  'openstax-definite-integrals-1',
  'ocw-second-order-linear-2',
]);

function main() {
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf-8'));
  let flagged = 0;
  for (const p of bundle.problems) {
    if (VERIFIED_IDS.has(p.id)) {
      p.wolfram_verified = true;
      flagged++;
    }
  }
  bundle.verified_at = new Date().toISOString();
  // Keep stats in sync
  if (bundle.stats) bundle.stats.wolfram_verified = flagged;
  fs.writeFileSync(BUNDLE_PATH, JSON.stringify(bundle, null, 2));
  console.log(`Re-flagged ${flagged}/${VERIFIED_IDS.size} Wolfram-verified problems.`);
  if (flagged < VERIFIED_IDS.size) {
    const found = new Set(bundle.problems.map((p: any) => p.id));
    for (const id of VERIFIED_IDS) {
      if (!found.has(id)) console.log(`  MISSING from bundle: ${id}`);
    }
  }
}

main();
