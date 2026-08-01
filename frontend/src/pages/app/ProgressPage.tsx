/**
 * ProgressPage — Progress overview with mastery rings, stats, and topic list.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { CountUp } from '@/components/app/CountUp';
import { ExamReadinessBreakdown } from '@/components/app/ExamReadiness';
import { ExamCountdownChip } from '@/components/app/ExamCountdownChip';
import { StatTile } from '@/components/ui/StatTile';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { BarChart3, Clock, ChevronRight, Sparkles, Calendar, FileText, BookOpen, Brain, Target } from 'lucide-react';

interface TopicStat {
  topic: string;
  totalProblems: number;
  correct: number;
  attempts: number;
  mastery: number;
  easiness: number;
  due: number;
}

interface WeakTopic {
  topic: string;
  mastery: number;
  easiness: number;
  due: number;
}

interface ProgressData {
  topics: TopicStat[];
  overall: {
    problems_attempted: string;
    total_correct: string;
    total_attempts: string;
    due_today: string;
  };
  weakTopics: WeakTopic[];
}

const gbLinks = [
  { to: '/materials',    icon: <BookOpen size={18} style={{ color: 'var(--green-ink)' }} />,   label: 'Your Materials',   sub: 'Upload notes, textbooks — GBrain learns from them' },
  { to: '/smart-practice', icon: <Sparkles size={18} style={{ color: 'var(--indigo-ink)' }} />, label: 'Smart Practice',   sub: 'Adaptive problems matched to your weak areas' },
  { to: '/audit',        icon: <FileText size={18} style={{ color: 'var(--green-ink)' }} />,   label: 'Your Audit',       sub: '360° analysis: mastery, cognition, action plan' },
  { to: '/digest',       icon: <Calendar size={18} style={{ color: 'var(--indigo-ink)' }} />,  label: 'Weekly Digest',    sub: 'This week\'s progress, growth proof, one action' },
  { to: '/mock-exam',    icon: <Target size={18} style={{ color: 'var(--red)' }} />,            label: 'Mock Exam',        sub: 'Full-length, timed, GBrain-calibrated' },
  { to: '/error-patterns', icon: <Brain size={18} style={{ color: 'var(--orange)' }} />,        label: 'Error Patterns',   sub: 'Weekly error digest, misconceptions, recommendations' },
];

export default function ProgressPage() {
  const sessionId = useSession();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllTopics, setShowAllTopics] = useState(false);

  useEffect(() => {
    trackEvent('page_view', { page: 'progress' });
    apiFetch<ProgressData>(`/api/progress/${sessionId}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 64, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} />
        ))}
      </div>
    );
  }

  if (!data || data.topics.length === 0) {
    return (
      <EmptyState
        glyph={<BarChart3 size={28} style={{ color: 'var(--text-tertiary)' }} />}
        body="Start practising to see your progress here."
        action={<Button size="md" tone="mastery" onClick={() => window.location.href = '/'}>Start Practising</Button>}
      />
    );
  }

  const overall = data.overall;
  const totalAttempts = parseInt(overall.total_attempts) || 0;
  const totalCorrect = parseInt(overall.total_correct) || 0;
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const dueToday = parseInt(overall.due_today) || 0;
  const allCaughtUp = dueToday === 0;

  const weakSet = useMemo(() => new Set(data.weakTopics.map(w => w.topic)), [data.weakTopics]);
  const sortedTopics = useMemo(() => [...data.topics].sort((a, b) => a.mastery - b.mastery), [data.topics]);
  const WEAK_LIMIT = Math.max(weakSet.size, 3);
  const visibleTopics = showAllTopics ? sortedTopics : sortedTopics.slice(0, WEAK_LIMIT);
  const hasMoreTopics = sortedTopics.length > WEAK_LIMIT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.018em' }}>
        Your Progress
      </h1>

      <ExamCountdownChip />

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatTile
          value={<CountUp target={parseInt(overall.problems_attempted) || 0} className="" />}
          label="Problems"
        />
        <StatTile
          value={<><CountUp target={accuracy} className="" />%</>}
          label="Accuracy"
          tone={accuracy >= 70 ? 'mastery' : 'neutral'}
        />
        <StatTile
          value={<CountUp target={dueToday} className="" />}
          label="Due Today"
          tone={dueToday === 0 ? 'mastery' : 'neutral'}
        />
      </div>

      {/* Exam Readiness */}
      <ExamReadinessBreakdown sessionId={sessionId} />

      {/* All caught up */}
      {allCaughtUp && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(52,199,89,.08)',
            border: '1px solid rgba(52,199,89,.2)',
          }}
        >
          <p style={{ margin: 0, fontSize: 'var(--text-footnote)', fontWeight: 'var(--weight-semibold)', color: 'var(--green-ink)' }}>
            You're all caught up!
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
            Come back tomorrow for more reviews.
          </p>
        </div>
      )}

      {/* Topics — weakest first */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: 'var(--text-subhead)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
          Topics
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {visibleTopics.map((topic, i) => {
            const name = topic.topic.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const masteryPct = Math.round(topic.mastery * 100);
            const tone = masteryPct >= 70 ? 'mastery' : masteryPct >= 40 ? 'neutral' : 'warning';

            return (
              <Link
                key={topic.topic}
                to={`/topic/${topic.topic}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 0',
                  borderBottom: i < visibleTopics.length - 1 ? 'var(--hairline) solid var(--separator)' : 'none',
                  textDecoration: 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 'var(--text-body)', color: 'var(--text-primary)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 8 }}>{masteryPct}%</span>
                  </div>
                  <ProgressBar value={masteryPct} tone={tone as any} />
                  {topic.due > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                      <Clock size={10} /> {topic.due} due
                    </span>
                  )}
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </Link>
            );
          })}
        </div>
        {hasMoreTopics && !showAllTopics && (
          <button
            onClick={() => setShowAllTopics(true)}
            style={{
              width: '100%',
              padding: '10px 0',
              fontSize: 'var(--text-footnote)',
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Show all {sortedTopics.length} topics
          </button>
        )}
      </div>

      {/* GBrain links — plain list on canvas */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: 'var(--text-subhead)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
          GBrain Intelligence
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {gbLinks.map((row, i) => (
            <Link
              key={row.to}
              to={row.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                borderBottom: i < gbLinks.length - 1 ? 'var(--hairline) solid var(--separator)' : 'none',
                textDecoration: 'none',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-xs)', background: 'var(--surface-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {row.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', letterSpacing: '-0.01em', fontWeight: 'var(--weight-medium)' }}>{row.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{row.sub}</p>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
