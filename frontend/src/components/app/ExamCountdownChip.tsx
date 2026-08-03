/**
 * ExamCountdownChip — Shows exam name + countdown when the student has an exam assigned.
 * Self-gating: renders nothing for students without an exam.
 *
 * Urgency tiers:
 *   critical (≤7 days): red, bold countdown
 *   high (≤30 days):    orange, days to go
 *   medium (≤90 days):  indigo, weeks to go
 *   low (>90d or none): neutral surface
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Zap } from 'lucide-react';
import { authFetch } from '@/lib/auth/client';

interface ExamContext {
  exam_id: string;
  exam_code: string;
  exam_name: string;
  days_to_exam: number | null;
  exam_is_close: boolean;
  exam_is_imminent: boolean;
  is_fallback: boolean;
  fallback_source_name?: string;
  structural_completeness: number;
}

function countdownLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days <= 30) return `${days} days`;
  if (days <= 90) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

type Tier = 'critical' | 'high' | 'medium' | 'low';

const TIER_STYLE: Record<Tier, { bg: string; border: string; color: string }> = {
  critical: { bg: 'rgba(255,59,48,.08)',   border: 'rgba(255,59,48,.22)',   color: 'var(--red)' },
  high:     { bg: 'rgba(255,159,10,.08)',   border: 'rgba(255,159,10,.22)',   color: 'var(--orange)' },
  medium:   { bg: 'rgba(88,86,214,.07)',   border: 'rgba(88,86,214,.22)',   color: 'var(--indigo-ink)' },
  low:      { bg: 'var(--surface-fill)',   border: 'var(--separator)',       color: 'var(--text-secondary)' },
};

export function ExamCountdownChip() {
  const [ctx, setCtx] = useState<ExamContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await authFetch('/api/exam-context/mine');
        if (r.ok) {
          const data = await r.json();
          setCtx(data.context);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading || !ctx) return null;

  const label = countdownLabel(ctx.days_to_exam);
  const tier: Tier = ctx.exam_is_imminent ? 'critical' : ctx.exam_is_close ? 'high' : ctx.days_to_exam !== null ? 'medium' : 'low';
  const ts = TIER_STYLE[tier];
  const Icon = tier === 'critical' ? Zap : tier === 'high' ? Clock : Calendar;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        background: ts.bg,
        border: `1px solid ${ts.border}`,
      }}
    >
      <Icon size={13} style={{ color: ts.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 'var(--text-caption2)', textTransform: 'uppercase', letterSpacing: '0.06em', color: ts.color, opacity: 0.8 }}>
          Your exam
        </p>
        <p style={{ margin: '1px 0 0', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: ts.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ctx.exam_name}
        </p>
      </div>
      {label && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 'var(--text-subhead)', fontWeight: 'var(--weight-bold)', color: ts.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {label}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption2)', textTransform: 'uppercase', letterSpacing: '0.06em', color: ts.color, opacity: 0.8 }}>
            to go
          </p>
        </div>
      )}
    </motion.div>
  );
}
