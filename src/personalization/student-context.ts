/**
 * src/personalization/student-context.ts
 *
 * Phase B of personalization plan: assemble a STUDENT CONTEXT payload
 * from gbrain that the concept-orchestrator threads into LLM prompts
 * so generated atoms are calibrated to one specific student.
 *
 * This is the difference between "this student's variant of an atom"
 * (today's reactive regen — same prompt, different text seed) and
 * "an atom that was actually generated FOR THIS STUDENT" (Phase B —
 * prompt includes their representation_mode + recent misconceptions +
 * motivation state).
 *
 * SURVEILLANCE-CLIFF DISCIPLINE (eng-review locked):
 *   1. The context is built ON DEMAND from existing tables — no new
 *      "student_context_*" or "personalized_log_*" persistence.
 *   2. The context's content is internal to the LLM call. The student
 *      never sees a sentence that references it ("we noticed you
 *      struggled with X").
 *   3. The LLM-prompt formatter (toPromptText below) is the SOLE
 *      boundary where context fields cross into externally-visible
 *      bytes. Any new field added here must add a CI test that the
 *      prompt's output, when grepped at the lesson-serving boundary,
 *      doesn't surface the raw context.
 *
 * DB-less safe: returns the empty/neutral context when DATABASE_URL
 * is unset.
 */

import pg from 'pg';

const { Pool } = pg;
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _pool;
}

// ============================================================================
// Public types
// ============================================================================

export type RepresentationMode = 'algebraic' | 'geometric' | 'numerical' | 'balanced';

export type MotivationState =
  | 'driven'
  | 'steady'
  | 'flagging'
  | 'frustrated'
  | 'anxious';

/**
 * Full payload threaded into LLM prompts. Populated from existing gbrain
 * tables (student_model + error_log + atom_engagements). NEVER persisted.
 *
 * The "neutral" shape (every field default) is used when student_id is
 * unknown / anonymous / DB-less. A neutral payload is the same as today's
 * generic-atom prompt — Phase B is additive over current behaviour.
 */
export interface StudentContext {
  /** From student_model.representation_mode. */
  representation_mode: RepresentationMode;
  /** From student_model.motivation_state. Drives tone/pace hints. */
  motivation_state: MotivationState;
  /** From student_model.mastery_vector[concept_id]. 0..1. */
  current_concept_mastery: number;
  /**
   * Misconception ids the student has tripped on in the last 30 days
   * for THIS concept. Drives "address misconception X" prompt steering.
   */
  recent_misconceptions: string[];
  /**
   * Concepts in the prerequisite chain where the student's mastery is
   * below 0.4 — drives "scaffold from this lower concept" hints.
   */
  shaky_prerequisites: string[];
  /**
   * Short human label of the student's school curriculum context, e.g.
   * "CBSE Class 12 Mathematics". Sourced from the registered knowledge
   * track on the student's exam profile. null when no track registered
   * → prompt falls back to today's generic framing.
   *
   * Drives "delta from school syllabus" framing — the prompt can lean
   * on what the student already covered there instead of re-teaching it.
   */
  prior_curriculum: string | null;
  /** True when payload is the all-defaults neutral shape (unknown student). */
  is_neutral: boolean;
}

export const NEUTRAL_CONTEXT: StudentContext = Object.freeze({
  representation_mode: 'balanced',
  motivation_state: 'steady',
  current_concept_mastery: 0.3,
  recent_misconceptions: [],
  shaky_prerequisites: [],
  prior_curriculum: null,
  is_neutral: true,
});

// ============================================================================
// Builder — assembles the payload from existing tables
// ============================================================================

const RECENT_ERROR_DAYS = 30;
const SHAKY_PREREQ_THRESHOLD = 0.4;

export interface BuildContextInput {
  /** UUID. Null/missing → neutral payload. */
  student_id: string | null;
  concept_id: string;
}

export async function buildStudentContext(input: BuildContextInput): Promise<StudentContext> {
  const { student_id, concept_id } = input;
  if (!student_id) return { ...NEUTRAL_CONTEXT };

  const pool = getPool();
  if (!pool) return { ...NEUTRAL_CONTEXT };

  // Single round-trip: pull student_model row + recent misconceptions
  // for this concept. Table missing / row missing → neutral.
  let smRow: { representation_mode: string | null; motivation_state: string | null; mastery_vector: any; prerequisite_alerts: any } | null = null;
  try {
    const r = await pool.query(
      `SELECT representation_mode, motivation_state, mastery_vector, prerequisite_alerts
         FROM student_model WHERE user_id = $1::UUID LIMIT 1`,
      [student_id],
    );
    if (r.rows.length > 0) smRow = r.rows[0];
  } catch {
    return { ...NEUTRAL_CONTEXT };
  }

  if (!smRow) return { ...NEUTRAL_CONTEXT };

  const representation_mode = (
    ['algebraic', 'geometric', 'numerical', 'balanced'].includes(smRow.representation_mode ?? '')
      ? smRow.representation_mode
      : 'balanced'
  ) as RepresentationMode;

  const motivation_state = (
    ['driven', 'steady', 'flagging', 'frustrated', 'anxious'].includes(smRow.motivation_state ?? '')
      ? smRow.motivation_state
      : 'steady'
  ) as MotivationState;

  // Mastery for THIS concept
  let current_concept_mastery = 0.3;
  if (smRow.mastery_vector && typeof smRow.mastery_vector === 'object') {
    const entry = (smRow.mastery_vector as Record<string, any>)[concept_id];
    if (entry && typeof entry.score === 'number') {
      current_concept_mastery = Math.max(0, Math.min(1, entry.score));
    }
  }

  // Shaky prereqs: from prerequisite_alerts JSONB if populated, else from mastery_vector scan
  const shaky_prerequisites: string[] = [];
  if (Array.isArray(smRow.prerequisite_alerts)) {
    for (const alert of smRow.prerequisite_alerts) {
      if (alert?.concept === concept_id && Array.isArray(alert.shaky_prereqs)) {
        for (const p of alert.shaky_prereqs) {
          if (typeof p === 'string') shaky_prerequisites.push(p);
        }
      }
    }
  }

  // Recent misconceptions for this concept (joined via session_id)
  let recent_misconceptions: string[] = [];
  try {
    const r = await pool.query<{ misconception_id: string }>(
      `SELECT DISTINCT el.misconception_id
         FROM error_log el
         JOIN student_model sm ON sm.session_id = el.session_id
        WHERE sm.user_id = $1::UUID
          AND el.concept_id = $2
          AND el.misconception_id IS NOT NULL
          AND el.created_at > NOW() - ($3::TEXT || ' days')::INTERVAL
        LIMIT 5`,
      [student_id, concept_id, String(RECENT_ERROR_DAYS)],
    );
    recent_misconceptions = r.rows.map((row) => row.misconception_id).filter(Boolean);
  } catch {
    // Tables missing — fall through with empty list
  }

  return {
    representation_mode,
    motivation_state,
    current_concept_mastery,
    recent_misconceptions,
    shaky_prerequisites: shaky_prerequisites.slice(0, 3),
    prior_curriculum: await resolvePriorCurriculum(student_id),
    is_neutral: false,
  };
}

