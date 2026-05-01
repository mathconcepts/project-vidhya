/**
 * useActiveExam — single source of truth for the deployment's active exam.
 *
 * Backed by GET /api/exam/active. Cached in module scope so multiple
 * components mounting at the same time share one network call. Refreshes
 * are explicit via reloadActiveExam().
 *
 * Admins configure the active exam via the DEFAULT_EXAM_ID env var (declared
 * in render.yaml as sync:false). The endpoint falls back to the first
 * exam in data/curriculum/ when the env var is unset.
 *
 * Frontend never hardcodes 'gate-ma' or 'GATE Engineering Mathematics' —
 * every surface that needs exam context reads from this hook.
 */

import { useEffect, useState } from 'react';

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
  starter_prompts: Array<{ text: string; dot: string }>;
}

let _cache: ActiveExam | null = null;
let _inflight: Promise<ActiveExam | null> | null = null;

async function fetchActiveExam(): Promise<ActiveExam | null> {
  if (_cache) return _cache;
  if (_inflight) return _inflight;
  _inflight = fetch('/api/exam/active')
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
