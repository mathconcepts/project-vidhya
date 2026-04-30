/**
 * StaticSampleProblem (v4.0) — anonymous try-one-problem moment.
 *
 * Renders a single MCQ from a static set, no auth required. After the user
 * answers, slides in a sign-up CTA. The first problem is the most memorable
 * moment in any student's journey with a learning product — make it count.
 *
 * Design (per plan-design-review):
 *   - Problem statement: DM Sans 15px (consistent w/ PracticePage)
 *   - Options: surface-1 / surface-3 border / 8px radius
 *   - Correct: emerald check + concept hint (gentle)
 *   - Incorrect: amber + "try this next" (NOT red — marketing, not test)
 *   - CTA after interaction: emerald "Create your free plan →"
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

  if (samples.length === 0) {
    // No samples for this exam — render nothing, marketing copy still appears
    return null;
  }

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
    <div className="w-full max-w-xl mx-auto">
      <div className="rounded-2xl border border-surface-700 bg-surface-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-surface-500">
            Try one — {problem.topic}
          </span>
          <span className="text-[11px] text-surface-600 capitalize">{problem.difficulty}</span>
        </div>

        <p className="text-[15px] text-surface-100 leading-relaxed">{problem.statement}</p>

        <div className="space-y-2">
          {problem.options.map(opt => {
            const isSelected = selected === opt.key;
            const isRight = opt.key === problem.correct_option;
            const showCorrect = revealed && isRight;
            const showWrong = revealed && isSelected && !isRight;

            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                disabled={revealed}
                className={[
                  'w-full text-left p-3 rounded-lg border transition-all',
                  showCorrect
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100'
                    : showWrong
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-100'
                    : isSelected
                    ? 'border-violet-500/50 bg-violet-500/5 text-surface-100'
                    : 'border-surface-700 bg-surface-900 text-surface-200 hover:border-surface-600 disabled:cursor-default',
                ].join(' ')}
              >
                <span className="text-xs font-mono text-surface-500 mr-2.5">{opt.key}.</span>
                <span className="text-sm">{opt.text}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-2"
            >
              <div
                className={`flex items-start gap-2 rounded-lg p-3 ${
                  isCorrect
                    ? 'bg-emerald-500/10 border border-emerald-500/25'
                    : 'bg-amber-500/10 border border-amber-500/25'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                )}
                <p className="text-xs leading-relaxed text-surface-100">
                  {isCorrect ? 'Correct. ' : 'Not quite. '}
                  {problem.explanation}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                {problemIdx < samples.length - 1 && (
                  <button
                    onClick={handleNext}
                    className="text-sm text-surface-400 hover:text-surface-200 transition-colors"
                  >
                    Try another →
                  </button>
                )}
                <Link
                  to="/sign-in"
                  onClick={() => trackEvent('sample_problem_converted', { from_problem_id: problem.id })}
                  className="ml-auto inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors"
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
