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

function loadPackageScripts(): string[] {
  const p = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(p, 'utf-8')) as { scripts?: Record<string, string> };
  return Object.keys(pkg.scripts ?? {});
}

async function main(): Promise<void> {
  console.log('\n[check-playbook-convention] Checking bulk-op script registration...\n');

  const allowlist = loadAllowlist();
  const registeredIds = new Set(listPlaybooks().map((p) => p.id));
  const scripts = loadPackageScripts();

  const unregistered: string[] = [];

  for (const script of scripts) {
    if (!isBulkScript(script)) continue;
    if (allowlist.has(script)) continue;

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

  if (unregistered.length === 0) {
    console.log('\n✓ All bulk-op scripts are registered or allowlisted.\n');
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
