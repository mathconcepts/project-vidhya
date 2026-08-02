/**
 * Nightly content cron chain (content-pipeline realignment plan, D4.3):
 * gated OFF by default (CONTENT_CRON_ENABLED), writes a morning summary
 * line to .data/jobs/cron-summary.jsonl including the bundle rebuild
 * outcome, and records refusals (missing API keys / kill switch) instead
 * of throwing.
 *
 * Bundle rebuild now runs in-process (src/content/build-content-bundle.ts,
 * was previously a documented skip) — every test passes bundleOptions
 * pointing at a temp dir so these runs never touch the repo's real
 * frontend/public/data/content-bundle.json.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runNightlyContentChain } from '../nightly-content-chain';
import { __testing as runnerTesting } from '../job-runner';

let tmp: string;
let bundleTmp: string;
const savedEnv: Record<string, string | undefined> = {};
const ENV_KEYS = [
  'VIDHYA_JOBS_DIR', 'CONTENT_CRON_ENABLED', 'CONTENT_CRON_MAX_LLM_CALLS',
  'GEMINI_API_KEY', 'WOLFRAM_APP_ID', 'CONTENT_JOBS_DISABLED',
];

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cron-chain-'));
  bundleTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cron-chain-bundle-'));
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  process.env.VIDHYA_JOBS_DIR = tmp;
  delete process.env.CONTENT_CRON_ENABLED;
  delete process.env.GEMINI_API_KEY;
  delete process.env.WOLFRAM_APP_ID;
  delete process.env.CONTENT_JOBS_DISABLED;
  runnerTesting.resetRuntimeForTests();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.rmSync(bundleTmp, { recursive: true, force: true });
});

const bundleOptions = () => ({
  feDataDir: path.join(bundleTmp, 'fe-data'),
  rawDir: path.join(bundleTmp, 'raw'),
  genDir: path.join(bundleTmp, 'generated'),
  topicsDir: path.join(bundleTmp, 'topics'),
});

describe('nightly content chain', () => {
  it('is disabled by default (CONTENT_CRON_ENABLED unset) and writes nothing', async () => {
    const r = await runNightlyContentChain(bundleOptions());
    expect(r.status).toContain('skipped');
    expect(fs.existsSync(path.join(tmp, 'cron-summary.jsonl'))).toBe(false);
  });

  it('when enabled without API keys, records both job refusals and rebuilds the bundle in-process', async () => {
    process.env.CONTENT_CRON_ENABLED = 'true';
    const r = await runNightlyContentChain(bundleOptions());
    expect(r.status).toBe('ran');

    const lines = fs.readFileSync(path.join(tmp, 'cron-summary.jsonl'), 'utf-8').trim().split('\n');
    expect(lines.length).toBe(1);
    const summary = JSON.parse(lines[0]);
    expect(summary.ts).toBeTruthy();
    expect(summary.jobs.map((j: any) => j.job)).toEqual(['content-generation', 'wolfram-verify']);
    expect(summary.jobs[0].started).toBe(false);
    expect(summary.jobs[0].refusal).toContain('GEMINI_API_KEY');
    expect(summary.jobs[1].started).toBe(false);
    expect(summary.jobs[1].refusal).toContain('WOLFRAM_APP_ID');
    expect(summary.bundle_rebuild).toContain('ok:');
    expect(fs.existsSync(path.join(bundleTmp, 'fe-data', 'content-bundle.json'))).toBe(true);
  });

  it('the global kill switch shows up as a refusal in the summary', async () => {
    process.env.CONTENT_CRON_ENABLED = 'true';
    process.env.CONTENT_JOBS_DISABLED = 'true';
    const r = await runNightlyContentChain(bundleOptions());
    expect(r.status).toBe('ran');
    expect(r.summary?.jobs.every((j) => j.started === false)).toBe(true);
    expect(r.summary?.jobs[0].refusal).toContain('disabled');
    expect(r.summary?.bundle_rebuild).toContain('ok:');
  });
});
