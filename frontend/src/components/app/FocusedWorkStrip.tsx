/**
 * FocusedWorkStrip — T14 (B5, DR-4): the "focused work" meter that lives
 * inside NextBestActionCard, below the readiness line. Speaks MINUTES to
 * the student — "XP" stays an internal unit name (API field `total_minutes`
 * IS minutes; there is no XP number anywhere in this component).
 *
 * GET /api/practice/xp/summary → { total_minutes, threshold_minutes, quiz_offer }
 *
 * At/above threshold, this strip's slot becomes the checkpoint-quiz offer
 * row (DR-3/DR-4) — never a second focal element, never a toast.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '@/lib/auth/client';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface XpSummary {
  total_minutes: number;
  threshold_minutes: number;
  quiz_offer: { eligible: boolean; reason?: string; quiz_length?: number };
}

export function FocusedWorkStrip() {
  const [summary, setSummary] = useState<XpSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const mountedFillRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    authFetch('/api/practice/xp/summary')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: XpSummary) => { if (!cancelled) setSummary(data); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  // Hidden on fetch error (the strip, not the whole card) — an honest
  // absence rather than a broken meter.
  if (failed || !summary) return null;

  const atThreshold = summary.total_minutes >= summary.threshold_minutes;

  if (atThreshold) {
    if (summary.quiz_offer.eligible) {
      return (
        <div style={stripWrapStyle}>
          <Link
            to="/checkpoint"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              textDecoration: 'none', color: 'var(--text-primary)',
            }}
          >
            <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>
              Checkpoint quiz ready · {summary.quiz_offer.quiz_length ?? 6} questions · whenever you are
            </span>
            <span style={{ fontSize: 'var(--text-footnote)', color: 'var(--green-ink)', fontWeight: 'var(--weight-semibold)', flexShrink: 0, marginLeft: 8 }}>
              Start →
            </span>
          </Link>
        </div>
      );
    }
    return (
      <div style={stripWrapStyle}>
        <span style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
          {summary.quiz_offer.reason ?? 'Checkpoint unlocks as you practise more'}
        </span>
      </div>
    );
  }

  const pct = summary.threshold_minutes > 0
    ? Math.max(0, Math.min(100, (summary.total_minutes / summary.threshold_minutes) * 100))
    : 0;

  if (summary.total_minutes <= 0) {
    return (
      <div style={stripWrapStyle}>
        <span style={{ fontSize: 15, color: 'var(--text-secondary)' }}>Your first focused minutes land here</span>
      </div>
    );
  }

  // Fill-once on entry: the bar snaps to its width on mount and never
  // transitions again on subsequent renders (a re-fetch with a new value
  // should not re-animate). `prefers-reduced-motion` skips the transition
  // entirely — the bar simply appears at its final width.
  const shouldAnimate = !mountedFillRef.current && !reducedMotion;
  mountedFillRef.current = true;

  return (
    <div style={stripWrapStyle}>
      <ProgressBar
        value={pct}
        tone="mastery"
        height={3}
        label="Focused work"
        trailing={`${summary.total_minutes} / ${summary.threshold_minutes} min`}
        labelRegister="supporting"
        monoTrailing
        disableTransition={!shouldAnimate}
      />
    </div>
  );
}

const stripWrapStyle: React.CSSProperties = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: 'var(--hairline) solid var(--separator)',
};
