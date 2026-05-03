import { authFetch } from '@/lib/auth/client';

export interface PresetSummary {
  id: string;
  name: string;
  exam_pack_id: string;
  description: string;
  cohort_hint: string;
  ruleset_count: number;
  blueprint_count: number;
}

export interface InstallResult {
  preset_id: string;
  rulesets_created: string[];
  rulesets_skipped: number;
  blueprints_created: string[];
  blueprints_skipped: number;
}

export async function listPresets(): Promise<PresetSummary[]> {
  const r = await authFetch('/api/admin/presets');
  if (!r.ok) throw new Error(`presets failed: ${r.status}`);
  const body = (await r.json()) as { presets: PresetSummary[] };
  return body.presets;
}

export async function installPreset(id: string): Promise<InstallResult> {
  const r = await authFetch(`/api/admin/presets/${encodeURIComponent(id)}/install`, { method: 'POST' });
  if (r.status === 503) throw new Error('Database not configured. Presets need a DB to install rulesets + blueprints.');
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error((body as any).error ?? `install failed: ${r.status}`);
  }
  return r.json();
}
