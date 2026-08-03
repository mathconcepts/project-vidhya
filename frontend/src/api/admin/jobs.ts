/**
 * frontend/src/api/admin/jobs.ts
 *
 * Typed client for src/api/job-routes.ts — the checkpointed background-job
 * control surface (content-generation, wolfram-verify). This is Mission
 * Control Phase 1's "Run console" panel (SOTA-Facelift-CEO-Review.md §7.5),
 * scoped to the job-runner.ts system specifically. The DB-backed
 * generation_runs system (curriculum units, experiments) already has its
 * own console at /admin/content-rd — this page does not duplicate that.
 *
 * Auth: piggybacks on the Vidhya JWT in localStorage via authFetch (same
 * pattern as content-rd.ts / platform-health.ts).
 */

import { authFetch } from '@/lib/auth/client';

class JobsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'JobsApiError';
  }
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* no JSON body — fall through to statusText */
  }
  if (!res.ok) {
    throw new JobsApiError(res.status, body?.message || body?.error || res.statusText || 'Request failed', body);
  }
  return body as T;
}

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
  message: string | null;
}

export interface JobListing {
  name: string;
  description: string;
  status: JobStatusFile | null;
}

export async function listJobs(): Promise<JobListing[]> {
  const data = await jsonOrThrow<{ jobs: JobListing[] }>(await authFetch('/api/admin/jobs'));
  return data.jobs;
}

export async function startJob(name: string): Promise<{ started: true; status: JobStatusFile }> {
  return jsonOrThrow(await authFetch(`/api/admin/jobs/${encodeURIComponent(name)}/start`, { method: 'POST' }));
}

export async function cancelJob(
  name: string,
): Promise<{ cancelling: true; message: string; status: JobStatusFile | null }> {
  return jsonOrThrow(await authFetch(`/api/admin/jobs/${encodeURIComponent(name)}/cancel`, { method: 'POST' }));
}

export { JobsApiError };
