/**
 * Knowledge Tracks API
 *
 * Endpoints:
 *   GET  /api/knowledge/tracks               — list all tracks (grouped by board)
 *   GET  /api/knowledge/tracks/:id           — get a single track + its suggested exams
 *   POST /api/knowledge/select               — JWT user picks a track; returns suggested
 *                                              exams (does NOT auto-register them; the
 *                                              student then chooses which ones)
 *
 * The track ↔ student relationship is stored *inside* each ExamRegistration
 * (knowledge_track_id field), not as a separate top-level record. That keeps
 * the data model consistent — registering an exam is the act of committing
 * to it; the track is metadata that travels with the registration.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { listTracksByBoard, getTrack, listTracks } from '../knowledge/tracks';
import { getCurrentUser } from '../auth/middleware';
import { loadBundledAdapters, getExamAdapter } from '../exam-builder/registry';
import { getOrCreateStudentModel } from '../gbrain/student-model';
import { getTopicsForExam } from '../curriculum/topic-adapter';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

/** GET /api/knowledge/tracks — list all knowledge tracks, grouped by board */
async function handleListTracks(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  const groups = listTracksByBoard();
  // Strip internal fields that the UI doesn't need; keep the picker payload small
  const compact = groups.map(g => ({
    board: g.board,
    board_name: g.board_name,
    grades: g.grades.map(gr => ({
      grade: gr.grade,
      grade_name: gr.grade_name,
      subjects: gr.subjects.map(s => ({
        id: s.id,
        subject: s.subject,
        subject_name: s.subject_name,
        display_name: s.display_name,
        suggested_exam_ids: s.suggested_exam_ids,
        description: s.description,
      })),
    })),
  }));
  sendJSON(res, { boards: compact, total: listTracks().length });
}

/** GET /api/knowledge/tracks/:id — single track with hydrated exam details */
async function handleGetTrack(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { id } = req.params;
  if (!id) return sendError(res, 400, 'track id required');

  const track = getTrack(id);
  if (!track) return sendError(res, 404, `Knowledge track '${id}' not found`);

  // Hydrate the suggested exams with name + topic count from the adapters
  await loadBundledAdapters();
  const exams = track.suggested_exam_ids
    .map(exam_id => {
      const adapter = getExamAdapter(exam_id);
      if (!adapter) return null;
      return {
        exam_id,
        exam_name: adapter.exam_name,
        topic_count: adapter.getSyllabusTopicIds().length,
      };
    })
    .filter((x): x is { exam_id: string; exam_name: string; topic_count: number } => !!x);

  sendJSON(res, { track, suggested_exams: exams });
}

/**
 * POST /api/knowledge/select
 *
 * Body: { track_id: string }
 * Response: { track, suggested_exams: [...], current_registrations: [...] }
 *
 * Returns the same payload as GET /api/knowledge/tracks/:id plus the
 * student's current exam registrations so the UI can show "you've already
 * picked these" alongside the suggestions. Does not mutate state — the
 * student commits exams via PUT /api/student/profile.
 */
async function handleSelectTrack(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await getCurrentUser(req);  // optional — anonymous users can preview
  const body = req.body as any;
  const trackId = body?.track_id;
  if (!trackId || typeof trackId !== 'string') {
    return sendError(res, 400, 'track_id (string) required');
  }

  const track = getTrack(trackId);
  if (!track) return sendError(res, 404, `Knowledge track '${trackId}' not found`);

  await loadBundledAdapters();
  const suggested_exams = track.suggested_exam_ids
    .map(exam_id => {
      const adapter = getExamAdapter(exam_id);
      if (!adapter) return null;
      return {
        exam_id,
        exam_name: adapter.exam_name,
        topic_count: adapter.getSyllabusTopicIds().length,
      };
    })
    .filter((x): x is { exam_id: string; exam_name: string; topic_count: number } => !!x);

  let current_registrations: any[] = [];
  if (auth) {
    const { getProfile } = await import('../session-planner/exam-profile-store');
    const profile = getProfile(auth.user.id);
    current_registrations = profile?.exams ?? [];
  }

  sendJSON(res, { track, suggested_exams, current_registrations });
}

// ============================================================================
// Knowledge Shell — progress, next-concept, concept-tree (E2)
// These three endpoints back the KnowledgeHomePage shell.
// Mastery data comes from student_models.mastery_vector; concept list from
// the first suggested exam adapter for the track.
// ============================================================================

const MASTERY_MASTERED  = 0.7;
const MASTERY_IN_PROGRESS = 0.3;

