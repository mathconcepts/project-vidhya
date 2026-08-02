/**
 * job-cli — foreground CLI entry for the background job runner.
 *
 *   npm run content:generate   →  tsx src/jobs/job-cli.ts content-generation
 *   npm run content:verify     →  tsx src/jobs/job-cli.ts wolfram-verify
 *
 * Runs ONE job in the foreground with progress lines (the runner logs
 * every item), then exits:
 *   0  — completed, or paused on quota (resumable: rerun the same
 *        command to continue from the checkpoint)
 *   1  — refused (kill switch, missing API key, corrupt checkpoint,
 *        already running) or failed
 *
 * `.env` is loaded automatically (see dotenv-loader.ts) — no more
 * `set -a; source .env; set +a` before running this. Run `npm run
 * content:setup` first for a clear PASS/FAIL credential + DB report
 * instead of discovering a bad key partway through a real run.
 */

import { loadDotEnvIntoProcess } from './dotenv-loader';
loadDotEnvIntoProcess();

import { startJob, listJobNames } from './job-runner';
import { preflightDatabase } from './db-preflight';
import './job-registry';

async function main(): Promise<void> {
  const name = process.argv[2];
  if (!name) {
    console.error(`usage: tsx src/jobs/job-cli.ts <job>\navailable jobs: ${listJobNames().join(', ')}`);
    process.exit(1);
  }

  // DB corner case, CLI-only: job-cli.ts is always a fresh, one-shot
  // process (never shared with the long-lived server — admin job routes
  // call startJob() in-process there instead, where this same check runs
  // as a warning-only inside the job's own preflight; see
  // content-generation-job.ts). That isolation makes it safe to actually
  // act on a failed DB check here: if DATABASE_URL is set but unreachable,
  // unset it for THIS PROCESS so every downstream module's lazy
  // `if (!process.env.DATABASE_URL) return null` short-circuits instead of
  // retrying a dead connection once per concept across the whole run.
  if (process.env.DATABASE_URL) {
    const db = await preflightDatabase();
    if (!db.ok) {
      console.warn(
        `[job-cli] DATABASE_URL is set but unreachable (${db.error}) — disabling DB persistence ` +
          'for this run (atoms still persist as files). Create the database or fix the ' +
          'connection string, then re-run `npm run content:setup` to confirm.',
      );
      delete process.env.DATABASE_URL;
    }
  }

  const result = await startJob(name);
  if (!result.ok) {
    console.error(`refused (${result.code}): ${result.message}`);
    if (result.status) {
      console.error(`current status: ${result.status.state} — ${JSON.stringify(result.status.progress)}`);
    }
    process.exit(1);
  }

  console.log(`[job:${name}] started${result.status.message ? ` — ${result.status.message}` : ''}`);
  const final = await result.completion;
  const p = final.progress;
  console.log(
    `[job:${name}] ${final.state} — done ${p.done}, skipped ${p.skipped}, failed ${p.failed} of ${p.total}`,
  );
  if (final.message) console.log(`[job:${name}] ${final.message}`);
  if (final.last_error) console.error(`[job:${name}] last error: ${final.last_error}`);

  if (final.state === 'completed') process.exit(0);
  if (final.state === 'paused') {
    console.log(`[job:${name}] paused with a resumable checkpoint — rerun this command to continue`);
    process.exit(0);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
