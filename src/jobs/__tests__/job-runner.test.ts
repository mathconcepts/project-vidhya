/**
 * Unit tests for the background job runner (content-pipeline realignment
 * plan, item 4): single-flight lock (409 semantics), atomic checkpoint
 * write/resume, corrupt checkpoint fails CLOSED with CheckpointCorruptError,
 * cooperative cancellation stops between items, global kill switch refuses
 * starts, QuotaExhaustedError pauses with a resumable checkpoint, and
 * ProviderTimeoutError retries ×2 then skips-and-records.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  registerJob,
  startJob,
  cancelJob,
  getJobStatus,
  readCheckpoint,
  readStatusFile,
  QuotaExhaustedError,
  ProviderTimeoutError,
  CheckpointCorruptError,
  __testing,
  type JobContext,
} from '../job-runner';

let tmp: string;
let origJobsDir: string | undefined;
let origDisabled: string | undefined;
let jobCounter = 0;

function uniqueName(prefix: string): string {
  jobCounter++;
  return `${prefix}-${jobCounter}`;
}

/** Register a job that processes `keys` via processItems with `fn` per item. */
function registerItemJob(
  name: string,
  keys: string[],
  fn: (item: { key: string }, ctx: JobContext) => Promise<Record<string, unknown> | void>,
  preflight?: () => string | null,
): void {
  registerJob({
    name,
    description: 'test job',
    preflight,
    run: async (ctx) => {
      await ctx.processItems(keys.map((key) => ({ key })), (item) => fn(item, ctx));
    },
  });
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'job-runner-'));
  origJobsDir = process.env.VIDHYA_JOBS_DIR;
  origDisabled = process.env.CONTENT_JOBS_DISABLED;
  process.env.VIDHYA_JOBS_DIR = tmp;
  delete process.env.CONTENT_JOBS_DISABLED;
  __testing.resetRuntimeForTests();
});

afterEach(() => {
  if (origJobsDir === undefined) delete process.env.VIDHYA_JOBS_DIR;
  else process.env.VIDHYA_JOBS_DIR = origJobsDir;
  if (origDisabled === undefined) delete process.env.CONTENT_JOBS_DISABLED;
  else process.env.CONTENT_JOBS_DISABLED = origDisabled;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('single-flight lock', () => {
  it('refuses a concurrent start of a running job with the existing status (409 semantics)', async () => {
    const name = uniqueName('single-flight');
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => { release = r; });
    registerItemJob(name, ['a'], async () => { await gate; });

    const first = await startJob(name);
    expect(first.ok).toBe(true);

    const second = await startJob(name);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.code).toBe('already_running');
      expect(second.status?.state).toBe('running');
    }

    release();
    if (first.ok) await first.completion;
    // After completion the lock is free again.
    const third = await startJob(name);
    expect(third.ok).toBe(true);
    if (third.ok) await third.completion;
  });
});

describe('kill switch', () => {
  it('CONTENT_JOBS_DISABLED=true refuses all starts', async () => {
    const name = uniqueName('killswitch');
    registerItemJob(name, ['a'], async () => {});
    process.env.CONTENT_JOBS_DISABLED = 'true';
    const r = await startJob(name);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('disabled');
      expect(r.message).toContain('CONTENT_JOBS_DISABLED');
    }
  });
});

describe('preflight refusal', () => {
  it('a preflight message refuses the start without touching status', async () => {
    const name = uniqueName('preflight');
    registerItemJob(name, ['a'], async () => {}, () => 'API key missing — refusing');
    const r = await startJob(name);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('refused');
      expect(r.message).toContain('API key missing');
    }
    expect(readStatusFile(name)).toBeNull();
  });
});

