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
import { CONCEPT_MAP, getConceptsForTopic, topologicalSort } from '../constants/concept-graph';
import { LA_FRONTIER_CLUSTERS, CLUSTER_BY_CONCEPT } from '../constants/la-frontier-clusters';

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

  // A9: tracks that declare `concept_graph_topic` source their concept list
  // straight from the real prerequisite DAG (data/curriculum/gate-ma.yml via
  // src/constants/concept-graph.ts) instead of the coarse exam-adapter
  // topic ids. This is what makes GATE-MA render its 26 granular linear-
  // algebra concepts (eigenvalues, determinants, ...) rather than the
  // handful of section-level topic ids (linear-algebra, transform-theory,
  // ...) the adapter path below exposes. Concepts come back in topological
  // order (prerequisites before dependents) so the concept-tree endpoint
  // below can compute real edges without a second sort pass.
  if (track.concept_graph_topic) {
    const topoOrder = topologicalSort();
    const concepts = getConceptsForTopic(track.concept_graph_topic);
    const byId = new Map(concepts.map(c => [c.id, c]));
    const ordered = topoOrder.filter(id => byId.has(id)).map(id => byId.get(id)!);
    return ordered.map(c => ({ id: c.id, label: c.label }));
  }

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

  const model = await getOrCreateStudentModel(auth.user.id);
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

  const model = await getOrCreateStudentModel(auth.user.id);
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

/**
 * Real prerequisite edges for a track's concept list, restricted to edges
 * where BOTH endpoints are in the track (a concept-graph node's prereq that
 * lives outside this track's topic is out of scope for this view — for the
 * 26 linear-algebra concepts every prerequisite is itself linear-algebra,
 * so this restriction is a no-op today, but it's the honest general rule
 * rather than an LA-specific assumption).
 *
 * Only called for tracks whose `concept_graph_topic` is set (the caller
 * decides, not this function) — deliberately NOT inferred by checking
 * whether individual concept ids happen to exist in CONCEPT_MAP. Several
 * exam-adapter topic ids (e.g. "linear-algebra" itself, as a syllabus
 * SECTION id) collide with real concept-graph node ids without the track
 * actually being concept-graph-backed; inferring from id membership alone
 * pollutes a school-board track's synthetic chain with a stray, mostly-
 * empty edge set instead of leaving it alone.
 */
function realPrereqEdges(
  conceptIds: ReadonlyArray<string>,
): Array<{ from: string; to: string }> {
  const inTrack = new Set(conceptIds);
  const edges: Array<{ from: string; to: string }> = [];
  for (const id of conceptIds) {
    const node = CONCEPT_MAP.get(id);
    if (!node) continue;
    for (const prereqId of node.prerequisites) {
      if (inTrack.has(prereqId)) edges.push({ from: prereqId, to: id });
    }
  }
  return edges;
}

/**
 * Student-facing "why" line for a concept's row — DR-1: the word "locked"
 * never reaches the student, the blocking prerequisite is named instead
 * ("after determinants"). `status` (the API field) keeps its existing
 * three-value name for backward compatibility with any consumer already
 * reading it; only the copy changes.
 */
function whyLine(
  status: 'mastered' | 'in-progress' | 'locked',
  unmetPrereqLabels: string[],
): string {
  if (status === 'mastered') return 'mastered';
  if (status === 'in-progress') return 'in progress';
  if (unmetPrereqLabels.length === 0) return 'not started';
  if (unmetPrereqLabels.length === 1) return `after ${unmetPrereqLabels[0]}`;
  return `after ${unmetPrereqLabels.slice(0, -1).join(', ')} and ${unmetPrereqLabels[unmetPrereqLabels.length - 1]}`;
}

