/**
 * useActiveExam — single source of truth for the deployment's active exam.
 *
 * Backed by GET /api/exam/active. Cached in module scope so multiple
 * components mounting at the same time share one network call. Refreshes
 * are explicit via reloadActiveExam().
 *
 * Resolution, widest-wins-last: the deployment default comes from the
 * DEFAULT_EXAM_ID env var (declared in render.yaml as sync:false), falling
 * back to the first exam in data/curriculum/ when unset — and THAT is
 * overridden per viewer by their own stored choice (v4.86.0), which rides
 * along as ?exam_id= and is validated server-side against the loaded packs.
 * Before that override the active exam was deployment-wide, so a build
 * carrying two curriculum packs could still only ever show one of them.
 *
 * Frontend never hardcodes 'gate-ma' or 'GATE Engineering Mathematics' —
 * every surface that needs exam context reads from this hook.
 */

import { useEffect, useState } from 'react';
import { getExamChoice, storeExamChoice, withExamChoice } from '@/lib/exam-choice';

export interface ActiveExam {
  exam_id: string;
  name: string;
  description?: string;
  conducting_body?: string;
  scope?: string;
  total_marks?: number;
  duration_minutes?: number;
  concept_count: number;
  section_count: number;
  loaded_count: number;
  all_exam_ids: string[];
  /** Every loaded pack as {id, name} — enough to render a switcher. */
  available_exams?: Array<{ id: string; name: string }>;
  /** The deployment default, so a switcher can mark it and reset to it. */
  default_exam_id?: string | null;
  starter_prompts: Array<{ text: string; dot: string }>;
}

let _cache: ActiveExam | null = null;
let _inflight: Promise<ActiveExam | null> | null = null;

async function fetchActiveExam(): Promise<ActiveExam | null> {
  if (_cache) return _cache;
  if (_inflight) return _inflight;
  // withExamChoice(), not a bare path: this hook uses raw fetch rather than
  // apiFetch, so it would otherwise be the ONE surface that ignored the
  // viewer's choice — and it is the surface that names the exam everywhere.
  _inflight = fetch(withExamChoice('/api/exam/active'))
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      _cache = data;
      return data;
    })
    .catch(() => null)
    .finally(() => {
      _inflight = null;
    });
  return _inflight;
}

export function reloadActiveExam(): void {
  _cache = null;
  _inflight = null;
}

/**
 * Switch the exam this viewer is looking at.
 *
 * Persists the choice, then reloads the page. The reload is deliberate, not
 * laziness: the exam is baked into module-scope caches all over the app —
 * this hook's own `_cache`, topic lists held in page state, the concept
 * spine — and invalidating each by hand would leave whichever one gets
 * added next silently stale. A switch is rare and explicit, so paying one
 * full reload buys a guarantee that nothing from the previous exam
 * survives. Passing `null` returns to the deployment default.
 */
export function setActiveExam(examId: string | null): void {
  storeExamChoice(examId);
  reloadActiveExam();
  if (typeof window !== 'undefined') window.location.reload();
}

/** The viewer's stored choice, or null when following the deployment default. */
export function activeExamChoice(): string | null {
  return getExamChoice();
}

export function useActiveExam(): {
  exam: ActiveExam | null;
  loading: boolean;
  error: boolean;
} {
  const [exam, setExam] = useState<ActiveExam | null>(_cache);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (_cache) {
      setExam(_cache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchActiveExam().then((data) => {
      if (cancelled) return;
      if (data) {
        setExam(data);
        setError(false);
      } else {
        setError(true);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { exam, loading, error };
}
