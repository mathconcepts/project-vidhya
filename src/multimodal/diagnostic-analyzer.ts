// @ts-nocheck
/**
 * Diagnostic Analyzer
 *
 * Consumes a single photo of a completed test (question paper with student's
 * answers visible) and produces an ordered list of per-problem results:
 *   { problem_text, student_answer, correct_answer, concept_id, verdict }
 *
 * Then feeds the error signal into the existing syllabus generator to produce
 * a personalized study plan focused on the student's weak spots.
 *
 * Streams results incrementally over SSE as each problem is verified:
 *   event: start      { problem_count }
 *   event: problem    { index, problem_text, student_answer, concept_id, ... }
 *   event: syllabus   { full Syllabus object }
 *   event: done       { total_attempts, correct_count, weak_concepts }
 *   event: error      { error }
 *
 * Streaming matters here because a test page with 10-20 problems means
 * 10-20 Wolfram verifications (1-2s each) — synchronous response would
 * keep the user waiting 30+ seconds with no feedback.
 */

import { ServerResponse } from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ALL_CONCEPTS, CONCEPT_MAP } from '../constants/concept-graph';
import { verifyProblemWithWolfram } from '../services/wolfram-service';
import { generateSyllabus } from '../syllabus/generator';
import { sendSSE } from './sse-stream';
import type { ExamScope } from '../syllabus/types';

// ============================================================================
// Types
// ============================================================================

export interface DiagnosticProblemResult {
  index: number;
  problem_text: string;
  student_answer: string | null;
  correct_answer: string | null;
  concept_id: string | null;
  topic: string | null;
  verdict: 'correct' | 'incorrect' | 'unverifiable' | 'skipped';
  verification_method: 'wolfram' | 'bundle-match' | 'none';
  estimated_difficulty: number;
}

export interface DiagnosticRequest {
  image: string;                // base64
  image_mime_type: string;
  /** Target exam for the syllabus generation step (default: gate-ma) */
  exam_id?: string;
  /** Scope for generated syllabus — default mcq-rigorous */
  scope?: ExamScope;
  /** Session id for personalization + telemetry */
  session_id?: string;
  /** Student snapshot — merged with diagnostic results for final syllabus */
  student?: {
    mastery_by_concept?: Record<string, number>;
    recent_errors?: Array<{ concept_id: string; error_type: string }>;
  };
}

// ============================================================================
// Parse the test image — one Gemini call, returns structured array
// ============================================================================

const VALID_CONCEPT_IDS = new Set(ALL_CONCEPTS.map(c => c.id));
const VALID_TOPICS = new Set(ALL_CONCEPTS.map(c => c.topic));

function buildDiagnosticPrompt(): string {
  return `You are Vidhya's Test Diagnostic. This image shows a student's completed math test. Extract EVERY problem on the page.

For each problem, identify:
  - problem_number (1, 2, 3, ... — use the number shown on the page, or sequential if absent)
  - problem_text: the question itself, LaTeX-preserving
  - student_answer: whatever the student wrote as their final answer (circled, underlined, or in an answer box). null if absent.
  - concept_id (one of: eigenvalues, determinants, matrix-rank, matrix-operations, systems-linear, diagonalization, limits, continuity, differentiability, derivatives-basic, chain-rule, product-quotient-rule, maxima-minima, mean-value-theorems, integration-basics, integration-by-parts, definite-integrals, partial-derivatives, taylor-series, first-order-linear, second-order-linear, bayes-theorem, continuous-distributions, hypothesis-testing, cauchy-riemann, complex-integration, graph-coloring, graph-connectivity, fourier-series, laplace-transform, vector-calculus, gradient, divergence-curl, or null if not in this set)
  - topic: one of calculus, linear-algebra, differential-equations, probability-statistics, complex-variables, numerical-methods, transform-theory, vector-calculus, discrete-mathematics, graph-theory
  - estimated_difficulty: 0.0-1.0

Respond with ONLY a JSON object (no markdown, no prose):
{
  "problems": [
    {
      "problem_number": 1,
      "problem_text": "Find the eigenvalues of [[2,1],[1,2]]",
      "student_answer": "1 and 3",
      "concept_id": "eigenvalues",
      "topic": "linear-algebra",
      "estimated_difficulty": 0.4
    },
    ...
  ]
}

Include EVERY problem even if the student skipped it (student_answer: null).`;
}