/** GET /api/knowledge/tracks/:id/concept-tree — all concepts with mastery status */
async function handleConceptTree(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await getCurrentUser(req);
  if (!auth) return sendError(res, 401, 'Unauthorized');
  const { id } = req.params;
  const track = getTrack(id);
  if (!track) return sendError(res, 404, `Track '${id}' not found or has no exam`);
  const concepts = await getTrackConcepts(id);
  if (!concepts) return sendError(res, 404, `Track '${id}' not found or has no exam`);

  const model = await getOrCreateStudentModel(auth.user.id);
  const mv = model.mastery_vector;
  const alerts = new Set(model.prerequisite_alerts?.map(a => a.concept) ?? []);
  const conceptIds = concepts.map(c => c.id);
  const labelById = new Map(concepts.map(c => [c.id, c.label]));

  // A9: real prereq edges when the track is concept-graph-backed
  // (declares `concept_graph_topic`, e.g. GATE-MA); the pre-existing
  // synthetic linear chain otherwise, so school-board tracks reading
  // section-level exam-adapter topic ids keep their current (already-
  // shipped) behavior unchanged.
  const isGraphBacked = Boolean(track.concept_graph_topic);
  const graphEdges = isGraphBacked ? realPrereqEdges(conceptIds) : null;
  const edges = graphEdges ?? concepts.slice(0, -1).map((c, i) => ({ from: c.id, to: concepts[i + 1].id }));

  // Map concept id -> its real prerequisite ids WITHIN this track, for the
  // prereq-lock status check below. Only populated when we have real edges
  // (graphEdges !== null); the synthetic-chain fallback keeps its original
  // own-score-only status derivation (T4/A6 already recalibrated those
  // thresholds — not this task's concern for non-concept-graph tracks).
  const prereqsOf = new Map<string, string[]>();
  if (graphEdges) {
    for (const e of graphEdges) {
      const list = prereqsOf.get(e.to) ?? [];
      list.push(e.from);
      prereqsOf.set(e.to, list);
    }
  }

  const nodes = concepts.map(c => {
    const entry = mv[c.id];
    const score = entry?.score ?? 0;
    let status: 'mastered' | 'in-progress' | 'locked';
    let unmetPrereqLabels: string[] = [];
    const directPrereqIds = prereqsOf.get(c.id) ?? [];

    if (score >= MASTERY_MASTERED) {
      status = 'mastered';
    } else if (graphEdges) {
      // A9 fix: 'locked' means PREREQ-locked, not merely "low own score".
      // A concept whose prerequisites are all mastered is 'in-progress'
      // (available to work on) even at score 0 — only an unmet real
      // prerequisite blocks it.
      const unmet = directPrereqIds.filter(pid => (mv[pid]?.score ?? 0) < MASTERY_MASTERED);
      if (unmet.length > 0) {
        status = 'locked';
        unmetPrereqLabels = unmet.map(pid => labelById.get(pid) ?? pid);
      } else {
        status = 'in-progress';
      }
    } else {
      // Legacy own-score-only derivation, unchanged, for non-graph tracks.
      status = score >= MASTERY_IN_PROGRESS ? 'in-progress' : 'locked';
    }

    const provenance = entry?.provenance ?? null;
    // T13 (DR-1): the FOUR-state visual dot, distinct from the 3-value
    // `status` API field. 'mastered' (solid green) only for demonstrated
    // mastery; a warmup-inferred placement renders 'placed' (hollow/
    // tinted) even though it satisfies the SAME `status: 'mastered'` for
    // gating purposes — the receipt-culture distinction is visual, not
    // functional (placed concepts still unlock their dependents).
    const dot: 'mastered' | 'placed' | 'frontier' | 'later' =
      status === 'mastered'
        ? (provenance === 'warmup_placed' ? 'placed' : 'mastered')
        : status === 'in-progress' ? 'frontier' : 'later';

    const cluster = CLUSTER_BY_CONCEPT.get(c.id) ?? null;

    return {
      id: c.id,
      name: c.label,
      status,
      dot,
      why: whyLine(status, unmetPrereqLabels),
      score: Math.round(score * 100),
      // T8/T13: distinguishes a warmup-inferred placement from a
      // demonstrated (real-attempt) mastery entry — see MasteryEntry.provenance
      // in src/gbrain/student-model.ts. Undefined/'attempt' both mean
      // "demonstrated"; only 'warmup_placed' renders the "placed" dot.
      provenance,
      has_prerequisite_alert: alerts.has(c.id),
      cluster_id: cluster?.id ?? null,
      cluster_label: cluster?.label ?? null,
      // T13: per-concept bottom sheet content ("Builds on: eigenvalues,
      // determinants ✓") — real prereqs only, never the synthetic chain.
      builds_on: directPrereqIds.map(pid => ({
        id: pid,
        label: labelById.get(pid) ?? pid,
        met: (mv[pid]?.score ?? 0) >= MASTERY_MASTERED,
      })),
    };
  });

  // T13: cluster rollups for the collapsed "Matrix operations · 6 of 6"
  // header — a node counts toward "done" whether its dot is 'mastered' or
  // 'placed' (both unlock dependents; the collapse question is "is there
  // anything left to DO here", not "was it proven"). Only populated for
  // clusters that actually have members among this track's concepts (a
  // non-LA / non-graph-backed track yields an empty array, not an error).
  const clusters = LA_FRONTIER_CLUSTERS
    .map(cluster => {
      const members = nodes.filter(n => n.cluster_id === cluster.id);
      if (members.length === 0) return null;
      const done = members.filter(n => n.dot === 'mastered' || n.dot === 'placed').length;
      return { id: cluster.id, label: cluster.label, count: members.length, done_count: done };
    })
    .filter((c): c is { id: string; label: string; count: number; done_count: number } => c !== null);

  sendJSON(res, { nodes, edges, clusters, track_id: id });
}

export const knowledgeRoutes: RouteDefinition[] = [
  { method: 'GET',  path: '/api/knowledge/tracks',              handler: handleListTracks },
  { method: 'GET',  path: '/api/knowledge/tracks/:id',          handler: handleGetTrack },
  { method: 'POST', path: '/api/knowledge/select',              handler: handleSelectTrack },
  { method: 'GET',  path: '/api/knowledge/tracks/:id/progress', handler: handleTrackProgress },
  { method: 'GET',  path: '/api/knowledge/tracks/:id/next-concept', handler: handleNextConcept },
  { method: 'GET',  path: '/api/knowledge/tracks/:id/concept-tree', handler: handleConceptTree },
];
