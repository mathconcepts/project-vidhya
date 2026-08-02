/**
 * job-runner — persistent, resumable background job runner.
 *
 * The existing src/jobs/scheduler.ts is a fixed-interval loop with no
 * cancellation, persistence, or single-flight guard. This module adds
 * those (content-pipeline realignment plan, Accepted Scope item 4):
 *
 *   - single-flight lock per job name (concurrent start → refused,
 *     admin routes map that to 409 with the running status)
 *   - cooperative cancellation token (jobs stop BETWEEN items)
 *   - atomic JSONL checkpoints (write temp file + rename) under
 *     .data/jobs/<job>.checkpoint.jsonl, resume-from-checkpoint on start
 *   - persistent per-job status file .data/jobs/<job>.status.json
 *     (state, progress counts, started_at, last_update, last_error) so
 *     status survives a server restart
 *   - quota ledger .data/jobs/quota-ledger.jsonl — one line per provider
 *     call {ts, provider, job, ok}; the deferred ₹-per-concept cost
 *     dashboard reads this later
 *
 * Failure semantics (named errors):
 *   - QuotaExhaustedError      → job PAUSES with a resumable checkpoint
 *                                and a status message; restart resumes
 *   - ProviderTimeoutError     → per-item retry ×2 then skip-and-record
 *   - CheckpointCorruptError   → fail CLOSED. The job never silently
 *                                restarts from zero over a corrupt
 *                                checkpoint; the operator must inspect
 *                                or remove the file explicitly.
 *
 * Global kill switch: CONTENT_JOBS_DISABLED=true refuses ALL job starts.
 *
 * Env-driven limits (resolved per start, overridable per run for cron):
 *   WOLFRAM_RATE_MS=1200  WOLFRAM_MAX_CALLS_PER_RUN=200
 *   WOLFRAM_STEPS_MAX_PER_RUN=50  GEMINI_BATCH_SIZE=5
 *   CONTENT_MAX_LLM_CALLS_PER_RUN=200
 */

import fs from 'fs';
import path from 'path';

// ─── Named errors ───────────────────────────────────────────────────────

/** Provider quota / run budget exhausted → pause with resumable checkpoint. */
export class QuotaExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExhaustedError';
  }
}

/** Provider timed out on one item → retried ×2, then skip-and-record. */
export class ProviderTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderTimeoutError';
  }
}

/** Checkpoint file unreadable → fail closed, never restart-from-zero. */
export class CheckpointCorruptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckpointCorruptError';
  }
}

/** Internal: thrown by processItems when the cancellation token fires. */
export class JobCancelledError extends Error {
  constructor() {
    super('job cancelled');
    this.name = 'JobCancelledError';
  }
}

// ─── Types ──────────────────────────────────────────────────────────────

export type JobRunState = 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface JobProgress {
  total: number;
  done: number;
  skipped: number;
  failed: number;
}

export interface JobStatusFile {
  job: string;
  state: JobRunState;
  progress: JobProgress;
  started_at: string;
  last_update: string;
  last_error: string | null;
  /** Human-readable status message (e.g. why the job paused). */
  message: string | null;
}

export interface JobLimits {
  wolfram_rate_ms: number;
  wolfram_max_calls_per_run: number;
  wolfram_steps_max_per_run: number;
  gemini_batch_size: number;
  content_max_llm_calls_per_run: number;
}

export interface CancellationToken {
  readonly cancelled: boolean;
}

export interface CheckpointRecord {
  key: string;
  status: 'done' | 'skipped' | 'failed';
  [extra: string]: unknown;
}

export interface JobContext {
  jobName: string;
  token: CancellationToken;
  limits: JobLimits;
  /** Records resumed from the checkpoint file (key → record). */
  completed: Map<string, CheckpointRecord>;
  /** Append a checkpoint record (atomic temp-write + rename). */
  checkpoint(rec: CheckpointRecord): void;
  /** Append one line to the quota ledger for a provider call. */
  recordProviderCall(provider: string, ok: boolean): void;
  /**
   * Drive the standard per-item loop: skips keys already in the
   * checkpoint, checks cancellation between items, retries
   * ProviderTimeoutError ×2 then skips-and-records, lets
   * QuotaExhaustedError bubble (→ pause), records any other per-item
   * error as a failed item and continues, checkpoints after each item.
   */
  processItems<T extends { key: string }>(
    items: T[],
    fn: (item: T) => Promise<Record<string, unknown> | void>,
  ): Promise<JobProgress>;
  log(msg: string): void;
}

