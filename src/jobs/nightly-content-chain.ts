/**
 * nightly-content-chain — the autonomous content cron (content-pipeline
 * realignment plan, Accepted Scope item 4 / D4.3).
 *
 * Chain: content-generation → wolfram-verify → bundle rebuild.
 *
 * Gated on CONTENT_CRON_ENABLED=true (default false — ships disabled and
 * stays disabled until the first successful MANUAL run validates the
 * pipeline). CONTENT_CRON_MAX_LLM_CALLS (default 200) overrides
 * CONTENT_MAX_LLM_CALLS_PER_RUN for cron runs only. The global kill
 * switch (CONTENT_JOBS_DISABLED=true) still refuses every start.
 *
 * Bundle rebuild: DOCUMENTED SKIP. scripts/build-bundle.ts is
 * script-only (scripts/ sits outside the tsc rootDir, so it cannot be
 * imported from src/ without breaking `npm run build`) and this chain
 * never shells out. The morning summary records the skip; the operator
 * runs `npm run content:bundle` to fold newly verified flags/explainers
 * into the shipped bundle. Exporting the script's logic as an importable
 * function is a TODO for the follow-up de-nocheck PR that moves the
 * content scripts under typecheck.
 *
 * Every run appends a morning summary line to
 * .data/jobs/cron-summary.jsonl.
 */

import fs from 'fs';
import path from 'path';
import { startJob, jobsDir, type JobLimits, type JobStatusFile } from './job-runner';
import { CONTENT_GENERATION_JOB, WOLFRAM_VERIFY_JOB } from './job-registry';

export interface CronJobOutcome {
  job: string;
  started: boolean;
  refusal?: string;
  final_state?: JobStatusFile['state'];
  progress?: JobStatusFile['progress'];
  last_error?: string | null;
  message?: string | null;
}

export interface CronSummaryLine {
  ts: string;
  jobs: CronJobOutcome[];
  bundle_rebuild: string;
}

function cronSummaryPath(): string {
  return path.join(jobsDir(), 'cron-summary.jsonl');
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function runOne(
  name: string,
  limitOverrides?: Partial<JobLimits>,
): Promise<CronJobOutcome> {
  const result = await startJob(name, limitOverrides ? { limitOverrides } : undefined);
  if (!result.ok) {
    return { job: name, started: false, refusal: `${result.code}: ${result.message}` };
  }
  const final = await result.completion;
  return {
    job: name,
    started: true,
    final_state: final.state,
    progress: final.progress,
    last_error: final.last_error,
    message: final.message,
  };
}

/**
 * Run the nightly chain once. Returns a scheduler-friendly summary.
 * Never throws — every failure lands in the summary line instead.
 */
export async function runNightlyContentChain(): Promise<{ status: string; summary?: CronSummaryLine }> {
  if (process.env.CONTENT_CRON_ENABLED !== 'true') {
    return { status: 'skipped: CONTENT_CRON_ENABLED not "true" (cron ships disabled by design)' };
  }

  const cronLlmCap = envInt('CONTENT_CRON_MAX_LLM_CALLS', 200);
  const jobs: CronJobOutcome[] = [];

  // 1. content-generation (cron-specific LLM budget ceiling).
  jobs.push(await runOne(CONTENT_GENERATION_JOB, { content_max_llm_calls_per_run: cronLlmCap }));

  // 2. wolfram-verify (env-standard caps).
  jobs.push(await runOne(WOLFRAM_VERIFY_JOB));

  // 3. bundle rebuild — documented skip (see module header).
  const bundle_rebuild =
    'skipped: build-bundle.ts is script-only — run `npm run content:bundle` to fold verified flags into the shipped bundle';

  const summary: CronSummaryLine = { ts: new Date().toISOString(), jobs, bundle_rebuild };
  try {
    fs.mkdirSync(jobsDir(), { recursive: true });
    fs.appendFileSync(cronSummaryPath(), JSON.stringify(summary) + '\n');
  } catch (err) {
    console.warn(`[nightly-content-chain] summary write failed: ${(err as Error).message}`);
  }
  return { status: 'ran', summary };
}

export const __testing = { cronSummaryPath };
