/**
 * PYQ bank concept index — "which exam questions cover concept X?" for
 * DB-less deploys (multi-concept mapping extension / A9).
 *
 * `frontend/public/data/pyq-bank.json` (and the merged
 * `content-bundle.json` that supersedes it at runtime — see
 * `src/sessions/session-store.ts`'s `loadBundleProblems()`) now carries
 * `concept_id` (primary) and `concept_ids` (full set, primary first) on
 * every problem the mapper could confidently classify — see
 * `src/db/pyq-concept-mapper.ts` and `scripts/export-bundles.ts`.
 *
 * This module turns that flat problem list into a concept -> problems
 * index, once, so a lookup-by-concept route doesn't linear-scan the whole
 * bank per request. Pure function over the bundle's already-loaded JSON —
 * no fs, no DB, no network — so it's trivially testable and reusable by
 * both a Node route handler and (if ever needed) a browser bundle.
 *
 * Deliberately conservative, matching the mapper's own discipline: a
 * problem with neither `concept_id` nor `concept_ids` set contributes to
 * NO concept bucket. There is no topic-name fallback here (unlike
 * session-store.ts's `FlatFileStore.fetchProblemsForConcept`, which
 * tolerates topic-as-concept-id for legacy callers) — topic ids and
 * concept ids are different id spaces, and silently bucketing a question
 * under every question's coarse topic would make "questions covering
 * concept X" answer a much broader, wrong question.
 */

export interface PyqBankProblem {
  id: string;
  concept_id?: string | null;
  concept_ids?: string[] | null;
  topic?: string;
  [key: string]: unknown;
}

export interface PyqBankBundle {
  problems?: PyqBankProblem[] | null;
  [key: string]: unknown;
}

/**
 * Build a concept_id -> problems index from an already-parsed bundle
 * (pyq-bank.json or content-bundle.json shape — both carry a `problems`
 * array with the same per-problem fields). A problem appears once per
 * distinct concept in its `concept_ids` (or, for a pre-048 problem that
 * only ever got a single `concept_id`, once under that). Order within
 * each concept's list follows the bundle's own problem order — first
 * come, first served, no re-sorting.
 */
export function buildPyqConceptIndex(bundle: PyqBankBundle | null | undefined): Map<string, PyqBankProblem[]> {
  const index = new Map<string, PyqBankProblem[]>();
  const problems = bundle?.problems ?? [];

  for (const problem of problems) {
    const concepts = new Set<string>();
    if (problem.concept_id) concepts.add(problem.concept_id);
    if (Array.isArray(problem.concept_ids)) {
      for (const conceptId of problem.concept_ids) {
        if (conceptId) concepts.add(conceptId);
      }
    }
    for (const conceptId of concepts) {
      const existing = index.get(conceptId);
      if (existing) existing.push(problem);
      else index.set(conceptId, [problem]);
    }
  }

  return index;
}

/** Convenience accessor — `[]`, never `undefined`, for an unmapped/unknown concept. */
export function questionsForConcept(
  index: Map<string, PyqBankProblem[]>,
  conceptId: string,
): PyqBankProblem[] {
  return index.get(conceptId) ?? [];
}
