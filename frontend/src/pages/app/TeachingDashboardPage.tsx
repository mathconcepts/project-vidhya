import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Brain, Lightbulb, Users as UsersIcon, TrendingDown, AlertTriangle,
  Send, MessageCircle, X, Check, Loader2, RefreshCw, ChevronRight,
  ArrowRight, Target, BookMarked,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';

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
        <AlertTriangle size={24} className="mx-auto" style={{ color: 'var(--orange)' }} />
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>Teacher role required.</p>
        <p style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-tertiary)' }}>Your role: {user?.role || 'not signed in'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* First-time welcome banner */}
      {showTeacherWelcome && (
        <div
          className="p-4 flex items-start gap-3"
          style={{
            background: 'rgba(52,199,89,.08)',
            border: '1px solid rgba(52,199,89,.25)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <BookOpen size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
          <div className="flex-1 space-y-1" style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)' }}>
            <p style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Welcome to Teaching Hub</p>
            <p>The recommendation below is built from your cohort's real learning data — it tells you what to teach next and shows you a ready-made brief. Use "Push to review" to send practice problems directly to every student's queue.</p>
          </div>
          <button
            onClick={() => { localStorage.setItem('teaching_welcome_dismissed', '1'); setShowTeacherWelcome(false); }}
            className="shrink-0 p-1"
            style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="flex items-center gap-2"
            style={{ fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.018em' }}
          >
            <BookOpen size={20} style={{ color: 'var(--green)' }} />
            Teaching
          </h1>
          <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
            What to teach next, based on your cohort.
          </p>
          {/* v2.6: cohort-mastery stat surfaced at the top — this IS the
              teacher-progress signal ("are my students learning what I teach?").
              Was previously buried in a stats-bar at the bottom. */}
          {nextClass && nextClass.cohort_size > 0 && typeof nextClass.cohort_avg_mastery === 'number' && (
            <p
              className="mt-2"
              style={{
                fontSize: 'var(--text-caption2)',
                color: 'var(--green-ink)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontWeight: 'var(--weight-medium)',
              }}
            >
              Cohort mastery: {Math.round(nextClass.cohort_avg_mastery * 100)}% across {nextClass.cohort_size} students
            </p>
          )}
          {/* v4.0 P7: link to weekly cohort brief */}
          <a
            href="/teaching/brief"
            className="inline-flex items-center gap-1 mt-1"
            style={{
              fontSize: 'var(--text-caption2)',
              color: 'var(--indigo)',
              fontWeight: 'var(--weight-medium)',
              textDecoration: 'none',
            }}
          >
            This week's brief →
          </a>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2"
          style={{
            borderRadius: 'var(--radius-xs)',
            background: 'var(--surface-fill)',
            border: 'var(--hairline) solid var(--separator)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
          aria-label="refresh"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      {error && (
        <div
          className="p-3"
          style={{
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,59,48,.1)',
            border: '1px solid rgba(255,59,48,.25)',
            fontSize: 'var(--text-footnote)',
            color: 'var(--red)',
          }}
        >
          {error}
        </div>
      )}

      {loading && !nextClass ? (
        <div className="text-center py-8" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-body)' }}>
          <Loader2 size={14} className="inline animate-spin mr-2" />
          Loading...
        </div>
      ) : nextClass && !nextClass.recommendation ? (
        <div
          className="p-6 text-center space-y-2"
          style={{
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-fill)',
            border: 'var(--hairline) solid var(--separator)',
          }}
        >
          <Target size={24} className="mx-auto" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>{nextClass.message}</p>
          {nextClass.cohort_size > 0 && typeof nextClass.cohort_avg_mastery === 'number' && (
            <p style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-tertiary)' }}>
              Cohort size: {nextClass.cohort_size} · avg mastery: {Math.round(nextClass.cohort_avg_mastery * 100)}%
            </p>
          )}
        </div>
      ) : nextClass?.recommendation ? (
        <>
          {/* v2.6: flagged-students alert promoted to a prominent card when
              count > 0. Was previously a small inline link in the bottom
              stats bar. Teachers care most about students at risk; this
              should be immediate, not buried. */}
          {(nextClass.flagged_students ?? 0) > 0 && (
            <a
              href="/teacher/roster"
              className="block p-3"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,159,10,.1)',
                border: '1px solid rgba(255,159,10,.3)',
                color: 'var(--orange)',
                textDecoration: 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <p style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
                  {nextClass.flagged_students} {nextClass.flagged_students === 1 ? 'student needs' : 'students need'} attention
                </p>
                <span className="ml-auto" style={{ fontSize: 'var(--text-caption2)' }}>View roster →</span>
              </div>
            </a>
          )}

          {/* Primary: next-class recommendation */}
          <div
            className="p-4 space-y-3"
            style={{
              borderRadius: 'var(--radius-md)',
              background: 'rgba(52,199,89,.06)',
              border: '1px solid rgba(52,199,89,.2)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p
                  style={{
                    fontSize: 'var(--text-caption2)',
                    color: 'var(--green-ink)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontWeight: 'var(--weight-medium)',
                  }}
                >
                  Teach next
                </p>
                <h2
                  className="mt-1"
                  style={{
                    fontSize: 'var(--text-title3)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--text-primary)',
                    textTransform: 'capitalize',
                  }}
                >
                  {nextClass.recommendation.concept_label}
                </h2>
                <p
                  className="mt-1.5"
                  style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: '1.5' }}
                >
                  {nextClass.recommendation.reason}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p style={{ fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--orange)' }}>
                  {Math.round(nextClass.recommendation.cohort_avg_mastery * 100)}%
                </p>
                <p style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>cohort mastery</p>
              </div>
            </div>

            <button
              onClick={() => openBrief(nextClass.recommendation!.concept_id)}
              className="w-full h-10 inline-flex items-center justify-center gap-2 active:scale-[0.98]"
              style={{
                borderRadius: 'var(--radius-xs)',
                background: 'var(--green)',
                color: 'var(--text-on-accent)',
                fontSize: 'var(--text-body)',
                fontWeight: 'var(--weight-medium)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <BookMarked size={14} />
              Open teaching brief
            </button>
          </div>

          {/* Cohort stats bar */}
          <div className="flex items-center gap-3" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
            <span className="inline-flex items-center gap-1">
              <UsersIcon size={11} />
              {nextClass.cohort_size} students
            </span>
            {typeof nextClass.cohort_avg_mastery === 'number' && (
              <span>· avg {Math.round(nextClass.cohort_avg_mastery * 100)}% mastery</span>
            )}
            {(nextClass.flagged_students ?? 0) > 0 && (
              <>
                <span style={{ color: 'var(--separator)' }}>·</span>
                <a
                  href="/teacher/roster"
                  className="inline-flex items-center gap-1"
                  style={{ color: 'var(--orange)', textDecoration: 'none' }}
                >
                  <AlertTriangle size={11} />
                  {nextClass.flagged_students} need attention
                </a>
              </>
            )}
          </div>

          {/* Other struggling concepts */}
          {nextClass.other_struggling && nextClass.other_struggling.length > 0 && (
            <div className="space-y-2">
              <p
                style={{
                  fontSize: 'var(--text-caption2)',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Other concepts worth attention
              </p>
              <div className="space-y-1.5">
                {nextClass.other_struggling.map(c => (
                  <button
                    key={c.concept_id}
                    onClick={() => openBrief(c.concept_id)}
                    className="w-full p-3 flex items-center gap-3 text-left"
                    style={{
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--surface-fill)',
                      border: 'var(--hairline) solid var(--separator)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <TrendingDown size={12} className="shrink-0" style={{ color: 'var(--orange)' }} />
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{ fontSize: 'var(--text-body)', color: 'var(--text-primary)', textTransform: 'capitalize' }}
                      >
                        {c.concept_label}
                      </p>
                      <p style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>
                        {c.students_affected} students · {Math.round(c.cohort_avg_mastery * 100)}% avg
                      </p>
                    </div>
                    <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Announcement composer */}
          <div
            className="p-4 space-y-2"
            style={{
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-fill)',
              border: 'var(--hairline) solid var(--separator)',
            }}
          >
            <p
              className="flex items-center gap-1.5"
              style={{
                fontSize: 'var(--text-caption2)',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <MessageCircle size={10} />
              Class announcement
            </p>
            <p style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>
              Appears on each of your students' home screens. Latest announcement replaces any previous one.
            </p>
            <textarea
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value.slice(0, 280))}
              placeholder="e.g., We'll continue eigenvalues tomorrow. Please review problem 3 before class."
              className="w-full min-h-[60px] p-2.5 resize-none"
              style={{
                borderRadius: 'var(--radius-xs)',
                background: 'var(--surface-card)',
                border: 'var(--hairline) solid var(--separator)',
                fontSize: 'var(--text-body)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
              }}
            />
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: 'var(--text-caption2)',
                  color: announcementText.length > 260 ? 'var(--orange)' : 'var(--text-tertiary)',
                }}
              >
                {announcementText.length} / 280
              </span>
              <button
                onClick={postAnnouncement}
                disabled={!announcementText.trim() || announcementPosting}
                className="px-3 h-8 inline-flex items-center gap-1.5"
                style={{
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--indigo)',
                  color: 'var(--text-on-accent)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 'var(--weight-medium)',
                  border: 'none',
                  cursor: !announcementText.trim() || announcementPosting ? 'not-allowed' : 'pointer',
                  opacity: !announcementText.trim() || announcementPosting ? 0.4 : 1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {announcementPosting ? <Loader2 size={11} className="animate-spin" />
                  : announcementPosted ? <><Check size={11} /> Posted</>
                  : <><Send size={11} /> Post</>}
              </button>
            </div>
          </div>
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
      <div
        className="p-3 flex items-start gap-2.5"
        style={{
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(88,86,214,.06)',
          border: '1px solid rgba(88,86,214,.2)',
        }}
      >
        <Lightbulb size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--indigo)' }} />
        <div style={{ fontSize: 'var(--text-caption2)', color: 'var(--indigo-ink)', lineHeight: '1.6' }}>
          <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--indigo-ink)' }}>Why this works.</span>{' '}
          Every recommendation and brief is composed from your cohort's actual learning data.
          No guessing, no generic content. The app tells you what your students need; you bring the teaching.
        </div>
      </div>
    </div>
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
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto"
        style={{
          background: 'var(--surface-card)',
          borderTop: 'var(--hairline) solid var(--separator)',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        }}
      >
        <div
          className="sticky top-0 px-4 py-3 flex items-center justify-between z-10"
          style={{
            background: 'var(--surface-card)',
            borderBottom: 'var(--hairline) solid var(--separator)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>Teaching brief</p>
          <button
            onClick={onClose}
            className="p-1"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', borderRadius: 'var(--radius-xs)', fontFamily: 'var(--font-sans)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center py-12" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-body)' }}>
              <Loader2 size={14} className="inline animate-spin mr-2" />
              Composing brief...
            </div>
          ) : !brief ? (
            <p className="text-center py-8" style={{ fontSize: 'var(--text-body)', color: 'var(--text-tertiary)' }}>Brief unavailable.</p>
          ) : (
            <>
              {/* Confidence picker — gates prep section. Always shown first so
                  the teacher self-assesses before reading the brief. */}
              <div
                className="p-3"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-fill)',
                  border: 'var(--hairline) solid var(--separator)',
                }}
              >
                <p className="mb-2" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                  How confident are you teaching{' '}
                  <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)', textTransform: 'capitalize' }}>
                    {brief.concept.label}
                  </span>?
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setConfidence(n)}
                      className="flex-1 h-9"
                      style={{
                        borderRadius: 'var(--radius-xs)',
                        fontSize: 'var(--text-body)',
                        fontWeight: 'var(--weight-semibold)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        border: confidence === n
                          ? n <= 2
                            ? '1px solid rgba(255,159,10,.4)'
                            : '1px solid rgba(52,199,89,.4)'
                          : 'var(--hairline) solid var(--separator)',
                        background: confidence === n
                          ? n <= 2
                            ? 'rgba(255,159,10,.2)'
                            : 'rgba(52,199,89,.2)'
                          : 'var(--surface-card)',
                        color: confidence === n
                          ? n <= 2
                            ? 'var(--orange)'
                            : 'var(--green-ink)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {confidence !== null && (
                  <p className="mt-1.5" style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>
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
                          <p
                            className="mb-1"
                            style={{ fontSize: 'var(--text-caption2)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}
                          >
                            Canonical definition
                          </p>
                          <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {brief.concept.canonical_definition}
                          </p>
                        </div>
                      )}
                      {brief.teaching_brief.worked_examples.length > 0 && (
                        <div className="mb-3">
                          <p
                            className="mb-1"
                            style={{ fontSize: 'var(--text-caption2)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}
                          >
                            Worked examples (first 2)
                          </p>
                          {brief.teaching_brief.worked_examples.slice(0, 2).map((ex: any, i: number) => (
                            <div
                              key={i}
                              className="mb-1 p-2"
                              style={{
                                fontSize: 'var(--text-caption)',
                                color: 'var(--text-secondary)',
                                fontFamily: 'var(--font-mono)',
                                background: 'var(--surface-card)',
                                borderRadius: 'var(--radius-xs)',
                              }}
                            >
                              {typeof ex === 'string' ? ex : ex.problem || ex.text || JSON.stringify(ex)}
                            </div>
                          ))}
                        </div>
                      )}
                      {brief.teaching_brief.common_misconceptions.length > 0 && (
                        <div>
                          <p
                            className="mb-1"
                            style={{ fontSize: 'var(--text-caption2)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}
                          >
                            Common misconceptions in your cohort
                          </p>
                          <ul className="space-y-1" style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                            {brief.teaching_brief.common_misconceptions.slice(0, 3).map((m: any, i: number) => (
                              <li key={i} style={{ lineHeight: '1.5' }}>
                                {typeof m === 'string' ? m : m.text || m.description || JSON.stringify(m)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Section>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <h2
                  style={{
                    fontSize: 'var(--text-title3)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--text-primary)',
                    textTransform: 'capitalize',
                  }}
                >
                  {brief.concept.label}
                </h2>
                {brief.concept.topic && (
                  <p
                    className="mt-1"
                    style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    {brief.concept.topic}
                  </p>
                )}
                {brief.concept.canonical_definition && (
                  <p className="mt-2" style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {brief.concept.canonical_definition}
                  </p>
                )}
              </div>

              {/* Cohort snapshot */}
              <div
                className="p-3 grid grid-cols-3 gap-3 text-center"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-fill)',
                  border: 'var(--hairline) solid var(--separator)',
                }}
              >
                <div>
                  <p style={{ fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
                    {brief.cohort.size}
                  </p>
                  <p style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>in cohort</p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 'var(--text-title3)',
                      fontWeight: 'var(--weight-bold)',
                      color: brief.cohort.avg_mastery === null
                        ? 'var(--text-tertiary)'
                        : brief.cohort.avg_mastery < 0.4
                          ? 'var(--orange)'
                          : brief.cohort.avg_mastery < 0.7
                            ? 'var(--indigo)'
                            : 'var(--green)',
                    }}
                  >
                    {brief.cohort.avg_mastery === null ? '—' : Math.round(brief.cohort.avg_mastery * 100) + '%'}
                  </p>
                  <p style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>cohort mastery</p>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--orange)' }}>
                    {brief.cohort.students_below_mastery}
                  </p>
                  <p style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>below threshold</p>
                </div>
              </div>

              {/* Action: push to review */}
              <button
                onClick={onPushToReview}
                disabled={pushStatus !== 'idle'}
                className="w-full h-10 inline-flex items-center justify-center gap-2 active:scale-[0.98]"
                style={{
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 'var(--text-body)',
                  fontWeight: 'var(--weight-medium)',
                  fontFamily: 'var(--font-sans)',
                  border: pushStatus === 'done' ? '1px solid rgba(52,199,89,.4)' : 'none',
                  background: pushStatus === 'done' ? 'rgba(52,199,89,.2)' : 'var(--indigo)',
                  color: pushStatus === 'done' ? 'var(--green-ink)' : '#fff',
                  cursor: pushStatus !== 'idle' ? 'not-allowed' : 'pointer',
                }}
              >
                {pushStatus === 'pushing' ? <Loader2 size={13} className="animate-spin" />
                  : pushStatus === 'done' ? <><Check size={13} /> Pushed to all students</>
                  : <><ArrowRight size={13} /> Push to students' review queues</>}
              </button>

              {/* Talking points — the MOST actionable section */}
              {brief.teaching_brief.talking_points.length > 0 && (
                <Section title="Talking points" icon={Lightbulb} tone="amber">
                  <ul className="space-y-2" style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                    {brief.teaching_brief.talking_points.map((tp, i) => (
                      <li key={i} style={{ lineHeight: '1.5' }}>{tp}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Misconceptions */}
              {brief.teaching_brief.common_misconceptions.length > 0 && (
                <Section title="Common misconceptions to address" icon={AlertTriangle} tone="rose">
                  <ul className="space-y-2" style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                    {brief.teaching_brief.common_misconceptions.map((m, i) => (
                      <li key={i} style={{ lineHeight: '1.5' }}>
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
                      <div
                        key={i}
                        className="p-2.5"
                        style={{
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--surface-fill)',
                          border: 'var(--hairline) solid var(--separator)',
                          fontSize: 'var(--text-body)',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5',
                        }}
                      >
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
                      <div
                        key={p.id}
                        className="p-2.5 space-y-1"
                        style={{
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--surface-fill)',
                          border: 'var(--hairline) solid var(--separator)',
                        }}
                      >
                        <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{p.statement}</p>
                        <div className="flex items-center gap-2" style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>
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
                  <ul className="space-y-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                    {brief.teaching_brief.prerequisite_reminders.map((pr, i) => (
                      <li key={i}>{pr}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {brief.concept.exam_tip && (
                <Section title="Exam tip" icon={Target} tone="amber">
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{brief.concept.exam_tip}</p>
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
  const iconColor =
    tone === 'amber' ? 'var(--orange)'
    : tone === 'rose' ? 'var(--red)'
    : tone === 'violet' ? 'var(--indigo)'
    : tone === 'emerald' ? 'var(--green)'
    : 'var(--text-tertiary)';
  return (
    <div className="space-y-2">
      <p
        className="flex items-center gap-1.5"
        style={{
          fontSize: 'var(--text-caption2)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontWeight: 'var(--weight-medium)',
          color: 'var(--text-primary)',
        }}
      >
        <Icon size={11} style={{ color: iconColor }} />
        {title}
      </p>
      <div className="pl-5">{children}</div>
    </div>
  );
}
