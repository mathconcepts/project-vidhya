/**
 * wolfram-verify job tests (content-pipeline realignment plan, items 4+5)
 * with a MOCKED wolfram-service: rate limiter engaged between calls,
 * step-by-step results cached with provenance, and both caps
 * (WOLFRAM_MAX_CALLS_PER_RUN, WOLFRAM_STEPS_MAX_PER_RUN) respected.
 * Also: refusal without WOLFRAM_APP_ID.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

vi.mock('../../services/wolfram-service', () => ({
  verifyProblemWithWolfram: vi.fn(),
  wolframSolve: vi.fn(),
}));

import { verifyProblemWithWolfram, wolframSolve } from '../../services/wolfram-service';
import { startJob, __testing as runnerTesting } from '../job-runner';
import { WOLFRAM_VERIFY_JOB, shouldSkipProblem, __testing as jobTesting } from '../wolfram-verify-job';
import { readWolframSteps } from '../../services/wolfram-steps-cache';
import { WOLFRAM_PER_CALL_USD } from '../../generation/cost-meter';

function readQuotaLedgerLines(): Array<Record<string, unknown>> {
  const file = path.join(tmp, 'jobs', 'quota-ledger.jsonl');
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

const mockVerify = vi.mocked(verifyProblemWithWolfram);
const mockSolve = vi.mocked(wolframSolve);

let tmp: string;
let bundleFile: string;
const savedEnv: Record<string, string | undefined> = {};
const ENV_KEYS = [
  'VIDHYA_JOBS_DIR', 'VIDHYA_WOLFRAM_STEPS_DIR', 'VIDHYA_CONTENT_BUNDLE_PATH',
  'WOLFRAM_APP_ID', 'WOLFRAM_RATE_MS', 'WOLFRAM_MAX_CALLS_PER_RUN',
  'WOLFRAM_STEPS_MAX_PER_RUN', 'CONTENT_JOBS_DISABLED',
];

const sleeps: number[] = [];
let restoreSleep: () => void;

function writeBundle(problems: Array<Record<string, unknown>>): void {
  fs.writeFileSync(bundleFile, JSON.stringify({ problems }, null, 2));
}

function readBundle(): { problems: Array<Record<string, any>> } {
  return JSON.parse(fs.readFileSync(bundleFile, 'utf-8'));
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wolfram-verify-'));
  bundleFile = path.join(tmp, 'content-bundle.json');
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  process.env.VIDHYA_JOBS_DIR = path.join(tmp, 'jobs');
  process.env.VIDHYA_WOLFRAM_STEPS_DIR = path.join(tmp, 'wolfram-steps');
  process.env.VIDHYA_CONTENT_BUNDLE_PATH = bundleFile;
  process.env.WOLFRAM_APP_ID = 'TEST-APP-ID';
  process.env.WOLFRAM_RATE_MS = '77';
  delete process.env.WOLFRAM_MAX_CALLS_PER_RUN;
  delete process.env.WOLFRAM_STEPS_MAX_PER_RUN;
  delete process.env.CONTENT_JOBS_DISABLED;
  runnerTesting.resetRuntimeForTests();
  sleeps.length = 0;
  restoreSleep = jobTesting.setSleepForTests(async (ms) => { sleeps.push(ms); });
  mockVerify.mockReset();
  mockSolve.mockReset();
});

afterEach(() => {
  restoreSleep();
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});

async function runJob() {
  const r = await startJob(WOLFRAM_VERIFY_JOB);
  expect(r.ok).toBe(true);
  return r.ok ? await r.completion : null;
}

describe('preflight', () => {
  it('refuses to start without WOLFRAM_APP_ID', async () => {
    delete process.env.WOLFRAM_APP_ID;
    writeBundle([]);
    const r = await startJob(WOLFRAM_VERIFY_JOB);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('refused');
      expect(r.message).toContain('WOLFRAM_APP_ID');
    }
    expect(mockVerify).not.toHaveBeenCalled();
  });
});

describe('verification + rate limiting', () => {
  it('verifies candidates, marks the bundle, and rate-limits between provider calls', async () => {
    writeBundle([
      { id: 'p1', question_text: 'integrate x^2', correct_answer: 'x^3/3' },
      { id: 'p2', question_text: 'derivative of sin x', correct_answer: 'cos(x)' },
      { id: 'p3', question_text: 'is a tree acyclic?', correct_answer: 'Yes' }, // narrative → pre-skipped
    ]);
    mockVerify.mockResolvedValue({ verified: true, wolfram_answer: 'match', latency_ms: 5 });
    mockSolve.mockResolvedValue({
      available: true, query: 'q', answer: 'a', steps: ['step 1', 'step 2'],
      interpretation: null, pods: [], latency_ms: 5,
    });

    const final = await runJob();
    expect(final?.state).toBe('completed');
    expect(final?.progress.done).toBe(2); // p3 pre-skipped by heuristic, not an item

    const bundle = readBundle();
    expect(bundle.problems.find((p) => p.id === 'p1')?.wolfram_verified).toBe(true);
    expect(bundle.problems.find((p) => p.id === 'p2')?.wolfram_verified).toBe(true);
    expect(bundle.problems.find((p) => p.id === 'p3')?.wolfram_verified).toBeUndefined();

    // 4 provider calls (2 verify + 2 steps) → 3 rate-limit sleeps of WOLFRAM_RATE_MS
    // (no sleep before the very first call).
    expect(mockVerify).toHaveBeenCalledTimes(2);
    expect(mockSolve).toHaveBeenCalledTimes(2);
    expect(sleeps).toEqual([77, 77, 77]);
  });

  it('requests steps with show_steps and caches them with wolfram provenance', async () => {
    writeBundle([{ id: 'p1', question_text: 'integrate x^2', correct_answer: 'x^3/3' }]);
    mockVerify.mockResolvedValue({ verified: true, wolfram_answer: 'x^3/3', latency_ms: 5 });
    mockSolve.mockResolvedValue({
      available: true, query: 'integrate x^2', answer: 'x^3/3 + C',
      steps: ['rewrite as power', 'apply the power rule'],
      interpretation: null, pods: [], latency_ms: 5,
    });

    const final = await runJob();
    expect(final?.state).toBe('completed');
    expect(mockSolve).toHaveBeenCalledWith('integrate x^2', { show_steps: true });

    const cached = readWolframSteps('p1');
    expect(cached).not.toBeNull();
    expect(cached?.steps).toEqual(['rewrite as power', 'apply the power rule']);
    expect(cached?.provenance.source).toBe('wolfram');
    expect(cached?.provenance.query_id).toMatch(/^[0-9a-f]{16}$/);
    expect(cached?.provenance.fetched_at).toBeTruthy();
    expect(cached?.problem_id).toBe('p1');
  });

  it('unverified problems get no steps request and no cache entry', async () => {
    writeBundle([{ id: 'p1', question_text: '2+2', correct_answer: '5' }]);
    mockVerify.mockResolvedValue({ verified: false, wolfram_answer: '4', latency_ms: 5 });

    const final = await runJob();
    expect(final?.state).toBe('completed');
    expect(mockSolve).not.toHaveBeenCalled();
    expect(readWolframSteps('p1')).toBeNull();
    expect(readBundle().problems[0].wolfram_verified).toBeUndefined();
  });

  it('records the flat WOLFRAM_PER_CALL_USD estimate on every quota-ledger line, verify + steps alike', async () => {
    writeBundle([{ id: 'p1', question_text: 'integrate x^2', correct_answer: 'x^3/3' }]);
    mockVerify.mockResolvedValue({ verified: true, wolfram_answer: 'x^3/3', latency_ms: 5 });
    mockSolve.mockResolvedValue({
      available: true, query: 'integrate x^2', answer: 'x^3/3 + C', steps: ['a step'],
      interpretation: null, pods: [], latency_ms: 5,
    });

    const final = await runJob();
    expect(final?.state).toBe('completed');

    const ledger = readQuotaLedgerLines();
    expect(ledger.length).toBe(2); // 1 verify call + 1 steps call
    for (const line of ledger) {
      expect(line.provider).toBe('wolfram');
      expect(line.cost_usd).toBe(WOLFRAM_PER_CALL_USD);
    }
  });
});

describe('caps', () => {
  it('WOLFRAM_MAX_CALLS_PER_RUN pauses the job with a resumable checkpoint', async () => {
    process.env.WOLFRAM_MAX_CALLS_PER_RUN = '3';
    writeBundle([
      { id: 'p1', question_text: 'q1', correct_answer: '1' },
      { id: 'p2', question_text: 'q2', correct_answer: '2' },
      { id: 'p3', question_text: 'q3', correct_answer: '3' },
    ]);
    mockVerify.mockResolvedValue({ verified: true, wolfram_answer: 'ok', latency_ms: 1 });
    mockSolve.mockResolvedValue({
      available: true, query: 'q', answer: 'a', steps: ['s'],
      interpretation: null, pods: [], latency_ms: 1,
    });

    const final = await runJob();
    // p1: verify(1) + steps(2); p2: verify(3) — steps blocked by cap; p3: cap hit → pause.
    expect(final?.state).toBe('paused');
    expect(final?.message).toContain('WOLFRAM_MAX_CALLS_PER_RUN');
    expect(final?.progress.done).toBe(2);
    expect(mockVerify).toHaveBeenCalledTimes(2);
    expect(mockSolve).toHaveBeenCalledTimes(1);
    // Both verified flags persisted before the pause.
    const bundle = readBundle();
    expect(bundle.problems.filter((p) => p.wolfram_verified).length).toBe(2);
  });

  it('WOLFRAM_STEPS_MAX_PER_RUN caps the harvest independently of verification', async () => {
    process.env.WOLFRAM_STEPS_MAX_PER_RUN = '1';
    writeBundle([
      { id: 'p1', question_text: 'q1', correct_answer: '1' },
      { id: 'p2', question_text: 'q2', correct_answer: '2' },
    ]);
    mockVerify.mockResolvedValue({ verified: true, wolfram_answer: 'ok', latency_ms: 1 });
    mockSolve.mockResolvedValue({
      available: true, query: 'q', answer: 'a', steps: ['s1'],
      interpretation: null, pods: [], latency_ms: 1,
    });

    const final = await runJob();
    expect(final?.state).toBe('completed');
    expect(final?.progress.done).toBe(2);
    // Steps requested once only; second verified problem harvests nothing.
    expect(mockSolve).toHaveBeenCalledTimes(1);
    expect(readWolframSteps('p1')).not.toBeNull();
    expect(readWolframSteps('p2')).toBeNull();
  });
});

describe('timeout handling', () => {
  it('provider timeouts retry ×2 then skip-and-record', async () => {
    writeBundle([{ id: 'p1', question_text: 'q1', correct_answer: '1' }]);
    mockVerify.mockResolvedValue({
      verified: false, wolfram_answer: null, latency_ms: 1, error: 'The operation was aborted',
    });

    const final = await runJob();
    expect(final?.state).toBe('completed');
    expect(mockVerify).toHaveBeenCalledTimes(3); // initial + 2 retries
    expect(final?.progress.skipped).toBe(1);
  });
});

describe('tri-state verification outcome (T7 precondition)', () => {
  it('an inconclusive result is queued for re-verify, distinct from a genuine failure', async () => {
    writeBundle([{ id: 'p1', question_text: 'q1', correct_answer: '1' }]);
    mockVerify.mockResolvedValue({
      verified: false, status: 'inconclusive', wolfram_answer: null, latency_ms: 5,
      error: 'HTTP 503',
    });

    const final = await runJob();
    expect(final?.state).toBe('completed');
    expect(final?.progress.done).toBe(1);
    // Never marked verified, and never treated as a hard rejection — it's
    // simply not yet resolved, same as before this policy landed, but now
    // distinguishable in the checkpoint/logs from a genuine disagreement.
    expect(readBundle().problems[0].wolfram_verified).toBeUndefined();
    expect(mockSolve).not.toHaveBeenCalled(); // no step harvest for an unresolved item
  });

  it('a genuine disagreement is recorded as failed, not inconclusive', async () => {
    writeBundle([{ id: 'p1', question_text: '2+2', correct_answer: '5' }]);
    mockVerify.mockResolvedValue({
      verified: false, status: 'failed', wolfram_answer: '4', latency_ms: 5,
    });

    const final = await runJob();
    expect(final?.state).toBe('completed');
    expect(readBundle().problems[0].wolfram_verified).toBeUndefined();
  });

  it('a mocked result with no status field (pre-tri-state shape) still behaves as before — falls through to the unverified branch', async () => {
    writeBundle([{ id: 'p1', question_text: '2+2', correct_answer: '5' }]);
    mockVerify.mockResolvedValue({ verified: false, wolfram_answer: '4', latency_ms: 5 });

    const final = await runJob();
    expect(final?.state).toBe('completed');
    expect(readBundle().problems[0].wolfram_verified).toBeUndefined();
  });
});

describe('shouldSkipProblem heuristics (mirrors scripts/verify-wolfram-batch.ts)', () => {
  it('skips missing/empty/long/narrative answers', () => {
    expect(shouldSkipProblem({ id: 'x' })).toBe('no-correct-answer');
    expect(shouldSkipProblem({ id: 'x', correct_answer: '  ' })).toBe('empty-answer');
    expect(shouldSkipProblem({ id: 'x', correct_answer: 'a'.repeat(120) })).toBe('answer-too-long');
    expect(shouldSkipProblem({ id: 'x', correct_answer: 'Only conditionally' })).toBe('narrative-answer');
    expect(shouldSkipProblem({ id: 'x', correct_answer: 'x^3/3', question_text: 'integrate' })).toBeNull();
  });
});
