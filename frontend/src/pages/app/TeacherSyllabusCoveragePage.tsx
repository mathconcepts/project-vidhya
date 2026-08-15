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

type GapStyle = { background: string; border: string; color: string };

const GAP_COLOR: Record<CohortStat['gap_class'], GapStyle> = {
  'aligned':     { background: 'rgba(52,199,89,.06)',  border: '1px solid rgba(52,199,89,.22)',  color: 'var(--green-ink)' },
  'depth-gap':   { background: 'rgba(255,159,10,.06)',  border: '1px solid rgba(255,159,10,.22)',  color: 'var(--orange)' },
  'breadth-gap': { background: 'rgba(255,159,10,.06)',  border: '1px solid rgba(255,159,10,.22)',  color: 'var(--orange)' },
  'foundation':  { background: 'rgba(255,59,48,.06)',  border: '1px solid rgba(255,59,48,.22)',  color: 'var(--red)' },
};

type RosterRow = { user_id?: string; id?: string; student_id?: string };

export default function TeacherSyllabusCoveragePage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [mappingDetail, setMappingDetail] = useState<MappingDetail | null>(null);

  const [rosterIds, setRosterIds] = useState<string[]>([]);
  const [pastedIds, setPastedIds] = useState('');
  const [usePastedRoster, setUsePastedRoster] = useState(false);

  const [stats, setStats] = useState<CohortStat[] | null>(null);
  const [contentByEntry, setContentByEntry] = useState<Record<string, GeneratedContentItem[]>>({});

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingEntryId, setGeneratingEntryId] = useState<string | null>(null);

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
          const rows: RosterRow[] = (data.students ?? data.roster ?? data) as RosterRow[];
          const ids: string[] = rows?.map(s => (s.user_id ?? s.id ?? s.student_id) as string).filter(Boolean) ?? [];
          setRosterIds(ids);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Report failed');
    } finally {
      setRunning(false);
    }
  };

  const generateForEntry = async (entry_id: string) => {
    if (!selectedMappingId || !mappingDetail) return;
    setGeneratingEntryId(entry_id);
    setError(null);
    try {
      const planRes = await authFetch(`/api/syllabus-bridge/mappings/${selectedMappingId}/plan`);
      if (!planRes.ok) throw new Error('Could not load plan');
      const plan = await planRes.json();
      const unitIds: string[] = [];
      for (const [eid, units] of Object.entries(plan.grouped_by_entry as Record<string, Array<{ unit_id: string }>>)) {
        if (eid === entry_id) unitIds.push(...units.map(u => u.unit_id));
      }
      if (unitIds.length === 0) throw new Error('No units in plan for this entry');

      const r = await authFetch('/api/syllabus-bridge/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping_id: selectedMappingId, unit_ids: unitIds }),
      });
      if (!r.ok) throw new Error((await r.json()).error || `Generate failed: ${r.status}`);
      setTimeout(() => refreshMappingData(selectedMappingId), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generate failed');
    } finally {
      setGeneratingEntryId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 896, margin: '0 auto', padding: '24px 16px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
          Syllabus Coverage — your class
        </h1>
        <Link to="/teacher" style={{ fontSize: 11, color: 'var(--text-tertiary)', textDecoration: 'none' }}>
          ← Teacher home
        </Link>
      </div>
      <p style={{ margin: '0 0 24px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', maxWidth: 600 }}>
        See where your students are stuck on the bridge from a school syllabus to their target exam.
        Each row is a curriculum gap; the action column tells you what to do next.
      </p>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {/* Mapping picker */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 'var(--weight-medium)' }}>
          Bridge mapping
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {mappings.map(m => (
            <button
              key={m.id}
              onClick={() => { setSelectedMappingId(m.id); setStats(null); }}
              style={{
                textAlign: 'left',
                padding: 12,
                borderRadius: 'var(--radius-md)',
                border: selectedMappingId === m.id ? '1px solid rgba(88,86,214,.3)' : 'var(--hairline) solid var(--separator)',
                background: selectedMappingId === m.id ? 'rgba(88,86,214,.08)' : 'var(--surface-card)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: selectedMappingId === m.id ? 'var(--indigo-ink)' : 'var(--text-primary)' }}>
                {m.display_name}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Roster */}
      <section style={{ marginBottom: 24, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 'var(--weight-medium)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={12} /> Your roster
          </h2>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {usePastedRoster
              ? `${pastedIds.split(',').filter(Boolean).length} pasted ids`
              : rosterIds.length
                ? `${rosterIds.length} students`
                : 'No roster loaded — paste student ids below'}
          </span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={usePastedRoster} onChange={e => setUsePastedRoster(e.target.checked)} />
          Use pasted ids instead (testing or ad-hoc cohort)
        </label>
        {usePastedRoster && (
          <textarea
            value={pastedIds}
            onChange={e => setPastedIds(e.target.value)}
            placeholder="Comma-separated student ids"
            rows={2}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', fontSize: 11, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', outline: 'none', boxSizing: 'border-box', marginBottom: 8, resize: 'vertical' }}
          />
        )}
        <button
          onClick={runReport}
          disabled={!selectedMappingId || running}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '10px 0',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: 'var(--text-caption)',
            fontWeight: 'var(--weight-medium)',
            cursor: (!selectedMappingId || running) ? 'not-allowed' : 'pointer',
            background: (!selectedMappingId || running) ? 'var(--surface-fill)' : 'var(--indigo)',
            color: (!selectedMappingId || running) ? 'var(--text-tertiary)' : '#fff',
          }}
        >
          {running
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Loader2 size={14} className="animate-spin" /> Running…</span>
            : 'Run gap report against my class'}
        </button>
      </section>

      {/* Cohort gap report */}
      {stats && (
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 'var(--weight-medium)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={12} />
              Class gap report — top {stats.length} entries by struggle count
            </h2>
            <button
              onClick={runReport}
              style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RefreshCw size={11} /> refresh
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.map(s => {
              const entry = mappingDetail?.entries.find(e => e.id === s.entry_id);
              const generated = contentByEntry[s.entry_id] ?? [];
              const isGenerating = generatingEntryId === s.entry_id;
              const gapStyle = GAP_COLOR[s.gap_class];
              return (
                <div key={s.entry_id} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: gapStyle.background, border: gapStyle.border }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)' }}>{s.entry_id}</span>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,.06)', color: 'var(--text-secondary)' }}>
                          {s.gap_class}{entry ? ` · jump ${entry.difficulty_jump}/5` : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>{s.recommended_action}</div>
                      {entry?.bridge_note && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>{entry.bridge_note}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {s.students_struggling}/{s.cohort_size}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>struggling</div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>avg mastery {Math.round(s.cohort_avg_mastery * 100)}%</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {generated.length > 0 ? (
                      <span style={{ fontSize: 11, color: 'var(--green-ink)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BookOpen size={12} />
                        {generated.length} unit{generated.length === 1 ? '' : 's'} generated · students can see them now
                      </span>
                    ) : (
                      <button
                        onClick={() => generateForEntry(s.entry_id)}
                        disabled={isGenerating}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: isGenerating ? 'not-allowed' : 'pointer',
                          background: isGenerating ? 'var(--surface-fill)' : 'rgba(88,86,214,.08)',
                          border: isGenerating ? 'var(--hairline) solid var(--separator)' : '1px solid rgba(88,86,214,.3)',
                          color: isGenerating ? 'var(--text-tertiary)' : 'var(--indigo-ink)',
                        }}
                      >
                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
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
        <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          Pick a mapping above and run the gap report to see where your class stands.
        </div>
      )}
    </div>
  );
}
