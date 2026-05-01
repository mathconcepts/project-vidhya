/**
 * ConceptOrchestratorPage — admin "Concepts needing content" dashboard.
 *
 * Phase 3 of the concept-generation framework v1. Implements design
 * decisions D1-D4:
 *   D1 — Live progress modal (12-step indicator, polled every 2s)
 *   D2 — Atom version diff viewer (rendered markdown side-by-side)
 *   D3 — Per-row cost meter (violet → amber → rose)
 *   D4 — "Improved" badge (rendered by atom card; not on this page)
 *
 * Auth: admin/owner/institution only — gated server-side. Frontend
 * shows "Access denied" if non-admin lands here.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/lib/auth/client';
import { Sparkles, AlertTriangle, RefreshCw, Loader2, X, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { MarkdownAtomRenderer } from '@/components/lesson/MarkdownAtomRenderer';
import { wordDiff } from '@/lib/wordDiff';

// ─── Types mirroring server-side ──────────────────────────────────

type ConceptState = 'missing' | 'partial' | 'stale' | 'current';

interface QueueRow {
  concept_id: string;
  label: string;
  topic_family: string;
  state: ConceptState;
  atoms_existing: number;
  atoms_to_generate: number;
  cohort_error_pct: number;
  n_students: number;
  exam_weight: number;
  spent_usd: number;
  cap_usd: number;
  impact: number;
  estimated_cost_usd: number;
}

interface ProgressEvent {
  type: 'start' | 'atom_started' | 'atom_finished' | 'atom_rejected' | 'done';
  step_index: number;
  total_steps: number;
  atom_type?: string;
  atom_id?: string;
  sources?: string[];
  judge_score?: number;
  reason?: string;
  total_cost_usd?: number;
}

interface JobState {
  id: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  concept_id: string;
  topic_family: string;
  events: ProgressEvent[];
  result?: {
    atoms: any[];
    rejected_atoms: any[];
    total_cost_usd: number;
  };
  error?: string;
}

interface AtomVersion {
  atom_id: string;
  version_n: number;
  content: string;
  generation_meta: any;
  generated_at: string;
  active: boolean;
  improvement_reason: string | null;
}

// ─── Auth helper ──────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// ─── Cost meter (D3) ───────────────────────────────────────────────

function CostMeter({ spent_usd, cap_usd }: { spent_usd: number; cap_usd: number }) {
  const pct = cap_usd > 0 ? (spent_usd / cap_usd) * 100 : 0;
  const tone = pct >= 100 ? 'rose' : pct >= 80 ? 'amber' : 'violet';
  const colors = {
    violet: { bar: 'bg-violet-500', track: 'bg-violet-500/15', text: 'text-violet-300' },
    amber:  { bar: 'bg-amber-500',  track: 'bg-amber-500/15',  text: 'text-amber-300' },
    rose:   { bar: 'bg-rose-500',   track: 'bg-rose-500/15',   text: 'text-rose-300' },
  }[tone];
  return (
    <div className="flex items-center gap-2 text-[11px] tabular-nums">
      <span className={colors.text}>
        ${spent_usd.toFixed(2)}/${cap_usd.toFixed(0)}
      </span>
      <div className={clsx('h-1.5 w-16 rounded-full', colors.track)}>
        <div className={clsx('h-full rounded-full', colors.bar)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-surface-500">{Math.round(pct)}%</span>
    </div>
  );
}

// ─── State badge ───────────────────────────────────────────────────

function StateBadge({ state }: { state: ConceptState }) {
  const cfg = {
    missing: { label: 'Missing',  cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    partial: { label: 'Partial',  cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    stale:   { label: 'Stale',    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    current: { label: 'Current',  cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  }[state];
  return (
    <span className={clsx('inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

// ─── Generate progress modal (D1) ──────────────────────────────────

function GenerateProgressModal({
  jobId,
  conceptLabel,
  onClose,
  onDone,
}: {
  jobId: string;
  conceptLabel: string;
  onClose: () => void;
  onDone: (job: JobState) => void;
}) {
  const [job, setJob] = useState<JobState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef(false);

  useEffect(() => {
    cleanupRef.current = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cleanupRef.current) return;
      try {
        const r = await fetch(`/api/admin/concept-orchestrator/status/${jobId}`, { headers: authHeaders() });
        if (!r.ok) {
          setError(`status ${r.status}: ${await r.text()}`);
          return;
        }
        const j = (await r.json()) as JobState;
        if (cleanupRef.current) return;
        setJob(j);
        if (j.status === 'done' || j.status === 'failed') {
          onDone(j);
          return;
        }
      } catch (e: any) {
        setError(e.message);
      }
      if (!cleanupRef.current) timer = setTimeout(poll, 2000);
    };

    poll();
    return () => {
      cleanupRef.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, onDone]);

  const last = job?.events[job.events.length - 1];
  const stepIdx = last?.step_index ?? 0;
  const totalSteps = last?.total_steps ?? 11;
  const pct = (stepIdx / Math.max(totalSteps, 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-xl bg-surface-900 border border-surface-700 p-5 shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Generating: {conceptLabel}</h3>
            <p className="text-xs text-surface-400 mt-0.5">11 atoms via Wolfram + Claude{' + Gemini consensus on math'}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-surface-500 hover:text-surface-200">
            <X size={16} />
          </button>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-surface-400 mb-1.5 tabular-nums">
            <span>Step {Math.min(stepIdx + (job?.status === 'running' ? 1 : 0), totalSteps)} / {totalSteps}</span>
            {job?.status === 'done' && <span className="text-emerald-300">Complete</span>}
            {job?.status === 'failed' && <span className="text-rose-300">Failed</span>}
          </div>
          <div className="h-1.5 rounded-full bg-surface-800 overflow-hidden">
            <div
              className={clsx(
                'h-full transition-all duration-300',
                job?.status === 'failed' ? 'bg-rose-500' : 'bg-emerald-500',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto text-xs">
          {(job?.events ?? []).map((e, i) => (
            <EventRow key={i} event={e} />
          ))}
          {!job && <div className="text-surface-500 italic">Starting…</div>}
          {error && (
            <div className="text-rose-300 flex items-center gap-1 mt-2">
              <AlertTriangle size={12} /> {error}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-surface-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-surface-300 hover:bg-surface-800"
          >
            {job?.status === 'done' || job?.status === 'failed' ? 'Close' : 'Run in background'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: ProgressEvent }) {
  const Icon = event.type === 'atom_finished'
    ? CheckCircle2
    : event.type === 'atom_rejected'
    ? XCircle
    : event.type === 'atom_started'
    ? Loader2
    : event.type === 'done'
    ? Sparkles
    : null;
  const tone = event.type === 'atom_finished' || event.type === 'done'
    ? 'text-emerald-300'
    : event.type === 'atom_rejected'
    ? 'text-rose-300'
    : 'text-surface-400';
  if (event.type === 'start') return null;
  if (event.type === 'done') {
    return (
      <div className={clsx('flex items-center gap-1.5', tone)}>
        <Sparkles size={12} />
        <span>Done: {event.total_cost_usd ? `$${event.total_cost_usd.toFixed(3)} spent` : ''}</span>
      </div>
    );
  }
  return (
    <div className={clsx('flex items-center gap-1.5', tone)}>
      {Icon && <Icon size={12} className={event.type === 'atom_started' ? 'animate-spin' : ''} />}
      <span className="font-mono text-[10px] text-surface-500 w-8 text-right">
        {event.atom_type?.slice(0, 7)}
      </span>
      <span className="flex-1 truncate">
        {event.type === 'atom_started' && (event.sources?.length ? `via ${event.sources.join('+')}` : 'starting…')}
        {event.type === 'atom_finished' && (
          <>
            via {event.sources?.join('+') ?? 'llm'}
            {event.judge_score != null && ` · judge ${event.judge_score.toFixed(1)}/10`}
          </>
        )}
        {event.type === 'atom_rejected' && `rejected: ${event.reason ?? ''}`}
      </span>
    </div>
  );
}

// ─── Diff viewer (D2) ──────────────────────────────────────────────

function VersionDiffModal({ atomId, onClose }: { atomId: string; onClose: () => void }) {
  const [versions, setVersions] = useState<AtomVersion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/atoms/${encodeURIComponent(atomId)}/versions`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`))))
      .then((j) => setVersions(j.versions ?? []))
      .catch((e) => setError(e.message));
  }, [atomId]);

  const active = versions.find((v) => v.active) ?? versions[1] ?? null;
  const candidate = versions.find((v) => !v.active) ?? versions[0] ?? null;

  const activate = useCallback(async (version_n: number) => {
    const r = await fetch(`/api/admin/atoms/${encodeURIComponent(atomId)}/activate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ version_n }),
    });
    if (r.ok) {
      const updated = await fetch(`/api/admin/atoms/${encodeURIComponent(atomId)}/versions`, {
        headers: authHeaders(),
      }).then((r2) => r2.json());
      setVersions(updated.versions ?? []);
    }
  }, [atomId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl bg-surface-900 border border-surface-700 shadow-2xl flex flex-col">
        <div className="flex items-start justify-between p-4 border-b border-surface-800">
          <div>
            <h3 className="text-sm font-semibold text-white">{atomId}</h3>
            <p className="text-xs text-surface-500 mt-0.5">{versions.length} version{versions.length === 1 ? '' : 's'}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-surface-500 hover:text-surface-200">
            <X size={16} />
          </button>
        </div>

        {error && <div className="p-4 text-rose-300 text-sm">{error}</div>}

        <div className="flex-1 overflow-y-auto p-4">
          {versions.length === 0 && !error && <div className="text-surface-500 italic text-sm">Loading…</div>}
          {versions.length === 1 && (
            <SingleVersion v={versions[0]} onActivate={activate} />
          )}
          {versions.length > 1 && (
            <>
              {active && candidate && (
                <DiffHighlights before={active.content} after={candidate.content} />
              )}
              <div className="grid grid-cols-2 gap-4">
                <VersionPane label="Active" v={active} onActivate={activate} />
                <VersionPane label="Candidate" v={candidate} onActivate={activate} highlight />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * DiffHighlights — inline word-level diff strip shown above the
 * side-by-side rendered markdown panes. Diff-match-patch produces
 * segments tagged equal/insert/delete; inserts highlight emerald,
 * deletes rose with strikethrough.
 *
 * Strict text view (no markdown rendering) so the admin can quickly
 * spot exactly which words changed. The rendered side-by-side panes
 * below give the visual context (KaTeX, directives, etc.).
 */
