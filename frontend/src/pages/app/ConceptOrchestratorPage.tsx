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
  const barColor  = tone === 'violet' ? 'var(--indigo)'    : tone === 'amber' ? 'var(--orange)' : 'var(--red)';
  const trackBg   = tone === 'violet' ? 'rgba(88,86,214,.08)' : tone === 'amber' ? 'rgba(255,149,0,.06)' : 'rgba(255,59,48,.06)';
  const textColor = tone === 'violet' ? 'var(--indigo-ink)' : tone === 'amber' ? 'var(--orange)'  : 'var(--red)';
  return (
    <div className="flex items-center gap-2 text-[11px] tabular-nums">
      <span style={{ color: textColor }}>
        ${spent_usd.toFixed(2)}/${cap_usd.toFixed(0)}
      </span>
      <div className="h-1.5 w-16 rounded-full" style={{ background: trackBg }}>
        <div
          className="h-full rounded-full"
          style={{ background: barColor, width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span style={{ color: 'var(--text-tertiary)' }}>{Math.round(pct)}%</span>
    </div>
  );
}

// ─── State badge ───────────────────────────────────────────────────

function StateBadge({ state }: { state: ConceptState }) {
  const cfg = {
    missing: { label: 'Missing',  bg: 'rgba(255,59,48,.06)',  color: 'var(--red)',        border: '1px solid rgba(255,59,48,.22)' },
    partial: { label: 'Partial',  bg: 'rgba(255,149,0,.06)',  color: 'var(--orange)',     border: '1px solid rgba(255,149,0,.22)' },
    stale:   { label: 'Stale',    bg: 'rgba(255,149,0,.06)',  color: 'var(--orange)',     border: '1px solid rgba(255,149,0,.22)' },
    current: { label: 'Current',  bg: 'rgba(52,199,89,.06)',  color: 'var(--green-ink)',  border: '1px solid rgba(52,199,89,.22)' },
  }[state];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color, border: cfg.border }}
    >
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.6)' }}
    >
      <div
        className="w-full max-w-xl rounded-xl p-5 shadow-2xl"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Generating: {conceptLabel}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              11 atoms via Wolfram + Claude{' + Gemini consensus on math'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-3">
          <div
            className="flex items-center justify-between text-[11px] mb-1.5 tabular-nums"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span>Step {Math.min(stepIdx + (job?.status === 'running' ? 1 : 0), totalSteps)} / {totalSteps}</span>
            {job?.status === 'done'   && <span style={{ color: 'var(--green-ink)' }}>Complete</span>}
            {job?.status === 'failed' && <span style={{ color: 'var(--red)' }}>Failed</span>}
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--surface-fill)' }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: job?.status === 'failed' ? 'var(--red)' : 'var(--green)',
              }}
            />
          </div>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
          {(job?.events ?? []).map((e, i) => (
            <EventRow key={i} event={e} />
          ))}
          {!job && (
            <div className="italic" style={{ color: 'var(--text-tertiary)' }}>Starting…</div>
          )}
          {error && (
            <div className="flex items-center gap-1 mt-2" style={{ color: 'var(--red)' }}>
              <AlertTriangle size={12} /> {error}
            </div>
          )}
        </div>

        {job?.status === 'done' && job.result && (
          <BulkApprovePanel job={job} onClose={onClose} />
        )}

        {job?.status !== 'done' && (
          <div
            className="mt-4 pt-3 flex justify-end"
            style={{ borderTop: '1px solid var(--separator)' }}
          >
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              {job?.status === 'failed' ? 'Close' : 'Run in background'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Bulk-approve panel — shown when the orchestrator job completes.
 * Lists every accepted atom with a checkbox (default checked) so admin
 * can deselect any they want to review individually before activation.
 * One click activates all checked atoms via the bulk-activate endpoint.
 */
function BulkApprovePanel({ job, onClose }: { job: JobState; onClose: () => void }) {
  const accepted = job.result?.atoms ?? [];
  const [selected, setSelected] = useState<Set<string>>(() => new Set(accepted.map((a) => a.atom_id)));
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<{ activated: number; failed: number } | null>(null);
  const [hoveredAtomId, setHoveredAtomId] = useState<string | null>(null);

  if (accepted.length === 0) {
    return (
      <div
        className="mt-4 pt-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--separator)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No atoms to approve.</span>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          Close
        </button>
      </div>
    );
  }

  const toggle = (atom_id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(atom_id)) next.delete(atom_id);
      else next.add(atom_id);
      return next;
    });
  };

  const allChecked = selected.size === accepted.length;
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(accepted.map((a) => a.atom_id)));
  };

  const submit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    setOutcome(null);
    try {
      const items = Array.from(selected).map((atom_id) => ({ atom_id }));
      const r = await fetch('/api/admin/atoms/bulk-activate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ items }),
      });
      if (!r.ok) {
        setOutcome({ activated: 0, failed: items.length });
        return;
      }
      const j = await r.json();
      setOutcome({ activated: j.activated, failed: j.failed });
    } catch {
      setOutcome({ activated: 0, failed: selected.size });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="mt-4 pt-3"
      style={{ borderTop: '1px solid var(--separator)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
          Approve {selected.size} of {accepted.length}
        </span>
        <button
          onClick={toggleAll}
          className="text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--indigo-ink)' }}
        >
          {allChecked ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      <div className="max-h-40 overflow-y-auto space-y-1 mb-3 text-xs">
        {accepted.map((a: any) => {
          const checked = selected.has(a.atom_id);
          const score = a.meta?.llm_judge_score;
          return (
            <label
              key={a.atom_id}
              className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer"
              style={{
                background: hoveredAtomId === a.atom_id ? 'var(--surface-fill)' : 'transparent',
              }}
              onMouseEnter={() => setHoveredAtomId(a.atom_id)}
              onMouseLeave={() => setHoveredAtomId(null)}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(a.atom_id)}
                style={{ accentColor: 'var(--indigo)' }}
              />
              <span className="font-mono text-[10px] w-20 truncate" style={{ color: 'var(--text-tertiary)' }}>
                {a.atom_type}
              </span>
              <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{a.atom_id}</span>
              {score != null && (
                <span className="tabular-nums text-[10px]" style={{ color: 'var(--green-ink)' }}>
                  judge {Number(score).toFixed(1)}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {outcome && (
        <div
          className="mb-3 px-2.5 py-1.5 rounded text-xs"
          style={
            outcome.failed > 0
              ? { background: 'rgba(255,149,0,.06)', color: 'var(--orange)' }
              : { background: 'rgba(52,199,89,.06)', color: 'var(--green-ink)' }
          }
        >
          {outcome.activated} activated{outcome.failed > 0 ? `, ${outcome.failed} failed` : ''}.
          {outcome.failed === 0 && ' Atoms are now live.'}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          disabled={submitting}
          className="px-3 py-1.5 rounded-lg text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          Close
        </button>
        <button
          onClick={submit}
          disabled={submitting || selected.size === 0 || outcome?.activated === selected.size}
          className="px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: 'rgba(52,199,89,.06)',
            color: 'var(--green-ink)',
            opacity: (submitting || selected.size === 0 || outcome?.activated === selected.size) ? 0.5 : 1,
          }}
        >
          {submitting ? 'Activating…' : outcome?.activated === selected.size ? 'Activated' : `Activate ${selected.size}`}
        </button>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: ProgressEvent }) {
  const Icon =
    event.type === 'atom_finished' ? CheckCircle2
    : event.type === 'atom_rejected' ? XCircle
    : event.type === 'atom_started' ? Loader2
    : event.type === 'done' ? Sparkles
    : null;
  const toneColor =
    event.type === 'atom_finished' || event.type === 'done'
      ? 'var(--green-ink)'
      : event.type === 'atom_rejected'
      ? 'var(--red)'
      : 'var(--text-tertiary)';
  if (event.type === 'start') return null;
  if (event.type === 'done') {
    return (
      <div className="flex items-center gap-1.5" style={{ color: toneColor }}>
        <Sparkles size={12} />
        <span>Done: {event.total_cost_usd ? `$${event.total_cost_usd.toFixed(3)} spent` : ''}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5" style={{ color: toneColor }}>
      {Icon && <Icon size={12} className={event.type === 'atom_started' ? 'animate-spin' : ''} />}
      <span className="font-mono text-[10px] w-8 text-right" style={{ color: 'var(--text-tertiary)' }}>
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

  const active    = versions.find((v) => v.active)  ?? versions[1] ?? null;
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.6)' }}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl flex flex-col"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)' }}
      >
        <div
          className="flex items-start justify-between p-4"
          style={{ borderBottom: '1px solid var(--separator)' }}
        >
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{atomId}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {versions.length} version{versions.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-4 text-sm" style={{ color: 'var(--red)' }}>{error}</div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {versions.length === 0 && !error && (
            <div className="italic text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
          )}
          {versions.length === 1 && (
            <SingleVersion v={versions[0]} onActivate={activate} />
          )}
          {versions.length > 1 && (
            <>
              {active && candidate && (
                <DiffHighlights before={active.content} after={candidate.content} />
              )}
              <div className="grid grid-cols-2 gap-4">
                <VersionPane label="Active"    v={active}    onActivate={activate} />
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
    <div
      className="mb-4 rounded-lg p-3"
      style={{ background: 'var(--surface-fill)', border: '1px solid var(--separator)' }}
    >
      <div
        className="text-[10px] uppercase tracking-wider mb-2"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Word-level changes
      </div>
      <div className="text-xs leading-relaxed break-words" style={{ color: 'var(--text-secondary)' }}>
        {segments.map((s, i) => {
          if (s.op === 'equal') {
            return <span key={i}>{s.text}</span>;
          }
          if (s.op === 'insert') {
            return (
              <span
                key={i}
                className="rounded px-0.5"
                style={{ background: 'rgba(52,199,89,.12)', color: 'var(--green-ink)' }}
                title="added"
              >
                {s.text}
              </span>
            );
          }
          return (
            <span
              key={i}
              className="line-through rounded px-0.5"
              style={{ background: 'rgba(255,59,48,.06)', color: 'var(--red)' }}
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
    <div
      className="rounded-lg p-3"
      style={{ border: '1px solid var(--separator)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          v{v.version_n} · {new Date(v.generated_at).toLocaleString()}
        </span>
        {v.active ? (
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--green-ink)' }}>
            Active
          </span>
        ) : (
          <button
            onClick={() => onActivate(v.version_n)}
            className="px-2.5 py-1 rounded-lg text-xs"
            style={{ background: 'rgba(52,199,89,.06)', color: 'var(--green-ink)' }}
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
  if (!v) return (
    <div className="italic text-sm" style={{ color: 'var(--text-tertiary)' }}>no version</div>
  );
  const meta = v.generation_meta as any;
  const disagreed = meta?.consensus_disagreement;
  return (
    <div
      className="rounded-lg p-3"
      style={{
        border: highlight
          ? '1px solid rgba(88,86,214,.22)'
          : '1px solid var(--separator)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {label} · v{v.version_n}
          </span>
          {disagreed && (
            <span
              className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(255,59,48,.06)',
                color: 'var(--red)',
                border: '1px solid rgba(255,59,48,.22)',
              }}
            >
              models disagree
            </span>
          )}
          {v.improvement_reason && (
            <Sparkles size={12} style={{ color: 'var(--green-ink)' }} aria-label={v.improvement_reason} />
          )}
        </div>
        {v.active ? (
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--green-ink)' }}>
            Active
          </span>
        ) : (
          <button
            onClick={() => onActivate(v.version_n)}
            className="px-2.5 py-1 rounded-lg text-xs"
            style={{ background: 'rgba(52,199,89,.06)', color: 'var(--green-ink)' }}
          >
            Activate
          </button>
        )}
      </div>
      {v.improvement_reason && (
        <div
          className="mb-2 px-2 py-1 rounded text-[11px]"
          style={{ background: 'rgba(52,199,89,.04)', color: 'var(--green-ink)' }}
        >
          {v.improvement_reason}
        </div>
      )}
      <div className="prose prose-sm max-w-none">
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
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

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
        <div
          className="p-4 rounded-lg text-sm"
          style={{
            background: 'rgba(255,59,48,.06)',
            border: '1px solid rgba(255,59,48,.22)',
            color: 'var(--red)',
          }}
        >
          Admin access required.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <header className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Concepts needing content
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Sorted by impact (exam weight × students affected × cohort error %).
            One-click regen produces an 11-atom draft set in ~30s.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
            ${totalSpent.toFixed(2)} this month
          </span>
          <button
            onClick={loadQueue}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--surface-fill)', color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {error && (
        <div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            background: 'rgba(255,149,0,.06)',
            border: '1px solid rgba(255,149,0,.22)',
            color: 'var(--orange)',
          }}
        >
          {error}
        </div>
      )}

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--separator)' }}
      >
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface-fill)', borderBottom: '1px solid var(--separator)' }}>
            <tr
              className="text-left text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
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
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Loading queue…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && !error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  All concepts have content.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const atCap    = row.spent_usd >= row.cap_usd;
              const isHovered = hoveredRowId === row.concept_id;
              return (
                <tr
                  key={row.concept_id}
                  style={{
                    borderBottom: '1px solid var(--separator)',
                    background: isHovered ? 'var(--surface-fill)' : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredRowId(row.concept_id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {row.label}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {row.concept_id} · {row.topic_family}
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><StateBadge state={row.state} /></td>
                  <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {row.atoms_existing}/11
                    {row.atoms_to_generate > 0 && (
                      <span className="text-[10px] ml-1" style={{ color: 'var(--text-tertiary)' }}>
                        +{row.atoms_to_generate}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {(row.cohort_error_pct * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2.5">
                    <CostMeter spent_usd={row.spent_usd} cap_usd={row.cap_usd} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {atCap ? (
                      <span className="text-[11px]" style={{ color: 'var(--red)' }}>Cap reached</span>
                    ) : (
                      <button
                        onClick={() => startGenerate(row)}
                        title={`+$${row.estimated_cost_usd.toFixed(2)} ~ ${row.atoms_to_generate || 11} atoms`}
                        className="px-3 py-1 rounded-lg text-xs"
                        style={{ background: 'rgba(88,86,214,.08)', color: 'var(--indigo-ink)' }}
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
