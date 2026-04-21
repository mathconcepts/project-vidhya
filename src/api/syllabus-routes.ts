// @ts-nocheck
/**
 * Syllabus Routes
 *
 * HTTP surface for the syllabus generator. Stateless — student state is
 * passed in the request (from IndexedDB on the client side) or retrieved
 * from the opt-in aggregate if the client shares a session_id.
 *
 * Endpoints:
 *   GET  /api/syllabus/exams               — list supported exams + allowed scopes
 *   GET  /api/syllabus/exams/:id           — single exam detail
 *   POST /api/syllabus/generate            — produce a personalized syllabus
 *   GET  /api/syllabus/sources/:concept    — curated sources for one concept
 */

import { ServerResponse } from 'http';
import { listExams, getExam } from '../syllabus/exam-catalog';
import { generateSyllabus } from '../syllabus/generator';
import { getSourcesForConcept } from '../syllabus/source-catalog';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import type { ExamScope } from '../syllabus/types';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { requireAuth } from '../auth/middleware';
import { getOrCreateStudentModel } from '../gbrain/student-model';
import { getExamContextForStudent } from '../gbrain/exam-context';

async function handleListExams(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  sendJSON(res, { exams: listExams() });
}

async function handleGetExam(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const id = req.params.id;
  if (!id) return sendError(res, 400, 'id required');
  const exam = getExam(id);
  if (!exam) return sendError(res, 404, `Unknown exam: ${id}`);
  sendJSON(res, exam);
}

async function handleGenerate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  if (!body.exam_id) return sendError(res, 400, 'exam_id required');
  if (!body.scope) return sendError(res, 400, 'scope required');

  try {
    const syllabus = generateSyllabus(
      {
        exam_id: body.exam_id,
        scope: body.scope as ExamScope,
        target_date: body.target_date,
        daily_minutes: body.daily_minutes,
        topic_filter: body.topic_filter,
        max_concepts: body.max_concepts,
        session_id: body.session_id,
      },
      body.student || {},
    );
    sendJSON(res, syllabus);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

async function handleConceptSources(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const conceptId = req.params.concept;
  if (!conceptId) return sendError(res, 400, 'concept id required');

  const concept = ALL_CONCEPTS.find(c => c.id === conceptId);
  if (!concept) return sendError(res, 404, `Unknown concept: ${conceptId}`);

  const scope = (req.query.get('scope') as ExamScope) || 'mcq-rigorous';
  const sources = getSourcesForConcept(concept.id, concept.topic, concept.label, scope);
  sendJSON(res, { concept_id: conceptId, scope, sources });
}

/**
 * v2.13.0: GET /api/syllabus/me
 *
 * Overlays the student's per-concept mastery on their assigned exam's
 * syllabus. Returns each concept with mastery score + attempts + tier
 * (mastered / in_progress / struggling / untouched) so clients can
 * render "where you stand" per-concept without doing per-concept
 * mastery lookups themselves.
 *
 * This is the syllabus-view counterpart to /api/me/gbrain-summary —
 * same GBrain data, reshaped around the student's exam scope.
 */
async function handleMySyllabus(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const examCtx = await getExamContextForStudent(auth.user.id);
  if (!examCtx) {
    return sendJSON(res, {
      has_exam: false,
      message: 'No exam assigned. Assign an exam to see per-concept mastery overlay.',
    });
  }

  const model = await getOrCreateStudentModel(auth.user.id).catch(() => null);
  const vec = model?.mastery_vector || {};

  // Resolve scope of concepts — either exam's syllabus_topic_ids
  // expanded to concepts, or the full concept graph if no syllabus defined
  const topicSet = new Set(examCtx.syllabus_topic_ids || []);
  const scopedConcepts = topicSet.size > 0
    ? ALL_CONCEPTS.filter((c: any) => topicSet.has(c.topic))
    : ALL_CONCEPTS;

  let mastered = 0, in_progress = 0, struggling = 0, untouched = 0;
  const overlaid = scopedConcepts.map((c: any) => {
    const entry = vec[c.id];
    const score = entry?.score;
    const attempts = entry?.attempts || 0;
    let tier: 'mastered' | 'in_progress' | 'struggling' | 'untouched';
    if (!entry || attempts === 0) {
      tier = 'untouched';
      untouched++;
    } else if (score >= 0.8) {
      tier = 'mastered';
      mastered++;
    } else if (score < 0.3 && attempts >= 2) {
      tier = 'struggling';
      struggling++;
    } else {
      tier = 'in_progress';
      in_progress++;
    }
    return {
      concept_id: c.id,
      label: c.label,
      topic: c.topic,
      score: score ?? null,
      attempts,
      tier,
      exam_weight: examCtx.topic_weights?.[c.topic],
    };
  });

  // Sort: struggling first (needs attention), then in_progress by
  // exam weight desc, then untouched by exam weight desc, then mastered
  overlaid.sort((a, b) => {
    const tierRank = { struggling: 0, in_progress: 1, untouched: 2, mastered: 3 };
    if (tierRank[a.tier] !== tierRank[b.tier]) return tierRank[a.tier] - tierRank[b.tier];
    return (b.exam_weight || 0) - (a.exam_weight || 0);
  });

  sendJSON(res, {
    has_exam: true,
    exam_name: examCtx.exam_name,
    exam_id: examCtx.exam_id,
    days_to_exam: examCtx.days_to_exam,
    total_concepts: overlaid.length,
    mastered_count: mastered,
    in_progress_count: in_progress,
    struggling_count: struggling,
    untouched_count: untouched,
    concepts: overlaid,
  });
}

export const syllabusRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET', path: '/api/syllabus/exams', handler: handleListExams },
  { method: 'GET', path: '/api/syllabus/exams/:id', handler: handleGetExam },
  { method: 'GET', path: '/api/syllabus/me', handler: handleMySyllabus },
  { method: 'POST', path: '/api/syllabus/generate', handler: handleGenerate },
  { method: 'GET', path: '/api/syllabus/sources/:concept', handler: handleConceptSources },
];
