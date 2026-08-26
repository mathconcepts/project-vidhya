/**
 * scripts/check-playbook-convention.ts
 *
 * CI convention check for the Playbook Layer (Track E5).
 *
 * Fails if a package.json script matching bulk-op naming patterns
 * (content:*, demo:seed*, batch/generate/verify verbs) is not registered
 * in src/playbooks/registry.ts OR listed in src/playbooks/non-bulk-allowlist.json.
 *
 * Run: npx tsx scripts/check-playbook-convention.ts
 * Exit: 0 = all bulk scripts are accounted for, 1 = unregistered scripts found.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listPlaybooks } from '../src/playbooks/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Patterns that identify bulk-op scripts requiring playbook registration
const BULK_PATTERNS = [
  /^content:/,
  /^batch:/,
  /^demo:seed/,
  /^verify:/,
  /generate/,
  /verify/,
  /bulk/,
  /sweep/,
  /floor/,
  /recompute/,
  /rerender/,
];

function isBulkScript(name: string): boolean {
  return BULK_PATTERNS.some((p) => p.test(name));
}

function loadAllowlist(): Set<string> {
  const p = path.join(ROOT, 'src/playbooks/non-bulk-allowlist.json');
  if (!fs.existsSync(p)) return new Set();
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return new Set(Array.isArray(data) ? data : []);
  } catch {
    return new Set();
  }
}

/**
 * Scripts that ARE bulk ops and are owed a playbook, recorded rather than
 * excused. Kept separate from the non-bulk allowlist because the two make
 * opposite claims: the allowlist says "not a bulk operation", this says "is
 * one, and has no playbook yet". Filing content:generate under the former
 * would assert something false and the next reader would believe it.
 *
 * The gate reports these loudly every run but does not fail on them, so it can
 * block a NEW unregistered bulk script instead of staying permanently red and
 * teaching everyone to ignore it. The list may shrink freely; growing it takes
 * a reviewed edit.
 */
function loadOwedBaseline(): Set<string> {
  const p = path.join(ROOT, 'src/playbooks/owed-playbook-baseline.json');
  if (!fs.existsSync(p)) return new Set();
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8')) as { owed?: Array<{ script: string }> };
    return new Set((data.owed ?? []).map((o) => o.script));
  } catch {
    return new Set();
  }
}

function loadPackageScripts(): string[] {
  const p = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(p, 'utf-8')) as { scripts?: Record<string, string> };
  return Object.keys(pkg.scripts ?? {});
}

async function main(): Promise<void> {
  console.log('\n[check-playbook-convention] Checking bulk-op script registration...\n');

  const allowlist = loadAllowlist();
  const owed = loadOwedBaseline();
  const registeredIds = new Set(listPlaybooks().map((p) => p.id));
  const scripts = loadPackageScripts();

  const unregistered: string[] = [];
  const owedSeen: string[] = [];

  for (const script of scripts) {
    if (!isBulkScript(script)) continue;
    if (allowlist.has(script)) continue;
    if (owed.has(script)) {
      owedSeen.push(script);
      continue;
    }

    // Check if any registered playbook id is contained in the script name
    const covered = [...registeredIds].some(
      (id) => script.includes(id) || id.includes(script.replace(/^content:/, '')),
    );
    if (covered) continue;

    unregistered.push(script);
  }

  const playbookCount = listPlaybooks().length;
  console.log(`Registered playbooks: ${playbookCount}`);
  console.log(`Allowlisted non-bulk scripts: ${allowlist.size}`);
  console.log(`Total package.json scripts scanned: ${scripts.length}`);

  // Printed every run, passing or failing. Debt that is never shown stops
  // being debt and becomes the status quo.
  if (owedSeen.length > 0) {
    console.log(`\nOwed a playbook (recorded, not blocking): ${owedSeen.length}`);
    for (const s of owedSeen.sort()) console.log(`  · ${s}`);
    console.log('  see src/playbooks/owed-playbook-baseline.json for why each is still open');
  }

  if (unregistered.length === 0) {
    console.log('\n✓ No bulk-op script is unaccounted for.\n');
    process.exit(0);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log('UNREGISTERED BULK-OP SCRIPTS');
  console.log('─'.repeat(60));
  for (const s of unregistered) {
    console.log(`  ✗ ${s}`);
  }
  console.log('─'.repeat(60));
  console.log('\nFix: register in src/playbooks/registry.ts OR add to src/playbooks/non-bulk-allowlist.json\n');
  console.error(`[check-playbook-convention] ${unregistered.length} unregistered bulk-op script(s) — build FAILED\n`);
  process.exit(1);
}

main().catch((e) => {
  console.error('[check-playbook-convention] Fatal error:', e);
  process.exit(1);
});
