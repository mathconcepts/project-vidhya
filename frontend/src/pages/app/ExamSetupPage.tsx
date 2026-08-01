import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Plus, Sparkles, Upload, MessageCircle, Edit3,
  CheckCircle, Archive, Loader2, RefreshCw, ChevronRight, Search,
  AlertCircle, FileText, Send, X, Lightbulb, Globe, Hash,
  GitCompare, Link2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';

interface ExamSummary {
  id: string;
  code: string;
  name: string;
  level: string;
  completeness: number;
  is_draft: boolean;
  is_archived: boolean;
  country?: string;
  issuing_body?: string;
  created_at: string;
  updated_at: string;
}

interface ExamFull extends ExamSummary {
  description?: string;
  official_url?: string;
  duration_minutes?: number;
  total_marks?: number;
  sections?: any[];
  marking_scheme?: any;
  question_types?: any;
  syllabus?: any[];
  next_attempt_date?: string;
  frequency?: string;
  typical_prep_weeks?: number;
  eligibility?: string;
  local_data: any[];
  provenance: Record<string, any>;
}

interface Breakdown {
  category: string;
  filled: number;
  total: number;
  missing_fields: string[];
}

interface Suggestion {
  field: string;
  label: string;
  reason: string;
}

interface AssistantTurn {
  role: 'admin' | 'assistant';
  content: string;
  suggestions?: string[];
  timestamp: string;
}

/*
 * v2.7 refactor roadmap (Phase 3 deferred):
 * The 1318-line monolith contains ExamDetailView + 4 tab components +
 * CreateExamModal + SimilarExamsPanel + CompareDrawer + helpers. The tab
 * pattern is sound — what's left is file-level extraction, not architecture
 * redesign. Splitting tabs into `frontend/src/components/exam-setup/<TabName>.tsx`
 * shrinks the parent to ~300 lines.
 *
 * Not done in this PR because (1) the architecture (tabs for an EDIT view) is
 * correct, (2) the file works, (3) gate/→app/ dir rename ships first.
 * When next touched: extract the 4 tabs, then evaluate a wizard variant for
 * first-time exam creation (CreateExamModal already covers basic cases).
 */
type Tab = 'overview' | 'fields' | 'local' | 'assistant';

export default function ExamSetupPage() {
  const { hasRole } = useAuth();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<ExamFull | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [enrichmentAvailable, setEnrichmentAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch('/api/exams?include_archived=false');
      if (r.status === 403) { setError('Admin role required.'); return; }
      if (!r.ok) { setError(`HTTP ${r.status}`); return; }
      const data = await r.json();
      setExams(data.exams || []);
      setEnrichmentAvailable(data.enrichment_available);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExam = useCallback(async (id: string) => {
    try {
      const r = await authFetch(`/api/exams/${id}`);
      if (!r.ok) return;
      const data = await r.json();
      setSelectedExam(data.exam);
      setBreakdown(data.breakdown || []);
      setSuggestions(data.suggestions || []);
    } catch {}
  }, []);

  useEffect(() => { if (hasRole('admin')) refresh(); else setLoading(false); }, [hasRole, refresh]);
  useEffect(() => { if (selectedId) loadExam(selectedId); }, [selectedId, loadExam]);

  if (!hasRole('admin')) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-2">
        <AlertCircle size={24} className="mx-auto" style={{ color: 'var(--orange)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Admin role required.</p>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // Detail view
  // ────────────────────────────────────────────────────────────
  if (selectedId && selectedExam) {
    return (
      <ExamDetailView
        exam={selectedExam}
        breakdown={breakdown}
        suggestions={suggestions}
        enrichmentAvailable={enrichmentAvailable}
        tab={tab}
        setTab={setTab}
        onBack={() => { setSelectedId(null); setSelectedExam(null); refresh(); }}
        onRefresh={() => loadExam(selectedId)}
      />
    );
  }

  // ────────────────────────────────────────────────────────────
  // List view
  // ────────────────────────────────────────────────────────────
  return (
    <motion.div className="space-y-4 max-w-4xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <GraduationCap size={20} style={{ color: 'var(--indigo-ink)' }} />
            Exam Setup
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Define exams once, assign them to many students.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 h-9 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
            style={{ background: 'var(--indigo)', color: '#fff' }}
          >
            <Plus size={13} />
            New exam
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg"
            style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)' }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>
      </motion.div>

      {!enrichmentAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl flex items-start gap-2.5"
          style={{ background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)' }}
        >
          <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--orange)' }} />
          <div className="text-[11px] leading-relaxed" style={{ color: 'var(--orange)' }}>
            <span className="font-medium">Auto-enrichment is disabled.</span>{' '}
            No LLM provider is configured. You can still add exams manually — set <code>GEMINI_API_KEY</code>, <code>ANTHROPIC_API_KEY</code>, or <code>OPENAI_API_KEY</code> in the server environment to enable automatic field filling.
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl text-xs"
          style={{ background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', color: 'var(--red)' }}
        >
          {error}
        </motion.div>
      )}

      {loading && exams.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <Loader2 size={14} className="inline animate-spin mr-2" />Loading exams...
        </div>
      ) : exams.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-xl text-center space-y-3"
          style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
        >
          <GraduationCap size={28} className="mx-auto" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No exams defined yet.</p>
          <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Add an exam with just its name and level. Fill in the rest over time — auto-enrichment, local uploads, or manually.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 h-9 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
            style={{ background: 'var(--indigo)', color: '#fff' }}
          >
            <Plus size={13} />
            Create your first exam
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          {exams.map(e => (
            <button
              key={e.id}
              onClick={() => { setSelectedId(e.id); setTab('overview'); }}
              className="w-full p-3 rounded-xl flex items-center gap-3 text-left transition-colors group"
              style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{e.name}</p>
                  {e.is_draft && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
                      style={{ background: 'rgba(255,149,0,.06)', color: 'var(--orange)' }}
                    >
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  <code style={{ color: 'var(--indigo-ink)' }}>{e.code}</code>
                  {e.issuing_body && <span> · {e.issuing_body}</span>}
                  {e.country && <span> · {e.country}</span>}
                </p>
                <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--text-tertiary)' }}>{e.id}</p>
              </div>
              <div className="text-right shrink-0">
                <CompletenessBadge value={e.completeness} />
              </div>
              <ChevronRight size={14} className="shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            </button>
          ))}
        </motion.div>
      )}

      {showCreate && (
        <CreateExamModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); refresh(); setSelectedId(id); setTab('assistant'); }}
        />
      )}
    </motion.div>
  );
}

