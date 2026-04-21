// @ts-nocheck
/**
 * Lesson Routes — HTTP surface for the Lesson subsystem.
 *
 * Endpoints:
 *   POST /api/lesson/compose          — Build a personalized lesson
 *   GET  /api/lesson/:concept_id      — Anonymous base lesson (no personalization)
 *   POST /api/lesson/engagement       — Log an engagement signal (to telemetry)
 *   POST /api/lesson/review-today     — Given a student's visit map, return due concepts
 *   POST /api/lesson/advance-sm2      — Compute the next SM-2 state for a visit
 *
 * All routes are stateless — student state is passed in on each request
 * (sourced from the client's IndexedDB). This preserves the DB-less
 * architecture.
 */

import { ServerResponse } from 'http';
import { resolveSources } from '../lessons/source-resolver';
import { composeBase } from '../lessons/composer';
import { personalize } from '../lessons/personalizer';
import {
  updateVisitState,
  findDueReviews,
  inferQualityFromEngagement,
} from '../lessons/spaced-scheduler';
import { resolveContent } from '../content/resolver';
import { recordTelemetry } from '../content/telemetry';
import { recordSignal } from '../curriculum/quality-aggregator';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import type { LessonRequest, Lesson } from '../lessons/types';

interface ParsedRequest {
  pathname: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}
type RouteHandler = (req: ParsedRequest, res: ServerResponse) => Promise<void>;

function sendJSON(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}
function sendError(res: ServerResponse, status: number, msg: string) {
  sendJSON(res, { error: msg }, status);
}

// ============================================================================
// Related-problems recommender — uses the 4-tier content resolver
// ============================================================================

/**
 * For a given concept, pick 2-3 related practice problems:
 *  - same concept, slightly harder (push the ZPD)
 *  - interleaved: a different concept in the same topic
 *  - prerequisite review: if there's a known weak prereq
 */
