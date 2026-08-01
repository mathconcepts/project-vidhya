/**
 * ActiveRunsPanel — shows queued + running generation runs.
 *
 * Operator can see at a glance which runs are in flight, their cost so far,
 * and how many artifacts have been produced. Abort button on queued/running.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Activity, RefreshCw, Square } from 'lucide-react';
import { abortRun, type GenerationRunRow, type GenerationRunStatus } from '@/api/admin/content-rd';

interface Props {
  runs: GenerationRunRow[];
  loading?: boolean;
  onRefresh?: () => void;
  onAborted?: (id: string) => void;
}

export function ActiveRunsPanel({ runs, loading, onRefresh, onAborted }: Props) {
  const [aborting, setAborting] = useState<string | null>(null);
  const visible = runs.filter((r) => r.status === 'queued' || r.status === 'running' || r.status === 'complete' || r.status === 'failed' || r.status === 'aborted').slice(0, 10);

  async function handleAbort(id: string) {
    if (!window.confirm(`Abort run ${id}? This stops generation immediately.`)) return;
    setAborting(id);
    try {
      await abortRun(id, 'aborted from admin UI');
      onAborted?.(id);
    } catch {
      // parent's refresh will surface error state
    } finally {
      setAborting(null);
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
            <Activity size={14} style={{ color: 'var(--indigo-ink)' }} />
            Recent runs
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Last 10 generation runs. Abort cancels in-flight LLM calls.
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{ padding: '6px', borderRadius: '8px', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
            aria-label="Refresh runs"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
        )}
      </header>

      <div style={{ borderRadius: '12px', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', overflow: 'hidden' }}>
        {visible.length === 0 && !loading && (
          <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            No runs yet. Configure one in the launcher above.
          </div>
        )}
        {visible.map((r) => (
          <RunRow
            key={r.id}
            run={r}
            onAbort={() => handleAbort(r.id)}
            aborting={aborting === r.id}
          />
        ))}
      </div>
    </motion.section>
  );
}

function RunRow({
  run,
  onAbort,
  aborting,
}: {
  run: GenerationRunRow;
  onAbort: () => void;
  aborting: boolean;
}) {
  const cost = typeof run.cost_usd === 'string' ? parseFloat(run.cost_usd) : run.cost_usd;
  const canAbort = run.status === 'queued' || run.status === 'running';
  const ratio = `${run.artifacts_count}/${run.config.quota?.count ?? '?'}`;

  return (
    <div style={{ padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px', borderBottom: 'var(--hairline) solid var(--separator)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-tertiary)' }}>{run.id}</span>
          <RunStatusBadge status={run.status} />
          {run.batch_state && (
            <span
              style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(88,86,214,.3)', background: 'rgba(88,86,214,.08)', color: 'var(--indigo-ink)', fontSize: '10px', fontWeight: 500 }}
              title={`Batch via ${run.batch_provider ?? 'provider'} — ~50% cost, 24h SLA`}
            >
              batch:{run.batch_state}
            </span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {run.hypothesis ?? '(no hypothesis)'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: '12px', rowGap: '4px' }}>
          <span>{run.exam_pack_id}</span>
          <span>·</span>
          <span>tier: <span style={{ color: 'var(--text-secondary)' }}>{run.config.verification?.tier_ceiling}</span></span>
          <span>·</span>
          <span>artifacts: <span style={{ color: 'var(--text-secondary)' }}>{ratio}</span></span>
          <span>·</span>
          <span>${(Number.isFinite(cost) ? cost : 0).toFixed(3)}</span>
          {run.config.quota?.max_cost_usd && (
            <span style={{ color: 'var(--text-tertiary)' }}>/ ${run.config.quota.max_cost_usd.toFixed(2)} cap</span>
          )}
        </div>
      </div>
      {canAbort && (
        <button
          onClick={onAbort}
          disabled={aborting}
          style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,59,48,.08)', border: '1px solid rgba(255,59,48,.22)', color: 'var(--red)', cursor: aborting ? 'not-allowed' : 'pointer', opacity: aborting ? 0.5 : 1 }}
          aria-label={`Abort run ${run.id}`}
        >
          {aborting ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
        </button>
      )}
    </div>
  );
}

function RunStatusBadge({ status }: { status: GenerationRunStatus }) {
  const styleMap: Record<GenerationRunStatus, React.CSSProperties> = {
    queued:   { background: 'rgba(88,86,214,.08)', color: 'var(--indigo-ink)', border: '1px solid rgba(88,86,214,.3)' },
    running:  { background: 'rgba(52,199,89,.06)', color: 'var(--green-ink)', border: '1px solid rgba(52,199,89,.22)' },
    complete: { background: 'var(--surface-fill)', color: 'var(--text-secondary)', border: 'var(--hairline) solid var(--separator)' },
    aborted:  { background: 'var(--surface-fill)', color: 'var(--text-tertiary)', border: 'var(--hairline) solid var(--separator)' },
    failed:   { background: 'rgba(255,59,48,.06)', color: 'var(--red)', border: '1px solid rgba(255,59,48,.22)' },
  };
  return (
    <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, ...styleMap[status] }}>
      {status}
    </span>
  );
}
