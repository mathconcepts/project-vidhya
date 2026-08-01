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
import {
  recomputeLift,
  type ExperimentRow,
  type ExperimentStatus,
} from '@/api/admin/content-rd';
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
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={14} style={{ color: 'var(--indigo-ink)' }} />
            Effectiveness ledger
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Lift = mean mastery delta vs matched control over a 7-day window
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{ padding: '6px', borderRadius: '8px', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
            aria-label="Refresh ledger"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
        )}
      </header>

      <div style={{ borderRadius: '12px', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--surface-fill)', borderBottom: 'var(--hairline) solid var(--separator)' }}>
              <tr style={{ textAlign: 'left', color: 'var(--text-tertiary)' }}>
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
                  <td colSpan={8} style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No experiments yet. Launch one from above.
                  </td>
                </tr>
              )}
              {sorted.map((e) => [
                <tr key={`${e.id}-row`} style={{ borderBottom: 'var(--hairline) solid var(--separator)' }}>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{e.name}</div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{e.id}</div>
                    {e.hypothesis && (
                      <div className="line-clamp-2" style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', fontStyle: 'italic' }}>{e.hypothesis}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <StatusBadge status={e.status} />
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {e.lift_v1 == null ? <span style={{ color: 'var(--text-tertiary)' }}>—</span> : <LiftCell lift={Number(e.lift_v1)} />}
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    <PyqDeltaCell delta={pyqDeltaOf(e)} />
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {e.lift_n ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {e.lift_p == null ? <span style={{ color: 'var(--text-tertiary)' }}>—</span> : Number(e.lift_p).toFixed(3)}
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {formatDate(e.started_at)}
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRecompute(e.id)}
                      disabled={recomputing === e.id}
                      style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.3)', color: 'var(--indigo-ink)', cursor: recomputing === e.id ? 'not-allowed' : 'pointer', opacity: recomputing === e.id ? 0.5 : 1 }}
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

  const tonedStyle: React.CSSProperties =
    tone === 'emerald' ? { background: 'rgba(52,199,89,.06)', color: 'var(--green-ink)' } :
    tone === 'amber'   ? { background: 'rgba(255,149,0,.05)', color: 'var(--orange)' } :
                         { background: 'var(--surface-fill)', color: 'var(--text-secondary)' };

  return (
    <tr style={{ borderBottom: 'var(--hairline) solid var(--separator)' }}>
      <td colSpan={8} style={{ padding: '8px 12px', fontSize: '11px', ...tonedStyle }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Lightbulb size={11} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{suggestion.message}</span>
          {suggestion.cta && (
            <Link
              to={suggestion.cta.href}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', border: '1px solid currentColor', whiteSpace: 'nowrap', color: 'inherit', textDecoration: 'none', opacity: 0.85 }}
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
      style={{
        padding: '8px 12px',
        fontWeight: 500,
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        userSelect: 'none',
        textAlign: align === 'right' ? 'right' : 'left',
        cursor: sortable ? 'pointer' : 'default',
        color: active ? 'var(--indigo-ink)' : 'var(--text-tertiary)',
        whiteSpace: 'nowrap',
      }}
      onClick={sortable ? () => onClick!(sortKey!) : undefined}
    >
      <span>{label}</span>
      {active && <span style={{ marginLeft: '4px' }}>{dir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );
}

function StatusBadge({ status }: { status: ExperimentStatus }) {
  const styleMap: Record<ExperimentStatus, React.CSSProperties> = {
    active:       { background: 'rgba(88,86,214,.08)', color: 'var(--indigo-ink)', border: '1px solid rgba(88,86,214,.3)' },
    won:          { background: 'rgba(52,199,89,.06)', color: 'var(--green-ink)', border: '1px solid rgba(52,199,89,.22)' },
    lost:         { background: 'rgba(255,59,48,.06)', color: 'var(--red)', border: '1px solid rgba(255,59,48,.22)' },
    inconclusive: { background: 'var(--surface-fill)', color: 'var(--text-secondary)', border: 'var(--hairline) solid var(--separator)' },
    aborted:      { background: 'var(--surface-fill)', color: 'var(--text-tertiary)', border: 'var(--hairline) solid var(--separator)' },
  };
  const iconMap: Record<ExperimentStatus, any> = {
    active: Clock,
    won: CheckCircle2,
    lost: XCircle,
    inconclusive: Minus,
    aborted: Minus,
  };
  const labelMap: Record<ExperimentStatus, string> = {
    active: 'Active',
    won: 'Won',
    lost: 'Lost',
    inconclusive: 'Inconc.',
    aborted: 'Aborted',
  };
  const Icon = iconMap[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, ...styleMap[status] }}>
      <Icon size={10} />
      {labelMap[status]}
    </span>
  );
}

function LiftCell({ lift }: { lift: number }) {
  const positive = lift > 0;
  const color = lift > 0.05 ? 'var(--green-ink)' : lift < -0.02 ? 'var(--red)' : 'var(--text-secondary)';
  const Icon = lift > 0.05 ? TrendingUp : lift < -0.02 ? TrendingDown : Minus;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color }}>
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
  if (delta == null) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  const positive = delta > 0;
  const color = delta > 0.05 ? 'var(--green-ink)' : delta < -0.02 ? 'var(--red)' : 'var(--text-secondary)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color }}>
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
