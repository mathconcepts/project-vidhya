#!/usr/bin/env npx tsx
/**
 * Wait until the deployed build is the commit we are checking.
 *
 * ## Why a commit and not a version
 *
 * `prod-smoke.yml` already waits for `/health.version` to match the commit's
 * package.json, and that check was added for a real reason: Render keeps
 * serving the previous build until the new one is healthy, so a run started
 * seconds after a merge verifies stale code and reports success.
 *
 * It closes only half the hole. Most merges do not bump the version — a fix,
 * a docs correction, a test — so the deployed version already equals the
 * expected one the instant the run starts. The gate passes immediately,
 * against the old build, and every check below it describes code that is not
 * the code under test. The same false green, one level down.
 *
 * A commit is unique per merge, so it cannot collide that way. `/health`
 * reports `commit` from RENDER_GIT_COMMIT.
 *
 * ## The unknown case
 *
 * A build that reports no commit (off-platform, or an image predating the
 * field) is NOT a match. It is "cannot tell", and the difference matters: an
 * unknown commit treated as a pass is exactly how a check reports success
 * without verifying anything. The caller decides whether that is fatal —
 * `--require-match` for a push where we are waiting on our own deploy, a
 * warning on the daily cron where a version skew is a real, reportable state
 * rather than a broken run.
 *
 * ## Usage
 *
 *   npx tsx scripts/wait-for-deploy.ts <base-url> <commit-sha> [--timeout 600] [--require-match]
 */

export type DeployMatch = 'match' | 'mismatch' | 'unknown';

/**
 * Compare a reported commit against the wanted one.
 *
 * Prefix-tolerant in both directions because the short form is what a human
 * pastes and the long form is what CI passes; requiring exact equality would
 * make a correct deploy look like a mismatch. Guarded by a minimum length so
 * a stray one-character value cannot prefix-match everything.
 */
export function classifyCommit(reported: unknown, wanted: string): DeployMatch {
  if (typeof reported !== 'string' || reported.trim() === '') return 'unknown';
  const got = reported.trim().toLowerCase();
  const want = wanted.trim().toLowerCase();
  if (got.length < 7 || want.length < 7) return 'unknown';
  return got.startsWith(want) || want.startsWith(got) ? 'match' : 'mismatch';
}

/** Exit code for a given outcome, given how strict the caller asked to be. */
export function exitCodeFor(match: DeployMatch, requireMatch: boolean): number {
  if (match === 'match') return 0;
  // Both 'mismatch' and 'unknown' mean "not verified as our build". Only the
  // caller knows whether that should stop the run.
  return requireMatch ? 1 : 0;
}

interface HealthShape {
  commit?: unknown;
  version?: unknown;
}

async function readHealth(baseUrl: string): Promise<HealthShape | null> {
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(25_000) });
    if (!res.ok) return null;
    return (await res.json()) as HealthShape;
  } catch {
    return null;
  }
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const baseUrl = (process.argv[2] || '').replace(/\/+$/, '');
  const wanted = process.argv[3] || '';
  const timeoutSec = Number(arg('timeout') ?? 600);
  const requireMatch = process.argv.includes('--require-match');

  if (!baseUrl || !wanted) {
    console.error('usage: wait-for-deploy.ts <base-url> <commit-sha> [--timeout N] [--require-match]');
    process.exit(2);
  }

  console.log(`[wait-for-deploy] want commit ${wanted.slice(0, 12)} at ${baseUrl}`);
  const deadline = Date.now() + timeoutSec * 1000;
  let last: DeployMatch = 'unknown';
  let lastReported: unknown = null;

  for (;;) {
    const health = await readHealth(baseUrl);
    lastReported = health?.commit ?? null;
    last = classifyCommit(lastReported, wanted);
    if (last === 'match') {
      console.log(`[wait-for-deploy] deployed commit ${String(lastReported).slice(0, 12)} — this is the build under test`);
      process.exit(0);
    }
    const shown = typeof lastReported === 'string' && lastReported ? lastReported.slice(0, 12) : 'not reported';
    console.log(`[wait-for-deploy] deployed commit is ${shown}, waiting (${last})`);
    if (Date.now() >= deadline) break;
    await new Promise((r) => setTimeout(r, 20_000));
  }

  const shown = typeof lastReported === 'string' && lastReported ? lastReported.slice(0, 12) : 'not reported';
  const why =
    last === 'unknown'
      ? `the running build reports no commit (${shown}) — it predates the /health commit field, or is not on Render`
      : `the running build is commit ${shown}, not ${wanted.slice(0, 12)}`;

  if (requireMatch) {
    console.log(`::error::Timed out waiting for this commit to deploy: ${why}`);
    console.error('[wait-for-deploy] the checks that follow would describe a different build, so this run stops here');
    process.exit(1);
  }
  console.log(`::warning::${why} — the checks below describe that build, not this commit`);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('wait-for-deploy.ts')) {
  main().catch((err) => {
    console.error(`[wait-for-deploy] crashed: ${(err as Error).message}`);
    process.exit(1);
  });
}
