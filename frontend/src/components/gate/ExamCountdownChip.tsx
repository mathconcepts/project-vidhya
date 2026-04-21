/**
 * ExamCountdownChip
 *
 * Shown on student home ONLY when the student has an exam_id assigned.
 * Self-gating — renders nothing for students without an exam.
 *
 * Urgency tiers:
 *   - critical (≤7 days): rose styling, bold countdown
 *   - high (≤30 days): amber, days to go
 *   - medium (≤90 days): sky, weeks to go
 *   - low (>90d or no date): neutral, just the exam name
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Zap } from 'lucide-react';
import { clsx } from 'clsx';
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
  if (days <= 7) return `${days} days`;
  if (days <= 30) return `${days} days`;
  if (days <= 90) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

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
  const tier = ctx.exam_is_imminent ? 'critical' : ctx.exam_is_close ? 'high' : ctx.days_to_exam !== null ? 'medium' : 'low';
  const icon = tier === 'critical' ? Zap : tier === 'high' ? Clock : Calendar;
  const Icon = icon;

  const toneClass =
    tier === 'critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
    : tier === 'high' ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
    : tier === 'medium' ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
    : 'bg-surface-900 border-surface-800 text-surface-300';

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'p-2.5 rounded-xl border flex items-center gap-2',
        toneClass,
      )}
    >
      <Icon size={13} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wide opacity-80 font-medium">
          Your exam
        </p>
        <p className="text-xs font-medium truncate">{ctx.exam_name}</p>
      </div>
      {label && (
        <div className="text-right shrink-0">
          <p className="text-sm font-bold leading-none">{label}</p>
          <p className="text-[9px] opacity-80 uppercase">to go</p>
        </div>
      )}
    </motion.div>
  );
}
