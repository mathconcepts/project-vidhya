/**
 * Syllabus Bridge × GBrain integration.
 *
 * Connects the bridge framework to GBrain's student model + exam context so
 * the same TN -> JEE pack adapts per student and per cohort.
 *
 * Four capabilities:
 *
 *   1. personalizePromptForStudent(prompt, student_id)
 *      Enriches a generation prompt with the student's mastery, motivation,
 *      and error patterns. Used by the batch runner when 'for_student_id' is
 *      passed — same template, calibrated body.
 *
 *   2. rankEntriesForStudent(mapping, student_id)
 *      Ranks bridge entries by how much the student needs them right now.
 *      Used by the student-facing recommendation endpoint AND by the admin
 *      'Smart batch' button to prioritise high-leverage content.
 *
 *   3. cohortGapReport(student_ids, mapping)
 *      Aggregates a cohort's mastery against bridge entries. For teachers:
 *      "12 of your 18 students are stuck at conics.parabola JEE depth."
 *
 *   4. recommendBridgeContent(student_id, mapping)
 *      Returns ready-to-serve content units the student should see next,
 *      derived from rankEntriesForStudent + the generated-content store.
 */

import type {
  BridgeMapping, BridgeMappingEntry, GeneratedContent,
} from './types';
import { getMapping, getConcept } from './registry';
import { listGeneratedContentForMapping } from './store';

// ============================================================================
// Types
// ============================================================================

export interface RankedEntry {
  entry: BridgeMappingEntry;
  /**
   * Need-score 0.0-1.0. Higher = student would benefit most.
   * Blended from: low mastery on target topics, high difficulty jump,
   * prerequisite gaps, motivation state.
   */
  need_score: number;
  /** Per-target-topic mastery snapshot (0-1) used to compute the score. */
  target_mastery: Record<string, number>;
  /** Free-form reason shown in UI ("low calculus mastery + depth gap"). */
  reason: string;
}

export interface CohortGapStat {
  entry_id: string;
  gap_class: BridgeMappingEntry['gap_class'];
  /** Number of cohort students with avg target-topic mastery < 0.4 */
  students_struggling: number;
  /** Cohort size used */
  cohort_size: number;
  /** Avg target-topic mastery across the cohort (0-1) */
  cohort_avg_mastery: number;
  /** Suggested action for the teacher */
  recommended_action: string;
}

export interface PersonalizedRecommendation {
  entry_id: string;
  need_score: number;
  reason: string;
  /** Content units already generated for this entry (may be empty) */
  ready_content: GeneratedContent[];
  /** If empty, admin needs to generate first */
  needs_generation: boolean;
}

// ============================================================================
// 1. Personalize a prompt using GBrain student model
// ============================================================================

/**
 * Returns the original prompt with a GBrain-derived student-context block
 * prepended. If the student model is unavailable (anonymous run, missing
 * gbrain key, store error), returns the prompt unchanged.
 */
export async function personalizePromptForStudent(
  prompt: string,
  student_id: string | null,
): Promise<string> {
  if (!student_id) return prompt;
  try {
    const { getOrCreateStudentModel, serializeForPrompt } = await import('../gbrain/student-model');
    const model = await getOrCreateStudentModel(student_id);
    if (!model) return prompt;
    const summary = serializeForPrompt(model);
    if (!summary.trim()) return prompt;

    return `Student context (from GBrain — calibrate level + tone to match):
${summary}

When you generate the content below, keep these student signals in mind:
- If motivation is 'flagging' or 'frustrated', open with the easiest version and build confidence.
- If working memory is low, prefer 2-3 short steps over one long derivation.
- If they have prerequisite gaps, name them and bridge before introducing the new technique.

---

${prompt}`;
  } catch {
    return prompt;
  }
}

// ============================================================================
// 2. Rank bridge entries by student need
// ============================================================================

/**
 * Given a mapping, return entries sorted by how much the student needs each
 * one right now. The scoring blend:
 *
 *   need_score = 0.50 * (1 - avg_target_topic_mastery)   // weakness signal
 *              + 0.30 * (difficulty_jump / 5)             // gap-size signal
 *              + 0.15 * gap_class_weight                  // depth/foundation > aligned
 *              + 0.05 * motivation_modifier               // small nudge
 *
 * Returns ALL entries (not just top-N) so the caller can pick its own cutoff.
 */
