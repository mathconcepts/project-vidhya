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

export const syllabusRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET', path: '/api/syllabus/exams', handler: handleListExams },
  { method: 'GET', path: '/api/syllabus/exams/:id', handler: handleGetExam },
  { method: 'POST', path: '/api/syllabus/generate', handler: handleGenerate },
  { method: 'GET', path: '/api/syllabus/sources/:concept', handler: handleConceptSources },
];