function DiffHighlights({ before, after }: { before: string; after: string }) {
  const segments = useMemo(() => wordDiff(before, after), [before, after]);

  // Skip the strip when nothing actually differs — avoids a confusing
  // "Diff highlights" header above two identical panes.
  const hasChanges = segments.some((s) => s.op !== 'equal');
  if (!hasChanges) return null;

  return (
    <div className="mb-4 rounded-lg border border-surface-800 bg-surface-950/70 p-3">
      <div className="text-[10px] uppercase tracking-wider text-surface-500 mb-2">
        Word-level changes
      </div>
      <div className="text-xs leading-relaxed text-surface-300 break-words">
        {segments.map((s, i) => {
          if (s.op === 'equal') {
            return <span key={i}>{s.text}</span>;
          }
          if (s.op === 'insert') {
            return (
              <span
                key={i}
                className="bg-emerald-500/20 text-emerald-200 rounded px-0.5"
                title="added"
              >
                {s.text}
              </span>
            );
          }
          return (
            <span
              key={i}
              className="bg-rose-500/15 text-rose-200 line-through rounded px-0.5"
              title="removed"
            >
              {s.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SingleVersion({ v, onActivate }: { v: AtomVersion; onActivate: (n: number) => void }) {
  return (
    <div className="rounded-lg border border-surface-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-surface-400">v{v.version_n} · {new Date(v.generated_at).toLocaleString()}</span>
        {v.active ? (
          <span className="text-[10px] uppercase tracking-wider text-emerald-300">Active</span>
        ) : (
          <button
            onClick={() => onActivate(v.version_n)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30"
          >
            Activate
          </button>
        )}
      </div>
      <MarkdownAtomRenderer atomId={`${v.atom_id}.diff.${v.version_n}`} content={v.content} />
    </div>
  );
}

function VersionPane({
  label,
  v,
  onActivate,
  highlight,
}: {
  label: string;
  v: AtomVersion | null;
  onActivate: (n: number) => void;
  highlight?: boolean;
}) {
  if (!v) return <div className="text-surface-500 italic text-sm">no version</div>;
  const meta = v.generation_meta as any;
  const disagreed = meta?.consensus_disagreement;
  return (
    <div className={clsx('rounded-lg border p-3', highlight ? 'border-violet-500/40' : 'border-surface-800')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-400">{label} · v{v.version_n}</span>
          {disagreed && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
              models disagree
            </span>
          )}
          {v.improvement_reason && (
            <Sparkles size={12} className="text-emerald-300" aria-label={v.improvement_reason} />
          )}
        </div>
        {v.active ? (
          <span className="text-[10px] uppercase tracking-wider text-emerald-300">Active</span>
        ) : (
          <button
            onClick={() => onActivate(v.version_n)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30"
          >
            Activate
          </button>
        )}
      </div>
      {v.improvement_reason && (
        <div className="mb-2 px-2 py-1 rounded text-[11px] bg-emerald-500/5 text-emerald-200/80">
          {v.improvement_reason}
        </div>
      )}
      <div className="prose prose-invert prose-sm max-w-none">
        <MarkdownAtomRenderer atomId={`${v.atom_id}.diff.${v.version_n}`} content={v.content} />
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────

export default function ConceptOrchestratorPage() {
  const { user } = useAuth();
  const isAdmin = user?.role && ['admin', 'owner', 'institution'].includes(user.role);

  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<{ id: string; label: string } | null>(null);
  const [diffAtomId, setDiffAtomId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/concept-orchestrator/queue?limit=50', { headers: authHeaders() });
      if (!r.ok) {
        setError(`Queue load failed: ${r.status} — feature may not be enabled (set VIDHYA_CONCEPT_ORCHESTRATOR=on)`);
        setRows([]);
        return;
      }
      const j = await r.json();
      setRows(j.rows ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadQueue();
  }, [isAdmin, loadQueue]);

  const startGenerate = useCallback(async (row: QueueRow) => {
    try {
      const r = await fetch('/api/admin/concept-orchestrator/generate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          concept_id: row.concept_id,
          topic_family: row.topic_family,
        }),
      });
      if (!r.ok) {
        setError(`Generate failed: ${r.status}`);
        return;
      }
      const j = await r.json();
      if (j.job_id) setActiveJob({ id: j.job_id, label: row.label });
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const onGenerateDone = useCallback(() => {
    // Refresh queue to reflect new atom counts + spend.
    loadQueue();
  }, [loadQueue]);

  const totalSpent = useMemo(
    () => rows.reduce((sum, r) => sum + r.spent_usd, 0),
    [rows],
  );

  if (!isAdmin) {
    return (
      <div className="px-4 py-8 max-w-2xl mx-auto">
        <div className="p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm">
          Admin access required.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <header className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Concepts needing content</h1>
          <p className="text-xs text-surface-400 mt-1">
            Sorted by impact (exam weight × students affected × cohort error %).
            One-click regen produces an 11-atom draft set in ~30s.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-500 tabular-nums">
            ${totalSpent.toFixed(2)} this month
          </span>
          <button
            onClick={loadQueue}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-surface-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-900/50 border-b border-surface-800">
            <tr className="text-left text-[10px] uppercase tracking-wider text-surface-500">
              <th className="px-3 py-2">Concept</th>
              <th className="px-3 py-2">State</th>
              <th className="px-3 py-2">Atoms</th>
              <th className="px-3 py-2">Cohort error</th>
              <th className="px-3 py-2">Cost</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-surface-500 text-xs">Loading queue…</td></tr>
            )}
            {!loading && rows.length === 0 && !error && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-surface-500 text-xs">All concepts have content. ✨</td></tr>
            )}
            {rows.map((row) => {
              const atCap = row.spent_usd >= row.cap_usd;
              return (
                <tr key={row.concept_id} className="border-b border-surface-800 last:border-b-0 hover:bg-surface-900/30">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-white text-sm">{row.label}</div>
                    <div className="text-[10px] text-surface-500">{row.concept_id} · {row.topic_family}</div>
                  </td>
                  <td className="px-3 py-2.5"><StateBadge state={row.state} /></td>
                  <td className="px-3 py-2.5 tabular-nums text-surface-300">
                    {row.atoms_existing}/11
                    {row.atoms_to_generate > 0 && (
                      <span className="text-[10px] text-surface-500 ml-1">+{row.atoms_to_generate}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-surface-300">
                    {(row.cohort_error_pct * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2.5">
                    <CostMeter spent_usd={row.spent_usd} cap_usd={row.cap_usd} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {atCap ? (
                      <span className="text-[11px] text-rose-300">Cap reached</span>
                    ) : (
                      <button
                        onClick={() => startGenerate(row)}
                        title={`+$${row.estimated_cost_usd.toFixed(2)} ~ ${row.atoms_to_generate || 11} atoms`}
                        className="px-3 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-xs hover:bg-violet-500/30"
                      >
                        Generate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeJob && (
        <GenerateProgressModal
          jobId={activeJob.id}
          conceptLabel={activeJob.label}
          onClose={() => setActiveJob(null)}
          onDone={() => onGenerateDone()}
        />
      )}

      {diffAtomId && (
        <VersionDiffModal atomId={diffAtomId} onClose={() => setDiffAtomId(null)} />
      )}
    </div>
  );
}
