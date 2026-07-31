/**
 * DiagnosticPage — Quick 10-question diagnostic (1 per topic, 45s timer each).
 * Per-question save with local queue retry on network error.
 *
 * Results moment (Wave U1, UX-100x doc §3.2 "Results moment"): agency before
 * diagnosis. The default post-submit screen leads with focus areas — what
 * the student should DO next — with the honest per-concept band/score map
 * one tap behind via "See the full picture". Never lead with the weakness
 * map; it's still there, just not first.
 *
 * Honesty note: this screen does NOT compute a hours/marks-weighted plan —
 * no per-concept time or expected-marks number exists in the diagnostic
 * pipeline today. It surfaces missed-topic concepts in diagnostic order,
 * honestly labeled. A real "next N hours" plan is future scope (see
 * docs/capability-register.md).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { trackAction, trackPageView } from '@/lib/beacon';
import { Clock, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { ShareCard } from '@/components/ShareCard';

interface DiagnosticQuestion {
  index: number;
  id: string;
  topic: string;
  topic_name: string;
  question_text: string;
  options: any;
  difficulty: string;
  exam_name?: string;
  explanation?: string;
}

/** How many focus concepts to surface on the "next 10 hours" plan screen. */
const MAX_FOCUS_CONCEPTS = 6;

/** Which secondary screen is showing behind the agency-first results view. */
type ResultsView = 'plan' | 'map';

