/**
 * Exam Profile Schema v1 — engine-facing exam-profile row.
 *
 * Implements docs/exam-profile-schema.md verbatim: "the data contract every
 * exam must satisfy to plug into the engine." One exam = one data row.
 *
 * This is deliberately a THIRD thing, distinct from two other "exam" concepts
 * already in this codebase:
 *
 *   1. `src/exams/types.ts`'s `Exam` — the dynamic, admin-facing exam
 *      registry (`.data/exams.json`, progressively enriched, CRUD via
 *      `/api/exams`). See docs/EXAM-FRAMEWORK.md. That registry answers
 *      "what admin-editable metadata do we know about exam X" — it has no
 *      opinion on which fields the ENGINE requires to run correctly, and a
 *      freshly-created exam there can be 0% complete.
 *   2. `src/session-planner/exam-profile-store.ts`'s `ExamRegistration` —
 *      per-STUDENT data: which exams a student says they're taking, and
 *      their own declared `exam_date`. That is student data, not engine
 *      configuration, and is keyed by `student_id`, not by exam.
 *
 * `ExamProfile` here is neither: it's the narrow, versioned, engine-facing
 * contract that the exam-profile-schema doc defines — the row every
 * capability-selecting consumer (EV coaching, hero readiness counter, mock
 * exam UI, onboarding consent) should eventually read instead of hardcoding
 * "the exam" (which today silently means GATE). See
 * docs/capability-register.md for the ledger of GATE-shaped hardcodes this
 * schema is meant to retire, one wired consumer at a time.
 *
 * This module lives in `src/exams/` (not `src/core/`, `src/gbrain/`,
 * `src/readiness/`, or `src/scoring/`) because those four are the "engine"
 * directories the fork-test lint (`scripts/fork-test-lint.mjs`) polices for
 * exam-name literals. `src/exams/` — like `src/syllabus/` — is explicitly
 * carved out as "legitimately exam-aware by design" (see that script's
 * header comment), so a GATE-specific data row naming GATE is expected here,
 * not a violation.
 *
 * GATE-EM's row below is FACT, not hypothesis (per the schema doc): every
 * field is sourced from the official GATE exam pattern and marking scheme.
 * A future JEE Main row would be filled in the same shape but marked
 * hypothesis until verified against the current-year NTA notification —
 * that row is out of scope for this module; see the schema doc's JEE column
 * for the draft values when that work lands.
 */

import {
  marksCorrect,
  mcqMarksWrong,
  MSQ_MARKS_WRONG,
  MSQ_PARTIAL_CREDIT,
  NAT_MARKS_WRONG,
} from './marking-constants';

// ============================================================================
// Schema v1 field types
// ============================================================================

/** A single question type's marking rule. */
export interface MarkingRule {
  /** Marks awarded for a correct answer. */
  marks_correct: number;
  /** Marks deducted for a wrong answer, expressed as a negative number (0 = no negative marking). */
  marks_wrong: number;
  /** Free-text caveat, e.g. GATE MSQ's "no partial unless verified". */
  notes?: string;
}

/** GATE's `marking_table`: MCQ splits by mark-value; MSQ and NAT are flat. */
export interface GateMarkingTable {
  mcq: {
    one_mark: MarkingRule;
    two_mark: MarkingRule;
  };
  msq: MarkingRule & {
    partial_credit: 'no' | 'no_partial_unless_verified' | 'yes';
  };
  nat: MarkingRule;
}

export type QuestionType = 'mcq' | 'msq' | 'nat' | 'numeric' | 'descriptive';

/** How often + how many sessions the exam is offered. */
export interface AttemptCalendar {
  cadence: 'single annual date' | 'multi-session per year';
  /** Present only when `cadence === 'multi-session per year'`. */
  sessions_per_year?: number;
  notes?: string;
}

export type ScoreCurrency = 'raw_marks' | 'normalized_percentile';
export type ScheduleAuthority = 'self-directed' | 'institute-directed';

