/**
 * OnboardPage — Exam-aware onboarding wizard.
 * Steps: Exam Date → Weekly Hours → Topic Confidence
 *
 * Reads the student's exam from their JWT profile so all text and
 * topic lists are tailored to their actual exam (BITSAT, NEET, GATE, etc.).
 * Saves to the flat-file profile store via POST /api/onboard (no Postgres).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { authFetch } from '@/lib/auth/client';
import { trackEvent } from '@/lib/analytics';
import { Calendar, ChevronRight, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

// v2.5: removed the algebra/calculus/geometry FALLBACK_TOPICS list.
// When the exam adapter API fails, we now show an explicit error state with
// a "Pick your exam" CTA rather than fabricating fake topics that don't match
// any real exam. Showing wrong topics is worse than showing a loading skeleton.

interface ExamMeta {
  exam_id: string;
  exam_name: string;
  exam_short_name: string;
  topics: { id: string; name: string }[];
}

export default function OnboardPage() {
  const sessionId = useSession();
  const navigate = useNavigate();
  const checking = useAuthRedirect('/planned'); // redirect if already onboarded
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [examMeta, setExamMeta] = useState<ExamMeta | null>(null);
  const [loadingExam, setLoadingExam] = useState(true);

  // Form state — only exam date required; everything else defaults
  const [examDate, setExamDate] = useState('');

  const [examLoadError, setExamLoadError] = useState(false);

  // Load exam metadata to get exam_id and name.
  useEffect(() => {
    authFetch('/api/onboard/meta')
      .then(r => r.json())
      .then((data: ExamMeta) => {
        if (!data?.exam_id) { setExamLoadError(true); return; }
        setExamMeta(data);
      })
      .catch(() => setExamLoadError(true))
      .finally(() => setLoadingExam(false));
  }, []);

  const examLabel = examMeta?.exam_short_name ?? examMeta?.exam_name ?? 'Exam';

  const handleSubmit = async () => {
    if (!examDate) return;
    setSaving(true);
    setError('');
    try {
      const defaultConfidence = Object.fromEntries(
        (examMeta?.topics ?? []).map(t => [t.id, 3])
      );
      const res = await authFetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          exam_id: examMeta?.exam_id,
          exam_date: examDate,
          weekly_hours: 10,
          topic_confidence: defaultConfidence,
        }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      trackEvent('onboard_complete', { exam_id: examMeta?.exam_id });
      navigate('/planned');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loadingExam || checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
        <p className="text-xs text-surface-500 font-display">Loading your exam profile…</p>
      </div>
    );
  }

  // v2.5: explicit error state when the exam adapter API fails or returns
  // empty topics. Replaces the prior algebra/calculus/geometry fake-fallback.
  if (examLoadError || !examMeta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <Calendar size={20} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-surface-100">Pick your exam first</h1>
          <p className="text-sm text-surface-400 mt-2 max-w-sm">
            We couldn't load your exam profile. Choose your exam so the topics, dates, and study plan
            calibrate to you — not to a generic placeholder.
          </p>
        </div>
        <button
          onClick={() => navigate('/exams')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-violet-500 text-white text-sm font-bold inline-flex items-center gap-1.5"
        >
          Pick exam <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Calendar size={32} className="text-emerald-400 mx-auto" />
          <h2 className="text-xl font-display font-bold text-surface-100">When is your {examLabel} exam?</h2>
          <p className="text-sm text-surface-400">Set your date and we'll build your plan</p>
        </div>

        <input
          type="date"
          value={examDate}
          onChange={e => setExamDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 focus:border-emerald-500 focus:outline-none text-center text-lg font-mono"
        />

        {examDate && (() => {
          const days = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);
          return (
            <p className={clsx(
              'text-center text-sm font-medium',
              days < 60 ? 'text-amber-400' : 'text-emerald-400'
            )}>
              {days} days from now{days < 60 && ' — every day counts!'}
            </p>
          );
        })()}

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!examDate || saving}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all',
            examDate && !saving
              ? 'bg-gradient-to-r from-emerald-500 to-violet-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
              : 'bg-surface-700 text-surface-500 cursor-not-allowed'
          )}
        >
          {saving ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <><Check size={18} /> Build my plan <ChevronRight size={16} /></>
          )}
        </button>

        <p className="text-center text-xs text-surface-600">
          You can adjust hours and topic confidence from your plan at any time
        </p>
      </div>
    </div>
  );
}
