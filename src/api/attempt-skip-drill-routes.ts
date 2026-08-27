/**
 * src/api/attempt-skip-drill-routes.ts — plan W3.2's attempt/skip drill.
 *
 *   GET  /api/practice/attempt-skip-drill?concept_id=…   — student-auth'd
 *     Five gradable items for one concept, each carrying its marking and
 *     the break-even SENTENCE for its (kind, marks) pair. Render-safe:
 *     no answer_index / answer_indices / answer_range ever leaves here
 *     (the same leak discipline as GET /api/practice/item/:id and
 *     POST /api/practice/quiz/start — asserted by a serialization test).
 *
 *   POST /api/practice/attempt-skip-drill/skip           — student-auth'd
 *     Evaluates a SKIP. There is no other way to grade one: the practice
 *     attempt path treats a skip as "no marks awarded or deducted" and
 *     records it, which is correct for a practice attempt and useless as
 *     feedback on a DECISION. This endpoint answers the only question the
 *     drill is about — was skipping the better call?
 *
 * ── Attempt goes through the existing path, deliberately ─────────────────
 *
 * There is no drill-specific grading endpoint. Choosing "Attempt" hands
 * the student to POST /api/practice/attempt, which grades server-side and
 * feeds Elo + FSRS + XP exactly as ordinary practice does. A parallel
 * grader here would be a second marking truth and a second place for the
 * student model to drift — the two failure modes this repo has spent the
 * most effort closing.
 *
 * ── Why the skip verdict can be honestly unknown ─────────────────────────
 *
 * Whether a skip was right depends on the student's success probability on
 * THIS item, and that comes from their Elo rating on the concept
 * (`expectedShareFromRating`, the same logistic `expected-score.ts` uses
 * for the headline metric). A student with no graded attempts on the
 * concept has no rating — `Ability.n === 0` — and this endpoint says so
 * rather than treating the 1500 default as a measurement. The break-even
 * framing still lands ("this pays off above 25 in 100"), because that
 * number is a property of the marking scheme, not of the student.
 *
 * ── Refusals name the thing (plan D8) ────────────────────────────────────
 *
 *   too few items → "3 gradable items for 'eigenvalues', need 5"
 *   unknown concept → "unknown concept: <id>"
 *   DB-less → the readiness routes' "building your baseline" honesty
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { gateItemFromPayload } from './practice-routes';
import { describeMarking, type GateItem } from '../scoring/deterministic-scorer';
import type { LearningObjectCatalog } from '../scoring/learning-object-catalog';
import { getLearningObjectCatalog } from '../scoring/learning-object-catalog-pg';
import { getStudentModel } from '../gbrain/student-model-pg';
import type { StudentModel } from '../core/interfaces';
import { CONCEPT_MAP } from '../constants/concept-graph';
import { expectedShareFromRating } from '../readiness/expected-score';
import { breakEvenP, expectedMarksIfAttempted, marksPhrase } from '../readiness/attempt-counterfactual';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

// ────────────────────────────────────────────────────────────────────
// Locked constants
// ────────────────────────────────────────────────────────────────────

/** Items in one drill. The W-UI contract's "5-item attempt/skip drill". */
export const DRILL_LENGTH = 5;

/** Catalog rows scanned per drill before giving up — bounded, not a hot path. */
const DRILL_SCAN_LIMIT = 40;

// ────────────────────────────────────────────────────────────────────
// Test seam
// ────────────────────────────────────────────────────────────────────

export interface AttemptSkipDrillDeps {
  catalog: () => LearningObjectCatalog;
  studentModel: () => StudentModel;
  hasDatabase: () => boolean;
  rng: () => number;
}

const productionDeps: AttemptSkipDrillDeps = {
  catalog: getLearningObjectCatalog,
  studentModel: getStudentModel,
  hasDatabase: () => Boolean(process.env.DATABASE_URL),
  rng: () => Math.random(),
};

let deps: AttemptSkipDrillDeps = productionDeps;

/** Test hook. Pass null to restore production wiring. */
export function setAttemptSkipDrillDepsForTests(override: Partial<AttemptSkipDrillDeps> | null): void {
  deps = override ? { ...productionDeps, ...override } : productionDeps;
}

