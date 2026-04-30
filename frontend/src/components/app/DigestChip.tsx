/**
 * DigestChip (v4.0) — Monday-morning chip surfacing the weekly digest.
 *
 * The Weekly Digest at /digest has the best narrative the product produces
 * (growth proof, ugly truth, one concrete action). But it's orphaned —
 * users have to know the URL. This chip surfaces it on Home, dismissible
 * per-week.
 *
 * Visibility rules:
 *   - Browser-local time (T11): today.getDay() ∈ {1, 2} (Mon or Tue).
 *     Off-by-one across IST/UTC midnight is acceptable noise; this is a
 *     dismissible chip, not data correctness.
 *   - Digest endpoint must return generated_at within last 7 days.
 *   - Failure-soft: 404, parse error, or missing fields → no chip.
 *   - Per-ISO-week dismiss via useDismissible. Once dismissed, hidden
 *     until the next ISO week.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDismissible } from '@/hooks/useDismissible';
import { trackEvent } from '@/lib/analytics';

interface DigestResponse {
  generated_at?: string;
}

interface Props {
  sessionId: string;
}

/**
 * ISO 8601 week-of-year. Used as the dismiss key suffix so dismissing the
 * chip in week 17 doesn't carry into week 18.
 */
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function isMonOrTueLocal(): boolean {
  const day = new Date().getDay(); // 0=Sun, 1=Mon, 2=Tue, browser-local
  return day === 1 || day === 2;
}

export function DigestChip({ sessionId }: Props) {
  const [hasDigest, setHasDigest] = useState(false);
  const inWindow = isMonOrTueLocal();

  const { dismissed, dismiss } = useDismissible({
    key: `vidhya.digest_chip.${isoWeekKey(new Date())}`,
    ttlHours: 7 * 24, // a full ISO week
  });

  useEffect(() => {
    if (!inWindow || dismissed || !sessionId) return;
    let cancelled = false;
    fetch(`/api/gbrain/weekly-digest/${sessionId}`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then((body: DigestResponse | null) => {
        if (cancelled || !body?.generated_at) return;
        const generated = Date.parse(body.generated_at);
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (Number.isFinite(generated) && Date.now() - generated < sevenDaysMs) {
          setHasDigest(true);
        }
      })
      .catch(() => { /* fail soft */ });
    return () => { cancelled = true; };
  }, [sessionId, inWindow, dismissed]);

  useEffect(() => {
    if (hasDigest) trackEvent('digest_chip_shown', {});
  }, [hasDigest]);

  if (!inWindow || dismissed || !hasDigest) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackEvent('digest_chip_dismissed', {});
    dismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="inline-flex"
      >
        <Link
          to="/digest"
          onClick={() => trackEvent('digest_chip_clicked', {})}
          className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-surface-800 border border-surface-700 hover:border-violet-500/50 transition-colors text-sm font-medium text-surface-200 group"
        >
          <BookOpen size={14} className="text-surface-400 group-hover:text-violet-400 transition-colors" />
          <span>Weekly report ready</span>
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-1 -mr-1 p-0.5 rounded hover:bg-surface-700 transition-colors"
            aria-label="Dismiss"
          >
            <X size={11} className="text-surface-500" />
          </button>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
