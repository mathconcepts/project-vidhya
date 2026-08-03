/**
 * WeeklyDigestPage — student-facing weekly progress report.
 * Opens a tone-calibrated summary with one concrete action for the week.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { CountUp } from '@/components/app/CountUp';
import { Calendar, Flame, TrendingUp, Target, AlertCircle, Sparkles } from 'lucide-react';
import { isDemoMode, isSeededRole, getDemoRole } from '@/lib/demoMode';
import { SampleDataChip } from '@/components/app/SampleDataChip';

interface Digest {
  session_id: string;
  generated_at: string;
  opening: string;
  stats: {
    problems_this_week: number;
    accuracy_pct: number;
    streak_days: number;
    errors_fixed: number;
  };
  growth_proof: string;
  ugly_truth: string | null;
  one_action: string;
  predicted_score: {
    current_trajectory: number;
    range: string;
  };
}

export default function WeeklyDigestPage() {
  const sessionId = useSession();
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackEvent('page_view', { page: 'weekly-digest' });
    apiFetch<Digest>(`/api/gbrain/weekly-digest/${sessionId}`)
      .then(setDigest)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: 96, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} className="animate-pulse" />
        ))}
      </div>
    );
  }

  if (!digest) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
      >
        <Calendar size={48} style={{ color: 'var(--text-tertiary)' }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)' }}>Digest unavailable</h2>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Come back next week for your progress summary.</p>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          This Week
          {isDemoMode() && isSeededRole(getDemoRole()) && <SampleDataChip />}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
          {new Date(digest.generated_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Opening */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 20, borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.06)', border: '1px solid rgba(88,86,214,.22)' }}
      >
        <Sparkles size={20} style={{ color: 'var(--indigo-ink)', marginBottom: 12 }} />
        <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 'var(--weight-medium)' }}>{digest.opening}</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
      >
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
          <Target size={14} style={{ color: 'var(--indigo-ink)', margin: '0 auto 4px' }} />
          <CountUp target={digest.stats.problems_this_week} style={{ fontSize: 18, fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)', display: 'block' }} />
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>problems solved</p>
        </div>
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
          <TrendingUp size={14} style={{ color: 'var(--green-ink)', margin: '0 auto 4px' }} />
          <CountUp target={digest.stats.accuracy_pct} suffix="%" style={{ fontSize: 18, fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)', display: 'block' }} />
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>accuracy</p>
        </div>
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
          <Flame size={14} style={{ color: 'var(--orange)', margin: '0 auto 4px' }} />
          <CountUp target={digest.stats.streak_days} suffix="d" style={{ fontSize: 18, fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)', display: 'block' }} />
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>day streak</p>
        </div>
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
          <Sparkles size={14} style={{ color: 'var(--indigo-ink)', margin: '0 auto 4px' }} />
          <CountUp target={digest.stats.errors_fixed} style={{ fontSize: 18, fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)', display: 'block' }} />
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>errors fixed</p>
        </div>
      </motion.div>

      {/* Growth Proof */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }}
      >
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 'var(--weight-semibold)', color: 'var(--green-ink)' }}>Growth Proof</p>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{digest.growth_proof}</p>
      </motion.div>

      {/* Ugly Truth */}
      {digest.ugly_truth && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(255,159,10,.06)', border: '1px solid rgba(255,159,10,.22)' }}
        >
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 'var(--weight-semibold)', color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={11} /> The Honest Truth
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{digest.ugly_truth}</p>
        </motion.div>
      )}

      {/* One Action */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.22)' }}
      >
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 'var(--weight-semibold)', color: 'var(--indigo-ink)' }}>Your One Action This Week</p>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 'var(--weight-medium)' }}>{digest.one_action}</p>
      </motion.div>

      {/* Predicted Score */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}
      >
        <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--text-tertiary)' }}>On your current trajectory</p>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
          <CountUp target={digest.predicted_score.current_trajectory} style={{ fontSize: 30, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }} />
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>marks</span>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--text-tertiary)' }}>Range: {digest.predicted_score.range}</p>
      </motion.div>
    </div>
  );
}
