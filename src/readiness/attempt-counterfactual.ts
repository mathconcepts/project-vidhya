/**
 * src/readiness/attempt-counterfactual.ts — plan W3.2, amendment E3.
 *
 * The post-mock counterfactual: "which of your attempt-or-skip CALLS cost
 * you marks?" — computed from the per-question decomposition
 * `mock-exam-grading.ts` writes at grade time, plus the assessment
 * contract's marking params PINNED onto the session at creation (E7).
 *
 * ── Why not `summarizeMock()` ────────────────────────────────────────────
 *
 * `src/readiness/mock-to-marks.ts` already computes `leftOnTable`, and the
 * plan's four-beat copy contract is written in its vocabulary. But
 * `leftOnTable` is derived ENTIRELY from `Attempt.errorTags` — a slip is
 * "knew it" only when a careless tag says so. Nothing in this repo produces
 * an error tag on a mock question: `mock-exam-routes.ts` grades
 * deterministically and writes `attempt_facts` rows with no tag at all. So
 * on every real mock `leftOnTable` is structurally 0, and a screen built on
 * it would tell every student "clean run" forever. That is the degenerate
 * state amendment E3 exists to avoid shipping.
 *
 * This module therefore computes a DIFFERENT, tag-free quantity from the
 * per-question decomposition, and says so in the student's own words:
 *
 *   decision cost — marks recoverable by a better attempt-or-skip CALL,
 *                   with no new knowledge required.
 *
 * Two sources, both arithmetic on facts already recorded:
 *
 *   1. An ATTEMPTED question that scored NEGATIVE. The student chose to
 *      attempt; the alternative (skip) scores exactly 0. The cost of the
 *      call is the whole negative amount — no estimate, no model, no
 *      probability. This is the honest core of the feature.
 *
 *   2. A SKIPPED question whose expected value, at the student's measured
 *      accuracy ON THAT TOPIC, was positive. Cost = that expected value:
 *      the marks the call gave away. Requires real evidence —
 *      `MIN_TOPIC_ATTEMPTS_FOR_SKIP_EV` graded attempts on that topic —
 *      and is OMITTED ENTIRELY when the evidence isn't there. A guessed
 *      accuracy would turn the most persuasive number on the screen into
 *      a fabrication.
 *
 * `marksCloseTo = earned + recoverable` is the beat-2 "knewIt" analogue:
 * marks the student was already good for, since none of them needed
 * anything learned. Beat 3 is the same number reframed as the gap. That
 * "same number, reframed" relationship is exactly what the W-UI contract
 * specifies, so it is asserted in the tests rather than left to the
 * component to keep straight.
 *
 * ── The copy lives here, not in the component ───────────────────────────
 *
 * The W-UI contract locks the student register ("marks, not EV; sentences,
 * not formulas; break-even p stays server-side") in the REPORT, the way
 * `MockToMarksReport.headline` locks it for the extraction report. Every
 * sentence the counterfactual section renders is produced by this pure
 * function and asserted by its tests; the component does layout only. That
 * is also what keeps break-even p server-side while its CONSEQUENCE
 * ("worth attempting whenever you can rule out one option") reaches the
 * student.
 *
 * ── State matrix (W-UI, all four branches tested) ────────────────────────
 *
 *   perQuestion === null      → 'unavailable'. A legacy row graded before
 *                               E3. Headline only; never a fabricated
 *                               decomposition.
 *   no gradable questions     → 'unavailable', with the count named.
 *   skip-heavy paper          → 'attempt_more'. Checked FIRST, before
 *                               'clean', because a student who skipped 50
 *                               of 65 has a decision cost of ~0 from
 *                               source (1) and would otherwise be
 *                               congratulated for not playing.
 *   recoverable == 0          → 'clean'. The success state, with real
 *                               copy and no loss language anywhere.
 *   otherwise                 → 'decisions'.
 *
 * Pure: no DB, no clock, no randomness. The caller supplies the
 * decomposition, the contract params and the topic evidence.
 */

import {
  COMPILED_ASSESSMENT_CONTRACT,
  type ContractQuestionKind,
} from '../exams/marking-constants';

