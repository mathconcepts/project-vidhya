/**
 * frontend/src/api/admin/review-queue.ts
 *
 * Typed client for the D4 item review queue
 * (src/api/admin-review-queue-routes.ts). Same shape and auth story as
 * frontend/src/api/admin/content-rd.ts: piggybacks on the Vidhya JWT via
 * authFetch, no embedded secrets.
 *
 * Types mirror the server's, kept in sync manually — same convention as
 * the rest of frontend/src/api/admin/.
 */

import { authFetch } from '@/lib/auth/client';

export type GateStatus = 'pending' | 'passed' | 'failed' | 'waived';
export type ReviewDecision = 'approve' | 'reject' | 'needs_fix';

/** The five named gates, in the order the operator reads them. */
export const CONTENT_GATES = [
  'scope',
  'mathematics',
  'assessment_contract',
  'misconception_coverage',
  'provenance',
] as const;
export type ContentGate = (typeof CONTENT_GATES)[number];

export interface ReviewItemDetail {
  source: 'generated_problems' | 'file_bank' | 'unresolved';
  concept_id?: string;
  topic?: string;
  question_type?: string | null;
  marks?: number | null;
  question_text?: string;
  options?: string[];
  answer_index?: number | null;
  answer_indices?: number[] | null;
  answer_range?: [number, number] | null;
  correct_answer?: string | null;
  solution_steps?: string[];
  distractor_failure_tags?: Record<string, string> | null;
  verification_method?: string | null;
  difficulty?: number | null;
}

export interface GateState {
  status: GateStatus;
  reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
}

export interface ReviewQueueRow {
  item_id: string;
  generation_run_id: string;
  status: GateStatus;
  reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  needs_fix: boolean;
  gates: Partial<Record<ContentGate, GateState>>;
  gates_satisfied: number;
  gates_total: number;
  detail: ReviewItemDetail;
}

export interface ReviewQueueResponse {
  items: ReviewQueueRow[];
  gate: ContentGate;
  gates_total: number;
  filters: { run: string | null; status: string; limit: number };
}

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return body as T;
}

export async function listReviewQueue(params: { run?: string; status?: string; limit?: number } = {}): Promise<ReviewQueueResponse> {
  const q = new URLSearchParams();
  if (params.run) q.set('run', params.run);
  if (params.status) q.set('status', params.status);
  if (params.limit) q.set('limit', String(params.limit));
  const suffix = q.toString() ? `?${q}` : '';
  return json<ReviewQueueResponse>(await authFetch(`/api/admin/review-queue${suffix}`));
}

export async function decideItem(
  itemId: string,
  decision: ReviewDecision,
  notes?: string,
): Promise<{ item_id: string; decision: ReviewDecision; decided_by: string }> {
  return json(
    await authFetch(`/api/admin/review-queue/${encodeURIComponent(itemId)}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes }),
    }),
  );
}

export interface DecideBatchResponse {
  decision: ReviewDecision;
  decided_by: string;
  decided: number;
  decided_item_ids: string[];
  failed: Array<{ item_id: string; reason: string }>;
}

export async function decideBatch(
  itemIds: string[],
  decision: ReviewDecision,
  notes?: string,
): Promise<DecideBatchResponse> {
  return json<DecideBatchResponse>(
    await authFetch('/api/admin/review-queue/decide-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_ids: itemIds, decision, notes }),
    }),
  );
}
