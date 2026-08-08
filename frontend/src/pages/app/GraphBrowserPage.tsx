/**
 * GraphBrowserPage — admin dashboard at /admin/graph.
 *
 * Mission Control, "Graph editor" panel (SOTA-Facelift-CEO-Review.md §7)
 * — deliberately scoped down to a READ-ONLY browser this batch. §7 lists
 * "graph editor" as a Phase-1 panel, but §15's own phase-sequencing table
 * places full graph editing + versioning + publish/rollback in
 * **Phase 2 ("Graph Product")**. We're resolving that in-document
 * discrepancy in favor of §15 (the more specific, load-bearing table)
 * rather than shipping an unreviewed CRUD+versioning editor.
 *
 * What this page shows:
 *   - A live DAG-integrity check (findPrerequisiteCycle re-run on demand
 *     from the admin surface — concept-graph.ts already refuses to boot
 *     the server on a cyclic graph, so this should always read clean
 *     today; it's a visible confirmation of that invariant, and will
 *     matter more once Phase 2 lets exam packs carry independent graphs).
 *   - The concept table (topic, difficulty, GATE frequency, prerequisite
 *     count), filterable by topic.
 *   - An exam picker showing each registered exam's declared concept
 *     count and any "stub" concept ids it references that don't have a
 *     real concept-graph node yet.
 *
 * Explicitly NOT here: editing a concept, adding/removing a prerequisite
 * edge, publishing a new graph version. Those are Phase 2.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Network, CheckCircle2, XCircle, Loader2, Shield, RefreshCw, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/lib/auth/roles';
import { trackEvent } from '@/lib/analytics';
import {
  getGraphSummary, GraphApiError,
  type GraphSummary, type ConceptSummary, type ExamSummary, type GateFrequency,
} from '@/api/admin/graph';

type Tone = 'good' | 'bad' | 'warn' | 'neutral';

/** Pure — groups concepts by topic, sorted by topic name; concepts within
 *  a topic sorted by id for a stable render order. Exported for tests. */
export function groupByTopic(concepts: ConceptSummary[]): Array<{ topic: string; concepts: ConceptSummary[] }> {
  const byTopic = new Map<string, ConceptSummary[]>();
  for (const c of concepts) {
    const list = byTopic.get(c.topic) ?? [];
    list.push(c);
    byTopic.set(c.topic, list);
  }
  return Array.from(byTopic.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([topic, list]) => ({ topic, concepts: [...list].sort((a, b) => a.id.localeCompare(b.id)) }));
}

/** Pure — badge tone for a GATE-frequency value. Exported for tests. */
export function frequencyTone(freq: GateFrequency): Tone {
  switch (freq) {
    case 'high':
      return 'good';
    case 'medium':
      return 'neutral';
    case 'low':
      return 'warn';
    case 'rare':
    default:
      return 'warn';
  }
}

/** Pure — banner tone for the DAG-health check. Exported for tests. */
export function dagHealthTone(dagHealth: GraphSummary['dag_health'] | null): Tone {
  if (!dagHealth) return 'neutral';
  return dagHealth.ok ? 'good' : 'bad';
}

export const __testing = { groupByTopic, frequencyTone, dagHealthTone };

const TONE_COLOR: Record<Tone, string> = {
  good: 'var(--green-ink)',
  bad: 'var(--red)',
  warn: 'var(--orange-ink)',
  neutral: 'var(--text-tertiary)',
};