// ============================================================================
// Detail view
// ============================================================================

function ExamDetailView({
  exam, breakdown, suggestions, enrichmentAvailable, tab, setTab, onBack, onRefresh,
}: {
  exam: ExamFull;
  breakdown: Breakdown[];
  suggestions: Suggestion[];
  enrichmentAvailable: boolean;
  tab: Tab;
  setTab: (t: Tab) => void;
  onBack: () => void;
  onRefresh: () => void;
}) {
  return (
    <motion.div className="space-y-4 max-w-4xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <button
            onClick={onBack}
            className="text-[11px] mb-1"
            style={{ color: 'var(--indigo-ink)' }}
          >
            ← All exams
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2 flex-wrap" style={{ color: 'var(--text-primary)' }}>
            <GraduationCap size={18} className="shrink-0" style={{ color: 'var(--indigo-ink)' }} />
            {exam.name}
            {exam.is_draft && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
                style={{ background: 'rgba(255,149,0,.06)', color: 'var(--orange)' }}
              >
                Draft
              </span>
            )}
          </h1>
          <p className="text-[11px] mt-0.5 font-mono flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
            <Hash size={10} />
            {exam.id}
          </p>
        </div>
        <div className="text-right shrink-0">
          <CompletenessBadge value={exam.completeness} size="lg" />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="inline-flex rounded-lg p-0.5 gap-0.5 flex-wrap"
        style={{ background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}
      >
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={Globe} label="Overview" />
        <TabButton active={tab === 'fields'} onClick={() => setTab('fields')} icon={Edit3} label="Fields" />
        <TabButton active={tab === 'local'} onClick={() => setTab('local')} icon={Upload} label={`Local data (${exam.local_data.length})`} />
        <TabButton active={tab === 'assistant'} onClick={() => setTab('assistant')} icon={MessageCircle} label="Assistant" />
      </motion.div>

      {tab === 'overview' && (
        <OverviewTab
          exam={exam}
          breakdown={breakdown}
          suggestions={suggestions}
          enrichmentAvailable={enrichmentAvailable}
          onRefresh={onRefresh}
        />
      )}
      {tab === 'fields' && <FieldsTab exam={exam} onRefresh={onRefresh} />}
      {tab === 'local' && <LocalDataTab exam={exam} onRefresh={onRefresh} />}
      {tab === 'assistant' && <AssistantTab exam={exam} onRefresh={onRefresh} />}
    </motion.div>
  );
}

// ============================================================================