/**
 * Resolves the student's school-curriculum label from their registered
 * exam profile (first exam's knowledge_track_id). Returns null when no
 * profile / no track / unknown track id — prompt then falls back to
 * today's generic framing.
 *
 * Read-only: never writes to the profile or track tables. The profile
 * store is a flat-file by design (existing module — we just read it).
 */
async function resolvePriorCurriculum(student_id: string): Promise<string | null> {
  try {
    const { getProfile } = await import('../session-planner/exam-profile-store');
    const { getTrack } = await import('../knowledge/tracks');
    const profile = getProfile(student_id);
    const trackId = profile?.exams?.[0]?.knowledge_track_id;
    if (!trackId) return null;
    const track = getTrack(trackId);
    return track?.display_name ?? null;
  } catch {
    return null;
  }
}

// ============================================================================
// Prompt formatter — the SOLE place context fields become externally-visible bytes
// ============================================================================
//
// Returns a structured prompt snippet the orchestrator inserts before
// the per-atom-type instructions. Empty string for neutral context (so
// today's prompts are unchanged for anonymous/new students).
//
// The format is deliberately verbose ("This student tends to think
// geometrically") rather than encoded ("rep_mode=geometric") — LLMs
// follow natural language better, and the snippet is internal anyway.

export function toPromptText(ctx: StudentContext): string {
  if (ctx.is_neutral) return '';
  const parts: string[] = ['## Student context', ''];

  // Representation
  if (ctx.representation_mode !== 'balanced') {
    const verb: Record<RepresentationMode, string> = {
      algebraic: 'reasons most fluently with formal manipulation and symbolic steps',
      geometric: 'tends to think visually and prefers diagram-anchored intuition',
      numerical: 'is most comfortable with concrete computation and worked-example walkthroughs',
      balanced: '',
    };
    parts.push(`- This student ${verb[ctx.representation_mode]}.`);
  }

  // Mastery hint
  if (ctx.current_concept_mastery < 0.3) {
    parts.push(`- They are NEW to this concept (mastery ≈ ${ctx.current_concept_mastery.toFixed(2)}). Lean on intuition + concrete examples; avoid jargon-first definitions.`);
  } else if (ctx.current_concept_mastery > 0.7) {
    parts.push(`- They have STRONG mastery (≈ ${ctx.current_concept_mastery.toFixed(2)}). Skip introductory framing; offer edge cases or higher-difficulty applications.`);
  }

  // Motivation
  if (ctx.motivation_state === 'frustrated' || ctx.motivation_state === 'flagging') {
    parts.push(`- Motivation: ${ctx.motivation_state}. Keep tone gentle and concrete; one-step-at-a-time pacing.`);
  } else if (ctx.motivation_state === 'driven') {
    parts.push(`- Motivation: driven. Crisp, no-fluff explanations; rigour is welcome.`);
  }

  // Recent misconceptions — directly steer the prompt
  if (ctx.recent_misconceptions.length > 0) {
    parts.push(
      `- They have recently tripped on these misconceptions for this concept: ${ctx.recent_misconceptions.join(', ')}. Address one of them DIRECTLY in this atom (do not say "you got X wrong" — model the correct reasoning so the misconception becomes visibly wrong).`,
    );
  }

  // Prior curriculum — school syllabus context
  if (ctx.prior_curriculum) {
    parts.push(
      `- Coming from: ${ctx.prior_curriculum}. Where this concept overlaps with that syllabus, build ON that prior coverage rather than re-teaching it from scratch; lean on familiar notation when natural.`,
    );
  }

  // Shaky prereqs — scaffold
  if (ctx.shaky_prerequisites.length > 0) {
    parts.push(
      `- Their grasp of these prerequisites is shaky: ${ctx.shaky_prerequisites.join(', ')}. When you reference them, briefly remind without launching a full re-explanation.`,
    );
  }

  parts.push('');
  parts.push('Use the above to calibrate phrasing. Do NOT mention "you", "we noticed", "your error" — the student should not feel observed; they should feel that the explanation simply fits.');
  return parts.join('\n');
}

// Exported for tests
export const __testing = { NEUTRAL_CONTEXT, RECENT_ERROR_DAYS, SHAKY_PREREQ_THRESHOLD };
