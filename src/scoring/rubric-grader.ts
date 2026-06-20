/**
 * src/scoring/rubric-grader.ts — descriptive-answer scoring.
 *
 * Phase 2 of the 100x Blueprint (§3.5, D5). The Extraction-half engine:
 * grade JEE/board subjective answers to maximum potential, with honest
 * partial credit per rubric criterion.
 *
 * The non-negotiables (from §3.5):
 *
 *   1. Rubric as structured JSON.  Each criterion gets its own max
 *      marks; scores are computed PER criterion and summed.
 *   2. RAG-ground.  Pass the official solution / mark scheme into the
 *      LLM as grounding — materially cuts hallucinated grades.
 *   3. CAS-verify the FINAL ANSWER deterministically.  The LLM never
 *      decides whether the number is right — only method and partial
 *      credit.  This is the single most important guardrail in the
 *      module.
 *   4. Reason-then-score.  Internal chain-of-thought, surfaced output
 *      is per-criterion scores + actionable feedback only.
 *   5. Calibrate on 100–200 human-graded samples from the existing
 *      feedback loop. Stored in the calibration table (migration 029).
 *   6. Low-confidence grades route to the teacher-review queue rather
 *      than going out silently.
 *
 * This module is the contract + skeleton; the LLM call goes through
 * the existing LLMClient (src/llm) and the CAS check through the
 * existing AnswerVerifier cascade (src/verification/verifiers).
 */

import type {
  Scorer,
  GradeResult,
  ItemContext,
  StudentId,
} from '../core/interfaces';

// ────────────────────────────────────────────────────────────────────
// Tuneables
// ────────────────────────────────────────────────────────────────────

/** Below this, the grade routes to the teacher queue instead of being final. */
export const TEACHER_QUEUE_CONFIDENCE_THRESHOLD = 0.75;

/** Optional cap on rubric size — keeps prompt tokens bounded. */
export const MAX_RUBRIC_CRITERIA = 12;

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

export interface LLMJudge {
  /**
   * The narrow contract this module needs from the LLM layer: given a
   * prompt + grounding, return a structured per-criterion grade.
   *
   * Implementations wrap `LLMClient.generate()` and parse the JSON
   * response. The parser MUST reject any response that doesn't match
   * the shape — never coerce an unparseable response into a grade.
   */
  gradeRubric(args: {
    studentResponse: string;
    item: ItemContext;
    correlationId?: string;
  }): Promise<{
    perCriterion: Record<string, number>;
    feedback: string;
    confidence: number;
  }>;
}

export interface CASChecker {
  /**
   * Returns true if `studentFinalAnswer` is mathematically equivalent
   * to `expectedAnswer` — handles `1/√2` vs `0.707…` vs `√2/2`.
   * Wraps the existing AnswerVerifier cascade (RAG → SymPy → Wolfram).
   */
  isFinalAnswerCorrect(
    problemContext: string,
    expectedAnswer: string,
    studentFinalAnswer: string
  ): Promise<boolean>;
}

export interface RubricGraderDeps {
  judge: LLMJudge;
  cas: CASChecker;
  /** Optional hook fired when a grade is routed to the human queue. */
  onLowConfidence?: (studentId: StudentId | undefined, grade: GradeResult) => void;
}

// ────────────────────────────────────────────────────────────────────
// Implementation
// ────────────────────────────────────────────────────────────────────

export class RubricGrader implements Scorer {
  readonly kinds = ['descriptive', 'numeric'] as const;

  constructor(private deps: RubricGraderDeps) {}

  async grade(
    studentResponse: string,
    item: ItemContext,
    opts?: { studentId?: StudentId }
  ): Promise<GradeResult> {
    if (!item.rubric || item.rubric.length === 0) {
      throw new Error('RubricGrader requires item.rubric — use a different Scorer for unrubric’d items.');
    }
    if (item.rubric.length > MAX_RUBRIC_CRITERIA) {
      throw new Error(`Rubric exceeds MAX_RUBRIC_CRITERIA (${MAX_RUBRIC_CRITERIA}).`);
    }

    // 1. LLM judges per criterion (method + partial credit only).
    const judged = await this.deps.judge.gradeRubric({
      studentResponse,
      item,
      correlationId: opts?.studentId,
    });

    // 2. Clamp + sanity-check per-criterion scores against rubric maxes.
    const perCriterion: Record<string, number> = {};
    let earned = 0;
    for (const c of item.rubric) {
      const raw = judged.perCriterion[c.id] ?? 0;
      const clamped = Math.max(0, Math.min(c.maxMarks, raw));
      perCriterion[c.id] = clamped;
      earned += clamped;
    }

    // 3. CAS check on the final answer — the deterministic safety net.
    //    The LLM never gets a vote on whether the number is right.
    let casFinalAnswerCorrect = false;
    if (item.expectedAnswer) {
      const studentFinal = extractFinalAnswer(studentResponse);
      casFinalAnswerCorrect = studentFinal
        ? await this.deps.cas.isFinalAnswerCorrect(
            item.officialSolution ?? '',
            item.expectedAnswer,
            studentFinal,
          )
        : false;
    }

    const result: GradeResult = {
      earned,
      max: item.maxMarks,
      perCriterion,
      feedback: judged.feedback,
      confidence: judged.confidence,
      casFinalAnswerCorrect,
    };

    if (result.confidence < TEACHER_QUEUE_CONFIDENCE_THRESHOLD) {
      this.deps.onLowConfidence?.(opts?.studentId, result);
    }

    return result;
  }
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

/**
 * Pull the student's "final answer" out of their free-text response.
 * Looks for common conventions: a boxed answer, an "Answer:" line, or
 * the last numeric/symbolic expression in the response.
 *
 * Intentionally tolerant — the descriptive-answer coach teaches students
 * to box the answer, but we don't penalize unboxed answers at this layer
 * (the coach will). Returns null if no plausible final answer found.
 */
export function extractFinalAnswer(response: string): string | null {
  if (!response) return null;
  // \boxed{...} (LaTeX convention)
  const boxed = /\\boxed\{([^}]+)\}/.exec(response);
  if (boxed) return boxed[1].trim();
  // Answer: ... at the end of the response
  const answerLine = /\banswer\s*[:=]\s*([^\n]+)$/im.exec(response);
  if (answerLine) return answerLine[1].trim();
  // Fallback: last non-empty line if it looks numeric/symbolic.
  const lines = response.trim().split(/\n+/);
  const last = lines[lines.length - 1]?.trim() ?? '';
  if (/[0-9=±√πθ()/\\^]/.test(last) && last.length < 80) return last;
  return null;
}

// ────────────────────────────────────────────────────────────────────
// Convenience: build a RubricGrader wired to the existing infrastructure.
// Concrete LLMJudge + CASChecker implementations live in adapters that
// wrap LLMClient and TieredVerificationOrchestrator respectively. Those
// adapters land in a follow-up wiring PR — landing them here would
// import the full provider stack into a pure-logic module.
// ────────────────────────────────────────────────────────────────────

export function makeRubricGrader(deps: RubricGraderDeps): RubricGrader {
  return new RubricGrader(deps);
}
