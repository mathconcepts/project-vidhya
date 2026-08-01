import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, AlertCircle, RefreshCw, Plus, FileText, Search,
  Check, X, Edit3, ArrowLeft, Save, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';

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
        <div className="flex items-center gap-2" style={{ color: 'var(--red)' }}>
          <AlertCircle className="w-5 h-5" />
          <span>Admin role required to access content-studio.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <FileText className="w-6 h-6" />
          Content Studio
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Generate teaching content from uploads, Wolfram, URLs, or an LLM. Review drafts and approve them into the content library.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: 'var(--hairline) solid var(--separator)' }}>
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
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-sm"
      style={{
        color: active ? 'var(--indigo-ink)' : 'var(--text-tertiary)',
        background: 'none',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: active ? '2px solid var(--indigo)' : '2px solid transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
      }}
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

  const isDisabled = busy || !conceptOk || !title.trim() || sources.length === 0;

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-fill)',
    border: 'var(--hairline) solid var(--separator)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>concept_id</label>
        <input
          type="text"
          value={conceptId}
          onChange={(e) => setConceptId(e.target.value)}
          placeholder="e.g. integration-by-parts"
          className="w-full rounded px-3 py-2 text-sm"
          style={{
            ...inputStyle,
            border: `var(--hairline) solid ${conceptId && !conceptOk ? 'var(--red)' : 'var(--separator)'}`,
          }}
        />
        {conceptId && !conceptOk && (
          <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>must be lowercase kebab-case</p>
        )}
      </div>

      <div>
        <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Integration by Parts"
          className="w-full rounded px-3 py-2 text-sm"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="w-full rounded px-3 py-2 text-sm"
          style={inputStyle}
        >
          <option value="intro">intro</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
      </div>

      <div>
        <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="calculus, integration"
          className="w-full rounded px-3 py-2 text-sm"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>exam IDs (comma-separated)</label>
        <input
          type="text"
          value={exams}
          onChange={(e) => setExams(e.target.value)}
          placeholder="EXM-JEEMAIN-MATH-SAMPLE"
          className="w-full rounded px-3 py-2 text-sm"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="text-sm block mb-2" style={{ color: 'var(--text-secondary)' }}>sources to try (in priority order)</label>
        <div className="space-y-1">
          {(['uploads', 'wolfram', 'url-extract', 'llm'] as SourceKind[]).map(s => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={sources.includes(s)}
                onChange={() => toggleSource(s)}
                className="rounded"
              />
              <span className="font-mono text-xs">{s}</span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>— {sourceHelp(s)}</span>
            </label>
          ))}
        </div>
      </div>

      {sources.includes('url-extract') && (
        <div>
          <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>source URL (for url-extract)</label>
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://en.wikipedia.org/wiki/Integration_by_parts"
            className="w-full rounded px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
      )}

      {sources.includes('llm') && (
        <div>
          <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>extra prompt for LLM (optional)</label>
          <textarea
            value={llmExtra}
            onChange={(e) => setLlmExtra(e.target.value)}
            placeholder="Make the worked examples cover both definite and indefinite integrals."
            rows={3}
            className="w-full rounded px-3 py-2 text-sm font-mono"
            style={inputStyle}
          />
        </div>
      )}

      {error && (
        <div className="text-sm flex items-center gap-2" style={{ color: 'var(--red)' }}>
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={isDisabled}
        className="px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
        style={{
          background: busy ? 'rgba(88,86,214,.5)' : 'var(--indigo)',
          color: 'white',
          cursor: busy ? 'wait' : isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.3 : 1,
          border: 'none',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Generate draft
      </button>

      <div className="text-xs mt-4 p-3 rounded" style={{ background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}>
        <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>how this works</p>
        <p style={{ color: 'var(--text-tertiary)' }}>
          The orchestrator walks the sources you select, in order. The first one to return content wins;
          earlier failures and later skips are recorded in the draft's audit log. The draft starts in
          'draft' status — you can edit the body before approving. Approving promotes the entry to the
          content library at <code style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>/api/content-library/concept/&lt;concept_id&gt;</code>.
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
              className="px-3 py-1 rounded text-xs"
              style={statusFilter === s ? {
                background: 'rgba(88,86,214,.3)',
                color: 'var(--indigo-ink)',
                border: '1px solid var(--indigo)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              } : {
                background: 'var(--surface-fill)',
                color: 'var(--text-secondary)',
                border: 'var(--hairline) solid var(--separator)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={onRefresh}
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {underperformers && underperformers.length > 0 && (
        <UnderperformerCallout items={underperformers} />
      )}

      {loading && (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Loader2 className="w-4 h-4 animate-spin" /> loading…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2" style={{ color: 'var(--red)' }}>
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {!loading && !error && drafts.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">no drafts {statusFilter !== 'all' && `with status='${statusFilter}'`}</p>
        </div>
      )}

      {drafts.map((d: Draft) => (
        <button
          key={d.draft_id}
          onClick={() => onSelect(d)}
          className="w-full text-left rounded p-4"
          style={{
            background: 'var(--surface-card)',
            boxShadow: 'var(--shadow-raise)',
            border: 'var(--hairline) solid var(--separator)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>{d.title}</h3>
                <StatusBadge status={d.status} />
              </div>
              <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>{d.concept_id}</p>
              <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {d.explainer_md.replace(/[#*]/g, '').slice(0, 200)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {d.generation.used_source ?? 'no source'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
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
  const style: React.CSSProperties = status === 'draft'
    ? { background: 'rgba(255,149,0,.1)', color: 'var(--orange)', border: '1px solid rgba(255,149,0,.3)' }
    : status === 'approved'
    ? { background: 'rgba(52,199,89,.1)', color: 'var(--green-ink)', border: '1px solid rgba(52,199,89,.3)' }
    : status === 'rejected'
    ? { background: 'rgba(255,59,48,.1)', color: 'var(--red)', border: '1px solid rgba(255,59,48,.3)' }
    : { background: 'var(--surface-fill)', color: 'var(--text-tertiary)', border: 'var(--hairline) solid var(--separator)' };
  return (
    <span className="text-xs px-2 py-0.5 rounded" style={style}>
      {status}
    </span>
  );
}

function UnderperformerCallout({ items }: { items: Underperformer[] }) {
  return (
    <div className="rounded p-4" style={{ background: 'rgba(255,149,0,.1)', border: 'var(--hairline) solid rgba(255,149,0,.3)' }}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--orange)' }} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium" style={{ color: 'var(--orange)' }}>
            {items.length} library {items.length === 1 ? 'concept is' : 'concepts are'} underperforming
          </h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,149,0,.8)' }}>
            Students using these library entries are not improving. Consider regenerating drafts with different sources.
          </p>
          <ul className="text-xs mt-2 space-y-0.5 font-mono" style={{ color: 'rgba(255,149,0,.8)' }}>
            {items.slice(0, 5).map(u => (
              <li key={u.concept_id}>
                {u.concept_id} — avg Δmastery {u.avg_mastery_delta_pct?.toFixed(1)}% over {u.turn_count} turns
              </li>
            ))}
            {items.length > 5 && <li style={{ color: 'rgba(255,149,0,.6)' }}>…and {items.length - 5} more</li>}
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

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-fill)',
    border: 'var(--hairline) solid var(--separator)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
        >
          <ArrowLeft className="w-4 h-4" /> back to drafts
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{draft.draft_id}</span>
          <StatusBadge status={draft.status} />
        </div>
      </div>

      {/* Provenance card */}
      <div className="rounded p-3 text-xs space-y-1" style={{ background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)' }}>
        <div><span style={{ color: 'var(--text-tertiary)' }}>concept_id:</span> <code style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{draft.concept_id}</code></div>
        <div><span style={{ color: 'var(--text-tertiary)' }}>used_source:</span> <code style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{draft.generation.used_source ?? 'none'}</code></div>
        <div><span style={{ color: 'var(--text-tertiary)' }}>generated_at:</span> {new Date(draft.generation.generated_at).toLocaleString()}</div>
        {draft.edited_at && (
          <div><span style={{ color: 'var(--text-tertiary)' }}>edited_at:</span> {new Date(draft.edited_at).toLocaleString()} by {draft.edited_by}</div>
        )}
        {draft.resolved_at && (
          <div>
            <span style={{ color: 'var(--text-tertiary)' }}>{draft.status}:</span> {new Date(draft.resolved_at).toLocaleString()} by {draft.resolved_by}
            {draft.rejection_reason && <span style={{ color: 'var(--red)' }}> — {draft.rejection_reason}</span>}
          </div>
        )}
        <details className="mt-2">
          <summary className="cursor-pointer" style={{ color: 'var(--text-tertiary)' }}>source attempts ({draft.generation.attempts.length})</summary>
          <ul className="mt-1 space-y-0.5">
            {draft.generation.attempts.map((a, i) => (
              <li key={i} className="font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {a.source}: <span style={{ color: a.outcome === 'used' ? 'var(--green-ink)' : 'var(--text-tertiary)' }}>{a.outcome}</span> — {a.detail}
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* Editable fields */}
      <div>
        <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!editable}
          className="w-full rounded px-3 py-2 text-sm"
          style={{ ...inputStyle, opacity: !editable ? 0.5 : 1 }}
        />
      </div>

      <div>
        <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>explainer (markdown)</label>
        <textarea
          value={explainer}
          onChange={(e) => setExplainer(e.target.value)}
          disabled={!editable}
          rows={20}
          className="w-full rounded px-3 py-2 text-sm font-mono"
          style={{ ...inputStyle, opacity: !editable ? 0.5 : 1 }}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{explainer.length} chars</p>
      </div>

      <div>
        <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>worked example (markdown, optional)</label>
        <textarea
          value={workedExample}
          onChange={(e) => setWorkedExample(e.target.value)}
          disabled={!editable}
          rows={8}
          placeholder="Optional worked example body. Used for practice-problem and walkthrough-problem intents."
          className="w-full rounded px-3 py-2 text-sm font-mono"
          style={{ ...inputStyle, opacity: !editable ? 0.5 : 1 }}
        />
      </div>

      <div>
        <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={!editable}
          className="w-full rounded px-3 py-2 text-sm"
          style={{ ...inputStyle, opacity: !editable ? 0.5 : 1 }}
        />
      </div>

      {error && (
        <div className="text-sm flex items-center gap-2" style={{ color: 'var(--red)' }}>
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Action buttons */}
      {editable && (
        <div className="flex items-center gap-2 pt-3" style={{ borderTop: 'var(--hairline) solid var(--separator)' }}>
          <button
            onClick={save}
            disabled={busy || !isDirty}
            className="px-3 py-1.5 rounded text-sm flex items-center gap-1.5"
            style={{
              background: 'var(--surface-fill)',
              color: 'var(--text-secondary)',
              border: 'var(--hairline) solid var(--separator)',
              cursor: busy || !isDirty ? 'not-allowed' : 'pointer',
              opacity: busy || !isDirty ? 0.3 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Save className="w-4 h-4" /> Save edits
          </button>
          <button
            onClick={approve}
            disabled={busy}
            className="px-3 py-1.5 rounded text-sm flex items-center gap-1.5"
            style={{
              background: 'var(--green)',
              color: 'white',
              border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.3 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Approve & promote to library
          </button>
          {!showRejectInput ? (
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={busy}
              className="px-3 py-1.5 rounded text-sm flex items-center gap-1.5"
              style={{
                background: 'rgba(255,59,48,.15)',
                color: 'var(--red)',
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.3 : 1,
                fontFamily: 'var(--font-sans)',
              }}
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
                className="flex-1 rounded px-2 py-1 text-sm"
                style={{
                  background: 'var(--surface-fill)',
                  border: 'var(--hairline) solid var(--separator)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                }}
                autoFocus
              />
              <button
                onClick={reject}
                disabled={busy || !rejectReason.trim()}
                className="px-3 py-1.5 rounded text-sm"
                style={{
                  background: 'var(--red)',
                  color: 'white',
                  border: 'none',
                  cursor: busy || !rejectReason.trim() ? 'not-allowed' : 'pointer',
                  opacity: busy || !rejectReason.trim() ? 0.3 : 1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Confirm reject
              </button>
              <button
                onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                disabled={busy}
                className="px-2 py-1.5"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                cancel
              </button>
            </div>
          )}
        </div>
      )}

      {!editable && (
        <div className="text-sm pt-3" style={{ color: 'var(--text-tertiary)', borderTop: 'var(--hairline) solid var(--separator)' }}>
          This draft is in <code style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{draft.status}</code> status. No further edits possible.
          {draft.promoted_as && (
            <span> The library now serves <code style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{draft.promoted_as}</code>.</span>
          )}
        </div>
      )}
    </div>
  );
}