export default function DiagnosticPage() {
  const sessionId = useSession();
  const navigate = useNavigate();
  // Authenticated users with exam profiles who land here directly should
  // go to /planned (not restart the diagnostic).
  // The `checking` state prevents the page from flashing before redirect.
  const checking = useAuthRedirect('/planned');
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected: string | null; correct: boolean }>>({});
  const [timer, setTimer] = useState(45);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [resultsView, setResultsView] = useState<ResultsView>('plan');
  const [shareOpen, setShareOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load questions
  useEffect(() => {
    if (checking) return; // wait for auth check before loading questions
    // page_view is tracked once via the beacon (below) — trackEvent's own
    // 'page_view' type is intentionally not also fired here to avoid a
    // duplicate event for the same view.
    trackPageView('/diagnostic');
    authFetch(`/api/diagnostic/${sessionId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { questions: DiagnosticQuestion[] }) => {
        setQuestions(data.questions);
      })
      .catch(() => {
        // Genuine failure — go home (GateHome will redirect to /planned for
        // authenticated users; anonymous users see the onboarding state).
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [sessionId, navigate, checking]);

  // Timer countdown
  useEffect(() => {
    if (loading || showResult || currentIdx >= questions.length) return;
    setTimer(45);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(null); // time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIdx, loading, questions.length]);

  const handleAnswer = useCallback((selected: string | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIdx >= questions.length) return;

    const q = questions[currentIdx];
    // Determine correctness — check if options has a correct_answer field
    const correctAnswer = q.options?.correct_answer || q.options?.answer;
    const isCorrect = selected !== null && selected === correctAnswer;

    setAnswers(prev => ({
      ...prev,
      [q.topic]: { selected, correct: isCorrect },
    }));

    // Move to next question after brief delay
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        setShowResult(true);
      }
    }, 600);
  }, [currentIdx, questions]);

  // Persist the diagnostic to the backend. Fire-and-forget: the agency-first
  // results screen renders from local `answers` state immediately, so a slow
  // or failed save shouldn't block the student from seeing their plan.
  const submitScores = useCallback(async () => {
    try {
      const scores: Record<string, number> = {};
      for (const q of questions) {
        scores[q.topic] = answers[q.topic]?.correct ? 1 : 0;
      }

      const res = await authFetch(`/api/diagnostic/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      });
      if (!res.ok) throw new Error('Failed to save');

      trackEvent('diagnostic_complete', {
        correct: Object.values(scores).filter(s => s === 1).length,
        total: questions.length,
      });
    } catch (err) {
      console.error('Failed to save diagnostic:', err);
    }
  }, [questions, answers, sessionId]);

  // Submit once, the moment results are ready to show.
  useEffect(() => {
    if (showResult) submitScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="text-violet-400 animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-surface-400">No diagnostic questions available.</p>
        <button onClick={() => navigate('/')} className="text-violet-400 underline">Go home</button>
      </div>
    );
  }

  // Results screen
  if (showResult) {
    const correctCount = Object.values(answers).filter(a => a.correct).length;
    const totalCount = questions.length;
    const examName = questions[0]?.exam_name ?? 'Exam';

    // Agency-first: resurface the per-topic weakness signal the diagnostic
    // already computes (correct/incorrect per topic, above) as a prioritized
    // "what to do next" list. No new scoring algorithm — this is the same
    // `answers` map, just read in the order that helps the student act.
    const focusConcepts = questions
      .filter(q => !answers[q.topic]?.correct)
      .map(q => q.topic_name)
      .slice(0, MAX_FOCUS_CONCEPTS);

    const planSubtext = focusConcepts.length > 0
      ? `${focusConcepts.length} concept${focusConcepts.length === 1 ? '' : 's'} ${focusConcepts.length === 1 ? 'stands' : 'stand'} between you and a stronger score.`
      : 'Strong across the board today — we\'ll keep pace with fresh problems.';

    // No short-link system exists yet (checked — see grep in PR notes), so
    // the shareable link is the app's own origin. Swap this for a real
    // short-link when one ships.
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://vidhya-demo.onrender.com/';

    const handleStartHour1 = () => {
      trackAction('plan_view_start_hour1', '/diagnostic');
      navigate('/planned');
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 py-4"
      >
        {resultsView === 'plan' ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/90">Your plan</p>
              {/* Headline names what this screen actually delivers: an ordered
                  list of focus concepts, not a scheduled hour-by-hour plan —
                  no per-concept time/marks estimate exists yet (see backend
                  follow-up in docs/capability-register.md). */}
              <h1 className="font-display text-3xl font-bold text-surface-50">
                {focusConcepts.length > 0 ? 'Your focus areas' : "You're solid here"}
              </h1>
              <p className="text-sm text-surface-400">
                You got {correctCount} of {totalCount} today. {planSubtext}
              </p>
            </div>

            {focusConcepts.length > 0 && (
              <div className="space-y-2">
                {/* Listed in diagnostic order — not yet ranked by marks-weight
                    or exam proximity (that's the priority engine's job, not
                    wired to this screen). No fabricated "high priority" tiers. */}
                {focusConcepts.map((name, i) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
                  >
                    <span className="shrink-0 size-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm text-surface-200 flex-1">{name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleStartHour1}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-colors flex items-center justify-center gap-2"
              >
                Start hour 1 now
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="w-full py-3 rounded-xl border border-surface-700 text-surface-200 font-medium hover:border-surface-600 transition-colors"
              >
                Get my report card
              </button>
            </div>

            <button
              onClick={() => setResultsView('map')}
              className="w-full text-center text-xs text-surface-500 hover:text-surface-300 underline underline-offset-2 transition-colors"
            >
              See the full picture — why this plan
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => setResultsView('plan')}
              className="text-xs text-surface-400 hover:text-surface-200 transition-colors"
            >
              &larr; Back to your plan
            </button>

            <div className="text-center space-y-3">
              <h1 className="font-display text-2xl font-bold text-surface-100">Your {examName} Profile</h1>
              <div className="text-5xl font-bold font-mono text-emerald-400">
                {correctCount}/{totalCount}
              </div>
              <p className="text-xs text-surface-500 max-w-xs mx-auto">
                Estimate from your {totalCount} diagnostic answers today — not a full exam attempt. Confidence grows with every session.
              </p>
            </div>

            {/* Topic breakdown — the honest band/score map, one tap behind the plan */}
            <div className="space-y-2">
              {questions.map(q => {
                const answer = answers[q.topic];
                const row = (
                  <div className="flex items-center gap-3 p-3">
                    {answer?.correct
                      ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                      : <XCircle size={18} className="text-red-400 shrink-0" />
                    }
                    <span className="text-sm text-surface-200 flex-1">{q.topic_name}</span>
                    <span className={clsx(
                      'text-xs font-mono',
                      answer?.correct ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {answer?.correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                );
                // Note: this is a plain correct/incorrect mark, not a receipt.
                // The receipt border is reserved for content backed by a real
                // verification_log / AnswerVerifier record (CAS/SymPy/Wolfram).
                // A diagnostic self-score is a client-side string match against
                // the question's answer key — it earns a checkmark, not a ✓ receipt.
                return (
                  <div
                    key={q.topic}
                    className={clsx(
                      'rounded-xl border',
                      answer?.correct
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-red-500/20 bg-red-500/5',
                    )}
                  >
                    {row}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {shareOpen && (
          <ShareCard
            planHeadline={focusConcepts.length > 0 ? 'Your focus areas' : "You're solid here"}
            planSubtext={planSubtext}
            examName={examName}
            shareUrl={shareUrl}
            onClose={() => setShareOpen(false)}
          />
        )}
      </motion.div>
    );
  }

  // Question screen
  const q = questions[currentIdx];
  const options = Array.isArray(q.options?.choices) ? q.options.choices :
    typeof q.options === 'object' && q.options !== null ?
      Object.entries(q.options).filter(([k]) => !['correct_answer', 'answer', 'explanation'].includes(k)).map(([k, v]) => ({ key: k, text: v })) :
      [];

  return (
    <div className="space-y-4">
      {/* Header: progress + timer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-surface-400 font-medium">
          Question {currentIdx + 1} of {questions.length}
        </span>
        <div className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-sm font-semibold',
          timer > 30 ? 'text-violet-400 bg-violet-500/10' :
          timer > 10 ? 'text-amber-400 bg-amber-500/10' :
          'text-red-400 bg-red-500/10'
        )}>
          <Clock size={14} />
          {timer}s
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-surface-800 overflow-hidden">
        <motion.div
          className="h-full bg-violet-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIdx) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Topic tag */}
      <span className="inline-block text-xs font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">
        {q.topic_name}
      </span>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <p className="text-surface-100 text-base leading-relaxed">
            {q.question_text}
          </p>

          {/* Options */}
          <div className="space-y-2">
            {options.map((opt: any, i: number) => {
              const optKey = opt.key || String.fromCharCode(65 + i);
              const optText = opt.text || opt;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(optKey)}
                  className="w-full text-left p-3 rounded-xl border border-surface-700 bg-surface-900 hover:border-violet-500/50 hover:bg-surface-800 transition-all active:scale-[0.98]"
                >
                  <span className="text-xs font-mono text-violet-400 mr-2">{optKey}.</span>
                  <span className="text-sm text-surface-200">{optText}</span>
                </button>
              );
            })}
          </div>

          {/* Skip button */}
          <button
            onClick={() => handleAnswer(null)}
            className="text-xs text-surface-500 hover:text-surface-300 transition-colors"
          >
            Skip this question
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
