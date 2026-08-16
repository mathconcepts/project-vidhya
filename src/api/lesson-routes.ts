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
import { recordShadow } from '../gbrain/fsrs-shadow';
import { recordTelemetry } from '../content/telemetry';
import { recordSignal } from '../curriculum/quality-aggregator';
import { modelToLessonSnapshot, deriveConceptHints } from '../gbrain/integration';
import { getOrCreateStudentModel } from '../gbrain/student-model';
import { ALL_CONCEPTS, resolveConceptOrSection, SECTION_MAP } from '../constants/concept-graph';
import { loadConceptAtoms, loadConceptMeta, ConceptNotFoundError, applyStudentOverrides, applyImprovedSince, applyAbVariants, applyMediaUrls } from '../content/atom-loader';
import { rankAtomsForLesson } from '../personalization/lesson-wire';
import { maybeQueueRegenForStudent } from '../content/concept-orchestrator';
import { selectAtoms } from '../content/pedagogy-engine';
import { applyStanceVariants } from '../content/stance-variants';
import { deriveFraming, type LearnerStance } from '../sessions/learner-framing';
import type { ContentAtom, SessionContext } from '../content/content-types';
import {
  sanitizeRecentErrors,
  sanitizeMasteryMap,
  computeErrorStreak,
} from '../lessons/adaptive-signals';
import type { LessonRequest, Lesson } from '../lessons/types';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

// ============================================================================
// ContentAtom v2 — engagement enrichment helpers
// ============================================================================

// ============================================================================
// RC1 guard — atom fallbacks are never silent
// ============================================================================

/**
 * Counts, per concept, how often the atom path was unavailable and the
 * legacy composer served the lesson instead. Exposed via
 * getAtomFallbackCounts() so the health/metrics surface can report it.
 * The warn fires once per concept per process; the counter always increments.
 */
const _atomFallbackCounts = new Map<string, number>();
const _atomFallbackWarned = new Set<string>();

function noteAtomFallback(concept_id: string): void {
  _atomFallbackCounts.set(concept_id, (_atomFallbackCounts.get(concept_id) ?? 0) + 1);
  if (!_atomFallbackWarned.has(concept_id)) {
    _atomFallbackWarned.add(concept_id);
    console.warn(`[lesson] atoms unavailable for ${concept_id} — falling back to legacy composer`);
  }
}

/** Snapshot of per-concept atom-fallback counts (health/metrics surface). */
export function getAtomFallbackCounts(): Record<string, number> {
  return Object.fromEntries(_atomFallbackCounts);
}

/** Test hook — clears counters and the warn-once memory. */
export function resetAtomFallbackCounts(): void {
  _atomFallbackCounts.clear();
  _atomFallbackWarned.clear();
}

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
/**
 * Motivation values the compose route will accept from a client. Matches the
 * vocabulary `deriveFraming` recognises plus the persona-fixture spellings —
 * anything else is dropped rather than forwarded.
 */
const ALLOWED_MOTIVATION_STATES = new Set([
  'anxious', 'frustrated', 'flagging', 'steady', 'confident', 'driven',
]);
const ALLOWED_REPRESENTATION_MODES = new Set(['geometric', 'algebraic', 'balanced']);

/**
 * Which authored body this snapshot should read.
 *
 * The compose route serves anonymous and demo traffic, where the only state
 * available is what the caller sent. `deriveFraming` already encodes the
 * mastery/motivation rules, so this adapts the snapshot into its input shape
 * rather than restating the thresholds — one derivation drives both the
 * lesson body and the wrong-answer explanation.
 *
 * No snapshot, or a snapshot with no motivation and no mastery for this
 * concept, yields 'steady' — the base text. Absent signal must never be read
 * as "this student is struggling".
 */