export interface JobDefinition {
  name: string;
  description: string;
  /** Return a refusal message (job will not start) or null to proceed. */
  preflight?: () => string | null;
  run: (ctx: JobContext) => Promise<void>;
}

export type StartRefusalCode =
  | 'unknown_job'
  | 'disabled'
  | 'already_running'
  | 'refused'
  | 'checkpoint_corrupt';

export type StartResult =
  | { ok: true; status: JobStatusFile; completion: Promise<JobStatusFile> }
  | { ok: false; code: StartRefusalCode; message: string; status: JobStatusFile | null };

// ─── Paths ──────────────────────────────────────────────────────────────

/** Jobs state dir — override with VIDHYA_JOBS_DIR (tests). */
export function jobsDir(): string {
  return process.env.VIDHYA_JOBS_DIR || path.resolve(process.cwd(), '.data/jobs');
}

function statusPath(job: string): string {
  return path.join(jobsDir(), `${job}.status.json`);
}

function checkpointPath(job: string): string {
  return path.join(jobsDir(), `${job}.checkpoint.jsonl`);
}

function quotaLedgerPath(): string {
  return path.join(jobsDir(), 'quota-ledger.jsonl');
}

// ─── Atomic file helpers ────────────────────────────────────────────────

function atomicWrite(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

/**
 * Read + parse the checkpoint file for a job. A parse failure on ANY
 * line throws CheckpointCorruptError — fail closed; the operator decides
 * whether to repair or remove the file. Never silently restart-from-zero.
 */
export function readCheckpoint(job: string): Map<string, CheckpointRecord> {
  const file = checkpointPath(job);
  const map = new Map<string, CheckpointRecord>();
  if (!fs.existsSync(file)) return map;
  const raw = fs.readFileSync(file, 'utf-8');
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let rec: CheckpointRecord;
    try {
      rec = JSON.parse(line) as CheckpointRecord;
    } catch {
      throw new CheckpointCorruptError(
        `checkpoint corrupt: ${file} line ${i + 1} is not valid JSON. ` +
        `Refusing to run — inspect or remove the file to proceed (never silently restarting from zero).`,
      );
    }
    if (!rec || typeof rec.key !== 'string' || !rec.key) {
      throw new CheckpointCorruptError(
        `checkpoint corrupt: ${file} line ${i + 1} has no "key" field. ` +
        `Refusing to run — inspect or remove the file to proceed.`,
      );
    }
    map.set(rec.key, rec);
  }
  return map;
}

/** Read a job's persisted status file (survives restarts). */
export function readStatusFile(job: string): JobStatusFile | null {
  const file = statusPath(job);
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as JobStatusFile;
  } catch {
    return null;
  }
}

// ─── Limits ─────────────────────────────────────────────────────────────

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function resolveLimits(overrides?: Partial<JobLimits>): JobLimits {
  return {
    wolfram_rate_ms: envInt('WOLFRAM_RATE_MS', 1200),
    wolfram_max_calls_per_run: envInt('WOLFRAM_MAX_CALLS_PER_RUN', 200),
    wolfram_steps_max_per_run: envInt('WOLFRAM_STEPS_MAX_PER_RUN', 50),
    gemini_batch_size: envInt('GEMINI_BATCH_SIZE', 5),
    content_max_llm_calls_per_run: envInt('CONTENT_MAX_LLM_CALLS_PER_RUN', 200),
    ...(overrides || {}),
  };
}

// ─── Registry ───────────────────────────────────────────────────────────

const _defs = new Map<string, JobDefinition>();

export function registerJob(def: JobDefinition): void {
  _defs.set(def.name, def);
}

export function getJobDefinition(name: string): JobDefinition | undefined {
  return _defs.get(name);
}

export function listJobNames(): string[] {
  return [..._defs.keys()];
}

// ─── Runtime state (single-flight locks) ────────────────────────────────

