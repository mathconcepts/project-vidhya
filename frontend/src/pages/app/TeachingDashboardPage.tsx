import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Brain, Lightbulb, Users as UsersIcon, TrendingDown, AlertTriangle,
  Send, MessageCircle, X, Check, Loader2, RefreshCw, ChevronRight,
  ArrowRight, Target, BookMarked,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface Recommendation {
  concept_id: string;
  concept_label: string;
  topic?: string;
  students_below_threshold: number;
  cohort_avg_mastery: number;
  reason: string;
}

interface NextClassResp {
  cohort_size: number;
  cohort_avg_mastery?: number;
  recommendation: Recommendation | null;
  other_struggling?: Array<{ concept_id: string; concept_label: string; cohort_avg_mastery: number; students_affected: number }>;
  flagged_students?: number;
  message?: string;
}

interface Brief {
  concept: { id: string; label: string; topic?: string; canonical_definition?: string; exam_tip?: string };
  cohort: { size: number; avg_mastery: number | null; level: string; students_below_mastery: number; error_pattern_counts: Record<string, number> };
  teaching_brief: {
    common_misconceptions: any[];
    prerequisite_reminders: string[];
    worked_examples: any[];
    suggested_problems: Array<{ id: string; statement: string; year?: number; difficulty?: string }>;
    talking_points: string[];
  };
}

