/**
 * src/exams/marking-constants.ts — THE compiled marking truth (plan D7 / E6).
 *
 * Before this file the same marking facts were stated independently in five
 * places, each with its own shape, its own sign convention, and its own
 * comment claiming one of the others was authoritative:
 *
 *   1. `src/scoring/deterministic-scorer.ts` — `DEFAULT_MCQ_NEGATIVE_1_MARK`
 *      / `_2_MARK` as POSITIVE penalty magnitudes.
 *   2. `src/exams/exam-profile.ts` — `GATE_EM_MARKING_TABLE`, keyed
 *      `one_mark`/`two_mark`, negatives as SIGNED `-(1 / 3)`.
 *   3. `src/syllabus/exam-catalog.ts` — `marking_table`, keyed by the
 *      numeric mark value `1`/`2`, negatives as SIGNED `-1 / 3`.
 *   4. `src/samples/gate-mathematics.ts` — `marking_scheme`, per-kind flat
 *      fields, negatives as POSITIVE magnitudes.
 *   5. `docs/exam-profile-schema.md` — a prose table.
 *
 * Five statements of one fact is five chances to drift. This module is the
 * survivor: every one of the other four now derives from it (the prose
 * table is re-pointed at it by name), and the `assessment_contracts` seed
 * row in `supabase/migrations/050_assessment_contracts.sql` is generated
 * from these same values — with a test that fails if the SQL and this file
 * ever disagree.
 *
 * ── Sign convention, normalized deliberately ─────────────────────────────
 *
 * `marks_wrong` is ALWAYS SIGNED here: a negative number is a deduction, 0
 * is "no negative marking". That is the convention `MarkingRule.marks_wrong`
 * in exam-profile.ts already documents ("expressed as a negative number"),
 * the convention the schema doc's prose reads in, and the convention that
 * goes into the contract JSONB — so it is the one the compiled truth
 * carries.
 *
 * Two consumers legitimately want a POSITIVE magnitude instead:
 * deterministic-scorer's `DEFAULT_MCQ_NEGATIVE_*` (a penalty magnitude it
 * negates at the call site) and `samples/gate-mathematics.ts`'s
 * `negative_marks_per_wrong_*` fields (the shape every OTHER sample exam in
 * `src/samples/` uses, where `raw -= negative_marks_per_wrong`). Those two
 * do not silently re-type the number: they call `negativeMagnitude()`
 * below, so the flip is one named, greppable function rather than a second
 * convention that reads like a typo.
 *
 * ── Why `src/exams/` and not `src/scoring/` ──────────────────────────────
 *
 * `scripts/fork-test-lint.mjs` polices `src/core/`, `src/gbrain/`,
 * `src/readiness/` and `src/scoring/` for exam-name literals — those are
 * the ENGINE directories, and an exam fact hardcoded inside one is the
 * exact failure that lint exists to catch. `src/exams/` is explicitly
 * carved out as "legitimately exam-aware by design" (see that script's
 * header), which is what a per-exam marking contract is. The scorer imports
 * the numbers from here rather than restating them.
 *
 * ── Provenance ───────────────────────────────────────────────────────────
 *
 * The values are the official contract facts for the exam named by
 * `COMPILED_CONTRACT_KEY`: MCQ carries negative marking scaled to the
 * item's mark value (one-third of it), MSQ carries neither negative marking
 * nor partial credit, and numeric-answer items carry no negative marking
 * and are graded against an accepted tolerance band. `verified_at` records
 * when this constant was last reconciled against the repo's fact-labelled
 * sources — NOT a claim that a human re-read the current-year brochure this
 * morning. Re-verification against the official notification is the annual
 * operator checklist item (plan W1.5); when it moves, it moves HERE and the
 * seed-row equality test drags the migration along with it.
 */

// ============================================================================
// Contract identity
// ============================================================================

/**
 * The `(exam, paper, year)` key this compiled contract answers for. Matches
 * the primary key of `assessment_contracts` (migration 050) exactly — a
 * contract is always scoped to a paper of an exam in a year, never to "the
 * exam" in the abstract, because marking schemes are re-notified annually.
 */
export const COMPILED_CONTRACT_KEY = {
  exam: 'gate',
  paper: 'common-em',
  year: 2026,
} as const;

