// @ts-nocheck
/**
 * GBrain Integration Bridge
 *
 * The missing connection layer between GBrain (the 6-pillar cognitive system)
 * and the newer frameworks (Lesson v2.5, Curriculum v2.6, Multimodal v2.3-2.4,
 * Roles v2.8).
 *
 * BEFORE THIS MODULE: GBrain lived beside the newer frameworks. The Lesson
 * personalizer accepted a StudentSnapshot but nothing populated it with real
 * cognitive data. The Curriculum quality aggregator only saw engagement
 * signals, not error taxonomy. Multimodal diagnostic skipped the task
 * reasoner entirely. Teachers had no way to see their students' GBrain
 * profiles.
 *
 * AFTER THIS MODULE: One source of cognitive truth flows to every consumer.
 *
 * Architectural rules:
 *   1. This module READS from GBrain — it does NOT write
 *   2. Translation functions are pure (no I/O) wherever possible
 *   3. Graceful degradation: if GBrain is unavailable, consumers get empty
 *      snapshots that behave identically to v2.5/v2.6 before the bridge
 *   4. The bridge DOES NOT break any existing API — consumers can opt in
 */

import type {
  StudentModel,
  MasteryEntry,
} from './student-model';
import type { StudentSnapshot } from '../lessons/types';
import type { QualitySignal } from '../curriculum/types';

// ============================================================================
// 1. Student Model → Lesson StudentSnapshot
// ============================================================================

/**
 * Translate the full StudentModel into the minimal StudentSnapshot the
 * Lesson personalizer needs. Privacy-filtered — drops emotional state,
 * exam strategy, and representation mode unless explicitly requested.
 */
export function modelToLessonSnapshot(
  model: StudentModel | null,
  options: { include_emotional?: boolean } = {},
): StudentSnapshot {
  if (!model) return {};

  const mastery_by_concept: Record<string, number> = {};
  const mastery_by_topic: Record<string, number> = {};
  const topicSums: Record<string, { total: number; count: number }> = {};

  for (const [concept_id, entry] of Object.entries(model.mastery_vector)) {
    mastery_by_concept[concept_id] = entry.score;
  }

  const recent_errors = (model.prerequisite_alerts || []).slice(0, 10).map(a => ({
    concept_id: a.concept,
    error_type: a.severity,
  }));

  const snapshot: StudentSnapshot = {
    session_id: model.session_id,
    mastery_by_concept,
    mastery_by_topic,
    recent_errors,
  };

  // Optional: include emotional state (personalizer can adjust tone)
  if (options.include_emotional && model.motivation_state) {
    (snapshot as any).motivation_state = model.motivation_state;
  }

  return snapshot;
}

// ============================================================================
// 2. Error Taxonomy → Quality Signal
// ============================================================================

/**
 * Translate a GBrain error observation into a Curriculum quality signal.
 * Used when a student gets a worked_example / micro_exercise wrong —
 * GBrain's classifier identifies the error type, and we record a
 * 'skipped' signal against common_traps to flag that the current trap
 * content isn't preventing the misconception.
 */
export function errorToQualitySignal(params: {
  concept_id: string;
  error_type: string;
  session_id?: string;
  timestamp?: string;
}): QualitySignal {
  return {
    concept_id: params.concept_id,
    component_kind: 'common_traps',
    event: 'skipped',  // the trap content didn't prevent the error
    timestamp: params.timestamp || new Date().toISOString(),
    session_id: params.session_id,
  };
}

// ============================================================================
// 3. Mastery-weighted concept prioritization
// ============================================================================

/**
 * Given a set of concept IDs and a student model, return them sorted by
 * "worst mastery first" — used by the syllabus generator and diagnostic
 * analyzer to prioritize study time.
 */
export function prioritizeConceptsByMastery(
  concept_ids: string[],
  model: StudentModel | null,
): Array<{ concept_id: string; mastery: number }> {
  const DEFAULT_MASTERY = 0.3;
  const scored = concept_ids.map(id => {
    const entry: MasteryEntry | undefined = model?.mastery_vector[id];
    return {
      concept_id: id,
      mastery: entry?.score ?? DEFAULT_MASTERY,
    };
  });
  scored.sort((a, b) => a.mastery - b.mastery);
  return scored;
}

/**
 * Inverse of the above — concepts the student has nearly mastered,
 * used for confidence-building "quick win" recommendations.
 */
