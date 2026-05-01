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

/**
 * GET /api/exam/active — the exam this deployment is configured to serve.
 *
 * Resolution order (admin-configurable):
 *   1. process.env.DEFAULT_EXAM_ID — operator picks via Render dashboard
 *      (env var declared in render.yaml as sync:false).
 *   2. First entry from listExamIds() — the only exam loaded, when there's
 *      only one in data/curriculum/.
 *
 * Returns:
 *   - identity: exam_id, name, description
 *   - shape: scope, total_marks, duration_minutes
 *   - context: concept_count, section_count, loaded_count, all_exam_ids
 *   - starter_prompts: 4 chat prompts grounded in this exam's syllabus
 *     (frontend uses these directly so no exam name is hardcoded)
 *
 * Returns 503 when data/curriculum/ is empty — that surfaces as a clear
 * "no exams loaded" message instead of the original "Failed to build session".
 */
async function handleActiveExam(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  const ids = listExamIds();
  if (ids.length === 0) {
    return sendError(res, 503, 'no exams loaded — check data/curriculum/');
  }
  const envExamId = (process.env.DEFAULT_EXAM_ID || '').trim();
  const activeId = envExamId && ids.includes(envExamId) ? envExamId : ids[0];
  const exam = getExam(activeId)!;

  sendJSON(res, {
    exam_id: exam.metadata.id,
    name: exam.metadata.name,
    description: exam.metadata.description,
    conducting_body: exam.metadata.conducting_body,
    scope: exam.metadata.scope,
    total_marks: exam.metadata.total_marks,
    duration_minutes: exam.metadata.duration_minutes,
    concept_count: exam.concept_links.length,
    section_count: exam.syllabus.length,
    loaded_count: ids.length,
    all_exam_ids: ids,
    starter_prompts: buildStarterPrompts(exam),
  });
}

/**
 * Generate 4 chat starter prompts from the exam's syllabus.
 * Picks one popular concept from the first 3 sections plus a strategy prompt.
 * The frontend ChatPage uses these directly — no exam name hardcoded.
 */
function buildStarterPrompts(exam: any): Array<{ text: string; dot: string }> {
  const dots = ['bg-violet-400', 'bg-emerald-400', 'bg-amber-400', 'bg-sky-400'];
  const examShortName = exam.metadata.name.split(' ').slice(0, 3).join(' ');

  const conceptToHumanLabel = (id: string): string =>
    id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  // Pull the first non-empty concept from the first 3 syllabus sections
  const sections = (exam.syllabus ?? []).filter((s: any) => (s.concept_ids?.length ?? 0) > 0).slice(0, 3);
  const concepts = sections.map((s: any) => conceptToHumanLabel(s.concept_ids[0]));

  const prompts: Array<{ text: string; dot: string }> = [];
  if (concepts[0]) {
    prompts.push({ text: `Explain ${concepts[0]} with a worked example`, dot: dots[0] });
  }
  prompts.push({
    text: `Where should I focus to maximise my ${examShortName} score?`,
    dot: dots[1],
  });
  if (concepts[1]) {
    prompts.push({ text: `Walk me through ${concepts[1]} step-by-step`, dot: dots[2] });
  }
  if (concepts[2]) {
    prompts.push({ text: `Give me 3 practice problems on ${concepts[2]}`, dot: dots[3] });
  }
  // Fill any remaining slot if the syllabus had fewer than 3 sections
  while (prompts.length < 4) {
    prompts.push({
      text: `Give me a hard ${examShortName} practice problem`,
      dot: dots[prompts.length] ?? dots[0],
    });
  }
  return prompts;
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
  { method: 'GET',  path: '/api/exam/active',                           handler: handleActiveExam },
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
