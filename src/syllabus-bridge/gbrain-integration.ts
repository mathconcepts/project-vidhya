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

export type PrepIntent = 'board-focused' | 'bridge' | 'entrance-focused';

/**
 * Per-intent multipliers applied to need_score by gap_class. These shape
 * which entries surface to whom:
 *
 *   board-focused    — aligned + foundation matter (textbook level).
 *                      Don't push entrance-only depth-gap stuff at them.
 *   bridge           — depth-gap and breadth-gap matter most (the actual
 *                      bridge); aligned still useful, foundation neutral.
 *   entrance-focused — depth-gap and stretch are the whole point; aligned
 *                      content is mostly noise (they know it).
 */
const INTENT_GAP_WEIGHTS: Record<PrepIntent, Record<BridgeMappingEntry['gap_class'], number>> = {
  'board-focused': {
    'aligned':     1.10,   // boost board-level reinforcement
    'depth-gap':   0.40,   // de-prioritise but don't hide
    'breadth-gap': 0.60,
    'foundation':  1.20,   // foundation explainers help anyone
  },
  'bridge': {
    'aligned':     0.90,
    'depth-gap':   1.20,   // the headline gap class for bridge mode
    'breadth-gap': 1.30,
    'foundation':  1.15,
  },
  'entrance-focused': {
    'aligned':     0.50,   // they know the basics, skip ahead
    'depth-gap':   1.30,
    'breadth-gap': 1.30,
    'foundation':  1.00,
  },
};

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
 *
 * Pass `mapping_target_exam_id` when calling from the bridge runner — this
 * lets the function look up the matching exam registration to read prep_intent
 * and add intent-specific authoring guidance to the prompt.
 */
export async function personalizePromptForStudent(
  prompt: string,
  student_id: string | null,
  options: { mapping_target_exam_id?: string } = {},
): Promise<string> {
  if (!student_id) return prompt;
  try {
    const { getOrCreateStudentModel, serializeForPrompt } = await import('../gbrain/student-model');
    const model = await getOrCreateStudentModel(student_id);
    if (!model) return prompt;
    const summary = serializeForPrompt(model);
    if (!summary.trim()) return prompt;

    // Resolve prep intent so the generated body respects the student's goal:
    // board-focused students should NOT see entrance-exam framing unless they
    // asked for it; entrance-focused students should not be drilled on
    // textbook basics they already know.
    let intent: PrepIntent = 'bridge';
    try {
      const { getProfile, derivePrepIntent } = await import('../session-planner/exam-profile-store');
      const profile = getProfile(student_id);
      const reg = options.mapping_target_exam_id
        ? profile?.exams?.find(r => r.exam_id === options.mapping_target_exam_id)
        : profile?.exams?.[0];
      if (reg) intent = derivePrepIntent(reg);
    } catch { /* keep default */ }

    const intentGuidance: Record<PrepIntent, string> = {
      'board-focused':
        '- Primary goal is the school BOARD EXAM. Stay at textbook depth. Do NOT introduce entrance-exam shortcuts, tricks, or "this comes up in JEE" framing unless the student explicitly asked for it. Examples should match textbook style.',
      'bridge':
        '- Student is preparing for BOTH board and entrance exam. Anchor the explanation in the textbook first, then expand into the entrance-exam technique. Always make the connection explicit ("you know X from your chapter Y; the entrance version of the same idea is Z").',
      'entrance-focused':
        '- Primary goal is the ENTRANCE EXAM. Skip remedial textbook coverage of basics they already know. Lead with the exam-level technique; reference textbook only as a foundation note if it materially helps.',
    };

    return `Student context (from GBrain — calibrate level + tone to match):
${summary}

Preparation intent: ${intent}
${intentGuidance[intent]}

${await buildRetentionContext(student_id)}${await buildPerformanceContext(student_id)}When you generate the content below, also keep these student signals in mind:
- If motivation is 'flagging' or 'frustrated', open with the easiest version and build confidence.
- If working memory is low, prefer 2-3 short steps over one long derivation.
- If they have prerequisite gaps, name them and bridge before introducing the new technique.
- If a concept is due for spaced review, surface it briefly before introducing new material.
- If the trajectory shows a plateau, vary the representation mode from prior content.

---

${prompt}`;
  } catch {
    return prompt;
  }
}

/**
 * Build a retention-context block for the prompt. Reports concepts that
 * are due for review (or will be soon) so the LLM can fold them into the
 * generated material — turning every generation into a retention moment.
 *
 * Empty string when the student has no tracked retention yet (cold-start),
 * so we don't pollute new-user prompts with irrelevant scaffolding.
 */
