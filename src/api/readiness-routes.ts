/**
 * src/api/readiness-routes.ts — Wave 4 reachable surface, extended in
 * Wave 7 with the actual engine wiring.
 *
 * Wave 4 endpoints (unchanged):
 *
 *   POST /api/readiness/warmup/next
 *     body: { skill_id, state? }
 *     Returns: { probe, state, converged, ability_estimate? }
 *     Server has no warmup persistence yet — caller round-trips the
 *     state JSON. This keeps the API stateless and lets the warmup work
 *     anonymously (the v4.16 anonymous-first contract).
 *
 *   POST /api/readiness/warmup/apply
 *     body: { state, object_id, difficulty, correct }
 *     Returns: { state, converged, ability_estimate?, summary }
 *     Pure-function reducer; client manages persistence.
 *
 * Wave 7 endpoints (new — student-authenticated):
 *
 *   GET /api/readiness/next-action?time_budget_min=N
 *     Composes SyllabusAwareReadinessEngine (src/readiness/syllabus-aware-engine.ts)
 *     from: getStudentModel() (Pg-backed), ProtoCATSelector over the
 *     Pg-backed LearningObjectCatalog, the motivation-aware TeachingPolicy,
 *     ConceptGraphCurriculumRepo (src/curriculum/curriculum-repo.ts), and a
 *     SyllabusContextProvider adapter over the flat-file exam-profile-store
 *     (src/session-planner/exam-profile-store.ts — sync, file-based, never
 *     throws when the file doesn't exist yet, so this works with or
 *     without DATABASE_URL).
 *     Returns: { action, expected_score } — action is the engine's `Action`
 *     (src/core/interfaces.ts). Since Wave 8 (migration 032 gave
 *     `generated_problems` nullable question_type/marks/answer columns),
 *     `attachMarking()` below resolves a practice action's objectId back
 *     through the catalog and attaches deterministic-scorer's
 *     `describeMarking()` block ({ marks_correct, marks_wrong }) when —
 *     and only when — the row carries real marking. Unmarked rows and
 *     pre-032 deploys attach nothing; marking is never fabricated.
 *     DB-less / cold-start (engine falls back to 'diagnose' with no
 *     objectId, or any dependency throws) → { action, expected_score: null,
 *     reason: "building your baseline" }.
 *
 *   GET /api/readiness/expected-score
 *     Returns computeExpectedScore's { realized, potential } via the same
 *     engine's `expectedScore()`, plus `ratio` (realized/potential, or null
 *     when potential is 0 — "no data yet" per expected-score.ts's own
 *     contract). DB-less / no scoped nodes → { realized: 0, potential: 0,
 *     ratio: null, reason: "building your baseline" }.
 *
 * Wired into src/server.ts. The Wave 4 endpoints have no DB dependency
 * (pure logic + injectable catalog). The Wave 7 endpoints depend on
 * getStudentModel() (src/gbrain/student-model-pg.ts) and
 * getLearningObjectCatalog() (src/scoring/learning-object-catalog-pg.ts),
 * both of which degrade to honest empty/zero responses without
 * DATABASE_URL rather than throwing.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import {
  newWarmup,
  applyWarmupOutcome,
  isConverged,
  finalAbility,
  pickNextProbe,
  summarize,
  type WarmupState,
} from '../readiness/diagnostic-warmup';
import { InMemoryCatalog, type LearningObjectCatalog } from '../scoring/learning-object-catalog';
import { getLearningObjectCatalog } from '../scoring/learning-object-catalog-pg';
import { getStudentModel } from '../gbrain/student-model-pg';
import { ProtoCATSelector } from '../scoring/proto-cat-selector';
import { makeMotivationAwarePolicy } from '../teaching/motivation-aware-policy';
import { getMotivationSource } from '../teaching/motivation-source-pg';
import { describeMarking, type GateItemKind } from '../scoring/deterministic-scorer';
import { ConceptGraphCurriculumRepo } from '../curriculum/curriculum-repo';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import {
  makeSyllabusAwareReadinessEngine,
  type SyllabusContextProvider,
} from '../readiness/syllabus-aware-engine';
import { getProfile } from '../session-planner/exam-profile-store';
import type { Action } from '../core/interfaces';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ────────────────────────────────────────────────────────────────────
// Catalog provider — pluggable, defaults to empty until a DB-backed
// impl lands. Apps can override at boot via setReadinessCatalog().
// ────────────────────────────────────────────────────────────────────

let _catalog: LearningObjectCatalog = new InMemoryCatalog([]);

/**
 * Inject a catalog at boot. The default is empty — without an override,
 * the warmup endpoint will report "no probe available" rather than
 * hanging or throwing. Production wiring assigns a Postgres-backed
 * catalog that queries the generated_problems table.
 */
