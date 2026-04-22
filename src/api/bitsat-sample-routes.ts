// @ts-nocheck
/**
 * BITSAT Mathematics — Live sample HTTP surface
 *
 * Six endpoints that let an evaluator exercise the full stack against
 * real BITSAT Mathematics content.
 *
 *   GET  /api/sample/bitsat/exam          The Exam record (spec, weights, marking)
 *   GET  /api/sample/bitsat/lessons       Manifest of all 19 lesson IDs
 *   GET  /api/sample/bitsat/lesson/:id    Full 8-component lesson (Limits has real content)
 *   GET  /api/sample/bitsat/lesson/:id/rendered?channel=web|telegram|whatsapp|voice
 *                                         Lesson through the rendering framework
 *                                         (exercises v2.11.0-v2.13.0 enrichment)
 *   GET  /api/sample/bitsat/mock          Mock exam: 10 BITSAT-style MCQs
 *   POST /api/sample/bitsat/mock/submit   Body: { answers: [...] }
 *                                         Returns GBrain-shaped analysis
 *   GET  /api/sample/bitsat/strategies    BITSAT-specific preparation strategies
 *
 * No auth required — this is a public sample for evaluation. Real
 * student endpoints (auth-gated) use the same data through the live
 * exam-context + student-model + rendering pipelines.
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import {
  BITSAT_EXAM,
  LESSON_LIMITS,
  LESSON_MANIFEST,
  BITSAT_MOCK_EXAM,
  BITSAT_STRATEGIES,
  scoreMockExam,
  type MockAttemptInput,
} from '../samples/bitsat-mathematics';
import { enrichLesson, inferDominantType, type EnrichmentContext } from '../rendering/lesson-enrichment';
import { renderLesson } from '../rendering/channel-renderer';
import type { DeliveryChannel } from '../rendering/types';

// ============================================================================

async function handleExam(req: ParsedRequest, res: ServerResponse): Promise<void> {
  sendJSON(res, { exam: BITSAT_EXAM });
}

async function handleLessons(req: ParsedRequest, res: ServerResponse): Promise<void> {
  sendJSON(res, {
    manifest: LESSON_MANIFEST,
    total: LESSON_MANIFEST.length,
    full: LESSON_MANIFEST.filter(m => m.status === 'full').length,
    stub: LESSON_MANIFEST.filter(m => m.status === 'stub').length,
    note:
      'The "full" lesson (Limits of a Function) has complete 8-component content with ' +
      'worked examples, traps, connections. Stubs are placeholders with accurate titles + ' +
      'topic tags — content authored progressively. The framework accommodates adding ' +
      'full content for any stub without code changes.',
  });
}

async function handleLesson(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const id = req.params.id;
  if (id === LESSON_LIMITS.id) {
    return sendJSON(res, { lesson: LESSON_LIMITS });
  }
  const stub = LESSON_MANIFEST.find(m => m.id === id);
  if (!stub) return sendError(res, 404, `Unknown lesson: ${id}`);
  sendJSON(res, {
    lesson: {
      id: stub.id,
      concept_id: stub.topic,
      title: stub.title,
      status: 'stub',
      components: [],
      note: 'Stub lesson — full 8-component content pending authorship. See Limits of a Function for the full shape.',
    },
  });
}

async function handleLessonRendered(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const id = req.params.id;
  const channelParam = (req.query.get('channel') || 'web').toLowerCase();
  const validChannels: DeliveryChannel[] = ['web', 'telegram', 'whatsapp', 'voice'];
  if (!validChannels.includes(channelParam as DeliveryChannel)) {
    return sendError(res, 400, `invalid channel: ${channelParam}`);
  }

  if (id !== LESSON_LIMITS.id) {
    return sendError(res, 404, 'Only the "lesson-bitsat-limits" has full rendered content in this sample.');
  }

  // Synthesize a realistic EnrichmentContext for BITSAT:
  //   - MCQ-dominant (question_types.mcq = 1.0) → triggers compression + synthesis
  //   - Negative marking → triggers pacing hints
  //   - Optional query params let the evaluator simulate different student states
  const simulateScoreParam = req.query.get('simulate_mastery');
  const simulateScore = simulateScoreParam ? parseFloat(simulateScoreParam) : undefined;
  const simulateSlowParam = req.query.get('simulate_slow');
  const simulateSlow = simulateSlowParam === 'true';

  const ctx: EnrichmentContext = {
    learning_objective: {
      dominant_type: inferDominantType(BITSAT_EXAM.question_types),
      avg_seconds_per_question: 80,                              // realistic BITSAT pacing
      negative_marks_per_wrong: BITSAT_EXAM.marking_scheme.negative_marks_per_wrong,
      is_imminent: false,
      is_close: true,                                             // sample scenario
      days_to_exam: 21,
    },
  };
  if (simulateScore !== undefined) {
    ctx.mastery = {
      concept_score: simulateScore,
      attempts: 12,
      recent_avg_ms: simulateSlow ? 120000 : 50000,
      cohort_median_ms: 60000,
    };
  }

  const enriched = enrichLesson(LESSON_LIMITS, [channelParam], ctx);
  const rendered = renderLesson(enriched, channelParam as DeliveryChannel);

  sendJSON(res, {
    lesson_id: LESSON_LIMITS.id,
    channel: channelParam,
    rendered,
    gbrain_context: {
      dominant_type: ctx.learning_objective?.dominant_type,
      exam_is_close: ctx.learning_objective?.is_close,
      days_to_exam: ctx.learning_objective?.days_to_exam,
      simulated_mastery: ctx.mastery?.concept_score,
      simulated_speed: ctx.mastery?.recent_avg_ms,
      is_slow_for_cohort:
        ctx.mastery?.recent_avg_ms !== undefined &&
        ctx.mastery?.cohort_median_ms !== undefined &&
        ctx.mastery.recent_avg_ms > 1.5 * ctx.mastery.cohort_median_ms,
    },
    enrichment_blocks: Object.keys(enriched.enrichments).length,
    instructions_for_evaluator:
      'Add ?simulate_mastery=0.85 for a confident student (compressed reveal). ' +
      'Add &simulate_slow=true to override with slow-pacing (full reveal returns despite high mastery). ' +
      'Try ?simulate_mastery=0.2 for a struggling student (full reveal preserved).',
  });
}

async function handleMock(req: ParsedRequest, res: ServerResponse): Promise<void> {
  sendJSON(res, {
    mock: BITSAT_MOCK_EXAM,
    rules: {
      marks_per_correct: 3,
      negative_marks_per_wrong: 1,
      marks_per_unattempted: 0,
      total_questions: BITSAT_MOCK_EXAM.questions.length,
      max_score: BITSAT_MOCK_EXAM.questions.length * 3,
      target_time_minutes: 25,
    },
    how_to_submit:
      'POST to /api/sample/bitsat/mock/submit with body { "mock_id": "mock-bitsat-math-01", ' +
      '"answers": [0, 2, null, 1, ...], "seconds_per_question": [62, 88, ...] }. ' +
      'Answers are option indices (0-3); null means skipped. seconds_per_question is optional.',
  });
}

async function handleMockSubmit(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body || {}) as MockAttemptInput;
  if (!body.mock_id || !Array.isArray(body.answers)) {
    return sendError(res, 400, 'Body must include { mock_id, answers: [...] }');
  }
  if (body.mock_id !== BITSAT_MOCK_EXAM.id) {
    return sendError(res, 404, `Unknown mock: ${body.mock_id}`);
  }
  if (body.answers.length !== BITSAT_MOCK_EXAM.questions.length) {
    return sendError(res, 400, `Expected ${BITSAT_MOCK_EXAM.questions.length} answers, got ${body.answers.length}`);
  }

  const analysis = scoreMockExam(body);

  // Also return per-question feedback so the student can learn from wrong answers
  const per_question = BITSAT_MOCK_EXAM.questions.map((q, i) => {
    const ans = body.answers[i];
    const correctIdx = q.options.findIndex(o => o.is_correct);
    return {
      question_id: q.id,
      topic_id: q.topic_id,
      your_answer: ans,
      correct_answer: correctIdx,
      result: ans === null || ans === undefined ? 'skipped'
        : ans === correctIdx ? 'correct' : 'wrong',
      explanation: q.explanation,
      trap_type: q.trap_type,
    };
  });

  sendJSON(res, {
    analysis,
    per_question,
    next_steps: {
      focus_topics: analysis.priority_for_next_session.slice(0, 3),
      recommended_lessons: analysis.priority_for_next_session
        .slice(0, 3)
        .map(topic => LESSON_MANIFEST.find(m => m.topic === topic))
        .filter(Boolean)
        .map(m => ({ lesson_id: m!.id, title: m!.title, status: m!.status })),
      predicted_full_paper_marks: analysis.predicted_full_exam_score,
      predicted_full_paper_max: 120,
    },
  });
}

async function handleStrategies(req: ParsedRequest, res: ServerResponse): Promise<void> {
  sendJSON(res, {
    strategies: BITSAT_STRATEGIES,
    exam_facts: {
      duration_minutes: BITSAT_EXAM.duration_minutes,
      math_section_questions: 40,
      math_section_marks: BITSAT_EXAM.total_marks,
      marking: BITSAT_EXAM.marking_scheme,
      question_type: '100% single-correct MCQ',
      realistic_math_time_budget_minutes: 55,
      target_per_question_seconds: 82,
    },
  });
}

// ============================================================================

export const bitsatSampleRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET',  path: '/api/sample/bitsat/exam',                   handler: handleExam },
  { method: 'GET',  path: '/api/sample/bitsat/lessons',                 handler: handleLessons },
  { method: 'GET',  path: '/api/sample/bitsat/lesson/:id',              handler: handleLesson },
  { method: 'GET',  path: '/api/sample/bitsat/lesson/:id/rendered',     handler: handleLessonRendered },
  { method: 'GET',  path: '/api/sample/bitsat/mock',                    handler: handleMock },
  { method: 'POST', path: '/api/sample/bitsat/mock/submit',             handler: handleMockSubmit },
  { method: 'GET',  path: '/api/sample/bitsat/strategies',              handler: handleStrategies },
];