export interface AccountHolder {
  holder: 'adult self' | 'minor';
  /** DPDP-style parental consent requirement. */
  consent_required: boolean;
  notes?: string;
}

export interface MockFormat {
  /** e.g. "GATE CBT mirror" */
  label: string;
  duration_minutes: number;
  calculator_policy: string;
  notes?: string;
}

export type ToneRegister = 'adult, career-stakes' | '16-17yo, anxiety-aware, parent-visible';
export type ParentRoleWeight = 'low' | 'high';

/**
 * The one field the schema doc explicitly does NOT want fixed as an engine
 * constant for GATE: `exam_date(s)` is "data, not code" per the schema
 * table. See `ExamDateHandling` below for how this module represents that.
 */
export interface ExamDateHandling {
  /**
   * 'student_declared' — the exam has no single engine-fixed date; each
   * student's actual attempt date lives in
   * `src/session-planner/exam-profile-store.ts`'s `ExamRegistration.exam_date`.
   * 'engine_fixed' would mean the profile carries a literal date — not used
   * for GATE, and not invented here (see this module's header + the task
   * note on not fabricating a "fact" the source doc doesn't assert).
   */
   mode: 'student_declared' | 'engine_fixed';
   /** Only set when mode === 'engine_fixed'. */
   fixed_dates?: string[];
   notes: string;
}

/** The full exam-profile-schema v1 row for one exam. */
export interface ExamProfile {
  /** Stable identifier, matching the exam-catalog/syllabus-pack convention (kebab-case). */
  exam_id: string;
  /** Human-readable name. */
  name: string;
  /** 'fact' (sourced from the official exam pattern) or 'hypothesis' (draft, pending verification). */
  confidence: 'fact' | 'hypothesis';

  marking_table: GateMarkingTable;
  question_types: QuestionType[];
  attempt_calendar: AttemptCalendar;
  score_currency: ScoreCurrency;
  schedule_authority: ScheduleAuthority;
  account_holder: AccountHolder;
  mock_format: MockFormat;
  tone_register: ToneRegister;
  parent_role_weight: ParentRoleWeight;
  /** e.g. 'gate-em.yml' */
  syllabus_pack: string;
  /** Brand/accent identifier for this exam's UI chrome. */
  accent_token: string;
  exam_date: ExamDateHandling;
}

// ============================================================================
// GATE-EM row — FACT, sourced from docs/exam-profile-schema.md
// ============================================================================

/**
 * GATE-EM's marking_table, restated in the schema doc's shape but DERIVED
 * (plan D7/E6) from the one compiled marking truth in
 * `./marking-constants.ts` — this module states no marking literal of its
 * own any more. `marksCorrect(n)` is the identity on mark value; the
 * negatives are the contract's signed `marks_wrong`.
 *
 * `partial_credit: 'no_partial_unless_verified'` is the schema's tri-state
 * rendering of the contract's boolean `MSQ_PARTIAL_CREDIT === false`: the
 * schema distinguishes "the brochure says no partial credit" from "nobody
 * has verified it this year", and the contract's `false` is the latter,
 * conservative reading (it is what makes the scorer REFUSE a partial-credit
 * scheme rather than grade under it). A `true` in the contract would have
 * to become `'yes'` here — asserted by the exam-profile test.
 */
export const GATE_EM_MARKING_TABLE: GateMarkingTable = {
  mcq: {
    one_mark: { marks_correct: marksCorrect(1), marks_wrong: mcqMarksWrong(1) },
    two_mark: { marks_correct: marksCorrect(2), marks_wrong: mcqMarksWrong(2) },
  },
  msq: {
    marks_correct: marksCorrect(1),
    marks_wrong: MSQ_MARKS_WRONG,
    partial_credit: MSQ_PARTIAL_CREDIT ? 'yes' : 'no_partial_unless_verified',
    notes: 'No negative marking on MSQ; any non-exact selection scores 0.',
  },
  nat: {
    marks_correct: marksCorrect(1),
    marks_wrong: NAT_MARKS_WRONG,
    notes: 'No negative marking on NAT.',
  },
};

