/**
 * src/api/quiz-routes.ts — T14 (B5): personal-XP summary + checkpoint quiz.
 *
 *   GET  /api/practice/xp/summary         — student-authenticated
 *     Returns { total_minutes, threshold_minutes, quiz_offer }. The single
 *     fetch NextBestActionCard's focused-work strip (DR-4) needs to render
 *     either the meter ("64 / 100 min") or, once the threshold is reached,
 *     the checkpoint-quiz offer row (DR-3) in the same card slot.
 *
 *     `total_minutes` is NOT a lifetime total — it's XP earned SINCE the
 *     student's most recently SUBMITTED quiz (`quiz_sessions.submitted_at`;
 *     `xpSinceBaseline()` below). "Quiz every N XP" (B5) is a REPEATING
 *     cadence: after a quiz is submitted, the meter must re-arm at 0/100
 *     and refill toward the next offer, not stay pinned at "past threshold"
 *     forever. A student who has never submitted a quiz has no baseline —
 *     their cycle total is their lifetime total, which is what the
 *     original one-time-threshold behavior looked like before this existed.
 *     An IN-PROGRESS (never-submitted) quiz must never move the baseline —
 *     see `getLastSubmittedQuizAt`'s `status = 'submitted'` filter.
 *
 *   POST /api/practice/quiz/start          — student-authenticated
 *     Assembles the pool (due FSRS reviews + frontier concepts, minus the
 *     14-day no-repeat window — src/readiness/quiz-pool.ts), refuses with
 *     422 below the 2× depth gate (amendment #9) OR below the cycle's XP
 *     threshold (`xpSinceBaseline() < QUIZ_XP_THRESHOLD_MINUTES` — both
 *     gates enforced server-side, not just as a frontend display rule),
 *     else samples QUIZ_LENGTH items, commits a quiz_sessions row, and
 *     returns a RENDER-SAFE item list — no answer_index / answer_indices /
 *     answer_range / correct answer ever leaves this endpoint (mirrors
 *     GET /api/practice/item/:id's leak discipline).
 *
 *   POST /api/practice/quiz/:id/submit    — student-authenticated
 *     Grades every item via the SAME GateDeterministicScorer used by
 *     POST /api/practice/attempt, feeds each through the SAME
 *     StudentModel.update() attempt path (Elo + FSRS + FIRe + dedup all
 *     apply exactly as they do for ordinary practice), awards XP per item,
 *     and returns the graded receipt. Idempotent at the session level via
 *     src/scoring/quiz-store-pg.ts's optimistic claim — a retried submit
 *     replays the persisted result rather than re-grading. Per-item
 *     idempotency additionally falls out of a FIXED per-item ts derived
 *     from the session's own started_at (index-offset), the same
 *     fixed-ts-per-load discipline PracticeAttemptPage uses.
 *
 * Timer edge cases: expiry is primarily a CLIENT behavior (the frontend
 * auto-calls submit with whatever was answered when its countdown hits
 * zero) — the server's own contribution is honesty about lateness: any
 * submit landing after `deadline_at` is graded exactly the same as an
 * on-time one, flagged `late: true`, with no bonus (there was never a
 * bonus for on-time either). Unanswered items are graded as skipped, not
 * refused — "what you answered is graded" (DR-3 expiry copy).
 */

import { ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import {
  makeDeterministicScorer,
  describeMarking,
  type GateItem,
} from '../scoring/deterministic-scorer';
import { gateItemFromPayload, gateResponseFromBody } from './practice-routes';
import type { LearningObjectCatalog } from '../scoring/learning-object-catalog';
import { getLearningObjectCatalog } from '../scoring/learning-object-catalog-pg';
import { getStudentModel } from '../gbrain/student-model-pg';
import type { BatchMasteryStudentModel } from '../gbrain/student-model-pg';
import { recordProblemAttempt } from '../gbrain/problem-generator';
import type { Attempt, StudentModel } from '../core/interfaces';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import { makeDueReviewSource, recentlyReviewedObjectIds } from '../readiness/due-cards';
import { assembleQuizPool, quizIsEligible, selectQuizItems, type QuizPoolCandidate } from '../readiness/quiz-pool';
import {
  QUIZ_LENGTH,
  QUIZ_NO_REPEAT_WINDOW_DAYS,
  QUIZ_SECONDS_PER_ITEM,
  QUIZ_XP_THRESHOLD_MINUTES,
  meetsQuizThreshold,
  xpForAttempt,
} from '../scoring/xp';
import { awardXp, xpEarnedSince } from '../gbrain/xp-store';
import {
  claimSubmission, createQuizSession, finalizeQuizSubmission, getLastSubmittedQuizAt, getQuizSession,
} from '../scoring/quiz-store-pg';
import type { DueReviewCandidate } from '../core/interfaces';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

// ────────────────────────────────────────────────────────────────────
// Test seam
// ────────────────────────────────────────────────────────────────────

export interface QuizDeps {
  catalog: () => LearningObjectCatalog;
  studentModel: () => StudentModel & Partial<BatchMasteryStudentModel>;
  recordProblemAttempt: (problemId: string, wasCorrect: boolean) => Promise<void>;
  dueCards: (studentId: string, now: Date, opts: { allowedNodes?: string[] }) => Promise<DueReviewCandidate[]>;
  recentlyReviewed: (studentId: string, now: Date, windowDays: number) => Promise<Set<string>>;
  /** The current cycle's baseline: the most recent SUBMITTED quiz's submitted_at (ms), or null if none. */
  getLastSubmittedQuizAt: (studentId: string) => Promise<number | null>;
  /** XP awarded since a given baseline (ms), or lifetime when baseline is null. */
  xpEarnedSince: (studentId: string, sinceMs: number | null) => Promise<number>;
  awardXp: typeof awardXp;
  createQuizSession: typeof createQuizSession;
  getQuizSession: typeof getQuizSession;
  claimSubmission: typeof claimSubmission;
  finalizeQuizSubmission: typeof finalizeQuizSubmission;
  now: () => Date;
  rng: () => number;
  newQuizId: () => string;
}

const productionDeps: QuizDeps = {
  catalog: getLearningObjectCatalog,
  studentModel: getStudentModel as () => StudentModel & Partial<BatchMasteryStudentModel>,
  recordProblemAttempt,
  dueCards: (studentId, now, opts) => makeDueReviewSource(getLearningObjectCatalog())(studentId, now, opts),
  recentlyReviewed: recentlyReviewedObjectIds,
  getLastSubmittedQuizAt,
  xpEarnedSince,
  awardXp,
  createQuizSession,
  getQuizSession,
  claimSubmission,
  finalizeQuizSubmission,
  now: () => new Date(),
  rng: () => Math.random(),
  newQuizId: () => `quiz-${randomUUID()}`,
};

let deps: QuizDeps = productionDeps;

/** Test hook. Pass null to restore production wiring. */
export function setQuizDepsForTests(override: Partial<QuizDeps> | null): void {
  deps = override ? { ...productionDeps, ...override } : productionDeps;
}

// ────────────────────────────────────────────────────────────────────
// Pool assembly — frontier concepts via the catalog + the due-card scan
// ────────────────────────────────────────────────────────────────────

/** Cap on how many concepts get a frontier catalog probe per pool build — bounded cost, not a hot path. */
const FRONTIER_CONCEPT_SCAN_CAP = 30;
/**
 * Catalog items pulled per frontier concept. Exported so demo seeding
 * (src/scenarios/demo-history-seeder.ts, T20) can reason about an upper
 * bound on quiz-pool size from touched-concept count alone, without a
 * live database — `touchedConcepts * FRONTIER_ITEMS_PER_CONCEPT` is the
 * maximum possible frontier contribution regardless of no-repeat exclusions.
 */
export const FRONTIER_ITEMS_PER_CONCEPT = 3;

async function frontierCandidates(
  studentId: string,
  catalog: LearningObjectCatalog,
  studentModel: StudentModel & Partial<BatchMasteryStudentModel>,
): Promise<Array<{ objectId: string; skillId: string }>> {
  const allowedNodes = ALL_CONCEPTS.map((c) => c.id);

  // "Frontier" = concepts the student has actually begun (not 'not-started') —
  // items from a concept nobody has touched yet aren't a checkpoint's job;
  // that's the teach/diagnose arm's territory.
  let touchedConcepts: string[];
  if (studentModel.masteryStates) {
    const states = await studentModel.masteryStates(studentId, allowedNodes);
    touchedConcepts = allowedNodes.filter((id) => states.get(id) && states.get(id) !== 'not-started');
  } else {
    // No batch capability — fall back to per-skill lookups, capped hard.
    touchedConcepts = [];
    for (const id of allowedNodes.slice(0, FRONTIER_CONCEPT_SCAN_CAP)) {
      const state = await studentModel.masteryState(studentId, id);
      if (state !== 'not-started') touchedConcepts.push(id);
    }
  }

  const scanned = touchedConcepts.slice(0, FRONTIER_CONCEPT_SCAN_CAP);
  const rows = await Promise.all(
    scanned.map((skillId) => catalog.query({ skillId, limit: FRONTIER_ITEMS_PER_CONCEPT })),
  );
  const out: Array<{ objectId: string; skillId: string }> = [];
  for (const items of rows) {
    for (const item of items) out.push({ objectId: item.id, skillId: item.nodeId });
  }
  return out;
}

interface QuizOffer {
  eligible: boolean;
  reason?: string;
  quiz_length?: number;
  pool_size?: number;
  xp_since_baseline?: number;
}

/**
 * The current cycle's XP total: resolves the baseline (most recent
 * SUBMITTED quiz, if any) then sums XP awarded since it. A student who
 * has never submitted a quiz has no baseline — `getLastSubmittedQuizAt`
 * returns null and `xpEarnedSince` falls back to the lifetime sum, so
 * "no quiz yet" behaves exactly like the pre-cycle-baseline behavior.
 */
async function xpSinceBaseline(studentId: string): Promise<number> {
  const baselineMs = await deps.getLastSubmittedQuizAt(studentId);
  return deps.xpEarnedSince(studentId, baselineMs);
}

/**
 * Combines the XP-cycle gate with the pool-depth gate — BOTH must clear
 * for a quiz to be a real, startable offer. `xpMinutes` is threaded in
 * (rather than re-fetched) so callers that already resolved it — the XP
 * summary endpoint — don't pay for a second baseline query.
 */
async function computeQuizOffer(studentId: string, xpMinutes: number): Promise<QuizOffer> {
  const catalog = deps.catalog();
  const studentModel = deps.studentModel();
  const now = deps.now();

  const [dueRows, frontierRows, recentlyReviewed] = await Promise.all([
    deps.dueCards(studentId, now, {}),
    frontierCandidates(studentId, catalog, studentModel),
    deps.recentlyReviewed(studentId, now, QUIZ_NO_REPEAT_WINDOW_DAYS),
  ]);

  const pool = assembleQuizPool(
    dueRows.map((r) => ({ objectId: r.objectId, skillId: r.nodeId ?? null })),
    frontierRows,
    recentlyReviewed,
  );

  const poolOk = quizIsEligible(pool.length, QUIZ_LENGTH);
  const xpOk = meetsQuizThreshold(xpMinutes);

  if (!poolOk || !xpOk) {
    return {
      eligible: false,
      reason: 'Checkpoint unlocks as you practise more',
      pool_size: pool.length,
      xp_since_baseline: xpMinutes,
    };
  }
  return { eligible: true, quiz_length: QUIZ_LENGTH, pool_size: pool.length, xp_since_baseline: xpMinutes };
}

// ────────────────────────────────────────────────────────────────────
// GET /api/practice/xp/summary
// ────────────────────────────────────────────────────────────────────

async function handleXpSummary(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  // total_minutes IS the current cycle's total (since the last submitted
  // quiz, or lifetime if none) — the strip's "64 / 100 min" reads this
  // same number computeQuizOffer below gates on, so the meter and the
  // offer can never disagree about where the student stands.
  const cycleMinutes = await xpSinceBaseline(user.userId).catch((err) => {
    console.error('[quiz] xpSinceBaseline failed, degrading to 0:', (err as Error).message);
    return 0;
  });
  const quizOffer = await computeQuizOffer(user.userId, cycleMinutes).catch((err) => {
    console.error('[quiz] offer computation failed, degrading to not-eligible:', (err as Error).message);
    return { eligible: false, reason: 'Checkpoint unlocks as you practise more', xp_since_baseline: cycleMinutes } as QuizOffer;
  });

  return sendJSON(res, {
    total_minutes: cycleMinutes,
    threshold_minutes: QUIZ_XP_THRESHOLD_MINUTES,
    quiz_offer: quizOffer,
  });
}

// ────────────────────────────────────────────────────────────────────
// POST /api/practice/quiz/start
// ────────────────────────────────────────────────────────────────────

/** Render-safe projection — never includes an answer key (mirrors GET /api/practice/item/:id). */
function renderSafeItem(objectId: string, payload: unknown) {
  const p = (payload ?? {}) as Record<string, unknown>;
  const itemOrReason = gateItemFromPayload(objectId, p);
  const gradable = typeof itemOrReason !== 'string';
  return {
    object_id: objectId,
    topic: typeof p.topic === 'string' ? p.topic : null,
    question_text: typeof p.questionText === 'string' ? p.questionText : null,
    gradable,
    question_type: gradable ? (itemOrReason as GateItem).kind : null,
    marks: gradable ? (itemOrReason as GateItem).marks : null,
    options: gradable && ((itemOrReason as GateItem).kind === 'mcq' || (itemOrReason as GateItem).kind === 'msq')
      ? (itemOrReason as GateItem).options
      : null,
    marking: gradable ? describeMarking(itemOrReason as GateItem) : null,
  };
}

async function handleQuizStart(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  const catalog = deps.catalog();
  const studentModel = deps.studentModel();
  const now = deps.now();

  // Both gates enforced server-side — the frontend's meter/offer switch
  // is a display convenience, not the authority. A client that somehow
  // calls start() before its own cycle has reached the threshold (stale
  // state, a race, a hand-crafted request) gets the same honest refusal.
  const cycleMinutes = await xpSinceBaseline(user.userId);
  if (!meetsQuizThreshold(cycleMinutes)) {
    return sendError(res, 422, 'Checkpoint unlocks as you practise more');
  }

  const [dueRows, frontierRows, recentlyReviewed] = await Promise.all([
    deps.dueCards(user.userId, now, {}),
    frontierCandidates(user.userId, catalog, studentModel),
    deps.recentlyReviewed(user.userId, now, QUIZ_NO_REPEAT_WINDOW_DAYS),
  ]);

  const pool: QuizPoolCandidate[] = assembleQuizPool(
    dueRows.map((r) => ({ objectId: r.objectId, skillId: r.nodeId ?? null })),
    frontierRows,
    recentlyReviewed,
  );

  if (!quizIsEligible(pool.length, QUIZ_LENGTH)) {
    return sendError(res, 422, 'Checkpoint unlocks as you practise more');
  }

  const chosen = selectQuizItems(pool, QUIZ_LENGTH, deps.rng);
  const items = await Promise.all(chosen.map((c) => catalog.getById?.(c.objectId)));
  const usable = items.filter((it): it is NonNullable<typeof it> => Boolean(it));
  if (usable.length === 0) {
    return sendError(res, 422, 'Checkpoint unlocks as you practise more');
  }

  const startedAtMs = now.getTime();
  const deadlineAtMs = startedAtMs + usable.length * QUIZ_SECONDS_PER_ITEM * 1000;
  const quizId = deps.newQuizId();

  try {
    await deps.createQuizSession({
      id: quizId,
      studentId: user.userId,
      itemIds: usable.map((it) => it.id),
      startedAtMs,
      deadlineAtMs,
    });
  } catch (err) {
    console.error('[quiz] session creation failed:', (err as Error).message);
    return sendError(res, 503, 'checkpoint quiz unavailable — try again shortly');
  }

  return sendJSON(res, {
    quiz_id: quizId,
    deadline_at: new Date(deadlineAtMs).toISOString(),
    time_budget_sec: usable.length * QUIZ_SECONDS_PER_ITEM,
    items: usable.map((it) => renderSafeItem(it.id, it.payload)),
  });
}

// ────────────────────────────────────────────────────────────────────
// POST /api/practice/quiz/:id/submit
// ────────────────────────────────────────────────────────────────────

interface PerItemResult {
  object_id: string;
  correct: boolean;
  earned: number;
  max: number;
  skipped: boolean;
}

async function gradeQuizItems(
  studentId: string,
  itemIds: string[],
  startedAtMs: number,
  responsesByObjectId: Map<string, unknown>,
  catalog: LearningObjectCatalog,
  studentModel: StudentModel,
): Promise<{ perItem: PerItemResult[]; earned: number; max: number }> {
  const scorer = makeDeterministicScorer();
  const perItem: PerItemResult[] = [];
  let earned = 0;
  let max = 0;

  // Prefetch every item's payload concurrently (mirrors handleQuizStart's
  // existing `Promise.all(chosen.map(...))` prefetch) — the grading/update
  // loop below stays sequential (each iteration's StudentModel.update /
  // awardXp genuinely depends on the previous one committing), but there's
  // no reason the N catalog reads that feed it should also be N round trips.
  const objs = await Promise.all(itemIds.map((id) => (catalog.getById ? catalog.getById(id) : Promise.resolve(null))));

  for (let i = 0; i < itemIds.length; i++) {
    const objectId = itemIds[i];
    const obj = objs[i];
    if (!obj) continue; // deleted/demoted since the quiz started — skip rather than guess

    const itemOrReason = gateItemFromPayload(objectId, obj.payload);
    if (typeof itemOrReason === 'string') continue; // no longer gradable — excluded honestly

    const rawResponse = responsesByObjectId.get(objectId) ?? { skipped: true };
    const responseOrReason = gateResponseFromBody(itemOrReason, rawResponse);
    const response = typeof responseOrReason === 'string' ? { kind: itemOrReason.kind, skipped: true } : responseOrReason;

    const grade = await scorer.grade(itemOrReason, response);
    max += grade.max;
    earned += grade.earned;
    perItem.push({ object_id: objectId, correct: grade.casFinalAnswerCorrect === true, earned: grade.earned, max: grade.max, skipped: Boolean(response.skipped) });

    // Fixed per-item ts (index-offset from session start) — the same
    // "fixed ts per load" idempotency discipline PracticeAttemptPage uses,
    // so a retried submit with the same items dedups on (student, object, ts)
    // inside StudentModel.update() exactly like a retried practice attempt.
    const ts = startedAtMs + i;
    const skillId = obj.nodeId;

    if (!response.skipped) {
      const attempt: Attempt = {
        studentId,
        objectId,
        skillId,
        correct: grade.casFinalAnswerCorrect === true,
        partialMarks: { earned: grade.earned, max: grade.max, perCriterion: grade.perCriterion },
        latencyMs: 0,
        ts,
      };
      try {
        await studentModel.update(attempt);
        await deps.recordProblemAttempt(objectId, attempt.correct).catch(() => {});
        const xp = xpForAttempt({ earned: grade.earned, max: grade.max }, obj.estMinutes);
        await deps.awardXp({ studentId, objectId, skillId, xpAmount: xp, source: 'quiz', tsMs: ts });
      } catch (err) {
        console.error(`[quiz] per-item update failed for object=${objectId} (grade still stands):`, (err as Error).message);
      }
    }
  }

  return { perItem, earned, max };
}

async function handleQuizSubmit(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  const quizId = req.params.id;
  if (!quizId) return sendError(res, 400, 'quiz id is required');

  const existing = await deps.getQuizSession(quizId).catch(() => null);
  if (!existing) return sendError(res, 404, `unknown quiz: ${quizId}`);
  if (existing.studentId !== user.userId) return sendError(res, 404, `unknown quiz: ${quizId}`);

  const now = deps.now();
  const claim = await deps.claimSubmission(quizId, now.getTime());
  if (!claim) return sendError(res, 404, `unknown quiz: ${quizId}`);

  if (!claim.fresh) {
    // Already graded by an earlier call — replay the persisted receipt,
    // never re-grade a possibly-different payload.
    const r = claim.row;
    return sendJSON(res, { quiz_id: quizId, ...(r.result as object ?? {}), late: r.late, recorded: true, replayed: true });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const rawResponses = Array.isArray(body.responses) ? body.responses : [];
  const responsesByObjectId = new Map<string, unknown>();
  for (const r of rawResponses) {
    const rr = (r ?? {}) as Record<string, unknown>;
    if (typeof rr.object_id === 'string') responsesByObjectId.set(rr.object_id, rr);
  }

  const catalog = deps.catalog();
  const studentModel = deps.studentModel();
  const late = now.getTime() > claim.row.deadlineAtMs;

  let grading: { perItem: PerItemResult[]; earned: number; max: number };
  try {
    grading = await gradeQuizItems(user.userId, claim.row.itemIds, claim.row.startedAtMs, responsesByObjectId, catalog, studentModel);
  } catch (err) {
    console.error('[quiz] grading failed:', (err as Error).message);
    return sendError(res, 500, 'quiz grading failed');
  }

  const correct = grading.perItem.filter((p) => p.correct).length;
  const wrong = grading.perItem.filter((p) => !p.correct && !p.skipped).length;
  const skipped = grading.perItem.filter((p) => p.skipped).length;

  const result = {
    earned: grading.earned,
    max: grading.max,
    correct,
    wrong,
    skipped,
    per_item: grading.perItem,
  };

  const saved = await deps.finalizeQuizSubmission(quizId, {
    late,
    score: grading.earned,
    maxMarks: grading.max,
    result,
    gradedAtMs: now.getTime(),
  }).catch((err) => {
    console.error('[quiz] finalize failed (grade still returned to client):', (err as Error).message);
    return null;
  });

  return sendJSON(res, {
    quiz_id: quizId,
    ...result,
    late,
    recorded: saved !== null,
  });
}

export const quizRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/practice/xp/summary', handler: handleXpSummary },
  { method: 'POST', path: '/api/practice/quiz/start', handler: handleQuizStart },
  { method: 'POST', path: '/api/practice/quiz/:id/submit', handler: handleQuizSubmit },
];
