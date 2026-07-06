// @ts-nocheck
/**
 * GBrain — Adaptive Problem Generation (Pillar 4)
 *
 * Generates infinite practice calibrated to the student's exact gaps.
 * Not random problems — problems synthesized to target specific
 * concept × error-type × difficulty intersections.
 *
 * Pipeline:
 *   1. Student Model → identify gap (concept + error type)
 *   2. Check cache for matching generated problem
 *   3. If miss: Generate via Gemini with constraints
 *   4. Verify generated problem via self-check
 *   5. Cache for future students
 *   6. Serve to student
 */

import pg from 'pg';
import { getLlmForRole } from '../llm/runtime';
import { CONCEPT_MAP, getConceptsForTopic } from '../constants/concept-graph';
import type { StudentModel } from './student-model';
import { getZPDConcept, getTopicMastery } from './student-model';
import type { ErrorType } from './error-taxonomy';
import { deriveMarking, type DerivedMarking } from './marking-derivation';

const { Pool } = pg;

let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return _pool;
}

// ============================================================================
// Types
// ============================================================================

export interface GeneratedProblem {
  id: string;
  concept_id: string;
  topic: string;
  difficulty: number;
  question_text: string;
  correct_answer: string;
  solution_steps: string[];
  distractors: string[];
  target_error_type: string | null;
  target_misconception: string | null;
  verified: boolean;
  /** Wave 10 — migrations 032/033 marking, authored at generation time (see marking-derivation.ts). */
  question_type?: 'mcq' | 'msq' | 'nat' | null;
  marks?: number | null;
  options?: string[] | null;
  answer_index?: number | null;
  answer_indices?: number[] | null;
  answer_range?: [number, number] | null;
  /** msq only (Wave 11): the full correct set; correct_answer column stores its JSON. */
  correct_answers?: string[] | null;
}

export interface ProblemRequest {
  sessionId: string;
  topic?: string;
  conceptId?: string;
  difficulty?: number;        // 0-1, overrides adaptive selection
  targetErrorType?: ErrorType;
  targetMisconception?: string;
  count?: number;             // default 1
  format?: 'mcq' | 'msq' | 'numerical' | 'open'; // default 'numerical' (GATE style)
}

// ============================================================================
// Problem Generation
// ============================================================================

const PROBLEM_GEN_PROMPT = `You are a GATE Engineering Mathematics problem generator.
Generate a problem that is mathematically rigorous, exam-appropriate, and targets a specific learning gap.

CRITICAL: The problem MUST have a definite correct answer. Verify your answer by solving the problem yourself.

Respond ONLY with JSON (no markdown, no backticks):
{
  "question_text": "The complete problem statement using LaTeX ($..$ inline, $$...$$ display)",
  "correct_answer": "The exact numerical or symbolic answer",
  "solution_steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "distractors": ["wrong answer 1", "wrong answer 2", "wrong answer 3"],
  "verification": "Brief re-solve to confirm the answer is correct"
}

Problem constraints:
- GATE Engineering Mathematics level
- Must be solvable in 2-5 minutes
- Use standard mathematical notation (LaTeX)
- Numerical answers should be clean (integers or simple fractions when possible)
- Distractors should be plausible wrong answers that correspond to common mistakes`;

/**
 * Generate adaptive practice problems for a student.
 */
export async function generateProblems(
  request: ProblemRequest,
  studentModel: StudentModel,
): Promise<GeneratedProblem[]> {
  const count = request.count || 1;
  const problems: GeneratedProblem[] = [];

  for (let i = 0; i < count; i++) {
    // Determine what to generate
    const target = selectTarget(request, studentModel);

    // Check cache first
    const cached = await findCachedProblem(target);
    if (cached) {
      problems.push(cached);
      // Update usage stats
      updateProblemStats(cached.id).catch(() => {});
      continue;
    }

    // Generate new problem
    const generated = await generateSingleProblem(target, request.format || 'numerical');
    if (generated) {
      // Self-verify
      const verified = await selfVerifyProblem(generated);
      generated.verified = verified;

      if (verified) {
        // Cache it
        const saved = await cacheProblem(generated);
        problems.push(saved);
      } else {
        // Try once more with a fresh generation
        const retry = await generateSingleProblem(target, request.format || 'numerical');
        if (retry) {
          const retryVerified = await selfVerifyProblem(retry);
          retry.verified = retryVerified;
          if (retryVerified) {
            const saved = await cacheProblem(retry);
            problems.push(saved);
          }
        }
      }
    }
  }

  return problems;
}

