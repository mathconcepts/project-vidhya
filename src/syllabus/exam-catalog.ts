// @ts-nocheck
/**
 * Exam Catalog
 *
 * Static registry of exams this instance of Vidhya supports. Each entry
 * defines topic coverage, typical scope, expected prep duration, and
 * topic weights — matching official syllabus documents where available.
 *
 * Adding a new exam: insert an entry here, then let the syllabus generator
 * walk the concept graph filtered by this exam's topics.
 */

import type { ExamScope } from './types';

// ============================================================================
// Marking / question-type / schedule extension (U1-12/U1-13, Multi-Exam
// Expansion Design v5 §5) — additive fields on ExamDefinition below.
//
// This is the "exam profile row" the design doc asks for: a single data
// row engine code (src/scoring/, src/api/) can read instead of hardcoding
// exam-specific marking literals. Kept in THIS file (rather than a new
// module) because ExamDefinition already is the canonical per-exam data
// row for the static catalog — the marking table is just another field
// on it, not a parallel system.
// ============================================================================

/**
 * One question-type's marking rule. `marks_wrong` is expressed as a
 * negative number (0 means no negative marking at all).
 */
export interface MarkingRule {
  marks_correct: number;
  marks_wrong: number;
  /** true = the item's scheme allows partial credit for a partially-correct
   *  MSQ selection. Absent/false = full marks iff the exact correct set is
   *  selected, otherwise 0 (see src/scoring/deterministic-scorer.ts, which
   *  REFUSES to grade when this is true until the current-year rule is
   *  verified against the official brochure). */
  partial_credit?: boolean;
}

/**
 * Canonical per-question-type marking for an exam. MCQ is keyed by the
 * item's mark value because GATE (and others) apply different negative
 * marking to 1-mark vs 2-mark MCQs; MSQ/NAT have a single rule since their
 * negative marking doesn't vary by mark value today.
 */
export interface MarkingTable {
  mcq?: Record<number, MarkingRule>;
  msq?: MarkingRule;
  nat?: MarkingRule;
}

export type ExamQuestionKind = 'mcq' | 'msq' | 'nat' | 'descriptive';

export interface ExamDefinition {
  id: string;
  name: string;
  authority: string;                    // who administers it
  default_scope: ExamScope;
  allowed_scopes: ExamScope[];          // scopes a student can pick
  topics: string[];                     // topic_ids from concept-graph
  topic_weights: Record<string, number>; // 0..1, sums to ~1.0
  typical_prep_weeks: number;
  reference_url: string;
  official_syllabus_url?: string;
  description: string;

  /**
   * OPTIONAL, additive (U1-13) — canonical marking scheme for this exam.
   * Engine call sites that used to hardcode a GATE-shaped negative-marking
   * literal should read it from here (see `gateMcqNegativeMarksFallback`
   * below). Absent for exams that haven't had their marking scheme
   * transcribed yet — never fabricated.
   */
  marking_table?: MarkingTable;

  /** OPTIONAL, additive (U1-13) — question kinds this exam actually uses. */
  question_types?: ExamQuestionKind[];

  /**
   * OPTIONAL, additive (U1-13) — the exam's real upcoming sitting date(s),
   * as plain editable data (NOT baked into engine code). `exam_date` is the
   * first/primary sitting; `exam_dates` lists every session for exams that
   * run across multiple days. ISO date strings (YYYY-MM-DD).
   */
  exam_date?: string;
  exam_dates?: string[];
}

