/**
 * src/scoring/deterministic-scorer.ts — Wave 7: rule-based MCQ/MSQ/NAT
 * scoring under GATE-style marking.
 *
 * Ported from the reference implementation at
 * vidhya-core/src/deterministic-scorer.ts, adapted to this repo's types
 * and conventions:
 *
 *   - vidhya-core's local `Scorer`/`Result<T>`/`ExamModel`/`PracticeItem`/
 *     `Response` types don't exist here. This repo's `core/interfaces.ts`
 *     DOES export a `Scorer`, but its contract is
 *     `grade(studentResponse: string, item: ItemContext, opts?) => Promise<GradeResult>`
 *     — built for the LLM-rubric grader (`rubric-grader.ts`), which grades
 *     free-text descriptive answers against a criterion rubric. MCQ/MSQ/NAT
 *     scoring needs a structured item (options + correct answer/range) and
 *     a structured response (selected index/indices/value), not a string —
 *     an incompatible shape, not a stricter one. Rather than force-fit a
 *     string-shaped interface, this module defines its own narrow
 *     `DeterministicScorer` contract (`GateItem`, `GateResponse`) and
 *     reuses `GradeResult` from core/interfaces.ts as the shared output
 *     shape, so both scorers still plug into the same `Attempt`/
 *     `partialMarks` pipeline (see student-model-pg.ts's `update()`).
 *   - No `Result<T>` wrapper exists in this repo; other scoring code
 *     (rubric-grader.ts, teacher-queue-pg.ts) throws plain `Error`s for
 *     invalid input and returns the success shape directly. This module
 *     follows that convention: `grade()` throws on malformed items/
 *     responses (including the MSQ partial-credit refusal) instead of
 *     returning an ok/error union.
 *   - Marking scheme: `exams/types.ts`'s `MarkingScheme` has a single flat
 *     `negative_marks_per_wrong` (not split by mark-value) and an opt-in
 *     `partial_credit` flag — no per-mark-value negative array like
 *     vidhya-core's `ExamModel.marking.mcqNegative[item.marks]`. This
 *     module accepts an optional `MarkingScheme` and falls back to the
 *     GATE-standard defaults the task specifies when scheme fields are
 *     absent: 1/3 negative for a 1-mark MCQ, 2/3 negative for a 2-mark
 *     MCQ (`DEFAULT_MCQ_NEGATIVE`). Marks values other than 1 or 2 fall
 *     back to the 2-mark ratio (1/3 of the item's marks) — GATE has no
 *     other MCQ mark values today, so this is a defensive default, not a
 *     documented exam rule.
 *
 * Marking rules (unchanged from the reference / task spec):
 *   - MCQ correct   → +item.marks;  MCQ wrong → −negative(item.marks);  skip → 0
 *   - MSQ exact set → +item.marks;  any other selection → 0, NEVER negative.
 *     `markingScheme.partial_credit === true` is a REFUSAL: this scorer
 *     throws rather than silently grading full-or-nothing under a scheme
 *     that expects partial credit (GATE's exact partial-credit rule for
 *     MSQs is unverified against the current-year brochure — see task
 *     note). Conservative-by-default: undefined/false → full-or-nothing.
 *   - NAT in [lo, hi] (inclusive, ±1e-9 epsilon on both bounds) → +item.marks;
 *     otherwise → 0. NAT is never negative.
 *   - skipped → 0 for every kind.
 *
 * Consumption: there is no existing call site that scores MCQ/MSQ/NAT
 * practice attempts end-to-end (verified — `/api/verify*` is a separate
 * CAS/LLM verification cascade for "check my working," not a marks
 * ledger, and stays untouched). Per the task's fallback instruction, this
 * module was designed to be wired into the readiness surface
 * (`src/api/readiness-routes.ts`'s `GET /api/readiness/next-action`),
 * attaching a `marking` block (via `describeMarking()` below) onto a
 * practice action's item so a client could score a response with
 * `GateDeterministicScorer.grade()` once collected. Since Wave 8 that
 * wiring is real: migration 032 gave `generated_problems` nullable
 * `question_type`/`marks`/answer-shape columns, the Pg catalog threads
 * them through `payload`, and readiness-routes' `attachMarking()` calls
 * `describeMarking()` for rows that carry real marking (and attaches
 * nothing for rows that don't — marking is never fabricated).
 *
 * Wave 9 closed the loop: `POST /api/practice/attempt`
 * (src/api/practice-routes.ts) collects a structured GateResponse,
 * calls `grade()` server-side, and feeds the result into
 * `StudentModel.update()` as `Attempt.partialMarks`. Items are gradable
 * iff migrations 032/033 gave their row real marking + a canonical
 * options list; everything else is refused (422), never guessed.
 */

