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
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authFetch, getToken, clearToken } from '@/lib/auth/client';
import {
  Plus, Trash2, Loader2, CheckCircle2, ChevronLeft, Save,
  AlertCircle, Calendar,
} from 'lucide-react';

interface ExamRegistration {
  exam_id: string;
  exam_date: string;
  weekly_hours?: number;
  added_at: string;
}

interface KnownExam { id: string; label: string }

const MAX_EXAMS = 5;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface-fill)',
  border: 'var(--hairline) solid var(--separator)',
  fontSize: 'var(--text-caption)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
};

export default function ExamProfilePage() {
  const [exams, setExams] = useState<ExamRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [notAuthenticated, setNotAuthenticated] = useState(false);
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
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
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
  }, [exams, knownExams]);

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
      const now = Date.now();
      setSavedAt(now);
      setTimeout(() => setSavedAt(prev => prev === now ? null : prev), 2500);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [exams]);

  if (notAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, padding: '0 16px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 'var(--weight-medium)' }}>Session expired</p>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', maxWidth: 280 }}>
          Your session has expired or you're not signed in.
          Go back to the demo and select a role to continue.
        </p>
        <a
          href="/demo.html"
          style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: 'var(--green)', color: '#fff', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', textDecoration: 'none' }}
        >
          Back to demo sign-in
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 672, margin: '0 auto', padding: '32px 16px 80px' }}>
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <Link to="/planned" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)', textDecoration: 'none', marginBottom: 12 }}>
          <ChevronLeft size={14} />
          Back to Planner
        </Link>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Exam profile</h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          Register up to {MAX_EXAMS} exams you're preparing for concurrently. The planner
          allocates time across them weighted by how close each exam is.
        </p>
      </motion.header>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', padding: '48px 0', justifyContent: 'center' }}>
          <Loader2 size={16} className="animate-spin" />
          <span style={{ fontSize: 'var(--text-caption)' }}>Loading your profile…</span>
        </div>
      )}

      {!loading && (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {exams.length === 0 && (
            <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              No exams yet. Add your first one below.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {exams.map((exam, i) => (
              <div
                key={i}
                style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Exam</label>
                  <select
                    value={knownExams.some(k => k.id === exam.exam_id) ? exam.exam_id : '__custom'}
                    onChange={(e) => {
                      if (e.target.value === '__custom') {
                        updateExam(i, { exam_id: '' });
                      } else {
                        updateExam(i, { exam_id: e.target.value });
                      }
                    }}
                    style={inputStyle}
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
                      style={{ ...inputStyle, marginTop: 8, fontFamily: 'var(--font-mono)' }}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                      <Calendar size={12} style={{ display: 'inline', marginRight: 2, verticalAlign: 'middle' }} />
                      Date
                    </label>
                    <input
                      type="date"
                      value={exam.exam_date}
                      onChange={(e) => updateExam(i, { exam_date: e.target.value })}
                      style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <button
                    onClick={() => removeExam(i)}
                    style={{ flexShrink: 0, padding: 8, borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    title="Remove this exam"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addExam}
            disabled={exams.length >= MAX_EXAMS}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
              border: `${exams.length >= MAX_EXAMS ? 'var(--hairline)' : 'var(--hairline)'} dashed var(--separator)`,
              fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)',
              color: exams.length >= MAX_EXAMS ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              background: 'transparent',
              cursor: exams.length >= MAX_EXAMS ? 'not-allowed' : 'pointer',
            }}
          >
            <Plus size={16} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {exams.length >= MAX_EXAMS
              ? `Maximum of ${MAX_EXAMS} exams`
              : `Add exam (${exams.length}/${MAX_EXAMS})`
            }
          </button>

          {error && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', color: 'var(--red)', fontSize: 'var(--text-caption)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--green)', color: '#fff', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-body)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save profile
            </button>
            {savedAt && (
              <span style={{ fontSize: 11, color: 'var(--green-ink)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={14} />
                Saved
              </span>
            )}
          </div>
        </motion.section>
      )}
    </div>
  );
}