export const EXAMS: Record<string, ExamDefinition> = {

  'gate-ma': {
    id: 'gate-ma',
    name: 'GATE Engineering Mathematics',
    authority: 'IIT / IISc — Graduate Aptitude Test in Engineering',
    default_scope: 'mcq-rigorous',
    allowed_scopes: ['mcq-fast', 'mcq-rigorous'],
    topics: [
      'linear-algebra',
      'calculus',
      'differential-equations',
      'probability-statistics',
      'complex-variables',
      'numerical-methods',
      'transform-theory',
      'vector-calculus',
      'discrete-mathematics',
      'graph-theory',
    ],
    topic_weights: {
      'linear-algebra': 0.20,
      'calculus': 0.25,
      'differential-equations': 0.15,
      'probability-statistics': 0.10,
      'complex-variables': 0.08,
      'numerical-methods': 0.05,
      'transform-theory': 0.05,
      'vector-calculus': 0.05,
      'discrete-mathematics': 0.04,
      'graph-theory': 0.03,
    },
    typical_prep_weeks: 12,
    reference_url: 'https://gate.iitk.ac.in/',
    official_syllabus_url: 'https://gate.iitk.ac.in/syllabus.html',
    description: 'Engineering Mathematics portion of GATE — MCQ + numerical-answer-type. 15 marks of 100 in CS/EC/EE/ME papers, 85 marks in dedicated MA paper.',

    // FACT, not hypothesis (U1-13): GATE's marking scheme has been stable
    // for several years — MCQ -1/3 on 1-mark items, -2/3 on 2-mark items;
    // MSQ and NAT carry no negative marking. Matches the values already
    // documented independently in src/samples/gate-mathematics.ts's
    // GATE_MATH_EXAM.marking_scheme and src/scoring/deterministic-scorer.ts's
    // DEFAULT_MCQ_NEGATIVE_1_MARK/2_MARK — this row is the one place a
    // caller should read them from going forward instead of re-hardcoding.
    marking_table: {
      mcq: {
        1: { marks_correct: 1, marks_wrong: -1 / 3 },
        2: { marks_correct: 2, marks_wrong: -2 / 3 },
      },
      // No partial credit unless a future year's brochure states otherwise
      // (see deterministic-scorer.ts's refusal on partial_credit: true).
      msq: { marks_correct: 1, marks_wrong: 0, partial_credit: false },
      nat: { marks_correct: 1, marks_wrong: 0 },
    },
    question_types: ['mcq', 'msq', 'nat'],

    // Real, operator-editable data (U1-13) — GATE 2027 sittings as announced
    // by IIT Madras: Feb 6, 7, 13, 14, 20, 21, 2027 (forenoon + afternoon
    // sessions each day). `exam_date` is the first session; update both
    // fields here when the next year's official notification lands —
    // never re-derive a date inside engine code.
    exam_date: '2027-02-06',
    exam_dates: ['2027-02-06', '2027-02-07', '2027-02-13', '2027-02-14', '2027-02-20', '2027-02-21'],
  },

  'jee-advanced-math': {
    id: 'jee-advanced-math',
    name: 'JEE Advanced — Mathematics',
    authority: 'IIT — Joint Entrance Examination Advanced',
    default_scope: 'mcq-rigorous',
    allowed_scopes: ['mcq-fast', 'mcq-rigorous'],
    topics: [
      'calculus',
      'linear-algebra',
      'probability-statistics',
      'complex-variables',
      'vector-calculus',
    ],
    topic_weights: {
      'calculus': 0.45,
      'linear-algebra': 0.15,
      'probability-statistics': 0.15,
      'complex-variables': 0.15,
      'vector-calculus': 0.10,
    },
    typical_prep_weeks: 52,
    reference_url: 'https://jeeadv.ac.in/',
    official_syllabus_url: 'https://jeeadv.ac.in/resources/syllabus.pdf',
    description: 'Mathematics section of JEE Advanced — high-difficulty MCQ, numerical-answer, and match-the-column types. Emphasizes conceptual depth within a tight timeframe.',
  },

  'university-math-ug-final': {
    id: 'university-math-ug-final',
    name: 'Undergraduate Math — End-Semester (Generic)',
    authority: 'University (varies)',
    default_scope: 'subjective-long',
    allowed_scopes: ['subjective-short', 'subjective-long', 'oral-viva'],
    topics: [
      'calculus',
      'linear-algebra',
      'differential-equations',
      'complex-variables',
      'vector-calculus',
    ],
    topic_weights: {
      'calculus': 0.30,
      'linear-algebra': 0.25,
      'differential-equations': 0.20,
      'complex-variables': 0.15,
      'vector-calculus': 0.10,
    },
    typical_prep_weeks: 4,
    reference_url: 'https://en.wikipedia.org/wiki/Engineering_mathematics',
    description: 'Long-form written exam. Emphasizes derivation, proof, and clear justification. Partial credit for correct approach.',
  },

  'csir-net-math': {
    id: 'csir-net-math',
    name: 'CSIR-NET Mathematical Sciences',
    authority: 'CSIR — National Eligibility Test',
    default_scope: 'mcq-rigorous',
    allowed_scopes: ['mcq-rigorous', 'subjective-long'],
    topics: [
      'calculus',
      'linear-algebra',
      'complex-variables',
      'differential-equations',
      'probability-statistics',
      'discrete-mathematics',
      'numerical-methods',
    ],
    topic_weights: {
      'calculus': 0.20,
      'linear-algebra': 0.18,
      'complex-variables': 0.15,
      'differential-equations': 0.15,
      'probability-statistics': 0.12,
      'discrete-mathematics': 0.10,
      'numerical-methods': 0.10,
    },
    typical_prep_weeks: 24,
    reference_url: 'https://csirnet.nta.ac.in/',
    official_syllabus_url: 'https://csirnet.nta.ac.in/syllabus',
    description: 'Qualifying exam for research fellowships and lectureship in mathematical sciences. Rigorous MCQ + MSQ + NAT format across three parts.',
  },

  'university-viva': {
    id: 'university-viva',
    name: 'Math Viva / Oral Defense (Generic)',
    authority: 'University (varies)',
    default_scope: 'oral-viva',
    allowed_scopes: ['oral-viva'],
    topics: [
      'calculus',
      'linear-algebra',
      'differential-equations',
      'complex-variables',
      'vector-calculus',
    ],
    topic_weights: {
      'calculus': 0.25,
      'linear-algebra': 0.25,
      'differential-equations': 0.20,
      'complex-variables': 0.15,
      'vector-calculus': 0.15,
    },
    typical_prep_weeks: 2,
    reference_url: '',
    description: 'Oral examination with faculty. Emphasizes verbal explanation, conceptual fluency, and cross-topic connection over written derivation.',
  },
};

