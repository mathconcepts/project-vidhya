/**
 * frontend/src/api/admin/scenarios.ts
 *
 * Typed client for /api/admin/scenarios — persona trial reports + the
 * on-demand "neutral render" used by the side-by-side moat surface.
 */

import { authFetch } from '@/lib/auth/client';

export interface TrialEvent {
  idx: number;
  atom_id: string;
  atom_type: string;
  result:
    | { kind: 'answer'; answer_id: string; correct: boolean; via_rule: string }
    | { kind: 'needs_human'; reason: string }
    | { kind: 'human_answered'; answer: string; correct: boolean };
  mastery_after: number;
}

export interface PendingState {
  atom_idx: number;
  atom: { id: string; concept_id: string; atom_type: string };
  reason: string;
  paused_at: string;
}

export interface TrialState {
  schema_version: 1;
  run_id: string;
  persona_id: string;
  concept_id: string;
  user_id: string;
  session_id: string;
  started_at: string;
  status: 'running' | 'paused' | 'complete' | 'timeout';
  initial_mastery: number;
  current_mastery: number;
  events: TrialEvent[];
  remaining_atoms: Array<{ id: string; concept_id: string; atom_type: string }>;
  pending?: PendingState;
  finalised_at?: string;
}

export interface RunListItem {
  id: string;
}

export async function listScenarios(): Promise<RunListItem[]> {
  const r = await authFetch('/api/admin/scenarios');
  if (!r.ok) throw new Error(`list failed: ${r.status}`);
  const body = (await r.json()) as { runs: RunListItem[] };
  return body.runs;
}

export async function readScenario(id: string): Promise<{ trial: TrialState; digest: string }> {
  const r = await authFetch(`/api/admin/scenarios/${encodeURIComponent(id)}`);
  if (!r.ok) throw new Error(`read failed: ${r.status}`);
  return r.json();
}

export async function neutralRender(
  runId: string,
  atom_id: string,
): Promise<{ atom_id: string; concept_id: string; body: string; cached: boolean }> {
  const r = await authFetch(
    `/api/admin/scenarios/${encodeURIComponent(runId)}/neutral-render`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atom_id }),
    },
  );
  if (r.status === 429) throw new Error('Rate limited (10/hour). Try again later.');
  if (!r.ok) throw new Error(`neutral-render failed: ${r.status}`);
  return r.json();
}
