/**
 * StaticSampleProblem (v4.0) — anonymous try-one-problem moment.
 *
 * Renders a single MCQ from a static set, no auth required. After the user
 * answers, slides in a sign-up CTA. The first problem is the most memorable
 * moment in any student's journey with a learning product — make it count.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { getMarketingSamples, type MarketingSample } from '@/data/marketing-samples';
import { trackEvent } from '@/lib/analytics';

interface Props {
  /** Exam id to pull samples from. Defaults to GATE. */
  examId?: string;
}

export function StaticSampleProblem({ examId = 'gate-ma' }: Props) {
  const samples = getMarketingSamples(examId);
  const [problemIdx, setProblemIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  if (samples.length === 0) return null;

  const problem: MarketingSample = samples[problemIdx];
  const isCorrect = selected === problem.correct_option;

  const handleSelect = (key: string) => {
    if (revealed) return;
    setSelected(key);
    setRevealed(true);
    trackEvent('sample_problem_attempted', {
      problem_id: problem.id,
      correct: key === problem.correct_option,
      difficulty: problem.difficulty,
    });
  };

  const handleNext = () => {
    if (problemIdx < samples.length - 1) {
      setProblemIdx(problemIdx + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 576, margin: '0 auto' }}>
      <div style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', padding: 24, boxShadow: 'var(--shadow-raise)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
            Try one — {problem.topic}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{problem.difficulty}</span>
        </div>

        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)' }}>{problem.statement}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {problem.options.map(opt => {
            const isSelected = selected === opt.key;
            const isRight = opt.key === problem.correct_option;
            const showCorrect = revealed && isRight;
            const showWrong = revealed && isSelected && !isRight;

            let optStyle: React.CSSProperties;
            if (showCorrect) {
              optStyle = { background: 'rgba(52,199,89,.08)', border: '1px solid rgba(52,199,89,.4)', color: 'var(--text-primary)' };
            } else if (showWrong) {
              optStyle = { background: 'rgba(255,149,0,.08)', border: '1px solid rgba(255,149,0,.4)', color: 'var(--text-primary)' };
            } else if (isSelected) {
              optStyle = { background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.4)', color: 'var(--text-primary)' };
            } else {
              optStyle = { background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)' };
            }

            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                disabled={revealed}
                style={{ width: '100%', textAlign: 'left', padding: 12, borderRadius: 'var(--radius-sm)', cursor: revealed ? 'default' : 'pointer', transition: 'background 0.15s, border-color 0.15s', ...optStyle }}
              >
                <span style={{ fontSize: 'var(--text-caption)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginRight: 10 }}>{opt.key}.</span>
                <span style={{ fontSize: 'var(--text-body)' }}>{opt.text}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}
            >
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, borderRadius: 'var(--radius-sm)', padding: 12,
                background: isCorrect ? 'rgba(52,199,89,.06)' : 'rgba(255,149,0,.06)',
                border: isCorrect ? '1px solid rgba(52,199,89,.22)' : '1px solid rgba(255,149,0,.22)',
              }}>
                {isCorrect ? (
                  <CheckCircle2 size={16} style={{ color: 'var(--green-ink)', flexShrink: 0, marginTop: 2 }} />
                ) : (
                  <AlertCircle size={16} style={{ color: 'var(--orange)', flexShrink: 0, marginTop: 2 }} />
                )}
                <p style={{ margin: 0, fontSize: 'var(--text-caption)', lineHeight: 'var(--leading-relaxed)', color: 'var(--text-primary)' }}>
                  {isCorrect ? 'Correct. ' : 'Not quite. '}
                  {problem.explanation}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 4 }}>
                {problemIdx < samples.length - 1 && (
                  <button
                    onClick={handleNext}
                    style={{ fontSize: 'var(--text-body)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Try another →
                  </button>
                )}
                <Link
                  to="/sign-in"
                  onClick={() => trackEvent('sample_problem_converted', { from_problem_id: problem.id })}
                  style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)', background: 'var(--green)', color: '#fff', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', textDecoration: 'none' }}
                >
                  Create your free plan <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
