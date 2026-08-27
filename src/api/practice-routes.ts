/**
 * src/api/practice-routes.ts — Wave 9: the attempt endpoint the
 * deterministic scorer has been waiting for since Wave 7.
 *
 *   POST /api/practice/attempt — student-authenticated
 *     body: {
 *       object_id: string,              // generated_problems row / Action.objectId
 *       response: {                      // structured GateResponse, never free text
 *         skipped?: boolean,
 *         selectedIndex?: number,        // mcq
 *         selectedIndices?: number[],    // msq
 *         value?: number,                // nat
 *       },
 *       latency_ms?: number,             // client-measured; clamped, default 0
 *       ts?: number,                     // epoch ms; default server now().
 *                                        // Part of the dedup key — clients that
 *                                        // retry MUST resend the same ts.
 *     }
 *     Returns 200: {
 *       grade: { earned, max, correct, feedback },
 *       marking: { marks_correct, marks_wrong },
 *       recorded: boolean,               // false = grade stands, student model
 *                                        //         couldn't persist (DB-less)
 *     }
 *
 * Grading is DETERMINISTIC ONLY (blueprint D4/D8: the LLM never decides
 * whether a final answer is right — this endpoint doesn't even have an
 * LLM to ask). An item is gradable iff its `generated_problems` row
 * carries real marking (migrations 032/033): question_type + marks, plus
 * the kind's answer key — mcq: answer_index + canonical `options`;
 * msq: answer_indices + `options`; nat: answer_range. Anything less is
 * refused with 422 rather than guessed.
 *
 * On a grade, the result feeds `StudentModel.update()` as
 * `Attempt.partialMarks` (Elo + FSRS + dedup + attempts-bus — see
 * student-model-pg.ts) and `recordProblemAttempt()` recalibrates the
 * item's empirical difficulty. Both are best-effort: a DB-less deploy
 * still grades honestly and says `recorded: false`.
 *
 * Idempotency: `StudentModel.update()` dedups on (studentId, objectId,
 * ts), so a client retrying with the same `ts` can't double-move Elo.
 *
 *   GET /api/practice/item/:id — student-authenticated (Wave 10)
 *     The RENDER-SAFE view of an item for the practice UI: question
 *     text, kind, marks, canonical options, and the marking display
 *     block. The answer key (answer_index / answer_indices /
 *     answer_range), correct_answer, solution_steps, and distractors
 *     NEVER leave the server through this endpoint — grading happens
 *     only via POST /api/practice/attempt. `gradable: false` items
 *     still return their question text (display-only practice).
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import {
  makeDeterministicScorer,
  describeMarking,
  type GateItem,
  type GateItemKind,
  type GateResponse,
} from '../scoring/deterministic-scorer';
import type { LearningObjectCatalog } from '../scoring/learning-object-catalog';
import { getLearningObjectCatalog } from '../scoring/learning-object-catalog-pg';
import { getStudentModel } from '../gbrain/student-model-pg';
import { recordProblemAttempt } from '../gbrain/problem-generator';
import type { Attempt, ErrorTag, StudentModel } from '../core/interfaces';
import { xpForAttempt } from '../scoring/xp';
import { awardXp as awardXpProd, type XpAward } from '../gbrain/xp-store';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

// ────────────────────────────────────────────────────────────────────
// Test seam — production wiring uses the singletons; tests inject.
// ────────────────────────────────────────────────────────────────────

interface PracticeDeps {
  catalog: () => LearningObjectCatalog;
  studentModel: () => StudentModel;
  recordProblemAttempt: (problemId: string, wasCorrect: boolean) => Promise<void>;
  /** T14 (B5): personal XP ledger. Best-effort — see src/gbrain/xp-store.ts. */
  awardXp: (award: XpAward) => Promise<void>;
}

const productionDeps: PracticeDeps = {
  catalog: getLearningObjectCatalog,
  studentModel: getStudentModel,
  recordProblemAttempt,
  awardXp: awardXpProd,
};

let deps: PracticeDeps = productionDeps;

/** Test hook. Pass null to restore production wiring. */
export function setPracticeDepsForTests(override: Partial<PracticeDeps> | null): void {
  deps = override ? { ...productionDeps, ...override } : productionDeps;
}

// ────────────────────────────────────────────────────────────────────
// Item resolution — payload (migrations 032/033) → GateItem, or an
// honest refusal string explaining exactly what's missing.
// ────────────────────────────────────────────────────────────────────

