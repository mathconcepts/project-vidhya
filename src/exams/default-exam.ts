/**
 * Default exam-id resolution (v2.5).
 *
 * Replaces the prior `DEFAULT_EXAM_ID = process.env.DEFAULT_EXAM_ID ?? 'gate-ma'`
 * pattern that hardcoded 'gate-ma' as a silent fallback in three jobs and one
 * route. The platform is exam-agnostic; falling back to GATE silently was
 * exactly the kind of hardcoding the v2.5 cleanup is removing.
 *
 * Resolution precedence:
 *   1. ENV `DEFAULT_EXAM_ID` (operator override)
 *   2. First registered exam from the exam-store (any non-archived, non-draft)
 *   3. throw NoExamConfiguredError — caller decides how to handle
 *
 * Callers that previously relied on the silent fallback either:
 *   - Use `resolveDefaultExamId()` and let the error propagate (correct for
 *     server bootstrap and admin tooling — operators see a clear message).
 *   - Use `resolveDefaultExamIdOrNull()` for code paths where "no exam" is
 *     a legitimate state (anonymous user before exam picker, etc.).
 */

import { listExams } from './exam-store';

export class NoExamConfiguredError extends Error {
  constructor() {
    super(
      'No exam is configured for this deployment. Set ENV DEFAULT_EXAM_ID, ' +
        'or create an exam via /admin/exams or POST /api/exams.',
    );
    this.name = 'NoExamConfiguredError';
  }
}

/**
 * Resolve the default exam id. Throws NoExamConfiguredError if none.
 */
export function resolveDefaultExamId(env: Record<string, string | undefined> = process.env): string {
  if (env.DEFAULT_EXAM_ID && env.DEFAULT_EXAM_ID.trim().length > 0) {
    return env.DEFAULT_EXAM_ID.trim();
  }
  const exams = listExams({ include_drafts: false, include_archived: false });
  if (exams.length === 0) {
    throw new NoExamConfiguredError();
  }
  // Lexicographic stability: first by created_at if available, else by id.
  const sorted = [...exams].sort((a, b) => {
    const ta = (a as { created_at?: string }).created_at ?? '';
    const tb = (b as { created_at?: string }).created_at ?? '';
    if (ta && tb) return ta.localeCompare(tb);
    return a.id.localeCompare(b.id);
  });
  return sorted[0].id;
}

/**
 * Soft variant: returns null instead of throwing. Use only when "no exam"
 * is a legitimate state (anonymous user, fresh deployment before any exam
 * configured, etc.).
 */
export function resolveDefaultExamIdOrNull(env: Record<string, string | undefined> = process.env): string | null {
  try {
    return resolveDefaultExamId(env);
  } catch {
    return null;
  }
}
