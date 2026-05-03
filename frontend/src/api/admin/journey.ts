/**
 * frontend/src/api/admin/journey.ts
 *
 * Typed client for the admin journey progress endpoint.
 */

import { authFetch } from '@/lib/auth/client';

export type MilestoneId =
  | 'exam_pack' | 'rulesets' | 'blueprint' | 'approve_blueprint'
  | 'persona_scenario' | 'generation_run' | 'first_student' | 'first_signal';

export type MilestoneStatus = 'done' | 'next' | 'pending';

export interface Milestone {
  id: MilestoneId;
  status: MilestoneStatus;
  count: number;
  threshold: number;
  label: string;
  description: string;
  cta_label: string;
  cta_href: string;
  doc_link: string;
}

export interface ProgressResponse {
  milestones: Milestone[];
  done_count: number;
  next_id: MilestoneId | null;
  generated_at: string;
  cached: boolean;
}

export async function getJourneyProgress(opts: { refresh?: boolean } = {}): Promise<ProgressResponse> {
  const url = opts.refresh ? '/api/admin/journey/progress?refresh=1' : '/api/admin/journey/progress';
  const r = await authFetch(url);
  if (!r.ok) throw new Error(`journey progress failed: ${r.status}`);
  return r.json();
}
