// @ts-nocheck
/**
 * scripts/kag-corpus-builder.ts
 *
 * CLI-only KAG corpus builder. Never imported by the server.
 *
 * Usage:
 *   npx tsx scripts/kag-corpus-builder.ts [--concept <concept_id>] [--all] [--dry-run]
 *
 * What it does:
 *   1. Acquires .data/corpus-build.lock (advisory — prevents cron + manual double-build)
 *   2. Reads the concept graph for targets
 *   3. Calls generateKagEntry() for each (bypass_nightly_cap=true — CLI is explicit intent)
 *   4. Writes output to .data/kag-corpus.jsonl via the KAG store
 *   5. Releases the lock
 *
 * SEED_DIR is imported from src/content-library/store.ts — no duplicate path string.
 */

import fs from 'fs';
import path from 'path';
import { SEED_DIR } from '../src/content-library/store';
import { generateKagEntry } from '../src/gbrain/operations/kag-concept-generator';
import { ALL_CONCEPTS } from '../src/constants/concept-graph';

const LOCK_PATH = path.resolve(process.cwd(), '.data/corpus-build.lock');
const DATA_DIR = path.resolve(process.cwd(), '.data');

function acquireLock(): boolean {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(LOCK_PATH)) {
    const age_ms = Date.now() - fs.statSync(LOCK_PATH).mtimeMs;
    if (age_ms < 30 * 60 * 1000) {
      console.error(`[kag-builder] lock exists (age ${Math.round(age_ms / 1000)}s) — another build may be running. Remove ${LOCK_PATH} to force.`);
      return false;
    }
    console.warn(`[kag-builder] stale lock found (age ${Math.round(age_ms / 60000)}m) — overwriting`);
  }
  fs.writeFileSync(LOCK_PATH, String(process.pid));
  return true;
}

function releaseLock(): void {
  try { fs.unlinkSync(LOCK_PATH); } catch { /* already gone */ }
}

async function main() {
  const args = process.argv.slice(2);
  const targetConcept = args.includes('--concept') ? args[args.indexOf('--concept') + 1] : null;
  const buildAll = args.includes('--all');
  const dryRun = args.includes('--dry-run');

  console.log(`[kag-builder] SEED_DIR = ${SEED_DIR}`);

  if (!acquireLock()) process.exit(1);

  try {
    const targets = targetConcept
      ? ALL_CONCEPTS.filter(c => c.id === targetConcept)
      : buildAll
        ? ALL_CONCEPTS
        : ALL_CONCEPTS.slice(0, 5);   // default: first 5 only

    console.log(`[kag-builder] ${dryRun ? '[DRY RUN] ' : ''}processing ${targets.length} concept(s)`);

    let ok = 0, skipped = 0, failed = 0;

    for (const concept of targets) {
      const label = concept.label ?? concept.id;
      console.log(`  → ${concept.id} (${label})`);

      if (dryRun) { ok++; continue; }

      const result = await generateKagEntry({
        concept_id: concept.id,
        concept_label: label,
        description: concept.description ?? label,
        embedding: [],
        bypass_nightly_cap: true,
      });

      if (result.ok) {
        ok++;
        const wolfTag = result.wolfram_available ? '[wolfram ✓]' : '[wolfram ✗]';
        console.log(`    ${wolfTag} generated (${result.entry?.content?.length ?? 0} chars)`);
      } else {
        if (result.skipped_reason === 'nightly_cap') {
          skipped++;
          console.log(`    [skipped] nightly cap`);
        } else {
          failed++;
          console.error(`    [failed] ${result.skipped_reason}`);
        }
      }
    }

    console.log(`\n[kag-builder] done — ok:${ok} skipped:${skipped} failed:${failed}`);
  } finally {
    releaseLock();
  }
}

main().catch(e => {
  console.error('[kag-builder] fatal:', e);
  releaseLock();
  process.exit(1);
});