export const GATE_EM_PROFILE: ExamProfile = {
  exam_id: 'gate-ma',
  name: 'GATE Engineering Mathematics',
  confidence: 'fact',

  marking_table: GATE_EM_MARKING_TABLE,
  question_types: ['mcq', 'msq', 'nat'],

  attempt_calendar: {
    cadence: 'single annual date',
    notes: 'GATE runs one national attempt window per year (unlike JEE Main\'s two sessions).',
  },

  score_currency: 'raw_marks',
  schedule_authority: 'self-directed',

  account_holder: {
    holder: 'adult self',
    consent_required: false,
    notes: 'GATE candidates are postgraduate-entrance-eligible adults; no minor-consent path needed.',
  },

  mock_format: {
    label: 'GATE CBT mirror',
    duration_minutes: 180,
    calculator_policy: 'Virtual on-screen scientific calculator only (no physical calculator).',
  },

  tone_register: 'adult, career-stakes',
  parent_role_weight: 'low',
  syllabus_pack: 'gate-em.yml',

  /**
   * GATE has no exam-specific brand token distinct from the platform's
   * single global design system today (see DESIGN-SYSTEM.md — one shared
   * emerald/violet palette, no per-exam accent variants yet; the schema
   * doc's "accent_token / brand strings: GATE set" describes a distinction
   * that becomes real only once a second exam's accent set exists to
   * differ from). This is the platform's current primary/mastery accent,
   * recorded here as GATE's token so a future second exam's row has
   * something concrete to diverge from, per add-an-exam-recipe.md step 7.
   */
  accent_token: 'emerald-primary',

  /**
   * `exam_date(s)` per the schema doc: "data, not code". Verified by
   * searching the codebase: no engine module hardcodes a GATE exam date
   * anywhere — the only place an exam date exists at all is
   * `src/session-planner/exam-profile-store.ts`'s per-student
   * `ExamRegistration.exam_date`, which a student sets themselves (GATE's
   * date changes annually, e.g. announced ~6 months ahead, and differs by
   * candidate only in *which* year's sitting they're registered for).
   * This profile therefore fixes only the stable CADENCE fact
   * (`attempt_calendar.cadence`) and does NOT invent an engine-level
   * default date — doing so would fabricate a "fact" the source doc never
   * asserts as fixed.
   */
  exam_date: {
    mode: 'student_declared',
    notes:
      'GATE\'s actual exam date is student-declared via ' +
      'src/session-planner/exam-profile-store.ts (ExamRegistration.exam_date), ' +
      're-set annually as each year\'s date is announced. The engine-fixed fact ' +
      'this profile carries is the single-annual-date CADENCE, not a literal date.',
  },
};

// ============================================================================
// Derived, rounded convenience constants for approximate-EV consumers
// ============================================================================

/**
 * Rounds a marking_table fraction to 2 decimal places. Some consumers (e.g.
 * `src/gbrain/exam-strategy.ts`'s EV-coaching heuristics) intentionally work
 * in already-rounded approximations — that module's `ExamConfig` also
 * carries `total_questions: 65, // approx` and
 * `marks_per_correct: 2, // weighted average` as siblings of the negative-
 * marking figure. This helper keeps that existing rounding convention while
 * sourcing the underlying number from the fact-sourced `marking_table`
 * instead of a bare inline literal.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * GATE 2-mark MCQ negative marking, rounded to 2dp: -2/3 → -0.67. This is
 * the exact value `src/gbrain/exam-strategy.ts` previously hardcoded as a
 * bare `-0.67` literal; wiring it here makes the number provenance-tracked
 * without changing it.
 */
export const GATE_EM_MCQ_2MARK_NEGATIVE_ROUNDED = round2(GATE_EM_MARKING_TABLE.mcq.two_mark.marks_wrong);
