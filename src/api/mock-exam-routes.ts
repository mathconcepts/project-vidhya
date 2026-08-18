/**
 * src/api/mock-exam-routes.ts — T22 (ENG-D3): mock-exam leak fix.
 *
 * The prior handler (src/gbrain/gbrain-routes.ts's handleMockExam, now
 * removed) had two problems: it returned each question's `correct_answer`
 * straight to the client PRE-SUBMISSION, and grading happened entirely
 * client-side off the client's own self-report — a student's browser
 * decided whether it got the question right, and the server just believed
 * it. It also had NO auth check at all.
 *
 *   GET  /api/gbrain/mock-exam/:sessionId?exam=gate   — student-authenticated
 *     Assembles the exam (src/gbrain/operations/moat-operations.ts's
 *     generateMockExam, unchanged query logic, now also pulling migration
 *     032/033 marking columns), persists the FULL question set — including
 *     every answer key — server-side via src/gbrain/mock-exam-store.ts
 *     (migration 047, a real reviewed table replacing the old runtime
 *     `CREATE TABLE`), and returns a RENDER-SAFE view: no correct_answer,
 *     no answer_index/indices/range, ever (leak test mirrors the
 *     GET /api/practice/item/:id pattern).
 *
 *   POST /api/gbrain/mock-exam/:id/submit             — student-authenticated
 *     Grades server-side via the SAME GateDeterministicScorer the practice
 *     path uses (src/gbrain/mock-exam-grading.ts normalizes both PYQ- and
 *     generated_problems-sourced questions into GateItem first). Honest
 *     where marking doesn't exist: a question with no usable answer key is
 *     excluded from the marks total and counted as `ungraded`, never
 *     guessed. Idempotent at the exam level (optimistic claim, mirrors
 *     quiz_sessions) — a retried submit replays the persisted analysis.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { generateMockExam as generateMockExamProd } from '../gbrain/operations/moat-operations';
import {
  createMockExam, getMockExam, claimMockExamSubmission, finalizeMockExamSubmission,
  type MockExamRow,
} from '../gbrain/mock-exam-store';
import {
  normalizeMockExamRow, gradeMockExam, type MockExamQuestionRow, type NormalizedMockQuestion, type MockExamResponse,
} from '../gbrain/mock-exam-grading';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

// ────────────────────────────────────────────────────────────────────
// Test seam
// ────────────────────────────────────────────────────────────────────

export interface MockExamDeps {
  generateMockExam: typeof generateMockExamProd;
  createMockExam: typeof createMockExam;
  getMockExam: typeof getMockExam;
  claimMockExamSubmission: typeof claimMockExamSubmission;
  finalizeMockExamSubmission: typeof finalizeMockExamSubmission;
  now: () => Date;
}

const productionDeps: MockExamDeps = {
  generateMockExam: generateMockExamProd,
  createMockExam,
  getMockExam,
  claimMockExamSubmission,
  finalizeMockExamSubmission,
  now: () => new Date(),
};

let deps: MockExamDeps = productionDeps;

/** Test hook. Pass null to restore production wiring. */
export function setMockExamDepsForTests(override: Partial<MockExamDeps> | null): void {
  deps = override ? { ...productionDeps, ...override } : productionDeps;
}

// ────────────────────────────────────────────────────────────────────
// Render-safe projection — the leak-discipline boundary
// ────────────────────────────────────────────────────────────────────

/** Never includes correct_answer / answer_index / answer_indices / answer_range. */
function renderSafeQuestion(row: MockExamQuestionRow) {
  const normalized = normalizeMockExamRow(row);
  return {
    id: row.id,
    topic: row.topic,
    question_text: typeof (row as any).question_text === 'string' ? (row as any).question_text : null,
    difficulty: (row as any).difficulty ?? null,
    marks: normalized.item?.marks ?? (typeof row.marks === 'number' ? row.marks : null),
    gradable: normalized.item !== null,
    options: normalized.item && (normalized.item.kind === 'mcq' || normalized.item.kind === 'msq')
      ? normalized.item.options
      : null,
    question_type: normalized.item?.kind ?? null,
    source: row.source,
  };
}

// ────────────────────────────────────────────────────────────────────
// GET /api/gbrain/mock-exam/:sessionId
// ────────────────────────────────────────────────────────────────────