export function findNearMasteryConcepts(
  concept_ids: string[],
  model: StudentModel | null,
  threshold: { min: number; max: number } = { min: 0.55, max: 0.75 },
): string[] {
  if (!model) return [];
  return concept_ids.filter(id => {
    const m = model.mastery_vector[id]?.score ?? 0;
    return m >= threshold.min && m <= threshold.max;
  });
}

// ============================================================================
// 4. Concept-level cognitive hints — used by Lesson composer
// ============================================================================

/**
 * Derive presentation hints for a concept × student. Used by the Lesson
 * composer to decide:
 *   - Whether to show the formal statement upfront or hide behind "advanced"
 *   - Whether to use algebraic or geometric framing
 *   - How many worked examples to include
 *   - Whether to emphasize common traps
 */
export interface ConceptHints {
  /** If true, composer should open with intuition, not definition */
  prefer_intuition_first: boolean;
  /** Preferred representation for examples */
  representation_mode: 'algebraic' | 'geometric' | 'numerical' | 'balanced';
  /** How many worked examples to include (1 = quick, 3 = deep) */
  worked_example_count: number;
  /** If true, surface common_traps prominently (student's seen this trap before) */
  emphasize_traps: boolean;
  /** If true, hide formal_statement behind a "see formal version" reveal */
  collapse_formal: boolean;
  /** Confidence flag for UI: can boost self-esteem with a "you've almost got this" */
  near_mastery_hint: boolean;
}

export function deriveConceptHints(
  concept_id: string,
  model: StudentModel | null,
): ConceptHints {
  // Sensible defaults for an anonymous or brand-new student
  if (!model) {
    return {
      prefer_intuition_first: true,
      representation_mode: 'balanced',
      worked_example_count: 2,
      emphasize_traps: false,
      collapse_formal: false,
      near_mastery_hint: false,
    };
  }

  const entry = model.mastery_vector[concept_id];
  const mastery = entry?.score ?? 0.3;
  const attempts = entry?.attempts ?? 0;

  // Has the student hit errors on this concept recently?
  const alertsForConcept = (model.prerequisite_alerts || []).filter(
    a => a.concept === concept_id
  );
  const hasRecentErrors = alertsForConcept.length > 0;

  return {
    // Low abstraction comfort → intuition-first; high → straight to definition
    prefer_intuition_first: (model.abstraction_comfort ?? 0.5) < 0.7,
    representation_mode: model.representation_mode || 'balanced',
    // More examples for low-mastery + high-attempt-but-still-struggling concepts
    worked_example_count:
      mastery < 0.4 ? 3 :
      (mastery < 0.7 || hasRecentErrors) ? 2 : 1,
    emphasize_traps: hasRecentErrors || mastery < 0.5,
    // Collapse formal statement for students who prefer intuition-first
    collapse_formal: (model.abstraction_comfort ?? 0.5) < 0.55,
    near_mastery_hint: mastery >= 0.55 && mastery < 0.75,
  };
}

// ============================================================================
// 5. Teacher dashboard digest — student model → compact roster entry
// ============================================================================

/**
 * Compact summary a teacher sees in their roster. Intentionally limited
 * to non-sensitive aggregates — no raw error logs, no emotional state
 * detail. Teacher sees overall health, can drill into a student's
 * profile via a separate endpoint (with explicit permission).
 */
export interface TeacherRosterEntry {
  student_id: string;
  overall_mastery: number;
  concepts_mastered: number;
  concepts_in_progress: number;
  concepts_struggling: number;
  total_attempts: number;
  needs_attention: boolean;
  attention_reason: string | null;
  last_active_at: string | null;
}