describe('checkpoint write + resume', () => {
  it('checkpoints after each item and resumes from the checkpoint on restart', async () => {
    const name = uniqueName('resume');
    const processed: string[] = [];
    let failAfter = 2;
    registerItemJob(name, ['a', 'b', 'c', 'd'], async ({ key }) => {
      if (processed.length >= failAfter) throw new QuotaExhaustedError('budget spent');
      processed.push(key);
      return { note: `did-${key}` };
    });

    const first = await startJob(name);
    expect(first.ok).toBe(true);
    const paused = first.ok ? await first.completion : null;
    expect(paused?.state).toBe('paused');
    expect(paused?.message).toContain('budget spent');
    expect(processed).toEqual(['a', 'b']);

    // Checkpoint file has exactly the two completed items.
    const cp = readCheckpoint(name);
    expect([...cp.keys()].sort()).toEqual(['a', 'b']);
    expect(cp.get('a')?.status).toBe('done');
    expect(cp.get('a')?.note).toBe('did-a');

    // Restart: only c + d are processed; a + b come from the checkpoint.
    failAfter = 99;
    const second = await startJob(name);
    expect(second.ok).toBe(true);
    const final = second.ok ? await second.completion : null;
    expect(final?.state).toBe('completed');
    expect(processed).toEqual(['a', 'b', 'c', 'd']);
    expect(final?.progress).toEqual({ total: 4, done: 4, skipped: 0, failed: 0 });

    // Completed run clears the checkpoint (next start is a fresh run).
    expect(readCheckpoint(name).size).toBe(0);
  });

  it('status file survives on disk with counts + timestamps', async () => {
    const name = uniqueName('statusfile');
    registerItemJob(name, ['x', 'y'], async () => {});
    const r = await startJob(name);
    if (r.ok) await r.completion;
    const status = readStatusFile(name);
    expect(status?.state).toBe('completed');
    expect(status?.progress).toEqual({ total: 2, done: 2, skipped: 0, failed: 0 });
    expect(status?.started_at).toBeTruthy();
    expect(status?.last_update).toBeTruthy();
    expect(status?.last_error).toBeNull();
  });
});

describe('corrupt checkpoint fails closed', () => {
  it('refuses to start over a corrupt checkpoint with CheckpointCorruptError — never restart-from-zero', async () => {
    const name = uniqueName('corrupt');
    const ran: string[] = [];
    registerItemJob(name, ['a'], async ({ key }) => { ran.push(key); });

    fs.mkdirSync(tmp, { recursive: true });
    fs.writeFileSync(path.join(tmp, `${name}.checkpoint.jsonl`), '{"key":"a","status":"done"}\nNOT JSON{{{\n');

    const r = await startJob(name);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('checkpoint_corrupt');
      expect(r.message).toContain('checkpoint corrupt');
      expect(r.status?.state).toBe('failed');
    }
    // The job never ran an item and the corrupt file is left in place.
    expect(ran).toEqual([]);
    expect(fs.readFileSync(path.join(tmp, `${name}.checkpoint.jsonl`), 'utf-8')).toContain('NOT JSON');
    expect(() => readCheckpoint(name)).toThrow(CheckpointCorruptError);
  });
});

describe('cancellation', () => {
  it('cancel stops the job between items and retains the checkpoint', async () => {
    const name = uniqueName('cancel');
    const processed: string[] = [];
    registerItemJob(name, ['a', 'b', 'c'], async ({ key }) => {
      processed.push(key);
      if (key === 'a') {
        const c = cancelJob(name);
        expect(c.ok).toBe(true);
      }
    });

    const r = await startJob(name);
    expect(r.ok).toBe(true);
    const final = r.ok ? await r.completion : null;
    expect(final?.state).toBe('cancelled');
    // Item 'a' finished (and checkpointed); 'b' and 'c' never started.
    expect(processed).toEqual(['a']);
    const cp = readCheckpoint(name);
    expect(cp.get('a')?.status).toBe('done');
    expect(cp.has('b')).toBe(false);
  });

  it('cancel on a non-running job reports not running', () => {
    const c = cancelJob(uniqueName('never-ran'));
    expect(c.ok).toBe(false);
    expect(c.message).toContain('not running');
  });
});

describe('quota pause', () => {
  it('QuotaExhaustedError pauses with state=paused and a status message', async () => {
    const name = uniqueName('quota');
    registerItemJob(name, ['a', 'b'], async ({ key }) => {
      if (key === 'b') throw new QuotaExhaustedError('WOLFRAM_MAX_CALLS_PER_RUN reached (200/200)');
    });
    const r = await startJob(name);
    const final = r.ok ? await r.completion : null;
    expect(final?.state).toBe('paused');
    expect(final?.message).toContain('WOLFRAM_MAX_CALLS_PER_RUN reached');
    expect(getJobStatus(name)?.state).toBe('paused');
    // 'a' is checkpointed → the pause is resumable.
    expect(readCheckpoint(name).get('a')?.status).toBe('done');
  });
});

