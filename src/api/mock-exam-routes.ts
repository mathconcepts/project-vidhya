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
 *
 *   GET  /api/gbrain/mock-exam/:id/result             — student-authenticated
 *     Plan W3.2: the persisted analysis of an already-submitted exam plus
 *     the attempt/skip counterfactual computed from its per-question
 *     decomposition (amendment E3). Same ownership rule as submit. The
 *     revisit path — "revisiting an old mock → same screen from persisted
 *     analysis" in the W-UI state matrix.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { generateMockExam as generateMockExamProd } from '../gbrain/operations/moat-operations';
import { MARKS_WEIGHTS, TOPIC_NAMES } from '../engine/priority-engine';
import {
  createMockExam, getMockExam, claimMockExamSubmission, finalizeMockExamSubmission, revertClaim,
  sessionOwner, claimUnclaimedSessionRows, claimMockExamOwner,
  type MockExamRow,
} from '../gbrain/mock-exam-store';
import {
  normalizeMockExamRow, gradeMockExam, type MockExamQuestionRow, type NormalizedMockQuestion, type MockExamResponse,
} from '../gbrain/mock-exam-grading';
import { resolveAssessmentContract } from '../exams/assessment-contract-loader';
import { snapshotForCreation, parseContractSnapshot, makeContractGrader } from '../scoring/contract-grading';
import { recordAttemptFacts, type AttemptFact } from '../gbrain/attempt-facts';
import { getTopicAccuracy } from '../gbrain/topic-accuracy';
import {
  computeAttemptCounterfactual,
  counterfactualParamsFrom,
  type CounterfactualQuestion,
  type CounterfactualReport,
} from '../readiness/attempt-counterfactual';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

// ────────────────────────────────────────────────────────────────────
// C1/C2 request parsing — topic-wise mocks + exam-feel timing modes
// ────────────────────────────────────────────────────────────────────

const KNOWN_TIMING_MODES = new Set(['standard', 'compressed', 'rush']);

/**
 * Parses the `?topics=` query param (comma-separated) into a deduped list,
 * or `{ error }` naming the first unrecognized topic — refused up front
 * rather than silently falling back to the full syllabus, so a typo in the
 * topic name doesn't quietly produce a full-length exam instead of the
 * scoped one the student asked for.
 */
function parseTopicsParam(raw: string | null): { topics?: string[]; error?: string } {
  if (!raw || raw.trim() === '') return {};
  const requested = raw.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const t of requested) {
    if (!Object.prototype.hasOwnProperty.call(MARKS_WEIGHTS, t)) {
      return { error: `unknown topic: ${t}` };
    }
    if (!seen.has(t)) { seen.add(t); topics.push(t); }
  }
  return { topics };
}

/** Parses `?mode=` into a validated timing mode, or `{ error }` naming the bad value. */
function parseTimingModeParam(raw: string | null): { mode?: 'standard' | 'compressed' | 'rush'; error?: string } {
  if (!raw || raw.trim() === '') return { mode: 'standard' };
  const trimmed = raw.trim();
  if (!KNOWN_TIMING_MODES.has(trimmed)) {
    return { error: `unknown timing mode: ${trimmed} (expected standard, compressed, or rush)` };
  }
  return { mode: trimmed as 'standard' | 'compressed' | 'rush' };
}

// ────────────────────────────────────────────────────────────────────
// Test seam
// ────────────────────────────────────────────────────────────────────

export interface MockExamDeps {
  generateMockExam: typeof generateMockExamProd;
  createMockExam: typeof createMockExam;
  getMockExam: typeof getMockExam;
  claimMockExamSubmission: typeof claimMockExamSubmission;
  finalizeMockExamSubmission: typeof finalizeMockExamSubmission;
  revertClaim: typeof revertClaim;
  sessionOwner: typeof sessionOwner;
  claimUnclaimedSessionRows: typeof claimUnclaimedSessionRows;
  claimMockExamOwner: typeof claimMockExamOwner;
  /** Plan E7 — resolved ONCE at generation and pinned onto the row. Never throws (see the loader's header). */
  resolveContract: typeof resolveAssessmentContract;
  /** Plan E1(b) — fire-and-forget per-question ledger rows at grade time. */
  recordAttemptFacts: typeof recordAttemptFacts;
  /** Plan W3.2 — per-topic graded-attempt evidence for the skip counterfactual. */
  getTopicAccuracy: typeof getTopicAccuracy;
  now: () => Date;
}

