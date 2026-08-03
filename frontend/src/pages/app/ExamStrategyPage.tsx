/**
 * ExamStrategyPage — Personalized exam playbook powered by GBrain.
 *
 * Shows: attempt sequence, time budget, skip threshold, score projections,
 * strategic notes, and score maximization study plan.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { CountUp } from '@/components/app/CountUp';
import {
  Target, AlertTriangle, TrendingUp, Zap, ArrowUpRight, Shield,
} from 'lucide-react';

interface AttemptEntry {
  topic: string;
  label: string;
  reason: string;
  expected_accuracy: number;
  avg_time_per_question_sec: number;
}

interface Playbook {
  exam: string;
  attempt_sequence: AttemptEntry[];
  time_budget: Record<string, number>;
  skip_threshold: number;
  expected_score: { optimistic: number; realistic: number; conservative: number };
  strategic_notes: string[];
}

interface ScoreAllocation {
  topic: string;
  label: string;
  current_mastery: number;
  target_mastery: number;
  expected_marks_gain: number;
  hours_needed: number;
  priority_rank: number;
}

interface ScorePlan {
  allocations: ScoreAllocation[];
  total_expected_improvement: number;
  days_until_exam: number;
  daily_hours_needed: number;
}

export default function ExamStrategyPage() {
  const sessionId = useSession();
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [scorePlan, setScorePlan] = useState<ScorePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'playbook' | 'study-plan'>('playbook');

  useEffect(() => {
    trackEvent('page_view', { page: 'exam-strategy' });

    Promise.all([
      authFetch(`/api/gbrain/exam-strategy/${sessionId}`).then(r => r.json()) as Promise<{ playbook: Playbook }>,
      authFetch(`/api/gbrain/score-plan/${sessionId}?days=90&hours=15`).then(r => r.json()) as Promise<{ plan: ScorePlan }>,
    ])
      .then(([pb, sp]) => {
        setPlaybook(pb.playbook);
        setScorePlan(sp.plan);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: 80, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} className="animate-pulse" />
        ))}
      </div>
    );
  }

  if (!playbook) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <Target size={48} style={{ color: 'var(--text-tertiary)' }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)' }}>No strategy yet</h2>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Practice more problems so GBrain can learn your strengths and weaknesses.</p>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Exam Strategy</h1>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>{playbook.exam} — personalized for your profile</p>
      </div>

      {/* Score Projections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'Conservative', value: playbook.expected_score.conservative, color: 'var(--red)' },
          { label: 'Realistic', value: playbook.expected_score.realistic, color: 'var(--orange)' },
          { label: 'Optimistic', value: playbook.expected_score.optimistic, color: 'var(--green-ink)' },
        ].map(s => (
          <div key={s.label} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
            <CountUp target={s.value} style={{ fontSize: 18, fontWeight: 'var(--weight-bold)', color: s.color }} />
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Skip Threshold */}
      <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Shield size={14} style={{ color: 'var(--orange)' }} />
          <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Skip Threshold</span>
        </div>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          With negative marking, skip questions when confidence is below{' '}
          <span style={{ color: 'var(--orange)', fontWeight: 'var(--weight-bold)' }}>{Math.round(playbook.skip_threshold * 100)}%</span>.
          This is calibrated to your accuracy-vs-confidence data.
        </p>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}>
        {[
          { id: 'playbook' as const, label: 'Attempt Order', icon: Zap },
          { id: 'study-plan' as const, label: 'Study Plan', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 0', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: activeTab === tab.id ? 'var(--surface-card)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Playbook Tab */}
      {activeTab === 'playbook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', padding: '0 4px' }}>
            Attempt topics in this order for maximum marks per minute
          </p>

          {playbook.attempt_sequence.map((entry, i) => {
            const accPct = Math.round(entry.expected_accuracy * 100);
            const timeMins = playbook.time_budget[entry.topic] || 0;
            const accColor = accPct >= 70 ? 'var(--green-ink)' : accPct >= 40 ? 'var(--orange)' : 'var(--red)';
            const rankBg = i < 3 ? 'rgba(52,199,89,.12)' : i < 6 ? 'rgba(255,159,10,.08)' : 'var(--surface-fill)';
            const rankColor = i < 3 ? 'var(--green-ink)' : i < 6 ? 'var(--orange)' : 'var(--text-tertiary)';

            return (
              <motion.div
                key={entry.topic}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'var(--weight-bold)', flexShrink: 0, background: rankBg, color: rankColor }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.reason}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, textAlign: 'right' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', color: accColor }}>{accPct}%</p>
                    <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>accuracy</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)' }}>{timeMins}m</p>
                    <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>budget</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Study Plan Tab */}
      {activeTab === 'study-plan' && scorePlan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
              <CountUp target={Math.round(scorePlan.total_expected_improvement)} suffix=" marks" style={{ fontSize: 18, fontWeight: 'var(--weight-bold)', color: 'var(--green-ink)' }} />
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>expected gain</p>
            </div>
            <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
              <CountUp target={Math.round(scorePlan.daily_hours_needed * 10) / 10} suffix=" hrs/day" style={{ fontSize: 18, fontWeight: 'var(--weight-bold)', color: 'var(--indigo-ink)' }} />
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>study needed</p>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', padding: '0 4px' }}>
            Topics ranked by marks gained per hour of study
          </p>

          {scorePlan.allocations.map((alloc) => {
            const currentPct = Math.round(alloc.current_mastery * 100);
            const targetPct = Math.round(alloc.target_mastery * 100);
            const rankBg = alloc.priority_rank <= 3 ? 'rgba(52,199,89,.12)' : 'var(--surface-fill)';
            const rankColor = alloc.priority_rank <= 3 ? 'var(--green-ink)' : 'var(--text-tertiary)';

            return (
              <div
                key={alloc.topic}
                style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'var(--weight-bold)', background: rankBg, color: rankColor }}>
                      {alloc.priority_rank}
                    </span>
                    <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>{alloc.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                    <span style={{ color: 'var(--green-ink)', fontWeight: 'var(--weight-bold)' }}>+{alloc.expected_marks_gain}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>marks</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', width: 32 }}>{currentPct}%</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--surface-fill)', overflow: 'hidden', position: 'relative' }}>
                    <motion.div
                      style={{ height: '100%', borderRadius: 999, background: 'rgba(88,86,214,.6)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${currentPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                    <div
                      style={{ position: 'absolute', top: 0, height: '100%', borderRight: '2px dashed rgba(52,199,89,.5)', left: `${targetPct}%` }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--green-ink)', width: 32 }}>{targetPct}%</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)' }}>
                  <span>~{alloc.hours_needed} hours needed</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowUpRight size={10} style={{ color: 'var(--green-ink)' }} />
                    {currentPct}% → {targetPct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strategic Notes */}
      {playbook.strategic_notes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={13} style={{ color: 'var(--orange)' }} />
            Strategic Notes
          </h2>
          {playbook.strategic_notes.map((note, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>{note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