// ────────────────────────────────────────────────────────────────────
// Shared shaping
// ────────────────────────────────────────────────────────────────────

/**
 * Plan D8: the refusal names the count, the concept and the requirement.
 * Exported so the test asserts the literal rather than a paraphrase of it.
 */
export function notEnoughItemsMessage(count: number, conceptId: string): string {
  return `${count} gradable item${count === 1 ? '' : 's'} for '${conceptId}', need ${DRILL_LENGTH}`;
}

/**
 * The student-facing consequence of break-even p. The probability itself
 * stays server-side (W-UI: "break-even p stays server-side"); this
 * sentence is what the drill chip says.
 */
export function breakEvenSentence(kind: string, marks: number, signedMarksWrong: number): string {
  const p = breakEvenP(marks, signedMarksWrong);
  const label = kind.toUpperCase();
  if (p <= 0) {
    return `A wrong answer costs nothing on a ${label}, so this one is always worth attempting.`;
  }
  return `Wrong costs you ${marksPhrase(signedMarksWrong)} here, so attempting pays whenever you'd get better than ` +
    `${Math.round(p * 100)} in 100 right.`;
}

/** Render-safe drill item — never an answer key. */
function drillItem(objectId: string, nodeId: string, payload: unknown) {
  const item = gateItemFromPayload(objectId, payload) as GateItem;
  const p = (payload ?? {}) as Record<string, unknown>;
  const marking = describeMarking(item);
  return {
    object_id: objectId,
    concept_id: nodeId,
    topic: typeof p.topic === 'string' ? p.topic : null,
    question_text: typeof p.questionText === 'string' ? p.questionText : null,
    question_type: item.kind,
    marks: item.marks,
    options: item.kind === 'mcq' || item.kind === 'msq' ? item.options : null,
    marking,
    break_even_sentence: breakEvenSentence(item.kind, item.marks, marking.marks_wrong),
  };
}

/** Fisher-Yates over a copy, using the injected rng so tests are deterministic. */
function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────
// GET /api/practice/attempt-skip-drill
// ────────────────────────────────────────────────────────────────────

async function handleDrill(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  const conceptId = (req.query.get('concept_id') ?? '').trim();
  if (conceptId === '') return sendError(res, 400, 'concept_id is required');
  if (!CONCEPT_MAP.has(conceptId)) return sendError(res, 400, `unknown concept: ${conceptId}`);

  // DB-less deploys have no practice catalog to draw from. Say what the
  // readiness routes say rather than reporting an empty concept — "there
  // are no items here" and "we cannot reach the item store" are different
  // statements, and only the second one is true.
  if (!deps.hasDatabase()) {
    return sendError(res, 503, 'building your baseline — the attempt/skip drill needs your practice history');
  }

  let rows;
  try {
    rows = await deps.catalog().query({ skillId: conceptId, limit: DRILL_SCAN_LIMIT });
  } catch (err) {
    console.error('[attempt-skip-drill] catalog query failed:', (err as Error).message);
    return sendError(res, 503, 'building your baseline — the attempt/skip drill needs your practice history');
  }

  // "Gradable" means what the RUNTIME means — the same
  // gateItemFromPayload the attempt endpoint will run when the student
  // chooses Attempt. An item that renders but can't be graded would turn
  // the drill's Attempt arm into a 422 halfway through.
  const gradable = rows.filter((r) => typeof gateItemFromPayload(r.id, r.payload) !== 'string');
  if (gradable.length < DRILL_LENGTH) {
    return sendError(res, 422, notEnoughItemsMessage(gradable.length, conceptId));
  }

  const chosen = shuffled(gradable, deps.rng).slice(0, DRILL_LENGTH);
  return sendJSON(res, {
    concept_id: conceptId,
    concept_label: CONCEPT_MAP.get(conceptId)?.label ?? conceptId,
    items: chosen.map((r) => drillItem(r.id, r.nodeId, r.payload)),
  });
}

// ────────────────────────────────────────────────────────────────────
// POST /api/practice/attempt-skip-drill/skip
// ────────────────────────────────────────────────────────────────────

export type SkipVerdict = 'good_skip' | 'should_have_attempted' | 'unknown';

