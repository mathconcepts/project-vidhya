/**
 * Typed client for /api/admin/blueprints. Mirrors the locked v1 shape;
 * keep in sync with src/blueprints/types.ts.
 */

import { authFetch } from '@/lib/auth/client';

export type AtomKind =
  | 'visual_analogy' | 'manipulable' | 'simulation' | 'guided_walkthrough'
  | 'mcq' | 'free_text' | 'worked_example' | 'pyq_anchor';

export type StageKind =
  | 'intuition' | 'discovery' | 'formalism' | 'worked_example' | 'practice' | 'pyq_anchor';

export type DifficultyLabel = 'easy' | 'medium' | 'hard';

export interface BlueprintStage {
  id: StageKind;
  atom_kind: AtomKind;
  count?: number;
  difficulty_mix?: { easy: number; medium: number; hard: number };
  rationale_id: string;
  rationale_note?: string;
}

export interface BlueprintConstraint {
  id: string;
  source: 'template' | 'arbitrator' | 'operator' | 'ruleset';
  note?: string;
}

export interface BlueprintDecisions {
  version: 1;
  metadata: { concept_id: string; exam_pack_id: string; target_difficulty: DifficultyLabel };
  stages: BlueprintStage[];
  constraints: BlueprintConstraint[];
}

export interface ContentBlueprint {
  id: string;
  exam_pack_id: string;
  concept_id: string;
  template_version: string | null;
  arbitrator_version: string | null;
  decisions: BlueprintDecisions;
  confidence: number;
  requires_review: boolean;
  created_by: 'template' | 'arbitrator' | 'operator';
  approved_at: string | null;
  approved_by: string | null;
  superseded_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function listBlueprints(filter: {
  exam?: string;
  concept?: string;
  requires_review?: boolean;
} = {}): Promise<ContentBlueprint[]> {
  const q = new URLSearchParams();
  if (filter.exam) q.set('exam', filter.exam);
  if (filter.concept) q.set('concept', filter.concept);
  if (filter.requires_review !== undefined) q.set('requires_review', String(filter.requires_review));
  const r = await authFetch(`/api/admin/blueprints?${q}`);
  if (!r.ok) throw new Error(`list failed: ${r.status}`);
  const body = (await r.json()) as { blueprints: ContentBlueprint[] };
  return body.blueprints;
}

export async function getBlueprint(id: string): Promise<{ blueprint: ContentBlueprint; etag: string }> {
  const r = await authFetch(`/api/admin/blueprints/${encodeURIComponent(id)}`);
  if (!r.ok) throw new Error(`read failed: ${r.status}`);
  const etag = r.headers.get('ETag') ?? '';
  const body = (await r.json()) as { blueprint: ContentBlueprint };
  return { blueprint: body.blueprint, etag };
}

export async function createBlueprintFromTemplate(input: {
  concept_id: string;
  exam_pack_id: string;
  target_difficulty: DifficultyLabel;
  topic_family?: string;
  requires_pyq_anchor?: boolean;
  use_arbitrator?: boolean;
}): Promise<ContentBlueprint> {
  const r = await authFetch('/api/admin/blueprints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.error ?? `create failed: ${r.status}`);
  }
  const body = (await r.json()) as { blueprint: ContentBlueprint };
  return body.blueprint;
}

export async function patchBlueprint(
  id: string,
  etag: string,
  patch: { decisions?: BlueprintDecisions; requires_review?: boolean },
): Promise<{ kind: 'ok'; blueprint: ContentBlueprint } | { kind: 'conflict'; current: ContentBlueprint }> {
  const r = await authFetch(`/api/admin/blueprints/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'If-Match': etag },
    body: JSON.stringify(patch),
  });
  if (r.status === 409) {
    const body = (await r.json()) as { current: ContentBlueprint };
    return { kind: 'conflict', current: body.current };
  }
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.error ?? `patch failed: ${r.status}`);
  }
  const body = (await r.json()) as { blueprint: ContentBlueprint };
  return { kind: 'ok', blueprint: body.blueprint };
}

export async function approveBlueprint(id: string, etag: string): Promise<ContentBlueprint> {
  const r = await authFetch(`/api/admin/blueprints/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: { 'If-Match': etag },
  });
  if (!r.ok) throw new Error(`approve failed: ${r.status}`);
  const body = (await r.json()) as { blueprint: ContentBlueprint };
  return body.blueprint;
}
