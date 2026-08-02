/**
 * Adaptive-threading signals (realignment item 7).
 *
 * The client transmits mastery_by_topic + recent_errors from its
 * IndexedDB stores on every lesson compose. This module sanitizes those
 * untrusted payloads and computes error_streak — the number of
 * CONSECUTIVE most-recent misses on the SAME concept — which feeds the
 * PedagogyEngine's modality switch (pedagogy-engine.ts, error_streak >= 3).
 *
 * Generic-first ladder (spec-locked): empty/absent signals must produce
 * byte-identical behavior to a signal-less request. Every function here
 * maps empty input to the neutral value (empty array / empty map / 0).
 *
 * Pure functions, no I/O.
 */

export interface RecentErrorEntry {
  concept_id: string;
  error_type: string;
  /** ISO timestamp — optional; when present, entries are ordered by it. */
  created_at?: string;
}

/** Max recent-error entries accepted from the client (payload bound). */
export const MAX_RECENT_ERRORS = 10;

/**
 * Sanitize a client-transmitted recent_errors payload. Unknown shapes are
 * dropped entry-by-entry (sanitize, don't 500); the caller decides whether
 * a non-array payload is a 400. Entries are normalized to most-recent-first
 * (by created_at when present, otherwise input order is trusted) and capped
 * at MAX_RECENT_ERRORS.
 */
export function sanitizeRecentErrors(raw: unknown): RecentErrorEntry[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: RecentErrorEntry[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.concept_id !== 'string' || e.concept_id.length === 0) continue;
    if (typeof e.error_type !== 'string' || e.error_type.length === 0) continue;
    const out: RecentErrorEntry = {
      concept_id: e.concept_id.slice(0, 120),
      error_type: e.error_type.slice(0, 60),
    };
    if (typeof e.created_at === 'string') out.created_at = e.created_at;
    cleaned.push(out);
  }
  // Most-recent-first when timestamps are present on every entry.
  if (cleaned.length > 1 && cleaned.every((e) => typeof e.created_at === 'string')) {
    cleaned.sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string));
  }
  return cleaned.slice(0, MAX_RECENT_ERRORS);
}

/**
 * Sanitize a client-transmitted mastery map (topic or concept keyed).
 * Values clamped to [0, 1]; non-numeric entries dropped.
 */
export function sanitizeMasteryMap(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key !== 'string' || key.length === 0 || key.length > 120) continue;
    const n = typeof value === 'number' ? value : NaN;
    if (!Number.isFinite(n)) continue;
    out[key] = Math.max(0, Math.min(1, n));
  }
  return out;
}

/**
 * error_streak = consecutive most-recent misses on THIS concept.
 * The streak breaks at the first recent error on a different concept.
 * Empty signals ⇒ 0 (identical to the pre-realignment hardcoded value).
 */
export function computeErrorStreak(
  recentErrors: RecentErrorEntry[],
  concept_id: string,
): number {
  let streak = 0;
  for (const e of recentErrors) {
    if (e.concept_id !== concept_id) break;
    streak += 1;
  }
  return streak;
}
