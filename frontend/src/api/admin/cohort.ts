import { authFetch } from '@/lib/auth/client';

export type AttentionReason = 'frequent_regen' | 'declining_mastery' | 'frustrated_or_flagging';

export interface AttentionCard {
  session_id: string;
  motivation_state: string | null;
  mastery_trajectory_14d: number;
  recent_regen_count: number;
  reasons: AttentionReason[];
}

export interface CohortAttentionResponse {
  exam_pack_id: string;
  generated_at: string;
  needs_attention: AttentionCard[];
  on_track: {
    total_active_students: number;
    mastered_this_week: number;
    progressing_normally: number;
  };
  cap_reached: boolean;
}

export async function getCohortAttention(exam_pack_id = 'jee-main'): Promise<CohortAttentionResponse> {
  const r = await authFetch(`/api/admin/cohort/attention?exam_pack_id=${encodeURIComponent(exam_pack_id)}`);
  if (!r.ok) throw new Error(`cohort attention failed: ${r.status}`);
  return r.json();
}
