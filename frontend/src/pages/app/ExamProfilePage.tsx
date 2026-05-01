/**
 * ExamProfilePage — manage the student's concurrent exams.
 *
 * Students register 1-5 exams they're preparing for, each with its
 * own date. PlannedSessionPage reads this profile at load time to
 * decide whether to call single-exam or multi-exam planner.
 *
 * Scope: v2.32 minimal — add/remove/edit exam rows, save as a whole.
 * A polished release would offer exam discovery (search by name),
 * topic confidence editing per exam, and weekly hours; those slot
 * in later without breaking the round-trip shape.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authFetch, getToken, clearToken } from '@/lib/auth/client';
import { fadeInUp } from '@/lib/animations';
import {
  Plus, Trash2, Loader2, CheckCircle2, ChevronLeft, Save,
  AlertCircle, Calendar,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ExamRegistration {
  exam_id: string;
  exam_date: string;
  weekly_hours?: number;
  added_at: string;
}

interface KnownExam { id: string; label: string }

const MAX_EXAMS = 5;

export default function ExamProfilePage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [notAuthenticated, setNotAuthenticated] = useState(false);
  // Known exams come from the backend — single source of truth is
  // data/curriculum/*.yml (loaded by exam-loader). Previously this was a
  // hardcoded array (UGEE / BITSAT / JEE Main) which never matched what
  // the deploy actually had loaded; users could pick exams that didn't
  // exist, then hit empty home pages.
  const [knownExams, setKnownExams] = useState<KnownExam[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/curriculum/exams')
      .then((r) => (r.ok ? r.json() : { exams: [] }))
      .then((data) => {
        if (cancelled) return;
        const opts: KnownExam[] = (data.exams ?? []).map((e: any) => ({
          id: e.id,
          label: e.name ?? e.id,
        }));
        setKnownExams(opts);
      })
      .catch(() => { /* graceful degradation — picker shows just custom */ });
    return () => { cancelled = true; };
  }, []);

  // Load existing profile on mount
  useEffect(() => {
    let cancelled = false;
    // No token at all → show not-authenticated state immediately
    if (!getToken()) {
      setNotAuthenticated(true);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await authFetch('/api/student/profile');
        if (cancelled) return;
        if (res.status === 401) {
          // Stale token (e.g. after demo:reset) — clear it and show friendly message
          clearToken();
          setNotAuthenticated(true);
          return;
        }
        if (res.ok) {
          const p = await res.json();
          setExams(p.exams || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addExam = useCallback(() => {
    if (exams.length >= MAX_EXAMS) return;
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    const defaultDate = d.toISOString().slice(0, 10);
    const unusedKnown = knownExams.find(e => !exams.some(x => x.exam_id === e.id));
    setExams(cur => [...cur, {
      exam_id: unusedKnown?.id ?? '',
      exam_date: defaultDate,
      added_at: new Date().toISOString(),
    }]);
  }, [exams]);

  const updateExam = useCallback((idx: number, patch: Partial<ExamRegistration>) => {
    setExams(cur => cur.map((e, i) => i === idx ? { ...e, ...patch } : e));
  }, []);

  const removeExam = useCallback((idx: number) => {
    setExams(cur => cur.filter((_, i) => i !== idx));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      // Validate before sending — surface problems inline
      for (const [i, e] of exams.entries()) {
        if (!e.exam_id?.trim()) throw new Error(`Row ${i + 1}: exam id is empty`);
        if (!e.exam_date || isNaN(new Date(e.exam_date).getTime())) {
          throw new Error(`Row ${i + 1}: exam date is invalid`);
        }
      }
      const res = await authFetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exams }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          clearToken();
          setNotAuthenticated(true);
          return;
        }
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || `Save failed: ${res.status}`);
      }
      setSavedAt(Date.now());
      // Auto-clear the "saved" indicator after a moment
      setTimeout(() => setSavedAt(prev => prev === Date.now() ? null : prev), 2500);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [exams]);

  if (notAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <p className="text-surface-300 font-medium">Session expired</p>
        <p className="text-sm text-surface-500 max-w-xs">
          Your session has expired or you're not signed in.
          Go back to the demo and select a role to continue.
        </p>
        <a
          href="/demo.html"
          className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors"
        >
          Back to demo sign-in
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        <motion.header variants={fadeInUp} initial="hidden" animate="visible" className="mb-8">
          <Link to="/planned" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-3">
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Planner
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Exam profile</h1>
          <p className="text-sm text-zinc-400">
            Register up to {MAX_EXAMS} exams you're preparing for concurrently. The planner
            allocates time across them weighted by how close each exam is.
          </p>
        </motion.header>

        {loading && (
          <div className="flex items-center gap-2 text-zinc-400 py-12 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading your profile…</span>
          </div>
        )}

        {!loading && (
          <motion.section variants={fadeInUp} initial="hidden" animate="visible">
            {exams.length === 0 && (
              <div className="mb-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 text-center">
                No exams yet. Add your first one below.
              </div>
            )}

            <div className="space-y-3 mb-4">
              {exams.map((exam, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                >
                  <div className="flex-1 min-w-0 w-full">
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Exam</label>
                    <select
                      value={knownExams.some(k => k.id === exam.exam_id) ? exam.exam_id : '__custom'}
                      onChange={(e) => {
                        if (e.target.value === '__custom') {
                          updateExam(i, { exam_id: '' });
                        } else {
                          updateExam(i, { exam_id: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-sm text-zinc-100"
                    >
                      {knownExams.map(k => (
                        <option key={k.id} value={k.id}>{k.label}</option>
                      ))}
                      <option value="__custom">Custom exam id…</option>
                    </select>
                    {!knownExams.some(k => k.id === exam.exam_id) && (
                      <input
                        type="text"
                        placeholder="EXM-..."
                        value={exam.exam_id}
                        onChange={(e) => updateExam(i, { exam_id: e.target.value })}
                        className="mt-2 w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-100"
                      />
                    )}
                  </div>
                  <div className="w-full sm:w-44 shrink-0">
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                      <Calendar className="inline w-3 h-3 mr-0.5 -mt-0.5" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={exam.exam_date}
                      onChange={(e) => updateExam(i, { exam_date: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono"
                    />
                  </div>
                  <button
                    onClick={() => removeExam(i)}
                    className="shrink-0 self-end sm:self-center p-2 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove this exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addExam}
              disabled={exams.length >= MAX_EXAMS}
              className={clsx(
                'w-full px-4 py-3 rounded-lg border border-dashed text-sm font-semibold transition-colors',
                exams.length >= MAX_EXAMS
                  ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'border-zinc-700 text-zinc-300 hover:border-violet-500/40 hover:text-violet-300'
              )}
            >
              <Plus className="w-4 h-4 inline mr-1" />
              {exams.length >= MAX_EXAMS
                ? `Maximum of ${MAX_EXAMS} exams`
                : `Add exam (${exams.length}/${MAX_EXAMS})`
              }
            </button>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-lg bg-violet-500 hover:bg-violet-400 text-zinc-950 font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save profile
              </button>
              {savedAt && (
                <span className="text-xs text-emerald-400 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