/**
 * Registered marking-strategy ids (plan D11). A strategy id names the
 * ALGORITHM; the params name the numbers it runs on. Adding an exam whose
 * marking is the same algorithm with different numbers is a new contract
 * row and zero code; adding an exam whose marking needs arithmetic this
 * algorithm cannot express is one new registered strategy — see
 * `src/scoring/marking-strategy.ts` and
 * docs/designs/2026-08-27-assessment-contract-jee-advanced-check.md.
 */
export type MarkingStrategyId = 'gate_2026';

/** Question kinds the compiled contract carries marking for. */
export type ContractQuestionKind = 'mcq' | 'msq' | 'nat';

// ============================================================================
// Params — the numbers a strategy runs on
// ============================================================================

/**
 * MCQ params: negative marking scaled by the item's mark value.
 *
 * `marks_wrong_by_marks` is keyed by the item's mark value as a STRING (so
 * it round-trips through JSONB unchanged) and holds SIGNED deductions.
 * `marks_wrong_fallback_divisor` covers a mark value the table has no row
 * for: the deduction is `-(marks / divisor)`. That is a defensive default,
 * not a documented exam rule — this exam has no MCQ mark value other than 1
 * or 2 today.
 */
export interface McqMarkingParams {
  marks_wrong_by_marks: Record<string, number>;
  marks_wrong_fallback_divisor: number;
}

/**
 * MSQ params. `partial_credit: false` is load-bearing, not decorative: the
 * scorer REFUSES to grade an MSQ under a scheme that claims partial credit
 * rather than silently grading full-or-nothing under it.
 */
export interface MsqMarkingParams {
  marks_wrong: number;
  partial_credit: boolean;
}

/** Numeric-answer params: no negative marking, graded against a tolerance band. */
export interface NatMarkingParams {
  marks_wrong: number;
  /** Boundary tolerance applied to BOTH ends of the item's accepted range. */
  tolerance_epsilon: number;
}

/** One question kind's marking: which algorithm, on which numbers. */
export interface ContractMarkingEntry<P> {
  strategy: MarkingStrategyId;
  params: P;
}

/** The full per-question-type marking block, as it lands in the JSONB column. */
export interface ContractMarking {
  mcq: ContractMarkingEntry<McqMarkingParams>;
  msq: ContractMarkingEntry<MsqMarkingParams>;
  nat: ContractMarkingEntry<NatMarkingParams>;
}

/** The compiled contract: identity + provenance + marking. */
export interface CompiledAssessmentContract {
  exam: string;
  paper: string;
  year: number;
  official_source_url: string;
  /** ISO date this constant was last reconciled against its sources. */
  verified_at: string;
  marking: ContractMarking;
}

// ============================================================================
// The compiled contract
// ============================================================================

export const COMPILED_ASSESSMENT_CONTRACT: CompiledAssessmentContract = {
  exam: COMPILED_CONTRACT_KEY.exam,
  paper: COMPILED_CONTRACT_KEY.paper,
  year: COMPILED_CONTRACT_KEY.year,
  official_source_url: 'https://gate2026.iitg.ac.in',
  verified_at: '2026-08-27',
  marking: {
    mcq: {
      strategy: 'gate_2026',
      params: {
        marks_wrong_by_marks: {
          '1': -(1 / 3),
          '2': -(2 / 3),
        },
        marks_wrong_fallback_divisor: 3,
      },
    },
    msq: {
      strategy: 'gate_2026',
      params: {
        marks_wrong: 0,
        partial_credit: false,
      },
    },
    nat: {
      strategy: 'gate_2026',
      params: {
        marks_wrong: 0,
        tolerance_epsilon: 1e-9,
      },
    },
  },
};

/**
 * Version string for a contract resolved FROM this compiled constant rather
 * than from a database row. The `+compiled` suffix is the honesty marker
 * (plan E6): a DB-less deploy still grades correctly, and anything that
 * stamps a version can tell afterwards that no row was read.
 */
export const COMPILED_CONTRACT_VERSION =
  `${COMPILED_CONTRACT_KEY.exam}-${COMPILED_CONTRACT_KEY.year}+compiled`;