/** Exported for tests. Returns a GateItem or a refusal reason string. */
export function gateItemFromPayload(objectId: string, payload: unknown): GateItem | string {
  const p = (payload ?? {}) as Record<string, unknown>;
  const kind = p.questionType;
  const marks = p.marks;
  if (kind !== 'mcq' && kind !== 'msq' && kind !== 'nat') {
    return 'item has no question_type marking — not deterministically gradable (migration 032)';
  }
  if (typeof marks !== 'number' || !(marks > 0)) {
    return 'item has no marks value — not deterministically gradable (migration 032)';
  }

  const item: GateItem = { id: objectId, kind: kind as GateItemKind, marks };

  if (kind === 'mcq' || kind === 'msq') {
    if (!Array.isArray(p.options) || p.options.length === 0) {
      return `${kind} item has no canonical options list — answer indices are undefined without one (migration 033)`;
    }
    item.options = p.options;
  }
  if (kind === 'mcq') {
    if (typeof p.answerIndex !== 'number' || p.answerIndex < 0 || p.answerIndex >= (item.options as unknown[]).length) {
      return 'mcq item has no valid answer_index — cannot grade';
    }
    item.answerIndex = p.answerIndex;
  }
  if (kind === 'msq') {
    const idx = p.answerIndices;
    const n = (item.options as unknown[]).length;
    if (!Array.isArray(idx) || idx.length === 0 || !idx.every(i => typeof i === 'number' && i >= 0 && i < n)) {
      return 'msq item has no valid answer_indices — cannot grade';
    }
    item.answerIndices = idx as number[];
  }
  if (kind === 'nat') {
    const r = p.answerRange;
    if (!Array.isArray(r) || r.length !== 2 || !r.every(x => typeof x === 'number') || r[0] > r[1]) {
      return 'nat item has no valid answer_range — cannot grade';
    }
    item.answerRange = r as [number, number];
  }
  return item;
}

/** Exported for tests. Validates the client response against the item kind. */
export function gateResponseFromBody(item: GateItem, raw: unknown): GateResponse | string {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (r.skipped === true) return { kind: item.kind, skipped: true };

  if (item.kind === 'mcq') {
    const n = (item.options as unknown[]).length;
    if (typeof r.selectedIndex !== 'number' || !Number.isInteger(r.selectedIndex) || r.selectedIndex < 0 || r.selectedIndex >= n) {
      return `mcq response requires an integer selectedIndex in [0, ${n})`;
    }
    return { kind: 'mcq', selectedIndex: r.selectedIndex };
  }
  if (item.kind === 'msq') {
    const n = (item.options as unknown[]).length;
    const sel = r.selectedIndices;
    if (!Array.isArray(sel) || sel.length === 0
        || !sel.every(i => typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < n)) {
      return `msq response requires a non-empty selectedIndices array of integers in [0, ${n})`;
    }
    return { kind: 'msq', selectedIndices: sel as number[] };
  }
  // nat
  if (typeof r.value !== 'number' || !Number.isFinite(r.value)) {
    return 'nat response requires a finite numeric value';
  }
  return { kind: 'nat', value: r.value };
}

/**
 * W3.4/E2 — the post-answer diagnosis. Resolves the failure hypothesis for
 * a WRONG mcq pick straight off the item's own payload
 * (`distractorFailureTags`, threaded by markingPayload()/
 * markingPayloadFromRow() from deriveMarking()'s POST-shuffle map).
 * Exported for tests. Returns null whenever there's nothing honest to
 * report — a correct pick, a skip, a non-mcq item, or simply no tag
 * authored for that option — never guessed. This is the ONE place a
 * failure tag is allowed to reach the client: strictly after grading, for
 * the option the student actually chose.
 */
export function failureTagForWrongPick(
  payload: unknown,
  correct: boolean,
  response: GateResponse,
): ErrorTag | null {
  if (correct || response.skipped || response.kind !== 'mcq'
      || typeof response.selectedIndex !== 'number') {
    return null;
  }
  const tags = (payload as { distractorFailureTags?: unknown } | null)?.distractorFailureTags;
  if (!tags || typeof tags !== 'object' || Array.isArray(tags)) return null;
  const tag = (tags as Record<string, unknown>)[String(response.selectedIndex)];
  return typeof tag === 'string' ? (tag as ErrorTag) : null;
}

// ────────────────────────────────────────────────────────────────────
// POST /api/practice/attempt
// ────────────────────────────────────────────────────────────────────

