/**
 * jobs.ts — in-memory registry for concept-orchestrator jobs.
 *
 * Backs the live progress modal (D1 design decision). Admin's POST /generate
 * starts an async job and returns a job_id; the frontend polls
 * GET /status/:job_id every 2s until type === 'done'.
 *
 * In-memory is intentional: jobs are short-lived (~30-60s, capped by
 * atom_types.length × per-atom latency) and we don't need cross-process
 * persistence in the v1 admin flow. After 5 min of inactivity the entry
 * is GC'd to keep memory bounded.
 *
 * Failure mode: if the server restarts mid-job, the job is lost. Admin's
 * frontend will see status 404 on the poll and can re-issue Generate
 * (idempotent for atom drafts that already persisted to atom_versions).
 */

import { randomUUID } from 'node:crypto';
import type { ConceptDraft, ProgressEvent } from './types';

const TTL_MS = 5 * 60 * 1000;        // 5 min after completion or last update
const SWEEP_INTERVAL_MS = 60 * 1000;  // GC pass every minute

export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface JobState {
  id: string;
  status: JobStatus;
  concept_id: string;
  topic_family: string;
  /** Progress events received from the orchestrator, in chronological order. */
  events: ProgressEvent[];
  /** Set when status === 'done'. */
  result?: ConceptDraft;
  /** Set when status === 'failed'. */
  error?: string;
  started_at: number;
  updated_at: number;
}

const jobs = new Map<string, JobState>();
let _sweepTimer: ReturnType<typeof setInterval> | null = null;

function ensureSweeper() {
  if (_sweepTimer) return;
  _sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, j] of jobs) {
      if (now - j.updated_at > TTL_MS) jobs.delete(id);
    }
  }, SWEEP_INTERVAL_MS);
  // Don't keep the process alive just for the sweeper.
  if (typeof (_sweepTimer as any).unref === 'function') {
    (_sweepTimer as any).unref();
  }
}

export function createJob(concept_id: string, topic_family: string): JobState {
  ensureSweeper();
  const id = randomUUID();
  const now = Date.now();
  const job: JobState = {
    id,
    status: 'queued',
    concept_id,
    topic_family,
    events: [],
    started_at: now,
    updated_at: now,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): JobState | null {
  return jobs.get(id) ?? null;
}

/** Append a progress event and bump status if needed. */
export function recordProgress(id: string, event: ProgressEvent): void {
  const job = jobs.get(id);
  if (!job) return;
  job.events.push(event);
  job.updated_at = Date.now();
  if (event.type === 'start') job.status = 'running';
  if (event.type === 'done') job.status = 'done';
}

export function recordResult(id: string, result: ConceptDraft): void {
  const job = jobs.get(id);
  if (!job) return;
  job.result = result;
  job.status = 'done';
  job.updated_at = Date.now();
}

export function recordFailure(id: string, error: string): void {
  const job = jobs.get(id);
  if (!job) return;
  job.error = error;
  job.status = 'failed';
  job.updated_at = Date.now();
}

/** For tests — drop everything. */
export function _resetJobsForTests(): void {
  jobs.clear();
  if (_sweepTimer) {
    clearInterval(_sweepTimer);
    _sweepTimer = null;
  }
}

export function _jobCountForTests(): number {
  return jobs.size;
}
