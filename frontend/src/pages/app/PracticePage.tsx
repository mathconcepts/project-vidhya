/**
 * PracticePage — Answer a problem with celebration animations.
 *
 * Exam-agnostic: the problem topic + exam name come from the active
 * exam adapter (or the URL params), not hardcoded GATE references.
 *
 * Flow: Read problem → Select answer → Submit → Celebration/Encouragement → Next
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { fadeInUp, celebration, tapScale, getRandomMessage } from '@/lib/animations';
import { Confetti } from '@/components/app/Confetti';
import { ErrorDiagnosis } from '@/components/app/ErrorDiagnosis';
import { ChevronLeft, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

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

// v2.5 (per /plan-ceo-review): students don't learn from watching the AI work.
// Old code exposed a 3-stage VERIFY_STAGES animation ("Checking knowledge base /
// Running AI verification / Confirming result") — admin-process spectacle that
// added latency theater without value. Removed; verifying phase shows a single
// subtle shimmer for slow verifies (>1.5s) and nothing for fast ones.
const SLOW_VERIFY_THRESHOLD_MS = 1500;

export default function PracticePage() {
  const { problemId } = useParams<{ problemId: string }>();
  const sessionId = useSession();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('answering');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVerifyShimmer, setShowVerifyShimmer] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [message, setMessage] = useState('');
  const [nextProblemId, setNextProblemId] = useState<string | null>(null);
  const [errorDiagnosis, setErrorDiagnosis] = useState<any>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!problemId) return;
    startTime.current = Date.now();
    setPhase('answering');
    setSelected(null);
    setVerifyResult(null);
    setShowConfetti(false);
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

  // Fetch next problem in topic
  useEffect(() => {
    if (!problem) return;
    apiFetch<{ problems: { id: string }[] }>(`/api/problems/${problem.topic}`)
      .then(res => {
        const problems = res.problems || [];
        const currentIdx = problems.findIndex(p => p.id === problemId);
        if (currentIdx >= 0 && currentIdx < problems.length - 1) {
          setNextProblemId(problems[currentIdx + 1].id);
        } else if (problems.length > 0) {
          // Wrap around to first problem
          const other = problems.find(p => p.id !== problemId);
          setNextProblemId(other?.id || null);
        }
      })
      .catch(() => {});
  }, [problem, problemId]);

  // Show a single subtle shimmer ONLY when verification takes longer than the
  // SLOW_VERIFY_THRESHOLD_MS budget. Fast verifies show no spinner — instant
  // result lands as soon as the API resolves.
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
      const result = await apiFetch<VerifyResult>('/api/verify', {
        method: 'POST',
        body: JSON.stringify({
          problem: problem.question_text,
          answer: answerText,
          sessionId,
        }),
      });

      setVerifyResult(result);
      setPhase('result');

      const isCorrect = selected === problem.correct_answer;
      setMessage(getRandomMessage(isCorrect));
      if (isCorrect) {
        setShowConfetti(true);
      }

      trackEvent('problem_complete', {
        problemId,
        topic: problem.topic,
        correct: isCorrect,
        timeMs: Date.now() - startTime.current,
      });

      // Update spaced repetition
      const quality = isCorrect ? 4 : 1;
      await apiFetch(`/api/sr/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ pyqId: problem.id, quality, answer: selected }),
      }).catch(() => {});

      // Update streak on correct
      if (isCorrect) {
        await apiFetch(`/api/streak/${sessionId}`, { method: 'POST' }).catch(() => {});
      }

      // GBrain: Record attempt for cognitive model + error diagnosis
      try {
        const gbrainResult = await apiFetch<any>('/api/gbrain/attempt', {
          method: 'POST',
          body: JSON.stringify({
            sessionId,
            problem: problem.question_text,
            studentAnswer: answerText,
            correctAnswer: problem.correct_answer,
            conceptId: problem.topic, // topic-level for PYQ problems
            isCorrect,
            difficulty: problem.difficulty === 'hard' ? 0.8 : problem.difficulty === 'medium' ? 0.5 : 0.3,
            timeTakenMs: Date.now() - startTime.current,
            problemId: problem.id,
          }),
        });
        if (!isCorrect && gbrainResult?.error_diagnosis) {
          setErrorDiagnosis(gbrainResult);
        }
      } catch {
        // Non-fatal: GBrain diagnosis is supplemental
      }
    } catch {
      setPhase('result');
      setMessage('Verification unavailable — check the solution below.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin text-violet-400" size={32} />
        <span className="text-sm text-surface-500">Loading problem...</span>
      </div>
    );
  }

  if (!problem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <p className="text-surface-500">Problem not found.</p>
        <Link to="/" className="text-violet-400 text-sm mt-2 inline-block">Back to topics</Link>
      </motion.div>
    );
  }

  const options = typeof problem.options === 'string' ? JSON.parse(problem.options) : problem.options;
  const isCorrect = selected === problem.correct_answer;
  const topicName = problem.topic.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Confetti trigger={showConfetti} />

      {/* Back + Meta */}
      <div className="flex items-center gap-3">
        <Link to={`/topic/${problem.topic}`} className="p-2 -ml-2 rounded-lg hover:bg-surface-800 transition-colors">
          <ChevronLeft size={20} className="text-surface-400" />
        </Link>
        <div className="flex-1">
          <p className="text-xs text-surface-500">{topicName} | {problem.year} | {problem.marks}M</p>
        </div>
        <span className={clsx(
          'text-[10px] font-medium px-2 py-0.5 rounded-full',
          problem.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' :
          problem.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400' :
          'bg-emerald-500/10 text-emerald-400',
        )}>
          {problem.difficulty}
        </span>
      </div>

      {/* Question */}
      <motion.div
        className="p-4 rounded-xl bg-surface-900 border border-surface-800"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-surface-200 leading-relaxed whitespace-pre-wrap">{problem.question_text}</p>
      </motion.div>

      {/* Options */}
      <div className="space-y-2">
        {Object.entries(options).map(([key, value], index) => {
          const isThisCorrect = key === problem.correct_answer;
          const isThisSelected = key === selected;

          let borderColor = 'border-surface-800';
          let bgColor = 'bg-surface-900';
          let textColor = 'text-surface-300';

          if (phase === 'result') {
            if (isThisCorrect) {
              borderColor = 'border-emerald-500/50';
              bgColor = 'bg-emerald-500/10';
              textColor = 'text-emerald-300';
            } else if (isThisSelected && !isThisCorrect) {
              borderColor = 'border-red-500/50';
              bgColor = 'bg-red-500/10';
              textColor = 'text-red-300';
            }
          } else if (isThisSelected) {
            borderColor = 'border-violet-500/50';
            bgColor = 'bg-violet-500/10';
            textColor = 'text-violet-300';
          }

          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              whileTap={phase === 'answering' ? tapScale : undefined}
              onClick={() => phase === 'answering' && setSelected(key)}
              disabled={phase !== 'answering'}
              className={clsx(
                'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200',
                borderColor, bgColor, textColor,
                phase === 'answering' && 'hover:border-violet-500/30 hover:bg-surface-800/80',
              )}
            >
              <span className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                isThisSelected ? 'bg-violet-500/20 text-violet-300' : 'bg-surface-800 text-surface-400',
                phase === 'result' && isThisCorrect && 'bg-emerald-500/20 text-emerald-300',
              )}>
                {key}
              </span>
              <span className="text-sm">{value as string}</span>
              {phase === 'result' && isThisCorrect && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="ml-auto"
                >
                  <CheckCircle size={16} className="text-emerald-400" />
                </motion.div>
              )}
              {phase === 'result' && isThisSelected && !isThisCorrect && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                  <XCircle size={16} className="text-red-400" />
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileTap={selected ? tapScale : undefined}
            onClick={handleSubmit}
            disabled={!selected}
            className={clsx(
              'w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200',
              selected
                ? 'bg-gradient-to-r from-emerald-500 to-violet-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-surface-800 text-surface-500 cursor-not-allowed',
            )}
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
            transition={{ duration: 0.2 }}
            className="flex justify-center py-4"
          >
            <Loader2 className="animate-spin text-violet-400" size={18} />
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="space-y-4"
          >
            {/* Result Banner — compact single-line */}
            <motion.div
              variants={celebration}
              initial="hidden"
              animate="visible"
              className={clsx(
                'flex items-center gap-2 px-4 py-3 rounded-xl',
                isCorrect
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : 'bg-red-500/10 text-red-300',
              )}
            >
              {isCorrect ? (
                <CheckCircle size={18} className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={18} className="text-red-400 shrink-0" />
              )}
              <span className="font-semibold text-sm">
                {isCorrect ? 'Correct!' : `Answer: ${problem.correct_answer}`}
              </span>
            </motion.div>

            {/* Explanation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-surface-900 border border-surface-800"
            >
              <h3 className="text-sm font-semibold text-surface-300 mb-2">Solution</h3>
              <p className="text-sm text-surface-400 leading-relaxed whitespace-pre-wrap">
                {problem.explanation}
              </p>
              <p className="text-xs text-surface-500 mt-3 italic">{message}</p>
            </motion.div>

            {/* GBrain Error Diagnosis — only shown on wrong answers */}
            {!isCorrect && errorDiagnosis?.error_diagnosis && (
              <ErrorDiagnosis
                diagnosis={errorDiagnosis.error_diagnosis}
                prerequisiteAlerts={errorDiagnosis.prerequisite_alerts}
                motivationState={errorDiagnosis.motivation_state}
                consecutiveFailures={errorDiagnosis.consecutive_failures}
              />
            )}

            {/* Next Action */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              {nextProblemId ? (
                <button
                  onClick={() => navigate(`/practice/${nextProblemId}`)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 transition-colors cursor-pointer touch-manipulation"
                >
                  Next Problem
                  <ArrowRight size={16} />
                </button>
              ) : (
                <Link
                  to="/"
                  className="block w-full py-3 rounded-xl text-center text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
                >
                  Back to Home
                </Link>
              )}
              <Link
                to={`/topic/${problem.topic}`}
                className="block text-center text-xs text-surface-500 hover:text-surface-400 transition-colors py-1"
              >
                All {problem.topic.replace(/-/g, ' ')} problems
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