export function setReadinessCatalog(catalog: LearningObjectCatalog): void {
  _catalog = catalog;
}

// ────────────────────────────────────────────────────────────────────
// POST /api/readiness/warmup/next — get the next probe item
// ────────────────────────────────────────────────────────────────────

async function handleWarmupNext(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body ?? {}) as Record<string, any>;
  const skillId: string | undefined = body.skill_id;
  if (!skillId || typeof skillId !== 'string') {
    return sendJSON(res, { error: 'skill_id is required' }, 400);
  }

  const state: WarmupState = isWarmupState(body.state)
    ? body.state
    : newWarmup(skillId);

  // Defensive: caller's state must match the skill_id they're working on.
  if (state.skillId !== skillId) {
    return sendJSON(res, { error: 'state.skillId does not match body.skill_id' }, 400);
  }

  if (isConverged(state)) {
    return sendJSON(res, {
      converged: true,
      ability_estimate: finalAbility(state),
      summary: summarize(state),
      probe: null,
    });
  }

  try {
    const probe = await pickNextProbe(state, { catalog: _catalog });
    if (!probe) {
      // Catalog exhausted — emit what we have, with `exhausted: true` so
      // the client UI can show "we ran out of warm-up items; let's start
      // your practice with the rough estimate we have."
      return sendJSON(res, {
        converged: false,
        exhausted: true,
        ability_estimate: finalAbility(state),
        summary: summarize(state),
        probe: null,
      });
    }
    return sendJSON(res, {
      converged: false,
      exhausted: false,
      probe,
      state,
    });
  } catch (err) {
    return sendJSON(res, { error: (err as Error).message }, 500);
  }
}

// ────────────────────────────────────────────────────────────────────
// POST /api/readiness/warmup/apply — apply an attempt outcome
// ────────────────────────────────────────────────────────────────────

async function handleWarmupApply(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body ?? {}) as Record<string, any>;
  if (!isWarmupState(body.state)) {
    return sendJSON(res, { error: 'state is required' }, 400);
  }
  const objectId = String(body.object_id ?? '');
  const difficulty = Number(body.difficulty);
  const correct = Boolean(body.correct);

  if (!objectId) return sendJSON(res, { error: 'object_id is required' }, 400);
  if (!Number.isFinite(difficulty)) return sendJSON(res, { error: 'difficulty must be a number' }, 400);

  const newState = applyWarmupOutcome(body.state, { objectId, difficulty, correct });
  const converged = isConverged(newState);
  return sendJSON(res, {
    state: newState,
    converged,
    ability_estimate: converged ? finalAbility(newState) : null,
    summary: summarize(newState),
  });
}

// ────────────────────────────────────────────────────────────────────
// Type guard — refuses bogus state from untrusted clients
// ────────────────────────────────────────────────────────────────────

function isWarmupState(v: unknown): v is WarmupState {
  if (!v || typeof v !== 'object') return false;
  const o = v as any;
  return (
    typeof o.skillId === 'string' &&
    typeof o.abilityLow === 'number' &&
    typeof o.abilityHigh === 'number' &&
    Array.isArray(o.answeredIds) &&
    Array.isArray(o.history)
  );
}

// ────────────────────────────────────────────────────────────────────
// Wave 7 — SyllabusContextProvider over the flat-file exam-profile-store
// ────────────────────────────────────────────────────────────────────