/** Version string for the same contract when a real database row supplied it. */
export const DB_CONTRACT_VERSION =
  `${COMPILED_CONTRACT_KEY.exam}-${COMPILED_CONTRACT_KEY.year}`;

// ============================================================================
// Derived accessors — what the four former truths now call
// ============================================================================

/**
 * Flip a signed `marks_wrong` into the positive penalty MAGNITUDE two
 * consumers want (see this module's sign-convention note). Named rather
 * than inlined so the flip is greppable.
 */
export function negativeMagnitude(signedMarksWrong: number): number {
  return Math.abs(signedMarksWrong);
}

/**
 * SIGNED deduction for a wrong MCQ of the given mark value. Falls back to
 * `-(marks / divisor)` for a mark value the contract has no row for.
 */
export function mcqMarksWrong(itemMarks: number): number {
  const { marks_wrong_by_marks, marks_wrong_fallback_divisor } =
    COMPILED_ASSESSMENT_CONTRACT.marking.mcq.params;
  const declared = marks_wrong_by_marks[String(itemMarks)];
  if (typeof declared === 'number') return declared;
  return -(itemMarks / marks_wrong_fallback_divisor);
}

/** Marks awarded for a correct answer: always the item's own mark value. */
export function marksCorrect(itemMarks: number): number {
  return itemMarks;
}

/** POSITIVE penalty magnitude for a wrong 1-mark MCQ. */
export const MCQ_NEGATIVE_MAGNITUDE_1_MARK = negativeMagnitude(mcqMarksWrong(1));

/** POSITIVE penalty magnitude for a wrong 2-mark MCQ. */
export const MCQ_NEGATIVE_MAGNITUDE_2_MARK = negativeMagnitude(mcqMarksWrong(2));

/** Divisor behind the defensive `-(marks / 3)` fallback. */
export const MCQ_NEGATIVE_FALLBACK_DIVISOR =
  COMPILED_ASSESSMENT_CONTRACT.marking.mcq.params.marks_wrong_fallback_divisor;

/** SIGNED deduction for a wrong MSQ (0 — no negative marking). */
export const MSQ_MARKS_WRONG = COMPILED_ASSESSMENT_CONTRACT.marking.msq.params.marks_wrong;

/** Whether MSQ grading awards partial credit (false — full-or-nothing). */
export const MSQ_PARTIAL_CREDIT = COMPILED_ASSESSMENT_CONTRACT.marking.msq.params.partial_credit;

/** SIGNED deduction for a wrong numeric answer (0 — no negative marking). */
export const NAT_MARKS_WRONG = COMPILED_ASSESSMENT_CONTRACT.marking.nat.params.marks_wrong;

/** Boundary tolerance applied to both ends of a numeric item's accepted range. */
export const NAT_TOLERANCE_EPSILON =
  COMPILED_ASSESSMENT_CONTRACT.marking.nat.params.tolerance_epsilon;

// ============================================================================
// The compiled contract registry — more than one exam (v4.86.0)
// ============================================================================

/**
 * A compiled contract that carries marking for only SOME question kinds.
 *
 * `CompiledAssessmentContract` above requires all three, which is right for
 * GATE: its paper genuinely asks MCQ, MSQ and NAT, so a missing entry would
 * be an omission. It is wrong as a universal shape. An exam that does not
 * ASK a question kind should not carry marking for it, and an exam whose
 * rule for a kind is genuinely unsettled must not carry an invented one —
 * in both cases the honest contract is one with that kind absent, so a
 * caller refuses by name instead of grading under numbers nobody published.
 */
export interface PartialCompiledAssessmentContract
  extends Omit<CompiledAssessmentContract, 'marking'> {
  marking: Partial<ContractMarking>;
}