async function handleSkipDecision(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'student', 'teacher', 'admin');
  if (!user) return;

  const body = (req.body ?? {}) as Record<string, unknown>;
  const objectId = body.object_id;
  if (typeof objectId !== 'string' || objectId.length === 0) {
    return sendError(res, 400, 'object_id (string) is required');
  }

  const catalog = deps.catalog();
  if (!catalog.getById) {
    return sendError(res, 422, 'catalog cannot resolve items by id — skip evaluation unavailable');
  }
  const obj = await catalog.getById(objectId);
  if (!obj) return sendError(res, 404, `unknown item: ${objectId}`);

  const itemOrReason = gateItemFromPayload(objectId, obj.payload);
  if (typeof itemOrReason === 'string') return sendError(res, 422, itemOrReason);
  const item = itemOrReason;

  const marking = describeMarking(item);
  const p = breakEvenP(item.marks, marking.marks_wrong);

  // The student's measured success probability on this concept. `n === 0`
  // means nothing has been graded there yet, and the 1500 default is a
  // starting point, not a measurement — so no verdict is issued.
  let successProbability: number | null = null;
  try {
    const ability = await deps.studentModel().abilityFor(user.userId, obj.nodeId);
    if (ability && ability.n > 0) successProbability = expectedShareFromRating(ability.rating);
  } catch (err) {
    console.error('[attempt-skip-drill] ability lookup failed (verdict withheld):', (err as Error).message);
  }

  const expected = successProbability === null
    ? null
    : Math.round(expectedMarksIfAttempted(successProbability, item.marks, marking.marks_wrong) * 100) / 100;

  const verdict: SkipVerdict = successProbability === null
    ? 'unknown'
    : (expected ?? 0) > 0 ? 'should_have_attempted' : 'good_skip';

  return sendJSON(res, {
    object_id: objectId,
    concept_id: obj.nodeId,
    question_type: item.kind,
    marks: item.marks,
    marking,
    verdict,
    /** 0..1, rounded. Null when the student has no graded attempts here. */
    success_probability: successProbability === null ? null : Math.round(successProbability * 100) / 100,
    expected_marks_if_attempted: expected,
    break_even_sentence: breakEvenSentence(item.kind, item.marks, marking.marks_wrong),
    reason: skipReason(verdict, {
      kind: item.kind,
      marks: item.marks,
      signedMarksWrong: marking.marks_wrong,
      successProbability,
      expected,
      breakEven: p,
    }),
  });
}

/**
 * The 17px sentence the drill renders under the verdict. Locked here so
 * the register is asserted by a test rather than spread through JSX, and
 * so "wrong" is stated in words — Clarity gives wrong no colour.
 */
export function skipReason(
  verdict: SkipVerdict,
  args: {
    kind: string;
    marks: number;
    signedMarksWrong: number;
    successProbability: number | null;
    expected: number | null;
    breakEven: number;
  },
): string {
  const { kind, marks, signedMarksWrong, successProbability, expected, breakEven } = args;
  const label = kind.toUpperCase();

  if (verdict === 'unknown') {
    return breakEven <= 0
      ? `A wrong ${label} costs nothing here, so on a ${marks}-mark question like this one there is ` +
        'never a reason to leave it blank.'
      : `You have not answered enough questions on this concept yet for us to say. What we can say: ` +
        `a wrong answer here is minus ${marksPhrase(signedMarksWrong)}, so attempting ` +
        `pays above ${Math.round(breakEven * 100)} in 100.`;
  }

  const pct = Math.round((successProbability ?? 0) * 100);
  if (verdict === 'good_skip') {
    return `Right call. You get about ${pct} in 100 right on this concept, and below ` +
      `${Math.round(breakEven * 100)} in 100 a ${marks}-mark ${label} loses marks on average.`;
  }
  return `Worth attempting. You get about ${pct} in 100 right on this concept, so answering this ` +
    `${marks}-mark ${label} was worth about ${marksPhrase(expected ?? 0)} on average — ` +
    'a blank is a guaranteed zero.';
}

export const attemptSkipDrillRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/practice/attempt-skip-drill', handler: handleDrill },
  { method: 'POST', path: '/api/practice/attempt-skip-drill/skip', handler: handleSkipDecision },
];
