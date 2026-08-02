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
 */

import { startJob, listJobNames } from './job-runner';
import './job-registry';

async function main(): Promise<void> {
  const name = process.argv[2];
  if (!name) {
    console.error(`usage: tsx src/jobs/job-cli.ts <job>\navailable jobs: ${listJobNames().join(', ')}`);
    process.exit(1);
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
