import { authFetch } from '@/lib/auth/client';

export interface BlueprintRuleset {
  id: string;
  exam_pack_id: string;
  concept_pattern: string;
  rule_text: string;
  enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function listRulesets(exam?: string): Promise<BlueprintRuleset[]> {
  const q = exam ? `?exam=${encodeURIComponent(exam)}` : '';
  const r = await authFetch(`/api/admin/rulesets${q}`);
  if (!r.ok) throw new Error(`list failed: ${r.status}`);
  const body = (await r.json()) as { rulesets: BlueprintRuleset[] };
  return body.rulesets;
}

export async function createRuleset(input: {
  exam_pack_id: string;
  concept_pattern?: string;
  rule_text: string;
}): Promise<BlueprintRuleset> {
  const r = await authFetch('/api/admin/rulesets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.error ?? `create failed: ${r.status}`);
  }
  const body = (await r.json()) as { ruleset: BlueprintRuleset };
  return body.ruleset;
}

export async function setRulesetEnabled(id: string, enabled: boolean): Promise<BlueprintRuleset> {
  const r = await authFetch(`/api/admin/rulesets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!r.ok) throw new Error(`patch failed: ${r.status}`);
  const body = (await r.json()) as { ruleset: BlueprintRuleset };
  return body.ruleset;
}

export async function deleteRuleset(id: string): Promise<void> {
  const r = await authFetch(`/api/admin/rulesets/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`delete failed: ${r.status}`);
}
