/**
 * PracticePage — Answer a problem with animated feedback.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { getRandomMessage } from '@/lib/animations';
import { ErrorDiagnosis } from '@/components/app/ErrorDiagnosis';
import { ChevronLeft, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

interface Problem {
  id: string;
  year: number;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  topic: string;
  difficulty: string;
  marks: number;
}

interface VerifyResult {
  traceId: string;
  status: string;
  confidence: number;
  tierUsed: string;
  durationMs: number;
}

type Phase = 'answering' | 'verifying' | 'result';

const SLOW_VERIFY_THRESHOLD_MS = 1500;

const DIFF_STYLE: Record<string, { color: string; bg: string }> = {
  easy:   { color: 'var(--green-ink)', bg: 'rgba(52,199,89,.10)' },
  medium: { color: 'var(--orange)',    bg: 'rgba(255,159,10,.10)' },
  hard:   { color: 'var(--red)',       bg: 'rgba(255,59,48,.10)' },
};

export default function PracticePage() {
  const { problemId } = useParams<{ problemId: string }>();
  const sessionId = useSession();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('answering');
  const [loading, setLoading] = useState(true);
  const [showVerifyShimmer, setShowVerifyShimmer] = useState(false);
  const [message, setMessage] = useState('');
  const [nextProblemId, setNextProblemId] = useState<string | null>(null);
  const [errorDiagnosis, setErrorDiagnosis] = useState<any>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!problemId) return;
    startTime.current = Date.now();
    setPhase('answering');
    setSelected(null);
    setErrorDiagnosis(null);
    setShowVerifyShimmer(false);
    setLoading(true);

    apiFetch<{ problem: Problem }>(`/api/problems/id/${problemId}`)
      .then(res => {
        setProblem(res.problem);
        trackEvent('problem_view', { problemId, topic: res.problem.topic });
      })
      .finally(() => setLoading(false));
  }, [problemId]);

  useEffect(() => {
    if (!problem) return;
    apiFetch<{ problems: { id: string }[] }>(`/api/problems/${problem.topic}`)
      .then(res => {
        const list = res.problems || [];
        const idx = list.findIndex(p => p.id === problemId);
        if (idx >= 0 && idx < list.length - 1) {
          setNextProblemId(list[idx + 1].id);
        } else {
          setNextProblemId(list.find(p => p.id !== problemId)?.id || null);
        }
      })
      .catch(() => {});
  }, [problem, problemId]);

  useEffect(() => {
    if (phase !== 'verifying') return;
    const t = setTimeout(() => setShowVerifyShimmer(true), SLOW_VERIFY_THRESHOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const handleSubmit = async () => {
    if (!selected || !problem) return;
    setPhase('verifying');
    setShowVerifyShimmer(false);

    trackEvent('answer_submit', {
      problemId,
      topic: problem.topic,
      answer: selected,
      timeMs: Date.now() - startTime.current,
    });

    const options = typeof problem.options === 'string' ? JSON.parse(problem.options) : problem.options;
    const answerText = options[selected] || selected;

    try {
      await apiFetch<VerifyResult>('/api/verify', {
        method: 'POST',
        body: JSON.stringify({ problem: problem.question_text, answer: answerText, sessionId }),
      });

      setPhase('result');
      const isCorrect = selected === problem.correct_answer;
      setMessage(getRandomMessage(isCorrect));

      trackEvent('problem_complete', {
        problemId,
        topic: problem.topic,
        correct: isCorrect,
        timeMs: Date.now() - startTime.current,
      });

      const quality = isCorrect ? 4 : 1;
      await apiFetch(`/api/sr/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ pyqId: problem.id, quality, answer: selected }),
      }).catch(() => {});

      if (isCorrect) {
        await apiFetch(`/api/streak/${sessionId}`, { method: 'POST' }).catch(() => {});
      }

      try {
        const gbrainResult = await apiFetch<any>('/api/gbrain/attempt', {
          method: 'POST',
          body: JSON.stringify({
            sessionId,
            problem: problem.question_text,
            studentAnswer: answerText,
            correctAnswer: problem.correct_answer,
            conceptId: problem.topic,
            isCorrect,
            difficulty: problem.difficulty === 'hard' ? 0.8 : problem.difficulty === 'medium' ? 0.5 : 0.3,
            timeTakenMs: Date.now() - startTime.current,
            problemId: problem.id,
          }),
        });
        if (!isCorrect && gbrainResult?.error_diagnosis) setErrorDiagnosis(gbrainResult);
      } catch {}
    } catch {
      setPhase('result');
      setMessage('Verification unavailable — check the solution below.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 64, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} />
        ))}
      </div>
    );
  }

  if (!problem) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)', margin: 0 }}>
          Problem not found.
        </p>
        <Link
          to="/"
          style={{ color: 'var(--indigo-ink)', fontSize: 'var(--text-footnote)', display: 'inline-block', marginTop: 8, textDecoration: 'none' }}
        >
          Back to topics
        </Link>
      </div>
    );
  }

  const options = typeof problem.options === 'string' ? JSON.parse(problem.options) : problem.options;
  const isCorrect = selected === problem.correct_answer;
  const topicName = problem.topic.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const diffStyle = DIFF_STYLE[problem.difficulty] || { color: 'var(--text-secondary)', bg: 'var(--surface-fill)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back + Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link
          to={`/topic/${problem.topic}`}
          style={{ display: 'flex', alignItems: 'center', marginLeft: -6, padding: 6, color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <p style={{ flex: 1, margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)' }}>
          {topicName} | {problem.year} | {problem.marks}M
        </p>
        {problem.difficulty && (
          <span style={{
            fontSize: 'var(--text-caption2)',
            fontWeight: 'var(--weight-semibold)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-capsule)',
            color: diffStyle.color,
            background: diffStyle.bg,
          }}>
            {problem.difficulty}
          </span>
        )}
      </div>

      {/* Question card */}
      <div style={{
        padding: 16,
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-raise)',
      }}>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
          {problem.question_text}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(options).map(([key, value]) => {
          const isThisCorrect = key === problem.correct_answer;
          const isThisSelected = key === selected;

          let bg = 'var(--surface-card)';
          let border = '1px solid var(--separator)';
          let textColor = 'var(--text-primary)';
          let badgeBg = 'var(--surface-fill)';
          let badgeColor = 'var(--text-secondary)';

          if (phase === 'result') {
            if (isThisCorrect) {
              bg = 'rgba(52,199,89,.08)';
              border = '1.5px solid var(--green)';
              textColor = 'var(--green-ink)';
              badgeBg = 'rgba(52,199,89,.18)';
              badgeColor = 'var(--green-ink)';
            } else if (isThisSelected) {
              bg = 'rgba(255,59,48,.06)';
              border = '1.5px solid var(--red)';
              textColor = 'var(--red)';
              badgeBg = 'rgba(255,59,48,.15)';
              badgeColor = 'var(--red)';
            }
          } else if (isThisSelected) {
            bg = 'rgba(88,86,214,.07)';
            border = '1.5px solid var(--indigo)';
            badgeBg = 'rgba(88,86,214,.15)';
            badgeColor = 'var(--indigo-ink)';
          }

          return (
            <motion.button
              key={key}
              whileTap={phase === 'answering' ? { scale: 0.97 } : undefined}
              onClick={() => phase === 'answering' && setSelected(key)}
              disabled={phase !== 'answering'}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                border,
                background: bg,
                textAlign: 'left',
                cursor: phase === 'answering' ? 'pointer' : 'default',
                fontFamily: 'var(--font-sans)',
                transition: 'border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)',
              }}
            >
              <span style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-caption)',
                fontWeight: 'var(--weight-bold)',
                flexShrink: 0,
                background: badgeBg,
                color: badgeColor,
              }}>
                {key}
              </span>
              <span style={{ flex: 1, fontSize: 'var(--text-body)', color: textColor }}>
                {value as string}
              </span>
              {phase === 'result' && isThisCorrect && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                  <CheckCircle size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
                </motion.div>
              )}
              {phase === 'result' && isThisSelected && !isThisCorrect && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <XCircle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Submit / Verifying / Result */}
      <AnimatePresence mode="wait">
        {phase === 'answering' && (
          <motion.button
            key="submit"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            whileTap={selected ? { scale: 0.97 } : undefined}
            onClick={handleSubmit}
            disabled={!selected}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: selected ? 'var(--green)' : 'var(--surface-fill)',
              color: selected ? '#fff' : 'var(--text-tertiary)',
              fontSize: 'var(--text-body)',
              fontWeight: 'var(--weight-semibold)',
              cursor: selected ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
              transition: 'background var(--dur-fast) var(--ease-out)',
            }}
          >
            Check Answer
          </motion.button>
        )}

        {phase === 'verifying' && showVerifyShimmer && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}
          >
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--indigo)' }} />
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Result banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: isCorrect ? 'rgba(52,199,89,.10)' : 'rgba(255,59,48,.08)',
              border: `1px solid ${isCorrect ? 'rgba(52,199,89,.25)' : 'rgba(255,59,48,.20)'}`,
            }}>
              {isCorrect
                ? <CheckCircle size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
                : <XCircle size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
              }
              <span style={{
                fontWeight: 'var(--weight-semibold)',
                fontSize: 'var(--text-body)',
                color: isCorrect ? 'var(--green-ink)' : 'var(--red)',
              }}>
                {isCorrect ? 'Correct!' : `Answer: ${problem.correct_answer}`}
              </span>
            </div>

            {/* Explanation */}
            <div style={{
              padding: 16,
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-card)',
              boxShadow: 'var(--shadow-raise)',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 'var(--text-footnote)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                Solution
              </p>
              <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
                {problem.explanation}
              </p>
              {message && (
                <p style={{ margin: '10px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  {message}
                </p>
              )}
            </div>

            {/* GBrain Error Diagnosis — wrong answers only */}
            {!isCorrect && errorDiagnosis?.error_diagnosis && (
              <ErrorDiagnosis
                diagnosis={errorDiagnosis.error_diagnosis}
                prerequisiteAlerts={errorDiagnosis.prerequisite_alerts}
                motivationState={errorDiagnosis.motivation_state}
                consecutiveFailures={errorDiagnosis.consecutive_failures}
              />
            )}

            {/* Next action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {nextProblemId ? (
                <button
                  onClick={() => navigate(`/practice/${nextProblemId}`)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'var(--green)',
                    color: 'var(--text-on-accent)',
                    fontSize: 'var(--text-body)',
                    fontWeight: 'var(--weight-semibold)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Next Problem <ArrowRight size={16} />
                </button>
              ) : (
                <Link
                  to="/"
                  style={{
                    display: 'block',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    background: 'var(--green)',
                    color: 'var(--text-on-accent)',
                    fontSize: 'var(--text-body)',
                    fontWeight: 'var(--weight-semibold)',
                    textDecoration: 'none',
                  }}
                >
                  Back to Home
                </Link>
              )}
              <Link
                to={`/topic/${problem.topic}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontSize: 'var(--text-caption)',
                  color: 'var(--text-tertiary)',
                  textDecoration: 'none',
                  padding: '4px 0',
                }}
              >
                All {topicName} problems
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
