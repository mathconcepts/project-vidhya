// @ts-nocheck
/**
 * Course + LLM Generation HTTP surface
 *
 * Admin (admin role) — LLM generation:
 *   POST /api/admin/sample-check/generate-content
 *        Body: { sections: [...], options: { budget_usd, max_tier, ... } }
 *        → GenerationResult with per-piece provenance
 *
 *   POST /api/admin/sample-check/generate-and-create
 *        Body: { exam_id, sections, hand_authored?, admin_note }
 *        → Creates a SampleCheck seeded with LLM-generated + optional
 *          hand-authored content; returns share URL
 *
 * Admin (admin role) — promotion to LiveCourse:
 *   POST /api/admin/course/promote
 *        Body: { exam_id, source_sample_ids, applied_feedback_ids,
 *                candidate_content, override_bump?, release_tag }
 *        → Promotes samples + feedback into a versioned LiveCourse.
 *          Idempotent — same inputs return existing version.
 *
 *   POST /api/admin/course/promote-from-samples
 *        Body: { exam_id, source_sample_ids, release_tag? }
 *        → Convenience: pulls applied feedback from named samples,
 *          runs the scope-applicator to build candidate_content
 *          automatically, then promotes.
 *
 *   POST /api/admin/course/:id/rollback
 *        Body: { target_version, reason }
 *        → Promotes an earlier version's content forward as a patch.
 *
 *   GET  /api/admin/course/:id                        Full course + history
 *   GET  /api/admin/course/:id/lineage/:version       Detailed lineage view
 *   GET  /api/admin/course/list                       All courses
 *   GET  /api/admin/course/promotion-records          Full log, filterable
 *
 * Public:
 *   GET  /api/course/:exam_id                         Current published version
 *   GET  /api/course/:exam_id/history                 Version history summary
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireRole } from '../auth/middleware';
import {
  promoteToCourse,
  rollbackCourse,
  getCourse,
  getCourseByExam,
  listCourses,
  getPromotionRecord,
  listPromotionRecords,
  buildLineage,
  versionToString,
} from '../course/promoter';
import {
  generateSampleContent,
  stitchSnapshot,
  type GenerationSection,
  type GenerationOptions,
} from '../sample-check/llm-generator';
import { createSampleCheck, getSampleCheck } from '../sample-check/store';
import { listFeedback } from '../feedback/store';
import { applyPatch, proposePatch, type ExamContent } from '../feedback/scope-applicator';
import {
  BITSAT_EXAM, BITSAT_MOCK_EXAM, LESSON_LIMITS, BITSAT_STRATEGIES,
} from '../samples/bitsat-mathematics';

// ============================================================================
// Exam content loader — shared with other routes
// ============================================================================

function loadExamContentAndName(exam_id: string): { content: ExamContent; name: string; code: string; exam: any } | null {
  if (exam_id === BITSAT_EXAM.id) {
    return {
      exam: BITSAT_EXAM,
      name: BITSAT_EXAM.name,
      code: BITSAT_EXAM.code,
      content: {
        exam: BITSAT_EXAM,
        mocks: [BITSAT_MOCK_EXAM],
        lessons: [LESSON_LIMITS],
        strategies: BITSAT_STRATEGIES.strategies.map(s => ({
          title: s.title, content: s.content, evidence: s.evidence,
        })),
      },
    };
  }
  return null;
}

// ============================================================================
// Admin — LLM generation
// ============================================================================

async function handleGenerateContent(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!Array.isArray(body.sections) || body.sections.length === 0) {
    return sendError(res, 400, 'sections array required');
  }
  try {
    const result = await generateSampleContent(
      body.sections as GenerationSection[],
      (body.options ?? {}) as GenerationOptions,
    );
    sendJSON(res, result);
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

async function handleGenerateAndCreate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.exam_id || !body.admin_note || !Array.isArray(body.sections)) {
    return sendError(res, 400, 'exam_id, admin_note, sections required');
  }
  const loaded = loadExamContentAndName(body.exam_id);
  if (!loaded) return sendError(res, 404, `No content loader registered for ${body.exam_id}`);

  try {
    // Step 1: generate via LLM
    const generation = await generateSampleContent(
      body.sections as GenerationSection[],
      (body.options ?? {}) as GenerationOptions,
    );

    // Step 2: stitch into snapshot
    const snapshot = stitchSnapshot({
      exam_spec: loaded.exam,
      generation_result: generation,
      hand_authored: body.hand_authored,
    });

    // Step 3: create sample check bound to the snapshot
    const sample = createSampleCheck({
      exam_id: body.exam_id,
      exam_code: loaded.code,
      exam_name: loaded.name,
      snapshot,
      admin_note: body.admin_note,
      created_by: auth.user.id,
      release_tag: body.release_tag,
    });

    sendJSON(res, {
      sample_check: sample,
      share_url: `/s/${sample.share_token}`,
      generation_provenance: generation.provenance,
      generation_errors: generation.error,
      note:
        `Sample created with ${generation.provenance.pieces_generated} LLM-generated + ` +
        `${snapshot._generation_provenance?.pieces_hand_authored ?? 0} hand-authored pieces. ` +
        `Share /s/${sample.share_token} with students.`,
    });
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

// ============================================================================
// Admin — promotion to LiveCourse
// ============================================================================

async function handlePromote(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.exam_id || !Array.isArray(body.source_sample_ids) || !body.candidate_content) {
    return sendError(res, 400, 'exam_id, source_sample_ids, candidate_content required');
  }
  const loaded = loadExamContentAndName(body.exam_id);
  if (!loaded) return sendError(res, 404, `No content loader registered for ${body.exam_id}`);

  try {
    const result = promoteToCourse({
      exam_id: body.exam_id,
      exam_code: loaded.code,
      exam_name: loaded.name,
      source_sample_ids: body.source_sample_ids,
      applied_feedback_ids: body.applied_feedback_ids ?? [],
      candidate_content: body.candidate_content,
      override_bump: body.override_bump,
      release_tag: body.release_tag,
      promoted_by: auth.user.id,
      generation_provenance_aggregate: body.generation_provenance_aggregate,
    });
    sendJSON(res, result);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

/**
 * Convenience promotion — pulls the list of applied feedback items from
 * the named samples automatically, builds candidate content by running
 * applyPatch over the base exam content with the proposed patch, and
 * promotes.
 */
