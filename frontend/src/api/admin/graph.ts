/**
 * Graph browser API client — Mission Control "Graph editor" panel, scoped
 * down to read-only this batch (see admin-graph-routes.ts's docblock for
 * why: the CEO review doc's own §15 phase-sequencing table places full
 * graph editing/versioning/publish in Phase 2, not Phase 1). Wraps
 * GET /api/admin/graph/summary.
 *
 * Auth: piggybacks on the Vidhya JWT in localStorage via authFetch (same
 * pattern as jobs.ts / setup.ts).
 */

import { authFetch } from '@/lib/auth/client';

class GraphApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'GraphApiError';
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
    throw new GraphApiError(res.status, body?.message || body?.error || res.statusText || 'Request failed');
  }
  return body as T;
}

export type GateFrequency = 'high' | 'medium' | 'low' | 'rare';

export interface ConceptSummary {
  id: string;
  topic: string;
  label: string;
  difficulty_base: number;
  gate_frequency: GateFrequency;
  prerequisites: string[];
}

export interface ExamSummary {
  id: string;
  name: string;
  is_registered_syllabus: boolean;
  declared_concept_count: number;
  stub_concept_ids: string[];
}

export interface GraphSummary {
  generated_at: string;
  concepts: ConceptSummary[];
  dag_health: { ok: boolean; cycle: string[] | null };
  exams: ExamSummary[];
}

export async function getGraphSummary(): Promise<GraphSummary> {
  return jsonOrThrow(await authFetch('/api/admin/graph/summary'));
}

export { GraphApiError };