export default function GraphBrowserPage() {
  const { user, loading: authLoading } = useAuth();

  const [summary, setSummary] = useState<GraphSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await getGraphSummary());
      setError(null);
    } catch (e) {
      setError(e instanceof GraphApiError ? e.message : (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    trackEvent('page_view', { page: 'admin-graph-browser' });
    if (authLoading || !user || !isAdminRole(user.role)) return;
    void loadSummary();
  }, [authLoading, user, loadSummary]);

  const grouped = useMemo(() => groupByTopic(summary?.concepts ?? []), [summary]);
  const topics = useMemo(() => grouped.map((g) => g.topic), [grouped]);
  const visibleGroups = topicFilter === 'all' ? grouped : grouped.filter((g) => g.topic === topicFilter);

  const selectedExam: ExamSummary | null = useMemo(
    () => summary?.exams.find((e) => e.id === selectedExamId) ?? null,
    [summary, selectedExamId],
  );

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <Loader2 className="animate-spin" size={20} style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Shield size={40} style={{ color: 'var(--text-tertiary)' }} />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Admin access required</h2>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>Graph browser is gated to admin accounts.</p>
      </div>
    );
  }

  const dagTone = dagHealthTone(summary?.dag_health ?? null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Network size={18} style={{ color: 'var(--indigo-ink)' }} />
            Graph browser
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            Read-only concept graph view. Editing, new edges, and publish/rollback are Phase 2 — this is the
            diagnostic + reference view for now.
          </p>
        </div>
        <button
          onClick={() => void loadSummary()}
          aria-label="Refresh graph summary"
          style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)', cursor: 'pointer' }}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {loading && !summary && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Loader2 className="animate-spin" size={18} style={{ color: 'var(--indigo-ink)' }} />
        </div>
      )}

      {summary && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 14,
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${dagTone === 'good' ? 'rgba(52,199,89,.22)' : 'rgba(255,59,48,.22)'}`,
            background: dagTone === 'good' ? 'rgba(52,199,89,.06)' : 'rgba(255,59,48,.06)',
          }}>
            {dagTone === 'good'
              ? <CheckCircle2 size={16} style={{ color: 'var(--green-ink)' }} />
              : <XCircle size={16} style={{ color: 'var(--red)' }} />}
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: dagTone === 'good' ? 'var(--green-ink)' : 'var(--red)' }}>
              {dagTone === 'good'
                ? `Prerequisite DAG is healthy — ${summary.concepts.length} concepts, no cycles.`
                : `Prerequisite cycle detected: ${summary.dag_health.cycle?.join(' → ')}`}
            </span>
          </div>

          <div style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Concepts</h2>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                style={{ fontSize: 11, padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', color: 'var(--text-secondary)' }}
              >
                <option value="all">All topics ({summary.concepts.length})</option>
                {topics.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {visibleGroups.map((group) => (
              <div key={group.topic} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 'var(--weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {group.topic} ({group.concepts.length})
                </div>
                {group.concepts.map((c) => {
                  const t = frequencyTone(c.gate_frequency);
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderTop: 'var(--hairline) solid var(--separator)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{c.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          {c.id}{c.prerequisites.length > 0 ? ` · ${c.prerequisites.length} prereq${c.prerequisites.length === 1 ? '' : 's'}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>diff {c.difficulty_base.toFixed(2)}</span>
                        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--weight-medium)', color: TONE_COLOR[t] }}>
                          {c.gate_frequency}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <BookOpen size={14} style={{ color: 'var(--indigo-ink)' }} />
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Exams</h2>
            </div>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              style={{ fontSize: 12, padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', color: 'var(--text-secondary)', width: '100%' }}
            >
              <option value="">Select an exam…</option>
              {summary.exams.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
              ))}
            </select>

            {selectedExam && (
              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  {selectedExam.is_registered_syllabus
                    ? 'Registered generation syllabus.'
                    : 'Not a registered generation syllabus (no data/curriculum/*.yml scope resolution today).'}
                </div>
                <div>{selectedExam.declared_concept_count} concept id{selectedExam.declared_concept_count === 1 ? '' : 's'} declared in this exam's syllabus.</div>
                {selectedExam.stub_concept_ids.length > 0 ? (
                  <div>
                    <div style={{ color: 'var(--orange-ink)', fontWeight: 'var(--weight-medium)' }}>
                      {selectedExam.stub_concept_ids.length} declared as stubs — no concept-graph node yet:
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {selectedExam.stub_concept_ids.join(', ')}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--green-ink)' }}>No unresolved stub concepts.</div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
