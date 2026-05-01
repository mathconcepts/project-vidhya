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

import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { useActiveExam } from '@/hooks/useActiveExam';
import { setAnalyticsSession, trackEvent } from '@/lib/analytics';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { MasteryRing } from '@/components/app/MasteryRing';
import { Confetti } from '@/components/app/Confetti';
import { StudentWelcomeCard, hasSeenWelcome } from '@/components/app/StudentWelcomeCard';
import { AnnouncementBanner } from '@/components/app/AnnouncementBanner';
import { ExamCountdownChip } from '@/components/app/ExamCountdownChip';
import { CompoundingCard } from '@/components/app/CompoundingCard';
import { DigestChip } from '@/components/app/DigestChip';
// v2.6 decoration declutter:
// - GiveawayBanner removed entirely (visual noise vs. the One Thing anchor).
// - YourTeacherCard removed from Home (self-gating component never shows for
//   most students; for those with a teacher, the teacher relationship is
//   visible from the teacher's roster and from chat — no need to repeat on home).
import {
  Grid3x3, Activity, GitBranch, Circle, BarChart,
  Hash, Repeat, Layers, Share2, Navigation,
  ArrowRight, SkipForward, RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';

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

// v2.5: file + function renamed (was GateHome / GateHome.tsx). The
// gate/ directory rename is queued as a follow-up PR (50+ import paths).
export function Home() {
  const sessionId = useSession();
  const navigate = useNavigate();
  // v2.5: track whether the visitor is anonymous so we can render the
  // "New here?" discoverability link to MarketingLanding only for anon users.
  const [isAnonymous, setIsAnonymous] = useState(true);

  // If the user is JWT-authenticated, route them to their persona home:
  //   - knowledge_track_id present → /knowledge-home (Knowledge Shell)
  //   - exams.length > 0, no track → /planned (Exam Shell)
  //   - no profile yet → stay here (onboarding will fire)
  useEffect(() => {
    import('@/lib/auth/client').then(({ authFetch, getToken, clearToken }) => {
      if (!getToken()) { setIsAnonymous(true); return; } // anonymous — stay on GateHome
      setIsAnonymous(false);
      authFetch('/api/student/profile')
        .then(r => {
          if (r.status === 401) { clearToken(); return null; } // stale token
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
        .catch(() => {}); // non-blocking
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [rateError, setRateError] = useState(false);
  const ratingInFlight = useRef(false);

  // Respect prefers-reduced-motion
  const prefersReducedMotion = useMemo(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  , []);

  // Derived state
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

  // --- Fetch ---

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setProfileChecked(false);

    setAnalyticsSession(sessionId);
    trackEvent('page_view', { page: 'home' });

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

      // Load daily plan if onboarded
      if (profileRes.profile?.diagnostic_taken_at) {
        return apiFetch<{ plan: DailyPlan }>(`/api/today/${sessionId}`)
          .then(data => setDailyPlan(data.plan))
          .catch(() => {});
      }
    }).catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [sessionId]);

  // --- Rate / Skip ---

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

      // Check if all done after this rating
      const newCompleted = data.plan.completed?.length || 0;
      if (data.plan.tasks?.length && newCompleted >= data.plan.tasks.length) {
        setShowConfetti(true);
      }
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md space-y-4 px-4">
          <div className="h-6 w-32 rounded-lg bg-surface-800/60 animate-pulse" />
          <div className="h-48 rounded-2xl bg-surface-800/60 animate-pulse" />
          <div className="h-4 w-24 mx-auto rounded-lg bg-surface-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  // --- Render: Error ---

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="text-surface-400 text-sm">Couldn't load your plan</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800 text-surface-200 text-sm font-medium hover:bg-surface-700 transition-colors cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  // --- Render: State A — No profile ---

  if (userState === 'A') {
    return (
      <motion.div
        className="space-y-6 pt-2"
        initial="hidden" animate="visible" variants={staggerContainer}
      >
        {/* Welcome card on first visit */}
        {!hasSeenWelcome() && (
          <motion.div variants={fadeInUp} className="w-full">
            <StudentWelcomeCard />
          </motion.div>
        )}

        {/* Primary CTA — no sign-in required */}
        <motion.div variants={fadeInUp} className="w-full max-w-md mx-auto space-y-3">
          <motion.button
            onClick={() => {
              trackEvent('one_thing_try_now');
              navigate('/session');
            }}
            className="w-full h-12 rounded-[10px] bg-emerald-500 text-white text-[16px] font-bold hover:bg-emerald-400 active:scale-[0.97] transition-all cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950 flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}
          >
            Try a 15-minute session <ArrowRight size={17} />
          </motion.button>
          <p className="text-center text-[13px] text-surface-500">
            No sign-in needed. Save your progress?{' '}
            <button
              onClick={() => { trackEvent('one_thing_sign_in'); navigate('/sign-in'); }}
              className="text-violet-400 hover:text-violet-300 underline cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </motion.div>

        {/* Topic grid — let them browse immediately */}
        <TopicGrid topics={topics} />
      </motion.div>
    );
  }

  // --- Render: State C — Fully onboarded ---

  // All tasks completed → celebration
  if (allDone) {
    const avgMastery = Object.values(masteryMap).length > 0
      ? Math.round(Object.values(masteryMap).reduce((s, t) => s + t.mastery, 0) / Object.values(masteryMap).length * 100)
      : 0;

    return (
      <>
        <Confetti trigger={showConfetti} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <motion.div
            className="w-full max-w-md flex flex-col items-center gap-5 text-center"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            {/* v2.6: Decoration declutter per the v2.4 design system "restrained
                decoration" + v2.5 "frugal layout" principles. Removed GiveawayBanner
                (was visual noise on the home anchor). YourTeacherCard demoted to
                lazy-render below — most students never have a teacher; cluttering
                the One Thing card with a teacher-mention default fights the focus.
                AnnouncementBanner kept (operator-driven, user-relevant).
                ExamCountdownChip kept (Compounding-relevant — days to exam matters). */}
            <motion.div variants={fadeInUp} className="w-full space-y-3">
              <AnnouncementBanner />
              <ExamCountdownChip />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <MasteryRing value={avgMastery} size={64} strokeWidth={3}>
                <span className="text-xs font-bold text-surface-300">{avgMastery}%</span>
              </MasteryRing>
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-2">
              <h2 className="text-[22px] font-display font-black text-surface-100 tracking-tight">
                Done for today!
              </h2>
              <p className="text-[13px] text-surface-500">
                {totalTasks}/{totalTasks} tasks completed
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="w-full flex flex-col gap-3">
              <Link
                to="/session"
                className="w-full h-11 rounded-[10px] bg-emerald-500 text-white text-[15px] font-semibold flex items-center justify-center hover:bg-emerald-400 transition-colors"
              >
                15-min Studymate session
              </Link>
              <div className="flex gap-3">
                <Link
                  to="/progress"
                  className="flex-1 h-11 rounded-[10px] bg-surface-800 text-surface-200 text-[15px] font-semibold flex items-center justify-center hover:bg-surface-700 transition-colors"
                >
                  Review progress
                </Link>
                <Link
                  to="/chat"
                  className="flex-1 h-11 rounded-[10px] bg-violet-500/15 border border-violet-500/25 text-violet-400 text-[15px] font-semibold flex items-center justify-center hover:bg-violet-500/20 transition-colors"
                >
                  Ask the tutor
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </>
    );
  }

  // Empty tasks → "Free study day!" + topic grid fallback
  if (!dailyPlan?.tasks?.length) {
    return (
      <motion.div
        className="space-y-6"
        initial="hidden" animate="visible" variants={staggerContainer}
      >
        <motion.div variants={fadeInUp} className="flex flex-col items-center gap-3 pt-8 pb-4 text-center">
          <h2 className="text-[22px] font-display font-black text-surface-100 tracking-tight">
            Free study day!
          </h2>
          <p className="text-[15px] text-surface-500">
            No tasks scheduled. Pick any topic to practice.
          </p>
          <Link
            to="/session"
            className="mt-2 px-6 h-10 rounded-[10px] bg-emerald-500 text-white text-[14px] font-semibold flex items-center hover:bg-emerald-400 transition-colors"
          >
            Start 15-min session
          </Link>
          <Link to="/chat" className="text-[13px] text-violet-400 hover:text-violet-300 transition-colors">
            Or ask the tutor for help →
          </Link>
        </motion.div>

        <TopicGrid topics={topics} />
      </motion.div>
    );
  }

  // One Thing card — progressive disclosure
  const currentTask = dailyPlan.tasks[currentTaskIdx];
  if (!currentTask) return null;
  const isWeakest = currentTaskIdx === 0;
  const whyLine = `${isWeakest ? 'Biggest area to grow' : 'Due for review'}${daysToExam != null ? ` · ${daysToExam} days to go` : ''}`;

  return (
    <motion.div
      className="pt-2"
      initial="hidden" animate="visible" variants={staggerContainer}
    >
      {/* Teacher-assigned students see announcement banner + teacher card;
          self-study students (taught_by null) see neither — both components self-gate. */}
      {/* v2.6: declutter — Giveaway + YourTeacher banners removed from default
          home stack. AnnouncementBanner kept (operator-driven). ExamCountdown
          kept (Compounding-relevant). CompoundingCard added (the v2.4 promise
          made daily-visible). */}
      <motion.div variants={fadeInUp} className="w-full max-w-md mx-auto mb-3 space-y-2">
        <AnnouncementBanner />
        <ExamCountdownChip />
        <DigestChip sessionId={sessionId} />
        <CompoundingCard sessionId={sessionId} />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentTaskIdx}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
          className="w-full max-w-md mx-auto"
          role="region"
          aria-label="Today's priority task"
        >
          <div className="rounded-2xl bg-surface-900 border border-surface-800 p-6 space-y-4">
            {/* Label */}
            <p className="text-[13px] font-medium text-surface-500">
              Your #{currentTaskIdx + 1} priority
            </p>

            {/* Topic name */}
            <h2 className="text-[32px] font-display font-black text-surface-100 tracking-tight leading-none uppercase">
              {currentTask.topic_name}
            </h2>

            {/* WHY line */}
            <p className="text-[15px] text-surface-400 leading-relaxed">
              {whyLine}
            </p>

            {/* CTA */}
            <motion.button
              onClick={() => handleStartPracticing(currentTask)}
              className="w-full h-11 rounded-[10px] bg-emerald-500 text-white text-[15px] font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900"
              whileTap={{ scale: 0.97 }}
            >
              Start practicing <ArrowRight size={16} />
            </motion.button>

            {/* Quick-help tutor chips */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
              <Link
                to={`/chat?prompt=${encodeURIComponent(`Explain ${currentTask.topic_name}`)}`}
                className="flex-shrink-0 px-3 py-2 rounded-full bg-surface-800 text-surface-300 text-xs hover:bg-surface-700 transition-colors"
              >
                Explain {currentTask.topic_name}
              </Link>
              <Link
                to={`/chat?prompt=${encodeURIComponent(`Solve a ${currentTask.topic_name} problem step by step`)}`}
                className="flex-shrink-0 px-3 py-2 rounded-full bg-surface-800 text-surface-300 text-xs hover:bg-surface-700 transition-colors"
              >
                Solve a problem step by step
              </Link>
            </div>

            {/* Rate error toast */}
            {rateError && (
              <p className="text-xs text-red-400 text-center" role="alert">
                Couldn't save — tap again
              </p>
            )}

            {/* Divider + progress */}
            <div className="border-t border-surface-800 pt-3 flex items-center justify-between">
              <p className="text-[13px] text-surface-600" aria-live="polite">
                {completedCount + 1} of {totalTasks} tasks today
              </p>

              {/* Rating / Skip buttons — 44px min touch targets */}
              <div className="flex gap-2">
                {['easy', 'okay', 'hard'].map(rating => (
                  <button
                    key={rating}
                    onClick={() => handleRateTask(currentTaskIdx, rating)}
                    disabled={ratingLoading}
                    className={clsx(
                      'min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer touch-manipulation',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900',
                      rating === 'easy' && 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
                      rating === 'okay' && 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
                      rating === 'hard' && 'bg-red-500/10 text-red-400 hover:bg-red-500/20',
                      ratingLoading && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {rating === 'easy' ? 'Done' : rating === 'okay' ? 'Okay' : 'Hard'}
                  </button>
                ))}
                <button
                  onClick={() => handleRateTask(currentTaskIdx, 'skip')}
                  disabled={ratingLoading}
                  className={clsx(
                    'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-surface-600 hover:text-surface-400 hover:bg-surface-800 transition-colors cursor-pointer touch-manipulation',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900',
                    ratingLoading && 'opacity-50 cursor-not-allowed',
                  )}
                  aria-label="Skip — not tonight"
                >
                  <SkipForward size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// --- Topic Grid (fallback for empty tasks) ---

function TopicGrid({ topics }: { topics: Topic[] }) {
  // Show the loaded exam name + section count above the grid so users know
  // the framing — these aren't generic "math topics", they're the syllabus
  // sections of the demo's loaded exam (typically GATE Engineering Math).
  // Without this, users assume they picked GATE and were given EM, which
  // is technically the same paper but the mental model breaks down.
  const { exam } = useActiveExam();
  return (
    <motion.div
      className="space-y-2"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {exam && topics.length > 0 && (
        <motion.div variants={fadeInUp} className="pb-1 mb-1">
          <p className="text-[11px] uppercase tracking-wider text-violet-300/80 font-medium">
            {exam.name}
          </p>
          <p className="text-[11px] text-surface-500 mt-0.5">
            {topics.length} {topics.length === 1 ? 'section' : 'sections'} · {exam.concept_count} concepts
          </p>
        </motion.div>
      )}
      {topics.map(topic => {
        const Icon = ICON_MAP[topic.icon] || Grid3x3;

        return (
          <motion.div key={topic.id} variants={fadeInUp}>
            <Link
              to={`/topic/${topic.id}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-900 border border-surface-800 hover:border-violet-500/40 hover:bg-surface-800/80 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors shrink-0">
                <Icon size={18} className="text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-200 leading-tight">{topic.name}</p>
                <p className="text-xs text-surface-500 mt-0.5">{topic.problemCount} problems</p>
              </div>
              <span className="text-[10px] font-mono text-surface-600 shrink-0">
                {topic.problemCount}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
