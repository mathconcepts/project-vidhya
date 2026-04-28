import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, AlertCircle, RefreshCw, Plus, FileText, Search,
  Check, X, Edit3, ArrowLeft, Save, AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { fadeInUp } from '@/lib/animations';

/**
 * /gate/admin/content-studio — admin-driven content authoring UI.
 *
 * Three views in one page (tab-based):
 *
 *   - Generate: form to kick off generation for a concept_id
 *   - Drafts: list of all drafts with status + source + preview
 *   - Review: edit one draft in detail; approve / reject buttons
 *
 * Backend surface: src/api/content-studio-routes.ts (7 endpoints).
 * Auth: admin-only — page redirects student/teacher to a 403 stub.
 *
 * Design decisions:
 *
 *   - Tab UI rather than sub-routes. Keeps URL stable; selecting a
 *     draft from the list switches the active tab to Review.
 *   - No pagination on the drafts list. Studio drafts are admin-only
 *     and unlikely to exceed a few hundred at solo-founder scale.
 *   - Edit-in-place on the review tab. Save commits the PATCH.
 *   - Approve / Reject are explicit clicks with confirmation —
 *     these are forward-only state changes that need deliberate
 *     intent.
 *   - The underperforming endpoint result is shown as a side-panel
 *     callout on the Drafts tab when the count is non-zero.
 *
 * What's NOT in this page:
 *
 *   - Diff view between draft revisions (a draft only has the latest
 *     edits state; the JSONL log has history but no UI surface
 *     traverses it)
 *   - Bulk operations (approve-multiple, reject-multiple)
 *   - Source preview (e.g. show the URL's extracted text before
 *     submitting). The admin sees the result in the draft body.
 */

type Difficulty = 'intro' | 'intermediate' | 'advanced';
type SourceKind = 'uploads' | 'wolfram' | 'url-extract' | 'llm';
type DraftStatus = 'draft' | 'approved' | 'rejected' | 'archived';

interface Draft {
  draft_id:           string;
  concept_id:         string;
  title:              string;
  difficulty:         Difficulty;
  tags:               string[];
  exams:              string[];
  explainer_md:       string;
  worked_example_md?: string;
  status:             DraftStatus;
  generation: {
    request:      any;
    used_source:  SourceKind | null;
    attempts:     Array<{ source: SourceKind; outcome: string; detail: string; duration_ms: number }>;
    generated_at: string;
    duration_ms:  number;
  };
  edited_at?:        string;
  edited_by?:        string;
  resolved_at?:      string;
  resolved_by?:      string;
  promoted_as?:      string;
  rejection_reason?: string;
}

interface Underperformer {
  concept_id:           string;
  routed_source:        string;
  turn_count:           number;
  avg_mastery_delta_pct: number | null;
  last_turn_at:         string;
}

type Tab = 'generate' | 'drafts' | 'review';

export default function ContentStudioPage() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState<Tab>('drafts');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [reviewing, setReviewing] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DraftStatus | 'all'>('draft');
  const [underperformers, setUnderperformers] = useState<Underperformer[] | null>(null);

  const refreshDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path = statusFilter === 'all'
        ? '/api/content-studio/drafts'
        : `/api/content-studio/drafts?status=${statusFilter}`;
      const r = await authFetch(path);
      if (r.status === 403) { setError('Admin role required.'); setDrafts([]); return; }
      if (!r.ok) { setError(`HTTP ${r.status}`); setDrafts([]); return; }
      const data = await r.json();
      setDrafts(data.drafts);
    } catch (e: any) {
      setError(`Network error: ${e?.message ?? 'unknown'}`);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const refreshUnderperformers = useCallback(async () => {
    try {
      const r = await authFetch('/api/content-studio/underperforming');
      if (!r.ok) { setUnderperformers([]); return; }
      const data = await r.json();
      setUnderperformers(data.underperformers ?? []);
    } catch {
      setUnderperformers([]);
    }
  }, []);

  useEffect(() => { if (hasRole('admin')) refreshDrafts(); }, [refreshDrafts, hasRole]);
  useEffect(() => { if (hasRole('admin')) refreshUnderperformers(); }, [refreshUnderperformers, hasRole]);

  if (!hasRole('admin')) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertCircle className="w-5 h-5" />
          <span>Admin role required to access content-studio.</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="p-6 max-w-6xl mx-auto"
    >
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-surface-100 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Content Studio
        </h1>
        <p className="text-sm text-surface-400 mt-1">
          Generate teaching content from uploads, Wolfram, URLs, or an LLM. Review drafts and approve them into the content library.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-800 mb-6">
        <TabButton active={tab === 'generate'} onClick={() => setTab('generate')}>
          <Plus className="w-4 h-4" /> Generate
        </TabButton>
        <TabButton active={tab === 'drafts'} onClick={() => setTab('drafts')}>
          <FileText className="w-4 h-4" /> Drafts ({drafts.length})
        </TabButton>
        {reviewing && (
          <TabButton active={tab === 'review'} onClick={() => setTab('review')}>
            <Edit3 className="w-4 h-4" /> Reviewing: {reviewing.concept_id}
          </TabButton>
        )}
      </div>

      {/* Tab content */}
      {tab === 'generate' && (
        <GenerateTab onCreated={(d) => {
          setReviewing(d);
          setTab('review');
          refreshDrafts();
        }} />
      )}

      {tab === 'drafts' && (
        <DraftsTab
          drafts={drafts}
          loading={loading}
          error={error}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          onRefresh={refreshDrafts}
          onSelect={(d: Draft) => { setReviewing(d); setTab('review'); }}
          underperformers={underperformers}
        />
      )}

      {tab === 'review' && reviewing && (
        <ReviewTab
          draft={reviewing}
          onBack={() => { setTab('drafts'); refreshDrafts(); }}
          onChanged={(d) => setReviewing(d)}
        />
      )}
    </motion.div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-4 py-2 text-sm transition-colors border-b-2',
        active
          ? 'text-sky-400 border-sky-500'
          : 'text-surface-400 border-transparent hover:text-surface-200',
      )}
    >
      {children}
    </button>
  );
}