async function handleGenerate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  const { sessionId } = req.params;
  const exam = req.query.get('exam') || 'gate';
  if (!sessionId) return sendError(res, 400, 'sessionId required');

  let assembled: Awaited<ReturnType<typeof generateMockExamProd>>;
  try {
    assembled = await deps.generateMockExam(sessionId, exam);
  } catch (err) {
    return sendError(res, 500, (err as Error).message);
  }

  let saved: MockExamRow;
  try {
    saved = await deps.createMockExam({
      id: assembled.exam_id,
      sessionId,
      examKey: exam,
      questions: assembled.questions,
      timeLimitMinutes: assembled.time_limit_minutes,
    });
  } catch (err) {
    console.error('[mock-exam] persistence failed:', (err as Error).message);
    return sendError(res, 503, 'mock exam unavailable — try again shortly');
  }

  return sendJSON(res, {
    exam_id: saved.id,
    exam_name: assembled.exam_name,
    time_limit_minutes: saved.timeLimitMinutes,
    total_questions: saved.questions.length,
    marks_scheme: assembled.marks_scheme,
    section_breakdown: assembled.section_breakdown,
    questions: (saved.questions as MockExamQuestionRow[]).map(renderSafeQuestion),
  });
}

// ────────────────────────────────────────────────────────────────────
// POST /api/gbrain/mock-exam/:id/submit
// ────────────────────────────────────────────────────────────────────

async function handleSubmit(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  const examId = req.params.id;
  if (!examId) return sendError(res, 400, 'exam id is required');

  const existing = await deps.getMockExam(examId).catch(() => null);
  if (!existing) return sendError(res, 404, `unknown mock exam: ${examId}`);

  const body = (req.body ?? {}) as Record<string, unknown>;
  // Best-effort ownership continuity: if the client names the session it
  // generated the exam under, it must match. Loose by design — this
  // legacy GBrain surface has no formal session<->user binding elsewhere
  // (tracked as a follow-up, not silently assumed) — but this closes the
  // straightforward case of grading against a session_id that was never
  // used to create this exam.
  if (typeof body.session_id === 'string' && body.session_id !== existing.sessionId) {
    return sendError(res, 404, `unknown mock exam: ${examId}`);
  }

  const now = deps.now();
  const claim = await deps.claimMockExamSubmission(examId, now.getTime());
  if (!claim) return sendError(res, 404, `unknown mock exam: ${examId}`);

  if (!claim.fresh) {
    const r = claim.row;
    return sendJSON(res, { exam_id: examId, ...(r.analysis as object ?? {}), late: r.late, recorded: true, replayed: true });
  }

  const rawResponses = Array.isArray(body.responses) ? body.responses : [];
  const responsesById = new Map<string, MockExamResponse>();
  for (const r of rawResponses) {
    const rr = (r ?? {}) as Record<string, unknown>;
    if (typeof rr.id !== 'string') continue;
    responsesById.set(rr.id, {
      selectedIndex: typeof rr.selectedIndex === 'number' ? rr.selectedIndex : undefined,
      selectedIndices: Array.isArray(rr.selectedIndices) ? (rr.selectedIndices as number[]) : undefined,
      value: typeof rr.value === 'number' ? rr.value : undefined,
    });
  }

  const normalized: NormalizedMockQuestion[] = (claim.row.questions as MockExamQuestionRow[]).map(normalizeMockExamRow);
  const responsesByObj: Record<string, MockExamResponse> = {};
  for (const q of normalized) responsesByObj[q.id] = responsesById.get(q.id);

  const grading = await gradeMockExam(normalized, responsesByObj);
  const deadlineMs = claim.row.createdAtMs + claim.row.timeLimitMinutes * 60 * 1000;
  const late = now.getTime() > deadlineMs;

  const analysis = {
    total: normalized.length,
    correct: grading.correct,
    wrong: grading.wrong,
    skipped: grading.skipped,
    ungraded: grading.ungraded,
    marks: grading.earned,
    max_marks: grading.max,
    accuracy: grading.correct + grading.wrong > 0 ? Math.round((grading.correct / (grading.correct + grading.wrong)) * 100) : 0,
    by_topic: grading.by_topic,
  };

  const saved = await deps.finalizeMockExamSubmission(examId, {
    late, score: grading.earned, maxMarks: grading.max, analysis, gradedAtMs: now.getTime(),
  }).catch((err) => {
    console.error('[mock-exam] finalize failed (grade still returned to client):', (err as Error).message);
    return null;
  });

  return sendJSON(res, { exam_id: examId, ...analysis, late, recorded: saved !== null });
}

export const mockExamRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/gbrain/mock-exam/:sessionId', handler: handleGenerate },
  { method: 'POST', path: '/api/gbrain/mock-exam/:id/submit', handler: handleSubmit },
];
