/**
 * DiagnosticPage — Quick 10-question diagnostic (1 per topic, 45s timer each).
 * Per-question save with local queue retry on network error.
 *
 * U1-1 funnel-ize (partial): progress (current question + answers so far)
 * persists to localStorage and resumes if the student leaves mid-diagnostic
 * and comes back to the SAME question set.
 *
 * Results moment (Wave U1, UX-100x doc §3.2 "Results moment"): agency before
 * diagnosis. The default post-submit screen leads with focus areas — what
 * the student should DO next — with the honest per-concept band/score map
 * one tap behind via "See the full picture".
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { trackAction, trackPageView } from '@/lib/beacon';
import { Clock, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
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

const MAX_FOCUS_CONCEPTS = 6;

type ResultsView = 'plan' | 'map';

const diagnosticStorageKey = (sessionId: string) => `vidhya_diagnostic_progress_${sessionId}`;

interface DiagnosticProgress {
  questionIds: string[];
  currentIdx: number;
  answers: Record<string, { selected: string | null; correct: boolean }>;
}

function loadDiagnosticProgress(sessionId: string): DiagnosticProgress | null {
  try {
    const raw = localStorage.getItem(diagnosticStorageKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.questionIds)) return null;
    return parsed as DiagnosticProgress;
  } catch {
    return null;
  }
}

function saveDiagnosticProgress(sessionId: string, progress: DiagnosticProgress): void {
  try {
    localStorage.setItem(diagnosticStorageKey(sessionId), JSON.stringify(progress));
  } catch { /* best-effort */ }
}

function clearDiagnosticProgress(sessionId: string): void {
  try {
    localStorage.removeItem(diagnosticStorageKey(sessionId));
  } catch { /* best-effort */ }
}