async function buildRelatedProblems(
  concept_id: string,
  student?: LessonRequest['student'],
): Promise<Lesson['related_problems']> {
  const out: NonNullable<Lesson['related_problems']> = [];

  const concept = ALL_CONCEPTS.find(c => c.id === concept_id);
  if (!concept) return out;

  const studentMastery = student?.mastery_by_concept?.[concept_id] ?? 0.5;

  // 1. Same concept, slightly harder
  try {
    const r1 = await resolveContent({
      intent: 'practice',
      concept_id,
      difficulty: Math.min(0.9, Math.max(0.3, studentMastery + 0.15)),
      max_tier: 0,
    });
    if (r1.problem) {
      out.push({
        id: r1.problem.id,
        concept_id: r1.problem.concept_id || concept_id,
        question_text: r1.problem.question_text,
        difficulty: r1.problem.difficulty ?? 0.5,
        relationship: 'same-concept-harder',
        source: r1.source,
        wolfram_verified: !!r1.wolfram_verified,
      });
    }
  } catch { /* skip */ }

  // 2. Interleaved — a different concept in the same topic
  const interleaveCandidates = ALL_CONCEPTS
    .filter(c => c.topic === concept.topic && c.id !== concept_id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  for (const cand of interleaveCandidates) {
    try {
      const r2 = await resolveContent({
        intent: 'practice',
        concept_id: cand.id,
        difficulty: 0.45,
        max_tier: 0,
      });
      if (r2.problem) {
        out.push({
          id: r2.problem.id,
          concept_id: r2.problem.concept_id || cand.id,
          question_text: r2.problem.question_text,
          difficulty: r2.problem.difficulty ?? 0.5,
          relationship: 'interleaved',
          source: r2.source,
          wolfram_verified: !!r2.wolfram_verified,
        });
        break;
      }
    } catch { /* skip */ }
  }

  // 3. Prerequisite review — only if student has a low-mastery prereq
  if (student?.mastery_by_concept) {
    const weakPrereqs = (concept.prerequisites || [])
      .filter(pid => (student.mastery_by_concept![pid] ?? 0.5) < 0.5);
    if (weakPrereqs.length > 0) {
      try {
        const r3 = await resolveContent({
          intent: 'practice',
          concept_id: weakPrereqs[0],
          difficulty: 0.3,
          max_tier: 0,
        });
        if (r3.problem) {
          out.push({
            id: r3.problem.id,
            concept_id: r3.problem.concept_id || weakPrereqs[0],
            question_text: r3.problem.question_text,
            difficulty: r3.problem.difficulty ?? 0.3,
            relationship: 'prerequisite-review',
            source: r3.source,
            wolfram_verified: !!r3.wolfram_verified,
          });
        }
      } catch { /* skip */ }
    }
  }

  return out;
}

// ============================================================================
// Handler: compose lesson (personalized)
// ============================================================================

async function handleCompose(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  if (!body.concept_id || typeof body.concept_id !== 'string') {
    return sendError(res, 400, 'concept_id required');
  }

  const lessonReq: LessonRequest = {
    concept_id: body.concept_id,
    session_id: body.session_id,
    student: body.student,
    force_full: body.force_full === true,
    user_material_chunks: Array.isArray(body.user_material_chunks) ? body.user_material_chunks : [],
  };

  try {
    const sources = await resolveSources(lessonReq);
    const base = composeBase(sources);

    // Personalize only if force_full is false
    const personalized = lessonReq.force_full
      ? base
      : personalize(base, lessonReq.student);

    // Attach related problems (leverages existing resolver)
    personalized.related_problems = await buildRelatedProblems(
      lessonReq.concept_id,
      lessonReq.student,
    );

    // Attach next-review date if student has prior visits
    const visit = lessonReq.student?.last_lesson_visit?.[lessonReq.concept_id];
    if (visit) {
      const next = new Date(visit.last_visited_at);
      next.setDate(next.getDate() + visit.sm2_interval_days);
      personalized.next_review_at = next.toISOString();
    }

    // Record as a telemetry event so Content Admin dashboard sees lesson traffic
    recordTelemetry({
      source: 'tier-0-bundle-exact',
      latency_ms: 0,
      cost_usd: 0,
      topic: personalized.topic,
      concept_id: personalized.concept_id,
      tier_requested: 0,
      wolfram_verified: personalized.components.some(
        c => (c as any).wolfram_verified === true,
      ),
    });

    sendJSON(res, personalized);
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

// ============================================================================
// Handler: GET anonymous base lesson
// ============================================================================

async function handleGetBase(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const concept_id = req.params.concept_id;
  if (!concept_id) return sendError(res, 400, 'concept_id required');
  try {
    const sources = await resolveSources({ concept_id });
    const base = composeBase(sources);
    sendJSON(res, base);
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

// ============================================================================
// Handler: engagement signal logging
// ============================================================================

async function handleEngagement(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  if (!body.concept_id || !body.component_kind || !body.event) {
    return sendError(res, 400, 'concept_id, component_kind, event required');
  }
  const validEvents = new Set(['viewed', 'revealed', 'completed', 'skipped']);
  if (!validEvents.has(body.event)) {
    return sendError(res, 400, `event must be one of: ${[...validEvents].join(', ')}`);
  }

  // Feed the curriculum quality aggregator — this is the compounding loop
  // link. Every engagement signal now rolls up into component-level quality
  // scores that the admin dashboard surfaces.
  recordSignal({
    concept_id: body.concept_id,
    component_kind: body.component_kind,
    event: body.event,
    timestamp: new Date().toISOString(),
    correct: body.correct,
    duration_ms: body.duration_ms,
    session_id: body.session_id,
  });

  // Also log to content telemetry (pre-existing — admin dashboard traffic)
  recordTelemetry({
    source: 'tier-0-bundle-exact',
    latency_ms: 0,
    cost_usd: 0,
    topic: typeof body.topic === 'string' ? body.topic : undefined,
    concept_id: body.concept_id,
    tier_requested: 0,
    wolfram_verified: false,
  });
  sendJSON(res, { ok: true });
}

// ============================================================================
// Handler: find-due-reviews
// ============================================================================

async function handleReviewToday(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  const last_lesson_visit = body.last_lesson_visit || body.student?.last_lesson_visit;
  const suggestions = findDueReviews(last_lesson_visit, new Date());
  // Enrich with concept labels for display
  const enriched = suggestions.slice(0, 10).map(s => {
    const c = ALL_CONCEPTS.find(x => x.id === s.concept_id);
    return {
      ...s,
      concept_label: c?.label ?? s.concept_id,
      topic: c?.topic ?? 'unknown',
    };
  });
  sendJSON(res, { suggestions: enriched });
}

// ============================================================================
// Handler: advance SM-2 state
// ============================================================================

async function handleAdvanceSM2(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  if (!body.concept_id) return sendError(res, 400, 'concept_id required');

  const quality = body.quality !== undefined
    ? Math.max(0, Math.min(4, Math.round(body.quality)))
    : inferQualityFromEngagement({
        micro_exercise_correct: body.micro_exercise_correct,
        micro_exercise_duration_ms: body.micro_exercise_duration_ms,
        explicit_difficulty_rating: body.explicit_difficulty_rating,
        skipped_components_count: body.skipped_components_count,
        completed_components_count: body.completed_components_count,
      });

  const nextState = updateVisitState(body.prev_state || null, { quality });
  sendJSON(res, { concept_id: body.concept_id, state: nextState, inferred_quality: quality });
}

// ============================================================================
// Export
// ============================================================================

export const lessonRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST', path: '/api/lesson/compose', handler: handleCompose },
  { method: 'GET', path: '/api/lesson/:concept_id', handler: handleGetBase },
  { method: 'POST', path: '/api/lesson/engagement', handler: handleEngagement },
  { method: 'POST', path: '/api/lesson/review-today', handler: handleReviewToday },
  { method: 'POST', path: '/api/lesson/advance-sm2', handler: handleAdvanceSM2 },
];