const productionDeps: MockExamDeps = {
  generateMockExam: generateMockExamProd,
  createMockExam,
  getMockExam,
  claimMockExamSubmission,
  finalizeMockExamSubmission,
  revertClaim,
  sessionOwner,
  claimUnclaimedSessionRows,
  claimMockExamOwner,
  resolveContract: resolveAssessmentContract,
  recordAttemptFacts,
  getTopicAccuracy,
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
// W3.2 — the post-mock attempt/skip counterfactual
// ────────────────────────────────────────────────────────────────────

/**
 * The E3 per-question decomposition as it is persisted inside
 * `mock_exams.analysis`. Read back defensively: a row written months ago
 * is data, not a typed value, and a half-shaped entry is dropped rather
 * than coerced.
 */
function perQuestionFromAnalysis(analysis: unknown): CounterfactualQuestion[] | null {
  const a = (analysis ?? {}) as Record<string, unknown>;
  const raw = a.per_question;
  // A legacy row (graded before E3) carries no key at all — that is the
  // headline-only degradation, and it is DIFFERENT from a row whose exam
  // genuinely had nothing gradable in it (an empty array).
  if (!Array.isArray(raw)) return null;

  const out: CounterfactualQuestion[] = [];
  for (const entry of raw) {
    const e = (entry ?? {}) as Record<string, unknown>;
    if (typeof e.id !== 'string') continue;
    if (e.kind !== 'mcq' && e.kind !== 'msq' && e.kind !== 'nat') continue;
    if (typeof e.max !== 'number' || typeof e.earned !== 'number') continue;
    out.push({
      id: e.id,
      kind: e.kind,
      marks: e.max,
      earned: e.earned,
      skipped: e.skipped === true,
    });
  }
  return out;
}

/**
 * Attach the topic/concept each question came from. The decomposition
 * itself deliberately carries neither (it is the grading half's output,
 * and grading has no use for them); the mock's own stored question rows
 * do, so they are joined here rather than widening the grading result.
 */
function withQuestionContext(
  decomposition: CounterfactualQuestion[],
  questions: ReadonlyArray<unknown>,
): CounterfactualQuestion[] {
  const byId = new Map<string, Record<string, unknown>>();
  for (const q of questions) {
    const row = (q ?? {}) as Record<string, unknown>;
    if (typeof row.id === 'string') byId.set(row.id, row);
  }
  return decomposition.map((d) => {
    const row = byId.get(d.id);
    return {
      ...d,
      topic: typeof row?.topic === 'string' ? row.topic : null,
      // PYQ-sourced rows carry none: the mock generator's pyq_questions
      // SELECT doesn't pull the concept_id column migration 044 added.
      conceptId: typeof row?.concept_id === 'string' ? row.concept_id : null,
    };
  });
}

/**
 * Build the counterfactual for one graded exam. Never throws — the
 * counterfactual is analysis ABOVE a score that is already final, so a
 * failure here degrades to the honest unavailable shape rather than
 * failing a request that would otherwise have shown the student their
 * marks.
 */
async function buildCounterfactual(row: MockExamRow, studentId: string): Promise<CounterfactualReport> {
  const decomposition = perQuestionFromAnalysis(row.analysis);
  const snapshot = parseContractSnapshot(row.contractVersion, row.contractParams);
  const params = counterfactualParamsFrom(snapshot?.marking ?? null);

  if (decomposition === null) {
    return computeAttemptCounterfactual({ perQuestion: null, params });
  }

  const perQuestion = withQuestionContext(decomposition, row.questions);
  // Only pay for the topic-evidence read when there is a skip it could
  // price. A paper with nothing skipped can't produce a skip line.
  const topicEvidence = perQuestion.some((q) => q.skipped)
    ? await deps.getTopicAccuracy(studentId).catch((err) => {
        console.error('[mock-exam] topic accuracy read failed (skip lines omitted):', (err as Error).message);
        return {};
      })
    : {};

  return computeAttemptCounterfactual({ perQuestion, params, topicEvidence });
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

  const topicsResult = parseTopicsParam(req.query.get('topics'));
  if (topicsResult.error) return sendError(res, 400, topicsResult.error);
  const modeResult = parseTimingModeParam(req.query.get('mode'));
  if (modeResult.error) return sendError(res, 400, modeResult.error);

  // DB-less deploys (demo, boot-before-migrate) can't run the ownership
  // lookups or the persistence step below — fail honestly up front rather
  // than letting the underlying store throw its internal
  // "DATABASE_URL not configured" message out through the 500 catch
  // further down, which would leak an implementation detail straight to
  // the student. Explicit env check (not error-message sniffing) mirrors
  // src/readiness/warmup-onboarding.ts's DB-less guard.
  if (!process.env.DATABASE_URL) {
    return sendError(res, 503, 'mock exam unavailable — try again shortly');
  }

  // Ownership binding, NOT sessionId===user.userId (that check 403'd every
  // real student — MockExamPage.tsx's sessionId is the anonymous
  // useSession() localStorage UUID, unrelated to the authenticated id).
  // A student may only generate under a session this SAME authenticated
  // caller already owns, or one nobody owns yet:
  //   - claim any pre-fix/unclaimed rows under this session for THIS caller
  //     (a no-op if there are none, or if they're already claimed);
  //   - re-read the session's owner — if it's now someone ELSE, this
  //     caller lost the race (or the session already belonged to another
  //     student before this fix shipped) → 403;
  //   - otherwise (owner is this caller, or still nobody — a brand-new
  //     session) proceed, and the newly-created row below is stamped with
  //     this caller's id regardless.
  // Teachers/admins are exempt: they legitimately generate mock exams for
  // students they don't own, and their generated rows are owned by THEM.
  if (user.role === 'student') {
    // Fail CLOSED, not open: this ownership check is a security control
    // (it's what fixed the IDOR where any student could read another
    // student's keyed session). A DB error here must never be treated as
    // "no owner found yet, proceed" — that would silently reopen the same
    // hole this code exists to close.
    try {
      await deps.claimUnclaimedSessionRows(sessionId, user.userId);
      const owner = await deps.sessionOwner(sessionId);
      if (owner !== null && owner !== user.userId) {
        return sendError(res, 403, 'cannot generate a mock exam for another session');
      }
    } catch (err) {
      console.error('[mock-exam] ownership lookup failed:', (err as Error).message);
      return sendError(res, 503, 'mock exam unavailable — try again shortly');
    }
  }

  let assembled: Awaited<ReturnType<typeof generateMockExamProd>>;
  try {
    assembled = await deps.generateMockExam(sessionId, exam, { topics: topicsResult.topics, timingMode: modeResult.mode });
  } catch (err) {
    return sendError(res, 500, (err as Error).message);
  }

  // Plan E7 — resolve the assessment contract ONCE, here, and pin it onto
  // the row. resolveAssessmentContract() never throws (DB-less / no row /
  // malformed row all degrade to the compiled contract with a warn line —
  // see the loader's header), so this never blocks generation.
  const resolvedContract = await deps.resolveContract();
  const contractSnapshot = snapshotForCreation(resolvedContract);

  let saved: MockExamRow;
  try {
    saved = await deps.createMockExam({
      id: assembled.exam_id,
      sessionId,
      ownerUserId: user.userId,
      examKey: exam,
      questions: assembled.questions,
      timeLimitMinutes: assembled.time_limit_minutes,
      timingMode: modeResult.mode,
      contractVersion: contractSnapshot.version,
      contractParams: contractSnapshot.params,
    });
  } catch (err) {
    console.error('[mock-exam] persistence failed:', (err as Error).message);
    return sendError(res, 503, 'mock exam unavailable — try again shortly');
  }

  return sendJSON(res, {
    exam_id: saved.id,
    exam_name: assembled.exam_name,
    time_limit_minutes: saved.timeLimitMinutes,
    timing_mode: saved.timingMode,
    topics: topicsResult.topics ?? null,
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

  // Ownership is enforced against the STORED exam's owner_user_id vs the
  // authenticated caller — never against a client-supplied body field
  // (omitting session_id from the body must NOT skip this check; that was
  // the original IDOR), and never against sessionId (the anonymous
  // useSession() UUID, unrelated to the authenticated id — see
  // src/gbrain/mock-exam-store.ts's header comment). A legacy pre-fix row
  // with no owner yet may be claimed by whichever authenticated student
  // reaches it first; if that claim loses a race (someone else's claim
  // landed first), treat it exactly like any other ownership mismatch.
  // Teachers/admins are exempt — they legitimately generate and grade
  // mock exams for students they don't own.
  if (user.role === 'student') {
    const owner = existing.ownerUserId === null
      ? await deps.claimMockExamOwner(examId, user.userId)
      : existing.ownerUserId;
    if (owner !== user.userId) {
      return sendError(res, 404, `unknown mock exam: ${examId}`);
    }
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const now = deps.now();
  const claim = await deps.claimMockExamSubmission(examId, now.getTime());
  if (!claim) return sendError(res, 404, `unknown mock exam: ${examId}`);

  if (!claim.fresh) {
    const r = claim.row;
    return sendJSON(res, {
      exam_id: examId,
      ...(r.analysis as object ?? {}),
      counterfactual: await buildCounterfactual(r, user.userId),
      late: r.late,
      timing_mode: r.timingMode,
      recorded: true,
      replayed: true,
    });
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

  // Plan E7 — grade from the contract PINNED at generation (claim.row's
  // snapshot), never re-resolved here. A row with no snapshot (every
  // pre-052 exam) parses to `null` and grades exactly as before this plan.
  const contractSnapshot = parseContractSnapshot(claim.row.contractVersion, claim.row.contractParams);
  const grader = makeContractGrader(contractSnapshot);

  let grading: Awaited<ReturnType<typeof gradeMockExam>>;
  try {
    grading = await gradeMockExam(normalized, responsesByObj, grader);
  } catch (err) {
    console.error('[mock-exam] grading failed:', (err as Error).message);
    // Adversarial-review fix (same shape as quiz-routes.ts): the claim
    // above already committed in_progress → submitted BEFORE grading ran.
    // Without reverting, this throw would brick the exam permanently —
    // every retry hits the `!claim.fresh` replay branch and returns an
    // empty analysis as `recorded: true`, with no path to ever grade it.
    try {
      const reverted = await deps.revertClaim(examId, claim.row.submittedAtMs ?? now.getTime());
      if (!reverted) {
        console.error(`[mock-exam] revert-after-grading-failure found no matching claimed row for exam=${examId} — it may be stuck as 'submitted' with no result`);
      }
    } catch (revertErr) {
      console.error(`[mock-exam] revert-after-grading-failure itself threw for exam=${examId} (exam is likely stuck as 'submitted'):`, (revertErr as Error).message);
    }
    return sendError(res, 500, 'mock exam grading failed');
  }
  const deadlineMs = claim.row.createdAtMs + claim.row.timeLimitMinutes * 60 * 1000;
  const late = now.getTime() > deadlineMs;

  // Plan E1(b) — one attempt_facts row per GRADABLE question (mirrors the
  // fsrs-shadow posture: fire-and-forget, failures log, never affect the
  // grade already computed above). Same idempotency key shape as
  // attempt_dedup: (student, object, ts) — every question in THIS exam
  // shares the submission instant as its ts, so a retried submit (which
  // never re-reaches this branch — see the `!claim.fresh` replay above)
  // could never double-write even if it did.
  const factTsMs = now.getTime();
  const facts: AttemptFact[] = grading.per_question.map((q) => ({
    studentId: user.userId,
    objectId: q.id,
    tsMs: factTsMs,
    questionKind: q.kind,
    marksEarned: q.skipped ? null : q.earned,
    marksMax: q.max,
    skipped: q.skipped,
    contractVersion: claim.row.contractVersion ?? null,
    skillId: null, // mock questions carry a coarser `topic`, not a concept id — see migration 051.
  }));
  await deps.recordAttemptFacts(facts).catch((err) => {
    console.error('[mock-exam] attempt_facts write failed (grade still stands):', (err as Error).message);
  });

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
    // Plan E3 — the per-question decomposition is PERSISTED, not just used
    // in-flight for attempt_facts. Without it a revisit to an old mock
    // could only ever render the headline-only degradation, and W3.2's
    // whole screen would exist for exactly one page-load per exam.
    per_question: grading.per_question,
  };

  const saved = await deps.finalizeMockExamSubmission(examId, {
    late, score: grading.earned, maxMarks: grading.max, analysis, gradedAtMs: now.getTime(),
  }).catch((err) => {
    console.error('[mock-exam] finalize failed (grade still returned to client):', (err as Error).message);
    return null;
  });

  // Computed from the row as it now stands — `saved` when the finalize
  // landed, otherwise the claimed row with this submission's analysis
  // patched on, so a storage failure degrades the RECORDED flag without
  // also silently emptying the counterfactual.
  const counterfactual = await buildCounterfactual(saved ?? { ...claim.row, analysis }, user.userId);

  return sendJSON(res, {
    exam_id: examId,
    ...analysis,
    counterfactual,
    late,
    timing_mode: claim.row.timingMode,
    recorded: saved !== null,
  });
}

// ────────────────────────────────────────────────────────────────────
// GET /api/gbrain/mock-exam/:id/result — W3.2 revisit path
// ────────────────────────────────────────────────────────────────────

/**
 * The persisted analysis of an already-submitted exam, plus the
 * counterfactual recomputed from it.
 *
 * Why recomputed rather than persisted alongside the analysis: the
 * counterfactual reads the student's CURRENT topic evidence, so a student
 * who comes back a fortnight later — having since attempted enough
 * eigenvalue questions for their accuracy to be measurable — sees skip
 * lines that genuinely weren't computable on submission day. The graded
 * marks never move (they come from the persisted analysis, under the
 * contract pinned at creation); only the advice sharpens.
 *
 * Ownership is the same rule the submit path enforces: an exam belongs to
 * the authenticated caller that generated it. A student reaching another
 * student's exam gets the same `unknown mock exam` 404 the submit path
 * returns — never a 403, which would confirm the id exists.
 */
async function handleResult(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  const examId = req.params.id;
  if (!examId) return sendError(res, 400, 'exam id is required');

  const row = await deps.getMockExam(examId).catch(() => null);
  if (!row) return sendError(res, 404, `unknown mock exam: ${examId}`);

  if (user.role === 'student' && row.ownerUserId !== null && row.ownerUserId !== user.userId) {
    return sendError(res, 404, `unknown mock exam: ${examId}`);
  }
  if (row.status !== 'submitted' || row.analysis === null) {
    return sendError(res, 409, `mock exam ${examId} has not been submitted yet`);
  }

  return sendJSON(res, {
    exam_id: examId,
    ...(row.analysis as object),
    counterfactual: await buildCounterfactual(row, user.userId),
    late: row.late,
    timing_mode: row.timingMode,
    recorded: true,
  });
}

// ────────────────────────────────────────────────────────────────────
// GET /api/gbrain/mock-exam/topics — C1 topic picker data
// ────────────────────────────────────────────────────────────────────

/**
 * The exact id/label set the `?topics=` param on generation validates
 * against — sourced from MARKS_WEIGHTS/TOPIC_NAMES directly rather than
 * duplicated as a hardcoded frontend list (this repo's client-side GBrain
 * core deliberately keeps its own topic maps empty for the same reason —
 * see frontend/src/lib/gbrain/core.ts). Deliberately NOT the same id
 * namespace as GET /api/topics (that one's ids come from the syllabus YAML
 * section headers — 'transforms'/'discrete' instead of 'transform-theory'/
 * 'discrete-mathematics', and it's missing graph-theory/vector-calculus
 * entirely — see src/db/seed-static-pyqs.ts's TOPIC_DIR_ALIAS comment for
 * the same mismatch documented elsewhere). Reusing it here would 400 a
 * student who picked a topic straight from that list.
 */
async function handleListTopics(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;
  return sendJSON(res, {
    topics: Object.keys(MARKS_WEIGHTS).map((id) => ({
      id,
      name: TOPIC_NAMES[id] ?? id,
      weight: MARKS_WEIGHTS[id],
    })),
  });
}

export const mockExamRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/gbrain/mock-exam/topics', handler: handleListTopics },
  { method: 'GET', path: '/api/gbrain/mock-exam/:id/result', handler: handleResult },
  { method: 'GET', path: '/api/gbrain/mock-exam/:sessionId', handler: handleGenerate },
  { method: 'POST', path: '/api/gbrain/mock-exam/:id/submit', handler: handleSubmit },
];
