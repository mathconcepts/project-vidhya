/**
 * EffectivenessLedger — sortable table of experiments × lift × verdict.
 *
 * Read-only surface for the operator to scan recent decisions. Columns:
 *   Experiment · Status · Lift · n · p · Started · Recompute
 *
 * Verdict cell colors follow DESIGN-SYSTEM.md:
 *   emerald  = won (lift > 0.05, p < 0.05, n ≥ 30)
 *   red      = lost (lift < -0.02, p < 0.05, n ≥ 30)
 *   surface  = inconclusive / insufficient data / active
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Loader2, TrendingUp, TrendingDown, Minus, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import {
  recomputeLift,
  type ExperimentRow,
  type ExperimentStatus,
} from '@/api/admin/content-rd';
import { fadeInUp } from '@/lib/animations';
import { suggestForExperiment, type LedgerSuggestion } from '@/lib/ledger-suggestions';
import { Link } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';

interface Props {
  experiments: ExperimentRow[];
  loading?: boolean;
  onRefresh?: () => void;
  onRecomputed?: (id: string) => void;
}

type SortKey = 'lift' | 'pyq_delta' | 'n' | 'p' | 'started' | 'name';
type SortDir = 'asc' | 'desc';

export function EffectivenessLedger({ experiments, loading, onRefresh, onRecomputed }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('started');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [recomputing, setRecomputing] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const copy = [...experiments];
    copy.sort((a, b) => {
      const cmp = compareBy(a, b, sortKey);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [experiments, sortKey, sortDir]);

  function clickHeader(key: SortKey) {
    if (key === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'started' ? 'desc' : 'desc'); }
  }

  async function handleRecompute(id: string) {
    setRecomputing(id);
    try {
      await recomputeLift(id);
      onRecomputed?.(id);
    } catch {
      // surface error in parent's refresh; intentionally silent here
    } finally {
      setRecomputing(null);
    }
  }

  return (
    <motion.section variants={fadeInUp} className="space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-surface-100 flex items-center gap-2">
            <TrendingUp size={14} className="text-violet-400" />
            Effectiveness ledger
          </h2>
          <p className="text-[11px] text-surface-500 mt-0.5">
            Lift = mean mastery delta vs matched control over a 7-day window
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200 disabled:opacity-50"
            aria-label="Refresh ledger"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
        )}
      </header>

      <div className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface-900 border-b border-surface-800">
              <tr className="text-left text-surface-500">
                <Th label="Experiment" sortKey="name" current={sortKey} dir={sortDir} onClick={clickHeader} />
                <Th label="Status" />
                <Th label="Lift" sortKey="lift" current={sortKey} dir={sortDir} onClick={clickHeader} align="right" />
                <Th label="PYQ Δ" sortKey="pyq_delta" current={sortKey} dir={sortDir} onClick={clickHeader} align="right" />
                <Th label="n" sortKey="n" current={sortKey} dir={sortDir} onClick={clickHeader} align="right" />
                <Th label="p" sortKey="p" current={sortKey} dir={sortDir} onClick={clickHeader} align="right" />
                <Th label="Started" sortKey="started" current={sortKey} dir={sortDir} onClick={clickHeader} />
                <Th label="" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-surface-500">
                    No experiments yet. Launch one from above.
                  </td>
                </tr>
              )}
              {sorted.map((e) => [
                <tr key={`${e.id}-row`} className="border-b border-surface-800/50 hover:bg-surface-900/50 transition-colors">
                  <td className="px-3 py-2.5 align-top">
                    <div className="font-medium text-surface-200">{e.name}</div>
                    <div className="text-[10px] font-mono text-surface-600 mt-0.5">{e.id}</div>
                    {e.hypothesis && (
                      <div className="text-[11px] text-surface-500 mt-1 italic line-clamp-2">{e.hypothesis}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="px-3 py-2.5 align-top text-right font-mono">
                    {e.lift_v1 == null ? <span className="text-surface-600">—</span> : <LiftCell lift={Number(e.lift_v1)} />}
                  </td>
                  <td className="px-3 py-2.5 align-top text-right font-mono">
                    <PyqDeltaCell delta={pyqDeltaOf(e)} />
                  </td>
                  <td className="px-3 py-2.5 align-top text-right font-mono text-surface-300">
                    {e.lift_n ?? <span className="text-surface-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5 align-top text-right font-mono text-surface-400">
                    {e.lift_p == null ? <span className="text-surface-600">—</span> : Number(e.lift_p).toFixed(3)}
                  </td>
                  <td className="px-3 py-2.5 align-top text-surface-400 whitespace-nowrap">
                    {formatDate(e.started_at)}
                  </td>
                  <td className="px-3 py-2.5 align-top text-right">
                    <button
                      onClick={() => handleRecompute(e.id)}
                      disabled={recomputing === e.id}
                      className="text-[11px] px-2 py-1 rounded-md bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 disabled:opacity-50"
                    >
                      {recomputing === e.id ? '…' : 'Recompute'}
                    </button>
                  </td>
                </tr>,
                <SuggestionRow key={`${e.id}-suggestion`} experiment={e} />,
              ])}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

function SuggestionRow({ experiment }: { experiment: ExperimentRow }) {
  const suggestion: LedgerSuggestion = suggestForExperiment({
    id: experiment.id,
    status: experiment.status as any,
    hypothesis: experiment.hypothesis,
    lift_v1: experiment.lift_v1 == null ? null : Number(experiment.lift_v1),
    lift_n: experiment.lift_n,
    lift_p: experiment.lift_p == null ? null : Number(experiment.lift_p),
    variant_kind: experiment.variant_kind,
    ended_at: experiment.ended_at,
  });
  if (suggestion.kind === 'no_action' && !suggestion.message) return null;

  const tone = suggestion.kind === 'bake_in_winner' ? 'emerald'
    : suggestion.kind === 'celebrate' ? 'emerald'
    : suggestion.kind === 'investigate_loser' ? 'amber'
    : suggestion.kind === 'fund_resume' ? 'amber'
    : suggestion.kind === 'expand_run_count' ? 'amber'
    : 'surface';

  return (
    <tr className="border-b border-surface-800 last:border-0">
      <td colSpan={8} className={clsx(
        'px-3 py-2 text-[11px]',
        tone === 'emerald' && 'bg-emerald-500/5 text-emerald-200',
        tone === 'amber' && 'bg-amber-500/5 text-amber-200',
        tone === 'surface' && 'bg-surface-900/30 text-surface-400',
      )}>
        <div className="flex items-center gap-2 flex-wrap">
          <Lightbulb size={11} className="shrink-0" />
          <span className="flex-1">{suggestion.message}</span>
          {suggestion.cta && (
            <Link
              to={suggestion.cta.href}
              className="inline-flex items-center px-2 py-0.5 rounded border border-current/30 hover:bg-current/10 whitespace-nowrap"
            >
              {suggestion.cta.label} →
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}

function Th({
  label, sortKey, current, dir, onClick, align,
}: {
  label: string;
  sortKey?: SortKey;
  current?: SortKey;
  dir?: SortDir;
  onClick?: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const sortable = !!sortKey && !!onClick;
  const active = sortable && sortKey === current;
  return (
    <th
      className={clsx(
        'px-3 py-2 font-medium text-[10px] uppercase tracking-wide select-none',
        align === 'right' ? 'text-right' : 'text-left',
        sortable ? 'cursor-pointer hover:text-surface-300' : '',
        active ? 'text-violet-400' : '',
      )}
      onClick={sortable ? () => onClick!(sortKey!) : undefined}
    >
      <span>{label}</span>
      {active && <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );
}

function StatusBadge({ status }: { status: ExperimentStatus }) {
  const map: Record<ExperimentStatus, { color: string; icon: any; label: string }> = {
    active:        { color: 'bg-violet-500/10 text-violet-300 border-violet-500/30', icon: Clock,        label: 'Active' },
    won:           { color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', icon: CheckCircle2, label: 'Won' },
    lost:          { color: 'bg-red-500/10 text-red-300 border-red-500/30', icon: XCircle,      label: 'Lost' },
    inconclusive:  { color: 'bg-surface-800 text-surface-400 border-surface-700', icon: Minus,        label: 'Inconc.' },
    aborted:       { color: 'bg-surface-800 text-surface-500 border-surface-700', icon: Minus,        label: 'Aborted' },
  };
  const m = map[status];
  const Icon = m.icon;
  return (
    <span className={clsx('inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium', m.color)}>
      <Icon size={10} />
      {m.label}
    </span>
  );
}

function LiftCell({ lift }: { lift: number }) {
  const positive = lift > 0;
  const color = lift > 0.05 ? 'text-emerald-400' : lift < -0.02 ? 'text-red-400' : 'text-surface-300';
  const Icon = lift > 0.05 ? TrendingUp : lift < -0.02 ? TrendingDown : Minus;
  return (
    <span className={clsx('inline-flex items-center justify-end gap-1', color)}>
      <Icon size={11} />
      {(positive ? '+' : '') + lift.toFixed(4)}
    </span>
  );
}

/**
 * Renders the pyq_accuracy_delta_v1 cell. Color-coded against the same
 * promotion thresholds used by the learnings-ledger (>+0.05 = win,
 * < -0.02 = loss). null = no measurement yet (no holdout attempts in
 * window).
 */