function OverviewTab({ exam, breakdown, suggestions, enrichmentAvailable, onRefresh }: any) {
  const [enriching, setEnriching] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);

  const runEnrich = async () => {
    setEnriching(true);
    setProposal(null);
    try {
      const r = await authFetch(`/api/exams/${exam.id}/enrich`, { method: 'POST' });
      if (r.ok) setProposal(await r.json());
    } finally {
      setEnriching(false);
    }
  };

  const applyProposal = async () => {
    if (!proposal) return;
    setApplying(true);
    try {
      const r = await authFetch(`/api/exams/${exam.id}/enrich/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal: proposal.proposal }),
      });
      if (r.ok) { setProposal(null); onRefresh(); }
    } finally {
      setApplying(false);
    }
  };

  const markReady = async () => {
    setMarkingReady(true);
    try {
      const r = await authFetch(`/api/exams/${exam.id}/mark-ready`, { method: 'POST' });
      if (r.ok) onRefresh();
    } finally {
      setMarkingReady(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Completeness breakdown */}
      <div
        className="p-4 rounded-xl space-y-3"
        style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
      >
        <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-tertiary)' }}>Completeness breakdown</p>
        <div className="space-y-2">
          {breakdown.map((cat: Breakdown) => (
            <div key={cat.category}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>{cat.category}</span>
                <span
                  className="font-medium"
                  style={{ color: cat.filled === cat.total ? 'var(--green-ink)' : cat.filled === 0 ? 'var(--red)' : 'var(--orange)' }}
                >
                  {cat.filled} / {cat.total}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-fill)' }}>
                <div
                  className="h-full transition-all"
                  style={{ width: `${(cat.filled / cat.total) * 100}%`, background: 'var(--indigo)' }}
                />
              </div>
              {cat.missing_fields.length > 0 && (
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Missing: {cat.missing_fields.slice(0, 3).join(' · ')}
                  {cat.missing_fields.length > 3 && ` · +${cat.missing_fields.length - 3} more`}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div
          className="p-4 rounded-xl space-y-2"
          style={{ background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.22)' }}
        >
          <p className="text-[10px] uppercase tracking-wide font-medium flex items-center gap-1.5" style={{ color: 'var(--indigo-ink)' }}>
            <Lightbulb size={10} />
            Priority actions
          </p>
          {suggestions.map((s: Suggestion) => (
            <div key={s.field} className="text-xs">
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
              <p className="leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{s.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Similar exams */}
      <SimilarExamsPanel examId={exam.id} examName={exam.name} />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {enrichmentAvailable && (
          <button
            onClick={runEnrich}
            disabled={enriching}
            className="px-3 h-9 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: 'var(--indigo)', color: '#fff' }}
          >
            {enriching ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Auto-enrich from web
          </button>
        )}
        {exam.is_draft && exam.completeness >= 0.4 && (
          <button
            onClick={markReady}
            disabled={markingReady}
            className="px-3 h-9 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: 'var(--green)', color: '#fff' }}
          >
            {markingReady ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
            Mark ready for students
          </button>
        )}
      </div>

      {/* Proposal preview */}
      {proposal && (
        <div
          className="p-4 rounded-xl space-y-3"
          style={{ background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--green-ink)' }}>
              Enrichment proposal
            </p>
            <button onClick={() => setProposal(null)} style={{ color: 'var(--text-tertiary)' }}>
              <X size={12} />
            </button>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {proposal.proposal.notes}
          </p>
          {proposal.merge_preview.would_update_fields.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Would fill:</p>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{proposal.merge_preview.would_update_fields.join(', ')}</p>
              {proposal.merge_preview.would_skip_fields.length > 0 && (
                <>
                  <p className="text-[10px] uppercase mt-1" style={{ color: 'var(--text-tertiary)' }}>Would skip (you already set these):</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{proposal.merge_preview.would_skip_fields.join(', ')}</p>
                </>
              )}
            </div>
          ) : (
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>No new fields to fill.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={applyProposal}
              disabled={applying || proposal.merge_preview.would_update_fields.length === 0}
              className="px-3 h-8 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: 'var(--green)', color: '#fff' }}
            >
              {applying ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
              Apply
            </button>
            <button
              onClick={() => setProposal(null)}
              className="px-3 h-8 rounded-lg text-xs font-medium"
              style={{ background: 'var(--surface-fill)', color: 'var(--text-secondary)' }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div
        className="p-4 rounded-xl space-y-2 text-xs"
        style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
      >
        <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-tertiary)' }}>Summary</p>
        <OverviewRow label="Code" value={<code style={{ color: 'var(--indigo-ink)' }}>{exam.code}</code>} />
        <OverviewRow label="Level" value={exam.level} />
        {exam.country && <OverviewRow label="Country" value={exam.country} />}
        {exam.issuing_body && <OverviewRow label="Issuing body" value={exam.issuing_body} />}
        {exam.duration_minutes && <OverviewRow label="Duration" value={`${exam.duration_minutes} min`} />}
        {exam.total_marks && <OverviewRow label="Total marks" value={String(exam.total_marks)} />}
        {exam.syllabus && <OverviewRow label="Syllabus topics" value={String(exam.syllabus.length)} />}
        {exam.next_attempt_date && <OverviewRow label="Next attempt" value={exam.next_attempt_date} />}
        {exam.description && (
          <div className="pt-2" style={{ borderTop: 'var(--hairline) solid var(--separator)' }}>
            <p className="text-[10px] mb-1 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Description</p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{exam.description}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function OverviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="text-right" style={{ color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  );
}

// ============================================================================

function FieldsTab({ exam, onRefresh }: { exam: ExamFull; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Partial<ExamFull>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (Object.keys(editing).length === 0) return;
    setSaving(true);
    try {
      const r = await authFetch(`/api/exams/${exam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      if (r.ok) {
        setEditing({});
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onRefresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: string, value: any) => {
    setEditing(prev => ({ ...prev, [key]: value }));
  };
  const val = (key: string) => (editing as any)[key] ?? (exam as any)[key] ?? '';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <FieldGroup title="Basics">
        <FieldInput label="Issuing body" value={val('issuing_body')} onChange={(v: string) => setField('issuing_body', v)} provenance={exam.provenance.issuing_body} placeholder="e.g. IIT Madras" />
        <FieldInput label="Country" value={val('country')} onChange={(v: string) => setField('country', v)} provenance={exam.provenance.country} placeholder="e.g. India" />
        <FieldInput label="Official URL" value={val('official_url')} onChange={(v: string) => setField('official_url', v)} provenance={exam.provenance.official_url} placeholder="https://..." />
        <FieldTextarea label="Description" value={val('description')} onChange={(v: string) => setField('description', v)} provenance={exam.provenance.description} placeholder="A brief summary of this exam." />
      </FieldGroup>

      <FieldGroup title="Structure">
        <FieldInput label="Duration (minutes)" value={val('duration_minutes')} onChange={(v: string) => setField('duration_minutes', parseInt(v) || undefined)} type="number" provenance={exam.provenance.duration_minutes} placeholder="180" />
        <FieldInput label="Total marks" value={val('total_marks')} onChange={(v: string) => setField('total_marks', parseInt(v) || undefined)} type="number" provenance={exam.provenance.total_marks} placeholder="100" />
      </FieldGroup>

      <FieldGroup title="Schedule">
        <FieldInput label="Next exam date" value={val('next_attempt_date')} onChange={(v: string) => setField('next_attempt_date', v)} type="date" provenance={exam.provenance.next_attempt_date} />
        <FieldInput label="Frequency" value={val('frequency')} onChange={(v: string) => setField('frequency', v)} provenance={exam.provenance.frequency} placeholder="annual | biannual | ..." />
        <FieldInput label="Typical prep (weeks)" value={val('typical_prep_weeks')} onChange={(v: string) => setField('typical_prep_weeks', parseInt(v) || undefined)} type="number" provenance={exam.provenance.typical_prep_weeks} placeholder="12" />
      </FieldGroup>

      <FieldGroup title="Eligibility">
        <FieldTextarea label="Eligibility" value={val('eligibility')} onChange={(v: string) => setField('eligibility', v)} provenance={exam.provenance.eligibility} placeholder="Who can appear — age limits, qualifications, etc." />
      </FieldGroup>

      <FieldGroup title="Admin notes">
        <FieldTextarea label="Admin notes" value={val('admin_notes')} onChange={(v: string) => setField('admin_notes', v)} placeholder="Private notes not shown to students." />
      </FieldGroup>

      {Object.keys(editing).length > 0 && (
        <div
          className="sticky bottom-4 z-10 p-3 rounded-xl flex items-center justify-between gap-3"
          style={{ background: 'var(--surface-card)', border: '1px solid rgba(88,86,214,.22)', boxShadow: 'var(--shadow-raise)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {Object.keys(editing).length} field{Object.keys(editing).length !== 1 ? 's' : ''} changed
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing({})}
              className="px-3 h-8 rounded-lg text-xs font-medium"
              style={{ background: 'var(--surface-fill)', color: 'var(--text-secondary)' }}
            >
              Discard
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-3 h-8 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: 'var(--indigo)', color: '#fff' }}
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : saved ? <CheckCircle size={11} /> : null}
              {saved ? 'Saved' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="p-4 rounded-xl space-y-3"
      style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
    >
      <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-tertiary)' }}>{title}</p>
      {children}
    </div>
  );
}

function FieldInput({ label, value, onChange, type = 'text', provenance, placeholder }: any) {
  return (
    <div>
      <label className="flex items-center gap-2 text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
        {label}
        {provenance && <ProvenanceChip source={provenance.source} confidence={provenance.confidence} />}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-lg text-sm focus:outline-none"
        style={{
          background: 'var(--surface-fill)',
          border: 'var(--hairline) solid var(--separator)',
          color: 'var(--text-secondary)',
          borderRadius: 'var(--radius-sm)',
        }}
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, provenance, placeholder }: any) {
  return (
    <div>
      <label className="flex items-center gap-2 text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
        {label}
        {provenance && <ProvenanceChip source={provenance.source} confidence={provenance.confidence} />}
      </label>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none resize-none"
        style={{
          background: 'var(--surface-fill)',
          border: 'var(--hairline) solid var(--separator)',
          color: 'var(--text-secondary)',
          borderRadius: 'var(--radius-sm)',
        }}
      />
    </div>
  );
}

function ProvenanceChip({ source, confidence }: { source: string; confidence?: number }) {
  const getStyle = (src: string): { background: string; color: string } => {
    switch (src) {
      case 'admin_manual': return { background: 'rgba(52,199,89,.10)', color: 'var(--green-ink)' };
      case 'user_upload':  return { background: 'rgba(88,86,214,.10)', color: 'var(--indigo-ink)' };
      case 'web_research': return { background: 'rgba(255,149,0,.10)', color: 'var(--orange)' };
      default:             return { background: 'var(--surface-fill)', color: 'var(--text-tertiary)' };
    }
  };
  const labels: Record<string, string> = {
    admin_manual: 'manual',
    user_upload: 'upload',
    web_research: `web ${confidence ? Math.round(confidence * 100) + '%' : ''}`,
    default: 'default',
    none: 'empty',
  };
  const label = labels[source] ?? 'empty';
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
      style={getStyle(source)}
    >
      {label}
    </span>
  );
}

// ============================================================================

function LocalDataTab({ exam, onRefresh }: { exam: ExamFull; onRefresh: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const r = await authFetch(`/api/exams/${exam.id}/local-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'text', title: title.trim(), content: content.trim() }),
      });
      if (r.ok) {
        setTitle(''); setContent(''); onRefresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ldid: string) => {
    await authFetch(`/api/exams/${exam.id}/local-data/${ldid}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div
        className="p-3 rounded-xl flex items-start gap-2.5"
        style={{ background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.22)' }}
      >
        <Lightbulb size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--indigo-ink)' }} />
        <div className="text-[11px] leading-relaxed" style={{ color: 'var(--indigo-ink)' }}>
          Paste official syllabus text, prep-guide excerpts, or other authoritative material. Local data takes priority over web research during enrichment.
        </div>
      </div>

      <div
        className="p-4 rounded-xl space-y-2"
        style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
      >
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title (e.g. 'Official syllabus 2027')"
          className="w-full h-9 px-3 rounded-lg text-sm focus:outline-none"
          style={{
            background: 'var(--surface-fill)',
            border: 'var(--hairline) solid var(--separator)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Paste content here..."
          rows={6}
          className="w-full px-3 py-2 rounded-lg resize-none font-mono text-[11px] focus:outline-none"
          style={{
            background: 'var(--surface-fill)',
            border: 'var(--hairline) solid var(--separator)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}
        />
        <button
          onClick={add}
          disabled={!title.trim() || !content.trim() || saving}
          className="px-3 h-9 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
          style={{ background: 'var(--indigo)', color: '#fff' }}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Add entry
        </button>
      </div>

      {exam.local_data.length > 0 && (
        <div className="space-y-1.5">
          {exam.local_data.map((d: any) => (
            <div
              key={d.id}
              className="p-3 rounded-lg"
              style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{d.title}</p>
                <button onClick={() => remove(d.id)} style={{ color: 'var(--text-tertiary)' }}>
                  <X size={12} />
                </button>
              </div>
              <p className="text-[10px] mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{d.kind} · {d.uploaded_at.slice(0, 10)}</p>
              <p className="text-[11px] line-clamp-3 font-mono" style={{ color: 'var(--text-tertiary)' }}>{d.content.slice(0, 300)}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================

function AssistantTab({ exam, onRefresh }: { exam: ExamFull; onRefresh: () => void }) {
  const [history, setHistory] = useState<AssistantTurn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const send = useCallback(async (mode: 'open' | 'reply' | 'tip', message?: string) => {
    setSending(true);
    try {
      const r = await authFetch(`/api/exams/${exam.id}/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, message, history }),
      });
      if (r.ok) {
        const data = await r.json();
        if (mode === 'reply' && message) {
          setHistory(h => [...h, { role: 'admin', content: message, timestamp: new Date().toISOString() }, data.turn]);
        } else {
          setHistory(h => [...h, data.turn]);
        }
        setInput('');
      }
    } finally {
      setSending(false);
    }
  }, [exam.id, history]);

  useEffect(() => {
    if (history.length === 0) send('open');
  }, [history.length, send]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="p-2 space-y-2 min-h-[200px]">
        {history.map((turn, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl max-w-[85%]${turn.role !== 'assistant' ? ' ml-auto' : ''}`}
            style={turn.role === 'assistant'
              ? { background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.22)', color: 'var(--text-secondary)' }
              : { background: 'var(--surface-fill)', color: 'var(--text-secondary)' }
            }
          >
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{turn.content}</p>
            {turn.suggestions && turn.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {turn.suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => send('reply', s)}
                    className="text-[10px] px-2 py-1 rounded-full"
                    style={{ background: 'var(--surface-card)', color: 'var(--indigo-ink)', border: '1px solid rgba(88,86,214,.22)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div
            className="p-3 rounded-xl inline-flex items-center gap-2 text-xs"
            style={{ background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.22)', color: 'var(--text-tertiary)' }}
          >
            <Loader2 size={12} className="animate-spin" />
            Thinking…
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) send('reply', input.trim()); }}
          placeholder="Ask for help — 'auto-enrich', 'what's missing?', ..."
          className="flex-1 h-9 px-3 rounded-lg text-sm focus:outline-none"
          style={{
            background: 'var(--surface-fill)',
            border: 'var(--hairline) solid var(--separator)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}
        />
        <button
          onClick={() => input.trim() && send('reply', input.trim())}
          disabled={!input.trim() || sending}
          className="px-3 h-9 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
          style={{ background: 'var(--indigo)', color: '#fff' }}
        >
          <Send size={12} />
          Send
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================

function TabButton({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: typeof Globe; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 h-8 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
      style={active
        ? { background: 'var(--surface-card)', color: 'var(--indigo-ink)', border: '1px solid rgba(88,86,214,.22)' }
        : { color: 'var(--text-tertiary)' }
      }
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function CompletenessBadge({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
  const pct = Math.round(value * 100);
  const toneColor = pct >= 80 ? 'var(--green-ink)' : pct >= 40 ? 'var(--orange)' : 'var(--red)';
  return (
    <div>
      <p className={`font-bold ${size === 'lg' ? 'text-2xl' : 'text-lg'}`} style={{ color: toneColor }}>{pct}%</p>
      <p className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>complete</p>
    </div>
  );
}

// ============================================================================

function CreateExamModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [level, setLevel] = useState<ExamFull['level']>('postgraduate');
  const [country, setCountry] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [seedText, setSeedText] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similar, setSimilar] = useState<any[]>([]);

  // Debounced similarity check as the admin types the name
  useEffect(() => {
    if (!name.trim() || name.trim().length < 4) { setSimilar([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await authFetch('/api/exams/suggest-similar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            level,
            country: country.trim() || undefined,
            issuing_body: issuingBody.trim() || undefined,
          }),
        });
        if (r.ok) {
          const data = await r.json();
          setSimilar(data.matches || []);
        }
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [name, level, country, issuingBody]);

  const submit = async () => {
    if (!code.trim() || !name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const r = await authFetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          level,
          country: country.trim() || undefined,
          issuing_body: issuingBody.trim() || undefined,
          seed_text: seedText.trim() || undefined,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        setError(`Failed: ${r.status} ${t}`);
        return;
      }
      const data = await r.json();
      onCreated(data.exam.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const inputStyle = {
    background: 'var(--surface-card)',
    border: 'var(--hairline) solid var(--separator)',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
  };

  return (
    <div
      className="fixed inset-0 z-50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
      >
        <div
          className="sticky top-0 px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--surface-fill)', borderBottom: 'var(--hairline) solid var(--separator)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>New exam</p>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-tertiary)' }}>
            <X size={14} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Just provide the basics. Fill in the rest over time — auto-enrich from the web, upload local materials, or edit manually whenever you learn more.
          </p>

          <div>
            <label className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Short code *</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. GATE-CS-2027"
              className="w-full h-9 mt-1 px-3 rounded-lg text-sm focus:outline-none font-mono"
              style={inputStyle}
            />
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>2-40 chars, alphanumeric + dot/dash/underscore</p>
          </div>

          <div>
            <label className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Full name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. GATE Computer Science 2027"
              className="w-full h-9 mt-1 px-3 rounded-lg text-sm focus:outline-none"
              style={inputStyle}
            />
          </div>

          {similar.length > 0 && (
            <div
              className="p-2.5 rounded-lg space-y-1.5"
              style={{ background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)' }}
            >
              <p className="text-[10px] uppercase font-medium flex items-center gap-1" style={{ color: 'var(--orange)' }}>
                <AlertCircle size={10} />
                Possibly related — did you mean one of these?
              </p>
              {similar.map((s: any) => (
                <div key={s.exam_id} className="text-[11px] flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--orange)' }}>{Math.round(s.similarity * 100)}%</span>
                  <span className="flex-1 truncate">{s.exam_name}</span>
                  <span className="text-[9px] uppercase" style={{ color: 'var(--text-tertiary)' }}>{s.source}</span>
                </div>
              ))}
              <p className="text-[10px]" style={{ color: 'var(--orange)' }}>
                You can still create a new exam — this is just a duplicate-check.
              </p>
            </div>
          )}

          <div>
            <label className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Level *</label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value as any)}
              className="w-full h-9 mt-1 px-3 rounded-lg text-sm focus:outline-none"
              style={inputStyle}
            >
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="professional">Professional</option>
              <option value="competitive">Competitive</option>
              <option value="entrance">Entrance</option>
              <option value="certification">Certification</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Country <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <input
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="e.g. India"
              className="w-full h-9 mt-1 px-3 rounded-lg text-sm focus:outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Issuing body <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <input
              value={issuingBody}
              onChange={e => setIssuingBody(e.target.value)}
              placeholder="e.g. IIT Madras / IISc"
              className="w-full h-9 mt-1 px-3 rounded-lg text-sm focus:outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Seed text <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <textarea
              value={seedText}
              onChange={e => setSeedText(e.target.value)}
              placeholder="Paste any syllabus text, prep notes, or exam info you already have. This helps enrichment produce better results."
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none resize-none"
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              className="p-2 rounded-lg text-[11px]"
              style={{ background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', color: 'var(--red)' }}
            >
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={!code.trim() || !name.trim() || creating}
            className="w-full h-10 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--indigo)', color: '#fff' }}
          >
            {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Create exam
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Similar exams panel — shown in OverviewTab
// ============================================================================

function SimilarExamsPanel({ examId, examName }: { examId: string; examName: string }) {
  const [matches, setMatches] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareId, setCompareId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await authFetch(`/api/exams/${examId}/similar?k=5`);
        if (r.ok) {
          const data = await r.json();
          setMatches(data.matches || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  if (loading) {
    return (
      <div
        className="p-4 rounded-xl text-xs flex items-center gap-2"
        style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)' }}
      >
        <Loader2 size={12} className="animate-spin" />
        Looking for similar exams...
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div
        className="p-4 rounded-xl text-xs"
        style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)' }}
      >
        <p className="text-[10px] uppercase tracking-wide font-medium mb-1 flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
          <Link2 size={10} />
          Similar exams
        </p>
        No similar exams found in your registry yet. Similarity improves as you add more exams or fill in more details.
      </div>
    );
  }

  return (
    <>
      <div
        className="p-4 rounded-xl space-y-2"
        style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
      >
        <p className="text-[10px] uppercase tracking-wide font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
          <Link2 size={10} />
          Similar exams
        </p>
        <div className="space-y-1.5">
          {matches.map((m: any) => (
            <div
              key={m.exam_id}
              className="p-2.5 rounded-lg space-y-1.5"
              style={{ background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{m.exam_name}</p>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
                      style={m.source === 'static'
                        ? { background: 'rgba(88,86,214,.10)', color: 'var(--indigo-ink)' }
                        : { background: 'rgba(52,199,89,.10)', color: 'var(--green-ink)' }
                      }
                    >
                      {m.source}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{m.exam_code}</p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-sm font-bold"
                    style={{ color: m.similarity >= 0.7 ? 'var(--green-ink)' : m.similarity >= 0.4 ? 'var(--orange)' : 'var(--text-tertiary)' }}
                  >
                    {Math.round(m.similarity * 100)}%
                  </p>
                  <p className="text-[9px] uppercase" style={{ color: 'var(--text-tertiary)' }}>match</p>
                </div>
              </div>
              {m.notable_matches.length > 0 && (
                <p className="text-[10px]" style={{ color: 'var(--green-ink)' }}>✓ {m.notable_matches.join(' · ')}</p>
              )}
              {m.notable_differences.length > 0 && (
                <p className="text-[10px]" style={{ color: 'var(--orange)' }}>Δ {m.notable_differences.join(' · ')}</p>
              )}
              <button
                onClick={() => setCompareId(m.exam_id)}
                className="text-[10px] inline-flex items-center gap-1"
                style={{ color: 'var(--indigo-ink)' }}
              >
                <GitCompare size={9} />
                Compare side by side
              </button>
            </div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {compareId && (
          <CompareDrawer
            aId={examId}
            aName={examName}
            bId={compareId}
            onClose={() => setCompareId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// Compare drawer — side-by-side view of two exams
// ============================================================================

function CompareDrawer({ aId, aName, bId, onClose }: {
  aId: string; aName: string; bId: string; onClose: () => void;
}) {
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await authFetch(`/api/exams/compare?a=${encodeURIComponent(aId)}&b=${encodeURIComponent(bId)}`);
        if (r.ok) setComparison((await r.json()).comparison);
      } finally {
        setLoading(false);
      }
    })();
  }, [aId, bId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 max-h-[88vh] rounded-t-2xl overflow-y-auto"
        style={{ background: 'var(--surface-fill)', borderTop: 'var(--hairline) solid var(--separator)' }}
      >
        <div
          className="sticky top-0 backdrop-blur-sm px-4 py-3 flex items-center justify-between z-10"
          style={{ background: 'var(--surface-fill)', borderBottom: 'var(--hairline) solid var(--separator)' }}
        >
          <p className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <GitCompare size={14} style={{ color: 'var(--indigo-ink)' }} />
            Compare
          </p>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-tertiary)' }}>
            <X size={14} />
          </button>
        </div>
        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <Loader2 size={14} className="inline animate-spin mr-2" />
              Comparing...
            </div>
          ) : !comparison ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Comparison unavailable.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.22)' }}
                >
                  <p className="text-[10px] uppercase font-medium" style={{ color: 'var(--indigo-ink)' }}>A</p>
                  <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{comparison.a.name}</p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{comparison.a.code}</p>
                </div>
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }}
                >
                  <p className="text-[10px] uppercase font-medium" style={{ color: 'var(--green-ink)' }}>B</p>
                  <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{comparison.b.name}</p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{comparison.b.code}</p>
                </div>
              </div>

              <div
                className="p-4 rounded-xl text-center"
                style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}
              >
                <p
                  className="text-3xl font-bold"
                  style={{ color: comparison.overall_similarity >= 0.7 ? 'var(--green-ink)' : comparison.overall_similarity >= 0.4 ? 'var(--orange)' : 'var(--red)' }}
                >
                  {Math.round(comparison.overall_similarity * 100)}%
                </p>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>overall similarity</p>
                <p
                  className="text-xs leading-relaxed mt-3 max-w-md mx-auto"
                  style={{ color: 'var(--text-secondary)' }}
                  dangerouslySetInnerHTML={{ __html: comparison.recommendation.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
                />
              </div>

              <CategoryBlock title="Identity" cat={comparison.categories.identity} />
              <CategoryBlock title="Structure" cat={comparison.categories.structure} />
              <ContentBlock cat={comparison.categories.content} />
              <CategoryBlock title="Schedule" cat={comparison.categories.schedule} />
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CategoryBlock({ title, cat }: { title: string; cat: any }) {
  return (
    <div
      className="p-3 rounded-xl space-y-2"
      style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{Math.round(cat.score * 100)}% match</span>
      </div>
      {cat.matches.length > 0 && (
        <p className="text-[11px]" style={{ color: 'var(--green-ink)' }}>✓ {cat.matches.join(' · ')}</p>
      )}
      {cat.differences.length > 0 && (
        <div className="space-y-0.5">
          {cat.differences.map((d: any, i: number) => (
            <p key={i} className="text-[10px]" style={{ color: 'var(--orange)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>{d.field}:</span> {String(d.a)} vs {String(d.b)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentBlock({ cat }: { cat: any }) {
  return (
    <div
      className="p-3 rounded-xl space-y-2"
      style={{ background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-secondary)' }}>Content</p>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Jaccard: {Math.round(cat.jaccard * 100)}%
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold" style={{ color: 'var(--green-ink)' }}>{cat.shared_topics.length}</p>
          <p className="text-[9px] uppercase" style={{ color: 'var(--text-tertiary)' }}>shared</p>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: 'var(--indigo-ink)' }}>{cat.only_in_a.length}</p>
          <p className="text-[9px] uppercase" style={{ color: 'var(--text-tertiary)' }}>A only</p>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: 'var(--orange)' }}>{cat.only_in_b.length}</p>
          <p className="text-[9px] uppercase" style={{ color: 'var(--text-tertiary)' }}>B only</p>
        </div>
      </div>
      {cat.shared_topics.length > 0 && (
        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          <span className="font-medium" style={{ color: 'var(--green-ink)' }}>Shared:</span>{' '}
          {cat.shared_topics.slice(0, 8).map((t: string) => t.replace(/-/g, ' ')).join(', ')}
          {cat.shared_topics.length > 8 && ` (+${cat.shared_topics.length - 8} more)`}
        </p>
      )}
    </div>
  );
}