/** Select what concept + difficulty + error type to target */
function selectTarget(
  request: ProblemRequest,
  model: StudentModel,
): { conceptId: string; topic: string; difficulty: number; errorType: string | null; misconception: string | null } {
  let conceptId = request.conceptId || null;
  let topic = request.topic || null;
  let difficulty = request.difficulty || 0.5;

  // If topic specified but not concept, find ZPD concept
  if (topic && !conceptId) {
    conceptId = getZPDConcept(model, topic);
    if (!conceptId) {
      // Fallback: pick the lowest-mastery concept in the topic
      const concepts = getConceptsForTopic(topic);
      const sorted = concepts
        .map(c => ({ id: c.id, score: model.mastery_vector[c.id]?.score ?? 0 }))
        .sort((a, b) => a.score - b.score);
      conceptId = sorted[0]?.id || concepts[0]?.id;
    }
  }

  // If neither specified, find the highest-priority gap
  if (!conceptId && !topic) {
    const allEntries = Object.entries(model.mastery_vector)
      .filter(([_, e]) => e.score >= 0.15 && e.score <= 0.7)
      .sort((a, b) => a[1].score - b[1].score);

    if (allEntries.length > 0) {
      conceptId = allEntries[0][0];
    } else {
      // No data yet — start with a common high-frequency concept
      conceptId = 'derivatives-basic';
    }
  }

  // Resolve topic from concept
  if (conceptId && !topic) {
    topic = CONCEPT_MAP.get(conceptId)?.topic || 'calculus';
  }

  // Adaptive difficulty
  if (!request.difficulty && conceptId) {
    const mastery = model.mastery_vector[conceptId]?.score ?? 0.3;
    difficulty = Math.max(0.2, Math.min(0.8, mastery + 0.1));
  }

  return {
    conceptId: conceptId || 'derivatives-basic',
    topic: topic || 'calculus',
    difficulty,
    errorType: request.targetErrorType || null,
    misconception: request.targetMisconception || null,
  };
}

/** Find a cached problem matching the target */
async function findCachedProblem(target: {
  conceptId: string;
  difficulty: number;
  errorType: string | null;
}): Promise<GeneratedProblem | null> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT * FROM generated_problems
     WHERE concept_id = $1
       AND verified = true
       AND ABS(difficulty - $2) < 0.15
       ${target.errorType ? 'AND target_error_type = $3' : ''}
     ORDER BY times_served ASC, RANDOM()
     LIMIT 1`,
    target.errorType
      ? [target.conceptId, target.difficulty, target.errorType]
      : [target.conceptId, target.difficulty],
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/** Generate a single problem via Gemini */
async function generateSingleProblem(
  target: { conceptId: string; topic: string; difficulty: number; errorType: string | null; misconception: string | null },
  format: string,
): Promise<GeneratedProblem | null> {
  const llm = await getLlmForRole('json');
  if (!llm) return null;

  const concept = CONCEPT_MAP.get(target.conceptId);
  const difficultyLabel = target.difficulty < 0.33 ? 'easy' : target.difficulty < 0.66 ? 'medium' : 'hard';

  let targeting = '';
  if (target.errorType) {
    targeting += `\nThis problem should specifically test for the "${target.errorType}" error type — design it so a student making this type of error would get a specific wrong answer.`;
  }
  if (target.misconception) {
    targeting += `\nTarget misconception: "${target.misconception}" — the problem should distinguish correct understanding from this misconception.`;
  }

  const formatLabel = format === 'mcq' ? 'multiple choice (exactly ONE correct option)'
    : format === 'msq' ? 'multiple select (TWO OR THREE correct options)'
    : 'numerical answer';
  const msqSchemaOverride = format === 'msq' ? `

For this MULTIPLE SELECT problem, replace "correct_answer" in the JSON with:
  "correct_answers": ["correct option 1", "correct option 2", ...]   // 2-3 entries, each independently correct
and make "distractors" 1-2 plausible WRONG options, distinct from every correct answer.` : '';

  const prompt = `${PROBLEM_GEN_PROMPT}${msqSchemaOverride}

Generate a ${difficultyLabel} difficulty ${formatLabel} problem on:
Topic: ${concept?.label || target.conceptId}
Description: ${concept?.description || ''}
Difficulty: ${difficultyLabel} (${Math.round(target.difficulty * 100)}%)${targeting}`;

  const text = await llm.generate(prompt);
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Wave 10: author the deterministic marking alongside the content.
    // deriveMarking() returns null when the material can't honestly back
    // a key (symbolic NAT answer, <2 usable distractors, 'open' format) —
    // the row is then cached unmarked and serves as display-only practice.
    const correctAnswers: string[] | null = format === 'msq' && Array.isArray(parsed.correct_answers)
      ? parsed.correct_answers.map((c: unknown) => String(c))
      : null;

    const marking: DerivedMarking | null = deriveMarking({
      format,
      correctAnswer: parsed.correct_answer,
      correctAnswers: correctAnswers ?? undefined,
      distractors: parsed.distractors || [],
      difficulty: target.difficulty,
    });

    // msq with unusable material (deriveMarking refused) is worthless as a
    // display-only row too — the student can't even self-check a set. Drop it.
    if (format === 'msq' && !marking) {
      console.error('[gbrain/problem-gen] msq generation produced unusable marking material, dropping');
      return null;
    }

    return {
      id: '',
      concept_id: target.conceptId,
      topic: target.topic,
      difficulty: target.difficulty,
      question_text: parsed.question_text,
      // msq: the TEXT NOT NULL column stores the canonical JSON of the set.
      correct_answer: correctAnswers ? JSON.stringify(correctAnswers) : parsed.correct_answer,
      solution_steps: parsed.solution_steps || [],
      distractors: parsed.distractors || [],
      target_error_type: target.errorType,
      target_misconception: target.misconception,
      verified: false,
      question_type: marking?.question_type ?? null,
      marks: marking?.marks ?? null,
      options: marking?.options ?? null,
      answer_index: marking?.answer_index ?? null,
      answer_indices: marking?.answer_indices ?? null,
      answer_range: marking?.answer_range ?? null,
      correct_answers: correctAnswers,
    };
  } catch (err) {
    console.error('[gbrain/problem-gen] Bad JSON from LLM:', (err as Error).message);
    return null;
  }
}

/** Self-verify a generated problem by re-solving it */
async function selfVerifyProblem(problem: GeneratedProblem): Promise<boolean> {
  const llm = await getLlmForRole('chat');
  if (!llm) return true; // skip verification if no LLM provider

  const isMsq = problem.question_type === 'msq' && Array.isArray(problem.correct_answers);

  const prompt = isMsq
    ? `Solve this multiple-select problem independently. Do NOT look at any provided answer.

