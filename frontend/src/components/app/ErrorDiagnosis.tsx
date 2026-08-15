/**
 * ErrorDiagnosis — GBrain error analysis displayed after a wrong answer.
 * Shows error type, why the misconception was tempting, why it's wrong,
 * corrective hint, and an optional corrective problem.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Brain, ChevronDown, ChevronUp, Lightbulb, Target, GitBranch } from 'lucide-react';

interface CorrectionProblem {
  question: string;
  answer: string;
  explanation: string;
}

interface DiagnosisData {
  error_type: string;
  concept_id: string;
  misconception_id: string;
  diagnosis: string;
  why_tempting: string;
  why_wrong: string;
  corrective_hint: string;
  corrective_problem?: CorrectionProblem;
}

interface PrerequisiteAlert {
  concept: string;
  shaky_prereqs: string[];
  severity: string;
}

interface ErrorDiagnosisProps {
  diagnosis: DiagnosisData;
  prerequisiteAlerts?: PrerequisiteAlert[];
  motivationState?: string;
  consecutiveFailures?: number;
}

const ERROR_TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Brain }> = {
  conceptual:          { label: 'Conceptual Gap',     color: 'var(--red)',        icon: Brain },
  procedural:          { label: 'Wrong Procedure',    color: 'var(--orange)',     icon: GitBranch },
  notation:            { label: 'Notation Confusion', color: 'var(--indigo-ink)', icon: AlertTriangle },
  misread:             { label: 'Question Misread',   color: 'var(--indigo-ink)', icon: AlertTriangle },
  time_pressure:       { label: 'Rushed Error',       color: 'var(--orange)',     icon: Target },
  arithmetic:          { label: 'Calculation Error',  color: 'var(--green-ink)',  icon: Target },
  overconfidence_skip: { label: 'Skipped Steps',      color: 'var(--orange)',     icon: Lightbulb },
};

export function ErrorDiagnosis({ diagnosis, prerequisiteAlerts, motivationState, consecutiveFailures }: ErrorDiagnosisProps) {
  const [expanded, setExpanded] = useState(true);
  const [showCorrective, setShowCorrective] = useState(false);
  const [corrAnswerRevealed, setCorrAnswerRevealed] = useState(false);

  // When no LLM is configured, classifyError returns a placeholder shaped like
  // a diagnosis: "The answer was incorrect", "The approach may have seemed
  // reasonable", "The specific error needs further analysis". Rendering that
  // under headings like "why this was tempting" presents filler as insight,
  // which is worse than showing nothing — it makes the product look like it
  // analysed the mistake when it did not. `unclassified` is the marker the
  // fallback sets; refuse to dress it up.
  if (diagnosis.misconception_id === 'unclassified') return null;

  const config = ERROR_TYPE_CONFIG[diagnosis.error_type] || ERROR_TYPE_CONFIG.conceptual;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 25 }}
      style={{
        borderRadius: 'var(--radius-md)',
        border: 'var(--hairline) solid var(--separator)',
        background: 'var(--surface-card)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-xs)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-fill)',
          flexShrink: 0,
          color: config.color,
        }}>
          <Icon size={14} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <span style={{ fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: config.color }}>
            {config.label}
          </span>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)' }}>
            {diagnosis.diagnosis}
          </p>
        </div>
        {expanded
          ? <ChevronUp size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        }
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Why tempting */}
              {diagnosis.why_tempting && (
                <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(255,159,10,.06)', border: '1px solid rgba(255,159,10,.18)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Why your approach seemed right
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                    {diagnosis.why_tempting}
                  </p>
                </div>
              )}

              {/* Why wrong */}
              {diagnosis.why_wrong && (
                <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(255,59,48,.05)', border: '1px solid rgba(255,59,48,.15)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    The specific flaw
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                    {diagnosis.why_wrong}
                  </p>
                </div>
              )}

              {/* Corrective hint */}
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.18)' }}>
                <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', color: 'var(--green-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Lightbulb size={10} style={{ display: 'inline', marginRight: 4 }} />
                  How to fix this
                </p>
                <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                  {diagnosis.corrective_hint}
                </p>
              </div>

              {/* Prerequisite alerts */}
              {prerequisiteAlerts && prerequisiteAlerts.length > 0 && (
                <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.18)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', color: 'var(--indigo-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <GitBranch size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Foundation gap detected
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                    Strengthen first:{' '}
                    {prerequisiteAlerts[0].shaky_prereqs.map(p => p.replace(/-/g, ' ')).join(' → ')}
                  </p>
                </div>
              )}

              {/* Corrective problem */}
              {diagnosis.corrective_problem && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => setShowCorrective(!showCorrective)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-caption)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--indigo-ink)',
                      padding: 0,
                    }}
                  >
                    <Target size={12} />
                    {showCorrective ? 'Hide' : 'Try'} a corrective problem
                    {showCorrective ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  <AnimatePresence>
                    {showCorrective && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.18)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
                            {diagnosis.corrective_problem.question}
                          </p>
                          {!corrAnswerRevealed ? (
                            <button
                              onClick={() => setCorrAnswerRevealed(true)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                                fontSize: 'var(--text-caption)',
                                fontWeight: 'var(--weight-semibold)',
                                color: 'var(--indigo-ink)',
                                padding: 0,
                                textAlign: 'left',
                              }}
                            >
                              Reveal answer
                            </button>
                          ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <p style={{ margin: 0, fontSize: 'var(--text-footnote)', fontWeight: 'var(--weight-semibold)', color: 'var(--green-ink)' }}>
                                Answer: {diagnosis.corrective_problem.answer}
                              </p>
                              <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
                                {diagnosis.corrective_problem.explanation}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Encouragement for frustrated students */}
              {motivationState === 'frustrated' && consecutiveFailures && consecutiveFailures >= 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.15)', textAlign: 'center' }}
                >
                  <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--indigo-ink)', lineHeight: 'var(--leading-relaxed)' }}>
                    Struggling is how learning happens. Every expert was once a beginner who didn't quit.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
