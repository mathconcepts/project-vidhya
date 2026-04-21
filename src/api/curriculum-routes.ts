// @ts-nocheck
/**
 * Curriculum Routes — admin + integration HTTP surface
 *
 * Endpoints:
 *   GET  /api/curriculum/exams              — list all exams
 *   GET  /api/curriculum/exam/:id           — one exam definition
 *   GET  /api/curriculum/concept/:id        — how a concept appears across exams
 *   POST /api/curriculum/guardrail-check    — evaluate a chunk against an exam
 *   GET  /api/curriculum/gaps/:exam_id      — content gaps for an exam
 *   POST /api/curriculum/gaps/cross         — cross-exam gap rollup
 *   GET  /api/curriculum/quality            — current quality snapshot
 *   GET  /api/curriculum/quality/trend      — iteration-over-iteration trend
 *   POST /api/curriculum/quality/signal     — ingest a signal (also writable via /api/lesson/engagement)
 *   POST /api/curriculum/quality/close-iteration — freeze current, start next
 *   POST /api/curriculum/reload             — reload exam YAMLs (dev)
 */

import { ServerResponse } from 'http';
import {
  loadAllExams,
  getExam,
  listExamIds,
} from '../curriculum/exam-loader';
import {
  getExamsForConcept,
  summarizeSharedConcept,
  resetCurriculumCache,
} from '../curriculum/concept-exam-map';
import { checkChunkAgainstExam } from '../curriculum/guardrails';
import { analyzeExamGaps, rollUpGapsAcrossExams } from '../curriculum/gap-analyzer';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import {
  recordSignal,
  getCurrentQualityView,
  getIterationTrend,
  getFlaggedComponents,
  closeIterationAndStartNext,
} from '../curriculum/quality-aggregator';

// ============================================================================
// Exam catalog
// ============================================================================

async function handleListExams(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ids = listExamIds();
  const summaries = ids.map(id => {
    const e = getExam(id)!;
    return {
      id,
      name: e.metadata.name,
      conducting_body: e.metadata.conducting_body,
      scope: e.metadata.scope,
      total_marks: e.metadata.total_marks,
      concept_count: e.concept_links.length,
      section_count: e.syllabus.length,
    };
  });
  sendJSON(res, { exams: summaries });
}

async function handleGetExam(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const exam = getExam(req.params.id);
  if (!exam) return sendError(res, 404, 'exam not found');
  sendJSON(res, exam);
}

// ============================================================================
// Concept ↔ exam lookup
// ============================================================================

async function handleGetConceptExams(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const concept_id = req.params.id;
  if (!concept_id) return sendError(res, 400, 'concept_id required');
  sendJSON(res, summarizeSharedConcept(concept_id));
}

// ============================================================================
// Guardrail — evaluate a chunk
// ============================================================================

async function handleGuardrailCheck(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  const text = body.text;
  const exam_id = body.exam_id;
  if (typeof text !== 'string' || text.length === 0) return sendError(res, 400, 'text required');
  if (typeof exam_id !== 'string') return sendError(res, 400, 'exam_id required');
  const result = checkChunkAgainstExam({ text, exam_id, min_confidence: body.min_confidence });
  sendJSON(res, result);
}

// ============================================================================
// Gap analyzer
// ============================================================================

async function handleGaps(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const exam_id = req.params.exam_id;
  if (!exam_id) return sendError(res, 400, 'exam_id required');
  const analysis = analyzeExamGaps(exam_id);
  if (!analysis) return sendError(res, 404, 'exam not found');
  sendJSON(res, analysis);
}

async function handleCrossGaps(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  const exam_ids = Array.isArray(body.exam_ids) ? body.exam_ids : listExamIds();
  const rollup = rollUpGapsAcrossExams(exam_ids);
  sendJSON(res, { exam_ids, gaps: rollup });
}

// ============================================================================
// Quality aggregation
// ============================================================================

async function handleQuality(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  sendJSON(res, getCurrentQualityView());
}

async function handleQualityTrend(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  sendJSON(res, { trend: getIterationTrend() });
}

async function handleQualitySignal(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  if (!body.concept_id || !body.component_kind || !body.event) {
    return sendError(res, 400, 'concept_id, component_kind, event required');
  }
  recordSignal({
    concept_id: body.concept_id,
    component_kind: body.component_kind,
    event: body.event,
    timestamp: body.timestamp || new Date().toISOString(),
    correct: body.correct,
    duration_ms: body.duration_ms,
    session_id: body.session_id,
  });
  sendJSON(res, { ok: true });
}

async function handleCloseIteration(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  const snapshot = closeIterationAndStartNext();
  sendJSON(res, { closed: snapshot });
}

async function handleFlagged(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  sendJSON(res, { flagged: getFlaggedComponents() });
}

// ============================================================================
// Dev/admin helper
// ============================================================================

async function handleReload(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  resetCurriculumCache();
  sendJSON(res, { reloaded: true, exam_count: loadAllExams(true).size });
}

// ============================================================================
// Export routes
// ============================================================================

export const curriculumRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET',  path: '/api/curriculum/exams',                      handler: handleListExams },
  { method: 'GET',  path: '/api/curriculum/exam/:id',                   handler: handleGetExam },
  { method: 'GET',  path: '/api/curriculum/concept/:id',                handler: handleGetConceptExams },
  { method: 'POST', path: '/api/curriculum/guardrail-check',            handler: handleGuardrailCheck },
  { method: 'GET',  path: '/api/curriculum/gaps/:exam_id',              handler: handleGaps },
  { method: 'POST', path: '/api/curriculum/gaps/cross',                 handler: handleCrossGaps },
  { method: 'GET',  path: '/api/curriculum/quality',                    handler: handleQuality },
  { method: 'GET',  path: '/api/curriculum/quality/trend',              handler: handleQualityTrend },
  { method: 'POST', path: '/api/curriculum/quality/signal',             handler: handleQualitySignal },
  { method: 'POST', path: '/api/curriculum/quality/close-iteration',    handler: handleCloseIteration },
  { method: 'GET',  path: '/api/curriculum/quality/flagged',            handler: handleFlagged },
  { method: 'POST', path: '/api/curriculum/reload',                     handler: handleReload },
];
