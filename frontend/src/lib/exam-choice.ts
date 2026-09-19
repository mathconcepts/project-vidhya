/**
 * exam-choice — which exam THIS viewer is looking at.
 *
 * The active exam used to be a deployment constant: `DEFAULT_EXAM_ID` on the
 * server, resolved once, identical for everyone. That was fine while one
 * curriculum pack shipped. With two installed, the second was unreachable
 * from every student-facing surface no matter what was on disk — the app
 * could only ever be one exam at a time, for everybody.
 *
 * This is the viewer's own override, persisted per browser. It is NOT a
 * student's exam registration (`exam-profile-store` on the server, managed
 * at /exam-profile): a registration is a durable statement about what
 * someone is preparing for, and most demo visitors are anonymous and have
 * none. This is "what am I looking at right now", which is exactly what a
 * switcher in the shell should mean.
 *
 * Storage is best-effort. Private windows, cleared site data and blocked
 * storage all make these throw, so every read and write is wrapped and the
 * app falls back to the deployment default rather than breaking.
 */

const KEY = 'vidhya.exam.choice';

/** The viewer's chosen exam id, or null to follow the deployment default. */
export function getExamChoice(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

/** Persist a choice. `null` clears it and returns to the deployment default. */
export function storeExamChoice(examId: string | null): void {
  try {
    if (examId) localStorage.setItem(KEY, examId);
    else localStorage.removeItem(KEY);
  } catch {
    /* best-effort — a viewer with storage blocked just doesn't persist */
  }
}

/**
 * Append the viewer's exam choice to a request path.
 *
 * Applied centrally in `apiFetch` rather than at each call site on purpose:
 * `/api/topics` alone is fetched from four separate pages, and a per-call
 * param is four chances to forget one and serve a student the other exam's
 * topic list. Endpoints that do not read `exam_id` ignore it; the two that
 * do (`/api/topics`, `/api/exam/active`) both validate it against the
 * loaded packs and fall back to the default on anything unrecognised.
 *
 * Leaves a path that already carries an explicit `exam_id` untouched — an
 * intentional per-call override always beats the ambient one.
 */
export function withExamChoice(path: string): string {
  const choice = getExamChoice();
  if (!choice) return path;
  if (/[?&]exam_id=/.test(path)) return path;
  return path + (path.includes('?') ? '&' : '?') + 'exam_id=' + encodeURIComponent(choice);
}