interface ParsedProblem {
  problem_number?: number;
  problem_text: string;
  student_answer: string | null;
  concept_id: string | null;
  topic: string | null;
  estimated_difficulty: number;
}

async function parseTestImage(req: DiagnosticRequest): Promise<ParsedProblem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // No LLM — return empty so the handler emits a graceful error
    return [];
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });
    const result = await model.generateContent([
      buildDiagnosticPrompt(),
      { inlineData: { mimeType: req.image_mime_type || 'image/jpeg', data: req.image } },
    ]);
    const parsed = JSON.parse(result.response.text());
    const problems = Array.isArray(parsed.problems) ? parsed.problems : [];

    // Sanitize each problem
    return problems
      .filter((p: any) => typeof p.problem_text === 'string' && p.problem_text.length > 5)
      .map((p: any) => ({
        problem_number: typeof p.problem_number === 'number' ? p.problem_number : undefined,
        problem_text: p.problem_text.slice(0, 2000),
        student_answer: typeof p.student_answer === 'string' ? p.student_answer.slice(0, 500) : null,
        concept_id: typeof p.concept_id === 'string' && VALID_CONCEPT_IDS.has(p.concept_id) ? p.concept_id : null,
        topic: typeof p.topic === 'string' && VALID_TOPICS.has(p.topic) ? p.topic : null,
        estimated_difficulty: Number.isFinite(Number(p.estimated_difficulty))
          ? Math.max(0, Math.min(1, Number(p.estimated_difficulty)))
          : 0.5,
      }))
      .slice(0, 50); // hard cap — a test with >50 problems is extraordinary
  } catch {
    return [];
  }
}

// ============================================================================
// Verify one problem's answer — Wolfram or skip
// ============================================================================

async function verifyProblem(p: ParsedProblem, index: number): Promise<DiagnosticProblemResult> {
  const base = {
    index,
    problem_text: p.problem_text,
    student_answer: p.student_answer,
    concept_id: p.concept_id,
    topic: p.topic,
    estimated_difficulty: p.estimated_difficulty,
  };

  if (!p.student_answer) {
    return {
      ...base,
      correct_answer: null,
      verdict: 'skipped',
      verification_method: 'none',
    };
  }

  // Skip non-numeric / narrative answers where Wolfram won't help
  const likelyNarrative = !/\d|[+\-*/=^√π]/.test(p.student_answer);
  if (likelyNarrative) {
    return {
      ...base,
      correct_answer: null,
      verdict: 'unverifiable',
      verification_method: 'none',
    };
  }

  try {
    const v = await verifyProblemWithWolfram(p.problem_text, p.student_answer);
    return {
      ...base,
      correct_answer: v.wolfram_answer || null,
      verdict: v.verified ? 'correct' : (v.wolfram_answer ? 'incorrect' : 'unverifiable'),
      verification_method: v.wolfram_answer ? 'wolfram' : 'none',
    };
  } catch {
    return {
      ...base,
      correct_answer: null,
      verdict: 'unverifiable',
      verification_method: 'none',
    };
  }
}

// ============================================================================
// Main entry — streams results
// ============================================================================

