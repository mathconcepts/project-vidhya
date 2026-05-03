/**
 * src/generation/batch/persistence.ts
 *
 * The DB-side surface the orchestrator uses. Defined as an interface so
 * unit tests can substitute an in-memory implementation; the real
 * Postgres-backed impl is wired in PR-A3 alongside the boot poller.
 *
 * Every method is idempotent + safe to call from a re-entered state
 * (boot resume, second poller, retried run). The orchestrator can call
 * any of these in any order without corrupting state.
 */

import type { BatchState, BatchProvider, AtomSpec } from './types';

export interface RunRow {
  id: string;
  exam_pack_id: string;
  batch_provider: BatchProvider | null;
  batch_id: string | null;
  batch_state: BatchState | null;
  jsonl_path: string | null;
  budget_locked_usd: number | null;
  /** Run-level remaining budget in USD; orchestrator decrements at submit time. */
  budget_remaining_usd: number;
  submitted_at: string | null;
  last_polled_at: string | null;
  error: string | null;
}

export interface JobRow {
  run_id: string;
  custom_id: string;
  atom_spec: AtomSpec;
  status: 'pending' | 'succeeded' | 'failed';
  result: unknown | null;
  error: string | null;
  submitted_at: string | null;
  processed_at: string | null;
}

export interface BatchPersistence {
  /** Read a run row. Returns null if not found. */
  getRun(run_id: string): Promise<RunRow | null>;

  /** Patch any subset of run fields. Idempotent. */
  updateRun(run_id: string, patch: Partial<RunRow>): Promise<void>;

  /** Bulk-insert atom_specs as pending batch_jobs. ON CONFLICT DO NOTHING. */
  insertJobs(run_id: string, jobs: Array<{ custom_id: string; atom_spec: AtomSpec }>): Promise<void>;

  /** Read all jobs for a run. */
  listJobs(run_id: string): Promise<JobRow[]>;

  /** Mark a job's result + status. Idempotent — safe to call after processed_at is set. */
  setJobResult(run_id: string, custom_id: string, patch: Partial<JobRow>): Promise<void>;

  /**
   * Acquire an advisory lock for this run_id. Returns true if acquired.
   * The lock auto-releases when releaseLock() is called or the connection
   * dies. Used to prevent two pollers from racing on the same run.
   *
   * Implementations may use Postgres pg_try_advisory_lock or a
   * file-based lock.
   */
  acquireLock(run_id: string): Promise<boolean>;
  releaseLock(run_id: string): Promise<void>;

  /** List all runs in non-terminal batch_state. Used by boot resume + poller. */
  listInFlightRuns(): Promise<RunRow[]>;
}