export function getExam(id: string): ExamDefinition | null {
  return EXAMS[id] || null;
}

export function listExams(): Array<Pick<ExamDefinition, 'id' | 'name' | 'default_scope' | 'allowed_scopes'>> {
  return Object.values(EXAMS).map(e => ({
    id: e.id,
    name: e.name,
    default_scope: e.default_scope,
    allowed_scopes: e.allowed_scopes,
  }));
}

/** Returns an exam's canonical marking table, or null if it hasn't been transcribed yet. */
export function getMarkingTable(examId: string): MarkingTable | null {
  return EXAMS[examId]?.marking_table ?? null;
}

/**
 * Reverse lookup (U1-12): which exam(s) in this catalog include the given
 * topic_id in their syllabus. This is the mechanism that lets entities
 * which key on concept_id/topic rather than carrying a direct exam_id
 * column (generated_problems, attempts, Elo/FSRS state) resolve back to
 * an exam: concept_id -> concept_graph.topic -> examIdsForTopic(topic).
 * See src/__tests__/exam-scoping-invariants.test.ts.
 */
export function examIdsForTopic(topicId: string): string[] {
  return Object.values(EXAMS)
    .filter(e => e.topics.includes(topicId))
    .map(e => e.id);
}

/**
 * Fallback MCQ negative-marking value for GATE's legacy static PYQ files
 * (data/courses/gate-em/topics/*​/mcqs.json), which predate a per-question
 * `negative_marks` column and need a computed default when it's absent.
 * Reads GATE's canonical `marking_table` row (U1-13) instead of a
 * hardcoded `-0.33` literal — the two call sites this replaces
 * (src/api/gate-routes.ts, src/db/seed-static-pyqs.ts) both used to
 * duplicate that magic number directly.
 *
 * Falls back to `-(marks / 3)` for a mark value GATE's table doesn't
 * define, mirroring `mcqNegativeMarks()`'s own defensive default in
 * src/scoring/deterministic-scorer.ts (GATE has no MCQ mark value other
 * than 1 or 2 today).
 */
export function gateMcqNegativeMarksFallback(marks: number): number {
  const rule = EXAMS['gate-ma']?.marking_table?.mcq?.[marks];
  if (rule) return rule.marks_wrong;
  return -(marks / 3);
}
