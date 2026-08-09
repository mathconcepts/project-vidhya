/**
 * src/resonance/types.ts
 *
 * Resonance Score v1 types (Track E2).
 *
 * resonance_v1 formula (locked — future changes land as resonance_v2):
 *   0.30 · completion_rate
 * + 0.20 · dwell_fit
 * + 0.20 · (1 − regen_abandon_rate)
 * + 0.15 · rating_score
 * + 0.15 · mastery_share
 *
 * Shadow mode: computed but never surfaced to students until
 *   >= 2 weeks of data AND >= 500 scored turns in the cohort.
 * k-anon floor: score is null (insufficient_n) when n < 30.
 *
 * Surveillance invariants:
 * - No per-student rows — only per-atom aggregates
 * - No behavioral fields that identify individuals
 * - rating_score from aggregate counts only (never raw student ids)
 */

export interface ResonanceComponents {
  completion_rate: number;    // 0–1: fraction of sessions where atom was seen and not skipped
  dwell_fit: number;          // 0–1: dwell time vs estimated read time (clipped to 0–1)
  regen_abandon_rate: number; // 0–1: fraction who hit "regen" then abandoned session
  rating_score: number;       // 0–1: normalised from (-1/+1 ratings) to [0, 1]
  mastery_share: number;      // 0–1: fraction who showed mastery gain in follow-up sessions
}

export interface ResonanceScore {
  atom_id: string;
  version_n: number;
  cohort_key: string;
  window_days: number;
  resonance_v1: number | null;  // null = insufficient_n (n < 30)
  n: number;
  components: ResonanceComponents | null;
  shadow_mode: boolean;
  computed_at: string;
}

export interface AtomRatingEvent {
  atom_id: string;
  student_id: string;
  session_id?: string;
  rating: 1 | -1;             // 1 = Helped, -1 = Didn't help
  rated_at?: string;
}

export type ResonanceSuggestionKind =
  | 'rewrite_low_resonance'   // resonance_v1 < 0.35 and n >= 30
  | 'modality_mismatch'       // completion_rate low, dwell_fit high → wrong modality
  | 'pattern_win';            // resonance_v1 >= 0.75 → promote pattern

export interface ResonanceSuggestion {
  kind: ResonanceSuggestionKind;
  atom_id: string;
  resonance_v1: number;
  n: number;
  rationale: string;
}

// Shadow mode exit criterion
export interface ShadowModeStatus {
  active: boolean;
  weeks_of_data: number;
  total_scored_turns: number;
  exit_criterion_met: boolean; // >= 2 weeks AND >= 500 scored turns
}
