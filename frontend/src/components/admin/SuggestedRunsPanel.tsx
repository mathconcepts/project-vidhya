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
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} style={{ color: 'var(--indigo-ink)' }} />
            Suggested follow-up runs
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Proposed by the nightly learnings-ledger based on lift trends. Launching opens a wrapping experiment automatically.
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{ padding: '6px', borderRadius: '8px', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
            aria-label="Refresh suggestions"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
        )}
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence>
          {suggestions.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 8 }}
              style={{ borderRadius: '12px', border: '1px solid rgba(88,86,214,.25)', background: 'rgba(88,86,214,.05)', padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
            >
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--indigo-ink)' }}>{s.hypothesis}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{s.reason}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: '12px', rowGap: '2px', fontFamily: 'var(--font-mono)' }}>
                  <span>{s.exam_pack_id}</span>
                  <span>·</span>
                  <span>count: {s.config.quota?.count ?? '?'}</span>
                  <span>·</span>
                  <span>cap: ${s.config.quota?.max_cost_usd?.toFixed(2) ?? '?'}</span>
                  {s.expected_lift != null && (
                    <>
                      <span>·</span>
                      <span style={{ color: 'var(--green-ink)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => act(s.id, 'launch')}
                  disabled={acting === s.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', background: 'var(--indigo)', color: '#fff', fontSize: '11px', fontWeight: 500, border: 'none', cursor: acting === s.id ? 'not-allowed' : 'pointer', opacity: acting === s.id ? 0.5 : 1 }}
                >
                  {acting === s.id ? <Loader2 size={11} className="animate-spin" /> : <Rocket size={11} />}
                  Launch
                </button>
                <button
                  onClick={() => act(s.id, 'dismiss')}
                  disabled={acting === s.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', fontSize: '11px', cursor: acting === s.id ? 'not-allowed' : 'pointer', opacity: acting === s.id ? 0.5 : 1 }}
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
