import { authFetch } from '@/lib/auth/client';

export interface ExamPackRow {
  id: string;
  name: string;
  source: 'yaml' | 'operator';
  interactives_enabled: boolean;
  status: 'active' | 'archived';
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

/**
 * Canonical YAML packs that ship in the repo. These live in
 * `data/curriculum/*.yml` and are loaded by `src/curriculum/exam-loader.ts`.
 * We list them here so the admin page is never empty even on fresh
 * deploys with no operator packs in the DB.
 */
export const CANONICAL_PACKS: ReadonlyArray<ExamPackRow> = [
  {
    id: 'jee-main',
    name: 'JEE Main',
    source: 'yaml',
    interactives_enabled: true,
    status: 'active',
  },
  {
    id: 'gate-ma',
    name: 'GATE Mathematics',
    source: 'yaml',
    interactives_enabled: true,
    status: 'active',
  },
];

export async function listExamPacks(): Promise<ExamPackRow[]> {
  try {
    const r = await authFetch('/api/admin/exam-packs');
    if (r.status === 503) return [];
    if (!r.ok) throw new Error(`list failed: ${r.status}`);
    const body = (await r.json()) as { packs: ExamPackRow[] };
    return body.packs ?? [];
  } catch {
    return [];
  }
}