import type { GradeResult } from '../core/interfaces';
import type { MarkingScheme } from '../exams/types';

// ────────────────────────────────────────────────────────────────────
// Item / response shapes — structured, not string-based (see header).
// ────────────────────────────────────────────────────────────────────

export type GateItemKind = 'mcq' | 'msq' | 'nat';

export interface GateItem {
  id: string;
  kind: GateItemKind;
  /** Item's max marks (GATE: almost always 1 or 2). */
  marks: number;
  /** MCQ: 0-based index of the correct option. */
  answerIndex?: number;
  /** MCQ + MSQ: the option list (used for validation only). */
  options?: unknown[];
  /** MSQ: 0-based indices of every correct option. */
  answerIndices?: number[];
  /** NAT: inclusive [lo, hi] accepted range. */
  answerRange?: [number, number];
}

export interface GateResponse {
  kind: GateItemKind;
  skipped?: boolean;
  /** MCQ: the option index the student picked. */
  selectedIndex?: number;
  /** MSQ: the option indices the student picked. */
  selectedIndices?: number[];
  /** NAT: the numeric value the student entered. */
  value?: number;
}

export interface DeterministicScorer {
  grade(item: GateItem, response: GateResponse, marking?: MarkingScheme): Promise<GradeResult>;
}

// ────────────────────────────────────────────────────────────────────
// Tuneables
// ────────────────────────────────────────────────────────────────────

/** Boundary tolerance for NAT range checks (matches the reference impl). */
export const NAT_EPSILON = 1e-9;

/** GATE-standard MCQ negative marking when `MarkingScheme` doesn't say. */
export const DEFAULT_MCQ_NEGATIVE_1_MARK = 1 / 3;
export const DEFAULT_MCQ_NEGATIVE_2_MARK = 2 / 3;

const SKIPPED = 'Skipped: no marks awarded or deducted.';

function graded(earned: number, max: number, correct: boolean, feedback: string): GradeResult {
  return {
    earned,
    max,
    perCriterion: { final: earned },
    feedback,
    confidence: 1.0,
    casFinalAnswerCorrect: correct,
  };
}

/**
 * Resolve the per-mark negative-marking penalty for an MCQ. Prefers the
 * exam's `MarkingScheme.negative_marks_per_wrong` when supplied; otherwise
 * falls back to the GATE-standard 1/3 (1-mark) / 2/3 (2-mark) defaults.
 * Marks values other than 1 or 2 fall back to the (marks/3) ratio the
 * 1-mark/2-mark defaults share — GATE has no other MCQ mark value today.
 */
export function mcqNegativeMarks(itemMarks: number, marking?: MarkingScheme): number {
  if (marking && typeof marking.negative_marks_per_wrong === 'number') {
    return Math.abs(marking.negative_marks_per_wrong);
  }
  if (itemMarks === 1) return DEFAULT_MCQ_NEGATIVE_1_MARK;
  if (itemMarks === 2) return DEFAULT_MCQ_NEGATIVE_2_MARK;
  return itemMarks / 3;
}

// ────────────────────────────────────────────────────────────────────
// Implementation
// ────────────────────────────────────────────────────────────────────