// ─── Generate tab ───────────────────────────────────────────────────

function GenerateTab({ onCreated }: { onCreated: (d: Draft) => void }) {
  const [conceptId, setConceptId]     = useState('');
  const [title, setTitle]             = useState('');
  const [difficulty, setDifficulty]   = useState<Difficulty>('intermediate');
  const [tags, setTags]               = useState('');
  const [exams, setExams]             = useState('');
  const [sourceUrl, setSourceUrl]     = useState('');
  const [llmExtra, setLlmExtra]       = useState('');
  const [sources, setSources]         = useState<SourceKind[]>(['uploads', 'wolfram', 'url-extract', 'llm']);
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const conceptOk = /^[a-z0-9-]+$/.test(conceptId) && conceptId.length > 0;

  const submit = async () => {
    setError(null);
    if (!conceptOk) { setError('concept_id must be lowercase kebab-case (a-z 0-9 -)'); return; }
    if (!title.trim()) { setError('title required'); return; }
    if (sources.length === 0) { setError('select at least one source'); return; }
    setBusy(true);
    try {
      const body: any = {
        concept_id: conceptId,
        title: title.trim(),
        difficulty,
        sources_to_try: sources,
        tags: tags.split(',').map(s => s.trim()).filter(Boolean),
        exams: exams.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (sourceUrl.trim()) body.source_url = sourceUrl.trim();
      if (llmExtra.trim()) body.llm_extra_prompt = llmExtra.trim();

      const r = await authFetch('/api/content-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || `HTTP ${r.status}`); return; }
      // Success — reset form and switch to review
      setConceptId('');
      setTitle('');
      setTags('');
      setExams('');
      setSourceUrl('');
      setLlmExtra('');
      onCreated(d);
    } catch (e: any) {
      setError(`Network error: ${e?.message ?? 'unknown'}`);
    } finally {
      setBusy(false);
    }
  };

  const toggleSource = (s: SourceKind) => {
    setSources(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <label className="text-sm text-surface-300 block mb-1">concept_id</label>
        <input
          type="text"
          value={conceptId}
          onChange={(e) => setConceptId(e.target.value)}
          placeholder="e.g. integration-by-parts"
          className={clsx(
            'w-full bg-surface-900 border rounded px-3 py-2 text-sm text-surface-100',
            conceptId && !conceptOk ? 'border-rose-500' : 'border-surface-800',
          )}
        />
        {conceptId && !conceptOk && (
          <p className="text-xs text-rose-400 mt-1">must be lowercase kebab-case</p>
        )}
      </div>

      <div>
        <label className="text-sm text-surface-300 block mb-1">title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Integration by Parts"
          className="w-full bg-surface-900 border border-surface-800 rounded px-3 py-2 text-sm text-surface-100"
        />
      </div>

      <div>
        <label className="text-sm text-surface-300 block mb-1">difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="w-full bg-surface-900 border border-surface-800 rounded px-3 py-2 text-sm text-surface-100"
        >
          <option value="intro">intro</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-surface-300 block mb-1">tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="calculus, integration"
          className="w-full bg-surface-900 border border-surface-800 rounded px-3 py-2 text-sm text-surface-100"
        />
      </div>

      <div>
        <label className="text-sm text-surface-300 block mb-1">exam IDs (comma-separated)</label>
        <input
          type="text"
          value={exams}
          onChange={(e) => setExams(e.target.value)}
          placeholder="EXM-JEEMAIN-MATH-SAMPLE"
          className="w-full bg-surface-900 border border-surface-800 rounded px-3 py-2 text-sm text-surface-100"
        />
      </div>

      <div>
        <label className="text-sm text-surface-300 block mb-2">sources to try (in priority order)</label>
        <div className="space-y-1">
          {(['uploads', 'wolfram', 'url-extract', 'llm'] as SourceKind[]).map(s => (
            <label key={s} className="flex items-center gap-2 text-sm text-surface-200 cursor-pointer">
              <input
                type="checkbox"
                checked={sources.includes(s)}
                onChange={() => toggleSource(s)}
                className="rounded"
              />
              <span className="font-mono text-xs">{s}</span>
              <span className="text-surface-500 text-xs">— {sourceHelp(s)}</span>
            </label>
          ))}
        </div>
      </div>

      {sources.includes('url-extract') && (
        <div>
          <label className="text-sm text-surface-300 block mb-1">source URL (for url-extract)</label>
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://en.wikipedia.org/wiki/Integration_by_parts"
            className="w-full bg-surface-900 border border-surface-800 rounded px-3 py-2 text-sm text-surface-100"
          />
        </div>
      )}

      {sources.includes('llm') && (
        <div>
          <label className="text-sm text-surface-300 block mb-1">extra prompt for LLM (optional)</label>
          <textarea
            value={llmExtra}
            onChange={(e) => setLlmExtra(e.target.value)}
            placeholder="Make the worked examples cover both definite and indefinite integrals."
            rows={3}
            className="w-full bg-surface-900 border border-surface-800 rounded px-3 py-2 text-sm text-surface-100 font-mono"
          />
        </div>
      )}

      {error && (
        <div className="text-sm text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={busy || !conceptOk || !title.trim() || sources.length === 0}
        className={clsx(
          'px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
          busy ? 'bg-sky-600/50 text-sky-100 cursor-wait'
               : 'bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-30 disabled:cursor-not-allowed',
        )}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Generate draft
      </button>

      <div className="text-xs text-surface-500 mt-4 p-3 bg-surface-900/40 rounded border border-surface-800">
        <p className="font-medium mb-1">how this works</p>
        <p>
          The orchestrator walks the sources you select, in order. The first one to return content wins;
          earlier failures and later skips are recorded in the draft's audit log. The draft starts in
          'draft' status — you can edit the body before approving. Approving promotes the entry to the
          content library at <code className="text-surface-400">/api/content-library/concept/&lt;concept_id&gt;</code>.
        </p>
      </div>
    </div>
  );
}

function sourceHelp(s: SourceKind): string {
  switch (s) {
    case 'uploads':     return 'pulls from previously-uploaded files for this concept';
    case 'wolfram':     return 'verified math via Wolfram Alpha';
    case 'url-extract': return 'fetches and extracts main content from a URL';
    case 'llm':         return 'last-resort generation via Gemini (rate-limited 5/hour, budget-tracked)';
  }
}

// ─── Drafts tab ─────────────────────────────────────────────────────

function DraftsTab({
  drafts, loading, error, statusFilter, onStatusFilter, onRefresh, onSelect, underperformers,
}: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'draft', 'approved', 'rejected', 'archived'] as const).map(s => (
            <button
              key={s}
              onClick={() => onStatusFilter(s)}
              className={clsx(
                'px-3 py-1 rounded text-xs transition-colors',
                statusFilter === s
                  ? 'bg-sky-600/30 text-sky-300 border border-sky-700'
                  : 'bg-surface-900 text-surface-400 border border-surface-800 hover:text-surface-200',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={onRefresh}
          className="text-surface-400 hover:text-surface-200"
          aria-label="refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {underperformers && underperformers.length > 0 && (
        <UnderperformerCallout items={underperformers} />
      )}

      {loading && (
        <div className="flex items-center gap-2 text-surface-400">
          <Loader2 className="w-4 h-4 animate-spin" /> loading…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-rose-400">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {!loading && !error && drafts.length === 0 && (
        <div className="text-center text-surface-500 py-12">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">no drafts {statusFilter !== 'all' && `with status='${statusFilter}'`}</p>
        </div>
      )}

      {drafts.map((d: Draft) => (
        <button
          key={d.draft_id}
          onClick={() => onSelect(d)}
          className="w-full text-left bg-surface-900 border border-surface-800 rounded p-4 hover:border-surface-700 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-surface-100">{d.title}</h3>
                <StatusBadge status={d.status} />
              </div>
              <p className="text-xs text-surface-500 font-mono">{d.concept_id}</p>
              <p className="text-xs text-surface-400 mt-2 line-clamp-2">
                {d.explainer_md.replace(/[#*]/g, '').slice(0, 200)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-surface-500">
                {d.generation.used_source ?? 'no source'}
              </p>
              <p className="text-xs text-surface-600 mt-1">
                {new Date(d.generation.generated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: DraftStatus }) {
  const styles: Record<DraftStatus, string> = {
    draft:    'bg-amber-900/30 text-amber-300 border-amber-800/50',
    approved: 'bg-emerald-900/30 text-emerald-300 border-emerald-800/50',
    rejected: 'bg-rose-900/30 text-rose-300 border-rose-800/50',
    archived: 'bg-surface-800 text-surface-400 border-surface-700',
  };
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded border', styles[status])}>
      {status}
    </span>
  );
}

function UnderperformerCallout({ items }: { items: Underperformer[] }) {
  return (
    <div className="bg-amber-900/20 border border-amber-800/40 rounded p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-amber-200">
            {items.length} library {items.length === 1 ? 'concept is' : 'concepts are'} underperforming
          </h3>
          <p className="text-xs text-amber-300/80 mt-1">
            Students using these library entries are not improving. Consider regenerating drafts with different sources.
          </p>
          <ul className="text-xs text-amber-200/80 mt-2 space-y-0.5 font-mono">
            {items.slice(0, 5).map(u => (
              <li key={u.concept_id}>
                {u.concept_id} — avg Δmastery {u.avg_mastery_delta_pct?.toFixed(1)}% over {u.turn_count} turns
              </li>
            ))}
            {items.length > 5 && <li className="text-amber-300/60">…and {items.length - 5} more</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Review tab ─────────────────────────────────────────────────────

function ReviewTab({
  draft, onBack, onChanged,
}: {
  draft: Draft;
  onBack: () => void;
  onChanged: (d: Draft) => void;
}) {
  const [title, setTitle]               = useState(draft.title);
  const [explainer, setExplainer]       = useState(draft.explainer_md);
  const [workedExample, setWorkedExample] = useState(draft.worked_example_md ?? '');
  const [tags, setTags]                 = useState(draft.tags.join(', '));
  const [busy, setBusy]                 = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const editable = draft.status === 'draft';

  const isDirty =
    title !== draft.title ||
    explainer !== draft.explainer_md ||
    workedExample !== (draft.worked_example_md ?? '') ||
    tags !== draft.tags.join(', ');

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      const body: any = {};
      if (title !== draft.title) body.title = title;
      if (explainer !== draft.explainer_md) body.explainer_md = explainer;
      if (workedExample !== (draft.worked_example_md ?? '')) body.worked_example_md = workedExample;
      const newTags = tags.split(',').map(s => s.trim()).filter(Boolean);
      if (JSON.stringify(newTags) !== JSON.stringify(draft.tags)) body.tags = newTags;
      const r = await authFetch(`/api/content-studio/draft/${draft.draft_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || `HTTP ${r.status}`); return; }
      onChanged(d);
    } catch (e: any) {
      setError(`Network error: ${e?.message ?? 'unknown'}`);
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (isDirty) {
      if (!confirm('You have unsaved edits. Save before approving? (Cancel = approve without saving)')) {
        // continue to approve without saving
      } else {
        await save();
      }
    }
    setError(null);
    setBusy(true);
    try {
      const r = await authFetch(`/api/content-studio/draft/${draft.draft_id}/approve`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok) { setError(d.error || `HTTP ${r.status}`); return; }
      onChanged(d);
    } catch (e: any) {
      setError(`Network error: ${e?.message ?? 'unknown'}`);
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) { setError('reason required'); return; }
    setError(null);
    setBusy(true);
    try {
      const r = await authFetch(`/api/content-studio/draft/${draft.draft_id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || `HTTP ${r.status}`); return; }
      onChanged(d);
      setShowRejectInput(false);
      setRejectReason('');
    } catch (e: any) {
      setError(`Network error: ${e?.message ?? 'unknown'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-surface-400 hover:text-surface-200"
        >
          <ArrowLeft className="w-4 h-4" /> back to drafts
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-surface-500">{draft.draft_id}</span>
          <StatusBadge status={draft.status} />
        </div>
      </div>

      {/* Provenance card */}
      <div className="bg-surface-900/60 border border-surface-800 rounded p-3 text-xs text-surface-400 space-y-1">
        <div><span className="text-surface-500">concept_id:</span> <code className="text-surface-300">{draft.concept_id}</code></div>
        <div><span className="text-surface-500">used_source:</span> <code className="text-surface-300">{draft.generation.used_source ?? 'none'}</code></div>
        <div><span className="text-surface-500">generated_at:</span> {new Date(draft.generation.generated_at).toLocaleString()}</div>
        {draft.edited_at && (
          <div><span className="text-surface-500">edited_at:</span> {new Date(draft.edited_at).toLocaleString()} by {draft.edited_by}</div>
        )}
        {draft.resolved_at && (
          <div>
            <span className="text-surface-500">{draft.status}:</span> {new Date(draft.resolved_at).toLocaleString()} by {draft.resolved_by}
            {draft.rejection_reason && <span className="text-rose-400"> — {draft.rejection_reason}</span>}
          </div>
        )}
        <details className="mt-2">
          <summary className="cursor-pointer text-surface-500 hover:text-surface-300">source attempts ({draft.generation.attempts.length})</summary>
          <ul className="mt-1 space-y-0.5">
            {draft.generation.attempts.map((a, i) => (
              <li key={i} className="font-mono text-surface-500">
                {a.source}: <span className={a.outcome === 'used' ? 'text-emerald-400' : 'text-surface-600'}>{a.outcome}</span> — {a.detail}
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* Editable fields */}
      <div>
        <label className="text-sm text-surface-300 block mb-1">title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!editable}
          className="w-full bg-surface-900 border border-surface-800 rounded px-3 py-2 text-sm text-surface-100 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="text-sm text-surface-300 block mb-1">explainer (markdown)</label>
        <textarea
          value={explainer}
          onChange={(e) => setExplainer(e.target.value)}
          disabled={!editable}
          rows={20}
          className="w-full bg-surface-900 border border-surface-800 rounded px-3 py-2 text-sm text-surface-100 font-mono disabled:opacity-50"
        />
        <p className="text-xs text-surface-500 mt-1">{explainer.length} chars</p>
      </div>

      <div>
        <label className="text-sm text-surface-300 block mb-1">worked example (markdown, optional)</label>
        <textarea
          value={workedExample}
          onChange={(e) => setWorkedExample(e.target.value)}
          disabled={!editable}
          rows={8}
          placeholder="Optional worked example body. Used for practice-problem and walkthrough-problem intents."
          className="w-full bg-surface-900 border border-surface-800 rounded px-3 py-2 text-sm text-surface-100 font-mono disabled:opacity-50"
        />
      </div>

      <div>
        <label className="text-sm text-surface-300 block mb-1">tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={!editable}
          className="w-full bg-surface-900 border border-surface-800 rounded px-3 py-2 text-sm text-surface-100 disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="text-sm text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Action buttons */}
      {editable && (
        <div className="flex items-center gap-2 pt-3 border-t border-surface-800">
          <button
            onClick={save}
            disabled={busy || !isDirty}
            className="px-3 py-1.5 rounded text-sm bg-surface-800 hover:bg-surface-700 text-surface-200 disabled:opacity-30 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save edits
          </button>
          <button
            onClick={approve}
            disabled={busy}
            className="px-3 py-1.5 rounded text-sm bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 flex items-center gap-1.5"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Approve & promote to library
          </button>
          {!showRejectInput ? (
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={busy}
              className="px-3 py-1.5 rounded text-sm bg-rose-900/50 hover:bg-rose-900 text-rose-100 disabled:opacity-30 flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Reject
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="reason"
                className="flex-1 bg-surface-900 border border-surface-800 rounded px-2 py-1 text-sm"
                autoFocus
              />
              <button
                onClick={reject}
                disabled={busy || !rejectReason.trim()}
                className="px-3 py-1.5 rounded text-sm bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-30"
              >
                Confirm reject
              </button>
              <button
                onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                disabled={busy}
                className="px-2 py-1.5 text-surface-400 hover:text-surface-200"
              >
                cancel
              </button>
            </div>
          )}
        </div>
      )}

      {!editable && (
        <div className="text-sm text-surface-500 pt-3 border-t border-surface-800">
          This draft is in <code className="text-surface-400">{draft.status}</code> status. No further edits possible.
          {draft.promoted_as && (
            <span> The library now serves <code className="text-surface-400">{draft.promoted_as}</code>.</span>
          )}
        </div>
      )}
    </div>
  );
}
