/**
 * SyllabusBridgePage — admin tool for generating bridge content between a
 * source curriculum (e.g. TN Class 12 Mathematics) and a target exam (e.g.
 * IIT JEE Main).
 *
 * Flow:
 *   1. Pick a mapping (only TN-12-MATH → JEE Main exists today)
 *   2. Review the gap analysis (entries grouped by gap class)
 *   3. See the content plan + estimated cost
 *   4. Submit a batch → poll for progress → view generated content
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '@/lib/auth/client';
import { clsx } from 'clsx';

interface Mapping {
  id: string;
  source_curriculum_id: string;
  target_exam_id: string;
  display_name: string;
  entry_count: number;
  gap_breakdown: {
    aligned: number;
    depth_gap: number;
    breadth_gap: number;
    foundation: number;
  };
}

interface MappingDetail {
  id: string;
  display_name: string;
  entries: MappingEntry[];
}

interface MappingEntry {
  id: string;
  source_concept_ids: string[];
  target_topic_ids: string[];
  gap_class: 'aligned' | 'depth-gap' | 'breadth-gap' | 'foundation';
  bridge_note: string;
  difficulty_jump: number;
}

interface PlanPreview {
  mapping_id: string;
  total_units: number;
  total_estimated_tokens: number;
  estimated_cost_usd: number;
  grouped_by_entry: Record<string, PlanUnit[]>;
}

interface PlanUnit {
  unit_id: string;
  unit_type: string;
  difficulty: number;
  estimated_tokens: number;
}

interface BatchRequest {
  batch_id: string;
  mapping_id: string;
  unit_ids: string[];
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  submitted_at: string;
  started_at?: string;
  completed_at?: string;
  total_units: number;
  completed_units: number;
  failed_units: number;
  total_cost_estimate_usd: number;
  results: { unit_id: string; status: string; content_id?: string; error?: string }[];
  error?: string;
}

interface GeneratedContentItem {
  content_id: string;
  unit_id: string;
  unit_type: string;
  title: string;
  body_markdown: string;
  source: string;
  tokens_used?: number;
  cost_usd?: number;
  generated_at: string;
}

interface RankedEntryItem {
  entry_id: string;
  gap_class: MappingEntry['gap_class'];
  difficulty_jump: number;
  target_topic_ids: string[];
  need_score: number;
  target_mastery: Record<string, number>;
  reason: string;
}

interface CohortStat {
  entry_id: string;
  gap_class: MappingEntry['gap_class'];
  students_struggling: number;
  cohort_size: number;
  cohort_avg_mastery: number;
  recommended_action: string;
}

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

export default function SyllabusBridgePage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [mappingDetail, setMappingDetail] = useState<MappingDetail | null>(null);
  const [plan, setPlan] = useState<PlanPreview | null>(null);
  const [batches, setBatches] = useState<BatchRequest[]>([]);
  const [activeBatch, setActiveBatch] = useState<BatchRequest | null>(null);
  const [content, setContent] = useState<GeneratedContentItem[]>([]);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- GBrain-powered controls -----
  const [studentId, setStudentId] = useState<string>('');           // admin types a student id
  const [smartPriority, setSmartPriority] = useState<boolean>(false);
  const [rankedEntries, setRankedEntries] = useState<RankedEntryItem[] | null>(null);
  const [cohortStats, setCohortStats] = useState<CohortStat[] | null>(null);
  const [gbrainLoading, setGbrainLoading] = useState(false);

  // ----- Initial load: list of mappings -----
  useEffect(() => {
    authFetch('/api/syllabus-bridge/mappings')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: { mappings: Mapping[] }) => {
        setMappings(d.mappings);
        if (d.mappings.length > 0) setSelectedMappingId(d.mappings[0].id);
      })
      .catch(() => setError('Could not load mappings — make sure you are signed in'))
      .finally(() => setLoading(false));
  }, []);

  // ----- When mapping is selected, load detail + plan + batches + content -----
  const refreshAll = useCallback(async (mappingId: string) => {
    try {
      const [detRes, planRes, batchRes, contentRes] = await Promise.all([
        authFetch(`/api/syllabus-bridge/mappings/${mappingId}`),
        authFetch(`/api/syllabus-bridge/mappings/${mappingId}/plan`),
        authFetch('/api/syllabus-bridge/batches'),
        authFetch(`/api/syllabus-bridge/content/by-mapping/${mappingId}`),
      ]);
      if (detRes.ok)     setMappingDetail((await detRes.json()).mapping);
      if (planRes.ok)    setPlan(await planRes.json());
      if (batchRes.ok)   {
        const all = (await batchRes.json()).batches as BatchRequest[];
        setBatches(all.filter(b => b.mapping_id === mappingId));
      }
      if (contentRes.ok) setContent((await contentRes.json()).content);
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => {
    if (selectedMappingId) refreshAll(selectedMappingId);
  }, [selectedMappingId, refreshAll]);

  // ----- Poll active batch every 2s while it's running -----
  useEffect(() => {
    if (!activeBatch || activeBatch.status === 'completed' || activeBatch.status === 'failed') return;
    const t = setInterval(async () => {
      try {
        const r = await authFetch(`/api/syllabus-bridge/batches/${activeBatch.batch_id}`);
        if (r.ok) {
          const { batch } = await r.json();
          setActiveBatch(batch);
          // When batch completes, refresh the content list
          if (batch.status === 'completed' || batch.status === 'failed') {
            if (selectedMappingId) refreshAll(selectedMappingId);
          }
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(t);
  }, [activeBatch, selectedMappingId, refreshAll]);

  const submitBatch = async () => {
    if (!selectedMappingId) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: any = { mapping_id: selectedMappingId };
      if (studentId.trim()) payload.for_student_id = studentId.trim();
      if (smartPriority) payload.smart_priority = true;
      const r = await authFetch('/api/syllabus-bridge/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Submit failed: ${r.status}`);
      }
      const { batch } = await r.json();
      setActiveBatch(batch);
      // Also refresh batches list
      if (selectedMappingId) refreshAll(selectedMappingId);
    } catch (err: any) {
      setError(err.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const previewRankedForStudent = async () => {
    if (!selectedMappingId || !studentId.trim()) return;
    setGbrainLoading(true);
    setError(null);
    try {
      const url = `/api/syllabus-bridge/mappings/${selectedMappingId}/ranked-entries?student_id=${encodeURIComponent(studentId.trim())}`;
      const r = await authFetch(url);
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Rank preview failed: ${r.status}`);
      }
      const { ranked } = await r.json();
      setRankedEntries(ranked);
      setCohortStats(null);
    } catch (err: any) {
      setError(err.message || 'Preview failed');
    } finally {
      setGbrainLoading(false);
    }
  };

  const runCohortReport = async (idsCSV: string) => {
    if (!selectedMappingId) return;
    const ids = idsCSV.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) { setError('Paste at least one student id'); return; }
    setGbrainLoading(true);
    setError(null);
    try {
      const r = await authFetch(`/api/syllabus-bridge/mappings/${selectedMappingId}/cohort-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: ids }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Cohort report failed: ${r.status}`);
      }
      const { stats } = await r.json();
      setCohortStats(stats);
      setRankedEntries(null);
    } catch (err: any) {
      setError(err.message || 'Cohort report failed');
    } finally {
      setGbrainLoading(false);
    }
  };

  if (loading) {
    return <div className="text-zinc-500 p-8">Loading bridge framework…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-16">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-2xl font-bold text-zinc-100">Syllabus Bridge</h1>
        <Link to="/admin/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin home</Link>
      </div>
      <p className="text-sm text-zinc-400 mb-8 max-w-2xl">
        Generate intuitive bridge content that helps students who studied a school curriculum (e.g. TN State Board)
        reach the depth of an entrance exam (e.g. IIT JEE Main). Pick a mapping, review the gap analysis, and
        submit a batch — the runner walks the content plan and stores results for delivery via your existing
        practice flow.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Mapping picker */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Mappings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mappings.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMappingId(m.id)}
              className={clsx(
                'text-left p-4 rounded-xl border transition-colors',
                selectedMappingId === m.id
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
              )}
            >
              <div className="font-semibold text-zinc-100">{m.display_name}</div>
              <div className="text-xs text-zinc-500 mt-1">{m.entry_count} bridge entries</div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">aligned {m.gap_breakdown.aligned}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">depth {m.gap_breakdown.depth_gap}</span>
                <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300">breadth {m.gap_breakdown.breadth_gap}</span>
                <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-300">foundation {m.gap_breakdown.foundation}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Plan summary + batch submit */}
      {plan && (
        <section className="mb-8 p-5 rounded-xl bg-zinc-900 border border-zinc-800">
          <h2 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Content plan</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-2xl font-bold text-zinc-100">{plan.total_units}</div>
              <div className="text-xs text-zinc-500">units</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-100">{plan.total_estimated_tokens.toLocaleString()}</div>
              <div className="text-xs text-zinc-500">est. tokens</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">${plan.estimated_cost_usd.toFixed(4)}</div>
              <div className="text-xs text-zinc-500">est. cost</div>
            </div>
          </div>
          <button
            onClick={submitBatch}
            disabled={submitting || !!(activeBatch && activeBatch.status === 'running')}
            className={clsx(
              'w-full py-3 rounded-xl font-semibold text-white transition-all',
              submitting || (activeBatch && activeBatch.status === 'running')
                ? 'bg-zinc-800 cursor-not-allowed text-zinc-500'
                : 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:opacity-90',
            )}
          >
            {submitting ? 'Submitting…'
              : activeBatch?.status === 'running' ? `Running… ${activeBatch.completed_units}/${activeBatch.total_units}`
              : `Submit batch — generate all ${plan.total_units} units`}
          </button>
          <p className="text-[11px] text-zinc-500 mt-2">
            Without an LLM key, units are generated as mock placeholders (free, instant).
            Set GEMINI_API_KEY / ANTHROPIC_API_KEY in your env for real generation.
          </p>
        </section>
      )}

      {/* GBrain controls — personalisation + cohort report */}
      {selectedMappingId && (
        <section className="mb-8 p-5 rounded-xl bg-zinc-900 border border-sky-500/30">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs uppercase tracking-wide text-sky-400">GBrain personalisation</h2>
            <span className="text-[10px] text-zinc-500">student model + mastery vector</span>
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            Type a student id to personalise the batch: GBrain ranks bridge entries by what this student
            needs most (low mastery on the target topics, motivation signals, prerequisite gaps),
            then generation prompts are enriched with their student-model summary.
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input
              type="text"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              placeholder="student id (e.g. user_xxxxx)"
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none font-mono"
            />
            <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={smartPriority}
                onChange={e => setSmartPriority(e.target.checked)}
                className="accent-sky-500"
              />
              Smart priority (top 10)
            </label>
            <button
              onClick={previewRankedForStudent}
              disabled={!studentId.trim() || gbrainLoading}
              className={clsx(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                studentId.trim() && !gbrainLoading
                  ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
              )}
            >
              Preview rank
            </button>
          </div>

          {/* Cohort report input */}
          <details className="mb-2">
            <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-200">
              Teacher: cohort gap report ↓
            </summary>
            <div className="mt-2">
              <textarea
                id="cohort-input"
                placeholder="Comma-separated student ids (paste your roster)"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono"
              />
              <button
                onClick={() => {
                  const el = document.getElementById('cohort-input') as HTMLTextAreaElement | null;
                  if (el) runCohortReport(el.value);
                }}
                disabled={gbrainLoading}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 transition-colors disabled:opacity-50"
              >
                Run cohort report
              </button>
            </div>
          </details>

          {/* Ranked-entries preview for a single student */}
          {rankedEntries && (
            <div className="mt-3 max-h-80 overflow-y-auto">
              <div className="text-[11px] text-zinc-500 mb-1.5 uppercase tracking-wide">
                Top entries this student needs (top 12 of {rankedEntries.length})
              </div>
              <div className="space-y-1.5">
                {rankedEntries.slice(0, 12).map(r => (
                  <div key={r.entry_id} className={clsx('p-2 rounded-md border text-xs', GAP_COLOR[r.gap_class])}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{r.entry_id}</span>
                      <span className="text-zinc-300">need {(r.need_score * 100).toFixed(0)}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{r.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cohort report */}
          {cohortStats && (
            <div className="mt-3 max-h-80 overflow-y-auto">
              <div className="text-[11px] text-zinc-500 mb-1.5 uppercase tracking-wide">
                Cohort gap report — top {cohortStats.length} entries by struggle count
              </div>
              <div className="space-y-1.5">
                {cohortStats.map(s => (
                  <div key={s.entry_id} className={clsx('p-2 rounded-md border text-xs', GAP_COLOR[s.gap_class])}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{s.entry_id}</span>
                      <span className="text-zinc-300">
                        {s.students_struggling}/{s.cohort_size} struggling · avg {(s.cohort_avg_mastery * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-300 mt-0.5 italic">{s.recommended_action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Gap analysis (entries by gap class) */}
      {mappingDetail && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Bridge entries ({mappingDetail.entries.length})</h2>
          <div className="space-y-2">
            {mappingDetail.entries.map(e => (
              <div key={e.id} className={clsx('p-3 rounded-lg border text-sm', GAP_COLOR[e.gap_class])}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-100">{e.id}</span>
                  <span className="text-[10px]">{GAP_LABEL[e.gap_class]} · jump {e.difficulty_jump}/5</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">{e.bridge_note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active batch progress */}
      {activeBatch && (
        <section className="mb-8 p-5 rounded-xl bg-zinc-900 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wide text-emerald-400">Active batch</h2>
            <span className="text-xs text-zinc-500">{activeBatch.batch_id}</span>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-2xl font-bold text-zinc-100">
              {activeBatch.completed_units} / {activeBatch.total_units}
            </div>
            <div className="text-sm text-zinc-400">
              {activeBatch.status}
              {activeBatch.failed_units > 0 && ` · ${activeBatch.failed_units} failed`}
            </div>
            <div className="text-sm text-emerald-400 ml-auto">
              ${activeBatch.total_cost_estimate_usd.toFixed(5)}
            </div>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${(activeBatch.completed_units / activeBatch.total_units) * 100}%` }}
            />
          </div>
        </section>
      )}

      {/* Generated content list */}
      {content.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
            Generated content ({content.length})
          </h2>
          <div className="space-y-2">
            {content.map(c => (
              <div key={c.content_id} className="rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden">
                <button
                  onClick={() => setExpandedContent(expandedContent === c.content_id ? null : c.content_id)}
                  className="w-full p-3 text-left hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-zinc-100">{c.title}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {c.unit_type} · {c.source} · {c.tokens_used ?? 0} tokens · ${(c.cost_usd ?? 0).toFixed(5)}
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {expandedContent === c.content_id ? '▼' : '▶'}
                    </span>
                  </div>
                </button>
                {expandedContent === c.content_id && (
                  <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                    <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {c.body_markdown}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent batches */}
      {batches.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
            Recent batches ({batches.length})
          </h2>
          <div className="space-y-1">
            {batches.map(b => (
              <button
                key={b.batch_id}
                onClick={() => setActiveBatch(b)}
                className="w-full text-left p-2 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">{b.batch_id}</span>
                  <span className={clsx(
                    b.status === 'completed' && 'text-emerald-400',
                    b.status === 'failed'    && 'text-red-400',
                    b.status === 'running'   && 'text-amber-400',
                  )}>
                    {b.status} · {b.completed_units}/{b.total_units}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