/**
 * JEE Main Paper 1, Mathematics section.
 *
 * ── Why this is a registry entry and not a new strategy ──────────────────
 *
 * `strategy: 'gate_2026'` on a JEE contract reads strangely and is correct.
 * The id names the ALGORITHM, never the exam (see `MarkingStrategyId` and
 * `src/scoring/marking-strategy.ts`): "award the item's marks when right,
 * apply a table-driven signed deduction when wrong". JEE Main MCQ is that
 * same arithmetic on different numbers — +4 correct, a flat -1 wrong — so
 * it is a contract entry and ZERO code, exactly the claim the seam was
 * built to make good on. The id is historical; renaming it would touch the
 * registry, the migration seed row and the scorer-parity test for a
 * cosmetic gain.
 *
 * `marks_wrong_by_marks` is keyed by the item's mark value as a string.
 * Every JEE Main MCQ is worth 4, so the table has exactly one row. GATE's
 * deduction is SCALED (one-third of the item's marks); JEE's is FLAT (-1
 * regardless), which the per-mark-value table expresses directly without
 * either exam needing to know the other's rule.
 *
 * ── What is deliberately ABSENT, and what that blocks ────────────────────
 *
 * `msq`: JEE Main Mathematics has no multiple-select questions. An entry
 * would describe a question kind the paper does not ask.
 *
 * `nat`: JEE Main DOES ask five numerical-value questions per subject, and
 * the negative-marking rule for them is the open question recorded in
 * `data/curriculum/jee-main.yml`'s own `scoring:` block — secondary sources
 * split between the MCQ's -1 and the older +4/0 with no negative marking,
 * and `jeemain.nta.nic.in` is unreachable from this environment, so the
 * primary information bulletin could not settle it. Guessing would mean
 * grading a real student's real attempt under a rule nobody published.
 *
 * Leaving `nat` out is not a TODO, it is the enforcement: a JEE numeric
 * item resolves a contract with no `nat` entry and is REFUSED BY NAME at
 * grading time. That is why the shipped JEE practice bank is MCQ-only —
 * the constraint is mechanical, not a matter of authoring discipline.
 *
 * ── Provenance ───────────────────────────────────────────────────────────
 *
 * `verified_at` follows this module's existing convention: it records when
 * these numbers were last reconciled against the repo's fact-labelled
 * sources, NOT a claim that anyone re-read the current-year bulletin. The
 * +4/-1 MCQ rule is the long-stable, uncontested published rule; it is the
 * NVQ rule that is disputed, and it is absent above rather than recorded.
 */
export const JEE_MAIN_CONTRACT_KEY = {
  exam: 'jee-main',
  paper: 'paper-1-maths',
  year: 2026,
} as const;

export const JEE_MAIN_COMPILED_CONTRACT: PartialCompiledAssessmentContract = {
  exam: JEE_MAIN_CONTRACT_KEY.exam,
  paper: JEE_MAIN_CONTRACT_KEY.paper,
  year: JEE_MAIN_CONTRACT_KEY.year,
  official_source_url: 'https://jeemain.nta.nic.in/',
  verified_at: '2026-09-19',
  marking: {
    mcq: {
      strategy: 'gate_2026',
      params: {
        // Every JEE Main MCQ is 4 marks; a flat -1 for a wrong answer.
        marks_wrong_by_marks: {
          '4': -1,
        },
        // Defensive only — this exam has no MCQ mark value other than 4.
        // Chosen as 4 so the fallback stays consistent with the one real
        // row (-(4/4) = -1) instead of inventing a different ratio.
        marks_wrong_fallback_divisor: 4,
      },
    },
    // msq: absent by design — JEE Main Mathematics does not ask MSQ.
    // nat:  absent by design — the NVQ negative-marking rule is unsettled.
  },
};

/**
 * Every compiled contract this build can answer for, in no significant
 * order. `COMPILED_ASSESSMENT_CONTRACT` stays exported on its own because
 * every derived accessor above reads GATE's numbers specifically.
 */
export const COMPILED_CONTRACTS: readonly PartialCompiledAssessmentContract[] = [
  COMPILED_ASSESSMENT_CONTRACT,
  JEE_MAIN_COMPILED_CONTRACT,
];

/**
 * The compiled contract for a key, or null when this build has none.
 *
 * Null is load-bearing: `assessment-contract-loader` turns it into an EMPTY
 * resolved contract rather than handing back some other exam's numbers
 * wearing this exam's name. Matching is exact on all three key parts,
 * because a marking scheme is notified per paper per year.
 */
export function findCompiledContract(key: {
  exam: string;
  paper: string;
  year: number;
}): PartialCompiledAssessmentContract | null {
  return (
    COMPILED_CONTRACTS.find(
      (c) => c.exam === key.exam && c.paper === key.paper && c.year === key.year,
    ) ?? null
  );
}