function PyqDeltaCell({ delta }: { delta: number | null }) {
  if (delta == null) return <span className="text-surface-600">—</span>;
  const positive = delta > 0;
  const color = delta > 0.05 ? 'text-emerald-400' : delta < -0.02 ? 'text-red-400' : 'text-surface-300';
  return (
    <span className={clsx('inline-flex items-center justify-end gap-1', color)}>
      {(positive ? '+' : '') + (delta * 100).toFixed(1) + '%'}
    </span>
  );
}

// ============================================================================
// Sort helper
// ============================================================================

/**
 * Pull the dual-metric pyq_accuracy_delta_v1 out of metadata. Persisted
 * by computePyqAccuracyDelta() (PR #32). Returns null when not present
 * (column-less experiments, or before the nightly job ran). Exported
 * for tests.
 */
export function pyqDeltaOf(e: ExperimentRow): number | null {
  const meta = (e.metadata ?? {}) as Record<string, any>;
  const inner = meta.pyq_accuracy_delta_v1;
  if (!inner || typeof inner !== 'object') return null;
  const d = (inner as any).delta;
  return typeof d === 'number' && Number.isFinite(d) ? d : null;
}

function compareBy(a: ExperimentRow, b: ExperimentRow, key: SortKey): number {
  switch (key) {
    case 'lift': return (a.lift_v1 ?? -Infinity) - (b.lift_v1 ?? -Infinity);
    case 'pyq_delta': return (pyqDeltaOf(a) ?? -Infinity) - (pyqDeltaOf(b) ?? -Infinity);
    case 'n':    return (a.lift_n ?? -1) - (b.lift_n ?? -1);
    case 'p':    return (a.lift_p ?? Infinity) - (b.lift_p ?? Infinity);
    case 'started': return Date.parse(a.started_at) - Date.parse(b.started_at);
    case 'name': return a.name.localeCompare(b.name);
    default: return 0;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const now = Date.now();
  const diffDays = Math.round((now - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Exported for tests
export const __testing = { compareBy, formatDate };
