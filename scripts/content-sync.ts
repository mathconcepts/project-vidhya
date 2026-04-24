// @ts-nocheck
/**
 * scripts/content-sync.ts
 *
 * Sync the pinned version of project-vidhya-content into
 * .data/community-content/.
 *
 * Owning agent: community-content-specialist.
 *
 * In stub mode (sha=pending), this script is a no-op that prints an
 * informational message. When the content repo exists, it:
 *
 *   1. Reads content.pin to get the target repo + SHA
 *   2. Clones the repo at that SHA (shallow clone for speed)
 *   3. Copies bundles/ and concepts/ into .data/community-content/
 *   4. Writes a manifest the content-router can consult
 *
 * Run as part of the Docker build (demo/Dockerfile) or manually:
 *   npx tsx scripts/content-sync.ts
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const PIN_PATH = 'content.pin';
const TARGET_DIR = '.data/community-content';

function readPin(): { repo: string; sha: string; pinned_at: string } {
  if (!existsSync(PIN_PATH)) {
    throw new Error(`${PIN_PATH} does not exist`);
  }
  const raw = readFileSync(PIN_PATH, 'utf-8');
  const fields: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...rest] = trimmed.split(':');
    if (k && rest.length) fields[k.trim()] = rest.join(':').trim();
  }
  return {
    repo: fields.repo ?? 'mathconcepts/project-vidhya-content',
    sha: fields.sha ?? 'pending',
    pinned_at: fields.pinned_at ?? new Date().toISOString().slice(0, 10),
  };
}

function main(): void {
  const pin = readPin();
  console.log(`content.pin → ${pin.repo} @ ${pin.sha} (pinned ${pin.pinned_at})`);

  if (pin.sha === 'pending') {
    console.log('');
    console.log('Content repo is in STUB MODE.');
    console.log('');
    console.log('The community-content-specialist operates without any');
    console.log('community content until the content repo exists and');
    console.log('content.pin is bumped to a real SHA.');
    console.log('');
    console.log('To move out of stub mode:');
    console.log(`  1. Create ${pin.repo} on GitHub`);
    console.log('  2. Populate it (see CONTENT.md for the layout)');
    console.log('  3. Edit content.pin, set sha to a commit SHA');
    console.log('  4. Re-run: npx tsx scripts/content-sync.ts');
    console.log('');
    return;
  }

  // Live mode — shallow clone the content repo at the pinned SHA
  mkdirSync(TARGET_DIR, { recursive: true });
  const repoUrl = `https://github.com/${pin.repo}.git`;
  const cloneDir = path.join(TARGET_DIR, '_clone');

  try {
    execSync(`rm -rf ${cloneDir}`);
    execSync(
      `git clone --depth 50 --no-checkout ${repoUrl} ${cloneDir}`,
      { stdio: 'inherit' },
    );
    execSync(`cd ${cloneDir} && git checkout ${pin.sha}`, { stdio: 'inherit' });

    // Copy bundles + concepts
    execSync(`cp -r ${cloneDir}/bundles ${TARGET_DIR}/bundles`, { stdio: 'inherit' });
    execSync(`cp -r ${cloneDir}/concepts ${TARGET_DIR}/concepts`, { stdio: 'inherit' });
    execSync(`rm -rf ${cloneDir}`);

    console.log(`synced ${pin.sha} → ${TARGET_DIR}`);
  } catch (e: any) {
    console.error(`sync failed: ${e?.message ?? 'unknown'}`);
    console.error('Falling back to stub mode. Check:');
    console.error(`  - ${repoUrl} is reachable`);
    console.error(`  - ${pin.sha} is a valid commit on that repo`);
    console.error('  - git is installed on this host');
    process.exit(1);
  }
}

main();