export class GateDeterministicScorer implements DeterministicScorer {
  async grade(item: GateItem, response: GateResponse, marking?: MarkingScheme): Promise<GradeResult> {
    if (item.kind !== response.kind) {
      throw new Error(
        `GateDeterministicScorer: item kind "${item.kind}" does not match response kind "${response.kind}"`,
      );
    }
    switch (item.kind) {
      case 'mcq': return this.gradeMcq(item, response, marking);
      case 'msq': return this.gradeMsq(item, response, marking);
      case 'nat': return this.gradeNat(item, response);
    }
  }

  private gradeMcq(item: GateItem, response: GateResponse, marking?: MarkingScheme): GradeResult {
    if (item.answerIndex === undefined || !item.options || item.options.length === 0) {
      throw new Error('GateDeterministicScorer: mcq item requires answerIndex and non-empty options');
    }
    const max = item.marks;
    if (response.skipped) return graded(0, max, false, SKIPPED);
    if (response.selectedIndex === undefined) {
      throw new Error('GateDeterministicScorer: mcq response must set selectedIndex when not skipped');
    }
    const correct = response.selectedIndex === item.answerIndex;
    const earned = correct ? max : -mcqNegativeMarks(max, marking);
    return graded(earned, max, correct, correct ? 'Correct.' : 'Incorrect: negative marking applied.');
  }

  private gradeMsq(item: GateItem, response: GateResponse, marking?: MarkingScheme): GradeResult {
    if (!item.answerIndices || item.answerIndices.length === 0 || !item.options || item.options.length === 0) {
      throw new Error('GateDeterministicScorer: msq item requires non-empty answerIndices and options');
    }
    if (marking?.partial_credit) {
      throw new Error(
        'GateDeterministicScorer: partial_credit MSQ grading is not implemented — verify the ' +
        'current-year GATE partial-credit rule against the official brochure before enabling',
      );
    }
    const max = item.marks;
    if (response.skipped) return graded(0, max, false, SKIPPED);
    if (!response.selectedIndices || response.selectedIndices.length === 0) {
      throw new Error('GateDeterministicScorer: msq response must set selectedIndices when not skipped');
    }
    const want = new Set(item.answerIndices);
    const got = new Set(response.selectedIndices);
    const correct = want.size === got.size && [...want].every(i => got.has(i));
    // Conservative GATE MSQ rule: full marks iff exact set match; otherwise 0.
    // No negative marking on MSQ (true across GATE years).
    return graded(correct ? max : 0, max, correct,
      correct ? 'Correct.' : 'Incorrect: MSQ requires exactly the correct set; no penalty.');
  }

  private gradeNat(item: GateItem, response: GateResponse): GradeResult {
    if (!item.answerRange) {
      throw new Error('GateDeterministicScorer: nat item requires answerRange');
    }
    const max = item.marks;
    if (response.skipped) return graded(0, max, false, SKIPPED);
    if (response.value === undefined) {
      throw new Error('GateDeterministicScorer: nat response must set value when not skipped');
    }
    const [lo, hi] = item.answerRange;
    const correct = response.value >= lo - NAT_EPSILON && response.value <= hi + NAT_EPSILON;
    // natNegative is always 0: wrong NAT never goes negative.
    return graded(correct ? max : 0, max, correct,
      correct ? 'Correct.' : 'Incorrect: outside accepted range, no penalty.');
  }
}

/** Convenience factory — mirrors `make*` naming used across the readiness/teaching modules. */
export function makeDeterministicScorer(): DeterministicScorer {
  return new GateDeterministicScorer();
}

/**
 * Describe the marking that WOULD apply to a GATE-shaped item, for
 * attaching to an API response payload (see readiness-routes.ts). Doesn't
 * grade anything — just surfaces the resolved negative-marking numbers so
 * a client can display "correct: +1, wrong: -1/3" before the student
 * answers.
 */
export function describeMarking(item: Pick<GateItem, 'kind' | 'marks'>, marking?: MarkingScheme): {
  marks_correct: number;
  marks_wrong: number;
} {
  if (item.kind === 'mcq') {
    return { marks_correct: item.marks, marks_wrong: -mcqNegativeMarks(item.marks, marking) };
  }
  return { marks_correct: item.marks, marks_wrong: 0 };
}
