/**
 * CompoundingCard (v4.0) — periodic Compounding-evidence surface.
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
import { authFetch } from '@/lib/auth/client';

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
    authFetch(endpoint)
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
    authFetch(`/api/streak/${sessionId}`)
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

  const details = data.details
    ? data.details.map(d => {
        if (d.label === 'streak') {
          if (streak !== null && streak > 0) {
            return { ...d, value: streak, hint: 'day streak' };
          }
          return null;
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
        style={{
          width: '100%',
          borderRadius: 'var(--radius-md)',
          border: 'var(--hairline) solid var(--separator)',
          background: 'var(--surface-card)',
          boxShadow: 'var(--shadow-raise)',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={handleExpand}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ flexShrink: 0, marginTop: 2 }}>
            <TrendingUp size={16} style={{ color: 'var(--indigo-ink)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', lineHeight: 1.35 }}>
              {data.headline}
            </p>
            {data.subline && (
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                {data.subline}
              </p>
            )}
            {details && details.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: 'var(--indigo-ink)' }}>
                {expanded ? 'Less' : 'More detail'}{' '}
                <ChevronRight size={11} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              </span>
            )}
          </div>
          <button
            onClick={handleDismiss}
            style={{ flexShrink: 0, padding: 4, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Dismiss"
          >
            <X size={12} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </button>

        {expanded && details && details.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              borderTop: 'var(--hairline) solid var(--separator)',
              padding: '12px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {details.map((d, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{d.value}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.label}</p>
                {d.hint && <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-tertiary)' }}>{d.hint}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
