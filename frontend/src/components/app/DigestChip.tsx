/**
 * DigestChip (v4.0) — Monday-morning chip surfacing the weekly digest.
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

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function isMonOrTueLocal(): boolean {
  const day = new Date().getDay();
  return day === 1 || day === 2;
}

export function DigestChip({ sessionId }: Props) {
  const [hasDigest, setHasDigest] = useState(false);
  const inWindow = isMonOrTueLocal();

  const { dismissed, dismiss } = useDismissible({
    key: `vidhya.digest_chip.${isoWeekKey(new Date())}`,
    ttlHours: 7 * 24,
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
        style={{ display: 'inline-flex' }}
      >
        <Link
          to="/digest"
          onClick={() => trackEvent('digest_chip_clicked', {})}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
            height: 32,
            borderRadius: 16,
            background: 'var(--surface-fill)',
            border: 'var(--hairline) solid var(--separator)',
            fontSize: 'var(--text-body)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
          }}
        >
          <BookOpen size={14} style={{ color: 'var(--text-secondary)' }} />
          <span>Weekly report ready</span>
          <button
            type="button"
            onClick={handleDismiss}
            style={{ marginLeft: 4, marginRight: -4, padding: 2, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Dismiss"
          >
            <X size={11} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
