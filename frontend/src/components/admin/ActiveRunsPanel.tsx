/**
 * ActiveRunsPanel — shows queued + running generation runs.
 *
 * Operator can see at a glance which runs are in flight, their cost so far,
 * and how many artifacts have been produced. Abort button on queued/running.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Activity, RefreshCw, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { abortRun, type GenerationRunRow, type GenerationRunStatus } from '@/api/admin/content-rd';
import { fadeInUp } from '@/lib/animations';

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
    <motion.section variants={fadeInUp} className="space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-surface-100 flex items-center gap-2">
            <Activity size={14} className="text-violet-400" />
            Recent runs
          </h2>
          <p className="text-[11px] text-surface-500 mt-0.5">
            Last 10 generation runs. Abort cancels in-flight LLM calls.
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200 disabled:opacity-50"
            aria-label="Refresh runs"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
        )}
      </header>

      <div className="rounded-xl border border-surface-800 bg-surface-950 divide-y divide-surface-800">
        {visible.length === 0 && !loading && (
          <div className="p-6 text-center text-xs text-surface-500">
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
    <div className="p-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] text-surface-500">{run.id}</span>
          <RunStatusBadge status={run.status} />
        </div>
        <div className="text-xs text-surface-300 mt-1.5 truncate">
          {run.hypothesis ?? '(no hypothesis)'}
        </div>
        <div className="text-[11px] text-surface-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{run.exam_pack_id}</span>
          <span>·</span>
          <span>tier: <span className="text-surface-400">{run.config.verification?.tier_ceiling}</span></span>
          <span>·</span>
          <span>artifacts: <span className="text-surface-400">{ratio}</span></span>
          <span>·</span>
          <span>${(Number.isFinite(cost) ? cost : 0).toFixed(3)}</span>
          {run.config.quota?.max_cost_usd && (
            <span className="text-surface-600">/ ${run.config.quota.max_cost_usd.toFixed(2)} cap</span>
          )}
        </div>
      </div>
      {canAbort && (
        <button
          onClick={onAbort}
          disabled={aborting}
          className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 disabled:opacity-50"
          aria-label={`Abort run ${run.id}`}
        >
          {aborting ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
        </button>
      )}
    </div>
  );
}

function RunStatusBadge({ status }: { status: GenerationRunStatus }) {
  const map: Record<GenerationRunStatus, string> = {
    queued:   'bg-violet-500/10 text-violet-300 border-violet-500/30',
    running:  'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    complete: 'bg-surface-800 text-surface-300 border-surface-700',
    aborted:  'bg-surface-800 text-surface-500 border-surface-700',
    failed:   'bg-red-500/10 text-red-300 border-red-500/30',
  };
  return (
    <span className={clsx('inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium', map[status])}>
      {status}
    </span>
  );
}
