/**
 * Restore Wolfram-verified flags after bundle rebuild.
 *
 * build-bundle.ts regenerates from raw corpus files, which don't carry
 * the wolfram_verified flag — that flag is set by verify-wolfram-batch.ts
 * and written into content-bundle.json directly.
 *
 * After any bundle rebuild, this script re-applies known-verified flags.
 *
 * Usage:
 *   npx tsx scripts/restore-wolfram-flags.ts [verified-ids.json]
 *
 * The optional argument is a JSON file containing an array of problem
 * ids (["gate-2024-...", ...]) — typically produced by a
 * verify-wolfram-batch run. Without it the script uses the empty
 * baseline below and is a no-op.
 *
 * NOTE: the previous hardcoded 6-id list referenced problems that no
 * longer exist in any bundle (dead ids from the pre-v2.5.1 bundle). It
 * was removed rather than carried forward — flags must come from a real
 * verification run, not a stale allowlist.
 */

import fs from 'fs';
import path from 'path';

const BUNDLE_PATH = path.resolve(process.cwd(), 'frontend/public/data/content-bundle.json');

/**
 * Baseline verified ids. Intentionally EMPTY: 0/227 bundle problems are
 * Wolfram-verified today, and pretending otherwise is the exact honesty
 * bug this file used to have. Populate via the file argument once
 * verify-wolfram-batch has actually run.
 */
const BASELINE_VERIFIED_IDS: string[] = [];

function loadVerifiedIds(): Set<string> {
  const fileArg = process.argv[2];
  if (!fileArg) return new Set(BASELINE_VERIFIED_IDS);
  const p = path.resolve(process.cwd(), fileArg);
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
  if (!Array.isArray(raw) || raw.some(id => typeof id !== 'string')) {
    throw new Error(`${fileArg} must be a JSON array of problem-id strings`);
  }
  return new Set(raw as string[]);
}

function main() {
  const VERIFIED_IDS = loadVerifiedIds();
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
    const found = new Set(bundle.problems.map((p: { id: string }) => p.id));
    for (const id of VERIFIED_IDS) {
      if (!found.has(id)) console.log(`  MISSING from bundle: ${id}`);
    }
  }
}

main();
