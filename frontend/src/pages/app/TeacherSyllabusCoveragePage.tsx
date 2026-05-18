/**
 * TeacherSyllabusCoveragePage — class-level analytics for a syllabus bridge.
 *
 * Teachers see this when they want to know "where is my class stuck on the
 * way from TN State Board to JEE Main?" Three panels:
 *
 *   1. Roster — auto-loaded from the teacher's existing roster API
 *   2. Cohort gap report — runs against the picked mapping
 *   3. Per-entry actions — one-click "generate content here" for any entry
 *      that doesn't have ready content yet
 *
 * Routed at /teacher/syllabus-coverage.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '@/lib/auth/client';
import { clsx } from 'clsx';
import { Users, AlertTriangle, Send, Loader2, BookOpen, RefreshCw } from 'lucide-react';

interface Mapping {
  id: string;
  display_name: string;
  source_curriculum_id: string;
  target_exam_id: string;
}

interface CohortStat {
  entry_id: string;
  gap_class: 'aligned' | 'depth-gap' | 'breadth-gap' | 'foundation';
  students_struggling: number;
  cohort_size: number;
  cohort_avg_mastery: number;
  recommended_action: string;
}

interface MappingEntry {
  id: string;
  gap_class: 'aligned' | 'depth-gap' | 'breadth-gap' | 'foundation';
  difficulty_jump: number;
  bridge_note: string;
}

interface MappingDetail { entries: MappingEntry[]; }

interface GeneratedContentItem {
  content_id: string; unit_id: string; mapping_entry_id: string;
  unit_type: string; title: string;
}

const GAP_COLOR: Record<CohortStat['gap_class'], string> = {
  'aligned':     'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  'depth-gap':   'bg-amber-500/10  border-amber-500/30  text-amber-300',
  'breadth-gap': 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  'foundation':  'bg-red-500/10    border-red-500/30    text-red-300',
};

export default function TeacherSyllabusCoveragePage() {
  // Mapping picker
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [mappingDetail, setMappingDetail] = useState<MappingDetail | null>(null);

  // Roster — auto-load from teaching API; fallback to paste
  const [rosterIds, setRosterIds] = useState<string[]>([]);
  const [pastedIds, setPastedIds] = useState('');
  const [usePastedRoster, setUsePastedRoster] = useState(false);

  // Cohort stats + per-entry content map
  const [stats, setStats] = useState<CohortStat[] | null>(null);
  const [contentByEntry, setContentByEntry] = useState<Record<string, GeneratedContentItem[]>>({});

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingEntryId, setGeneratingEntryId] = useState<string | null>(null);

  // ---- Initial load ----
  useEffect(() => {
    (async () => {
      try {
        const [mapRes, rosterRes] = await Promise.all([
          authFetch('/api/syllabus-bridge/mappings'),
          authFetch('/api/teaching/roster').catch(() => null),
        ]);
        if (mapRes.ok) {
          const { mappings: ms } = await mapRes.json();
          setMappings(ms);
          if (ms.length === 1) setSelectedMappingId(ms[0].id);
        }
        if (rosterRes?.ok) {
          const data = await rosterRes.json();
          // Teaching roster endpoint variants — pick whichever shape is present
          const ids: string[] = (data.students ?? data.roster ?? data)
            ?.map?.((s: any) => s.user_id ?? s.id ?? s.student_id)
            .filter(Boolean) ?? [];
          setRosterIds(ids);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- When mapping changes, load detail + generated content map ----
  const refreshMappingData = useCallback(async (mappingId: string) => {
    try {
      const [detRes, contentRes] = await Promise.all([
        authFetch(`/api/syllabus-bridge/mappings/${mappingId}`),
        authFetch(`/api/syllabus-bridge/content/by-mapping/${mappingId}`),
      ]);
      if (detRes.ok) {
        const { mapping } = await detRes.json();
        setMappingDetail({ entries: mapping.entries });
      }
      if (contentRes.ok) {
        const { content } = await contentRes.json() as { content: GeneratedContentItem[] };
        const byEntry: Record<string, GeneratedContentItem[]> = {};
        for (const c of content) {
          (byEntry[c.mapping_entry_id] ??= []).push(c);
        }
        setContentByEntry(byEntry);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (selectedMappingId) refreshMappingData(selectedMappingId);
  }, [selectedMappingId, refreshMappingData]);

  // ---- Actions ----

  const effectiveRoster = (): string[] => {
    if (usePastedRoster) {
      return pastedIds.split(',').map(s => s.trim()).filter(Boolean);
    }
    return rosterIds;
  };

  const runReport = async () => {
    if (!selectedMappingId) return;
    const ids = effectiveRoster();
    if (ids.length === 0) {
      setError('No students in roster — paste comma-separated ids below to test');
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const r = await authFetch(`/api/syllabus-bridge/mappings/${selectedMappingId}/cohort-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: ids }),
      });
      if (!r.ok) throw new Error((await r.json()).error || `Cohort report failed: ${r.status}`);
      const { stats: s } = await r.json();
      setStats(s);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const generateForEntry = async (entry_id: string) => {
    if (!selectedMappingId || !mappingDetail) return;
    setGeneratingEntryId(entry_id);
    setError(null);
    try {
      // Get the plan, filter to units for this entry, submit a batch with those.
      const planRes = await authFetch(`/api/syllabus-bridge/mappings/${selectedMappingId}/plan`);
      if (!planRes.ok) throw new Error('Could not load plan');
      const plan = await planRes.json();
      const unitIds: string[] = [];
      for (const [eid, units] of Object.entries(plan.grouped_by_entry as Record<string, any[]>)) {
        if (eid === entry_id) unitIds.push(...units.map((u: any) => u.unit_id));
      }
      if (unitIds.length === 0) throw new Error('No units in plan for this entry');

      const r = await authFetch('/api/syllabus-bridge/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping_id: selectedMappingId, unit_ids: unitIds }),
      });
      if (!r.ok) throw new Error((await r.json()).error || `Generate failed: ${r.status}`);
      // Refresh content map after a short delay (batch runs in setImmediate)
      setTimeout(() => refreshMappingData(selectedMappingId), 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingEntryId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-16">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-2xl font-bold text-zinc-100">Syllabus Coverage — your class</h1>
        <Link to="/teacher" className="text-xs text-zinc-500 hover:text-zinc-300">← Teacher home</Link>
      </div>
      <p className="text-sm text-zinc-400 mb-6 max-w-2xl">
        See where your students are stuck on the bridge from a school syllabus to their target exam.
        Each row is a curriculum gap; the action column tells you what to do next.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm">{error}</div>
      )}

      {/* Mapping picker */}
      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Bridge mapping</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mappings.map(m => (
            <button key={m.id} onClick={() => { setSelectedMappingId(m.id); setStats(null); }} className={clsx(
              'text-left p-3 rounded-xl border transition-colors',
              selectedMappingId === m.id ? 'bg-sky-500/10 border-sky-500/40' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
            )}>
              <div className="text-sm font-semibold text-zinc-100">{m.display_name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Roster */}
      <section className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5"/> Your roster
          </h2>
          <div className="text-xs text-zinc-400">
            {usePastedRoster
              ? `${pastedIds.split(',').filter(Boolean).length} pasted ids`
              : `${rosterIds.length} students from /api/teaching/roster`}
          </div>
        </div>
        <label className="flex items-center gap-2 mb-2 text-xs text-zinc-400">
          <input type="checkbox" checked={usePastedRoster} onChange={e => setUsePastedRoster(e.target.checked)} className="accent-sky-500"/>
          Use pasted ids instead (testing or ad-hoc cohort)
        </label>
        {usePastedRoster && (
          <textarea
            value={pastedIds} onChange={e => setPastedIds(e.target.value)}
            placeholder="Comma-separated student ids"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:border-sky-500 focus:outline-none"
          />
        )}
        <button
          onClick={runReport}
          disabled={!selectedMappingId || running}
          className={clsx(
            'mt-2 w-full py-2.5 rounded-lg text-sm font-medium transition-colors',
            running ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-sky-500 text-white hover:bg-sky-400',
          )}
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Run gap report against my class'}
        </button>
      </section>

      {/* Cohort gap report */}
      {stats && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5"/>
              Class gap report — top {stats.length} entries by struggle count
            </h2>
            <button
              onClick={runReport}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3"/> refresh
            </button>
          </div>
          <div className="space-y-2">
            {stats.map(s => {
              const entry = mappingDetail?.entries.find(e => e.id === s.entry_id);
              const generated = contentByEntry[s.entry_id] ?? [];
              const isGenerating = generatingEntryId === s.entry_id;
              return (
                <div key={s.entry_id} className={clsx('p-3 rounded-lg border', GAP_COLOR[s.gap_class])}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-100">{s.entry_id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/40 text-zinc-300">
                          {s.gap_class}{entry ? ` · jump ${entry.difficulty_jump}/5` : ''}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-200 mt-1 italic">{s.recommended_action}</div>
                      {entry?.bridge_note && (
                        <div className="text-[11px] text-zinc-400 mt-1.5">{entry.bridge_note}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold text-zinc-100">
                        {s.students_struggling}/{s.cohort_size}
                      </div>
                      <div className="text-[10px] text-zinc-400">struggling</div>
                      <div className="text-[10px] text-zinc-500">avg mastery {Math.round(s.cohort_avg_mastery * 100)}%</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {generated.length > 0 ? (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <BookOpen className="w-3 h-3"/>
                        {generated.length} unit{generated.length === 1 ? '' : 's'} generated · students can see them now
                      </span>
                    ) : (
                      <button
                        onClick={() => generateForEntry(s.entry_id)}
                        disabled={isGenerating}
                        className={clsx(
                          'flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors',
                          isGenerating
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40',
                        )}
                      >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3"/>}
                        Generate material for this gap
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!stats && (
        <div className="text-center py-12 text-zinc-500 text-sm">
          Pick a mapping above and run the gap report to see where your class stands.
        </div>
      )}
    </div>
  );
}
