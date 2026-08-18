/**
 * GateHome — "One Thing" Mode.
 *
 * Three user states:
 *   A: No profile → "Set up your study plan"
 *   B: Profile, no diagnostic → "Take the diagnostic"
 *   C: Fully onboarded → One Thing card with progressive disclosure
 *
 * Empty tasks fallback: "Free study day!" + topic grid
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { AnimatePresence, motion } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { useActiveExam } from '@/hooks/useActiveExam';
import { setAnalyticsSession, trackEvent } from '@/lib/analytics';
import { trackPageView } from '@/lib/beacon';
import { StudentWelcomeCard, hasSeenWelcome } from '@/components/app/StudentWelcomeCard';
import { AnnouncementBanner } from '@/components/app/AnnouncementBanner';
import { ExamCountdownChip } from '@/components/app/ExamCountdownChip';
import { CompoundingCard } from '@/components/app/CompoundingCard';
import { DigestChip } from '@/components/app/DigestChip';
import { TaskCard } from '@/components/ui/TaskCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Grid3x3, Activity, GitBranch, Circle, BarChart,
  Hash, Repeat, Layers, Share2, Navigation,
  ArrowRight, SkipForward, RefreshCw, MessageCircle, Camera, FileText,
} from 'lucide-react';

// --- Types ---

interface Topic {
  id: string;
  name: string;
  icon: string;
  problemCount: number;
}

interface TopicMastery {
  topic: string;
  mastery: number;
  attempts: number;
}

interface DailyTask {
  topic: string;
  topic_name: string;
  type: 'practice' | 'study' | 'revise';
  minutes: number;
  priority_score: number;
  content_preview?: {
    pyq_id: string;
    question_text: string;
    options: Record<string, string>;
  } | null;
}

interface DailyPlan {
  id: string;
  tasks: DailyTask[];
  completed: Array<{ task_idx: number; rating: string; completed_at: string }>;
  plan_date: string;
}

interface StudyProfile {
  session_id: string;
  exam_date: string;
  target_score: number;
  weekly_hours: number;
  topic_confidence: Record<string, number>;
  diagnostic_taken_at: string | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  'grid': Grid3x3, 'activity': Activity, 'git-branch': GitBranch,
  'circle': Circle, 'bar-chart': BarChart, 'hash': Hash,
  'repeat': Repeat, 'layers': Layers, 'share-2': Share2, 'navigation': Navigation,
};

// --- Component ---

export function Home() {
  const sessionId = useSession();
  const navigate = useNavigate();
  const [isAnonymous, setIsAnonymous] = useState(true);

  useEffect(() => {
    import('@/lib/auth/client').then(({ authFetch, getToken, clearToken }) => {
      if (!getToken()) { setIsAnonymous(true); return; }
      setIsAnonymous(false);
      authFetch('/api/student/profile')
        .then(r => {
          if (r.status === 401) { clearToken(); return null; }
          return r.ok ? r.json() : null;
        })
        .then((data: any) => {
          const knowledgeTrackId = data?.exams?.[0]?.knowledge_track_id ?? null;
          if (knowledgeTrackId) {
            navigate('/knowledge-home', { replace: true });
          } else if (data?.exams?.length > 0) {
            navigate('/planned', { replace: true });
          }
        })
        .catch(() => {});
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [profile, setProfile] = useState<StudyProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [masteryMap, setMasteryMap] = useState<Record<string, TopicMastery>>({});
  const [ratingLoading, setRatingLoading] = useState(false);
  const [rateError, setRateError] = useState(false);
  const ratingInFlight = useRef(false);

  const prefersReducedMotion = usePrefersReducedMotion();

  const isTaskCompleted = (idx: number): boolean =>
    dailyPlan?.completed?.some(c => c.task_idx === idx) || false;

  const currentTaskIdx = dailyPlan?.tasks?.findIndex((_, i) => !isTaskCompleted(i)) ?? -1;
  const allDone = dailyPlan?.tasks && dailyPlan.tasks.length > 0 && currentTaskIdx === -1;
  const completedCount = dailyPlan?.completed?.length || 0;
  const totalTasks = dailyPlan?.tasks?.length || 0;

  const daysToExam = profile?.exam_date
    ? Math.max(0, Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86400000))
    : null;

  const userState: 'loading' | 'A' | 'B' | 'C' = !profileChecked
    ? 'loading'
    : !profile ? 'A'
    : !profile.diagnostic_taken_at ? 'B'
    : 'C';

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setProfileChecked(false);

    setAnalyticsSession(sessionId);
    trackPageView('/');

    Promise.all([
      apiFetch<{ profile: StudyProfile | null }>(`/api/onboard/${sessionId}`).catch(() => ({ profile: null })),
      apiFetch<{ topics: Topic[] }>('/api/topics').catch(() => ({ topics: [] as Topic[] })),
      apiFetch<{ topics: TopicMastery[] }>(`/api/progress/${sessionId}`).catch(() => ({ topics: [] as TopicMastery[] })),
    ]).then(([profileRes, topicRes, progressRes]) => {
      setProfile(profileRes.profile);
      setProfileChecked(true);
      setTopics(topicRes.topics);

      const map: Record<string, TopicMastery> = {};
      for (const t of (progressRes.topics || [])) map[t.topic] = t;
      setMasteryMap(map);

      if (profileRes.profile?.diagnostic_taken_at) {
        return apiFetch<{ plan: DailyPlan }>(`/api/today/${sessionId}`)
          .then(data => setDailyPlan(data.plan))
          .catch(() => {});
      }
    }).catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [sessionId]);

  const handleRateTask = async (taskIdx: number, rating: string) => {
    if (ratingInFlight.current) return;
    ratingInFlight.current = true;
    setRatingLoading(true);
    setRateError(false);
    try {
      const data = await apiFetch<{ plan: DailyPlan }>(`/api/today/${sessionId}/${taskIdx}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      });
      setDailyPlan(data.plan);
      trackEvent('one_thing_rate', { task_idx: taskIdx, rating });
    } catch {
      setRateError(true);
      setTimeout(() => setRateError(false), 3000);
    } finally {
      ratingInFlight.current = false;
      setRatingLoading(false);
    }
  };

  const handleStartPracticing = (task: DailyTask) => {
    trackEvent('one_thing_tap', { topic: task.topic, type: task.type });
    if (task.content_preview?.pyq_id) {
      navigate(`/practice/${task.content_preview.pyq_id}`);
    } else {
      navigate('/chat');
    }
  };

  // --- Render: Loading ---

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 24, width: 120, borderRadius: 8, background: 'var(--surface-fill)' }} />
          <div style={{ height: 180, borderRadius: 'var(--radius-xl)', background: 'var(--surface-fill)' }} />
          <div style={{ height: 16, width: 80, margin: '0 auto', borderRadius: 8, background: 'var(--surface-fill)' }} />
        </div>
      </div>
    );
  }

  // --- Render: Error ---

  if (error) {
    return (
      <EmptyState
        title="Something went wrong"
        glyph={<RefreshCw size={28} style={{ color: 'var(--text-tertiary)' }} />}
        body="Couldn't load your plan"
        action={
          <Button size="sm" tone="neutral" variant="grey" onClick={fetchData}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Try again
          </Button>
        }
      />
    );
  }

  // --- Render: State A — No profile ---

  if (userState === 'A') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 8 }}>
        {!hasSeenWelcome() && <StudentWelcomeCard />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, margin: '0 auto', width: '100%' }}>
          <Button
            size="lg"
            tone="mastery"
            onClick={() => {
              trackEvent('one_thing_try_now');
              navigate('/session');
            }}
          >
            Try a 15-minute session <ArrowRight size={17} style={{ marginLeft: 6 }} />
          </Button>
          <p style={{ textAlign: 'center', fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', margin: 0 }}>
            No sign-in needed. Save your progress?{' '}
            <button
              onClick={() => { trackEvent('one_thing_sign_in'); navigate('/sign-in'); }}
              style={{ color: 'var(--indigo-ink)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Discovery list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { icon: <MessageCircle size={22} style={{ color: 'var(--indigo-ink)' }} />, label: 'Ask a question', sub: "Type it the way you'd say it out loud." },
            { icon: <Camera size={22} style={{ color: 'var(--indigo-ink)' }} />, label: 'Snap a problem', sub: 'Handwriting is fine.' },
            { icon: <FileText size={22} style={{ color: 'var(--indigo-ink)' }} />, label: 'Upload your notes', sub: 'Lessons get built around what you already have.' },
          ].map((row, i) => (
            <button
              key={i}
              onClick={() => navigate('/chat')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                borderBottom: 'var(--hairline) solid var(--separator)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {row.icon}
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 'var(--text-body)', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{row.label}</span>
                <span style={{ display: 'block', fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: 2 }}>{row.sub}</span>
              </span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 19 }}>›</span>
            </button>
          ))}
        </div>

        <TopicGrid topics={topics} />
      </div>
    );
  }

  // --- Render: State C — All done ---

  if (allDone) {
    const avgMastery = Object.values(masteryMap).length > 0
      ? Math.round(Object.values(masteryMap).reduce((s, t) => s + t.mastery, 0) / Object.values(masteryMap).length * 100)
      : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 20px', gap: 24 }}>
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnnouncementBanner />
          <ExamCountdownChip />
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--green-ink)', fontWeight: 'var(--weight-semibold)' }}>
            {avgMastery}% overall mastery
          </p>
          <h2 style={{ margin: '8px 0 4px', fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.018em' }}>
            Done for today.
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
            {totalTasks} of {totalTasks} tasks completed
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button size="lg" tone="mastery" onClick={() => navigate('/session')}>
            15-min Studymate session
          </Button>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button size="md" tone="neutral" variant="grey" onClick={() => navigate('/progress')} style={{ flex: 1 }}>
              Review progress
            </Button>
            <Button size="md" tone="tutor" variant="tinted" onClick={() => navigate('/chat')} style={{ flex: 1 }}>
              Ask the tutor
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty tasks
  if (!dailyPlan?.tasks?.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center', padding: '32px 0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.018em' }}>
            Free study day!
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
            No tasks scheduled. Pick any topic to practice.
          </p>
          <Button size="md" tone="mastery" onClick={() => navigate('/session')}>
            Start 15-min session
          </Button>
          <button
            onClick={() => navigate('/chat')}
            style={{ fontSize: 'var(--text-footnote)', color: 'var(--indigo-ink)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Or ask the tutor for help →
          </button>
        </div>
        <TopicGrid topics={topics} />
      </div>
    );
  }

  // One Thing card
  const currentTask = dailyPlan.tasks[currentTaskIdx];
  if (!currentTask) return null;
  const isWeakest = currentTaskIdx === 0;
  const whyLine = `${isWeakest ? 'Biggest area to grow' : 'Due for review'}${daysToExam != null ? ` · ${daysToExam} days to go` : ''}`;

  const laterTasks = dailyPlan.tasks.filter((_, i) => i > currentTaskIdx && !isTaskCompleted(i)).slice(0, 2);

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnnouncementBanner />
        <ExamCountdownChip />
        <DigestChip sessionId={sessionId} />
        <CompoundingCard sessionId={sessionId} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentTaskIdx}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.32, 0.72, 0, 1] }}
          style={{ maxWidth: 400, margin: '20px auto 0', width: '100%' }}
          role="region"
          aria-label="Today's priority task"
        >
          <TaskCard
            topic={currentTask.topic_name}
            why={whyLine}
            progress={`${completedCount + 1} of ${totalTasks} tasks today`}
            onRate={(r) => handleRateTask(currentTaskIdx, r)}
            action={
              <Button
                size="lg"
                tone="mastery"
                onClick={() => handleStartPracticing(currentTask)}
                disabled={ratingLoading}
              >
                Start practising <ArrowRight size={16} style={{ marginLeft: 6 }} />
              </Button>
            }
            chips={[
              <Link
                key="explain"
                to={`/chat?prompt=${encodeURIComponent(`Explain ${currentTask.topic_name}`)}`}
                style={{
                  flexShrink: 0, height: 36, padding: '0 14px', display: 'inline-flex', alignItems: 'center',
                  gap: 6, borderRadius: 'var(--radius-capsule)', background: 'var(--surface-fill)',
                  color: 'var(--text-secondary)', fontSize: 'var(--text-subhead)', fontWeight: 'var(--weight-medium)',
                  textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)',
                }}
              >
                Explain {currentTask.topic_name}
              </Link>,
              <Link
                key="solve"
                to={`/chat?prompt=${encodeURIComponent(`Solve a ${currentTask.topic_name} problem step by step`)}`}
                style={{
                  flexShrink: 0, height: 36, padding: '0 14px', display: 'inline-flex', alignItems: 'center',
                  gap: 6, borderRadius: 'var(--radius-capsule)', background: 'var(--surface-fill)',
                  color: 'var(--text-secondary)', fontSize: 'var(--text-subhead)', fontWeight: 'var(--weight-medium)',
                  textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)',
                }}
              >
                Solve step by step
              </Link>,
            ]}
          />

          {rateError && (
            <p style={{ textAlign: 'center', fontSize: 'var(--text-caption)', color: 'var(--red)', marginTop: 8 }} role="alert">
              Couldn't save — tap again
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Later today — plain list on canvas */}
      {laterTasks.length > 0 && (
        <div style={{ maxWidth: 400, margin: '28px auto 0' }}>
          <p style={{ margin: '0 0 8px', fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-semibold)', letterSpacing: '-0.01em' }}>
            Later today
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {laterTasks.map((task, i) => (
              <div key={task.topic} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < laterTasks.length - 1 ? 'var(--hairline) solid var(--separator)' : 'none' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 'var(--text-body)', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{task.topic_name}</span>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{task.minutes} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Topic Grid (fallback for empty tasks) ---

function TopicGrid({ topics }: { topics: Topic[] }) {
  const { exam } = useActiveExam();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {exam && topics.length > 0 && (
        <div style={{ paddingBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {exam.name}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
            {topics.length} {topics.length === 1 ? 'section' : 'sections'} · {exam.concept_count} concepts
          </p>
        </div>
      )}
      {topics.map((topic, i) => {
        const Icon = ICON_MAP[topic.icon] || Grid3x3;
        return (
          <Link
            key={topic.id}
            to={`/topic/${topic.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 0',
              borderBottom: i < topics.length - 1 ? 'var(--hairline) solid var(--separator)' : 'none',
              textDecoration: 'none',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-xs)', background: 'var(--surface-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} style={{ color: 'var(--indigo-ink)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{topic.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{topic.problemCount} problems</p>
            </div>
            <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)' }}>{topic.problemCount}</span>
          </Link>
        );
      })}
    </div>
  );
}