/**
 * Adapts the sync, file-backed `exam-profile-store` to the async
 * `SyllabusContextProvider` seam `SyllabusAwareReadinessEngine` expects.
 * Never throws: a student with no registered exams yields `examDate: null`
 * (treated as "far future" by `weeksToExam()`) and `coverage: 0` — the
 * honest "no data yet" signal, not a fabricated estimate.
 */
export class ExamProfileSyllabusContext implements SyllabusContextProvider {
  async examDate(studentId: string): Promise<Date | null> {
    const profile = getProfile(studentId);
    if (!profile || profile.exams.length === 0) return null;
    // Nearest upcoming exam date across the student's registrations.
    const dates = profile.exams
      .map(e => new Date(e.exam_date))
      .filter(d => !Number.isNaN(d.getTime()));
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates.map(d => d.getTime())));
  }

  async coverage(_studentId: string): Promise<number> {
    // No syllabus-coverage signal wired yet (that lives in the
    // syllabus-bridge subsystem, out of scope for Wave 7). Honest default:
    // 0 reads as "early" in inferPhase() rather than fabricating progress.
    return 0;
  }
}

/**
 * Resolve which curriculum nodes are in scope for a student's
 * `nextBestAction()` / `expectedScore()` call. Honest, minimal: the
 * student's registered exam(s) don't currently carry a concept-graph
 * mapping (exam-profile-store predates concept-graph.ts), so this falls
 * back to every concept in the graph — the only course
 * `ConceptGraphCurriculumRepo` covers today (see that file's header).
 *
 * Deliberately the ~80 CONCEPT ids, not the 10 coarser topic ids:
 * `generated_problems.concept_id` (what `PgLearningObjectCatalog` matches
 * `CatalogQuery.skillId` against) is populated with concept-level ids
 * (e.g. 'eigenvalues'), and `StudentModel.abilityFor()` / FSRS cards are
 * tracked per concept too — passing topic ids here would make every
 * catalog lookup and ability lookup miss. A future phase should scope
 * this per the student's actual registered exam once exam→concept-graph
 * mapping exists beyond GATE-MA.
 */
function resolveAllowedNodes(): string[] {
  return ALL_CONCEPTS.map(c => c.id);
}

// ────────────────────────────────────────────────────────────────────
// Wave 7 — engine composition
// ────────────────────────────────────────────────────────────────────

/**
 * Builds the SyllabusAwareReadinessEngine with its concrete Wave 7 deps:
 *   studentModel → getStudentModel()               (Pg-backed, DB-less falls back per that module)
 *   curriculum   → ConceptGraphCurriculumRepo       (static concept graph + Pg-backed catalog)
 *   selector     → ProtoCATSelector                (over the Pg-backed LearningObjectCatalog)
 *   policy       → MotivationAwareTeachingPolicy    (PgMotivationSource — Wave 8; null/cold-start DB-less)
 *   syllabus     → ExamProfileSyllabusContext        (flat-file exam-profile-store adapter)
 *
 * Rebuilt per-request (cheap — every dep here is either a cached
 * singleton accessor or a stateless wrapper) rather than cached at
 * module scope, so a fresh DATABASE_URL / catalog swap doesn't require a
 * server restart to take effect.
 */
function buildReadinessEngine() {
  const catalog: LearningObjectCatalog = getLearningObjectCatalog();
  const studentModel = getStudentModel();
  const curriculum = new ConceptGraphCurriculumRepo({ catalog });
  const selector = new ProtoCATSelector({ studentModel, catalog });
  const policy = makeMotivationAwarePolicy({ motivation: getMotivationSource() });
  const syllabus = new ExamProfileSyllabusContext();

  return makeSyllabusAwareReadinessEngine({
    studentModel,
    curriculum,
    selector,
    policy,
    syllabus,
  });
}

