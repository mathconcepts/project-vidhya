/**
 * CompoundingCard (v4.0) — periodic Compounding-evidence surface.
 *
 * The v2.4 design system anchored the product on Compounding: "every rep
 * adds; what you cracked in October is still with you in November." This
 * card makes that promise visible inside the daily product loop.
 *
 * v4.0 changes:
 *   - dismissibility extracted to useDismissible hook (shared with
 *     DigestChip, WelcomeBackCard).
 *   - live streak wired in via /api/streak/:sessionId (P2). Streak row
 *     hides when fetch fails or value is 0 (failure-soft).
 *
 * Behavior:
 *   - Dismissible (per-day TTL via useDismissible).
 *   - Loads from /api/student/compounding (fail-soft).
 *   - Streak fetched separately from /api/streak/:sessionId.
 *   - Subtle by default, click-to-expand for deeper analytics.
 *
 * Failure modes:
 *   - Network error → render nothing on Home.
 *   - Empty data → render nothing.
 *   - Streak fetch error → streak row hidden, rest of card still renders.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, X, ChevronRight } from 'lucide-react';
import { useDismissible } from '@/hooks/useDismissible';
import { trackEvent } from '@/lib/analytics';

interface CompoundingEvidence {
  should_show: boolean;
  headline: string;
  subline?: string;
  details?: Array<{ label: string; value: string | number; hint?: string }>;
}

interface StreakResponse {
  current_streak: number;
  longest_streak?: number;
  last_practice_date?: string | null;
}

interface Props {
  /** Session id, passed to /api/streak/:id. */
  sessionId?: string;
  /** Override the API endpoint for testing. */
  endpoint?: string;
}

export function CompoundingCard({ sessionId, endpoint = '/api/student/compounding' }: Props) {
  const [data, setData] = useState<CompoundingEvidence | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const { dismissed, dismiss } = useDismissible({
    key: 'vidhya.compounding.dismissed.v1',
    ttlHours: 20,
  });

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

  // P2: separate streak fetch — independent failure mode from compounding.
  useEffect(() => {
    if (dismissed || !sessionId) return;
    let cancelled = false;
    fetch(`/api/streak/${sessionId}`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then((body: StreakResponse | null) => {
        if (cancelled || !body) return;
        if (typeof body.current_streak === 'number') {
          setStreak(body.current_streak);
        }
      })
      .catch(() => { /* fail soft — streak row stays hidden */ });
    return () => { cancelled = true; };
  }, [sessionId, dismissed]);

  if (dismissed || !data) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent('compounding_card_dismissed', {});
    dismiss();
  };

  const handleExpand = () => {
    setExpanded(v => {
      const next = !v;
      if (next) trackEvent('compounding_card_expanded', { streak: streak ?? 0 });
      return next;
    });
  };

  // Build details list — replace the "coming soon" streak placeholder when
  // we have live data, drop the row entirely when streak is 0 (empty-state
  // warmth lives elsewhere; here we just hide the row).
  const details = data.details
    ? data.details.map(d => {
        if (d.label === 'streak') {
          if (streak !== null && streak > 0) {
            return { ...d, value: streak, hint: 'day streak' };
          }
          return null; // hide row
        }
        return d;
      }).filter((d): d is NonNullable<typeof d> => d !== null)
    : data.details;

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
          onClick={handleExpand}
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
            {details && details.length > 0 && (
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

        {expanded && details && details.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-violet-500/15 px-3 py-3 grid grid-cols-2 gap-3"
          >
            {details.map((d, i) => (
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