interface RunningJob {
  token: { cancelled: boolean };
  status: JobStatusFile;
  completion: Promise<JobStatusFile>;
}

const _running = new Map<string, RunningJob>();

export function isJobRunning(name: string): boolean {
  return _running.has(name);
}

/**
 * Current status: the live in-memory status when running, otherwise the
 * persisted status file (which survives restarts). Null when the job has
 * never run on this install.
 */
export function getJobStatus(name: string): JobStatusFile | null {
  const live = _running.get(name);
  if (live) return live.status;
  return readStatusFile(name);
}

export function listJobs(): Array<{ name: string; description: string; status: JobStatusFile | null }> {
  return listJobNames().map((name) => ({
    name,
    description: _defs.get(name)!.description,
    status: getJobStatus(name),
  }));
}

/**
 * Cooperatively cancel a running job. The job stops BETWEEN items — the
 * in-flight item finishes (and checkpoints) first.
 */
export function cancelJob(name: string): { ok: boolean; message: string; status: JobStatusFile | null } {
  const live = _running.get(name);
  if (!live) {
    return { ok: false, message: `job "${name}" is not running`, status: getJobStatus(name) };
  }
  live.token.cancelled = true;
  return { ok: true, message: `cancellation requested for "${name}" — stops after the current item`, status: live.status };
}

// ─── Start ──────────────────────────────────────────────────────────────

