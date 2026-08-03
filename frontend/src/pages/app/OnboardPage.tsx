/**
 * OnboardPage — Exam-aware onboarding wizard.
 * Steps: Exam Date → Weekly Hours → Topic Confidence
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { authFetch } from '@/lib/auth/client';
import { trackEvent } from '@/lib/analytics';
import { Calendar, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

interface ExamMeta {
  exam_id: string;
  exam_name: string;
  exam_short_name: string;
  topics: { id: string; name: string }[];
}

export default function OnboardPage() {
  const sessionId = useSession();
  const navigate = useNavigate();
  const checking = useAuthRedirect('/planned');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [examMeta, setExamMeta] = useState<ExamMeta | null>(null);
  const [loadingExam, setLoadingExam] = useState(true);
  const [examDate, setExamDate] = useState('');
  const [examLoadError, setExamLoadError] = useState(false);

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--green-ink)' }} />
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Loading your exam profile…</p>
      </div>
    );
  }

  if (examLoadError || !examMeta) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, padding: '0 16px', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,159,10,.06)', border: '1px solid rgba(255,159,10,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={20} style={{ color: 'var(--orange)' }} />
        </div>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Pick your exam first</h1>
          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)', maxWidth: 320, lineHeight: 'var(--leading-relaxed)' }}>
            We couldn't load your exam profile. Choose your exam so the topics, dates, and study plan
            calibrate to you — not to a generic placeholder.
          </p>
        </div>
        <button
          onClick={() => navigate('/exams')}
          style={{
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--green)',
            color: 'var(--text-on-accent)',
            fontSize: 'var(--text-body)',
            fontWeight: 'var(--weight-semibold)',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Pick exam <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  const daysToExam = examDate
    ? Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Calendar size={32} style={{ color: 'var(--green-ink)' }} />
          <h2 style={{ margin: 0, fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>When is your {examLabel} exam?</h2>
          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>Set your date and we'll build your plan</p>
        </div>

        <input
          type="date"
          value={examDate}
          onChange={e => setExamDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-card)',
            border: 'var(--hairline) solid var(--separator)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            fontSize: 18,
            fontFamily: 'var(--font-mono)',
            boxSizing: 'border-box',
          }}
        />

        {daysToExam !== null && (
          <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: daysToExam < 60 ? 'var(--orange)' : 'var(--green-ink)' }}>
            {daysToExam} days from now{daysToExam < 60 && ' — every day counts!'}
          </p>
        )}

        {error && <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--red)', textAlign: 'center' }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!examDate || saving}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 0',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--text-on-accent)',
            fontSize: 'var(--text-body)',
            border: 'none',
            cursor: examDate && !saving ? 'pointer' : 'not-allowed',
            background: examDate && !saving ? 'var(--green)' : 'var(--surface-fill)',
            opacity: examDate && !saving ? 1 : 0.6,
          }}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <><Check size={18} /> Build my plan <ChevronRight size={16} /></>
          )}
        </button>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', margin: 0 }}>
          You can adjust hours and topic confidence from your plan at any time
        </p>
      </div>
    </div>
  );
}
