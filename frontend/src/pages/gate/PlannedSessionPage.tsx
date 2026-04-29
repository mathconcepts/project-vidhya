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
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import { DemoBanner } from '@/components/DemoBanner';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import {
  Clock, BookOpen, Play, CheckCircle2, XCircle, Loader2,
  Sparkles, RefreshCw, AlertCircle, ChevronRight,
  Bookmark, Settings, Plus, Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';

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

const KIND_META: Record<ActionKind, { icon: typeof Sparkles; color: string; label: string }> = {
  'practice':      { icon: BookOpen, color: 'text-sky-400 bg-sky-500/10 border-sky-500/25', label: 'Practice' },
  'review':        { icon: RefreshCw, color: 'text-purple-400 bg-purple-500/10 border-purple-500/25', label: 'Review' },
  'spaced-review': { icon: AlertCircle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/25', label: 'Spaced review' },
  'micro-mock':    { icon: Sparkles, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', label: 'Micro-mock' },
};

// ============================================================================
// Component
// ============================================================================

// Default exam — the sample UGEE is always available. A more polished
// UX would let the student pick from their registered exams; this is
// the v2.31 MVP.
const DEFAULT_EXAM_ID = 'EXM-UGEE-MATH-SAMPLE';
// Default exam date — roughly 3 months out. Real deployments pull
// this from the student's profile.
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

  const [minutes, setMinutes] = useState<number>(8);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // v2.32: profile + templates
  const [profile, setProfile] = useState<ExamProfile | null>(null);
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // v2.33: trailing stats + preset catalog
  const [trailingStats, setTrailingStats] = useState<{
    trailing_7d_minutes: number; trailing_7d_sessions: number;
  } | null>(null);
  const [presets, setPresets] = useState<Array<{
    slug: string; name: string; minutes_available: number;
    exam_selection: 'all' | 'primary' | string[]; description: string; adopted: boolean;
  }>>([]);

  // Session tracking — local-only outcomes that get posted together
  // at completion. Until the user hits "Finish", this state is
  // ephemeral.
  const [outcomes, setOutcomes] = useState<Record<string, LocalOutcome>>({});
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Load profile + templates + trailing stats + presets on mount
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
        // 401 means stale/missing JWT — clear it and show session-expired state
        if (profResp.status === 401) {
          const { clearToken } = await import('@/lib/auth/client');
          clearToken();
          setError('session_expired');
          return;
        }
        if (profResp.ok) setProfile(await profResp.json());
        if (tplResp.ok) {
          const j = await tplResp.json();
          setTemplates(j.templates || []);
        }
        if (trailingResp.ok) {
          const j = await trailingResp.json();
          setTrailingStats({
            trailing_7d_minutes: j.trailing_7d_minutes,
            trailing_7d_sessions: j.trailing_7d_sessions,
          });
        }
        if (presetsResp.ok) {
          const j = await presetsResp.json();
          setPresets(j.presets || []);
        }
      } catch {
        // Non-fatal — fall through to default exam
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
        // Multi-exam plan when student has ≥2 exams registered
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
        // No profile yet — use defaults (student can set this up later)
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

  // Recall a saved template
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
      // Optimistic: nudge the use_count so templates reorder. Real
      // value re-syncs on next page load.
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

  /**
   * Adopt a preset — POST a real template carrying the preset's slug,
   * then immediately recall it to generate a plan. The saved template
   * stays for future one-tap use.
   */
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
      // Immediately recall so the student sees a plan
      await useTemplate(tpl);
    } catch (err: any) {
      setError(err.message || 'Preset adoption failed');
      setLoading(false);
    }
  }, [useTemplate]);

  const startAction = useCallback((action: ActionRecommendation) => {
    // Route the user into the existing practice flow with the topic +
    // difficulty pre-selected via query string. The SmartPracticePage
    // already handles this signal format.
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
      setCompleted(true);
    } catch (err: any) {
      setError(err.message || 'Completion failed');
    } finally {
      setSubmittingCompletion(false);
    }
  }, [plan, startedAtMs, outcomes]);

  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      <DemoBanner />
      <div className="max-w-3xl mx-auto px-4 pt-8">

        <motion.header variants={fadeInUp} initial="hidden" animate="visible" className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-1">Plan my session</h1>
              <p className="text-sm text-zinc-400">
                Tell us how much time you have — we'll give you concrete actions
                that fit, prioritized by what'll move your score most.
              </p>
            </div>
            <Link
              to="/exam-profile"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
              title="Register the exams you're preparing for"
            >
              <Settings className="w-3.5 h-3.5" />
              Exam profile
              {profile && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                  {profile.exams.length}
                </span>
              )}
            </Link>
          </div>
          {trailingStats && trailingStats.trailing_7d_minutes > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <Clock className="w-3 h-3" />
              You've studied <strong className="text-emerald-100 font-mono">{trailingStats.trailing_7d_minutes}</strong> min
              {' '}across <strong className="text-emerald-100 font-mono">{trailingStats.trailing_7d_sessions}</strong> session{trailingStats.trailing_7d_sessions === 1 ? '' : 's'} this week.
            </div>
          )}
          {profile && profile.exams.length === 0 && (
            <div className="mt-3 text-xs text-amber-300/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 space-y-1">
              <div>
                Using a default exam. <Link to="/exam-profile" className="underline">Set up your exam profile</Link> for plans tuned to your dates.
              </div>
              <div className="text-amber-200/60">
                Or <Link to="/knowledge" className="underline">tell us your school curriculum</Link> and we'll suggest the right exams.
              </div>
            </div>
          )}
          {profile && profile.exams.length >= 2 && (
            <div className="mt-3 text-xs text-sky-300/80">
              Multi-exam mode — planning across your {profile.exams.length} registered exams, weighted by proximity.
            </div>
          )}
        </motion.header>

        {/* Template bar — saved recurring patterns, one-tap recall */}
        {!plan && !loading && templates.length > 0 && (
          <motion.section
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Bookmark className="inline w-3 h-3 mr-1 -mt-0.5" />
                Your templates
              </label>
              <span className="text-[10px] text-zinc-600">tap to recall</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {templates.map((tpl) => (
                <div key={tpl.id} className="group flex items-stretch bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-purple-500/30 transition-colors">
                  <button
                    onClick={() => useTemplate(tpl)}
                    className="px-3 py-2 text-left hover:bg-purple-500/5 transition-colors"
                  >
                    <div className="text-sm font-semibold text-zinc-100">{tpl.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
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
                    className="px-2 border-l border-zinc-800 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 text-zinc-600 transition-all"
                    title="Delete template"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Preset suggestions — curated starter templates (v2.33) */}
        {!plan && !loading && presets.filter(p => !p.adopted).length > 0 && (
          <motion.section
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Sparkles className="inline w-3 h-3 mr-1 -mt-0.5" />
                {templates.length === 0 ? 'Try a starter template' : 'More presets'}
              </label>
              <span className="text-[10px] text-zinc-600">tap to adopt + run</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.filter(p => !p.adopted).slice(0, 6).map((preset) => (
                <button
                  key={preset.slug}
                  onClick={() => adoptPreset(preset)}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg bg-zinc-900/40 border border-dashed border-zinc-700 hover:border-sky-500/40 hover:bg-sky-500/5 text-left transition-colors disabled:opacity-50"
                >
                  <div className="text-sm font-semibold text-zinc-100">{preset.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {preset.minutes_available}min · {
                      preset.exam_selection === 'all' ? 'all exams' : 'primary'
                    }
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-1 leading-tight">{preset.description}</div>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Minutes picker — hidden once a plan is loaded, shown on reset */}
        {!plan && !loading && (
          <motion.section
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              How many minutes do you have?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
              {PRESETS.map((p) => (
                <button
                  key={p.minutes}
                  onClick={() => setMinutes(p.minutes)}
                  className={clsx(
                    'px-4 py-3 rounded-lg border text-left transition-colors',
                    minutes === p.minutes
                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-100'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700',
                  )}
                >
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {p.label}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">{p.subtitle}</div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mb-6">
              <input
                type="range"
                min={1}
                max={120}
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
                className="flex-1 accent-sky-500"
              />
              <span className="text-sm font-mono w-20 text-right">{minutes} min</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchPlan}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Planning…' : 'Generate my plan'}
              </button>
              <button
                onClick={() => setShowSaveTemplate(v => !v)}
                className="px-4 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm transition-colors"
                title="Save these settings as a template"
              >
                <Bookmark className="w-4 h-4 inline" />
              </button>
            </div>

            {/* Save-as-template inline form */}
            {showSaveTemplate && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="mt-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20"
              >
                <label className="block text-xs text-zinc-400 mb-2">
                  Name this template ({minutes} min
                  {profile && profile.exams.length >= 2 ? ', all exams' :
                   profile && profile.exams.length === 1 ? ', primary exam' : ''})
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Morning commute"
                    maxLength={60}
                    className="flex-1 px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter') saveTemplate(); }}
                  />
                  <button
                    onClick={saveTemplate}
                    disabled={!templateName.trim() || savingTemplate}
                    className="px-3 py-2 rounded bg-purple-500 hover:bg-purple-400 text-zinc-950 text-sm font-semibold disabled:opacity-50"
                  >
                    {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.section>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sky-400 py-12">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Planning your {minutes}-minute session…</span>
          </div>
        )}

        {error === 'session_expired' ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-surface-300 font-medium">Session expired</p>
            <p className="text-sm text-surface-500 max-w-xs">
              Your session has expired. Go back to the demo and select a role to sign in again.
            </p>
            <a
              href="/demo.html"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors"
            >
              Back to demo sign-in
            </a>
          </div>
        ) : error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Couldn't generate the plan</div>
                <div className="mt-1 text-red-300/80">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Plan view */}
        <AnimatePresence mode="wait">
          {plan && !completed && (
            <motion.section
              key="plan"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
            >
              {/* Headline */}
              <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-500/20">
                <div className="text-xs uppercase tracking-wider text-sky-300/80 mb-1">Your plan</div>
                <div className="text-lg font-semibold text-zinc-100 mb-2">{plan.headline}</div>
                <div className="flex gap-3 text-xs text-zinc-400">
                  <span>{plan.budget.context} budget</span>
                  <span>·</span>
                  <span>{plan.strategy.gbrain_bias.replace(/_/g, ' ')} bias</span>
                  <span>·</span>
                  <span>{plan.total_estimated_minutes} min total</span>
                </div>
              </div>

              {/* Action cards */}
              <div className="space-y-3 mb-8">
                {plan.actions.map((action, i) => {
                  const meta = KIND_META[action.kind];
                  const Icon = meta.icon;
                  const outcome = outcomes[action.id];
                  const doneState =
                    outcome?.completed === true ? 'done' :
                    outcome?.completed === false ? 'skipped' :
                    'pending';
                  return (
                    <motion.div
                      key={action.id}
                      variants={fadeInUp}
                      className={clsx(
                        'p-4 rounded-lg border transition-colors',
                        doneState === 'done'    && 'bg-emerald-500/5 border-emerald-500/30',
                        doneState === 'skipped' && 'bg-zinc-900/50 border-zinc-800 opacity-60',
                        doneState === 'pending' && 'bg-zinc-900 border-zinc-800',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-zinc-500 font-mono w-6 pt-1">{i + 1}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border', meta.color)}>
                              <Icon className="w-3 h-3" />
                              {meta.label}
                            </span>
                            <span className="text-xs text-zinc-500">~{action.estimated_minutes} min</span>
                          </div>
                          <div className="text-sm font-semibold text-zinc-100 mb-1">{action.title}</div>
                          <div className="text-xs text-zinc-400 leading-relaxed">{action.rationale}</div>

                          {/* Controls */}
                          {doneState === 'pending' && (
                            <div className="mt-3 flex gap-2 flex-wrap">
                              <button
                                onClick={() => startAction(action)}
                                className="px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                              >
                                <Play className="w-3 h-3" /> Start
                                <ChevronRight className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => markDone(action.id, true)}
                                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
                              >
                                Mark done
                              </button>
                              <button
                                onClick={() => markDone(action.id, false)}
                                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
                              >
                                Skip
                              </button>
                            </div>
                          )}
                          {doneState === 'done' && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Marked done</span>
                              </div>
                              {(action.kind === 'practice' || action.kind === 'micro-mock' || action.kind === 'spaced-review') && (
                                <div className="flex gap-2 items-center text-xs">
                                  <span className="text-zinc-500">Attempts:</span>
                                  <input
                                    type="number" min={0} max={action.content_hint.count}
                                    value={outcome?.attempts ?? 0}
                                    onChange={(e) => setAttempts(
                                      action.id,
                                      parseInt(e.target.value, 10) || 0,
                                      outcome?.correct ?? 0,
                                    )}
                                    className="w-14 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-100 font-mono"
                                  />
                                  <span className="text-zinc-500">Correct:</span>
                                  <input
                                    type="number" min={0} max={outcome?.attempts ?? action.content_hint.count}
                                    value={outcome?.correct ?? 0}
                                    onChange={(e) => setAttempts(
                                      action.id,
                                      outcome?.attempts ?? 0,
                                      parseInt(e.target.value, 10) || 0,
                                    )}
                                    className="w-14 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-100 font-mono"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          {doneState === 'skipped' && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Skipped</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Finish */}
              <div className="flex gap-2">
                <button
                  onClick={finishSession}
                  disabled={submittingCompletion}
                  className="flex-1 px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingCompletion ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Finish & log this session
                </button>
                <button
                  onClick={() => { setPlan(null); setOutcomes({}); setStartedAtMs(null); }}
                  className="px-4 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
                >
                  Reset
                </button>
              </div>
            </motion.section>
          )}

          {completed && plan && (
            <motion.section
              key="done"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="text-center py-12"
            >
              <div className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Session logged</h2>
              <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
                Your outcomes feed into the next plan — so the more sessions you complete,
                the better your recommendations get.
              </p>
              <button
                onClick={() => { setPlan(null); setCompleted(false); setOutcomes({}); }}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-sm transition-colors"
              >
                Plan another session
              </button>
            </motion.section>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