async function handlePromoteFromSamples(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.exam_id || !Array.isArray(body.source_sample_ids)) {
    return sendError(res, 400, 'exam_id and source_sample_ids required');
  }
  const loaded = loadExamContentAndName(body.exam_id);
  if (!loaded) return sendError(res, 404, `No content loader registered for ${body.exam_id}`);

  // Validate samples belong to exam
  const samples = body.source_sample_ids.map((id: string) => getSampleCheck(id)).filter(Boolean);
  const invalid = samples.find((s: any) => s.exam_id !== body.exam_id);
  if (invalid) return sendError(res, 400, `Sample ${invalid.id} is not for exam ${body.exam_id}`);

  // Gather all applied feedback bound to these samples
  const appliedFeedback = listFeedback({ exam_id: body.exam_id, status: 'applied' })
    .filter((f: any) => body.source_sample_ids.includes((f.target as any).sample_check_id));

  // Build candidate content by applying the patch produced from these items
  let candidate_content = loaded.content;
  if (appliedFeedback.length > 0) {
    try {
      // proposePatch wants 'approved' status; temporarily bypass by
      // treating already-applied items as approved for patch generation
      const approvedLike = appliedFeedback.map((f: any) => ({ ...f, status: 'approved' }));
      const patch = proposePatch(approvedLike as any, auth.user.id);
      if (patch) {
        candidate_content = applyPatch(loaded.content, patch);
      }
    } catch (err) {
      // If patch generation fails, fall back to base content
    }
  }

  // Convert ExamContent to SampleSnapshot shape (same shape structurally)
  const snapshot = {
    exam: candidate_content.exam,
    mocks: candidate_content.mocks,
    lessons: candidate_content.lessons,
    strategies: candidate_content.strategies,
  };

  try {
    const result = promoteToCourse({
      exam_id: body.exam_id,
      exam_code: loaded.code,
      exam_name: loaded.name,
      source_sample_ids: body.source_sample_ids,
      applied_feedback_ids: appliedFeedback.map((f: any) => f.id),
      candidate_content: snapshot as any,
      override_bump: body.override_bump,
      release_tag: body.release_tag,
      promoted_by: auth.user.id,
    });
    sendJSON(res, {
      ...result,
      note:
        `Promoted ${body.source_sample_ids.length} sample(s) with ${appliedFeedback.length} ` +
        `applied feedback item(s) into ${result.course.id} ` +
        `version ${versionToString(result.record.version_after)} ` +
        `(${result.created_new_version ? 'new version' : 'idempotent hit, reused existing'}).`,
    });
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

async function handleRollback(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.target_version || !body.reason) {
    return sendError(res, 400, 'target_version and reason required');
  }
  try {
    const result = rollbackCourse(req.params.id, body.target_version, auth.user.id, body.reason);
    if (!result) return sendError(res, 404, 'Course not found');
    sendJSON(res, result);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

async function handleGetCourse(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const c = getCourse(req.params.id);
  if (!c) return sendError(res, 404, 'Course not found');
  sendJSON(res, { course: c });
}

async function handleLineage(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const lineage = buildLineage(req.params.id, req.params.version);
  if (!lineage) return sendError(res, 404, 'Course or version not found');
  sendJSON(res, { lineage });
}

async function handleListCourses(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  sendJSON(res, { courses: listCourses() });
}

async function handleListRecords(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const exam_id = req.query.get('exam_id') || undefined;
  sendJSON(res, { records: listPromotionRecords(exam_id) });
}

// ============================================================================
// Public — students see the current live course
// ============================================================================

async function handlePublicCourse(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const course = getCourseByExam(req.params.exam_id);
  if (!course) return sendError(res, 404, 'No live course for this exam yet');
  sendJSON(res, {
    course_id: course.id,
    exam_name: course.exam_name,
    version: versionToString(course.current_version),
    content: course.current_version_content,
  });
}

async function handlePublicHistory(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const course = getCourseByExam(req.params.exam_id);
  if (!course) return sendError(res, 404, 'No live course for this exam yet');
  sendJSON(res, {
    course_id: course.id,
    exam_name: course.exam_name,
    current_version: versionToString(course.current_version),
    history: course.version_history.map(h => ({
      version: versionToString(h.version),
      status: h.status,
      published_at: h.published_at,
      promotion_record_id: h.promotion_record_id,
    })),
  });
}

// ============================================================================

export const courseRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  // LLM generation
  { method: 'POST', path: '/api/admin/sample-check/generate-content',    handler: handleGenerateContent },
  { method: 'POST', path: '/api/admin/sample-check/generate-and-create', handler: handleGenerateAndCreate },

  // Promotion
  { method: 'POST', path: '/api/admin/course/promote',                   handler: handlePromote },
  { method: 'POST', path: '/api/admin/course/promote-from-samples',      handler: handlePromoteFromSamples },
  { method: 'POST', path: '/api/admin/course/:id/rollback',              handler: handleRollback },

  // Admin queries
  { method: 'GET',  path: '/api/admin/course/list',                      handler: handleListCourses },
  { method: 'GET',  path: '/api/admin/course/promotion-records',         handler: handleListRecords },
  { method: 'GET',  path: '/api/admin/course/:id',                       handler: handleGetCourse },
  { method: 'GET',  path: '/api/admin/course/:id/lineage/:version',      handler: handleLineage },

  // Public
  { method: 'GET',  path: '/api/course/:exam_id',                        handler: handlePublicCourse },
  { method: 'GET',  path: '/api/course/:exam_id/history',                handler: handlePublicHistory },
];