export function stanceForSnapshot(
  student: LessonRequest['student'] | undefined,
  concept_id: string,
): LearnerStance {
  if (!student) return 'steady';
  const mastery = student.mastery_by_concept?.[concept_id];
  return deriveFraming(
    {
      mastery_vector: mastery === undefined ? {} : { [concept_id]: { score: mastery } },
      motivation_state: student.motivation_state ?? null,
      representation_mode: student.representation_mode ?? null,
      consecutive_failures: 0,
    },
    concept_id,
  ).stance;
}

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

  // ── Adaptive threading (item 7): sanitize client-transmitted signals ──
  // recent_errors / mastery_by_topic live on body.student per StudentSnapshot;
  // a top-level field is accepted as an alias. Malformed top-level types are
  // rejected (400); malformed ENTRIES are sanitized away. Empty/absent
  // signals must leave behavior byte-identical to a signal-less request.
  const rawRecentErrors = body.recent_errors ?? body.student?.recent_errors;
  if (rawRecentErrors !== undefined && rawRecentErrors !== null && !Array.isArray(rawRecentErrors)) {
    return sendError(res, 400, 'recent_errors must be an array');
  }
  const rawMasteryByTopic = body.mastery_by_topic ?? body.student?.mastery_by_topic;
  if (
    rawMasteryByTopic !== undefined && rawMasteryByTopic !== null &&
    (typeof rawMasteryByTopic !== 'object' || Array.isArray(rawMasteryByTopic))
  ) {
    return sendError(res, 400, 'mastery_by_topic must be an object map');
  }
  const recentErrors = sanitizeRecentErrors(rawRecentErrors);
  const masteryByTopic = sanitizeMasteryMap(rawMasteryByTopic);
  const masteryByConcept = sanitizeMasteryMap(body.student?.mastery_by_concept);

  const lessonReq: LessonRequest = {
    concept_id: body.concept_id,
    session_id: body.session_id,
    student: body.student,
    force_full: body.force_full === true,
    user_material_chunks: Array.isArray(body.user_material_chunks) ? body.user_material_chunks : [],
  };

  // Thread sanitized signals back into the snapshot the personalizer reads,
  // so the existing rules (skip-hook on topic mastery >= 0.75, trap
  // reordering on matching error history) fire on real client data. The
  // personalizer must NEVER see the raw (untrusted) signal fields — any
  // field the client sent is replaced with its sanitized version.
  const hasSignals =
    recentErrors.length > 0 ||
    Object.keys(masteryByTopic).length > 0 ||
    Object.keys(masteryByConcept).length > 0;
  if (lessonReq.student) {
    const s = { ...lessonReq.student };
    if (s.recent_errors !== undefined || recentErrors.length > 0) s.recent_errors = recentErrors;
    if (s.mastery_by_topic !== undefined || Object.keys(masteryByTopic).length > 0) s.mastery_by_topic = masteryByTopic;
    if (s.mastery_by_concept !== undefined) s.mastery_by_concept = masteryByConcept;
    // Stance signal: same rule as every other client-supplied field — a value
    // that is not one we recognise is dropped, not passed along. deriveFraming
    // would ignore an unknown string anyway; clearing it here means nothing
    // downstream ever holds unvalidated client text.
    s.motivation_state = ALLOWED_MOTIVATION_STATES.has(String(s.motivation_state))
      ? String(s.motivation_state)
      : undefined;
    s.representation_mode = ALLOWED_REPRESENTATION_MODES.has(String(s.representation_mode))
      ? (s.representation_mode as NonNullable<typeof s.representation_mode>)
      : undefined;
    lessonReq.student = s;
  } else if (hasSignals) {
    lessonReq.student = {
      ...(recentErrors.length > 0 ? { recent_errors: recentErrors } : {}),
      ...(Object.keys(masteryByTopic).length > 0 ? { mastery_by_topic: masteryByTopic } : {}),
      ...(Object.keys(masteryByConcept).length > 0 ? { mastery_by_concept: masteryByConcept } : {}),
    };
  }

  // GBrain enrichment: if session_id is provided and no explicit student
  // snapshot is passed, fetch the cognitive model and translate it to a
  // StudentSnapshot. Preserves the v2.5 behavior when session_id is
  // omitted or GBrain is unavailable.
  if (lessonReq.session_id && !lessonReq.student) {
    try {
      const model = await getOrCreateStudentModel(lessonReq.session_id);
      lessonReq.student = modelToLessonSnapshot(model);
    } catch {
      // Graceful degradation — lesson works without enrichment
    }
  }

  // Section IDs (e.g. "linear-algebra") map to a first leaf concept for
  // routing — resolve here so atom loading always sees a real concept ID.
  const resolvedConcept = resolveConceptOrSection(lessonReq.concept_id);
  const effective_concept_id = resolvedConcept?.id ?? lessonReq.concept_id;

  try {
    const sources = await resolveSources(lessonReq);
    const base = composeBase(sources);

    // Personalize only if force_full is false
    const personalized = lessonReq.force_full
      ? base
      : personalize(base, lessonReq.student);

    // Attach related problems (leverages existing resolver)
    personalized.related_problems = await buildRelatedProblems(
      effective_concept_id,
      lessonReq.student,
    );

    // Attach next-review date if student has prior visits
    const visit = lessonReq.student?.last_lesson_visit?.[effective_concept_id];
    if (visit) {
      const next = new Date(visit.last_visited_at);
      next.setDate(next.getDate() + visit.sm2_interval_days);
      personalized.next_review_at = next.toISOString();
    }

    // ContentAtom v2: also compute atoms[] for the same concept. Frontend
    // prefers atoms[] when non-empty; otherwise falls through to components[].
    let atoms: ContentAtom[] = [];
    try {
      const conceptAtoms = await loadConceptAtoms(effective_concept_id);
      const conceptMeta = await loadConceptMeta(effective_concept_id);
      // error_streak computed from the client-transmitted recent_errors
      // (consecutive misses on THIS concept). Empty signals ⇒ 0, exactly
      // the pre-realignment behavior.
      const sessionContext: SessionContext = {
        error_streak: computeErrorStreak(recentErrors, effective_concept_id),
        last_error_atom_type: null,
      };
      // Thread client mastery into the PedagogyEngine's tier classifier.
      // A minimal mastery_vector view is enough — readMasteryScore() reads
      // mastery_vector[concept_id].score. Empty map ⇒ null (generic path).
      const clientStudentModel =
        Object.keys(masteryByConcept).length > 0
          ? ({
              mastery_vector: Object.fromEntries(
                Object.entries(masteryByConcept).map(([cid, score]) => [cid, { score }]),
              ),
            } as any)
          : null;
      const selected = selectAtoms({
        conceptAtoms,
        conceptMeta,
        studentModel: clientStudentModel,
        sessionContext,
        routeRequest: {
          user_id: lessonReq.session_id ?? 'anon',
          text: '',
          concept_id: effective_concept_id,
          preferred_exam_id: lessonReq.student?.preferred_exam_id,
        },
      });
      atoms = await enrichAtomsWithEngagement(selected, lessonReq.session_id ?? null);
      // Authored stance variants — the only content personalisation that works
      // without a database, which is what the demo instance runs on. Applied
      // BEFORE per-student overrides so a regenerated per-student body still
      // wins: the more specific signal beats the more general one.
      atoms = applyStanceVariants(atoms, stanceForSnapshot(lessonReq.student, effective_concept_id));
      // Concept-orchestrator v1: apply per-student overrides + populate
      // improved_since for the Improved badge. No-op without DB.
      atoms = await applyStudentOverrides(atoms, lessonReq.session_id ?? null);
      atoms = await applyImprovedSince(atoms);
      // §4.12: A/B test variant assignment runs AFTER overrides (per-student
      // override always wins) but BEFORE the engagement enrichment fields
      // are read by the client.
      atoms = await applyAbVariants(atoms, lessonReq.session_id ?? null);
      atoms = await applyMediaUrls(atoms, lessonReq.session_id ?? null);
      // Phase A wire-in (PR following #36): re-rank within the already-
      // selected set per the PersonalizedSelector. Returns atoms unchanged
      // when the session is anonymous or in the control bucket.
      atoms = (await rankAtomsForLesson(atoms as Array<ContentAtom & Record<string, unknown>>, {
        session_id: lessonReq.session_id ?? null,
        student_id: null, // resolved from session_id inside the helper
        concept_id: effective_concept_id,
        exam_pack_id: lessonReq.student?.preferred_exam_id ?? undefined,
      })) as ContentAtom[];
    } catch (err) {
      if (err instanceof ConceptNotFoundError) {
        noteAtomFallback(effective_concept_id);
      } else {
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
    // Resolve section IDs (e.g. "differential-equations") to their first leaf
    // concept so atom loading and source resolution both find real content.
    const resolvedConcept = resolveConceptOrSection(concept_id);
    const effective_concept_id = resolvedConcept?.id ?? concept_id;

    const sources = await resolveSources({ concept_id: effective_concept_id });
    const base = composeBase(sources);

    // ContentAtom v2: also attempt to load + select atoms. Additive — clients
    // that don't know about atoms[] still see the legacy components[] field.
    let atoms: ContentAtom[] = [];
    try {
      const conceptAtoms = await loadConceptAtoms(effective_concept_id);
      const conceptMeta = await loadConceptMeta(effective_concept_id);
      const session_id = req.query?.get('session_id') ?? null;
      const student_id = req.query?.get('student_id') ?? session_id;
      const rawProximity = req.query?.get('exam_proximity_days');
      const exam_proximity_days = rawProximity ? Number(rawProximity) : undefined;
      const preferred_exam_id = req.query?.get('preferred_exam_id') ?? undefined;

      // Adaptive threading (item 7): optional JSON-encoded recent_errors
      // query param — same shape the compose body accepts. Malformed JSON
      // degrades to no signal (this is the anonymous GET path); malformed
      // entries are sanitized away. Absent ⇒ error_streak 0 (generic path).
      let recentErrors: ReturnType<typeof sanitizeRecentErrors> = [];
      const rawRecentParam = req.query?.get('recent_errors');
      if (rawRecentParam) {
        try {
          recentErrors = sanitizeRecentErrors(JSON.parse(rawRecentParam));
        } catch { /* unparseable — treat as no signal */ }
      }

      let studentModel = null;
      if (session_id) {
        try {
          studentModel = await getOrCreateStudentModel(session_id);
        } catch { /* graceful degradation */ }
      }
      const sessionContext: SessionContext = {
        error_streak: computeErrorStreak(recentErrors, effective_concept_id),
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
          concept_id: effective_concept_id,
          exam_proximity_days,
          preferred_exam_id,
        },
      });
      atoms = await enrichAtomsWithEngagement(selected, student_id);
      // Authored stance variants. This path has a real student model, so the
      // stance comes from stored state rather than from anything a client sent.
      atoms = applyStanceVariants(
        atoms,
        deriveFraming(studentModel as never, effective_concept_id).stance,
      );
      // Concept-orchestrator v1 enrichment.
      atoms = await applyStudentOverrides(atoms, student_id);
      atoms = await applyImprovedSince(atoms);
      atoms = await applyAbVariants(atoms, student_id);
      atoms = await applyMediaUrls(atoms, student_id);
      // Phase A wire-in (PR following #36): re-rank within the already-
      // selected set per the PersonalizedSelector. Returns atoms unchanged
      // when the session is anonymous or in the control bucket.
      atoms = (await rankAtomsForLesson(atoms as Array<ContentAtom & Record<string, unknown>>, {
        session_id: student_id ?? session_id ?? null,
        student_id: null, // resolved from session_id inside the helper
        concept_id: effective_concept_id,
        exam_pack_id: preferred_exam_id ?? undefined,
      })) as ContentAtom[];
    } catch (err) {
      if (err instanceof ConceptNotFoundError) {
        // Legacy base lesson without atoms — loudly counted, never silent.
        noteAtomFallback(effective_concept_id);
      } else {
        console.warn(`[lesson-routes] atom load failed for ${effective_concept_id}: ${(err as Error).message}`);
      }
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
    res.end();
    return;
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

    // Concept-orchestrator v1 (E5): when the student fails, fire-and-forget
    // a check on whether this is the 3rd failure in 7 days. If so, queue
    // a personalized variant for next-render. Async — does not block the
    // engagement response. Gated on VIDHYA_CONCEPT_ORCHESTRATOR=on.
    if (
      recall_correct === false &&
      student_id &&
      atom_id &&
      process.env.VIDHYA_CONCEPT_ORCHESTRATOR === 'on'
    ) {
      maybeQueueRegenForStudent(student_id, atom_id).catch((err) => {
        console.warn(`[lesson-routes] personalized regen check failed: ${(err as Error).message}`);
      });
    }

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
    ? (Math.max(0, Math.min(4, Math.round(body.quality))) as 0 | 1 | 2 | 3 | 4)
    : inferQualityFromEngagement({
        micro_exercise_correct: body.micro_exercise_correct,
        micro_exercise_duration_ms: body.micro_exercise_duration_ms,
        explicit_difficulty_rating: body.explicit_difficulty_rating,
        skipped_components_count: body.skipped_components_count,
        completed_components_count: body.completed_components_count,
      });

  const nextState = updateVisitState(body.prev_state || null, { quality });

  // Wave 12 / A7 shadow mode: log what FSRS would have scheduled.
  // Fire-and-forget; SM-2 behavior above is UNCHANGED.
  {
    const now = new Date();
    const sm2Due = new Date(now);
    sm2Due.setDate(sm2Due.getDate() + nextState.sm2_interval_days);
    const prev = body.prev_state;
    recordShadow({
      site: 'lessons',
      studentId: String(body.session_id || 'anonymous'),
      itemKey: String(body.concept_id),
      prior: prev && prev.sm2_interval_days > 0 ? {
        intervalDays: Number(prev.sm2_interval_days) || 0,
        easeFactor: Number(prev.sm2_ease_factor) || 2.5,
        lastReviewedAt: prev.last_visited_at || now.toISOString(),
        reps: Number(prev.visit_count) || 0,
      } : null,
      quality,
      sm2DueAt: sm2Due.toISOString(),
      now,
    });
  }

  sendJSON(res, { concept_id: body.concept_id, state: nextState, inferred_quality: quality });
}

// ============================================================================
// Formula Map (E7) — GET /api/lesson/formula-map/:module
// ============================================================================

interface FormulaEntry {
  id: string;
  name: string;
  latex: string;
  description: string;
  tags?: string[];
}

const FORMULA_SEEDS: Record<string, { title: string; entries: FormulaEntry[] }> = {
  'linear-algebra': {
    title: 'Linear Algebra',
    entries: [
      { id: 'la_rank_nullity', name: 'Rank-Nullity Theorem', latex: 'rank(A) + nullity(A) = n', description: 'For an m×n matrix A, the rank (dimension of column space) plus the nullity (dimension of null space) equals the number of columns n.', tags: ['rank', 'nullity', 'subspaces'] },
      { id: 'la_det_product', name: 'Determinant Multiplicativity', latex: 'det(AB) = det(A) · det(B)', description: 'The determinant of a product of square matrices equals the product of their determinants. Useful for proving invertibility of composed linear maps.', tags: ['determinant', 'invertibility'] },
      { id: 'la_eigen', name: 'Characteristic Equation', latex: 'det(A − λI) = 0', description: 'Eigenvalues λ are roots of the characteristic polynomial. Each eigenvalue has an associated eigenspace (the null space of A − λI).', tags: ['eigenvalues', 'characteristic polynomial'] },
      { id: 'la_cayley', name: 'Cayley-Hamilton Theorem', latex: 'p(A) = 0  where  p(λ) = det(A − λI)', description: 'Every square matrix satisfies its own characteristic equation. Useful for computing matrix inverses and high powers of A without diagonalisation.', tags: ['cayley-hamilton', 'matrix powers'] },
      { id: 'la_spectral', name: 'Spectral Decomposition', latex: 'A = PDP⁻¹  (A = QDQᵀ when symmetric)', description: 'A diagonalisable matrix can be written as A = PDP⁻¹ where D is diagonal (eigenvalues) and P columns are eigenvectors. Symmetric matrices always have a real orthogonal decomposition.', tags: ['diagonalisation', 'eigenvectors'] },
    ],
  },
  'calculus': {
    title: 'Calculus',
    entries: [
      { id: 'calc_chain', name: 'Chain Rule', latex: '(f∘g)′(x) = f′(g(x)) · g′(x)', description: 'Differentiating a composition: differentiate the outer function at the inner, multiply by the derivative of the inner.', tags: ['differentiation', 'composition'] },
      { id: 'calc_ibp', name: 'Integration by Parts', latex: '∫u dv = uv − ∫v du', description: 'Choose u to differentiate and dv to integrate (LIATE heuristic: Logarithm, Inverse-trig, Algebraic, Trigonometric, Exponential). Reduces one integral to a hopefully simpler one.', tags: ['integration', 'LIATE'] },
      { id: 'calc_ftc', name: 'Fundamental Theorem of Calculus', latex: 'F′(x) = f(x)  ⟺  ∫_a^b f = F(b) − F(a)', description: 'Part I: every continuous function has an antiderivative. Part II: evaluating a definite integral reduces to evaluating the antiderivative at the endpoints.', tags: ['definite integral', 'antiderivative'] },
      { id: 'calc_taylor', name: "Taylor's Theorem", latex: 'f(x) = Σ_{n=0}^{∞} f⁽ⁿ⁾(a)/n! · (x−a)ⁿ', description: 'Any infinitely-differentiable function can be expanded in a power series about x = a. The Maclaurin series is the special case a = 0.', tags: ['series', 'approximation'] },
    ],
  },
  'probability': {
    title: 'Probability & Statistics',
    entries: [
      { id: 'prob_bayes', name: "Bayes' Theorem", latex: 'P(A|B) = P(B|A)·P(A) / P(B)', description: 'Updates belief in A given evidence B. P(A) is the prior; P(B|A) is the likelihood; P(A|B) is the posterior. P(B) is the normalising constant (sum over all hypotheses).', tags: ['conditional probability', 'Bayesian'] },
      { id: 'prob_exp', name: 'Law of Total Expectation', latex: 'E[X] = E[E[X|Y]]', description: 'The expectation of X equals the expectation (over Y) of the conditional expectation of X given Y. Useful when conditioning on Y simplifies the inner expectation.', tags: ['expectation', 'conditioning'] },
      { id: 'prob_var', name: 'Variance Decomposition', latex: 'Var(X) = E[Var(X|Y)] + Var(E[X|Y])', description: 'Total variance = average conditional variance (within groups) + variance of group means (between groups). Underlies ANOVA.', tags: ['variance', 'conditioning'] },
      { id: 'prob_clt', name: 'Central Limit Theorem', latex: '(X̄_n − μ)/(σ/√n) → N(0,1)  as  n→∞', description: 'The standardised sample mean of any distribution with finite mean μ and variance σ² converges in distribution to the standard normal. n ≥ 30 is the common rule of thumb.', tags: ['CLT', 'normal approximation'] },
    ],
  },
};

async function handleFormulaMap(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const moduleId = req.params.module;
  if (!moduleId) return sendError(res, 400, 'module is required');

  const seed = FORMULA_SEEDS[moduleId];
  if (!seed) {
    return sendJSON(res, { module: moduleId, title: moduleId, entries: [] });
  }
  return sendJSON(res, { module: moduleId, title: seed.title, entries: seed.entries });
}

// ============================================================================
// NAT-only mode filter — GET /api/practice/nat-only (E7)
// Redirects to SmartPracticePage with ?mode=nat filter; the actual filtering
// is client-side (the SmartPracticePage reads the query param).
// The backend doesn't need a new endpoint — the mode is a URL convention.
// See frontend SmartPracticePage for the ?mode=nat handling.
// ============================================================================

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
  { method: 'GET', path: '/api/lesson/formula-map/:module', handler: handleFormulaMap },
];
