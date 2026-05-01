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
import pg from 'pg';
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
import { modelToLessonSnapshot, deriveConceptHints } from '../gbrain/integration';
import { getOrCreateStudentModel } from '../gbrain/student-model';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import { loadConceptAtoms, loadConceptMeta, ConceptNotFoundError } from '../content/atom-loader';
import { selectAtoms } from '../content/pedagogy-engine';
import type { ContentAtom, SessionContext } from '../content/content-types';
import type { LessonRequest, Lesson } from '../lessons/types';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

// ============================================================================
// ContentAtom v2 — engagement enrichment helpers
// ============================================================================

const { Pool } = pg;
let _atomPool: any = null;
function getAtomPool() {
  if (_atomPool) return _atomPool;
  if (!process.env.DATABASE_URL) return null;
  _atomPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return _atomPool;
}

/**
 * Enrich atoms with engagement_count + last_recall_correct + cohort signals
 * via a single SELECT. Synchronous PedagogyEngine stays pure; this is the
 * I/O boundary that runs after selectAtoms() returns.
 */
async function enrichAtomsWithEngagement(
  atoms: ContentAtom[],
  student_id: string | null,
): Promise<ContentAtom[]> {
  if (atoms.length === 0) return atoms;
  const pool = getAtomPool();
  if (!pool) return atoms; // local dev w/o DB — return unenriched

  const atomIds = atoms.map((a) => a.id);
  const enriched: ContentAtom[] = atoms.map((a) => ({ ...a }));

  try {
    if (student_id) {
      const r = await pool.query(
        'SELECT atom_id, count, last_recall_correct FROM atom_engagements WHERE student_id = $1 AND atom_id = ANY($2)',
        [student_id, atomIds],
      );
      const byId = new Map<string, any>();
      for (const row of r.rows) byId.set(row.atom_id, row);
      for (const a of enriched) {
        const row = byId.get(a.id);
        if (row) {
          a.engagement_count = row.count;
          a.last_recall_correct = row.last_recall_correct;
        }
      }
    }
    // Cohort signals: include linked atoms when common_traps points via tested_by_atom
    const cohortLookupIds = new Set<string>(atomIds);
    for (const a of atoms) if (a.tested_by_atom) cohortLookupIds.add(a.tested_by_atom);
    const cr = await pool.query(
      'SELECT atom_id, error_pct, n_seen FROM cohort_signals WHERE atom_id = ANY($1)',
      [Array.from(cohortLookupIds)],
    );
    const cohortById = new Map<string, any>();
    for (const row of cr.rows) cohortById.set(row.atom_id, row);
    for (const a of enriched) {
      const directKey = a.tested_by_atom ?? a.id;
      const row = cohortById.get(directKey);
      if (row) {
        a.cohort_error_pct = Number(row.error_pct);
        a.cohort_n_seen = row.n_seen;
      }
    }
  } catch (err) {
    console.warn(`[lesson-routes] engagement enrichment failed: ${(err as Error).message}`);
  }

  return enriched;
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

  // GBrain enrichment: if session_id is provided and no explicit student
  // snapshot is passed, fetch the cognitive model and translate it to a
  // StudentSnapshot. Preserves the v2.5 behavior when session_id is
  // omitted or GBrain is unavailable.
  if (lessonReq.session_id && !lessonReq.student) {
    try {
      const model = await getOrCreateStudentModel(lessonReq.session_id, null);
      lessonReq.student = modelToLessonSnapshot(model);
    } catch {
      // Graceful degradation — lesson works without enrichment
    }
  }

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

    // ContentAtom v2: also compute atoms[] for the same concept. Frontend
    // prefers atoms[] when non-empty; otherwise falls through to components[].
    let atoms: ContentAtom[] = [];
    try {
      const conceptAtoms = await loadConceptAtoms(lessonReq.concept_id);
      const conceptMeta = await loadConceptMeta(lessonReq.concept_id);
      const sessionContext: SessionContext = {
        error_streak: 0,
        last_error_atom_type: null,
      };
      const selected = selectAtoms({
        conceptAtoms,
        conceptMeta,
        studentModel: null,
        sessionContext,
        routeRequest: {
          user_id: lessonReq.session_id ?? 'anon',
          text: '',
          concept_id: lessonReq.concept_id,
          preferred_exam_id: lessonReq.student?.preferred_exam_id,
        },
      });
      atoms = await enrichAtomsWithEngagement(selected, lessonReq.session_id ?? null);
    } catch (err) {
      if (!(err instanceof ConceptNotFoundError)) {
        console.warn(`[lesson-routes] compose atom load failed: ${(err as Error).message}`);
      }
    }
    (personalized as any).atoms = atoms;

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

    // ContentAtom v2: also attempt to load + select atoms. Additive — clients
    // that don't know about atoms[] still see the legacy components[] field.
    let atoms: ContentAtom[] = [];
    try {
      const conceptAtoms = await loadConceptAtoms(concept_id);
      const conceptMeta = await loadConceptMeta(concept_id);
      const session_id = (req.query?.session_id as string | undefined) ?? null;
      const student_id = (req.query?.student_id as string | undefined) ?? session_id;
      const exam_proximity_days = req.query?.exam_proximity_days
        ? Number(req.query.exam_proximity_days)
        : undefined;
      const preferred_exam_id = (req.query?.preferred_exam_id as string | undefined);

      let studentModel = null;
      if (session_id) {
        try {
          studentModel = await getOrCreateStudentModel(session_id, null);
        } catch { /* graceful degradation */ }
      }
      const sessionContext: SessionContext = {
        error_streak: 0,
        last_error_atom_type: null,
        exam_proximity_days,
      };
      const selected = selectAtoms({
        conceptAtoms,
        conceptMeta,
        studentModel,
        sessionContext,
        routeRequest: {
          user_id: student_id ?? 'anon',
          text: '',
          concept_id,
          exam_proximity_days,
          preferred_exam_id,
        },
      });
      atoms = await enrichAtomsWithEngagement(selected, student_id);
    } catch (err) {
      if (!(err instanceof ConceptNotFoundError)) {
        console.warn(`[lesson-routes] atom load failed for ${concept_id}: ${(err as Error).message}`);
      }
      // ConceptNotFoundError → just return the legacy base lesson without atoms.
    }

    sendJSON(res, { ...base, atoms });
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

// ============================================================================
// ContentAtom v2 — engagement endpoint (POST /api/lesson/:concept_id/engagement)
// ============================================================================

async function handleAtomEngagement(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const concept_id = req.params.concept_id;
  const body = (req.body as any) || {};
  const { atom_id, time_ms, skipped, recall_correct, student_id } = body;
  if (!concept_id) return sendError(res, 400, 'concept_id required');
  if (!atom_id || typeof atom_id !== 'string') {
    return sendError(res, 400, 'atom_id required');
  }
  if (!student_id || typeof student_id !== 'string') {
    return sendError(res, 400, 'student_id required');
  }

  const pool = getAtomPool();
  if (!pool) {
    // Local dev without DB — accept silently
    res.statusCode = 204;
    return res.end();
  }

  try {
    await pool.query(
      `INSERT INTO atom_engagements (student_id, atom_id, concept_id, count, last_seen, last_recall_correct)
       VALUES ($1, $2, $3, 1, NOW(), $4)
       ON CONFLICT (student_id, atom_id) DO UPDATE
         SET count = atom_engagements.count + 1,
             last_seen = NOW(),
             last_recall_correct = COALESCE(EXCLUDED.last_recall_correct, atom_engagements.last_recall_correct)`,
      [student_id, atom_id, concept_id, recall_correct ?? null],
    );
    res.statusCode = 204;
    res.end();
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

// ============================================================================
// ContentAtom v2 — learning objectives endpoint
// ============================================================================

async function handleConceptObjectives(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const concept_id = req.params.id;
  if (!concept_id) return sendError(res, 400, 'concept_id required');
  try {
    const meta = await loadConceptMeta(concept_id);
    sendJSON(res, { learning_objectives: meta.learning_objectives ?? [] });
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

// ============================================================================
// ContentAtom v2 — daily cards endpoint (E8)
// ============================================================================

async function handleDailyCards(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  const last_lesson_visit = body.last_lesson_visit || body.student?.last_lesson_visit;
  const mastery_by_concept = body.mastery_by_concept || body.student?.mastery_by_concept || {};

  // Find concepts due via SM-2 (existing pure function)
  const due = findDueReviews(last_lesson_visit, new Date());
  if (due.length === 0) {
    return sendJSON(res, { cards: [], message: 'All caught up for today' });
  }

  // Filter to mastered concepts (0.6 - 0.95 range — past learning, not yet exam-ready)
  const eligible = due.filter((d) => {
    const m = mastery_by_concept[d.concept_id] ?? 0.5;
    return m >= 0.6 && m <= 0.95;
  });

  // For each eligible concept, return one retrieval_prompt atom
  const cards: ContentAtom[] = [];
  for (const d of eligible.slice(0, 20)) {
    try {
      const atoms = await loadConceptAtoms(d.concept_id);
      const retrieval = atoms.find((a) => a.atom_type === 'retrieval_prompt');
      if (retrieval) cards.push(retrieval);
    } catch { /* skip concepts without atoms */ }
  }

  if (cards.length === 0) {
    return sendJSON(res, { cards: [], message: 'All caught up for today' });
  }
  sendJSON(res, { cards });
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
  { method: 'POST', path: '/api/lesson/:concept_id/engagement', handler: handleAtomEngagement },
  { method: 'POST', path: '/api/lesson/review-today', handler: handleReviewToday },
  { method: 'POST', path: '/api/lesson/advance-sm2', handler: handleAdvanceSM2 },
  { method: 'GET', path: '/api/knowledge/concepts/:id/objectives', handler: handleConceptObjectives },
  { method: 'POST', path: '/api/daily-cards', handler: handleDailyCards },
];
