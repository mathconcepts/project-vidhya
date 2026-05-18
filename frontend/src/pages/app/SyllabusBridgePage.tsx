/**
 * SyllabusBridgePage — multi-step wizard for generating bridge courses.
 *
 * Five guided steps, one focus per screen:
 *
 *   1. Choose mapping     (which curriculum -> which exam)
 *   2. Review the gap     (entries + cost preview)
 *   3. Personalise        (optional: student or cohort GBrain ranking)
 *   4. Generate + monitor (submit batch, watch progress)
 *   5. Review & feedback  (read content, give thumbs, regenerate flagged)
 *
 * The wizard is intuitive because each step does one thing well and shows
 * exactly what's about to happen. Admins never see a blank power-tool wall.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import { clsx } from 'clsx';
import {
  ChevronLeft, ChevronRight, Sparkles, BookOpen, Send, AlertTriangle,
  ThumbsUp, ThumbsDown, RefreshCw, CheckCircle2, Loader2,
} from 'lucide-react';

// ============================================================================
// Types matching the backend API responses
// ============================================================================

interface Mapping {
  id: string; source_curriculum_id: string; target_exam_id: string;
  display_name: string; entry_count: number;
  gap_breakdown: { aligned: number; depth_gap: number; breadth_gap: number; foundation: number };
}

interface MappingEntry {
  id: string; source_concept_ids: string[]; target_topic_ids: string[];
  gap_class: 'aligned' | 'depth-gap' | 'breadth-gap' | 'foundation';
  bridge_note: string; difficulty_jump: number;
}

interface MappingDetail { id: string; display_name: string; entries: MappingEntry[]; }

interface PlanPreview {
  mapping_id: string; total_units: number;
  total_estimated_tokens: number; estimated_cost_usd: number;
}

interface BatchRequest {
  batch_id: string; mapping_id: string; unit_ids: string[];
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  submitted_at: string; for_student_id?: string;
  total_units: number; completed_units: number; failed_units: number;
  total_cost_estimate_usd: number; error?: string;
}

interface GeneratedContentItem {
  content_id: string; unit_id: string; unit_type: string;
  title: string; body_markdown: string; source: string;
  tokens_used?: number; cost_usd?: number; generated_at: string;
  flagged_for_regen?: boolean;
}

interface RankedEntryItem {
  entry_id: string; gap_class: MappingEntry['gap_class'];
  difficulty_jump: number; target_topic_ids: string[];
  need_score: number; target_mastery: Record<string, number>; reason: string;
}

interface CohortStat {
  entry_id: string; gap_class: MappingEntry['gap_class'];
  students_struggling: number; cohort_size: number;
  cohort_avg_mastery: number; recommended_action: string;
}

interface FeedbackSummary {
  content_id: string; total: number;
  by_rating: Record<string, number>;
  needs_regen: boolean; regen_reason: string;
}

interface FeedbackOverview {
  mapping_id: string;
  total_feedback: number;
  flagged_content_count: number;
  top_complaints: Array<{ content_id: string; total: number; reason: string }>;
}

// ============================================================================
// Constants
// ============================================================================

const STEPS = [
  { id: 1, label: 'Pick mapping',      icon: BookOpen },
  { id: 2, label: 'Review gap',        icon: AlertTriangle },
  { id: 3, label: 'Personalise',       icon: Sparkles },
  { id: 4, label: 'Generate',          icon: Send },
  { id: 5, label: 'Review & feedback', icon: ThumbsUp },
];

const GAP_COLOR: Record<MappingEntry['gap_class'], string> = {
  'aligned':     'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  'depth-gap':   'bg-amber-500/10  border-amber-500/30  text-amber-300',
  'breadth-gap': 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  'foundation':  'bg-red-500/10    border-red-500/30    text-red-300',
};

const GAP_LABEL: Record<MappingEntry['gap_class'], string> = {
  'aligned':     'Aligned',
  'depth-gap':   'Depth gap',
  'breadth-gap': 'Breadth gap',
  'foundation':  'Foundation',
};

// ============================================================================
// Component
// ============================================================================

export default function SyllabusBridgePage() {
  // ---- Wizard state ----
  const [step, setStep] = useState(1);

  // ---- Data ----
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [mappingDetail, setMappingDetail] = useState<MappingDetail | null>(null);
  const [plan, setPlan] = useState<PlanPreview | null>(null);
  const [content, setContent] = useState<GeneratedContentItem[]>([]);
  const [activeBatch, setActiveBatch] = useState<BatchRequest | null>(null);
  const [feedbackOverview, setFeedbackOverview] = useState<FeedbackOverview | null>(null);

  // ---- Personalisation state (step 3) ----
  const [personaMode, setPersonaMode] = useState<'pack' | 'student' | 'cohort'>('pack');
  const [studentId, setStudentId] = useState('');
  const [cohortIds, setCohortIds] = useState('');
  const [smartPriority, setSmartPriority] = useState(true);
  const [rankedEntries, setRankedEntries] = useState<RankedEntryItem[] | null>(null);
  const [cohortStats, setCohortStats] = useState<CohortStat[] | null>(null);

  // ---- UI state ----
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [feedbackBySummary, setFeedbackBySummary] = useState<Record<string, FeedbackSummary>>({});

  // ---- Load mappings on mount ----
  useEffect(() => {
    authFetch('/api/syllabus-bridge/mappings')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: { mappings: Mapping[] }) => {
        setMappings(d.mappings);
        if (d.mappings.length === 1) setSelectedMappingId(d.mappings[0].id);
      })
      .catch(() => setError('Could not load mappings. Make sure you are signed in as admin.'))
      .finally(() => setLoading(false));
  }, []);

  // ---- When mapping changes, refetch all the dependent data ----
  const refreshAll = useCallback(async (mappingId: string) => {
    try {
      const [det, p, c, fo] = await Promise.all([
        authFetch(`/api/syllabus-bridge/mappings/${mappingId}`),
        authFetch(`/api/syllabus-bridge/mappings/${mappingId}/plan`),
        authFetch(`/api/syllabus-bridge/content/by-mapping/${mappingId}`),
        authFetch(`/api/syllabus-bridge/mappings/${mappingId}/feedback-overview`),
      ]);
      if (det.ok) setMappingDetail((await det.json()).mapping);
      if (p.ok)   setPlan(await p.json());
      if (c.ok)   setContent((await c.json()).content);
      if (fo.ok)  setFeedbackOverview(await fo.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { if (selectedMappingId) refreshAll(selectedMappingId); }, [selectedMappingId, refreshAll]);

  // ---- Poll active batch every 2s while running ----
  useEffect(() => {
    if (!activeBatch || activeBatch.status === 'completed' || activeBatch.status === 'failed') return;
    const t = setInterval(async () => {
      try {
        const r = await authFetch(`/api/syllabus-bridge/batches/${activeBatch.batch_id}`);
        if (r.ok) {
          const { batch } = await r.json();
          setActiveBatch(batch);
          if (batch.status === 'completed' || batch.status === 'failed') {
            if (selectedMappingId) refreshAll(selectedMappingId);
          }
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(t);
  }, [activeBatch, selectedMappingId, refreshAll]);

  // ---- Actions ----

  const previewRanked = async () => {
    if (!selectedMappingId || !studentId.trim()) return;
    setError(null);
    try {
      const r = await authFetch(`/api/syllabus-bridge/mappings/${selectedMappingId}/ranked-entries?student_id=${encodeURIComponent(studentId.trim())}`);
      if (!r.ok) throw new Error((await r.json()).error || `Preview failed: ${r.status}`);
      const { ranked } = await r.json();
      setRankedEntries(ranked); setCohortStats(null);
    } catch (e: any) { setError(e.message); }
  };

  const runCohortReport = async () => {
    if (!selectedMappingId) return;
    const ids = cohortIds.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) { setError('Paste at least one student id'); return; }
    setError(null);
    try {
      const r = await authFetch(`/api/syllabus-bridge/mappings/${selectedMappingId}/cohort-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: ids }),
      });
      if (!r.ok) throw new Error((await r.json()).error || `Cohort failed: ${r.status}`);
      const { stats } = await r.json();
      setCohortStats(stats); setRankedEntries(null);
    } catch (e: any) { setError(e.message); }
  };

  const submitBatch = async () => {
    if (!selectedMappingId) return;
    setSubmitting(true); setError(null);
    try {
      const payload: any = { mapping_id: selectedMappingId };
      if (personaMode === 'student' && studentId.trim()) {
        payload.for_student_id = studentId.trim();
        if (smartPriority) payload.smart_priority = true;
      }
      const r = await authFetch('/api/syllabus-bridge/batches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).error || `Submit failed: ${r.status}`);
      const { batch } = await r.json();
      setActiveBatch(batch);
      if (selectedMappingId) refreshAll(selectedMappingId);
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const regenerateFlagged = async () => {
    if (!selectedMappingId) return;
    setSubmitting(true); setError(null);
    try {
      const r = await authFetch(`/api/syllabus-bridge/mappings/${selectedMappingId}/regenerate-flagged`, { method: 'POST' });
      if (!r.ok) throw new Error((await r.json()).error || `Regenerate failed: ${r.status}`);
      const result = await r.json();
      if (result.batch) setActiveBatch(result.batch);
      if (selectedMappingId) refreshAll(selectedMappingId);
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const submitFeedback = async (content_id: string, rating: string) => {
    try {
      const r = await authFetch(`/api/syllabus-bridge/content/${content_id}/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      if (!r.ok) throw new Error((await r.json()).error || `Feedback failed: ${r.status}`);
      const { summary } = await r.json();
      setFeedbackBySummary(prev => ({ ...prev, [content_id]: summary }));
      if (selectedMappingId) {
        const fo = await authFetch(`/api/syllabus-bridge/mappings/${selectedMappingId}/feedback-overview`);
        if (fo.ok) setFeedbackOverview(await fo.json());
      }
    } catch (e: any) { setError(e.message); }
  };

  // ---- Derived ----
  const selectedMapping = useMemo(
    () => mappings.find(m => m.id === selectedMappingId) ?? null,
    [mappings, selectedMappingId],
  );
  const canGoNext = (
    (step === 1 && !!selectedMappingId) ||
    (step === 2 && !!plan) ||
    (step === 3) ||
    (step === 4 && !!activeBatch && (activeBatch.status === 'completed' || activeBatch.status === 'failed'))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-16">
      {/* Header */}
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-2xl font-bold text-zinc-100">Syllabus Bridge</h1>
        <Link to="/admin/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin home</Link>
      </div>
      <p className="text-sm text-zinc-400 mb-6 max-w-2xl">
        Build a curriculum-aware course that helps students bridge from a school syllabus (e.g. TN State Board)
        to an entrance exam (e.g. IIT JEE). Five guided steps.
      </p>

      {/* Stepper */}
      <div className="mb-8 flex items-center gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isCurrent = step === s.id;
          const isPast = step > s.id;
          return (
            <div key={s.id} className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => isPast && setStep(s.id)}
                disabled={!isPast && !isCurrent}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                  isCurrent && 'bg-sky-500/20 border border-sky-500/40 text-sky-200',
                  isPast    && 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 cursor-pointer',
                  !isCurrent && !isPast && 'bg-zinc-900 border border-zinc-800 text-zinc-500',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="font-medium">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-700" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.section key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h2 className="text-sm font-semibold text-zinc-100 mb-2">Step 1 — Pick the curriculum → exam pair</h2>
            <p className="text-xs text-zinc-500 mb-4">
              Each mapping pairs a source curriculum with a target exam. The framework identifies where they
              align, where the source is shallower than the exam, and where the exam needs material the source skips.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mappings.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMappingId(m.id)}
                  className={clsx(
                    'text-left p-4 rounded-xl border-2 transition-all',
                    selectedMappingId === m.id
                      ? 'bg-sky-500/10 border-sky-500/50 ring-1 ring-sky-500/30'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
                  )}
                >
                  <div className="font-semibold text-zinc-100">{m.display_name}</div>
                  <div className="text-xs text-zinc-500 mt-1">{m.entry_count} bridge entries</div>
                  <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] text-center">
                    <div className="px-1 py-1 rounded bg-emerald-500/15 text-emerald-300">aligned<br/>{m.gap_breakdown.aligned}</div>
                    <div className="px-1 py-1 rounded bg-amber-500/15 text-amber-300">depth<br/>{m.gap_breakdown.depth_gap}</div>
                    <div className="px-1 py-1 rounded bg-orange-500/15 text-orange-300">breadth<br/>{m.gap_breakdown.breadth_gap}</div>
                    <div className="px-1 py-1 rounded bg-red-500/15 text-red-300">foundation<br/>{m.gap_breakdown.foundation}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {step === 2 && selectedMapping && plan && mappingDetail && (
          <motion.section key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h2 className="text-sm font-semibold text-zinc-100 mb-2">Step 2 — Review the gap analysis</h2>
            <p className="text-xs text-zinc-500 mb-4">
              Each entry below maps source concepts to target exam topics, colour-coded by gap class.
              Below the count, total cost if you generate the whole pack.
            </p>

            <div className="mb-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-zinc-100">{plan.total_units}</div>
                <div className="text-xs text-zinc-500">units to generate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-100">{plan.total_estimated_tokens.toLocaleString()}</div>
                <div className="text-xs text-zinc-500">est. tokens</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">${plan.estimated_cost_usd.toFixed(4)}</div>
                <div className="text-xs text-zinc-500">est. cost (Gemini Flash)</div>
              </div>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {mappingDetail.entries.map(e => (
                <div key={e.id} className={clsx('p-2.5 rounded-lg border text-xs', GAP_COLOR[e.gap_class])}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-zinc-100">{e.id}</span>
                    <span className="text-[10px]">{GAP_LABEL[e.gap_class]} · jump {e.difficulty_jump}/5</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">{e.bridge_note}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {step === 3 && (
          <motion.section key="s3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h2 className="text-sm font-semibold text-zinc-100 mb-2">Step 3 — Personalise (optional)</h2>
            <p className="text-xs text-zinc-500 mb-4">
              Choose who this batch is for. GBrain enriches generation prompts with the target audience's
              mastery + motivation signals so the content matches their level.
            </p>

            <div className="space-y-2 mb-4">
              {(['pack', 'student', 'cohort'] as const).map(mode => (
                <label key={mode} className={clsx(
                  'block p-3 rounded-xl border-2 cursor-pointer transition-all',
                  personaMode === mode ? 'bg-sky-500/10 border-sky-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
                )}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="persona" checked={personaMode === mode} onChange={() => setPersonaMode(mode)} className="accent-sky-500" />
                    <div className="font-medium text-zinc-100">
                      {mode === 'pack'    && 'Generic pack — for everyone'}
                      {mode === 'student' && 'Solo prep — personalised to one student'}
                      {mode === 'cohort'  && 'Teacher cohort — analyse class gaps first'}
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 ml-6">
                    {mode === 'pack' && 'Same content every student sees. Lowest cost, fastest.'}
                    {mode === 'student' && "GBrain reads this student's mastery and weak spots; prompt is calibrated to them. Smart Priority limits to their top-10 gaps."}
                    {mode === 'cohort' && "See where the class is stuck before generating. Pick the highest-impact entries."}
                  </div>
                </label>
              ))}
            </div>

            {personaMode === 'student' && (
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="student id (user_xxxxx)"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 font-mono focus:border-sky-500 focus:outline-none"/>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={smartPriority} onChange={e => setSmartPriority(e.target.checked)} className="accent-sky-500"/>
                    Smart priority — generate only their top 10 gaps
                  </label>
                  <button onClick={previewRanked} disabled={!studentId.trim()} className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    studentId.trim() ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
                  )}>Preview rank</button>
                </div>
                {rankedEntries && (
                  <div className="max-h-60 overflow-y-auto space-y-1 mt-2">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Top entries this student needs</div>
                    {rankedEntries.slice(0, 8).map(r => (
                      <div key={r.entry_id} className={clsx('p-1.5 rounded text-[11px]', GAP_COLOR[r.gap_class])}>
                        <div className="flex justify-between"><span className="font-mono">{r.entry_id}</span><span>need {(r.need_score * 100).toFixed(0)}</span></div>
                        <div className="text-zinc-400">{r.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {personaMode === 'cohort' && (
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <textarea value={cohortIds} onChange={e => setCohortIds(e.target.value)} placeholder="Comma-separated student ids (paste your roster)" rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:border-sky-500 focus:outline-none"/>
                <button onClick={runCohortReport} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-colors">
                  Run cohort gap report
                </button>
                {cohortStats && (
                  <div className="max-h-60 overflow-y-auto space-y-1 mt-2">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Where the class is stuck</div>
                    {cohortStats.map(s => (
                      <div key={s.entry_id} className={clsx('p-1.5 rounded text-[11px]', GAP_COLOR[s.gap_class])}>
                        <div className="flex justify-between"><span className="font-mono">{s.entry_id}</span><span>{s.students_struggling}/{s.cohort_size} struggling</span></div>
                        <div className="text-zinc-300 italic">{s.recommended_action}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.section>
        )}

        {step === 4 && plan && (
          <motion.section key="s4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h2 className="text-sm font-semibold text-zinc-100 mb-2">Step 4 — Generate</h2>
            {!activeBatch && (
              <>
                <p className="text-xs text-zinc-500 mb-4">
                  Ready to spend up to <span className="text-emerald-400 font-semibold">${plan.estimated_cost_usd.toFixed(4)}</span>
                  {' '}on <span className="text-zinc-200 font-semibold">{plan.total_units} units</span>
                  {personaMode === 'student' && ` for student ${studentId}`}.
                </p>
                <button onClick={submitBatch} disabled={submitting} className={clsx(
                  'w-full py-4 rounded-xl font-semibold text-white transition-all',
                  submitting ? 'bg-zinc-800 cursor-not-allowed text-zinc-500' : 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:opacity-90',
                )}>
                  {submitting ? 'Submitting…' : `Submit batch — generate ${plan.total_units} units`}
                </button>
                <p className="text-[10px] text-zinc-600 mt-2">
                  Without an LLM key, units generate as mock placeholders (free, instant). Set GEMINI_API_KEY in your env for real generation.
                </p>
              </>
            )}
            {activeBatch && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-zinc-900 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-zinc-100">{activeBatch.batch_id}</div>
                      <div className="text-xs text-zinc-500">{activeBatch.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-zinc-100">{activeBatch.completed_units}/{activeBatch.total_units}</div>
                      <div className="text-xs text-emerald-400">${activeBatch.total_cost_estimate_usd.toFixed(5)}</div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(activeBatch.completed_units / Math.max(1, activeBatch.total_units)) * 100}%` }}/>
                  </div>
                </div>
                {activeBatch.status === 'completed' && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4"/>
                    Done — head to Review & feedback to scan results.
                  </div>
                )}
              </div>
            )}
          </motion.section>
        )}

        {step === 5 && (
          <motion.section key="s5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h2 className="text-sm font-semibold text-zinc-100 mb-2">Step 5 — Review & feedback</h2>
            <p className="text-xs text-zinc-500 mb-4">
              Read what was generated. Rate items honestly — the framework auto-flags content with consistent
              negative feedback for regeneration.
            </p>

            {feedbackOverview && feedbackOverview.flagged_content_count > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-amber-200 font-medium">
                    {feedbackOverview.flagged_content_count} content piece{feedbackOverview.flagged_content_count === 1 ? '' : 's'} flagged for regeneration
                  </div>
                  <div className="text-xs text-amber-300/70">Based on accumulated student + teacher feedback.</div>
                </div>
                <button onClick={regenerateFlagged} disabled={submitting}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/40 transition-colors flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5"/> Regenerate flagged
                </button>
              </div>
            )}

            <div className="space-y-2">
              {content.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm">No content yet. Submit a batch first.</div>
              )}
              {content.map(c => {
                const summary = feedbackBySummary[c.content_id];
                const isExpanded = expandedContent === c.content_id;
                return (
                  <div key={c.content_id} className={clsx(
                    'rounded-lg border overflow-hidden',
                    c.flagged_for_regen ? 'bg-amber-500/5 border-amber-500/30' : 'bg-zinc-900 border-zinc-800',
                  )}>
                    <button onClick={() => setExpandedContent(isExpanded ? null : c.content_id)}
                      className="w-full p-3 text-left hover:bg-zinc-800/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                            {c.title}
                            {c.flagged_for_regen && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200">FLAGGED</span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{c.unit_type} · {c.source} · {c.tokens_used ?? 0} tokens</div>
                        </div>
                        <span className="text-xs text-zinc-500">{isExpanded ? '▼' : '▶'}</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                        <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed mb-3">{c.body_markdown}</pre>
                        <FeedbackBar summary={summary} onRate={(rating) => submitFeedback(c.content_id, rating)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Wizard nav */}
      <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-between">
        <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className={clsx(
          'flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors',
          step === 1 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:bg-zinc-900',
        )}>
          <ChevronLeft className="w-4 h-4"/> Back
        </button>
        <div className="text-xs text-zinc-500">Step {step} of {STEPS.length}</div>
        {step < 4 && (
          <button onClick={() => setStep(step + 1)} disabled={!canGoNext} className={clsx(
            'flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors',
            canGoNext ? 'bg-sky-500 hover:bg-sky-400 text-white' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed',
          )}>
            Next <ChevronRight className="w-4 h-4"/>
          </button>
        )}
        {step === 4 && activeBatch?.status === 'completed' && (
          <button onClick={() => setStep(5)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-sky-500 hover:bg-sky-400 text-white">
            Review content <ChevronRight className="w-4 h-4"/>
          </button>
        )}
        {step === 5 && <div />}
      </div>
    </div>
  );
}

function FeedbackBar({ summary, onRate }: { summary: FeedbackSummary | undefined; onRate: (rating: string) => void }) {
  const reasons = ['wrong', 'unclear', 'too-easy', 'too-hard'];
  return (
    <div className="border-t border-zinc-800 pt-3">
      <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400">
        <span>Was this useful?</span>
        <button onClick={() => onRate('helpful')} className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors">
          <ThumbsUp className="w-3 h-3"/> Helpful
        </button>
        <button onClick={() => onRate('not-helpful')} className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-red-500/20 hover:text-red-300 transition-colors">
          <ThumbsDown className="w-3 h-3"/> Not helpful
        </button>
        {summary && summary.total > 0 && (
          <span className="ml-auto text-[10px] text-zinc-500">
            {summary.by_rating.helpful} 👍 · {summary.by_rating['not-helpful']} 👎 · {summary.total} total
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 text-[10px]">
        <span className="text-zinc-600">Or flag a specific issue:</span>
        {reasons.map(r => (
          <button key={r} onClick={() => onRate(r)} className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:bg-amber-500/20 hover:text-amber-300 transition-colors">
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