// ============================================================================
// Locked constants
// ============================================================================

/**
 * How many per-question decisions the student sees. The W-UI contract
 * fixes this at 3 (the cohort-cap precedent): a full per-question scroll
 * is a shame ledger, three is a to-do list. Tested as a literal.
 */
export const COUNTERFACTUAL_ITEM_CAP = 3;

/**
 * Above this share of skipped gradable questions the paper reads as
 * "mostly skipped" and the coaching inverts to attempt-more. A planning
 * constant, not an exam rule.
 */
export const SKIP_HEAVY_FRACTION = 0.5;

/**
 * Graded attempts needed on a topic before that topic's accuracy may be
 * used to price a SKIP. Below it the skip lines are omitted — never
 * estimated from two questions. A planning constant chosen to be small
 * enough to reach in a couple of sessions and large enough that the
 * resulting percentage is not one lucky guess; it is not derived from
 * anything, and the tests pin the behaviour on both sides of it.
 */
export const MIN_TOPIC_ATTEMPTS_FOR_SKIP_EV = 8;

/** Marks below this are treated as zero (float noise from thirds). */
const MARKS_EPSILON = 1e-6;

// ============================================================================
// Inputs
// ============================================================================

/**
 * One row of the persisted per-question decomposition (amendment E3),
 * widened with the topic/concept the mock's own question rows carry.
 * `marks` is the question's MAX; `earned` is what the grader awarded, and
 * may be negative under MCQ negative marking.
 */
export interface CounterfactualQuestion {
  id: string;
  kind: ContractQuestionKind;
  marks: number;
  earned: number;
  skipped: boolean;
  topic?: string | null;
  conceptId?: string | null;
}

/** Graded attempts and correct answers on one topic, from `attempt_facts`. */
export interface TopicEvidence {
  attempted: number;
  correct: number;
}

/**
 * The marking numbers the counterfactual needs, in the shape the pinned
 * contract snapshot stores them. Structural rather than an import of the
 * contract type: this is read back out of JSONB written at session
 * creation, possibly months ago.
 */
export interface CounterfactualContractParams {
  mcq: { marks_wrong_by_marks: Record<string, number>; marks_wrong_fallback_divisor: number };
  msq: { marks_wrong: number };
  nat: { marks_wrong: number };
}

export interface CounterfactualInput {
  /** `null` = a legacy row with no per-question decomposition. */
  perQuestion: ReadonlyArray<CounterfactualQuestion> | null;
  params: CounterfactualContractParams;
  /** Keyed by the same topic string the mock's question rows carry. */
  topicEvidence?: Readonly<Record<string, TopicEvidence>>;
}

// ============================================================================
// Outputs
// ============================================================================

export type CounterfactualState = 'unavailable' | 'attempt_more' | 'clean' | 'decisions';

export type DecisionKind = 'attempted_wrong' | 'skipped_positive_ev';

export interface CounterfactualDecision {
  object_id: string;
  question_kind: ContractQuestionKind;
  marks: number;
  topic: string | null;
  concept_id: string | null;
  decision: DecisionKind;
  /** Positive marks a better call would have been worth. */
  cost_marks: number;
  /** SIGNED penalty for getting this item wrong (0 for MSQ/NAT). */
  marks_wrong: number;
  /** Topic accuracy used to price a skip; null for `attempted_wrong`. */
  accuracy: number | null;
  /** Graded attempts behind that accuracy; null for `attempted_wrong`. */
  topic_attempts: number | null;
  /** 17px row label. */
  label: string;
  /** 15px supporting line beneath it. */
  detail: string;
}

/** Break-even framing for one (kind, marks) pair present in the paper. */
export interface BreakEvenLine {
  question_kind: ContractQuestionKind;
  marks: number;
  marks_wrong: number;
  /** P / (R + P). Server-side; the SENTENCE is what reaches the student. */
  break_even_p: number;
  sentence: string;
}

/**
 * The four beats, in order. `null` means "this beat renders nothing" —
 * never an empty string, so a component cannot render a blank row.
 * Loss language appears ONLY in `gap`.
 */