export function modelToTeacherRosterEntry(
  student_id: string,
  model: StudentModel | null,
): TeacherRosterEntry {
  if (!model) {
    return {
      student_id,
      overall_mastery: 0,
      concepts_mastered: 0,
      concepts_in_progress: 0,
      concepts_struggling: 0,
      total_attempts: 0,
      needs_attention: false,
      attention_reason: null,
      last_active_at: null,
    };
  }

  const entries = Object.values(model.mastery_vector);
  const total_attempts = entries.reduce((s, e) => s + e.attempts, 0);
  const overall_mastery = entries.length > 0
    ? entries.reduce((s, e) => s + e.score, 0) / entries.length
    : 0;

  const mastered = entries.filter(e => e.score >= 0.8).length;
  const in_progress = entries.filter(e => e.score >= 0.4 && e.score < 0.8).length;
  const struggling = entries.filter(e => e.score < 0.4 && e.attempts >= 3).length;

  let needs_attention = false;
  let attention_reason: string | null = null;

  if (model.consecutive_failures >= 5) {
    needs_attention = true;
    attention_reason = `${model.consecutive_failures} consecutive struggles`;
  } else if (model.motivation_state === 'frustrated' || model.motivation_state === 'anxious') {
    needs_attention = true;
    attention_reason = `emotional state: ${model.motivation_state}`;
  } else if (struggling >= 5) {
    needs_attention = true;
    attention_reason = `${struggling} concepts below 40% mastery`;
  }

  // Try to find last update across mastery entries
  const last_active_at = entries
    .map(e => e.last_update)
    .filter(Boolean)
    .sort()
    .pop() || null;

  return {
    student_id,
    overall_mastery: Math.round(overall_mastery * 100) / 100,
    concepts_mastered: mastered,
    concepts_in_progress: in_progress,
    concepts_struggling: struggling,
    total_attempts,
    needs_attention,
    attention_reason,
    last_active_at,
  };
}

// ============================================================================
// 6. Admin quality dashboard — cohort-level cognitive summary
// ============================================================================

export interface CohortSummary {
  total_students: number;
  avg_mastery: number;
  struggling_concepts: Array<{ concept_id: string; students_affected: number; avg_mastery: number }>;
  frustrated_count: number;
  anxious_count: number;
  flagged_for_teacher_attention: number;
}

export function summarizeCohort(models: (StudentModel | null)[]): CohortSummary {
  const valid = models.filter(m => m !== null) as StudentModel[];
  const n = valid.length;
  if (n === 0) {
    return {
      total_students: 0,
      avg_mastery: 0,
      struggling_concepts: [],
      frustrated_count: 0,
      anxious_count: 0,
      flagged_for_teacher_attention: 0,
    };
  }

  const perConcept: Record<string, { sum: number; count: number }> = {};
  let totalMasterySum = 0;
  let totalMasteryCount = 0;
  let frustrated = 0;
  let anxious = 0;
  let needsAttention = 0;

  for (const m of valid) {
    if (m.motivation_state === 'frustrated') frustrated++;
    if (m.motivation_state === 'anxious') anxious++;
    if (m.consecutive_failures >= 5) needsAttention++;
    for (const [cid, entry] of Object.entries(m.mastery_vector)) {
      if (!perConcept[cid]) perConcept[cid] = { sum: 0, count: 0 };
      perConcept[cid].sum += entry.score;
      perConcept[cid].count += 1;
      totalMasterySum += entry.score;
      totalMasteryCount += 1;
    }
  }

  const struggling = Object.entries(perConcept)
    .map(([concept_id, stats]) => ({
      concept_id,
      students_affected: stats.count,
      avg_mastery: Math.round((stats.sum / stats.count) * 100) / 100,
    }))
    .filter(c => c.avg_mastery < 0.45 && c.students_affected >= 3)
    .sort((a, b) => a.avg_mastery - b.avg_mastery)
    .slice(0, 20);

  return {
    total_students: n,
    avg_mastery: totalMasteryCount > 0 ? Math.round((totalMasterySum / totalMasteryCount) * 100) / 100 : 0,
    struggling_concepts: struggling,
    frustrated_count: frustrated,
    anxious_count: anxious,
    flagged_for_teacher_attention: needsAttention,
  };
}

// ============================================================================
// 7. Diagnostic result → GBrain attempt record
// ============================================================================

/**
 * Translates the multimodal diagnostic output (per-problem verdicts from
 * a mock test photo) into a stream of GBrain attempts that would update
 * the student model. Called from the multimodal diagnostic handler
 * after the analysis streams complete.
 */
export interface DiagnosticVerdict {
  problem_id: string;
  concept_id: string | null;
  correct: boolean;
  time_ms?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  error_type?: string;
}

export interface GBrainAttemptInput {
  session_id: string;
  concept_id: string;
  correct: boolean;
  time_ms?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  error_type?: string;
  source: 'diagnostic' | 'practice' | 'lesson' | 'chat';
}

export function diagnosticToAttempts(
  session_id: string,
  verdicts: DiagnosticVerdict[],
): GBrainAttemptInput[] {
  return verdicts
    .filter(v => v.concept_id !== null)
    .map(v => ({
      session_id,
      concept_id: v.concept_id!,
      correct: v.correct,
      time_ms: v.time_ms,
      difficulty: v.difficulty,
      error_type: v.error_type,
      source: 'diagnostic' as const,
    }));
}