export default function DiagnosticPage() {
  const sessionId = useSession();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (checking) return;
    trackPageView('/diagnostic');

    authFetch(`/api/diagnostic/${sessionId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { questions: DiagnosticQuestion[] }) => {
        setQuestions(data.questions);
        const saved = loadDiagnosticProgress(sessionId);
        const validIdx = saved && Number.isInteger(saved.currentIdx)
          && saved.currentIdx >= 0 && saved.currentIdx < data.questions.length;
        const validAnswers = saved && saved.answers !== null && typeof saved.answers === 'object'
          && !Array.isArray(saved.answers);
        const sameQuestionSet = saved
          && saved.questionIds.length === data.questions.length
          && saved.questionIds.every((id, i) => id === data.questions[i]?.id);
        if (sameQuestionSet && validIdx && validAnswers) {
          setAnswers(saved.answers);
          setCurrentIdx(saved.currentIdx);
        } else if (saved) {
          clearDiagnosticProgress(sessionId);
        }
      })
      .catch(() => { navigate('/'); })
      .finally(() => setLoading(false));
  }, [sessionId, navigate, checking]);

  useEffect(() => {
    if (loading || showResult || questions.length === 0) return;
    saveDiagnosticProgress(sessionId, {
      questionIds: questions.map(q => q.id),
      currentIdx,
      answers,
    });
  }, [sessionId, loading, showResult, questions, currentIdx, answers]);

  useEffect(() => {
    if (showResult) clearDiagnosticProgress(sessionId);
  }, [showResult, sessionId]);

  useEffect(() => {
    if (loading || showResult || currentIdx >= questions.length) return;
    setTimer(45);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(null);
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
    const correctAnswer = q.options?.correct_answer || q.options?.answer;
    const isCorrect = selected !== null && selected === correctAnswer;

    setAnswers(prev => ({
      ...prev,
      [q.topic]: { selected, correct: isCorrect },
    }));

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        setShowResult(true);
      }
    }, 600);
  }, [currentIdx, questions]);

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

  useEffect(() => {
    if (showResult) submitScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  if (loading || checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--green-ink)' }} />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>No diagnostic questions available.</p>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--green-ink)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'var(--text-body)' }}>Go home</button>
      </div>
    );
  }

  // Results screen
  if (showResult) {
    const correctCount = Object.values(answers).filter(a => a.correct).length;
    const totalCount = questions.length;
    const examName = questions[0]?.exam_name ?? 'Exam';

    const focusConcepts = questions
      .filter(q => !answers[q.topic]?.correct)
      .map(q => q.topic_name)
      .slice(0, MAX_FOCUS_CONCEPTS);

    const planSubtext = focusConcepts.length > 0
      ? `${focusConcepts.length} concept${focusConcepts.length === 1 ? '' : 's'} ${focusConcepts.length === 1 ? 'stands' : 'stand'} between you and a stronger score.`
      : 'Strong across the board today — we\'ll keep pace with fresh problems.';

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://vidhya-demo.onrender.com/';

    const handleStartHour1 = () => {
      trackAction('plan_view_start_hour1', '/diagnostic');
      navigate('/planned');
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 16, paddingBottom: 16 }}
      >
        {resultsView === 'plan' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-ink)' }}>Your plan</p>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {focusConcepts.length > 0 ? 'Your focus areas' : "You're solid here"}
              </h1>
              <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                You got {correctCount} of {totalCount} today. {planSubtext}
              </p>
            </div>

            {focusConcepts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {focusConcepts.map((name, i) => (
                  <div
                    key={name}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(52,199,89,.22)', background: 'rgba(52,199,89,.05)' }}
                  >
                    <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: 'rgba(52,199,89,.12)', color: 'var(--green-ink)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 'var(--text-body)', color: 'var(--text-primary)', flex: 1 }}>{name}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleStartHour1}
                style={{ width: '100%', padding: '12px 0', borderRadius: 'var(--radius-md)', background: 'var(--green)', color: '#fff', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-body)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Start hour 1 now <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setShareOpen(true)}
                style={{ width: '100%', padding: '12px 0', borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-body)', cursor: 'pointer' }}
              >
                Get my report card
              </button>
            </div>

            <button
              onClick={() => setResultsView('map')}
              style={{ textAlign: 'center', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
            >
              See the full picture — why this plan
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <button
              onClick={() => setResultsView('plan')}
              style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              ← Back to your plan
            </button>

            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Your {examName} Profile</h1>
              <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green-ink)' }}>
                {correctCount}/{totalCount}
              </div>
              <p style={{ margin: '0 auto', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', maxWidth: 280 }}>
                Estimate from your {totalCount} diagnostic answers today — not a full exam attempt. Confidence grows with every session.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {questions.map(q => {
                const answer = answers[q.topic];
                const correct = answer?.correct;
                return (
                  <div
                    key={q.topic}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      border: correct ? '1px solid rgba(52,199,89,.22)' : '1px solid rgba(255,59,48,.22)',
                      background: correct ? 'rgba(52,199,89,.05)' : 'rgba(255,59,48,.05)',
                      padding: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {correct
                        ? <CheckCircle2 size={18} style={{ color: 'var(--green-ink)', flexShrink: 0 }} />
                        : <XCircle size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
                      }
                      <span style={{ fontSize: 'var(--text-body)', color: 'var(--text-primary)', flex: 1 }}>{q.topic_name}</span>
                      <span style={{ fontSize: 'var(--text-caption)', fontFamily: 'var(--font-mono)', color: correct ? 'var(--green-ink)' : 'var(--red)' }}>
                        {correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
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
  if (!q) return <Loader2 size={24} className="animate-spin" style={{ color: 'var(--green-ink)', display: 'block', margin: '48px auto' }} />;
  const options = Array.isArray(q.options?.choices) ? q.options.choices :
    typeof q.options === 'object' && q.options !== null ?
      Object.entries(q.options).filter(([k]) => !['correct_answer', 'answer', 'explanation'].includes(k)).map(([k, v]) => ({ key: k, text: v })) :
      [];

  const timerColor = timer > 30 ? 'var(--green-ink)' : timer > 10 ? 'var(--orange)' : 'var(--red)';
  const timerBg = timer > 30 ? 'rgba(52,199,89,.06)' : timer > 10 ? 'rgba(255,149,0,.06)' : 'rgba(255,59,48,.06)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header: progress + timer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>
          Question {currentIdx + 1} of {questions.length}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 12, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: timerColor, background: timerBg }}>
          <Clock size={14} />
          {timer}s
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-fill)', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', background: 'var(--green)', borderRadius: 2 }}
          initial={{ width: 0 }}
          animate={{ width: `${(currentIdx / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Topic tag */}
      <span style={{ display: 'inline-block', fontSize: 'var(--text-caption)', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 12, background: 'rgba(52,199,89,.06)', color: 'var(--green-ink)' }}>
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
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)' }}>
            {q.question_text}
          </p>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {options.map((opt: any, i: number) => {
              const optKey = opt.key || String.fromCharCode(65 + i);
              const optText = opt.text || opt;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(optKey)}
                  style={{ width: '100%', textAlign: 'left', padding: 12, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', cursor: 'pointer', fontSize: 'var(--text-body)' }}
                >
                  <span style={{ fontSize: 'var(--text-caption)', fontFamily: 'var(--font-mono)', color: 'var(--green-ink)', marginRight: 8 }}>{optKey}.</span>
                  <span style={{ color: 'var(--text-primary)' }}>{optText}</span>
                </button>
              );
            })}
          </div>

          {/* Skip button */}
          <button
            onClick={() => handleAnswer(null)}
            style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
          >
            Skip this question
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