export interface CounterfactualBeats {
  earned: string;
  competence: string | null;
  gap: string | null;
  action: string | null;
}

export interface CounterfactualReport {
  available: boolean;
  state: CounterfactualState;
  /** Present iff `available === false`. Names the thing and the number. */
  reason: string | null;
  earned: number;
  max_available: number;
  graded_questions: number;
  attempted: number;
  skipped: number;
  /** earned + recoverable_marks — the beat-2 "already good for" number. */
  marks_close_to: number;
  recoverable_marks: number;
  top_decisions: CounterfactualDecision[];
  /** Decisions beyond the cap, rolled into one collapsed line. */
  remainder_count: number;
  remainder_marks: number;
  break_even: BreakEvenLine[];
  /** Concept for the drill CTA, or null when nothing in the paper maps. */
  drill_concept_id: string | null;
  beats: CounterfactualBeats;
}

// ============================================================================
// Marking arithmetic
// ============================================================================

/** SIGNED deduction for getting one item of this kind and mark value wrong. */
export function marksWrongFor(
  kind: ContractQuestionKind,
  marks: number,
  params: CounterfactualContractParams,
): number {
  if (kind === 'mcq') {
    const declared = params.mcq.marks_wrong_by_marks[String(marks)];
    if (typeof declared === 'number' && Number.isFinite(declared)) return declared;
    const divisor = params.mcq.marks_wrong_fallback_divisor;
    if (typeof divisor === 'number' && divisor > 0) return -(marks / divisor);
    return 0;
  }
  return kind === 'msq' ? params.msq.marks_wrong : params.nat.marks_wrong;
}

/**
 * Break-even success probability: the accuracy at which attempting and
 * skipping have the same expected marks.
 *
 *   EV(attempt) = p·R + (1 − p)·(−P)  and  EV(skip) = 0
 *   ⇒  p* = P / (R + P)
 *
 * With no negative marking (P = 0) this is 0 — attempting is never worse
 * than skipping, which is the whole reason MSQ and NAT deserve a different
 * sentence from MCQ.
 */
export function breakEvenP(reward: number, penaltyMagnitude: number): number {
  if (!(reward > 0)) return 0;
  const p = Math.abs(penaltyMagnitude);
  if (p <= 0) return 0;
  return p / (reward + p);
}

/** Expected marks from attempting an item at success probability `p`. */
export function expectedMarksIfAttempted(
  p: number,
  marks: number,
  signedMarksWrong: number,
): number {
  return p * marks + (1 - p) * signedMarksWrong;
}

/**
 * Contract params from a pinned snapshot's `marking` block, falling back
 * to the compiled contract for any kind the snapshot doesn't carry.
 *
 * A missing kind is a fallback rather than a refusal here BECAUSE this is
 * analysis of an already-graded paper, not grading. `contract-grading.ts`
 * throws in exactly that situation, and rightly: a mark computed under
 * rules nobody chose is worse than no mark. A counterfactual line under
 * the compiled default is a slightly less precise sentence about a paper
 * whose marks are already final and already correct.
 */
export function counterfactualParamsFrom(
  snapshotMarking?: Record<string, { params?: Record<string, unknown> }> | null,
): CounterfactualContractParams {
  const compiled = COMPILED_ASSESSMENT_CONTRACT.marking;
  const fallback: CounterfactualContractParams = {
    mcq: {
      marks_wrong_by_marks: { ...compiled.mcq.params.marks_wrong_by_marks },
      marks_wrong_fallback_divisor: compiled.mcq.params.marks_wrong_fallback_divisor,
    },
    msq: { marks_wrong: compiled.msq.params.marks_wrong },
    nat: { marks_wrong: compiled.nat.params.marks_wrong },
  };
  if (!snapshotMarking) return fallback;

  const mcqParams = snapshotMarking.mcq?.params;
  if (mcqParams) {
    const table = mcqParams.marks_wrong_by_marks;
    if (table && typeof table === 'object' && !Array.isArray(table)) {
      const cleaned: Record<string, number> = {};
      for (const [k, v] of Object.entries(table as Record<string, unknown>)) {
        if (typeof v === 'number' && Number.isFinite(v)) cleaned[k] = v;
      }
      if (Object.keys(cleaned).length > 0) fallback.mcq.marks_wrong_by_marks = cleaned;
    }
    const divisor = mcqParams.marks_wrong_fallback_divisor;
    if (typeof divisor === 'number' && divisor > 0) fallback.mcq.marks_wrong_fallback_divisor = divisor;
  }
  const msqWrong = snapshotMarking.msq?.params?.marks_wrong;
  if (typeof msqWrong === 'number' && Number.isFinite(msqWrong)) fallback.msq.marks_wrong = msqWrong;
  const natWrong = snapshotMarking.nat?.params?.marks_wrong;
  if (typeof natWrong === 'number' && Number.isFinite(natWrong)) fallback.nat.marks_wrong = natWrong;

  return fallback;
}

