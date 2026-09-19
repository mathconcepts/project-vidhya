/**
 * src/curriculum/student-exam-scope.ts
 *
 * "Which concepts is this student actually studying?" — one answer, one
 * place.
 *
 * v4.84.0 made the concept graph a MERGE of every installed exam pack. Until
 * the jee-main pack declared concepts that merge was a no-op (one pack, 101
 * concepts) and a handful of call sites could read `ALL_CONCEPTS` and be
 * right by accident. They are not right any more. A tripwire test shipped
 * with that release named eight of them; `ci:topic-namespace` and namespaced
 * JEE topic strings close the ~20 that select BY TOPIC STRING, but four
 * select by ID or by COUNT, where namespacing buys nothing:
 *
 *   src/api/readiness-routes.ts    the node universe nextBestAction() and
 *                                  expectedScore() may recommend from
 *   src/api/quiz-routes.ts         the frontier arm of the checkpoint quiz pool
 *   src/notebook/notebook-store.ts the syllabus-coverage denominator
 *   src/curriculum/curriculum-repo.ts  every node the readiness engine sees
 *
 * Unscoped, a GATE student gets JEE concepts recommended by the CAT
 * selector, sampled into their checkpoint quiz, and counted against their
 * syllabus coverage (which halves the moment a second pack lands). None of
 * that fails loudly.
 *
 * Four independent fixes would have been four copies of the same policy,
 * free to drift — the bug class this repo named in v4.25.0 when four
 * declarations of the same model id disagreed. This is the one copy.
 *
 * DEGRADATION IS EXPLICIT AND NEVER EMPTY. An empty scope is worse than a
 * wide one: it deadlocks the readiness engine into `diagnose`, makes a quiz
 * pool impossible to assemble, and reads as "you have covered nothing." So
 * the chain ends at the whole graph rather than at nothing, and every result
 * carries the `basis` it was reached by, so a caller (or an operator reading
 * a log) can tell a real registration from a fallback.
 */

import {
  ALL_CONCEPTS,
  conceptsDeclaredByExam,
  type ConceptNode,
} from '../constants/concept-graph';
import { getSyllabus, resolveActiveExamId, listSyllabusIds } from './exam-loader';
import { getProfile } from '../session-planner/exam-profile-store';

/** How a scope was arrived at. Reported, never inferred by the caller. */
export type ScopeBasis =
  /** The student's own exam registration(s) in exam-profile-store. */
  | 'registered'
  /** No registration (anonymous, or a profile with no exams) — the deployment's active exam. */
  | 'active-exam'
  /** The active exam declares no concepts of its own (a stub pack mid-migration). */
  | 'whole-graph';

export interface ConceptScope {
  concepts: ConceptNode[];
  conceptIds: string[];
  examIds: string[];
  basis: ScopeBasis;
}

/**
 * The concepts one exam pack covers.
 *
 * Delegates to `getSyllabus`, which already resolves both pack shapes
 * correctly: a pack that declares its own `concepts:` block IS its own
 * scope; one that only references shared ids by `syllabus:` resolves them
 * against the merged graph. Re-deriving either rule here would be a second
 * copy of it.
 *
 * Returns [] for an unknown id rather than throwing — a stale exam id on an
 * old profile should degrade a student to the active exam, not 500 their
 * next-action request.
 */
export function conceptsForExam(exam_id: string): ConceptNode[] {
  try {
    return getSyllabus(exam_id).concepts;
  } catch {
    return [];
  }
}

/**
 * The exam ids a student is registered for, most-recently-registered order
 * preserved as stored. [] for an anonymous or unregistered student.
 *
 * `exam-profile-store` caps a profile at 5 concurrent registrations, so the
 * union below is bounded.
 */
export function registeredExamIds(studentId: string | null | undefined): string[] {
  if (!studentId) return [];
  // Persona and anonymous ids never carry a real registration; skip the read.
  if (studentId.startsWith('anon_')) return [];
  try {
    const profile = getProfile(studentId);
    return (profile?.exams ?? []).map((e) => e.exam_id).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * THE resolver. Everything else in this file exists to serve it.
 *
 * Pass the student id when you have one — every one of the four call sites
 * named in this file's header does, either as a parameter or from
 * `requireRole`'s auth context. Pass null for a genuinely student-less
 * context (a build script, an admin diagnostic) and the deployment's active
 * exam answers instead.
 */
export function conceptScopeForStudent(studentId: string | null | undefined): ConceptScope {
  const registered = registeredExamIds(studentId);

  if (registered.length > 0) {
    const seen = new Set<string>();
    const concepts: ConceptNode[] = [];
    for (const examId of registered) {
      for (const c of conceptsForExam(examId)) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        concepts.push(c);
      }
    }
    // A registration pointing only at stub packs resolves to nothing. Fall
    // through rather than hand back an empty universe.
    if (concepts.length > 0) {
      return { concepts, conceptIds: concepts.map((c) => c.id), examIds: registered, basis: 'registered' };
    }
  }

  const activeId = resolveActiveExamId();
  if (activeId) {
    const concepts = conceptsForExam(activeId);
    if (concepts.length > 0) {
      return { concepts, conceptIds: concepts.map((c) => c.id), examIds: [activeId], basis: 'active-exam' };
    }
  }

  // The active exam declares nothing. `concept-graph.ts` already warns at
  // boot when ACTIVE_EXAM_CONCEPT_COUNT is zero, so this does not warn
  // again per request — it just degrades wide instead of empty.
  return {
    concepts: ALL_CONCEPTS,
    conceptIds: ALL_CONCEPTS.map((c) => c.id),
    examIds: activeId ? [activeId] : listSyllabusIds(),
    basis: 'whole-graph',
  };
}

/** Convenience for the common case: just the ids. */
export function conceptIdsForStudent(studentId: string | null | undefined): string[] {
  return conceptScopeForStudent(studentId).conceptIds;
}

/**
 * Is this concept inside the student's scope?
 *
 * For validating a CLIENT-SUPPLIED concept id — `?node=` on
 * /api/readiness/expected-score and `concept_id` on POST
 * /api/practice/quiz/start both accept one today and check only that it
 * exists SOMEWHERE in the merged graph, which with two packs installed
 * means a GATE student can name a JEE concept and have it scored.
 */
export function isConceptInScope(
  studentId: string | null | undefined,
  conceptId: string,
): boolean {
  return conceptScopeForStudent(studentId).conceptIds.includes(conceptId);
}

/** Exported for the coverage denominator in notebook-store. */
export function conceptCountForStudent(studentId: string | null | undefined): number {
  return conceptScopeForStudent(studentId).concepts.length;
}

/** Re-export so callers need one import, not two. */
export { conceptsDeclaredByExam };
