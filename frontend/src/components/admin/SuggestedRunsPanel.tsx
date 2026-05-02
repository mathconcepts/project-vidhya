/**
 * SuggestedRunsPanel — Sprint C inbox of follow-up runs proposed by the
 * nightly learnings-ledger job. Operator clicks Launch to convert one
 * into a real GenerationRun (which auto-creates a wrapping experiment).
 *
 * Lives above the EffectivenessLedger on /admin/content-rd. Hidden
 * entirely when there are no pending suggestions to keep the page calm.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Rocket, X, RefreshCw, TrendingUp } from 'lucide-react';
import { actOnSuggestion, type RunSuggestionRow } from '@/api/admin/content-rd';
import { fadeInUp } from '@/lib/animations';

interface Props {
  suggestions: RunSuggestionRow[];
  loading?: boolean;
  onRefresh?: () => void;
  onActed?: () => void;
}

export function SuggestedRunsPanel({ suggestions, loading, onRefresh, onActed }: Props) {
  const [acting, setActing] = useState<string | null>(null);

  if (suggestions.length === 0 && !loading) return null;

  async function act(id: string, action: 'launch' | 'dismiss') {
    setActing(id);
    try {
      await actOnSuggestion(id, action);
      onActed?.();
    } catch {
      // parent's refresh will surface error state
    } finally {
      setActing(null);
    }
  }

  return (
    <motion.section variants={fadeInUp} className="space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-surface-100 flex items-center gap-2">
            <Sparkles size={14} className="text-violet-400" />
            Suggested follow-up runs
          </h2>
          <p className="text-[11px] text-surface-500 mt-0.5">
            Proposed by the nightly learnings-ledger based on lift trends. Launching opens a wrapping experiment automatically.
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200 disabled:opacity-50"
            aria-label="Refresh suggestions"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
        )}
      </header>

      <div className="space-y-2">
        <AnimatePresence>
          {suggestions.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="text-xs font-medium text-violet-200">{s.hypothesis}</div>
                <div className="text-[11px] text-surface-400 leading-relaxed">{s.reason}</div>
                <div className="text-[10px] text-surface-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono">
                  <span>{s.exam_pack_id}</span>
                  <span>·</span>
                  <span>count: {s.config.quota?.count ?? '?'}</span>
                  <span>·</span>
                  <span>cap: ${s.config.quota?.max_cost_usd?.toFixed(2) ?? '?'}</span>
                  {s.expected_lift != null && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-400 inline-flex items-center gap-0.5">
                        <TrendingUp size={9} />
                        +{s.expected_lift.toFixed(3)}
                      </span>
                    </>
                  )}
                  {s.expected_n != null && (
                    <>
                      <span>·</span>
                      <span>n was {s.expected_n}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => act(s.id, 'launch')}
                  disabled={acting === s.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-[11px] font-medium disabled:opacity-50"
                >
                  {acting === s.id ? <Loader2 size={11} className="animate-spin" /> : <Rocket size={11} />}
                  Launch
                </button>
                <button
                  onClick={() => act(s.id, 'dismiss')}
                  disabled={acting === s.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-900 hover:bg-surface-800 border border-surface-800 text-surface-400 hover:text-surface-200 text-[11px] disabled:opacity-50"
                >
                  <X size={11} />
                  Dismiss
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