// ============================================================================
// Formatting — student register
// ============================================================================

const FRACTIONS: Array<[number, string]> = [
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
];

/**
 * Marks as a student reads them: whole numbers plain, the exam's own
 * thirds as glyphs ("⅔ of a mark", the W-UI contract's literal example),
 * everything else to two places.
 */
export function formatMarks(n: number): string {
  const abs = Math.abs(n);
  if (abs < MARKS_EPSILON) return '0';
  if (Number.isInteger(abs)) return String(abs);
  for (const [value, glyph] of FRACTIONS) {
    if (Math.abs(abs - value) < 1e-4) return glyph;
  }
  return String(Math.round(abs * 100) / 100);
}

/**
 * "⅔ of a mark" / "2 marks" / "1 mark" — magnitude only; the sign is
 * always stated in words ("minus ⅔ of a mark"), never as a bare glyph.
 */
export function marksPhrase(n: number): string {
  const abs = Math.abs(n);
  const formatted = formatMarks(abs);
  if (Math.abs(abs - 1) < MARKS_EPSILON) return '1 mark';
  if (abs < 1) return `${formatted} of a mark`;
  return `${formatted} marks`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function topicPhrase(topic: string | null): string {
  if (!topic) return 'this paper';
  return topic.replace(/[-_]/g, ' ');
}

// ============================================================================
// The pure function
// ============================================================================

export function computeAttemptCounterfactual(input: CounterfactualInput): CounterfactualReport {
  const { perQuestion, params } = input;
  const evidence = input.topicEvidence ?? {};

  if (perQuestion === null) {
    return unavailable(
      'this mock was graded before per-question analysis existed, so it carries no ' +
      'per-question breakdown to review',
    );
  }

  const usable = perQuestion.filter(
    (q) => Number.isFinite(q.marks) && q.marks > 0 && Number.isFinite(q.earned),
  );
  if (usable.length === 0) {
    return unavailable(
      `0 of ${perQuestion.length} question${perQuestion.length === 1 ? '' : 's'} in this mock ` +
      'could be marked, so there are no attempt-or-skip decisions to review',
    );
  }

  let earned = 0;
  let maxAvailable = 0;
  let attempted = 0;
  let skipped = 0;
  const decisions: CounterfactualDecision[] = [];

  for (const q of usable) {
    earned += q.earned;
    maxAvailable += q.marks;
    if (q.skipped) skipped += 1;
    else attempted += 1;

    const signedWrong = marksWrongFor(q.kind, q.marks, params);
    const topic = q.topic ?? null;

    if (!q.skipped) {
      // Source (1): attempting scored negative. Skipping scores exactly 0,
      // so the whole negative amount is the price of the call. No model.
      if (q.earned < -MARKS_EPSILON) {
        decisions.push({
          object_id: q.id,
          question_kind: q.kind,
          marks: q.marks,
          topic,
          concept_id: q.conceptId ?? null,
          decision: 'attempted_wrong',
          cost_marks: round2(-q.earned),
          marks_wrong: round2(signedWrong),
          accuracy: null,
          topic_attempts: null,
          label: `You answered a ${q.marks}-mark question on ${topicPhrase(topic)} and it went wrong.`,
          detail:
            `A wrong ${q.kind.toUpperCase()} here is minus ${marksPhrase(signedWrong)}; ` +
            'leaving it blank would have cost you nothing.',
        });
      }
      continue;
    }

    // Source (2): a skip only has a price if we can measure what the
    // student would likely have scored. No evidence → no line, ever.
    const ev = topic ? evidence[topic] : undefined;
    if (!ev || ev.attempted < MIN_TOPIC_ATTEMPTS_FOR_SKIP_EV) continue;

    const accuracy = ev.attempted > 0 ? ev.correct / ev.attempted : 0;
    const expected = expectedMarksIfAttempted(accuracy, q.marks, signedWrong);
    if (expected <= MARKS_EPSILON) continue;

    const pct = Math.round(accuracy * 100);
    decisions.push({
      object_id: q.id,
      question_kind: q.kind,
      marks: q.marks,
      topic,
      concept_id: q.conceptId ?? null,
      decision: 'skipped_positive_ev',
      cost_marks: round2(expected),
      marks_wrong: round2(signedWrong),
      accuracy: Math.round(accuracy * 1000) / 1000,
      topic_attempts: ev.attempted,
      label: `You left a ${q.marks}-mark question on ${topicPhrase(topic)} blank.`,
      detail:
        `You get ${pct}% of ${topicPhrase(topic)} questions right, so answering this one ` +
        `was worth about ${marksPhrase(expected)} on average — ` +
        (Math.abs(signedWrong) < MARKS_EPSILON
          ? 'and there is no penalty for a wrong answer on this type.'
          : `even after the minus ${marksPhrase(signedWrong)} when it goes wrong.`),
    });
  }

  // Deterministic ordering: costliest first, id as the tiebreak so the
  // same paper always produces the same three rows.
  decisions.sort((a, b) => (b.cost_marks - a.cost_marks) || a.object_id.localeCompare(b.object_id));

  // Summed from the ALREADY-ROUNDED row costs, deliberately: the three
  // numbers a student can see on screen must add up to the total printed
  // beside them. Summing exact values first and rounding once would be
  // marginally more precise and would occasionally print rows that visibly
  // do not add up.
  const recoverable = round2(decisions.reduce((sum, d) => sum + d.cost_marks, 0));
  const topDecisions = decisions.slice(0, COUNTERFACTUAL_ITEM_CAP);
  const remainder = decisions.slice(COUNTERFACTUAL_ITEM_CAP);
  const remainderMarks = round2(remainder.reduce((sum, d) => sum + d.cost_marks, 0));

  earned = round2(earned);
  maxAvailable = round2(maxAvailable);
  const marksCloseTo = round2(earned + recoverable);

  // Skip-heavy is checked BEFORE 'clean' — see the header's state matrix.
  const skipHeavy = skipped > 0 && skipped / usable.length > SKIP_HEAVY_FRACTION;
  const state: CounterfactualState = skipHeavy
    ? 'attempt_more'
    : recoverable <= MARKS_EPSILON
      ? 'clean'
      : 'decisions';

  return {
    available: true,
    state,
    reason: null,
    earned,
    max_available: maxAvailable,
    graded_questions: usable.length,
    attempted,
    skipped,
    marks_close_to: marksCloseTo,
    recoverable_marks: recoverable,
    top_decisions: topDecisions,
    remainder_count: remainder.length,
    remainder_marks: remainderMarks,
    break_even: breakEvenLines(usable, params),
    drill_concept_id: pickDrillConcept(decisions, usable),
    beats: buildBeats({ state, earned, maxAvailable, marksCloseTo, recoverable, attempted, skipped }),
  };
}

// ============================================================================
// Helpers
// ============================================================================

function unavailable(reason: string): CounterfactualReport {
  return {
    available: false,
    state: 'unavailable',
    reason,
    earned: 0,
    max_available: 0,
    graded_questions: 0,
    attempted: 0,
    skipped: 0,
    marks_close_to: 0,
    recoverable_marks: 0,
    top_decisions: [],
    remainder_count: 0,
    remainder_marks: 0,
    break_even: [],
    drill_concept_id: null,
    beats: { earned: '', competence: null, gap: null, action: null },
  };
}

/**
 * One line per distinct (kind, marks) pair the paper actually contained —
 * never a table of every rule the exam has, only the calls this student
 * faced.
 */
function breakEvenLines(
  questions: ReadonlyArray<CounterfactualQuestion>,
  params: CounterfactualContractParams,
): BreakEvenLine[] {
  const seen = new Map<string, BreakEvenLine>();
  for (const q of questions) {
    const key = `${q.kind}:${q.marks}`;
    if (seen.has(key)) continue;
    const signedWrong = marksWrongFor(q.kind, q.marks, params);
    const p = breakEvenP(q.marks, signedWrong);
    const kindLabel = q.kind.toUpperCase();
    const sentence = p <= 0
      ? `A wrong ${kindLabel} costs you nothing here, so a ${q.marks}-mark ${kindLabel} is always worth answering.`
      : `On a ${q.marks}-mark ${kindLabel} a wrong answer is minus ${marksPhrase(signedWrong)}, ` +
        `so it pays to answer whenever you'd get better than ${Math.round(p * 100)} in 100 right.`;
    seen.set(key, {
      question_kind: q.kind,
      marks: q.marks,
      marks_wrong: round2(signedWrong),
      break_even_p: Math.round(p * 1000) / 1000,
      sentence,
    });
  }
  return [...seen.values()].sort(
    (a, b) => a.question_kind.localeCompare(b.question_kind) || a.marks - b.marks,
  );
}

/**
 * The concept the drill CTA points at: the costliest decision that carries
 * one, else any question in the paper that does. PYQ-sourced rows carry no
 * concept id today (the mock generator doesn't select the column migration
 * 044 added), so a paper drawn entirely from the PYQ bank returns null and
 * the CTA is replaced by an honest sentence rather than a dead button.
 */
function pickDrillConcept(
  decisions: ReadonlyArray<CounterfactualDecision>,
  questions: ReadonlyArray<CounterfactualQuestion>,
): string | null {
  for (const d of decisions) if (d.concept_id) return d.concept_id;
  for (const q of questions) if (q.conceptId) return q.conceptId;
  return null;
}

function buildBeats(args: {
  state: CounterfactualState;
  earned: number;
  maxAvailable: number;
  marksCloseTo: number;
  recoverable: number;
  attempted: number;
  skipped: number;
}): CounterfactualBeats {
  const { state, earned, maxAvailable, marksCloseTo, recoverable, attempted, skipped } = args;
  const total = attempted + skipped;
  const earnedBeat = `You scored ${formatMarks(earned)} of ${formatMarks(maxAvailable)} marks.`;

  if (state === 'clean') {
    return {
      earned: earnedBeat,
      competence: 'You extracted everything you knew — every attempt-or-skip call on this paper was the right one.',
      gap: null,
      action: 'Keep the call sharp — 5-question drill',
    };
  }

  if (state === 'attempt_more') {
    const competence =
      `You answered ${attempted} of ${total} question${total === 1 ? '' : 's'} and banked ` +
      `${formatMarks(earned)} marks doing it.`;
    const gap = recoverable > MARKS_EPSILON
      ? `The ${marksPhrase(recoverable)} you're missing sat in questions you passed over, not in ` +
        'questions you got wrong — the habit to build is answering more of them, not answering more carefully.'
      : `You left ${skipped} question${skipped === 1 ? '' : 's'} blank. A blank is a guaranteed zero, ` +
        'and on this paper most of them were worth a shot.';
    return { earned: earnedBeat, competence, gap, action: 'Practise the attempt-or-skip call' };
  }

  return {
    earned: earnedBeat,
    competence: `You were already good for ${formatMarks(marksCloseTo)} marks on this paper.`,
    gap:
      `The ${marksPhrase(recoverable)} between that and your score came from attempt-or-skip calls, ` +
      'not from anything you still need to learn.',
    action: 'Practise the attempt-or-skip call',
  };
}