export default function TeachingDashboardPage() {
  const { user, hasRole } = useAuth();
  const [showTeacherWelcome, setShowTeacherWelcome] = useState(
    () => !localStorage.getItem('teaching_welcome_dismissed')
  );
  const [nextClass, setNextClass] = useState<NextClassResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openConceptId, setOpenConceptId] = useState<string | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementPosting, setAnnouncementPosting] = useState(false);
  const [announcementPosted, setAnnouncementPosted] = useState(false);
  const [pushStatus, setPushStatus] = useState<Record<string, 'idle' | 'pushing' | 'done'>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch('/api/teaching/next-class');
      if (r.status === 403) { setError('Teacher role required.'); return; }
      if (!r.ok) { setError(`HTTP ${r.status}`); return; }
      setNextClass(await r.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (hasRole('teacher')) refresh(); else setLoading(false); }, [hasRole, refresh]);

  const openBrief = async (concept_id: string) => {
    setOpenConceptId(concept_id);
    setBrief(null);
    setBriefLoading(true);
    try {
      const r = await authFetch(`/api/teaching/brief/${encodeURIComponent(concept_id)}`);
      if (r.ok) setBrief(await r.json());
    } finally {
      setBriefLoading(false);
    }
  };

  const closeBrief = () => { setOpenConceptId(null); setBrief(null); };

  const pushToReview = async (concept_id: string) => {
    setPushStatus(s => ({ ...s, [concept_id]: 'pushing' }));
    try {
      const r = await authFetch('/api/teaching/push-to-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept_id }),
      });
      if (r.ok) {
        setPushStatus(s => ({ ...s, [concept_id]: 'done' }));
        setTimeout(() => setPushStatus(s => ({ ...s, [concept_id]: 'idle' })), 2500);
      } else {
        setPushStatus(s => ({ ...s, [concept_id]: 'idle' }));
      }
    } catch {
      setPushStatus(s => ({ ...s, [concept_id]: 'idle' }));
    }
  };

  const postAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setAnnouncementPosting(true);
    try {
      const r = await authFetch('/api/teaching/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: announcementText.trim() }),
      });
      if (r.ok) {
        setAnnouncementPosted(true);
        setAnnouncementText('');
        setTimeout(() => setAnnouncementPosted(false), 2500);
      }
    } finally {
      setAnnouncementPosting(false);
    }
  };

  if (!hasRole('teacher')) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-2">
        <AlertTriangle size={24} className="text-amber-400 mx-auto" />
        <p className="text-sm text-surface-300">Teacher role required.</p>
        <p className="text-xs text-surface-500">Your role: {user?.role || 'not signed in'}</p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-5 max-w-3xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      {/* First-time welcome banner */}
      {showTeacherWelcome && (
        <motion.div
          variants={fadeInUp}
          className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/25 flex items-start gap-3"
        >
          <BookOpen size={16} className="shrink-0 mt-0.5 text-emerald-400" />
          <div className="flex-1 space-y-1 text-xs text-surface-300">
            <p className="font-semibold text-surface-100">Welcome to Teaching Hub</p>
            <p>The recommendation below is built from your cohort's real learning data — it tells you what to teach next and shows you a ready-made brief. Use "Push to review" to send practice problems directly to every student's queue.</p>
          </div>
          <button
            onClick={() => { localStorage.setItem('teaching_welcome_dismissed', '1'); setShowTeacherWelcome(false); }}
            className="shrink-0 p-1 rounded text-surface-500 hover:text-surface-300 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-surface-100 flex items-center gap-2">
            <BookOpen size={20} className="text-emerald-400" />
            Teaching
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            What to teach next, based on your cohort.
          </p>
          {/* v2.6: cohort-mastery stat surfaced at the top — this IS the
              teacher-progress signal ("are my students learning what I teach?").
              Was previously buried in a stats-bar at the bottom. */}
          {nextClass && nextClass.cohort_size > 0 && typeof nextClass.cohort_avg_mastery === 'number' && (
            <p className="text-[11px] text-emerald-400 uppercase tracking-wide font-medium mt-2">
              Cohort mastery: {Math.round(nextClass.cohort_avg_mastery * 100)}% across {nextClass.cohort_size} students
            </p>
          )}
          {/* v4.0 P7: link to weekly cohort brief */}
          <a
            href="/teaching/brief"
            className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 mt-1 font-medium"
          >
            This week's brief →
          </a>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200"
          aria-label="refresh"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </motion.div>

      {error && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
          {error}
        </motion.div>
      )}

      {loading && !nextClass ? (
        <div className="text-center py-8 text-surface-500 text-sm">
          <Loader2 size={14} className="inline animate-spin mr-2" />
          Loading...
        </div>
      ) : nextClass && !nextClass.recommendation ? (
        <motion.div variants={fadeInUp} className="p-6 rounded-xl bg-surface-900 border border-surface-800 text-center space-y-2">
          <Target size={24} className="text-surface-600 mx-auto" />
          <p className="text-sm text-surface-300">{nextClass.message}</p>
          {nextClass.cohort_size > 0 && typeof nextClass.cohort_avg_mastery === 'number' && (
            <p className="text-xs text-surface-500">
              Cohort size: {nextClass.cohort_size} · avg mastery: {Math.round(nextClass.cohort_avg_mastery * 100)}%
            </p>
          )}
        </motion.div>
      ) : nextClass?.recommendation ? (
        <>
          {/* v2.6: flagged-students alert promoted to a prominent card when
              count > 0. Was previously a small inline link in the bottom
              stats bar. Teachers care most about students at risk; this
              should be immediate, not buried. */}
          {(nextClass.flagged_students ?? 0) > 0 && (
            <motion.a
              variants={fadeInUp}
              href="/teacher/roster"
              className="block p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/15 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <p className="text-sm font-medium">
                  {nextClass.flagged_students} {nextClass.flagged_students === 1 ? 'student needs' : 'students need'} attention
                </p>
                <span className="ml-auto text-xs">View roster →</span>
              </div>
            </motion.a>
          )}

          {/* Primary: next-class recommendation */}
          <motion.div variants={fadeInUp} className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/8 via-surface-900 to-violet-500/8 border border-emerald-500/25 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[10px] text-emerald-400 uppercase tracking-wide font-medium">
                  Teach next
                </p>
                <h2 className="text-lg font-bold text-surface-100 mt-1 capitalize">
                  {nextClass.recommendation.concept_label}
                </h2>
                <p className="text-xs text-surface-400 mt-1.5 leading-relaxed">
                  {nextClass.recommendation.reason}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-amber-400">
                  {Math.round(nextClass.recommendation.cohort_avg_mastery * 100)}%
                </p>
                <p className="text-[10px] text-surface-500">cohort mastery</p>
              </div>
            </div>

            <button
              onClick={() => openBrief(nextClass.recommendation!.concept_id)}
              className="w-full h-10 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 active:scale-[0.98] inline-flex items-center justify-center gap-2 transition-all"
            >
              <BookMarked size={14} />
              Open teaching brief
            </button>
          </motion.div>

          {/* Cohort stats bar */}
          <motion.div variants={fadeInUp} className="flex items-center gap-3 text-xs text-surface-400">
            <span className="inline-flex items-center gap-1">
              <UsersIcon size={11} />
              {nextClass.cohort_size} students
            </span>
            {typeof nextClass.cohort_avg_mastery === 'number' && (
              <span>· avg {Math.round(nextClass.cohort_avg_mastery * 100)}% mastery</span>
            )}
            {(nextClass.flagged_students ?? 0) > 0 && (
              <>
                <span className="text-surface-600">·</span>
                <a href="/teacher/roster" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1">
                  <AlertTriangle size={11} />
                  {nextClass.flagged_students} need attention
                </a>
              </>
            )}
          </motion.div>

          {/* Other struggling concepts */}
          {nextClass.other_struggling && nextClass.other_struggling.length > 0 && (
            <motion.div variants={fadeInUp} className="space-y-2">
              <p className="text-[10px] text-surface-500 uppercase tracking-wide">Other concepts worth attention</p>
              <div className="space-y-1.5">
                {nextClass.other_struggling.map(c => (
                  <button
                    key={c.concept_id}
                    onClick={() => openBrief(c.concept_id)}
                    className="w-full p-3 rounded-lg bg-surface-900 border border-surface-800 hover:border-surface-700 flex items-center gap-3 text-left group transition-colors"
                  >
                    <TrendingDown size={12} className="shrink-0 text-amber-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-200 capitalize truncate">{c.concept_label}</p>
                      <p className="text-[10px] text-surface-500">{c.students_affected} students · {Math.round(c.cohort_avg_mastery * 100)}% avg</p>
                    </div>
                    <ChevronRight size={12} className="text-surface-600 group-hover:text-surface-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Announcement composer */}
          <motion.div variants={fadeInUp} className="p-4 rounded-xl bg-surface-900 border border-surface-800 space-y-2">
            <p className="text-[10px] text-surface-500 uppercase tracking-wide flex items-center gap-1.5">
              <MessageCircle size={10} />
              Class announcement
            </p>
            <p className="text-[11px] text-surface-500">
              Appears on each of your students' home screens. Latest announcement replaces any previous one.
            </p>
            <textarea
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value.slice(0, 280))}
              placeholder="e.g., We'll continue eigenvalues tomorrow. Please review problem 3 before class."
              className="w-full min-h-[60px] p-2.5 rounded-lg bg-surface-950 border border-surface-800 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-violet-500/50 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className={clsx(
                'text-[10px]',
                announcementText.length > 260 ? 'text-amber-400' : 'text-surface-500'
              )}>
                {announcementText.length} / 280
              </span>
              <button
                onClick={postAnnouncement}
                disabled={!announcementText.trim() || announcementPosting}
                className="px-3 h-8 rounded-lg bg-violet-500 text-white text-xs font-medium hover:bg-violet-400 disabled:opacity-40 inline-flex items-center gap-1.5 transition-all"
              >
                {announcementPosting ? <Loader2 size={11} className="animate-spin" />
                  : announcementPosted ? <><Check size={11} /> Posted</>
                  : <><Send size={11} /> Post</>}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}

      {/* Teaching brief drawer */}
      <AnimatePresence>
        {openConceptId && (
          <TeachingBriefDrawer
            brief={brief}
            loading={briefLoading}
            onClose={closeBrief}
            onPushToReview={() => pushToReview(openConceptId)}
            pushStatus={pushStatus[openConceptId] || 'idle'}
          />
        )}
      </AnimatePresence>

      {/* Design-principle note */}
      <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 flex items-start gap-2.5">
        <Lightbulb size={13} className="shrink-0 mt-0.5 text-violet-400" />
        <div className="text-[11px] text-violet-200/80 leading-relaxed">
          <span className="font-medium text-violet-300">Why this works.</span>{' '}
          Every recommendation and brief is composed from your cohort's actual learning data.
          No guessing, no generic content. The app tells you what your students need; you bring the teaching.
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================

function TeachingBriefDrawer({ brief, loading, onClose, onPushToReview, pushStatus }: {
  brief: Brief | null;
  loading: boolean;
  onClose: () => void;
  onPushToReview: () => void;
  pushStatus: 'idle' | 'pushing' | 'done';
}) {
  const [confidence, setConfidence] = useState<number | null>(null);
  const showPrep = confidence !== null && confidence <= 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-surface-950 border-t border-surface-800 rounded-t-2xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-surface-950/95 backdrop-blur-sm border-b border-surface-800 px-4 py-3 flex items-center justify-between z-10">
          <p className="text-sm font-medium text-surface-100">Teaching brief</p>
          <button onClick={onClose} className="p-1 rounded text-surface-500 hover:text-surface-200">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center py-12 text-surface-500 text-sm">
              <Loader2 size={14} className="inline animate-spin mr-2" />
              Composing brief...
            </div>
          ) : !brief ? (
            <p className="text-sm text-surface-500 text-center py-8">Brief unavailable.</p>
          ) : (
            <>
              {/* Confidence picker — gates prep section. Always shown first so
                  the teacher self-assesses before reading the brief. */}
              <div className="p-3 rounded-xl bg-surface-900 border border-surface-800">
                <p className="text-xs text-surface-400 mb-2">
                  How confident are you teaching <span className="text-surface-200 font-medium capitalize">{brief.concept.label}</span>?
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setConfidence(n)}
                      className={clsx(
                        'flex-1 h-9 rounded-lg text-sm font-semibold transition-colors border',
                        confidence === n
                          ? n <= 2
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-surface-800 border-surface-700 text-surface-400 hover:bg-surface-700',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {confidence !== null && (
                  <p className="text-[11px] mt-1.5 text-surface-500">
                    {confidence <= 2 ? 'Prep section added below — review before class.' : 'You\'re set. Brief is ready.'}
                  </p>
                )}
              </div>

              {/* Your prep — only when confidence ≤ 2 */}
              <AnimatePresence>
                {showPrep && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Section title="Your prep" icon={BookOpen} tone="amber">
                      {brief.concept.canonical_definition && (
                        <div className="mb-3">
                          <p className="text-[10px] uppercase tracking-wider text-surface-500 mb-1">Canonical definition</p>
                          <p className="text-sm text-surface-300 leading-relaxed">{brief.concept.canonical_definition}</p>
                        </div>
                      )}
                      {brief.teaching_brief.worked_examples.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] uppercase tracking-wider text-surface-500 mb-1">Worked examples (first 2)</p>
                          {brief.teaching_brief.worked_examples.slice(0, 2).map((ex: any, i: number) => (
                            <div key={i} className="text-xs text-surface-300 font-mono bg-surface-950 rounded p-2 mb-1">{typeof ex === 'string' ? ex : ex.problem || ex.text || JSON.stringify(ex)}</div>
                          ))}
                        </div>
                      )}
                      {brief.teaching_brief.common_misconceptions.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-surface-500 mb-1">Common misconceptions in your cohort</p>
                          <ul className="space-y-1 text-sm text-surface-300">
                            {brief.teaching_brief.common_misconceptions.slice(0, 3).map((m: any, i: number) => (
                              <li key={i} className="leading-relaxed">{typeof m === 'string' ? m : m.text || m.description || JSON.stringify(m)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Section>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <h2 className="text-lg font-bold text-surface-100 capitalize">{brief.concept.label}</h2>
                {brief.concept.topic && (
                  <p className="text-[10px] text-surface-500 uppercase tracking-wide mt-1">
                    {brief.concept.topic}
                  </p>
                )}
                {brief.concept.canonical_definition && (
                  <p className="text-sm text-surface-300 mt-2 leading-relaxed">
                    {brief.concept.canonical_definition}
                  </p>
                )}
              </div>

              {/* Cohort snapshot */}
              <div className="p-3 rounded-xl bg-surface-900 border border-surface-800 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-surface-100">{brief.cohort.size}</p>
                  <p className="text-[10px] text-surface-500">in cohort</p>
                </div>
                <div>
                  <p className={clsx(
                    'text-lg font-bold',
                    brief.cohort.avg_mastery === null ? 'text-surface-500'
                    : brief.cohort.avg_mastery < 0.4 ? 'text-amber-400'
                    : brief.cohort.avg_mastery < 0.7 ? 'text-violet-400'
                    : 'text-emerald-400',
                  )}>
                    {brief.cohort.avg_mastery === null ? '—' : Math.round(brief.cohort.avg_mastery * 100) + '%'}
                  </p>
                  <p className="text-[10px] text-surface-500">cohort mastery</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-400">{brief.cohort.students_below_mastery}</p>
                  <p className="text-[10px] text-surface-500">below threshold</p>
                </div>
              </div>

              {/* Action: push to review */}
              <button
                onClick={onPushToReview}
                disabled={pushStatus !== 'idle'}
                className={clsx(
                  'w-full h-10 rounded-lg font-medium text-sm inline-flex items-center justify-center gap-2 transition-all',
                  pushStatus === 'done'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-violet-500 text-white hover:bg-violet-400 active:scale-[0.98]',
                )}
              >
                {pushStatus === 'pushing' ? <Loader2 size={13} className="animate-spin" />
                  : pushStatus === 'done' ? <><Check size={13} /> Pushed to all students</>
                  : <><ArrowRight size={13} /> Push to students' review queues</>}
              </button>

              {/* Talking points — the MOST actionable section */}
              {brief.teaching_brief.talking_points.length > 0 && (
                <Section title="Talking points" icon={Lightbulb} tone="amber">
                  <ul className="space-y-2 text-sm text-surface-300">
                    {brief.teaching_brief.talking_points.map((tp, i) => (
                      <li key={i} className="leading-relaxed">{tp}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Misconceptions */}
              {brief.teaching_brief.common_misconceptions.length > 0 && (
                <Section title="Common misconceptions to address" icon={AlertTriangle} tone="rose">
                  <ul className="space-y-2 text-sm text-surface-300">
                    {brief.teaching_brief.common_misconceptions.map((m, i) => (
                      <li key={i} className="leading-relaxed">
                        {typeof m === 'string' ? m : (m.text || m.description || JSON.stringify(m))}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Worked examples */}
              {brief.teaching_brief.worked_examples.length > 0 && (
                <Section title="Worked examples for class" icon={BookMarked} tone="violet">
                  <div className="space-y-2">
                    {brief.teaching_brief.worked_examples.map((ex, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-surface-900 border border-surface-800 text-sm text-surface-300 leading-relaxed">
                        {typeof ex === 'string' ? ex : (ex.problem || ex.statement || JSON.stringify(ex))}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Problems to discuss */}
              {brief.teaching_brief.suggested_problems.length > 0 && (
                <Section title="Problems to discuss" icon={Target} tone="emerald">
                  <div className="space-y-2">
                    {brief.teaching_brief.suggested_problems.map(p => (
                      <div key={p.id} className="p-2.5 rounded-lg bg-surface-900 border border-surface-800 space-y-1">
                        <p className="text-sm text-surface-300 leading-relaxed">{p.statement}</p>
                        <div className="flex items-center gap-2 text-[10px] text-surface-500">
                          {p.year && <span>GATE {p.year}</span>}
                          {p.difficulty && <span>· {p.difficulty}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Prereq reminders */}
              {brief.teaching_brief.prerequisite_reminders.length > 0 && (
                <Section title="Prerequisites to review first" icon={Brain} tone="neutral">
                  <ul className="space-y-1 text-xs text-surface-400">
                    {brief.teaching_brief.prerequisite_reminders.map((pr, i) => (
                      <li key={i}>{pr}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {brief.concept.exam_tip && (
                <Section title="Exam tip" icon={Target} tone="amber">
                  <p className="text-sm text-surface-300 leading-relaxed">{brief.concept.exam_tip}</p>
                </Section>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Section({ title, icon: Icon, tone, children }: {
  title: string;
  icon: typeof Lightbulb;
  tone: 'amber' | 'rose' | 'violet' | 'emerald' | 'neutral';
  children: React.ReactNode;
}) {
  const toneAccent =
    tone === 'amber' ? 'text-amber-400'
    : tone === 'rose' ? 'text-rose-400'
    : tone === 'violet' ? 'text-violet-400'
    : tone === 'emerald' ? 'text-emerald-400'
    : 'text-surface-400';
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-wide flex items-center gap-1.5 font-medium text-surface-200">
        <Icon size={11} className={toneAccent} />
        {title}
      </p>
      <div className="pl-5">{children}</div>
    </div>
  );
}