async function buildRetentionContext(student_id: string): Promise<string> {
  try {
    const { retentionSnapshot, getDueReviews } = await import('../gbrain/retention-scheduler');
    const snap = retentionSnapshot(student_id);
    if (snap.total_concepts_tracked === 0) return '';

    const dueNow = getDueReviews(student_id).slice(0, 4);
    const dueLines = dueNow.length
      ? dueNow.map(d => `  - ${d.concept_id} (${d.repetitions} prior reviews, ease ${d.ease_factor.toFixed(1)})`).join('\n')
      : '  - none right this moment';

    return `Retention status (from spaced-repetition scheduler):
  Tracked: ${snap.total_concepts_tracked} concepts · stable: ${snap.stable_concepts} · fragile: ${snap.fragile_concepts}
  Due for review now: ${snap.due_now} · within 24h: ${snap.due_in_24h} · within 7d: ${snap.due_in_7d}
  Top concepts due for review:
${dueLines}

`;
  } catch {
    return '';
  }
}

/**
 * Build a performance-trajectory block for the prompt. Surfaces patterns
 * (decline/plateau/breakthrough) so the LLM can adapt: re-encounter
 * declines, vary approach on plateaus, push forward on breakthroughs.
 */
async function buildPerformanceContext(student_id: string): Promise<string> {
  try {
    const { performanceSummary } = await import('../gbrain/performance-tracker');
    const summary = performanceSummary(student_id);
    return summary ? `${summary}\n\n` : '';
  } catch {
    return '';
  }
}

// ============================================================================
// 2. Rank bridge entries by student need
// ============================================================================

/**
 * Given a mapping, return entries sorted by how much the student needs each
 * one right now. The scoring blend:
 *
 *   raw_score  = 0.50 * (1 - avg_target_topic_mastery)   // weakness signal
 *              + 0.30 * (difficulty_jump / 5)             // gap-size signal
 *              + 0.15 * gap_class_weight                  // depth/foundation > aligned
 *              + 0.05 * motivation_modifier               // small nudge
 *
 *   need_score = raw_score * intent_multiplier_for_gap_class
 *
 * The intent multiplier is what makes the framework respect the student's
 * goal: board-focused students see aligned + foundation; entrance-focused
 * see depth + breadth; bridge mode amplifies everything bridge-related.
 *
 * Pass `intent_override` when the student explicitly switched (e.g. "show
 * me JEE-level even though I'm board-focused"); otherwise the function
 * looks up their profile.
 *
 * Returns ALL entries (not just top-N) so the caller can pick its own cutoff.
 */
export async function rankEntriesForStudent(
  mapping: BridgeMapping,
  student_id: string,
  options: { intent_override?: PrepIntent } = {},
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

  // Resolve the student's prep intent (override > profile > default 'bridge')
  let intent: PrepIntent = options.intent_override ?? 'bridge';
  if (!options.intent_override) {
    try {
      const { getProfile } = await import('../session-planner/exam-profile-store');
      const { derivePrepIntent } = await import('../session-planner/exam-profile-store');
      const profile = getProfile(student_id);
      // Find the registration whose target exam matches this mapping
      const reg = profile?.exams?.find(r => r.exam_id === mapping.target_exam_id) ?? profile?.exams?.[0];
      if (reg) intent = derivePrepIntent(reg);
    } catch {
      // Keep default
    }
  }
  const intentMultipliers = INTENT_GAP_WEIGHTS[intent];

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

    const raw_score =
      0.50 * (1 - avgMastery) +
      0.30 * (entry.difficulty_jump / 5) +
      0.15 * gapWeight[entry.gap_class] +
      0.05 * motivationBoost;

    // Clamp to [0, 1] after intent multiplier
    const need_score = Math.min(1, Math.max(0, raw_score * intentMultipliers[entry.gap_class]));

    const reasonParts: string[] = [];
    if (avgMastery < 0.4) reasonParts.push(`low mastery on ${entry.target_topic_ids.join('+')} (${Math.round(avgMastery*100)}%)`);
    else if (avgMastery < 0.7) reasonParts.push(`partial mastery on ${entry.target_topic_ids.join('+')} (${Math.round(avgMastery*100)}%)`);
    if (entry.gap_class === 'depth-gap' || entry.gap_class === 'breadth-gap') reasonParts.push(`${entry.gap_class}`);
    if (entry.difficulty_jump >= 4) reasonParts.push(`major difficulty jump`);
    // Surface the intent in the reason so the caller can show it in UI
    reasonParts.push(`${intent}`);
    const reason = reasonParts.join(' · ');

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
 *
 * `intent_override` flows down to rankEntriesForStudent. When unset, the
 * student's profile decides — board-focused students get aligned/foundation
 * heavy recs, entrance-focused get depth/breadth. When the student wants to
 * temporarily switch ("show me JEE-level even though I'm board"), pass the
 * override here.
 */
export async function recommendBridgeContent(
  student_id: string,
  mapping_id: string,
  options: { limit?: number; min_score?: number; intent_override?: PrepIntent } = {},
): Promise<PersonalizedRecommendation[]> {
  const mapping = getMapping(mapping_id);
  if (!mapping) return [];

  const ranked = await rankEntriesForStudent(mapping, student_id, {
    intent_override: options.intent_override,
  });
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
