/**
 * PlannedSessionPage — "what should I do in the next N minutes?"
 *
 * Flow:
 *   1. User picks minutes available (slider or preset buttons)
 *   2. Page POSTs to /api/student/session/plan with the budget
 *   3. Renders the plan header + ordered action cards
 *   4. User clicks an action → that action becomes active; the
 *      existing content resolver (see SmartPracticePage for the
 *      deeper flow) fetches content matching content_hint
 *   5. User marks each action done/skipped, records attempts/correct
 *   6. At the end, posts execution to /plans/:id/complete
 *
 * Scope: this page is the MINIMAL wrapper around the planner — it
 * does NOT re-implement the full practice flow. Users who click
 * "Start" on a practice action navigate to SmartPracticePage with
 * the topic + difficulty pre-selected via URL params. The page's
 * job is to CHOOSE and TRACK, not to render questions.
 *
 * v2.31 — ships alongside SmartPracticePage which remains the
 * free-form practice entry point. This page is for time-bounded,
 * planned sessions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authFetch } from '@/lib/auth/client';
import { DemoBanner } from '@/components/DemoBanner';
import { WelcomeBackCard } from '@/components/app/WelcomeBackCard';
import { NextBestActionCard } from '@/components/app/NextBestActionCard';
import { trackPageView, trackAction } from '@/lib/beacon';
import {
  Clock, BookOpen, Play, CheckCircle2, XCircle, Loader2,
  Sparkles, RefreshCw, AlertCircle, ChevronRight,
  Bookmark, Settings, Plus, Trash2, ChevronDown, ArrowRight,
} from 'lucide-react';
import { CompoundingCard } from '@/components/app/CompoundingCard';
import { DigestChip } from '@/components/app/DigestChip';
import { BridgeRecommendationsCard } from '@/components/app/BridgeRecommendationsCard';
import { ReviewQueueCard } from '@/components/app/ReviewQueueCard';
import { useSession } from '@/hooks/useSession';

// ============================================================================
// Types (mirroring src/session-planner/types.ts)
// ============================================================================

interface ContentHint {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  concept_id?: string;
}

type ActionKind = 'practice' | 'review' | 'spaced-review' | 'micro-mock';

interface ActionRecommendation {
  id: string;
  kind: ActionKind;
  title: string;
  rationale: string;
  estimated_minutes: number;
  content_hint: ContentHint;
  priority_score: number;
  exam_id: string;
}

interface SessionPlan {
  id: string;
  generated_at: string;
  budget: { minutes_available: number; context: 'nano' | 'short' | 'medium' | 'long' };
  strategy: { gbrain_bias: string; [k: string]: any };
  top_priorities: Array<{ topic: string; priority: number }>;
  actions: ActionRecommendation[];
  total_estimated_minutes: number;
  headline: string;
  execution?: {
    completed_at: string;
    actual_minutes_spent: number;
    actions_completed: Array<{
      action_id: string;
      completed: boolean;
      attempts?: number;
      correct?: number;
      actual_minutes?: number;
      note?: string;
    }>;
    session_note?: string;
  };
}

interface LocalOutcome {
  action_id: string;
  completed: boolean;
  attempts?: number;
  correct?: number;
  note?: string;
}

// ============================================================================
// Presets — what "I have X minutes" looks like
// ============================================================================

const PRESETS: Array<{ minutes: number; label: string; subtitle: string }> = [
  { minutes: 3,  label: '3 min',  subtitle: 'Bus stop' },
  { minutes: 8,  label: '8 min',  subtitle: 'Coffee break' },
  { minutes: 15, label: '15 min', subtitle: 'Short break' },
  { minutes: 30, label: '30 min', subtitle: 'Between classes' },
  { minutes: 60, label: '60 min', subtitle: 'Focused hour' },
];

// ============================================================================
// Action kind → UI meta
// ============================================================================

const KIND_META: Record<ActionKind, { icon: typeof Sparkles; label: string }> = {
  'practice':      { icon: BookOpen,    label: 'Practice' },
  'review':        { icon: RefreshCw,   label: 'Review' },
  'spaced-review': { icon: AlertCircle, label: 'Spaced review' },
  'micro-mock':    { icon: Sparkles,    label: 'Micro-mock' },
};

// ============================================================================
// Component
// ============================================================================

const DEFAULT_EXAM_ID = 'EXM-UGEE-MATH-SAMPLE';
const DEFAULT_EXAM_DATE = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
})();

interface ExamRegistration {
  exam_id: string;
  exam_date: string;
  weekly_hours?: number;
  added_at: string;
}
interface ExamProfile {
  student_id: string;
  exams: ExamRegistration[];
  updated_at: string;
}
interface PlanTemplate {
  id: string;
  name: string;
  minutes_available: number;
  exam_selection: 'all' | 'primary' | string[];
  use_count: number;
  last_used_at?: string;
}

export default function PlannedSessionPage() {
  const navigate = useNavigate();
  const sessionId = useSession();

  const [minutes, setMinutes] = useState<number>(15);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ExamProfile | null>(null);
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [trailingStats, setTrailingStats] = useState<{
    trailing_7d_minutes: number; trailing_7d_sessions: number;
  } | null>(null);
  const [presets, setPresets] = useState<Array<{
    slug: string; name: string; minutes_available: number;
    exam_selection: 'all' | 'primary' | string[]; description: string; adopted: boolean;
  }>>([]);

  const [outcomes, setOutcomes] = useState<Record<string, LocalOutcome>>({});
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [rationaleOpen, setRationaleOpen] = useState<Record<string, boolean>>({});
  const [sessionSummary, setSessionSummary] = useState<{
    doneCount: number;
    totalCount: number;
    elapsedMin: number;
    concepts: string[];
    totalAttempts: number;
    totalCorrect: number;
    tomorrowPriority?: string;
  } | null>(null);
  const [gbrainSummary, setGbrainSummary] = useState<any>(null);
  const [userMeta, setUserMeta] = useState<{ created_at?: string } | null>(null);

  useEffect(() => {
    trackPageView('/planned');
  }, []);

  useEffect(() => {
    if (completed) trackAction('session_complete', '/planned');
  }, [completed]);

  useEffect(() => {
    authFetch('/api/me/gbrain-summary')
      .then(r => (r.ok ? r.json() : null))
      .then(setGbrainSummary)
      .catch(() => { /* fail soft */ });
    authFetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data?.user) setUserMeta({ created_at: data.user.created_at });
      })
      .catch(() => { /* fail soft */ });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profResp, tplResp, trailingResp, presetsResp] = await Promise.all([
          authFetch('/api/student/profile'),
          authFetch('/api/student/session/templates'),
          authFetch('/api/student/session/trailing-stats'),
          authFetch('/api/student/session/templates/presets'),
        ]);
        if (cancelled) return;
        if (profResp.status === 401) {
          const { clearToken } = await import('@/lib/auth/client');
          clearToken();
          setError('session_expired');
          return;
        }
        let loadedProfile: ExamProfile | null = null;
        if (profResp.ok) {
          loadedProfile = await profResp.json();
          setProfile(loadedProfile);
        }
        let loadedTrailing: { trailing_7d_minutes: number; trailing_7d_sessions: number } | null = null;
        if (tplResp.ok) {
          const j = await tplResp.json();
          setTemplates(j.templates || []);
        }
        if (trailingResp.ok) {
          const j = await trailingResp.json();
          loadedTrailing = {
            trailing_7d_minutes: j.trailing_7d_minutes,
            trailing_7d_sessions: j.trailing_7d_sessions,
          };
          setTrailingStats(loadedTrailing);
        }
        if (presetsResp.ok) {
          const j = await presetsResp.json();
          setPresets(j.presets || []);
        }

        const isReturning = loadedProfile && loadedProfile.exams.length > 0
          && loadedTrailing && loadedTrailing.trailing_7d_sessions > 0;
        if (isReturning && !cancelled) {
          setLoading(true);
          try {
            const hasMultiple = loadedProfile!.exams.length >= 2;
            const e = loadedProfile!.exams[0];
            const res = await authFetch(
              hasMultiple ? '/api/student/session/plan/multi-exam' : '/api/student/session/plan',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                  hasMultiple
                    ? { minutes_available: 15, exams: loadedProfile!.exams.map(ex => ({ exam_id: ex.exam_id, exam_date: ex.exam_date })) }
                    : { exam_id: e.exam_id, exam_date: e.exam_date, minutes_available: 15 }
                ),
              }
            );
            if (res.ok && !cancelled) {
              const p: SessionPlan = await res.json();
              setPlan(p);
              setStartedAtMs(Date.now());
            }
          } catch { /* fall through — user sees picker */ }
          finally { if (!cancelled) setLoading(false); }
        }
      } catch {
        // Non-fatal — fall through to default exam
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    setOutcomes({});
    setCompleted(false);
    try {
      let res: Response;
      const hasMultiple = profile && profile.exams.length >= 2;
      const hasOne = profile && profile.exams.length === 1;
      if (hasMultiple) {
        res = await authFetch('/api/student/session/plan/multi-exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            minutes_available: minutes,
            exams: profile!.exams.map(e => ({
              exam_id: e.exam_id,
              exam_date: e.exam_date,
            })),
          }),
        });
      } else if (hasOne) {
        const e = profile!.exams[0];
        res = await authFetch('/api/student/session/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam_id: e.exam_id,
            exam_date: e.exam_date,
            minutes_available: minutes,
          }),
        });
      } else {
        res = await authFetch('/api/student/session/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam_id: DEFAULT_EXAM_ID,
            exam_date: DEFAULT_EXAM_DATE,
            minutes_available: minutes,
          }),
        });
      }
      if (res.status === 401) {
        setError('session_expired');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || `Plan request failed: ${res.status}`);
      }
      const p: SessionPlan = await res.json();
      setPlan(p);
      setStartedAtMs(Date.now());
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [minutes, profile]);

  const useTemplate = useCallback(async (tpl: PlanTemplate) => {
    setLoading(true);
    setError(null);
    setPlan(null);
    setOutcomes({});
    setCompleted(false);
    try {
      const res = await authFetch(
        `/api/student/session/templates/${tpl.id}/use`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || `Template recall failed: ${res.status}`);
      }
      const j = await res.json();
      setPlan(j.plan);
      setStartedAtMs(Date.now());
      setMinutes(tpl.minutes_available);
      setTemplates(cur => cur.map(t =>
        t.id === tpl.id ? { ...t, use_count: t.use_count + 1 } : t,
      ));
    } catch (err: any) {
      setError(err.message || 'Template recall failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTemplate = useCallback(async () => {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    try {
      const examSel: PlanTemplate['exam_selection'] =
        (profile && profile.exams.length >= 2) ? 'all' :
        (profile && profile.exams.length === 1) ? 'primary' : 'primary';
      const res = await authFetch('/api/student/session/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          minutes_available: minutes,
          exam_selection: examSel,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'save failed');
      const tpl: PlanTemplate = await res.json();
      setTemplates(cur => [tpl, ...cur]);
      setTemplateName('');
      setShowSaveTemplate(false);
    } catch (err: any) {
      setError(err.message || 'save failed');
    } finally {
      setSavingTemplate(false);
    }
  }, [templateName, minutes, profile]);

  const deleteTemplateFn = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/student/session/templates/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) setTemplates(cur => cur.filter(t => t.id !== id));
    } catch {
      // ignore — student can retry
    }
  }, []);

  const adoptPreset = useCallback(async (preset: typeof presets[number]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/student/session/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: preset.name,
          minutes_available: preset.minutes_available,
          exam_selection: preset.exam_selection,
          preset_slug: preset.slug,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Preset adoption failed');
      const tpl: PlanTemplate = await res.json();
      setTemplates(cur => [tpl, ...cur]);
      setPresets(cur => cur.map(p => p.slug === preset.slug ? { ...p, adopted: true } : p));
      await useTemplate(tpl);
    } catch (err: any) {
      setError(err.message || 'Preset adoption failed');
      setLoading(false);
    }
  }, [useTemplate]);

  const startAction = useCallback((action: ActionRecommendation) => {
    const params = new URLSearchParams({
      topic: action.content_hint.topic,
      difficulty: action.content_hint.difficulty,
      from_plan: plan?.id ?? '',
      action_id: action.id,
    });
    navigate(`/smart-practice?${params}`);
  }, [plan, navigate]);

  const markDone = useCallback((action_id: string, completed: boolean) => {
    setOutcomes((prev) => ({
      ...prev,
      [action_id]: { ...(prev[action_id] ?? { action_id }), action_id, completed },
    }));
  }, []);

  const setAttempts = useCallback((action_id: string, attempts: number, correct: number) => {
    setOutcomes((prev) => ({
      ...prev,
      [action_id]: {
        ...(prev[action_id] ?? { action_id, completed: true }),
        action_id,
        completed: true,
        attempts, correct,
      },
    }));
  }, []);

  const finishSession = useCallback(async () => {
    if (!plan || !startedAtMs) return;
    setSubmittingCompletion(true);
    setError(null);
    const elapsedMin = Math.max(1, Math.round((Date.now() - startedAtMs) / 60000));
    const payload = {
      actual_minutes_spent: elapsedMin,
      actions_completed: plan.actions.map(a => {
        const o = outcomes[a.id];
        return {
          action_id: a.id,
          completed: o?.completed ?? false,
          attempts: o?.attempts,
          correct: o?.correct,
          note: o?.note,
        };
      }),
    };
    try {
      const res = await authFetch(`/api/student/session/plans/${plan.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || `Completion failed: ${res.status}`);
      }
      const completedActions = plan.actions.filter(a => outcomes[a.id]?.completed === true);
      let totalAttempts = 0;
      let totalCorrect = 0;
      for (const a of plan.actions) {
        const o = outcomes[a.id];
        if (o?.attempts) totalAttempts += o.attempts;
        if (o?.correct) totalCorrect += o.correct;
      }
      setSessionSummary({
        doneCount: completedActions.length,
        totalCount: plan.actions.length,
        elapsedMin,
        concepts: Array.from(new Set(completedActions.map(a => a.title))),
        totalAttempts,
        totalCorrect,
        tomorrowPriority: plan.top_priorities?.[0]?.topic,
      });
      setCompleted(true);
    } catch (err: any) {
      setError(err.message || 'Completion failed');
    } finally {
      setSubmittingCompletion(false);
    }
  }, [plan, startedAtMs, outcomes]);

  // ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <DemoBanner />

      {/* Wave 7: NextBestActionCard is the dominant top-of-page surface */}
      <NextBestActionCard />

      {/* P5: WelcomeBackCard self-gates on lapse + account-age */}
      <WelcomeBackCard summary={gbrainSummary} user={userMeta} />

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Today's plan</h1>
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              Tell us how long you have. We'll give you the three things that move
              your score most — in order. Show up, follow it, get better.
            </p>
          </div>
          <Link
            to="/exam-profile"
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-fill)',
              border: 'var(--hairline) solid var(--separator)',
              fontSize: 'var(--text-caption)',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
            title="Register the exams you're preparing for"
          >
            <Settings size={14} />
            Exam profile
            {profile && (
              <span style={{ marginLeft: 4, padding: '1px 6px', borderRadius: 4, background: 'var(--surface-canvas)', color: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                {profile.exams.length}
              </span>
            )}
          </Link>
        </div>

        {trailingStats && trailingStats.trailing_7d_minutes > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.2)', fontSize: 'var(--text-caption)', color: 'var(--green-ink)' }}>
            <Clock size={12} />
            You've studied{' '}
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{trailingStats.trailing_7d_minutes}</strong> min{' '}
            across{' '}
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{trailingStats.trailing_7d_sessions}</strong>{' '}
            session{trailingStats.trailing_7d_sessions === 1 ? '' : 's'} this week.
          </div>
        )}

        {profile && profile.exams.length === 0 && (
          <div style={{ marginTop: 12, fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.18)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>
              Using a default exam.{' '}
              <Link to="/exam-profile" style={{ color: 'inherit', textDecoration: 'underline' }}>Set up your exam profile</Link>{' '}
              for plans tuned to your dates.
            </div>
            <div style={{ opacity: 0.7 }}>
              Or{' '}
              <Link to="/knowledge" style={{ color: 'inherit', textDecoration: 'underline' }}>tell us your school curriculum</Link>{' '}
              and we'll suggest the right exams.
            </div>
          </div>
        )}

        {profile && profile.exams.length >= 2 && (
          <div style={{ marginTop: 12, fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)', opacity: 0.8 }}>
            Multi-exam mode — planning across your {profile.exams.length} registered exams, weighted by proximity.
          </div>
        )}
      </div>

      {/* Template bar — saved recurring patterns, one-tap recall */}
      {!plan && !loading && templates.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
              <Bookmark size={12} /> Your templates
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>tap to recall</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {templates.map((tpl) => (
              <div key={tpl.id} style={{ display: 'flex', alignItems: 'stretch', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <button
                  onClick={() => useTemplate(tpl)}
                  style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', flex: 1 }}
                >
                  <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{tpl.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {tpl.minutes_available}min · {
                      tpl.exam_selection === 'all' ? 'all exams' :
                      tpl.exam_selection === 'primary' ? 'primary' :
                      Array.isArray(tpl.exam_selection) ? `${tpl.exam_selection.length} exam${tpl.exam_selection.length === 1 ? '' : 's'}` :
                      ''
                    }{tpl.use_count > 0 ? ` · used ${tpl.use_count}×` : ''}
                  </div>
                </button>
                <button
                  onClick={() => deleteTemplateFn(tpl.id)}
                  style={{ padding: '0 8px', borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Delete template"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset suggestions — curated starter templates */}
      {!plan && !loading && presets.filter(p => !p.adopted).length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
              <Sparkles size={12} /> {templates.length === 0 ? 'Try a starter template' : 'More presets'}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>tap to adopt + run</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {presets.filter(p => !p.adopted).slice(0, 6).map((preset) => (
              <button
                key={preset.slug}
                onClick={() => adoptPreset(preset)}
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-fill)',
                  border: 'var(--hairline) solid var(--separator)',
                  textAlign: 'left',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{preset.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {preset.minutes_available}min · {preset.exam_selection === 'all' ? 'all exams' : 'primary'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.3 }}>{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Minutes picker — hidden once a plan is loaded */}
      {!plan && !loading && (
        <div>
          <span style={{ display: 'block', fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 12 }}>
            How many minutes do you have?
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8, marginBottom: 16 }}>
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => setMinutes(p.minutes)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: minutes === p.minutes ? '1px solid rgba(88,86,214,.4)' : 'var(--hairline) solid var(--separator)',
                  background: minutes === p.minutes ? 'rgba(88,86,214,.08)' : 'var(--surface-fill)',
                  color: minutes === p.minutes ? 'var(--indigo-ink)' : 'var(--text-secondary)',
                }}
              >
                <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} />{p.label}
                </div>
                <div style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', marginTop: 2 }}>{p.subtitle}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <input
              type="range"
              min={1}
              max={120}
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
              style={{ flex: 1, accentColor: 'var(--indigo)' }}
            />
            <span style={{ fontSize: 'var(--text-caption)', fontFamily: 'var(--font-mono)', width: 80, textAlign: 'right', color: 'var(--text-primary)' }}>{minutes} min</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={fetchPlan}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--indigo)',
                color: '#fff',
                fontWeight: 'var(--weight-semibold)',
                fontSize: 'var(--text-body)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Planning…' : 'Generate my plan'}
            </button>
            <button
              onClick={() => setShowSaveTemplate(v => !v)}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-fill)',
                border: 'var(--hairline) solid var(--separator)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Save these settings as a template"
            >
              <Bookmark size={16} />
            </button>
          </div>

          {/* Save-as-template inline form */}
          {showSaveTemplate && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.18)' }}>
              <span style={{ display: 'block', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Name this template ({minutes} min
                {profile && profile.exams.length >= 2 ? ', all exams' :
                 profile && profile.exams.length === 1 ? ', primary exam' : ''})
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  autoFocus
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Morning commute"
                  maxLength={60}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-primary)', fontSize: 'var(--text-caption)' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTemplate(); }}
                />
                <button
                  onClick={saveTemplate}
                  disabled={!templateName.trim() || savingTemplate}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--indigo)',
                    color: '#fff',
                    fontSize: 'var(--text-caption)',
                    fontWeight: 'var(--weight-semibold)',
                    border: 'none',
                    cursor: (!templateName.trim() || savingTemplate) ? 'not-allowed' : 'pointer',
                    opacity: (!templateName.trim() || savingTemplate) ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {savingTemplate ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--indigo-ink)', padding: '48px 0' }}>
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontSize: 'var(--text-caption)' }}>Planning your {minutes}-minute session…</span>
        </div>
      )}

      {/* Error states */}
      {error === 'session_expired' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '64px 0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Sign in again to continue</p>
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', maxWidth: 320 }}>
            Your sign-in expired. Pick a demo role to start a new session.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/demo.html" style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--green)', color: '#fff', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', textDecoration: 'none' }}>
              Demo sign-in
            </a>
            <a href="/sign-in" style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', fontSize: 'var(--text-caption)', textDecoration: 'none' }}>
              Real sign-in
            </a>
          </div>
        </div>
      ) : error && (
        <div style={{ padding: 16, borderRadius: 'var(--radius-sm)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <XCircle size={16} style={{ marginTop: 2, flexShrink: 0, color: 'var(--red)' }} />
            <div>
              <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--red)' }}>Couldn't generate the plan</div>
              <div style={{ marginTop: 4, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Plan view */}
      {plan && !completed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CompoundingCard sessionId={sessionId} />
          <DigestChip sessionId={sessionId} />
          <BridgeRecommendationsCard />
          <ReviewQueueCard />

          {/* Plan headline */}
          <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: '1px solid rgba(88,86,214,.18)', boxShadow: 'var(--shadow-raise)' }}>
            <div style={{ fontSize: 'var(--text-caption2)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--indigo-ink)', opacity: 0.8, marginBottom: 4 }}>Your plan</div>
            <div style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 8 }}>{plan.headline}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span>{plan.budget.context} session</span>
              <span>·</span>
              <span>{plan.total_estimated_minutes} min total</span>
              <Link
                to="/exam-strategy"
                style={{ marginLeft: 'auto', color: 'var(--indigo-ink)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 'var(--text-caption)' }}
              >
                See your full strategy <ChevronRight size={12} />
              </Link>
            </div>
            <button
              onClick={() => { setPlan(null); setOutcomes({}); setStartedAtMs(null); }}
              style={{ marginTop: 8, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Change time
            </button>
          </div>

          {/* Compounding progress ribbon */}
          {plan.actions.length > 0 && (() => {
            const doneCount = plan.actions.filter(a => outcomes[a.id]?.completed === true).length;
            const total = plan.actions.length;
            const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(52,199,89,.05)', border: '1px solid rgba(52,199,89,.2)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--green-ink)', fontWeight: 'var(--weight-medium)' }}>
                    {doneCount === 0
                      ? `${total} action${total === 1 ? '' : 's'} ahead — start with #1.`
                      : doneCount === total
                      ? `All done. ${total} actions complete today.`
                      : `${doneCount} of ${total} done. ${total - doneCount} to go.`}
                  </div>
                  <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'var(--surface-fill)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--green)', transition: 'width 0.5s', width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Action cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(() => {
              const firstPendingIdx = plan.actions.findIndex(a => outcomes[a.id]?.completed === undefined || outcomes[a.id]?.completed === null);
              return plan.actions.map((action, i) => {
                const meta = KIND_META[action.kind];
                const Icon = meta.icon;
                const outcome = outcomes[action.id];
                const doneState =
                  outcome?.completed === true ? 'done' :
                  outcome?.completed === false ? 'skipped' :
                  'pending';
                const isNext = i === firstPendingIdx;

                const actionCardStyle: React.CSSProperties =
                  doneState === 'done'
                    ? { padding: 16, borderRadius: 'var(--radius-sm)', background: 'rgba(52,199,89,.05)', border: '1px solid rgba(52,199,89,.22)' }
                  : doneState === 'skipped'
                    ? { padding: 16, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', opacity: 0.5 }
                  : isNext
                    ? { padding: 16, borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.25)' }
                  : { padding: 16, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' };

                return (
                  <div key={action.id} style={actionCardStyle}>
                    {isNext && (
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--indigo-ink)', marginBottom: 8 }}>
                        Next →
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', width: 24, paddingTop: 4, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-fill)', color: 'var(--text-secondary)' }}>
                            <Icon size={12} />
                            {meta.label}
                          </span>
                          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>~{action.estimated_minutes} min</span>
                        </div>
                        <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 4 }}>{action.title}</div>
                        {action.rationale && (
                          <div>
                            <button
                              onClick={() => setRationaleOpen(prev => ({ ...prev, [action.id]: !prev[action.id] }))}
                              style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 2, marginBottom: 4 }}
                            >
                              Why this order
                              <ChevronDown size={12} style={{ transform: rationaleOpen[action.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                            </button>
                            {rationaleOpen[action.id] && (
                              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 4 }}>{action.rationale}</div>
                            )}
                          </div>
                        )}

                        {/* Controls */}
                        {doneState === 'pending' && (
                          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => startAction(action)}
                              style={{ padding: '6px 12px', minHeight: 44, borderRadius: 'var(--radius-sm)', background: 'var(--indigo)', color: '#fff', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Play size={12} /> Start <ChevronRight size={12} />
                            </button>
                            <button
                              onClick={() => markDone(action.id, true)}
                              style={{ padding: '6px 12px', minHeight: 44, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', fontSize: 'var(--text-caption)', cursor: 'pointer' }}
                            >
                              Mark done
                            </button>
                            <button
                              onClick={() => markDone(action.id, false)}
                              style={{ padding: '6px 12px', minHeight: 44, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)', cursor: 'pointer' }}
                            >
                              Skip
                            </button>
                          </div>
                        )}

                        {doneState === 'done' && (
                          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-caption)', color: 'var(--green-ink)' }}>
                              <CheckCircle2 size={14} />
                              <span>Marked done</span>
                            </div>
                            {(action.kind === 'practice' || action.kind === 'micro-mock' || action.kind === 'spaced-review') && (
                              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 'var(--text-caption)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ color: 'var(--text-tertiary)' }}>Attempts:</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <button onClick={() => setAttempts(action.id, Math.max(0, (outcome?.attempts ?? 0) - 1), outcome?.correct ?? 0)} style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                    <span style={{ width: 32, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{outcome?.attempts ?? 0}</span>
                                    <button onClick={() => setAttempts(action.id, (outcome?.attempts ?? 0) + 1, outcome?.correct ?? 0)} style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ color: 'var(--text-tertiary)' }}>Correct:</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <button onClick={() => setAttempts(action.id, outcome?.attempts ?? 0, Math.max(0, (outcome?.correct ?? 0) - 1))} style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                    <span style={{ width: 32, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{outcome?.correct ?? 0}</span>
                                    <button onClick={() => setAttempts(action.id, outcome?.attempts ?? 0, Math.min(outcome?.attempts ?? action.content_hint.count, (outcome?.correct ?? 0) + 1))} style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {doneState === 'skipped' && (
                          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
                            <XCircle size={14} />
                            <span>Skipped</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Finish row */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={finishSession}
              disabled={submittingCompletion}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--green)',
                color: '#fff',
                fontWeight: 'var(--weight-semibold)',
                fontSize: 'var(--text-body)',
                border: 'none',
                cursor: submittingCompletion ? 'not-allowed' : 'pointer',
                opacity: submittingCompletion ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {submittingCompletion ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Finish & log this session
            </button>
            <button
              onClick={() => { setPlan(null); setOutcomes({}); setStartedAtMs(null); }}
              style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Wave U1: static end-of-session screen.
          Every number here is read from `sessionSummary`, snapshotted at the
          instant the server confirmed completion. Nothing on this screen is
          fabricated — "marks saved" is intentionally omitted (no per-session
          baseline to diff against). */}
      {completed && plan && (
        <div style={{ padding: '40px 0' }}>
          <div style={{ maxWidth: 448, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <CheckCircle2 size={20} style={{ color: 'var(--green-ink)' }} />
              <h2 style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Session complete</h2>
            </div>
            <p style={{ margin: '0 0 24px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              {(sessionSummary?.doneCount ?? 0)} of {(sessionSummary?.totalCount ?? plan.actions.length)} blocks done · {(sessionSummary?.elapsedMin ?? 0)} min
              {sessionSummary && sessionSummary.totalAttempts > 0 && (
                <> · {sessionSummary.totalCorrect}/{sessionSummary.totalAttempts} correct (self-logged)</>
              )}
            </p>

            {sessionSummary && sessionSummary.concepts.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  What firmed up
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sessionSummary.concepts.map((c, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-caption)', color: 'var(--text-primary)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sessionSummary?.tomorrowPriority && (
              <p style={{ margin: '0 0 24px', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
                Next up: <span style={{ color: 'var(--text-secondary)' }}>{sessionSummary.tomorrowPriority}</span>
              </p>
            )}

            <Link
              to="/"
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--indigo)',
                color: '#fff',
                fontSize: 'var(--text-caption)',
                fontWeight: 'var(--weight-semibold)',
                textDecoration: 'none',
              }}
            >
              Back to Home <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