describe('provider timeout retry semantics', () => {
  it('retries ×2 on ProviderTimeoutError then skips-and-records', async () => {
    const name = uniqueName('timeout');
    let attempts = 0;
    registerItemJob(name, ['t', 'ok'], async ({ key }) => {
      if (key === 't') {
        attempts++;
        throw new ProviderTimeoutError('wolfram timeout');
      }
    });
    const r = await startJob(name);
    const final = r.ok ? await r.completion : null;
    expect(attempts).toBe(3); // initial + 2 retries
    expect(final?.state).toBe('completed');
    expect(final?.progress).toEqual({ total: 2, done: 1, skipped: 1, failed: 0 });
    // Cleared on completion, but the record existed with status skipped —
    // verify via the run's own counts above and a fresh paused variant below.
  });

  it('a transient timeout that recovers on retry counts as done', async () => {
    const name = uniqueName('timeout-recover');
    let attempts = 0;
    registerItemJob(name, ['t'], async () => {
      attempts++;
      if (attempts < 2) throw new ProviderTimeoutError('flaky');
    });
    const r = await startJob(name);
    const final = r.ok ? await r.completion : null;
    expect(final?.state).toBe('completed');
    expect(final?.progress.done).toBe(1);
    expect(final?.progress.skipped).toBe(0);
  });
});

describe('per-item non-timeout errors', () => {
  it('records the item as failed and continues with the rest', async () => {
    const name = uniqueName('itemfail');
    registerItemJob(name, ['bad', 'good'], async ({ key }) => {
      if (key === 'bad') throw new Error('no usable atoms generated');
    });
    const r = await startJob(name);
    const final = r.ok ? await r.completion : null;
    expect(final?.state).toBe('completed');
    expect(final?.progress).toEqual({ total: 2, done: 1, skipped: 0, failed: 1 });
  });
});

describe('quota ledger', () => {
  it('recordProviderCall appends {ts, provider, job, ok} lines', async () => {
    const name = uniqueName('ledger');
    registerJob({
      name,
      description: 'ledger test',
      run: async (ctx) => {
        ctx.recordProviderCall('wolfram', true);
        ctx.recordProviderCall('gemini', false);
      },
    });
    const r = await startJob(name);
    if (r.ok) await r.completion;
    const lines = fs.readFileSync(path.join(tmp, 'quota-ledger.jsonl'), 'utf-8').trim().split('\n');
    expect(lines.length).toBe(2);
    const first = JSON.parse(lines[0]);
    expect(first.provider).toBe('wolfram');
    expect(first.job).toBe(name);
    expect(first.ok).toBe(true);
    expect(first.ts).toBeTruthy();
    // No cost passed — the field must be absent entirely, not present as 0
    // (0 would silently claim "this call was free", which is a lie).
    expect(first.cost_usd).toBeUndefined();
    expect(JSON.parse(lines[1])).toMatchObject({ provider: 'gemini', ok: false });
  });

  it('recordProviderCall writes cost_usd only when the caller supplies a finite number', async () => {
    const name = uniqueName('ledger-cost');
    registerJob({
      name,
      description: 'ledger cost test',
      run: async (ctx) => {
        ctx.recordProviderCall('wolfram', true, 0.001);
        ctx.recordProviderCall('gemini', true, 0); // a real zero cost is still worth recording
        ctx.recordProviderCall('claude', true, NaN); // non-finite — must be dropped, not written as NaN
        ctx.recordProviderCall('openai', true, undefined);
      },
    });
    const r = await startJob(name);
    if (r.ok) await r.completion;
    const lines = fs
      .readFileSync(path.join(tmp, 'quota-ledger.jsonl'), 'utf-8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));
    expect(lines.find((l) => l.provider === 'wolfram')?.cost_usd).toBe(0.001);
    expect(lines.find((l) => l.provider === 'gemini')?.cost_usd).toBe(0);
    expect(lines.find((l) => l.provider === 'claude')?.cost_usd).toBeUndefined();
    expect(lines.find((l) => l.provider === 'openai')?.cost_usd).toBeUndefined();
  });
});
