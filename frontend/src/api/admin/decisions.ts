import { authFetch } from '@/lib/auth/client';

export type DecisionKind =
  | 'ruleset_created' | 'blueprint_created' | 'blueprint_approved' | 'run_launched';

export interface DecisionRow {
  kind: DecisionKind;
  at: string;
  actor: string;
  ref_id: string;
  summary: string;
  href: string;
}

export async function listDecisions(limit = 50): Promise<DecisionRow[]> {
  const r = await authFetch(`/api/admin/decisions?limit=${limit}`);
  if (!r.ok) throw new Error(`decisions failed: ${r.status}`);
  const body = (await r.json()) as { decisions: DecisionRow[] };
  return body.decisions;
}
