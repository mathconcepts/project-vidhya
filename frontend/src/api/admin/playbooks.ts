/**
 * Typed client for /api/admin/playbooks and /api/admin/playbook-runs.
 * Mirrors src/playbooks/types.ts.
 */

import { authFetch } from '@/lib/auth/client';

export type PlaybookExecutor = 'job-runner' | 'run-dispatcher' | 'batch' | 'script' | 'subagent';
export type PlaybookRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'aborted';

export interface PlaybookGuards {
  kill_switch: true;
  quota_ledger: true;
  requires_tier?: string;
}

export interface DryRunEstimate {
  estimated_cost_usd: number;
  estimated_duration_human: string;
  estimated_artifact_count: number;
  notes?: string[];
}

export interface PlaybookSummary {
  id: string;
  title: string;
  description: string;
  executor: PlaybookExecutor;
  guards: PlaybookGuards;
  params_schema: Record<string, unknown>;
  steps?: string[];
}

export interface PlaybookRunStep {
  playbook_id: string;
  status: PlaybookRunStatus;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface PlaybookRun {
  run_id: string;
  playbook_id: string;
  params: Record<string, unknown>;
  status: PlaybookRunStatus;
  started_at: string;
  completed_at?: string;
  steps?: PlaybookRunStep[];
  brief_path?: string;
  error?: string;
}

export async function listPlaybooks(): Promise<PlaybookSummary[]> {
  const res = await authFetch('/api/admin/playbooks');
  if (!res.ok) throw new Error(`Failed to list playbooks: ${res.status}`);
  const data = await res.json() as { playbooks: PlaybookSummary[] };
  return data.playbooks;
}

export async function estimatePlaybook(
  id: string,
  params: Record<string, unknown>,
): Promise<{ estimate: DryRunEstimate; validation_errors: string[] }> {
  const res = await authFetch(`/api/admin/playbooks/${id}/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Estimate failed: ${res.status}`);
  return res.json() as Promise<{ estimate: DryRunEstimate; validation_errors: string[] }>;
}

export async function launchPlaybook(
  id: string,
  params: Record<string, unknown>,
  dryRun = false,
): Promise<{ run_id: string; status: PlaybookRunStatus; brief_path?: string }> {
  const res = await authFetch(`/api/admin/playbooks/${id}/launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, dry_run: dryRun }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(err.error ?? `Launch failed: ${res.status}`);
  }
  return res.json() as Promise<{ run_id: string; status: PlaybookRunStatus; brief_path?: string }>;
}

export async function listPlaybookRuns(playbookId?: string): Promise<PlaybookRun[]> {
  const url = playbookId
    ? `/api/admin/playbook-runs?playbook_id=${encodeURIComponent(playbookId)}`
    : '/api/admin/playbook-runs';
  const res = await authFetch(url);
  if (!res.ok) throw new Error(`Failed to list runs: ${res.status}`);
  const data = await res.json() as { runs: PlaybookRun[] };
  return data.runs;
}

export async function abortPlaybookRun(runId: string): Promise<PlaybookRun> {
  const res = await authFetch(`/api/admin/playbook-runs/${runId}/abort`, { method: 'POST' });
  if (!res.ok) throw new Error(`Abort failed: ${res.status}`);
  return res.json() as Promise<PlaybookRun>;
}