/**
 * Wave 8 — real at last. Resolves a practice Action's objectId back
 * through the catalog (migration 032 gave `generated_problems` nullable
 * `question_type`/`marks`/answer columns; the Pg catalog threads them as
 * payload.questionType/payload.marks) and attaches the deterministic
 * GATE marking block via describeMarking(), so a client can show
 * "correct: +2, wrong: −2/3" before the student answers.
 *
 * Stays honest at every hole: non-practice actions, catalogs without
 * getById, missing objects, and unmarked rows (all pre-032 rows, or a
 * generator not yet emitting marking) all return the action UNCHANGED —
 * no marking block is ever fabricated (blueprint D4/D8).
 *
 * Exported for tests; `catalog` is injectable for the same reason.
 */
export async function attachMarking(
  action: Action,
  catalog: LearningObjectCatalog = getLearningObjectCatalog(),
): Promise<Action & { marking?: { marks_correct: number; marks_wrong: number } }> {
  if (action.kind !== 'practice' || !action.objectId || !catalog.getById) return action;

  try {
    const obj = await catalog.getById(action.objectId);
    const payload = obj?.payload as { questionType?: unknown; marks?: unknown } | undefined;
    const kind = payload?.questionType;
    const marks = payload?.marks;
    if ((kind === 'mcq' || kind === 'msq' || kind === 'nat') && typeof marks === 'number' && marks > 0) {
      return { ...action, marking: describeMarking({ kind: kind as GateItemKind, marks }) };
    }
    return action;
  } catch (err) {
    // A marking lookup failure must never break next-action.
    console.error('[readiness] attachMarking lookup failed, returning unmarked action:', (err as Error).message);
    return action;
  }
}

// ────────────────────────────────────────────────────────────────────
// GET /api/readiness/next-action?time_budget_min=N — student-authenticated
// ────────────────────────────────────────────────────────────────────

async function handleNextAction(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  const timeBudgetRaw = req.query.get('time_budget_min');
  const timeBudgetMin = Number.isFinite(Number(timeBudgetRaw)) && Number(timeBudgetRaw) > 0
    ? Number(timeBudgetRaw)
    : 15;

  try {
    const engine = buildReadinessEngine();
    const allowedNodes = resolveAllowedNodes();
    const action = await engine.nextBestAction(user.userId, { timeBudgetMin, allowedNodes });

    // Honest cold-start framing: a diagnose fallback with no objectId
    // means the engine had nothing concrete to recommend yet (no catalog
    // rows, no attempts, no FSRS cards) — this is the DB-less / fresh
    // student case, not an error.
    if (action.kind === 'diagnose' && !action.objectId) {
      return sendJSON(res, {
        action,
        expected_score: null,
        reason: 'building your baseline',
      });
    }

    return sendJSON(res, {
      action: await attachMarking(action),
      expected_score: null,
    });
  } catch (err) {
    console.error('[readiness] next-action failed:', (err as Error).message);
    return sendJSON(res, {
      action: null,
      expected_score: null,
      reason: 'building your baseline',
    });
  }
}

// ────────────────────────────────────────────────────────────────────
// GET /api/readiness/expected-score — student-authenticated
// ────────────────────────────────────────────────────────────────────

async function handleExpectedScore(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  try {
    const engine = buildReadinessEngine();
    const allowedNodes = resolveAllowedNodes();
    const { realized, potential } = await engine.expectedScore(user.userId, { allowedNodes });
    const ratio = potential > 0 ? realized / potential : null;

    if (potential === 0) {
      return sendJSON(res, {
        realized: 0,
        potential: 0,
        ratio: null,
        reason: 'building your baseline',
      });
    }

    return sendJSON(res, { realized, potential, ratio });
  } catch (err) {
    console.error('[readiness] expected-score failed:', (err as Error).message);
    return sendJSON(res, {
      realized: 0,
      potential: 0,
      ratio: null,
      reason: 'building your baseline',
    });
  }
}

export const readinessRoutes: RouteDefinition[] = [
  { method: 'POST', path: '/api/readiness/warmup/next', handler: handleWarmupNext },
  { method: 'POST', path: '/api/readiness/warmup/apply', handler: handleWarmupApply },
  { method: 'GET', path: '/api/readiness/next-action', handler: handleNextAction },
  { method: 'GET', path: '/api/readiness/expected-score', handler: handleExpectedScore },
];
