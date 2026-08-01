/**
 * ExamReadiness — Composite exam readiness score + breakdown.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Brain, AlertTriangle, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { apiFetch } from '@/hooks/useApi';
import { MasteryRing } from '@/components/ui/MasteryRing';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface ReadinessData {
  score: number;
  breakdown: {
    coverage: number;
    accuracy: number;
    srHealth: number;
    weakSpots: number;
    consistency: number;
  };
  daysLeft: number;
  topicsAttempted: number;
  weakTopicCount: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(value * progress));
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);
  return <>{display}</>;
}

const BREAKDOWN_ITEMS = [
  { key: 'coverage',    label: 'Topic Coverage', icon: Target },
  { key: 'accuracy',   label: 'Accuracy',       icon: TrendingUp },
  { key: 'srHealth',   label: 'Review Health',  icon: Brain },
  { key: 'weakSpots',  label: 'Weak Spots',     icon: AlertTriangle },
  { key: 'consistency', label: 'Consistency',   icon: Flame },
] as const;

/** Compact badge for GateHome hero */
export function ExamReadinessBadge({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<ReadinessData | null>(null);

  useEffect(() => {
    apiFetch<ReadinessData>(`/api/exam-readiness/${sessionId}`).then(setData).catch(() => {});
  }, [sessionId]);

  if (!data) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-raise)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <MasteryRing
          value={data.score}
          size={56}
          stroke={4}
          label={
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)' }}>
              <AnimatedNumber value={data.score} />
            </span>
          }
        />
        <div>
          <p style={{ margin: 0, fontSize: 'var(--text-footnote)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Exam Readiness</p>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{data.topicsAttempted}/10 topics started</p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{data.daysLeft}</p>
        <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>days left</p>
      </div>
    </div>
  );
}

/** Expanded breakdown for ProgressPage */
export function ExamReadinessBreakdown({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    apiFetch<ReadinessData>(`/api/exam-readiness/${sessionId}`).then(setData).catch(() => {});
  }, [sessionId]);

  if (!data) return null;

  const tone = data.score >= 70 ? 'mastery' : 'neutral';
  const scoreColor = data.score >= 70 ? 'var(--green-ink)' : data.score >= 40 ? 'var(--orange)' : 'var(--red)';

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-raise)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: scoreColor, fontVariantNumeric: 'tabular-nums' }}>
            {data.score}%
          </span>
          <span style={{ fontSize: 'var(--text-footnote)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
            Exam Readiness Score
          </span>
        </div>
        {expanded
          ? <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} />
          : <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />}
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {BREAKDOWN_ITEMS.map(({ key, label, icon: Icon }) => {
            const value = data.breakdown[key];
            return (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={14} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{value}%</span>
                </div>
                <ProgressBar value={value} tone={value >= 70 ? 'mastery' : value >= 40 ? 'neutral' : 'warning'} />
              </div>
            );
          })}
          {data.weakTopicCount > 0 && (
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--orange)' }}>
              {data.weakTopicCount} weak topic{data.weakTopicCount > 1 ? 's' : ''} need attention
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
