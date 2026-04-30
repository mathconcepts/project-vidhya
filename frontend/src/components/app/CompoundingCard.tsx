/**
 * CompoundingCard (v2.6) — periodic Compounding-evidence surface.
 *
 * The v2.4 design system anchored the product on Compounding: "every rep
 * adds; what you cracked in October is still with you in November." This
 * card makes that promise visible inside the daily product loop.
 *
 * Behavior:
 *   - Dismissible (per-day localStorage).
 *   - Loads from /api/student/compounding (fail-soft: render nothing if API
 *     unavailable or returns no data).
 *   - Subtle by default, click-to-expand for deeper analytics.
 *
 * Where it shows up:
 *   - Home page (visible periodically — every 7 days OR after a streak of 3+
 *     completed sessions; backend decides via `should_show` flag).
 *   - PlannedSessionPage post-session ("nice work, here's what compounded").
 *
 * Failure modes:
 *   - Network error → render nothing. No error UI on Home.
 *   - Empty data → render nothing.
 *   - Localstorage blocked → re-show every load (acceptable).
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Sparkles, X, ChevronRight } from 'lucide-react';

interface CompoundingEvidence {
  /** Backend decides whether to show this card (e.g. weekly cadence, streak). */
  should_show: boolean;
  /** One-line headline, e.g., "47 problems this month — 12 concepts mastered." */
  headline: string;
  /** Optional supporting line, e.g., "What you cracked in October is still with you (87% retention)." */
  subline?: string;
  /** Detailed metrics shown on expand. */
  details?: Array<{ label: string; value: string | number; hint?: string }>;
}

const DISMISS_KEY = 'vidhya.compounding.dismissed.v1';
const DISMISS_TTL_HOURS = 20; // re-show next day even if dismissed

function isDismissedToday(): boolean {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    const ts = parseInt(v, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_TTL_HOURS * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function dismissForToday(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch { /* localStorage blocked — accept re-show */ }
}

interface Props {
  /** Override the API endpoint for testing. */
  endpoint?: string;
}

export function CompoundingCard({ endpoint = '/api/student/compounding' }: Props) {
  const [data, setData] = useState<CompoundingEvidence | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(() => isDismissedToday());

  useEffect(() => {
    if (dismissed) return;
    let cancelled = false;
    fetch(endpoint, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then((body: CompoundingEvidence | null) => {
        if (cancelled) return;
        if (body && body.should_show && body.headline) setData(body);
      })
      .catch(() => { /* fail soft */ });
    return () => { cancelled = true; };
  }, [endpoint, dismissed]);

  if (dismissed || !data) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissForToday();
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-surface-900 to-emerald-500/8 overflow-hidden"
      >
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full text-left p-3 flex items-start gap-3 hover:bg-violet-500/5 transition-colors"
        >
          <div className="shrink-0 mt-0.5">
            <TrendingUp size={16} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-100 leading-snug">
              {data.headline}
            </p>
            {data.subline && (
              <p className="text-xs text-surface-400 mt-1 leading-relaxed">
                {data.subline}
              </p>
            )}
            {data.details && data.details.length > 0 && (
              <span className="inline-flex items-center gap-1 mt-2 text-[11px] text-violet-400">
                {expanded ? 'Less' : 'More detail'} <ChevronRight size={11} className={expanded ? 'rotate-90' : ''} />
              </span>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 -m-1 rounded hover:bg-surface-800 transition-colors"
            aria-label="Dismiss"
          >
            <X size={12} className="text-surface-500" />
          </button>
        </button>

        {expanded && data.details && data.details.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-violet-500/15 px-3 py-3 grid grid-cols-2 gap-3"
          >
            {data.details.map((d, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-display font-bold text-surface-100">{d.value}</p>
                <p className="text-[10px] text-surface-400 uppercase tracking-wide">{d.label}</p>
                {d.hint && <p className="text-[10px] text-surface-500 mt-0.5">{d.hint}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* eslint-disable react-refresh/only-export-components */
export const _testHelpers = {
  isDismissedToday,
  dismissForToday,
  DISMISS_KEY,
};
