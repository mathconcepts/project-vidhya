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
 * Bundle rebuild: runs in-process via src/content/build-content-bundle.ts
 * (previously a documented skip — build-bundle.ts's logic lived only in
 * scripts/, which sits outside the tsc rootDir and can never be imported
 * from src/; the fix moved the logic into src/content/ instead, with
 * scripts/build-bundle.ts reduced to a thin CLI wrapper around it — see
 * that module's docblock). A rebuild failure here is recorded in the
 * summary line, never thrown — one broken input file (e.g. a malformed
 * scraped corpus JSONL) degrades the summary, it doesn't crash the chain
 * after content-generation and wolfram-verify already did real work.
 *
 * Every run appends a morning summary line to
 * .data/jobs/cron-summary.jsonl.
 */

import fs from 'fs';
import path from 'path';
import { startJob, jobsDir, type JobLimits, type JobStatusFile } from './job-runner';
import { CONTENT_GENERATION_JOB, WOLFRAM_VERIFY_JOB } from './job-registry';
import { buildContentBundle, type BuildContentBundleOptions } from '../content/build-content-bundle';

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
 *
 * `bundleOptions` is test-only plumbing (defaults to the real
 * frontend/public/data paths in production) — it lets tests redirect the
 * bundle rebuild's file I/O to a temp dir instead of mutating the repo's
 * real content-bundle.json on every cron-chain test run.
 */
export async function runNightlyContentChain(
  bundleOptions?: BuildContentBundleOptions,
): Promise<{ status: string; summary?: CronSummaryLine }> {
  if (process.env.CONTENT_CRON_ENABLED !== 'true') {
    return { status: 'skipped: CONTENT_CRON_ENABLED not "true" (cron ships disabled by design)' };
  }

  const cronLlmCap = envInt('CONTENT_CRON_MAX_LLM_CALLS', 200);
  const jobs: CronJobOutcome[] = [];

  // 1. content-generation (cron-specific LLM budget ceiling).
  jobs.push(await runOne(CONTENT_GENERATION_JOB, { content_max_llm_calls_per_run: cronLlmCap }));

  // 2. wolfram-verify (env-standard caps).
  jobs.push(await runOne(WOLFRAM_VERIFY_JOB));

  // 3. bundle rebuild — in-process (see module header).
  let bundle_rebuild: string;
  try {
    const result = buildContentBundle({ quiet: true, ...bundleOptions });
    bundle_rebuild = `ok: ${result.total_problems} problems, ${result.total_explainers} explainers, ${result.total_topic_notes} topic notes -> ${result.outPath}`;
  } catch (err) {
    bundle_rebuild = `failed: ${(err as Error).message}`;
    console.warn(`[nightly-content-chain] bundle rebuild failed: ${(err as Error).message}`);
  }

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
