/**
 * src/exams/exam-contract-key.ts — which marking contract governs an item.
 *
 * `resolveAssessmentContract()` takes an `(exam, paper, year)` key and
 * defaults it to `COMPILED_CONTRACT_KEY`. Every call site in the repo took
 * that default, which was harmless while one exam shipped marking numbers
 * and is a correctness bug the moment a second does: a JEE Main MCQ is
 * worth 4 marks, and under GATE's contract a 4-mark MCQ finds no row in
 * `marks_wrong_by_marks` and falls through to `-(4 / 3)`. The student loses
 * 1.33 marks where the real paper deducts 1, and nothing fails loudly.
 *
 * This module is the one translation from a curriculum pack id to a
 * contract key. It is deliberately a small explicit table rather than a
 * convention over the pack id: `gate-ma` maps to exam `gate`, paper
 * `common-em` — a rule no string transform would have produced — and
 * inventing one would break the next pack that does not fit it.
 *
 * ── An unknown pack refuses, it does not borrow ──────────────────────────
 *
 * A pack with no entry gets a synthesized key that no compiled contract
 * covers, so `resolveAssessmentContract` returns an EMPTY contract and the
 * caller refuses by name. That is the same discipline `compiledCovers`
 * already enforces, reached one step earlier: grading a real attempt under
 * a rule nobody published for that exam is worse than declining to grade.
 */

import { CONCEPT_DECLARED_BY } from '../constants/concept-graph';
import { conceptScopeForStudent } from '../curriculum/student-exam-scope';
import {
  COMPILED_CONTRACT_KEY,
  JEE_MAIN_CONTRACT_KEY,
} from './marking-constants';

/** The `(exam, paper, year)` a contract answers for. */
export interface ExamContractKey {
  exam: string;
  paper: string;
  year: number;
}

/**
 * Curriculum pack id (`data/curriculum/<id>.yml`) to contract key.
 *
 * Keyed by pack id because that is what the rest of the app carries: the
 * active exam, a student's registration, and `CONCEPT_DECLARED_BY` all
 * speak pack ids, while `assessment_contracts` is keyed by the exam's own
 * published identity. These two namespaces genuinely differ and this is
 * where they meet.
 */
const PACK_TO_CONTRACT_KEY: Readonly<Record<string, ExamContractKey>> = {
  'gate-ma': { ...COMPILED_CONTRACT_KEY },
  'jee-main': { ...JEE_MAIN_CONTRACT_KEY },
};

/**
 * Year stamped on a synthesized key for an unmapped pack. Any value works —
 * nothing covers the key either way — but a fixed one keeps the resulting
 * warn line stable instead of drifting with the clock.
 */
const UNMAPPED_CONTRACT_YEAR = 0;

/**
 * The contract key for a curriculum pack.
 *
 * `null`/`undefined` returns GATE's key, preserving the pre-registry
 * default for callers that genuinely have no exam in context (an admin
 * diagnostic, a generation-side version stamp). Every GRADING path resolves
 * a real exam before calling this, so that branch is not how a student's
 * attempt gets marked — see `contractKeyForConcept` below.
 */
export function contractKeyForExam(examId: string | null | undefined): ExamContractKey {
  if (!examId) return { ...COMPILED_CONTRACT_KEY };
  const known = PACK_TO_CONTRACT_KEY[examId];
  if (known) return { ...known };
  return { exam: examId, paper: 'unmapped', year: UNMAPPED_CONTRACT_YEAR };
}

/**
 * The contract key for the exam that OWNS a concept.
 *
 * This, not the student's own registration, is the right key for grading a
 * practice item: a JEE item is a JEE item under JEE's marking whoever
 * attempts it, and a GATE student who wanders into one should still be
 * marked by the rules that item was written to. `CONCEPT_DECLARED_BY` is
 * the merged graph's own record of which pack declared each concept, so
 * this cannot drift from what the graph actually loaded.
 *
 * An unknown concept falls back to the active-exam-less default rather than
 * refusing: an item whose concept is not in the graph is a content problem
 * to fix, not a reason to fail a student's in-flight attempt, and the
 * default is the same contract that graded it before this module existed.
 */
export function contractKeyForConcept(conceptId: string | null | undefined): ExamContractKey {
  if (!conceptId) return { ...COMPILED_CONTRACT_KEY };
  return contractKeyForExam(CONCEPT_DECLARED_BY.get(conceptId) ?? null);
}

/** Exported for tests and diagnostics: the packs this build can mark. */
export function mappedContractPackIds(): string[] {
  return Object.keys(PACK_TO_CONTRACT_KEY);
}

/**
 * The contract key for a STUDENT's exam — the right key for a session-level
 * pin (a checkpoint quiz, a mock exam), where plan E7 resolves one contract
 * at creation and every later grade, including an idempotent retry, reads
 * that pinned snapshot rather than re-resolving.
 *
 * Uses the same `conceptScopeForStudent` resolver the readiness engine and
 * quiz pool already share, so a session cannot be pinned to an exam the
 * student is not actually being served concepts from. Its documented
 * degradation chain (registration -> the deployment's active exam -> the
 * whole graph) applies here too.
 *
 * KNOWN LIMIT, stated rather than hidden: a student registered for two
 * exams at once has ONE scope but their pool can span both packs, and a
 * session pins ONE contract. The first scoped exam wins, so an item from
 * the other pack in that same session would be marked under this one's
 * rules. Nothing in the shipped demo reaches that — a viewer is on one exam
 * at a time — but it is real and is recorded in TODOS.md rather than
 * papered over. Per-item keying (what `contractKeyForConcept` does for
 * practice attempts) is the fix, and it conflicts with E7's pin-once
 * design, so it is a decision, not a patch.
 */
export function contractKeyForStudent(studentId: string | null | undefined): ExamContractKey {
  return contractKeyForExam(conceptScopeForStudent(studentId).examIds[0] ?? null);
}