async function handleAttempt(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  const body = (req.body ?? {}) as Record<string, unknown>;
  const objectId = body.object_id;
  if (typeof objectId !== 'string' || objectId.length === 0) {
    return sendError(res, 400, 'object_id (string) is required');
  }

  const catalog = deps.catalog();
  if (!catalog.getById) {
    return sendError(res, 422, 'catalog cannot resolve items by id — attempt grading unavailable');
  }
  const obj = await catalog.getById(objectId);
  if (!obj) return sendError(res, 404, `unknown item: ${objectId}`);

  const itemOrReason = gateItemFromPayload(objectId, obj.payload);
  if (typeof itemOrReason === 'string') return sendError(res, 422, itemOrReason);
  const item = itemOrReason;

  const responseOrReason = gateResponseFromBody(item, body.response);
  if (typeof responseOrReason === 'string') return sendError(res, 400, responseOrReason);
  const response = responseOrReason;

  // Deterministic grade — validation above guarantees grade() can't throw
  // on shape, but keep the guard: a scorer refusal is a 422, not a 500.
  let grade;
  try {
    grade = await makeDeterministicScorer().grade(item, response);
  } catch (err) {
    return sendError(res, 422, `not gradable: ${(err as Error).message}`);
  }

  const ts = typeof body.ts === 'number' && Number.isFinite(body.ts) && body.ts > 0
    ? Math.floor(body.ts)
    : Date.now();
  const latencyMs = typeof body.latency_ms === 'number' && Number.isFinite(body.latency_ms) && body.latency_ms >= 0
    ? Math.min(Math.floor(body.latency_ms), 60 * 60 * 1000)  // clamp at 1h — beyond that it's not answer latency
    : 0;

  const correct = grade.casFinalAnswerCorrect === true;

  // W3.4/E2 — post-answer only, and only for the option actually chosen.
  // See failureTagForWrongPick's own doc comment for the leak discipline.
  const failureTag = failureTagForWrongPick(obj.payload, correct, response);

  const attempt: Attempt = {
    studentId: user.userId,
    objectId,
    skillId: obj.nodeId,
    correct,
    partialMarks: {
      earned: grade.earned,
      max: grade.max,
      perCriterion: grade.perCriterion,
    },
    // Feeds the SAME errorTags channel StudentModel.update() already
    // persists to attempt_error_tags and errorProfile() aggregates from —
    // a diagnosed wrong pick is real error-tag telemetry, not a special case.
    errorTags: failureTag ? [failureTag] : undefined,
    latencyMs,
    ts,
    // Plan E1 — attempt_facts (migration 051) reads these off the Attempt
    // StudentModel.update() already receives; no separate write here.
    // contractVersion is left unset: this path grades via the compiled
    // scorer directly (no assessment-contract resolution), so recording no
    // version is honest rather than guessing one.
    questionKind: item.kind,
    skipped: response.skipped === true,
  };

  // Best-effort persistence: a DB-less deploy still grades honestly.
  let recorded = true;
  try {
    await deps.studentModel().update(attempt);
  } catch (err) {
    recorded = false;
    console.error('[practice] attempt not recorded (student model unavailable):', (err as Error).message);
  }
  // T14 (B5): "+N min of focused work" award line (DR-4) — populated only
  // for a positive award on a recorded, non-skipped attempt. A zero/negative
  // award is still WRITTEN to the ledger (see awardXp below) but never
  // surfaced here — DR-4's "negative XP events are never surfaced to
  // students" applies to this per-attempt line, not just the running meter.
  let xpMinutesAwarded: number | null = null;
  if (recorded && !response.skipped) {
    // Empirical-difficulty recalibration; skipped attempts carry no signal.
    await deps.recordProblemAttempt(objectId, attempt.correct).catch((err: Error) => {
      console.error('[practice] empirical-difficulty update failed (non-fatal):', err.message);
    });
    // "1 XP ≈ 1 minute of focused effort ... none on skip" — the award only
    // ever happens on a graded, non-skipped, RECORDED attempt. Best-effort
    // by construction (xp-store.ts swallows its own failures); never blocks
    // or alters the grading response above.
    const xpAmount = xpForAttempt({ earned: grade.earned, max: grade.max }, obj.estMinutes);
    await deps.awardXp({ studentId: user.userId, objectId, skillId: attempt.skillId, xpAmount, source: 'practice', tsMs: ts });
    if (xpAmount > 0) xpMinutesAwarded = xpAmount;
  }

  // Reveal the worked solution ONLY here, in the response to a graded attempt.
  // GET /api/practice/item deliberately withholds it — the client must never
  // hold the answer before committing. Once the answer is in, withholding the
  // reasoning helps nobody: a student who got it wrong needs the steps most,
  // and a student who got it right should be able to check their route rather
  // than trust the mark.
  const solutionSteps = Array.isArray((obj.payload as { solutionSteps?: unknown })?.solutionSteps)
    ? ((obj.payload as { solutionSteps: unknown[] }).solutionSteps as string[])
    : [];

  return sendJSON(res, {
    grade: {
      earned: grade.earned,
      max: grade.max,
      correct: attempt.correct,
      feedback: grade.feedback,
    },
    marking: describeMarking(item),
    solution_steps: solutionSteps,
    recorded,
    xp_minutes_awarded: xpMinutesAwarded,
    // W3.4/E2 — the diagnosis for a wrong mcq pick, or null (never
    // omitted — an explicit null on a correct/skipped/untagged attempt is
    // the honest shape, not a field the client has to guess is missing).
    failure_tag: failureTag,
  });
}

