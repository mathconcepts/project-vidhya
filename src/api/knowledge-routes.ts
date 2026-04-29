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

export const knowledgeRoutes: RouteDefinition[] = [
  { method: 'GET',  path: '/api/knowledge/tracks',     handler: handleListTracks },
  { method: 'GET',  path: '/api/knowledge/tracks/:id', handler: handleGetTrack },
  { method: 'POST', path: '/api/knowledge/select',     handler: handleSelectTrack },
];