async function getTrackConcepts(trackId: string): Promise<Array<{ id: string; label: string }> | null> {
  const track = getTrack(trackId);
  if (!track) return null;
  await loadBundledAdapters();
  const firstExamId = track.suggested_exam_ids[0];
  if (!firstExamId) return null;
  const adapter = getExamAdapter(firstExamId);
  if (!adapter) return null;
  const topicIds = adapter.getSyllabusTopicIds();
  // Map topic IDs to names via the curriculum topic adapter (exam-agnostic labels).
  const topicsForExam = getTopicsForExam(firstExamId);
  const labelMap = new Map(topicsForExam.map(t => [t.id, t.name]));
  return topicIds.map(id => ({
    id,
    label: labelMap.get(id) ?? id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  }));
}

/** GET /api/knowledge/tracks/:id/progress — mastery counts for the track's concepts */
async function handleTrackProgress(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await getCurrentUser(req);
  if (!auth) return sendError(res, 401, 'Unauthorized');
  const { id } = req.params;
  const concepts = await getTrackConcepts(id);
  if (!concepts) return sendError(res, 404, `Track '${id}' not found or has no exam`);

  const model = await getOrCreateStudentModel(auth.session_id);
  const mv = model.mastery_vector;

  let mastered = 0;
  for (const c of concepts) {
    if ((mv[c.id]?.score ?? 0) >= MASTERY_MASTERED) mastered++;
  }
  const total = concepts.length;
  const pct = total === 0 ? 0 : Math.round((mastered / total) * 100);
  sendJSON(res, { mastered, total, pct, track_id: id });
}

/** GET /api/knowledge/tracks/:id/next-concept — recommended next concept for today */
async function handleNextConcept(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await getCurrentUser(req);
  if (!auth) return sendError(res, 401, 'Unauthorized');
  const { id } = req.params;
  const concepts = await getTrackConcepts(id);
  if (!concepts) return sendError(res, 404, `Track '${id}' not found or has no exam`);

  const model = await getOrCreateStudentModel(auth.session_id);
  const mv = model.mastery_vector;

  // Pick the first in-progress concept (0.3–0.7), then first unstarted (<0.3).
  // Mastered concepts (≥0.7) are skipped.
  let best = concepts.find(c => {
    const s = mv[c.id]?.score ?? 0;
    return s >= MASTERY_IN_PROGRESS && s < MASTERY_MASTERED;
  }) ?? concepts.find(c => (mv[c.id]?.score ?? 0) < MASTERY_IN_PROGRESS);

  if (!best) best = concepts[0]; // fallback: first concept

  const score = mv[best.id]?.score ?? 0;
  const why_next = score < MASTERY_IN_PROGRESS
    ? `You haven't started ${best.label} yet — it's the next concept in your curriculum.`
    : `You're ${Math.round(score * 100)}% through ${best.label}. One more session will push you to mastery.`;

  sendJSON(res, {
    concept_id: best.id,
    concept_name: best.label,
    why_next,
    lesson_url: `/lesson?concept=${encodeURIComponent(best.id)}`,
  });
}

/** GET /api/knowledge/tracks/:id/concept-tree — all concepts with mastery status */
async function handleConceptTree(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await getCurrentUser(req);
  if (!auth) return sendError(res, 401, 'Unauthorized');
  const { id } = req.params;
  const concepts = await getTrackConcepts(id);
  if (!concepts) return sendError(res, 404, `Track '${id}' not found or has no exam`);

  const model = await getOrCreateStudentModel(auth.session_id);
  const mv = model.mastery_vector;
  const alerts = new Set(model.prerequisite_alerts?.map(a => a.concept) ?? []);

  const nodes = concepts.map(c => {
    const score = mv[c.id]?.score ?? 0;
    const status: 'mastered' | 'in-progress' | 'locked' =
      score >= MASTERY_MASTERED ? 'mastered' :
      score >= MASTERY_IN_PROGRESS ? 'in-progress' : 'locked';
    return {
      id: c.id,
      name: c.label,
      status,
      score: Math.round(score * 100),
      has_prerequisite_alert: alerts.has(c.id),
    };
  });

  // Linear sequence edges (each concept → next) — knowledge tracks are sequential curricula.
  const edges = concepts.slice(0, -1).map((c, i) => ({ from: c.id, to: concepts[i + 1].id }));

  sendJSON(res, { nodes, edges, track_id: id });
}

export const knowledgeRoutes: RouteDefinition[] = [
  { method: 'GET',  path: '/api/knowledge/tracks',              handler: handleListTracks },
  { method: 'GET',  path: '/api/knowledge/tracks/:id',          handler: handleGetTrack },
  { method: 'POST', path: '/api/knowledge/select',              handler: handleSelectTrack },
  { method: 'GET',  path: '/api/knowledge/tracks/:id/progress', handler: handleTrackProgress },
  { method: 'GET',  path: '/api/knowledge/tracks/:id/next-concept', handler: handleNextConcept },
  { method: 'GET',  path: '/api/knowledge/tracks/:id/concept-tree', handler: handleConceptTree },
];