export async function startJob(
  name: string,
  opts?: { limitOverrides?: Partial<JobLimits> },
): Promise<StartResult> {
  const def = _defs.get(name);
  if (!def) {
    return { ok: false, code: 'unknown_job', message: `unknown job "${name}"`, status: null };
  }

  // Global kill switch — refuses ALL starts.
  if (process.env.CONTENT_JOBS_DISABLED === 'true') {
    return {
      ok: false,
      code: 'disabled',
      message: 'CONTENT_JOBS_DISABLED=true — all content job starts are refused (global kill switch)',
      status: getJobStatus(name),
    };
  }

  // Single-flight lock.
  const live = _running.get(name);
  if (live) {
    return {
      ok: false,
      code: 'already_running',
      message: `job "${name}" is already running`,
      status: live.status,
    };
  }

  // Job-specific preflight (e.g. missing GEMINI_API_KEY / WOLFRAM_APP_ID).
  const refusal = def.preflight?.() ?? null;
  if (refusal) {
    return { ok: false, code: 'refused', message: refusal, status: getJobStatus(name) };
  }

  // Resume-from-checkpoint. Corrupt checkpoint → fail CLOSED.
  let completed: Map<string, CheckpointRecord>;
  try {
    completed = readCheckpoint(name);
  } catch (err) {
    const message = (err as Error).message;
    const failedStatus: JobStatusFile = {
      job: name,
      state: 'failed',
      progress: { total: 0, done: 0, skipped: 0, failed: 0 },
      started_at: new Date().toISOString(),
      last_update: new Date().toISOString(),
      last_error: message,
      message,
    };
    atomicWrite(statusPath(name), JSON.stringify(failedStatus, null, 2));
    return { ok: false, code: 'checkpoint_corrupt', message, status: failedStatus };
  }

  const token = { cancelled: false };
  const limits = resolveLimits(opts?.limitOverrides);
  const status: JobStatusFile = {
    job: name,
    state: 'running',
    progress: { total: 0, done: 0, skipped: 0, failed: 0 },
    started_at: new Date().toISOString(),
    last_update: new Date().toISOString(),
    last_error: null,
    message: completed.size > 0 ? `resumed from checkpoint (${completed.size} item(s) already recorded)` : null,
  };
  const persistStatus = () => {
    status.last_update = new Date().toISOString();
    atomicWrite(statusPath(name), JSON.stringify(status, null, 2));
  };
  persistStatus();

  const ctx: JobContext = {
    jobName: name,
    token,
    limits,
    completed,
    checkpoint(rec: CheckpointRecord): void {
      completed.set(rec.key, rec);
      // Atomic JSONL rewrite: serialize all records to a temp file, then
      // rename over the checkpoint. A crash mid-write never truncates the
      // real checkpoint.
      const lines = [...completed.values()].map((r) => JSON.stringify(r)).join('\n');
      atomicWrite(checkpointPath(name), lines + '\n');
    },
    recordProviderCall(provider: string, ok: boolean): void {
      try {
        fs.mkdirSync(jobsDir(), { recursive: true });
        fs.appendFileSync(
          quotaLedgerPath(),
          JSON.stringify({ ts: new Date().toISOString(), provider, job: name, ok }) + '\n',
        );
      } catch (err) {
        console.warn(`[job-runner] quota ledger write failed: ${(err as Error).message}`);
      }
    },
    async processItems<T extends { key: string }>(
      items: T[],
      fn: (item: T) => Promise<Record<string, unknown> | void>,
    ): Promise<JobProgress> {
      status.progress.total = items.length;
      persistStatus();
      for (const item of items) {
        const prior = completed.get(item.key);
        if (prior) {
          if (prior.status === 'done') status.progress.done++;
          else if (prior.status === 'skipped') status.progress.skipped++;
          else status.progress.failed++;
          continue;
        }
        if (token.cancelled) throw new JobCancelledError();

        let lastTimeout: ProviderTimeoutError | null = null;
        let handled = false;
        // Initial attempt + 2 retries on ProviderTimeoutError.
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const extra = (await fn(item)) || {};
            ctx.checkpoint({ key: item.key, status: 'done', ...extra });
            status.progress.done++;
            ctx.log(`${item.key} done (${status.progress.done}/${status.progress.total})`);
            handled = true;
            break;
          } catch (err) {
            if (err instanceof ProviderTimeoutError) {
              lastTimeout = err;
              if (attempt < 2) ctx.log(`${item.key} timed out — retry ${attempt + 1}/2`);
              continue;
            }
            if (err instanceof QuotaExhaustedError || err instanceof JobCancelledError) {
              throw err; // bubbles to the runner → paused / cancelled
            }
            ctx.checkpoint({ key: item.key, status: 'failed', error: (err as Error).message });
            status.progress.failed++;
            ctx.log(`${item.key} failed: ${(err as Error).message}`);
            handled = true;
            break;
          }
        }
        if (!handled && lastTimeout) {
          // Timed out on all 3 attempts → skip-and-record.
          ctx.checkpoint({ key: item.key, status: 'skipped', error: lastTimeout.message });
          status.progress.skipped++;
          ctx.log(`${item.key} skipped after 2 retries: ${lastTimeout.message}`);
        }
        persistStatus();
      }
      return { ...status.progress };
    },
    log(msg: string): void {
      console.log(`[job:${name}] ${msg}`);
    },
  };

  // Register the single-flight lock BEFORE launching the run — the async
  // run body executes synchronously up to its first await, and jobs may
  // interact with the runner (e.g. cancelJob) inside their first item.
  const runningEntry: RunningJob = { token, status, completion: Promise.resolve(status) };
  _running.set(name, runningEntry);

  const completion: Promise<JobStatusFile> = (async () => {
    try {
      await def.run(ctx);
      status.state = 'completed';
      status.message = null;
      persistStatus();
      // Run finished — a fresh start next time begins a new run.
      try { fs.rmSync(checkpointPath(name), { force: true }); } catch { /* keep */ }
    } catch (err) {
      if (err instanceof JobCancelledError || token.cancelled) {
        status.state = 'cancelled';
        status.message = 'cancelled by operator — checkpoint retained; restart resumes remaining items';
      } else if (err instanceof QuotaExhaustedError) {
        status.state = 'paused';
        status.message = err.message;
      } else if (err instanceof CheckpointCorruptError) {
        status.state = 'failed';
        status.last_error = err.message;
        status.message = err.message;
      } else {
        status.state = 'failed';
        status.last_error = (err as Error).message;
        status.message = null;
      }
      persistStatus();
    } finally {
      _running.delete(name);
    }
    return status;
  })();

  runningEntry.completion = completion;
  return { ok: true, status, completion };
}

// ─── Test helpers ───────────────────────────────────────────────────────

export const __testing = {
  atomicWrite,
  statusPath,
  checkpointPath,
  quotaLedgerPath,
  /** Clear in-memory locks + a registered job (unit tests only). */
  resetRuntimeForTests(): void {
    _running.clear();
  },
  unregisterJobForTests(name: string): void {
    _defs.delete(name);
  },
};
