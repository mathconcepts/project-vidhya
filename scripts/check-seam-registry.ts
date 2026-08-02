/**
 * seam-registry CI check (CEO plan Phase 0, §4 "the law").
 *
 * Run: npx tsx scripts/check-seam-registry.ts
 * Exit: 0 when every registered seam's interface file and conformance
 * test path exist on disk, 1 otherwise.
 *
 * seam-registry.json is a claim: "this seam has one interface, one config
 * source, and a CI conformance suite." This script is what makes the
 * claim checkable instead of aspirational — a seam whose test file gets
 * deleted or renamed (and the registry entry not updated) fails the
 * build instead of silently losing its coverage.
 *
 * Deliberately narrow scope: this verifies the FILES exist, not that the
 * test file actually calls a shared contract-test function, or that it
 * currently passes (the regular `npm test` run already enforces that —
 * this check exists so seam-registry.json itself can't drift from
 * reality unnoticed).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_PATH = path.join(ROOT, 'seam-registry.json');

interface Seam {
  name: string;
  description?: string;
  interface_file: string;
  config_source: string | null;
  conformance_test_path: string;
}

function main(): void {
  console.log('check-seam-registry — CEO plan Phase 0 §4 ("the law")\n');

  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`FAIL — missing ${path.relative(ROOT, REGISTRY_PATH)}`);
    process.exit(1);
  }

  let seams: Seam[];
  try {
    const parsed = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
    seams = Array.isArray(parsed.seams) ? parsed.seams : [];
  } catch (e: any) {
    console.error(`FAIL — seam-registry.json unreadable: ${e?.message}`);
    process.exit(1);
  }

  if (seams.length === 0) {
    console.error('FAIL — seam-registry.json has no seams: []');
    process.exit(1);
  }

  const failures: string[] = [];
  const seenNames = new Set<string>();

  for (const seam of seams) {
    if (!seam.name || typeof seam.name !== 'string') {
      failures.push(`a seam entry is missing a "name"`);
      continue;
    }
    if (seenNames.has(seam.name)) {
      failures.push(`duplicate seam name "${seam.name}"`);
    }
    seenNames.add(seam.name);

    if (!seam.interface_file) {
      failures.push(`${seam.name}: missing "interface_file"`);
    } else if (!fs.existsSync(path.join(ROOT, seam.interface_file))) {
      failures.push(`${seam.name}: interface_file "${seam.interface_file}" does not exist`);
    }

    if (!seam.conformance_test_path) {
      failures.push(`${seam.name}: missing "conformance_test_path"`);
    } else if (!fs.existsSync(path.join(ROOT, seam.conformance_test_path))) {
      failures.push(`${seam.name}: conformance_test_path "${seam.conformance_test_path}" does not exist`);
    }

    // config_source is documentation-only (some seams are code-selected
    // plugins with no external config file — null is a valid, honest
    // value) so it is intentionally NOT existence-checked.
  }

  if (failures.length > 0) {
    console.error(`FAIL — ${failures.length} seam-registry violation(s):`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }

  console.log(`ok  [seam-registry] ${seams.length} seams, every interface_file and conformance_test_path resolves`);
  console.log('\nPASS — seam-registry clean');
}

main();
