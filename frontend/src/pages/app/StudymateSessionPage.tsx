/**
 * StudymateSessionPage — Anytime 15-min adaptive study session.
 *
 * State machine: idle → loading → in_progress → answered → gap_shown → complete → stat
 *
 * Design: Calm focus mode. Emerald progress bar, subtle entrance animations.
 * One problem at a time. Thinking-gap shown for wrong answers. Deterministic stat line at end.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/hooks/useSession';
import { useActiveExam } from '@/hooks/useActiveExam';
import { apiFetch } from '@/hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, ChevronRight, BookOpen, Zap, ArrowRight } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SessionProblem {
  problem_id: string;
  concept_id: string;
  topic: string;
  difficulty: number;
  question: string;
  expected_answer: string;
  source: string;
  source_url?: string;
  user_answer?: string;
  was_correct?: boolean;
  gap_text?: string;
}

interface StudymateSession {
  id: string;
  session_id: string;
  exam_id: string;
  session_type: string;
  state: string;
  problem_count: number;
  current_index: number;
  problems: SessionProblem[];
  frustration_mode: boolean;
}

type PageState = 'idle' | 'loading' | 'answering' | 'checking' | 'answered' | 'gap_shown' | 'complete' | 'stat';

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function DifficultyPip({ difficulty }: { difficulty: number }) {
  const label = difficulty <= 0.4 ? 'Easy' : difficulty <= 0.7 ? 'Medium' : 'Hard';
  const pipStyle =
    difficulty <= 0.4
      ? { color: 'var(--green-ink)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }
      : difficulty <= 0.7
      ? { color: 'var(--orange)', background: 'rgba(255,159,10,.06)', border: '1px solid rgba(255,159,10,.22)' }
      : { color: 'var(--red)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)' };
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={pipStyle}>
      {label}
    </span>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-fill)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: 'var(--green)' }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StudymateSessionPage() {
  const sessionId = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Active exam comes from /api/exam/active (admin-configurable via
  // DEFAULT_EXAM_ID env var). The ?exam= URL param is still honoured as an
  // override for power users / multi-exam deployments. No hardcoded
  // 'gate-ma' fallback — if the API hasn't loaded yet, we wait for it.
  const { exam: activeExam } = useActiveExam();
  const examId = searchParams.get('exam') ?? activeExam?.exam_id ?? '';

  const [isAnonymous, setIsAnonymous] = useState(true);
  useEffect(() => {
    import('@/lib/auth/client').then(({ getToken }) => {
      setIsAnonymous(!getToken());
    });
  }, []);

  const [pageState, setPageState] = useState<PageState>('idle');
  const [session, setSession] = useState<StudymateSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [gapText, setGapText] = useState<string | null>(null);
  const [statLine, setStatLine] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pollGap, setPollGap] = useState(false);

  const currentProblem = session?.problems[currentIdx] ?? null;

  // ── Try to resume on mount ──────────────────────────────────────────────────

  useEffect(() => {
    async function tryResume() {
      setPageState('loading');
      try {
        const data = await apiFetch<StudymateSession | { session: null }>(
          '/api/studymate/sessions/resume',
          { headers: { 'X-Session-Id': sessionId } },
        );
        if ('id' in data && data.id) {
          setSession(data as StudymateSession);
          setCurrentIdx(data.current_index ?? 0);
          setPageState('answering');
        } else {
          setPageState('idle');
        }
      } catch {
        setPageState('idle');
      }
    }
    tryResume();
  }, [sessionId]);

  // ── Build new session ───────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    setPageState('loading');
    setError(null);
    try {
      const data = await apiFetch<StudymateSession>('/api/studymate/sessions', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, exam_id: examId }),
      });
      setSession(data);
      setCurrentIdx(0);
      setUserAnswer('');
      setWasCorrect(null);
      setGapText(null);
      setPageState('answering');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setPageState('idle');
    }
  }, [sessionId, examId]);

  // ── Submit answer ───────────────────────────────────────────────────────────

  const submitAnswer = useCallback(async () => {
    if (!session || !currentProblem || !userAnswer.trim()) return;
    setPageState('checking');

    const correct = userAnswer.trim().toLowerCase() === currentProblem.expected_answer.trim().toLowerCase();
    setWasCorrect(correct);

    try {
      await apiFetch('/api/studymate/sessions/' + session.id + '/answer', {
        method: 'POST',
        body: JSON.stringify({
          problem_id: currentProblem.problem_id,
          user_answer: userAnswer.trim(),
          was_correct: correct,
          concept_id: currentProblem.concept_id,
          question: currentProblem.question,
          expected_answer: currentProblem.expected_answer,
        }),
      });

      if (!correct) {
        setPollGap(true);
        setPageState('answered');
      } else {
        setGapText(null);
        setPageState('answered');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record answer');
      setPageState('answering');
    }
  }, [session, currentProblem, userAnswer]);

  // ── Poll for thinking-gap (lazy fetch may take 1-3s) ───────────────────────

  useEffect(() => {
    if (!pollGap || !session || !currentProblem) return;
    let attempts = 0;
    const MAX = 6;

    const poll = async () => {
      attempts++;
      try {
        // Re-fetch session state to check if gap_text is ready
        const data = await apiFetch<StudymateSession | { session: null }>(
          '/api/studymate/sessions/resume',
          { headers: { 'X-Session-Id': sessionId } },
        );
        if ('id' in data && data.id) {
          const updated = (data as StudymateSession).problems[currentIdx];
          if (updated?.gap_text) {
            setGapText(updated.gap_text);
            setPollGap(false);
            return;
          }
        }
      } catch {}
      if (attempts < MAX) setTimeout(poll, 1500);
      else setPollGap(false);
    };

    setTimeout(poll, 1000);
  }, [pollGap]);

  // ── Advance to next problem or complete ─────────────────────────────────────

  const advance = useCallback(async () => {
    if (!session) return;
    const nextIdx = currentIdx + 1;

    if (nextIdx >= session.problem_count) {
      // Complete session
      setPageState('loading');
      try {
        const data = await apiFetch<{ stat: string }>(
          '/api/studymate/sessions/' + session.id + '/complete',
          { method: 'POST' },
        );
        setStatLine(data.stat);
        setPageState('stat');
      } catch {
        setPageState('stat');
        setStatLine('Session complete.');
      }
    } else {
      setCurrentIdx(nextIdx);
      setUserAnswer('');
      setWasCorrect(null);
      setGapText(null);
      setPollGap(false);
      setPageState('answering');
    }
  }, [session, currentIdx]);

  // ─── Renders ──────────────────────────────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--green-ink)' }} />
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Setting up your session…</p>
      </div>
    );
  }

  if (pageState === 'idle') {
    return (
      <motion.div
        className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center gap-8 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }}
          >
            <Zap className="w-7 h-7" style={{ color: 'var(--green-ink)' }} />
          </div>
          <h1 className="text-2xl font-display font-black" style={{ color: 'var(--text-primary)' }}>
            Anytime Studymate
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            15 min · 5 adaptive problems · calibrated to your weak spots
          </p>
          {activeExam && (
            <p className="text-xs mt-1" style={{ color: 'var(--indigo-ink)' }}>
              {activeExam.name}
            </p>
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(255,59,48,.06)',
              border: '1px solid rgba(255,59,48,.22)',
              color: 'var(--red)',
            }}
          >
            {error}
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={startSession}
          disabled={!examId}
          className="w-full max-w-xs py-4 rounded-2xl font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--green)', color: 'var(--text-primary)' }}
          whileTap={{ scale: 0.97 }}
        >
          Start Session
        </motion.button>
      </motion.div>
    );
  }

  if (pageState === 'stat') {
    return (
      <motion.div
        className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center gap-8 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }}
          >
            <CheckCircle className="w-7 h-7" style={{ color: 'var(--green-ink)' }} />
          </div>
          <h2 className="text-xl font-display font-black" style={{ color: 'var(--text-primary)' }}>
            Session complete
          </h2>
          <p className="text-base font-medium" style={{ color: 'var(--green-ink)' }}>{statLine}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <button
            onClick={startSession}
            className="w-full py-4 rounded-2xl font-semibold text-base transition-colors"
            style={{ background: 'var(--green)', color: 'var(--text-primary)' }}
          >
            New Session
          </button>
          {!isAnonymous && (
            <button
              onClick={() => navigate('/planned')}
              className="w-full py-3 rounded-2xl text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
              style={{
                background: 'var(--surface-fill)',
                border: 'var(--hairline) solid var(--separator)',
                color: 'var(--text-secondary)',
              }}
            >
              Continue your plan <ChevronRight size={14} />
            </button>
          )}
          <a href="/" className="text-sm transition-colors" style={{ color: 'var(--text-tertiary)' }}>
            Back to home
          </a>
        </motion.div>

        {isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xs p-4 rounded-2xl space-y-3 text-center"
            style={{
              background: 'rgba(88,86,214,.08)',
              border: '1px solid rgba(88,86,214,.22)',
            }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Save your progress</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              Sign in to track your streak, unlock a personalized study plan, and pick up exactly where you left off.
            </p>
            <a
              href="/sign-in"
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              style={{ background: 'var(--indigo)', color: 'var(--text-primary)' }}
            >
              Create free account <ArrowRight size={14} />
            </a>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>No credit card. Takes 30 seconds.</p>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // ── Problem view ───────────────────────────────────────────────────────────

  if (!currentProblem || !session) return null;

  const isAnswered = pageState === 'answered' || pageState === 'gap_shown';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>{currentIdx + 1} of {session.problem_count}</span>
          {session.frustration_mode && (
            <span className="font-medium" style={{ color: 'var(--orange)' }}>Focus mode</span>
          )}
        </div>
        <ProgressBar current={currentIdx} total={session.problem_count} />
      </div>

      {/* Problem card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentProblem.problem_id}
          className="p-6 flex flex-col gap-5"
          style={{
            background: 'var(--surface-card)',
            border: 'var(--hairline) solid var(--separator)',
            boxShadow: 'var(--shadow-raise)',
            borderRadius: 'var(--radius-md)',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono" style={{ color: 'var(--indigo-ink)' }}>
              {currentProblem.concept_id.replace(/-/g, ' ')}
            </span>
            <DifficultyPip difficulty={currentProblem.difficulty} />
          </div>

          {/* Question */}
          <p className="text-base leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>
            {currentProblem.question}
          </p>

          {/* Answer input */}
          {!isAnswered ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Your answer…"
                rows={3}
                className="w-full px-4 py-3 resize-none focus:outline-none transition-colors"
                style={{
                  background: 'var(--surface-fill)',
                  border: 'var(--hairline) solid var(--separator)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && userAnswer.trim()) {
                    e.preventDefault();
                    submitAnswer();
                  }
                }}
              />
              <motion.button
                onClick={submitAnswer}
                disabled={!userAnswer.trim() || pageState === 'checking'}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
                style={
                  userAnswer.trim()
                    ? { background: 'var(--green)', color: 'var(--text-primary)' }
                    : { background: 'var(--surface-fill)', color: 'var(--text-tertiary)', cursor: 'not-allowed' }
                }
                whileTap={userAnswer.trim() ? { scale: 0.97 } : {}}
              >
                {pageState === 'checking' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking…
                  </span>
                ) : 'Submit Answer'}
              </motion.button>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                className="flex flex-col gap-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Result banner */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={
                    wasCorrect
                      ? { background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', color: 'var(--green-ink)' }
                      : { background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', color: 'var(--red)' }
                  }
                >
                  {wasCorrect
                    ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    : <XCircle className="w-5 h-5 flex-shrink-0" />}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{wasCorrect ? 'Correct' : 'Not quite'}</span>
                    {!wasCorrect && (
                      <span className="text-xs opacity-75">
                        Expected: <span className="font-mono">{currentProblem.expected_answer}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Thinking-gap (wrong answers only) */}
                {!wasCorrect && (
                  <AnimatePresence>
                    {gapText ? (
                      <motion.div
                        className="flex gap-3 px-4 py-3 rounded-xl"
                        style={{
                          background: 'rgba(88,86,214,.08)',
                          border: '1px solid rgba(88,86,214,.22)',
                        }}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      >
                        <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--indigo-ink)' }} />
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--indigo-ink)' }}>{gapText}</p>
                      </motion.div>
                    ) : pollGap ? (
                      <motion.div
                        className="flex items-center gap-2 text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating insight…
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                )}

                {/* Source attribution */}
                {currentProblem.source && (
                  <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    Source: {currentProblem.source}
                    {currentProblem.source_url && (
                      <> · <a
                        href={currentProblem.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--indigo-ink)' }}
                      >view</a></>
                    )}
                  </p>
                )}

                {/* Next button */}
                <motion.button
                  onClick={advance}
                  className="w-full py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  style={{
                    background: 'var(--surface-fill)',
                    border: 'var(--hairline) solid var(--separator)',
                    color: 'var(--text-primary)',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {currentIdx + 1 >= session.problem_count ? 'Finish Session' : 'Next Problem'}
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