export async function runDiagnosticStream(
  req: DiagnosticRequest,
  res: ServerResponse,
): Promise<void> {
  const started = Date.now();

  // 1. Parse the image
  sendSSE(res, 'parsing', { message: 'Reading your test page...' });
  const problems = await parseTestImage(req);

  if (problems.length === 0) {
    sendSSE(res, 'error', {
      error: 'I could not find any math problems on this page. Try a clearer photo with better lighting, or crop to the problem area.',
    });
    res.end();
    return;
  }

  sendSSE(res, 'start', {
    problem_count: problems.length,
    message: `Found ${problems.length} problem${problems.length === 1 ? '' : 's'}. Checking your answers...`,
  });

  // 2. Verify each problem in sequence (serial so SSE ordering matches page order)
  const results: DiagnosticProblemResult[] = [];
  for (let i = 0; i < problems.length; i++) {
    const r = await verifyProblem(problems[i], i);
    results.push(r);
    sendSSE(res, 'problem', r);
  }

  // 3. Build the weak-concept list from incorrect + unverifiable attempts with
  //    low-difficulty bias (if student missed an easy one, the signal is stronger)
  const weakConcepts: Record<string, number> = {};
  const correctConcepts: Record<string, number> = {};
  let correctCount = 0;

  for (const r of results) {
    if (!r.concept_id) continue;
    if (r.verdict === 'correct') {
      correctConcepts[r.concept_id] = (correctConcepts[r.concept_id] || 0) + 1;
      correctCount++;
    } else if (r.verdict === 'incorrect') {
      // Weight by inverse of difficulty — missing an easy problem signals bigger gap
      weakConcepts[r.concept_id] = (weakConcepts[r.concept_id] || 0)
        + (1.5 - r.estimated_difficulty);
    }
  }

  // 4. Merge with student's existing mastery signals; add recent_errors from
  //    the diagnostic results so the syllabus generator prioritizes them.
  const diagnosticErrors = results
    .filter(r => r.verdict === 'incorrect' && r.concept_id)
    .map(r => ({ concept_id: r.concept_id!, error_type: 'diagnostic' }));

  const masteryByConcept: Record<string, number> = {
    ...(req.student?.mastery_by_concept || {}),
  };
  // Lower mastery estimate for each concept the student got wrong on this test
  for (const [cid, weight] of Object.entries(weakConcepts)) {
    const prev = masteryByConcept[cid] ?? 0.5;
    masteryByConcept[cid] = Math.max(0.05, prev - 0.2 * Math.min(weight, 2));
  }
  // Raise mastery estimate for correctly answered concepts
  for (const [cid, n] of Object.entries(correctConcepts)) {
    const prev = masteryByConcept[cid] ?? 0.5;
    masteryByConcept[cid] = Math.min(0.95, prev + 0.1 * n);
  }

  // 5. Generate personalized syllabus
  try {
    const syllabus = generateSyllabus(
      {
        exam_id: req.exam_id || 'gate-ma',
        scope: req.scope || 'mcq-rigorous',
        daily_minutes: 60,
        max_concepts: Math.min(20, Object.keys(weakConcepts).length * 3 + 5),
        session_id: req.session_id,
      },
      {
        session_id: req.session_id,
        mastery_by_concept: masteryByConcept,
        recent_errors: [
          ...(req.student?.recent_errors || []),
          ...diagnosticErrors,
        ],
      },
    );
    sendSSE(res, 'syllabus', { syllabus });
  } catch (err) {
    sendSSE(res, 'syllabus_error', { error: (err as Error).message });
  }

  // 6. Summary event with actionable next step
  const incorrectCount = results.filter(r => r.verdict === 'incorrect').length;
  const weakConceptList = Object.entries(weakConcepts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cid]) => cid);

  sendSSE(res, 'done', {
    total_attempts: results.length,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    skipped_count: results.filter(r => r.verdict === 'skipped').length,
    unverifiable_count: results.filter(r => r.verdict === 'unverifiable').length,
    weak_concepts: weakConceptList,
    elapsed_ms: Date.now() - started,
    // The diagnostic always offers the same single next step — dismissible by the UI
    next_step: weakConceptList.length > 0 ? {
      action: 'build_syllabus',
      label: 'View your focused study plan',
      description: `${weakConceptList.length} weak area${weakConceptList.length === 1 ? '' : 's'} identified. Personalized plan ready.`,
      dedupe_key: `diagnostic-syllabus:${weakConceptList.join(',')}`,
      target: {},
    } : null,
  });

  res.end();
}
