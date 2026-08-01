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

import { useState, useEffect, useCallback, useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
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

const GAP_STYLE: Record<MappingEntry['gap_class'], CSSProperties> = {
  'aligned':     { background: 'rgba(52,199,89,.06)',  border: '1px solid rgba(52,199,89,.22)',  color: 'var(--green-ink)' },
  'depth-gap':   { background: 'rgba(255,149,0,.06)',  border: '1px solid rgba(255,149,0,.22)',  color: 'var(--orange)' },
  'breadth-gap': { background: 'rgba(255,149,0,.06)',  border: '1px solid rgba(255,149,0,.22)',  color: 'var(--orange)' },
  'foundation':  { background: 'rgba(255,59,48,.06)',  border: '1px solid rgba(255,59,48,.22)',  color: 'var(--red)' },
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
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
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
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const submitBatch = async () => {
    if (!selectedMappingId) return;
    setSubmitting(true); setError(null);
    try {
      const payload: Record<string, unknown> = { mapping_id: selectedMappingId };
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
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
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
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
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
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
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
      <div className="flex items-center justify-center" style={{ minHeight: '60vh', color: 'var(--text-tertiary)' }}>
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-16">
      {/* Header */}
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Syllabus Bridge</h1>
        <Link to="/admin/dashboard" className="text-xs" style={{ color: 'var(--text-tertiary)' }}>← Admin home</Link>
      </div>
      <p className="text-sm mb-6 max-w-2xl" style={{ color: 'var(--text-tertiary)' }}>
        Build a curriculum-aware course that helps students bridge from a school syllabus (e.g. TN State Board)
        to an entrance exam (e.g. IIT JEE). Five guided steps.
      </p>

      {/* Stepper */}
      <div className="mb-8 flex items-center gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isCurrent = step === s.id;
          const isPast = step > s.id;
          const stepStyle: CSSProperties = isCurrent ? {
            background: 'rgba(88,86,214,.08)',
            border: '1px solid rgba(88,86,214,.22)',
            color: 'var(--indigo-ink)',
          } : isPast ? {
            background: 'rgba(52,199,89,.06)',
            border: '1px solid rgba(52,199,89,.22)',
            color: 'var(--green-ink)',
            cursor: 'pointer',
          } : {
            background: 'var(--surface-card)',
            border: 'var(--hairline) solid var(--separator)',
            color: 'var(--text-tertiary)',
          };
          return (
            <div key={s.id} className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => isPast && setStep(s.id)}
                disabled={!isPast && !isCurrent}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                style={stepStyle}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="font-medium">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.section key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Step 1 — Pick the curriculum → exam pair</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Each mapping pairs a source curriculum with a target exam. The framework identifies where they
              align, where the source is shallower than the exam, and where the exam needs material the source skips.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mappings.map(m => {
                const isSelected = selectedMappingId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMappingId(m.id)}
                    className="text-left p-4 rounded-xl transition-all"
                    style={isSelected ? {
                      background: 'rgba(88,86,214,.08)',
                      border: '2px solid rgba(88,86,214,.22)',
                      boxShadow: '0 0 0 1px rgba(88,86,214,.22)',
                    } : {
                      background: 'var(--surface-card)',
                      border: '2px solid var(--separator)',
                    }}
                  >
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{m.display_name}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{m.entry_count} bridge entries</div>
                    <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] text-center">
                      <div className="px-1 py-1 rounded" style={{ background: 'rgba(52,199,89,.06)', color: 'var(--green-ink)' }}>
                        aligned<br/>{m.gap_breakdown.aligned}
                      </div>
                      <div className="px-1 py-1 rounded" style={{ background: 'rgba(255,149,0,.06)', color: 'var(--orange)' }}>
                        depth<br/>{m.gap_breakdown.depth_gap}
                      </div>
                      <div className="px-1 py-1 rounded" style={{ background: 'rgba(255,149,0,.06)', color: 'var(--orange)' }}>
                        breadth<br/>{m.gap_breakdown.breadth_gap}
                      </div>
                      <div className="px-1 py-1 rounded" style={{ background: 'rgba(255,59,48,.06)', color: 'var(--red)' }}>
                        foundation<br/>{m.gap_breakdown.foundation}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.section>
        )}

        {step === 2 && selectedMapping && plan && mappingDetail && (
          <motion.section key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Step 2 — Review the gap analysis</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Each entry below maps source concepts to target exam topics, colour-coded by gap class.
              Below the count, total cost if you generate the whole pack.
            </p>

            <div className="mb-4 p-4 rounded-xl grid grid-cols-3 gap-4" style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.total_units}</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>units to generate</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.total_estimated_tokens.toLocaleString()}</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>est. tokens</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--green-ink)' }}>${plan.estimated_cost_usd.toFixed(4)}</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>est. cost (Gemini Flash)</div>
              </div>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {mappingDetail.entries.map(e => (
                <div key={e.id} className="p-2.5 rounded-lg text-xs" style={GAP_STYLE[e.gap_class]}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{e.id}</span>
                    <span className="text-[10px]">{GAP_LABEL[e.gap_class]} · jump {e.difficulty_jump}/5</span>
                  </div>
                  <p className="leading-relaxed text-[11px]" style={{ color: 'var(--text-secondary)' }}>{e.bridge_note}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {step === 3 && (
          <motion.section key="s3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Step 3 — Personalise (optional)</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Choose who this batch is for. GBrain enriches generation prompts with the target audience's
              mastery + motivation signals so the content matches their level.
            </p>

            <div className="space-y-2 mb-4">
              {(['pack', 'student', 'cohort'] as const).map(mode => {
                const isSelected = personaMode === mode;
                return (
                  <label
                    key={mode}
                    className="block p-3 rounded-xl cursor-pointer transition-all"
                    style={isSelected ? {
                      background: 'rgba(88,86,214,.08)',
                      border: '2px solid rgba(88,86,214,.22)',
                    } : {
                      background: 'var(--surface-card)',
                      border: '2px solid var(--separator)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="persona"
                        checked={personaMode === mode}
                        onChange={() => setPersonaMode(mode)}
                        style={{ accentColor: 'var(--indigo)' }}
                      />
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {mode === 'pack'    && 'Generic pack — for everyone'}
                        {mode === 'student' && 'Solo prep — personalised to one student'}
                        {mode === 'cohort'  && 'Teacher cohort — analyse class gaps first'}
                      </div>
                    </div>
                    <div className="text-[11px] mt-1 ml-6" style={{ color: 'var(--text-tertiary)' }}>
                      {mode === 'pack'    && 'Same content every student sees. Lowest cost, fastest.'}
                      {mode === 'student' && "GBrain reads this student's mastery and weak spots; prompt is calibrated to them. Smart Priority limits to their top-10 gaps."}
                      {mode === 'cohort'  && "See where the class is stuck before generating. Pick the highest-impact entries."}
                    </div>
                  </label>
                );
              })}
            </div>

            {personaMode === 'student' && (
              <div className="p-3 rounded-lg space-y-2" style={{ background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}>
                <input
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="student id (user_xxxxx)"
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono focus:outline-none"
                  style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-primary)' }}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={smartPriority}
                      onChange={e => setSmartPriority(e.target.checked)}
                      style={{ accentColor: 'var(--indigo)' }}
                    />
                    Smart priority — generate only their top 10 gaps
                  </label>
                  <button
                    onClick={previewRanked}
                    disabled={!studentId.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={studentId.trim() ? {
                      background: 'rgba(88,86,214,.08)',
                      color: 'var(--indigo-ink)',
                    } : {
                      background: 'var(--surface-fill)',
                      color: 'var(--text-tertiary)',
                      cursor: 'not-allowed',
                    }}
                  >
                    Preview rank
                  </button>
                </div>
                {rankedEntries && (
                  <div className="max-h-60 overflow-y-auto space-y-1 mt-2">
                    <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Top entries this student needs</div>
                    {rankedEntries.slice(0, 8).map(r => (
                      <div key={r.entry_id} className="p-1.5 rounded text-[11px]" style={GAP_STYLE[r.gap_class]}>
                        <div className="flex justify-between">
                          <span className="font-mono">{r.entry_id}</span>
                          <span>need {(r.need_score * 100).toFixed(0)}</span>
                        </div>
                        <div style={{ color: 'var(--text-tertiary)' }}>{r.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {personaMode === 'cohort' && (
              <div className="p-3 rounded-lg space-y-2" style={{ background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}>
                <textarea
                  value={cohortIds}
                  onChange={e => setCohortIds(e.target.value)}
                  placeholder="Comma-separated student ids (paste your roster)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
                  style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={runCohortReport}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: 'rgba(88,86,214,.08)', color: 'var(--indigo-ink)' }}
                >
                  Run cohort gap report
                </button>
                {cohortStats && (
                  <div className="max-h-60 overflow-y-auto space-y-1 mt-2">
                    <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Where the class is stuck</div>
                    {cohortStats.map(s => (
                      <div key={s.entry_id} className="p-1.5 rounded text-[11px]" style={GAP_STYLE[s.gap_class]}>
                        <div className="flex justify-between">
                          <span className="font-mono">{s.entry_id}</span>
                          <span>{s.students_struggling}/{s.cohort_size} struggling</span>
                        </div>
                        <div className="italic" style={{ color: 'var(--text-secondary)' }}>{s.recommended_action}</div>
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
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Step 4 — Generate</h2>
            {!activeBatch && (
              <>
                <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  Ready to spend up to{' '}
                  <span className="font-semibold" style={{ color: 'var(--green-ink)' }}>${plan.estimated_cost_usd.toFixed(4)}</span>
                  {' '}on{' '}
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{plan.total_units} units</span>
                  {personaMode === 'student' && ` for student ${studentId}`}.
                </p>
                <button
                  onClick={submitBatch}
                  disabled={submitting}
                  className="w-full py-4 rounded-xl font-semibold transition-all"
                  style={submitting ? {
                    background: 'var(--surface-fill)',
                    cursor: 'not-allowed',
                    color: 'var(--text-tertiary)',
                  } : {
                    background: 'var(--green)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {submitting ? 'Submitting…' : `Submit batch — generate ${plan.total_units} units`}
                </button>
                <p className="text-[10px] mt-2" style={{ color: 'var(--text-tertiary)' }}>
                  Without an LLM key, units generate as mock placeholders (free, instant). Set GEMINI_API_KEY in your env for real generation.
                </p>
              </>
            )}
            {activeBatch && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl" style={{ background: 'var(--surface-card)', border: '1px solid rgba(52,199,89,.22)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{activeBatch.batch_id}</div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{activeBatch.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{activeBatch.completed_units}/{activeBatch.total_units}</div>
                      <div className="text-xs" style={{ color: 'var(--green-ink)' }}>${activeBatch.total_cost_estimate_usd.toFixed(5)}</div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-fill)' }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${(activeBatch.completed_units / Math.max(1, activeBatch.total_units)) * 100}%`,
                        background: 'var(--green)',
                      }}
                    />
                  </div>
                </div>
                {activeBatch.status === 'completed' && (
                  <div className="p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', color: 'var(--green-ink)' }}>
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
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Step 5 — Review & feedback</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Read what was generated. Rate items honestly — the framework auto-flags content with consistent
              negative feedback for regeneration.
            </p>

            {feedbackOverview && feedbackOverview.flagged_content_count > 0 && (
              <div className="mb-4 p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)' }}>
                <div className="text-sm">
                  <div className="font-medium" style={{ color: 'var(--orange)' }}>
                    {feedbackOverview.flagged_content_count} content piece{feedbackOverview.flagged_content_count === 1 ? '' : 's'} flagged for regeneration
                  </div>
                  <div className="text-xs" style={{ color: 'var(--orange)', opacity: 0.7 }}>Based on accumulated student + teacher feedback.</div>
                </div>
                <button
                  onClick={regenerateFlagged}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  style={{ background: 'rgba(255,149,0,.08)', color: 'var(--orange)', border: '1px solid rgba(255,149,0,.22)' }}
                >
                  <RefreshCw className="w-3.5 h-3.5"/> Regenerate flagged
                </button>
              </div>
            )}

            <div className="space-y-2">
              {content.length === 0 && (
                <div className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No content yet. Submit a batch first.</div>
              )}
              {content.map(c => {
                const summary = feedbackBySummary[c.content_id];
                const isExpanded = expandedContent === c.content_id;
                const isFlagged = c.flagged_for_regen;
                return (
                  <div
                    key={c.content_id}
                    className="rounded-lg overflow-hidden"
                    style={isFlagged ? {
                      background: 'rgba(255,149,0,.04)',
                      border: '1px solid rgba(255,149,0,.22)',
                    } : {
                      background: 'var(--surface-card)',
                      border: 'var(--hairline) solid var(--separator)',
                    }}
                  >
                    <button
                      onClick={() => setExpandedContent(isExpanded ? null : c.content_id)}
                      className="w-full p-3 text-left transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            {c.title}
                            {isFlagged && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(255,149,0,.22)', color: 'var(--orange)' }}
                              >
                                FLAGGED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {c.unit_type} · {c.source} · {c.tokens_used ?? 0} tokens
                          </div>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{isExpanded ? '▼' : '▶'}</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="p-4" style={{ background: 'var(--surface-fill)', borderTop: 'var(--hairline) solid var(--separator)' }}>
                        <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{c.body_markdown}</pre>
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
      <div className="mt-8 pt-4 flex items-center justify-between" style={{ borderTop: 'var(--hairline) solid var(--separator)' }}>
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors"
          style={step === 1 ? {
            color: 'var(--text-tertiary)',
            cursor: 'not-allowed',
          } : {
            color: 'var(--text-secondary)',
          }}
        >
          <ChevronLeft className="w-4 h-4"/> Back
        </button>
        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Step {step} of {STEPS.length}</div>
        {step < 4 && (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canGoNext}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors"
            style={canGoNext ? {
              background: 'var(--indigo)',
              color: 'var(--text-primary)',
            } : {
              background: 'var(--surface-card)',
              color: 'var(--text-tertiary)',
              cursor: 'not-allowed',
            }}
          >
            Next <ChevronRight className="w-4 h-4"/>
          </button>
        )}
        {step === 4 && activeBatch?.status === 'completed' && (
          <button
            onClick={() => setStep(5)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--indigo)', color: 'var(--text-primary)' }}
          >
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
    <div className="pt-3" style={{ borderTop: 'var(--hairline) solid var(--separator)' }}>
      <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <span>Was this useful?</span>
        <button
          onClick={() => onRate('helpful')}
          className="flex items-center gap-1 px-2 py-1 rounded transition-colors"
          style={{ background: 'rgba(52,199,89,.06)', color: 'var(--green-ink)' }}
        >
          <ThumbsUp className="w-3 h-3"/> Helpful
        </button>
        <button
          onClick={() => onRate('not-helpful')}
          className="flex items-center gap-1 px-2 py-1 rounded transition-colors"
          style={{ background: 'var(--surface-fill)', color: 'var(--text-secondary)' }}
        >
          <ThumbsDown className="w-3 h-3"/> Not helpful
        </button>
        {summary && summary.total > 0 && (
          <span className="ml-auto text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {summary.by_rating.helpful} 👍 · {summary.by_rating['not-helpful']} 👎 · {summary.total} total
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 text-[10px]">
        <span style={{ color: 'var(--text-tertiary)' }}>Or flag a specific issue:</span>
        {reasons.map(r => (
          <button
            key={r}
            onClick={() => onRate(r)}
            className="px-1.5 py-0.5 rounded transition-colors"
            style={{ background: 'var(--surface-fill)', color: 'var(--text-tertiary)' }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