Problem: ${problem.question_text}

Candidate options:
${(problem.options ?? []).map((o, i) => `${i + 1}. ${o}`).join('\n')}

Decide independently which options are correct (there may be several).
At the end, respond with EXACTLY one line: ANSWER: <the correct options, verbatim, separated by " | ">`
    : `Solve this math problem independently. Do NOT look at any provided answer.

Problem: ${problem.question_text}

Solve step by step, then give your final answer.
At the end, respond with EXACTLY one line: ANSWER: <your answer>`;

  const text = await llm.generate(prompt);
  if (!text) return false;
  try {
    // Extract answer
    const answerMatch = text.match(/ANSWER:\s*(.+)/i);
    if (!answerMatch) return false;

    const verifiedAnswer = answerMatch[1].trim();

    // msq: compare as normalized SETS — order-free, exact membership.
    if (isMsq) {
      const norm = (x: string) => x.replace(/\s+/g, ' ').replace(/\$/g, '').trim().toLowerCase();
      const want = new Set((problem.correct_answers as string[]).map(norm));
      const got = new Set(verifiedAnswer.split('|').map(norm).filter(Boolean));
      return want.size === got.size && [...want].every(w => got.has(w));
    }

    // Compare (fuzzy: normalize whitespace, trim, compare numerically if possible)
    const expected = problem.correct_answer.trim();
    const actual = verifiedAnswer.trim();

    // Exact match
    if (expected === actual) return true;

    // Numeric comparison
    const numExpected = parseFloat(expected);
    const numActual = parseFloat(actual);
    if (!isNaN(numExpected) && !isNaN(numActual)) {
      return Math.abs(numExpected - numActual) < 0.001;
    }

    // Normalized string comparison
    const normalize = (s: string) => s.replace(/\s+/g, '').replace(/\$/g, '').toLowerCase();
    return normalize(expected) === normalize(actual);
  } catch (err) {
    console.error('[gbrain/problem-gen] Verification failed:', (err as Error).message);
    return false;
  }
}

/** Cache a generated problem in the database */
async function cacheProblem(problem: GeneratedProblem): Promise<GeneratedProblem> {
  const pool = getPool();

  // Marking columns exist from migrations 032/033 (applied by
  // auto-migrate at boot); NULLs are the honest "unmarked" state.
  const result = await pool.query(
    `INSERT INTO generated_problems
     (concept_id, topic, difficulty, question_text, correct_answer,
      solution_steps, distractors, target_error_type, target_misconception,
      verified, verification_method, verification_confidence,
      question_type, marks, options, answer_index, answer_indices, answer_range)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'gemini-self-check', 0.85,
             $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      problem.concept_id, problem.topic, problem.difficulty,
      problem.question_text, problem.correct_answer,
      JSON.stringify(problem.solution_steps), JSON.stringify(problem.distractors),
      problem.target_error_type, problem.target_misconception,
      problem.verified,
      problem.question_type ?? null,
      problem.marks ?? null,
      problem.options ? JSON.stringify(problem.options) : null,
      problem.answer_index ?? null,
      problem.answer_indices ? JSON.stringify(problem.answer_indices) : null,
      problem.answer_range ? JSON.stringify(problem.answer_range) : null,
    ],
  );

  return result.rows[0];
}

/** Update usage stats for a served problem */
async function updateProblemStats(problemId: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    'UPDATE generated_problems SET times_served = times_served + 1 WHERE id = $1',
    [problemId],
  );
}

/** Record that a student answered a generated problem (for empirical difficulty calibration) */
export async function recordProblemAttempt(
  problemId: string,
  wasCorrect: boolean,
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE generated_problems SET
       times_correct = times_correct + $2::int,
       empirical_difficulty = CASE
         WHEN times_served > 0 THEN 1.0 - (times_correct + $2::int)::float / (times_served + 1)
         ELSE difficulty
       END
     WHERE id = $1`,
    [problemId, wasCorrect ? 1 : 0],
  );
}