// ────────────────────────────────────────────────────────────────────
// GET /api/practice/item/:id — render-safe item view
// ────────────────────────────────────────────────────────────────────

async function handleGetItem(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  const objectId = req.params.id;
  if (!objectId) return sendError(res, 400, 'item id is required');

  const catalog = deps.catalog();
  if (!catalog.getById) {
    return sendError(res, 422, 'catalog cannot resolve items by id');
  }
  const obj = await catalog.getById(objectId);
  if (!obj) return sendError(res, 404, `unknown item: ${objectId}`);

  const payload = (obj.payload ?? {}) as Record<string, unknown>;
  const itemOrReason = gateItemFromPayload(objectId, payload);
  const gradable = typeof itemOrReason !== 'string';

  // Render-safe by construction: fields are copied onto a fresh object,
  // never spread from payload — the answer key cannot leak by accident.
  return sendJSON(res, {
    id: obj.id,
    node_id: obj.nodeId,
    topic: typeof payload.topic === 'string' ? payload.topic : null,
    question_text: typeof payload.questionText === 'string' ? payload.questionText : null,
    est_minutes: obj.estMinutes,
    gradable,
    question_type: gradable ? itemOrReason.kind : null,
    marks: gradable ? itemOrReason.marks : null,
    options: gradable && (itemOrReason.kind === 'mcq' || itemOrReason.kind === 'msq')
      ? itemOrReason.options
      : null,
    marking: gradable ? describeMarking(itemOrReason) : null,
    not_gradable_reason: gradable ? null : itemOrReason,
  });
}

// ────────────────────────────────────────────────────────────────────
// POST /api/practice/new-numbers — E7 "New numbers, same concept"
// ────────────────────────────────────────────────────────────────────
// Regenerates the numeric parameters in a template-born NAT/MCQ item,
// keeping the same concept and difficulty. The original item is never
// mutated — a transient variant is returned for display only (no DB write).
// The variant is NOT gradable server-side (no answer key persisted);
// the client shows it as a self-check item.

async function handleNewNumbers(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  const objectId = req.params.id;
  if (!objectId) return sendError(res, 400, 'item id is required');

  const catalog = deps.catalog();
  if (!catalog.getById) {
    return sendError(res, 503, 'catalog cannot resolve items by id');
  }
  const obj = await catalog.getById(objectId);
  if (!obj) return sendError(res, 404, `unknown item: ${objectId}`);

  const payload = (obj.payload ?? {}) as Record<string, unknown>;
  const questionText = typeof payload.questionText === 'string' ? payload.questionText : null;
  if (!questionText) {
    return sendError(res, 422, 'item has no question_text — cannot regenerate numbers');
  }

  // Only NAT and MCQ items carry numeric parameters worth varying.
  const kind = payload.questionType;
  if (kind !== 'nat' && kind !== 'mcq') {
    return sendError(res, 422, `new-numbers is only available for nat/mcq items (got: ${kind})`);
  }

  try {
    const { getLlmForRole } = await import('../llm/runtime.js');
    const llm = await getLlmForRole('chat');
    if (!llm) throw new Error('no LLM available');

    const prompt = `You are a math problem re-parameterizer.

Original problem:
${questionText}

Produce a NEW version of the same problem with DIFFERENT specific numbers (change every
numeric constant, coefficient, or value) but the SAME concept, difficulty, and structure.
Do NOT change what the problem is asking — only swap the numbers.

Return ONLY the new problem statement with the new numbers, nothing else.`;

    const rawText = await llm.generate(prompt, { maxTokens: 400 });
    const newText = rawText ?? '';

    return sendJSON(res, {
      id: `${objectId}_variant`,
      original_id: objectId,
      question_text: newText.trim() || questionText,
      question_type: kind,
      gradable: false,
      not_gradable_reason: 'variant — self-check only; submit original item for grading',
      node_id: obj.nodeId,
      topic: typeof payload.topic === 'string' ? payload.topic : null,
    });
  } catch (err) {
    console.error('[practice] new-numbers generation failed:', err);
    return sendError(res, 503, 'number regeneration unavailable — try again later');
  }
}

export const practiceRoutes: RouteDefinition[] = [
  { method: 'POST', path: '/api/practice/attempt', handler: handleAttempt },
  { method: 'GET', path: '/api/practice/item/:id', handler: handleGetItem },
  { method: 'POST', path: '/api/practice/new-numbers/:id', handler: handleNewNumbers },
];