export async function rankEntriesForStudent(
  mapping: BridgeMapping,
  student_id: string,
): Promise<RankedEntry[]> {
  let mastery: Record<string, number> = {};
  let motivationBoost = 0;

  try {
    const { getOrCreateStudentModel, getMasterySummary } = await import('../gbrain/student-model');
    const model = await getOrCreateStudentModel(student_id);
    if (model) {
      mastery = getMasterySummary(model);
      if (model.motivation_state === 'flagging' || model.motivation_state === 'frustrated') {
        motivationBoost = 0.05;
      }
    }
  } catch {
    // No GBrain model — score from mapping structure alone
  }

  const gapWeight: Record<BridgeMappingEntry['gap_class'], number> = {
    'aligned':     0.20,
    'depth-gap':   0.65,
    'breadth-gap': 0.80,
    'foundation':  1.00,
  };

  const ranked: RankedEntry[] = [];

  for (const entry of mapping.entries) {
    if (entry.target_topic_ids.length === 0) continue; // notes-only entries

    // Average mastery across the target topics (default to 0 if unknown)
    const target_mastery: Record<string, number> = {};
    let masterySum = 0;
    let masteryN = 0;
    for (const tid of entry.target_topic_ids) {
      const m = mastery[tid] ?? 0;
      target_mastery[tid] = m;
      masterySum += m;
      masteryN += 1;
    }
    const avgMastery = masteryN > 0 ? masterySum / masteryN : 0;

    const need_score =
      0.50 * (1 - avgMastery) +
      0.30 * (entry.difficulty_jump / 5) +
      0.15 * gapWeight[entry.gap_class] +
      0.05 * motivationBoost;

    const reasonParts: string[] = [];
    if (avgMastery < 0.4) reasonParts.push(`low mastery on ${entry.target_topic_ids.join('+')} (${Math.round(avgMastery*100)}%)`);
    else if (avgMastery < 0.7) reasonParts.push(`partial mastery on ${entry.target_topic_ids.join('+')} (${Math.round(avgMastery*100)}%)`);
    if (entry.gap_class === 'depth-gap' || entry.gap_class === 'breadth-gap') reasonParts.push(`${entry.gap_class}`);
    if (entry.difficulty_jump >= 4) reasonParts.push(`major difficulty jump`);
    const reason = reasonParts.length ? reasonParts.join(' · ') : 'aligned with current pace';

    ranked.push({ entry, need_score, target_mastery, reason });
  }

  return ranked.sort((a, b) => b.need_score - a.need_score);
}

// ============================================================================
// 3. Cohort gap report — for teachers
// ============================================================================

/**
 * Aggregate mastery across a cohort to surface "where is the class stuck".
 * Loads each student's model once and computes per-entry stats.
 *
 * Truncated to top-15 entries by struggle volume to keep the teacher view
 * scannable; the full list is one click away in the admin UI.
 */
export async function cohortGapReport(
  student_ids: string[],
  mapping: BridgeMapping,
): Promise<CohortGapStat[]> {
  if (student_ids.length === 0) return [];

  // Load all student models in parallel — quick because flat-file
  let allMastery: Record<string, number>[] = [];
  try {
    const { getOrCreateStudentModel, getMasterySummary } = await import('../gbrain/student-model');
    const models = await Promise.all(student_ids.map(id => getOrCreateStudentModel(id).catch(() => null)));
    allMastery = models.map(m => m ? getMasterySummary(m) : {});
  } catch {
    allMastery = student_ids.map(() => ({}));
  }

  const stats: CohortGapStat[] = [];

  for (const entry of mapping.entries) {
    if (entry.target_topic_ids.length === 0) continue;

    let strugglingCount = 0;
    let masterySum = 0;
    let masteryN = 0;

    for (const studentMastery of allMastery) {
      // Average this student's mastery across the entry's target topics
      let s = 0; let n = 0;
      for (const tid of entry.target_topic_ids) {
        if (tid in studentMastery) { s += studentMastery[tid]; n += 1; }
      }
      const avgForStudent = n > 0 ? s / n : 0;
      if (avgForStudent < 0.4) strugglingCount += 1;
      masterySum += avgForStudent;
      masteryN += 1;
    }

    const cohort_avg_mastery = masteryN > 0 ? masterySum / masteryN : 0;
    const ratio = strugglingCount / student_ids.length;

    let recommended_action: string;
    if (ratio > 0.6) recommended_action = 'Run a class session — most students need this.';
    else if (ratio > 0.3) recommended_action = 'Assign as homework — about a third of the class is stuck.';
    else if (ratio > 0.1) recommended_action = 'Light-touch follow-up — a few students still need help.';
    else recommended_action = 'Cohort is on track here.';

    stats.push({
      entry_id: entry.id,
      gap_class: entry.gap_class,
      students_struggling: strugglingCount,
      cohort_size: student_ids.length,
      cohort_avg_mastery,
      recommended_action,
    });
  }

  return stats
    .sort((a, b) => b.students_struggling - a.students_struggling)
    .slice(0, 15);
}

// ============================================================================
// 4. Recommend already-generated content to a student
// ============================================================================

/**
 * Combine the ranked entry list with the content store: return entries the
 * student needs most, paired with the content units already generated for
 * them. Caller can decide whether to render `ready_content` or ask the admin
 * to generate first.
 */
export async function recommendBridgeContent(
  student_id: string,
  mapping_id: string,
  options: { limit?: number; min_score?: number } = {},
): Promise<PersonalizedRecommendation[]> {
  const mapping = getMapping(mapping_id);
  if (!mapping) return [];

  const ranked = await rankEntriesForStudent(mapping, student_id);
  const minScore = options.min_score ?? 0.35;
  const limit = options.limit ?? 5;

  const allContent = listGeneratedContentForMapping(mapping_id);
  const contentByEntry = new Map<string, GeneratedContent[]>();
  for (const c of allContent) {
    const list = contentByEntry.get(c.mapping_entry_id) ?? [];
    list.push(c);
    contentByEntry.set(c.mapping_entry_id, list);
  }

  const recs: PersonalizedRecommendation[] = [];
  for (const r of ranked) {
    if (r.need_score < minScore) continue;
    const ready_content = contentByEntry.get(r.entry.id) ?? [];
    recs.push({
      entry_id: r.entry.id,
      need_score: r.need_score,
      reason: r.reason,
      ready_content,
      needs_generation: ready_content.length === 0,
    });
    if (recs.length >= limit) break;
  }

  return recs;
}
