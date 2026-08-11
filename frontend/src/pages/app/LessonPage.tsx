/**
 * LessonPage — card-based lesson reader
 *
 * Route: /lesson/:concept_id
 *
 * Renders a personalized Lesson as a sequence of single-focus cards.
 * The student moves through them at their own pace, each card encouraging
 * active engagement: reveal-on-tap for explanations, input for micro-exercise
 * answers, "got it / not yet" at the end to drive SM-2 scheduling.
 *
 * All engagement signals are logged server-side via /api/lesson/engagement.
 * The final card advances the student's SM-2 state.
 *
 * This page is the pedagogical core of Vidhya — everything else
 * (practice, chat, multimodal) orbits this.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AtomCardRenderer, type ContentAtom } from '@/components/lesson/AtomCardRenderer';
import { ConceptMathViz } from '@/components/lesson/ConceptMathViz';
import {
  Loader2, CheckCircle2, XCircle, Eye,
  Lightbulb, BookOpen, Target, Zap, AlertTriangle, Hash, GitBranch,
  Sparkles, ExternalLink, RotateCcw, Gauge, ListChecks,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useActiveExam } from '@/hooks/useActiveExam';
import { gatherComposeSignals } from '@/lib/gbrain/compose-signals';

// ============================================================================
// Minimal type mirrors (the server is the source of truth)
// ============================================================================

interface Attribution {
  kind: 'user-material' | 'bundle-canon' | 'wolfram-computed' | 'concept-graph' | 'topic-notes' | 'generated';
  title?: string;
  url?: string;
  license?: string;
  author?: string;
}

type ComponentKind =
  | 'hook' | 'definition' | 'intuition' | 'worked_example'
  | 'micro_exercise' | 'common_traps' | 'strategy' | 'formal_statement' | 'connections';

interface Lesson {
  concept_id: string;
  concept_label: string;
  topic: string;
  components: any[];
  /** ContentAtom v2 — present when the concept has atoms/ authored. Empty → legacy path. */
  atoms?: ContentAtom[];
  estimated_minutes: number;
  difficulty_base: number;
  quality_score: number;
  sources: Attribution[];
  personalization_applied: string[];
  related_problems?: Array<{
    id: string; concept_id: string; question_text: string;
    difficulty: number; relationship: string; source: string;
    wolfram_verified: boolean;
  }>;
  next_review_at?: string;
  is_revisit: boolean;
}

// ============================================================================
// Component icon + color mapping
// ============================================================================

const KIND_META: Record<ComponentKind, { icon: typeof Lightbulb; color: string; title: string }> = {
  hook:             { icon: Lightbulb,     color: 'var(--orange)',    title: 'Why care' },
  definition:       { icon: BookOpen,      color: 'var(--indigo-ink)', title: 'Definition' },
  intuition:        { icon: Eye,           color: 'var(--green-ink)', title: 'Intuition' },
  worked_example:   { icon: Target,        color: 'var(--indigo-ink)', title: 'Worked example' },
  micro_exercise:   { icon: Zap,           color: 'var(--orange)',    title: 'Quick check' },
  common_traps:     { icon: AlertTriangle, color: 'var(--red)',       title: 'Watch for' },
  strategy:         { icon: ListChecks,    color: 'var(--indigo-ink)', title: 'Study strategy' },
  formal_statement: { icon: Hash,          color: 'var(--indigo-ink)', title: 'Formal' },
  connections:      { icon: GitBranch,     color: 'var(--indigo-ink)', title: 'Connections' },
};

// ============================================================================
// Local persistence — lesson visit log in localStorage
// ============================================================================

const VISIT_STORAGE_KEY = 'vidhya.lesson.visits';

interface StoredVisit {
  last_visited_at: string;
  visit_count: number;
  sm2_interval_days: number;
  sm2_ease_factor: number;
}

function loadVisits(): Record<string, StoredVisit> {
  try { return JSON.parse(localStorage.getItem(VISIT_STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveVisits(v: Record<string, StoredVisit>) {
  try { localStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify(v)); } catch {}
}

// ============================================================================
// Attribution chip
// ============================================================================

function AttributionBadge({ a }: { a: Attribution | undefined }) {
  if (!a) return null;
  type AKind = Attribution['kind'];
  const kindStyle: Record<AKind, React.CSSProperties> = {
    'user-material':    { background: 'rgba(52,199,89,.06)',   color: 'var(--green-ink)',   border: '1px solid rgba(52,199,89,.22)' },
    'bundle-canon':     { background: 'rgba(88,86,214,.06)',   color: 'var(--indigo-ink)',  border: '1px solid rgba(88,86,214,.22)' },
    'wolfram-computed': { background: 'rgba(255,159,10,.06)',   color: 'var(--orange)',      border: '1px solid rgba(255,159,10,.22)' },
    'concept-graph':    { background: 'var(--surface-fill)',   color: 'var(--text-tertiary)', border: 'var(--hairline) solid var(--separator)' },
    'topic-notes':      { background: 'var(--surface-fill)',   color: 'var(--text-tertiary)', border: 'var(--hairline) solid var(--separator)' },
    'generated':        { background: 'rgba(88,86,214,.06)',   color: 'var(--indigo-ink)',  border: '1px solid rgba(88,86,214,.22)' },
  };
  const s = kindStyle[a.kind];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10, ...s }}>
      <span>{a.title || a.kind}</span>
      {a.url && (
        <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ opacity: 0.7, color: 'inherit' }}>
          <ExternalLink size={9} />
        </a>
      )}
    </div>
  );
}

// ============================================================================
// Per-component renderers
// ============================================================================

function ComponentCard({
  component, concept_id, onComplete, onSkip, onReveal,
}: {
  component: any;
  concept_id: string;
  onComplete: (extra?: any) => void;
  onSkip: () => void;
  onReveal: () => void;
}) {
  // Unknown kinds (newer server than client) fall back to a neutral header
  // instead of crashing the lesson.
  const meta = KIND_META[component.kind as ComponentKind]
    ?? { icon: BookOpen, color: 'var(--text-tertiary)', title: String(component.kind).replace(/_/g, ' ') };
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={16} style={{ color: meta.color }} />
        <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: meta.color }}>
          {meta.title}
        </h2>
      </div>

      {component.kind === 'hook' && <HookBody c={component} />}
      {component.kind === 'definition' && <DefinitionBody c={component} />}
      {component.kind === 'intuition' && <IntuitionBody c={component} />}
      {component.kind === 'worked_example' && <WorkedExampleBody c={component} onReveal={onReveal} />}
      {component.kind === 'micro_exercise' && <MicroExerciseBody c={component} onComplete={onComplete} />}
      {component.kind === 'common_traps' && <CommonTrapsBody c={component} />}
      {component.kind === 'strategy' && <StrategyBody c={component} />}
      {component.kind === 'formal_statement' && <FormalStatementBody c={component} />}
      {component.kind === 'connections' && <ConnectionsBody c={component} />}

      <AttributionBadge a={component.attribution} />

      {component.kind !== 'micro_exercise' && (
        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button
            onClick={() => onComplete()}
            style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.25)', fontSize: 'var(--text-body)', color: 'var(--indigo-ink)', cursor: 'pointer' }}
          >
            Got it
          </button>
          <button
            onClick={onSkip}
            style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', fontSize: 'var(--text-body)', color: 'var(--text-tertiary)', cursor: 'pointer' }}
          >
            Skip
          </button>
        </div>
      )}
    </motion.div>
  );
}

function HookBody({ c }: { c: any }) {
  return (
    <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
      {c.text}
    </p>
  );
}

function DefinitionBody({ c }: { c: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Canonical</p>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>{c.canonical}</p>
      </div>
      {c.plain_english && c.plain_english !== c.canonical && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.2)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--indigo-ink)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>In plain English</p>
          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>{c.plain_english}</p>
        </div>
      )}
    </div>
  );
}

function IntuitionBody({ c }: { c: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>{c.text}</p>
      {c.analogy && (
        <p style={{ margin: 0, fontSize: 'var(--text-body)', fontStyle: 'italic', color: 'var(--green-ink)', paddingLeft: 12, borderLeft: '2px solid rgba(52,199,89,.4)' }}>
          {c.analogy}
        </p>
      )}
    </div>
  );
}

function StrategyBody({ c }: { c: any }) {
  return (
    <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
      {c.text}
    </p>
  );
}

/**
 * Honest MCQ rendering: one example-problem card — question, options,
 * answer, explanation as a single revealable prose block. No fabricated
 * step structure.
 */
function ExampleProblemBody({ c, onReveal }: { c: any; onReveal: () => void }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Example problem</p>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>{c.problem}</p>
        {Array.isArray(c.options) && c.options.length > 0 && (
          <ul style={{ margin: '8px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {c.options.map((opt: string, i: number) => (
              <li key={i} style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>{opt}</li>
            ))}
          </ul>
        )}
      </div>
      {revealed ? (
        <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--green-ink)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Answer</p>
          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{c.final_answer}</p>
          {c.explanation && (
            <p style={{ margin: '8px 0 0', fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
              {c.explanation}
            </p>
          )}
          {c.wolfram_verified && (
            <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--green-ink)' }}>✓ Wolfram-verified</p>
          )}
        </div>
      ) : (
        <button
          onClick={() => { setRevealed(true); onReveal(); }}
          style={{ alignSelf: 'flex-start', fontSize: 'var(--text-body)', color: 'var(--indigo-ink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Show answer & explanation →
        </button>
      )}
    </div>
  );
}

function WorkedExampleBody({ c, onReveal }: { c: any; onReveal: () => void }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  if (c.presentation === 'example_problem') {
    return <ExampleProblemBody c={c} onReveal={onReveal} />;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Problem</p>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>{c.problem}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {c.steps?.map((step: any) => {
          const isRevealed = !!revealed[step.step_number];
          return (
            <div key={step.step_number} style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: 'rgba(88,86,214,.12)', color: 'var(--indigo-ink)', fontSize: 11, fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step.step_number}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>{step.action}</p>
                  {isRevealed ? (
                    <>
                      <p style={{ margin: '6px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>{step.explanation}</p>
                      {step.self_check_prompt && (
                        <p style={{ margin: '8px 0 0', fontSize: 'var(--text-caption)', color: 'var(--green-ink)', fontStyle: 'italic' }}>{step.self_check_prompt}</p>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => { setRevealed(p => ({ ...p, [step.step_number]: true })); onReveal(); }}
                      style={{ marginTop: 6, fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Why this step? →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--green-ink)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Final answer</p>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{c.final_answer}</p>
        {c.wolfram_verified && (
          <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--green-ink)' }}>✓ Wolfram-verified</p>
        )}
      </div>
    </div>
  );
}

function MicroExerciseBody({ c, onComplete }: { c: any; onComplete: (extra?: any) => void }) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState<null | { correct: boolean }>(null);
  const startTime = useRef(Date.now());

  const submit = () => {
    if (!answer.trim()) return;
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[,;]/g, '');
    const correct = normalize(answer) === normalize(c.expected_answer);
    setSubmitted({ correct });
    onComplete({
      micro_exercise_correct: correct,
      micro_exercise_duration_ms: Date.now() - startTime.current,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>{c.question}</p>
      {!submitted ? (
        <>
          <input
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Your answer"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', fontSize: 'var(--text-body)', color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={submit}
              disabled={!answer.trim()}
              style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.1)', border: '1px solid rgba(88,86,214,.3)', fontSize: 'var(--text-body)', color: 'var(--indigo-ink)', fontWeight: 'var(--weight-medium)', cursor: answer.trim() ? 'pointer' : 'not-allowed', opacity: answer.trim() ? 1 : 0.5 }}
            >
              Check my answer
            </button>
            <button
              onClick={() => onComplete({ skipped: true })}
              style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', fontSize: 'var(--text-body)', color: 'var(--text-tertiary)', cursor: 'pointer' }}
            >
              Skip
            </button>
          </div>
        </>
      ) : (
        <div style={{
          padding: 12, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 8,
          background: submitted.correct ? 'rgba(52,199,89,.06)' : 'rgba(255,59,48,.06)',
          border: submitted.correct ? '1px solid rgba(52,199,89,.3)' : '1px solid rgba(255,59,48,.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {submitted.correct
              ? <CheckCircle2 size={16} style={{ color: 'var(--green-ink)' }} />
              : <XCircle size={16} style={{ color: 'var(--red)' }} />}
            <span style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: submitted.correct ? 'var(--green-ink)' : 'var(--red)' }}>
              {submitted.correct ? 'Correct' : 'Not quite'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
            Expected: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{c.expected_answer}</span>
          </p>
          {c.answer_explanation && (
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>{c.answer_explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

function CommonTrapsBody({ c }: { c: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {c.traps?.map((t: any, i: number) => (
        <div key={i} style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(255,59,48,.04)', border: '1px solid rgba(255,59,48,.18)' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)' }}>{t.description}</p>
          {t.why_it_happens && (
            <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Why: {t.why_it_happens}</p>
          )}
          {t.correction && (
            <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--green-ink)' }}>Fix: {t.correction}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function FormalStatementBody({ c }: { c: any }) {
  return (
    <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.04)', border: '1px solid rgba(88,86,214,.18)' }}>
      <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>{c.statement}</p>
      {c.assumptions && c.assumptions.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: 'var(--hairline) solid var(--separator)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--indigo-ink)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assumptions</p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {c.assumptions.map((a: string, i: number) => (
              <li key={i} style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>• {a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConnectionsBody({ c }: { c: any }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {c.prerequisites?.length > 0 && (
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Requires</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {c.prerequisites.map((p: any) => (
              <button
                key={p.concept_id}
                onClick={() => navigate(`/lesson/${p.concept_id}`)}
                style={{ fontSize: 'var(--text-caption)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {c.leads_to?.length > 0 && (
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unlocks</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {c.leads_to.slice(0, 6).map((p: any) => (
              <button
                key={p.concept_id}
                onClick={() => navigate(`/lesson/${p.concept_id}`)}
                style={{ fontSize: 'var(--text-caption)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.2)', color: 'var(--indigo-ink)', cursor: 'pointer' }}
              >
                {p.label} →
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================

export default function LessonPage() {
  const { concept_id = '' } = useParams<{ concept_id: string }>();
  const navigate = useNavigate();
  const sessionId = useSession();
  const { exam } = useActiveExam();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [engagement, setEngagement] = useState<{ completed: number; skipped: number; reveals: number; micro?: any }>({
    completed: 0, skipped: 0, reveals: 0,
  });
  const [doneState, setDoneState] = useState<null | { quality: number; interval_days: number }>(null);
  const visitsRef = useRef<Record<string, StoredVisit>>({});

  useEffect(() => {
    if (!concept_id) return;
    let cancelled = false;
    setLoading(true);
    const visits = loadVisits();
    visitsRef.current = visits;
    const lastVisit = visits[concept_id];

    (async () => {
      // Adaptive threading (items 6 + 7): mastery + recent errors from the
      // local GBrain stores, plus concept-relevant chunks from the
      // student's uploaded materials (IndexedDB RAG). Best-effort — empty
      // stores mean an empty signal set and the server's generic path.
      const signals = await gatherComposeSignals(sessionId, concept_id);

      const student: Record<string, unknown> = { session_id: sessionId };
      if (lastVisit) student.last_lesson_visit = { [concept_id]: lastVisit };
      if (signals.mastery_by_topic) student.mastery_by_topic = signals.mastery_by_topic;
      if (signals.mastery_by_concept) student.mastery_by_concept = signals.mastery_by_concept;
      if (signals.recent_errors) student.recent_errors = signals.recent_errors;

      const body: Record<string, unknown> = { concept_id, session_id: sessionId, student };
      if (signals.user_material_chunks) body.user_material_chunks = signals.user_material_chunks;

      try {
        const r = await fetch('/api/lesson/compose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const e = await r.json();
          throw new Error(e.error);
        }
        const data: Lesson = await r.json();
        if (!cancelled) { setLesson(data); setLoading(false); }
      } catch (err: any) {
        if (!cancelled) { setError(err.message); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, [concept_id, sessionId]);

  const currentComponent = lesson?.components[index];
  const totalComponents = lesson?.components.length ?? 0;
  const progress = totalComponents > 0 ? (index + 1) / totalComponents : 0;

  const advance = useCallback(() => {
    if (index < totalComponents - 1) {
      setIndex(i => i + 1);
    } else {
      finalizeLesson();
    }
  }, [index, totalComponents, engagement]);

  const onComplete = useCallback((extra?: any) => {
    setEngagement(e => ({
      ...e,
      completed: e.completed + 1,
      micro: extra?.micro_exercise_correct !== undefined ? extra : e.micro,
    }));
    if (currentComponent) {
      fetch('/api/lesson/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_id, component_kind: currentComponent.kind,
          event: extra?.skipped ? 'skipped' : 'completed',
          topic: lesson?.topic,
        }),
      }).catch(() => {});
    }
    advance();
  }, [currentComponent, concept_id, lesson, advance]);

  const onSkip = useCallback(() => {
    setEngagement(e => ({ ...e, skipped: e.skipped + 1 }));
    if (currentComponent) {
      fetch('/api/lesson/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_id, component_kind: currentComponent.kind,
          event: 'skipped', topic: lesson?.topic,
        }),
      }).catch(() => {});
    }
    advance();
  }, [currentComponent, concept_id, lesson, advance]);

  const onReveal = useCallback(() => {
    setEngagement(e => ({ ...e, reveals: e.reveals + 1 }));
  }, []);

  const finalizeLesson = useCallback(async () => {
    if (!lesson) return;
    const prev = visitsRef.current[concept_id];
    try {
      const res = await fetch('/api/lesson/advance-sm2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_id,
          prev_state: prev,
          micro_exercise_correct: engagement.micro?.micro_exercise_correct,
          micro_exercise_duration_ms: engagement.micro?.micro_exercise_duration_ms,
          completed_components_count: engagement.completed,
          skipped_components_count: engagement.skipped,
        }),
      });
      const data = await res.json();
      visitsRef.current[concept_id] = data.state;
      saveVisits(visitsRef.current);
      setDoneState({ quality: data.inferred_quality, interval_days: data.state.sm2_interval_days });
    } catch {
      setDoneState({ quality: 2, interval_days: 1 });
    }
  }, [lesson, concept_id, engagement]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-body)', color: 'var(--text-tertiary)', padding: '40px 0', justifyContent: 'center' }}>
        <Loader2 size={14} className="animate-spin" /> Building your lesson...
      </div>
    );
  }
  if (error || !lesson) {
    return (
      <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', fontSize: 'var(--text-body)', color: 'var(--red)' }}>
        {error || 'Could not load lesson.'}
      </div>
    );
  }

  // ContentAtom v2 path: when atoms[] is non-empty, render the atom card stack.
  if (lesson.atoms && lesson.atoms.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 672, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: '8px 16px 0' }}>
          <div>
            <button
              onClick={() => navigate(-1)}
              style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 4, padding: 0 }}
            >
              ← Back
            </button>
            <h1 style={{ margin: 0, fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>{lesson.concept_label}</h1>
          </div>
        </div>
        <AtomCardRenderer
          atoms={lesson.atoms}
          conceptId={concept_id}
          studentId={sessionId}
          onComplete={() => navigate('/')}
        />
        <ConceptMathViz conceptId={concept_id} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 672, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <button
            onClick={() => navigate(-1)}
            style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 4, padding: 0 }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>{lesson.concept_label}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 12, rowGap: 2, fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
            {exam?.name && (
              <span style={{ color: 'var(--indigo-ink)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{exam.name}</span>
            )}
            {lesson.topic !== 'uncategorized' && <span>{lesson.topic.replace(/-/g, ' ')}</span>}
            <span>~{lesson.estimated_minutes}min</span>
            <span>quality {(lesson.quality_score * 100).toFixed(0)}%</span>
            {lesson.is_revisit && <span style={{ color: 'var(--green-ink)' }}>revisit</span>}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!doneState && (
        <div style={{ height: 4, borderRadius: 99, background: 'var(--surface-fill)', overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', background: 'var(--green)', borderRadius: 99 }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Card */}
      {!doneState && currentComponent && (
        <AnimatePresence mode="wait">
          <ComponentCard
            key={currentComponent.id}
            component={currentComponent}
            concept_id={concept_id}
            onComplete={onComplete}
            onSkip={onSkip}
            onReveal={onReveal}
          />
        </AnimatePresence>
      )}

      {/* Completion screen */}
      {doneState && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div style={{ padding: 20, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', boxShadow: 'var(--shadow-raise)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={16} style={{ color: 'var(--green-ink)' }} />
              <h2 style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Lesson complete</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--green-ink)' }}>{engagement.completed}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>completed</p>
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--text-tertiary)' }}>{engagement.skipped}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>skipped</p>
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--indigo-ink)' }}>{engagement.reveals}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>explanations</p>
              </div>
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              {doneState.interval_days === 1
                ? "Bring this back tomorrow for a quick retrieval check."
                : `I'll suggest this again in ${doneState.interval_days} days — proven to cement it.`}
            </p>
          </div>

          {/* Related problems */}
          {lesson.related_problems && lesson.related_problems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={13} style={{ color: 'var(--indigo-ink)' }} />
                <h3 style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Try these next</h3>
              </div>
              {lesson.related_problems.map(p => (
                <div key={p.id} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--text-tertiary)' }}>
                    <span>{p.relationship.replace(/-/g, ' ')}</span>
                    {p.wolfram_verified && <span style={{ color: 'var(--green-ink)' }}>Wolfram ✓</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>{p.question_text}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate('/smart-practice')}
              style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.25)', fontSize: 'var(--text-body)', color: 'var(--indigo-ink)', cursor: 'pointer' }}
            >
              Practice more
            </button>
            <button
              onClick={() => { setIndex(0); setEngagement({ completed: 0, skipped: 0, reveals: 0 }); setDoneState(null); }}
              style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </motion.div>
      )}

      <ConceptMathViz conceptId={concept_id} />

      {/* Lesson-level sources footer */}
      {!doneState && lesson.sources.length > 0 && (
        <div style={{ paddingTop: 16, marginTop: 16, borderTop: 'var(--hairline) solid var(--separator)' }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sources cited</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lesson.sources.map((s, i) => <AttributionBadge key={i} a={s} />)}
          </div>
          {lesson.personalization_applied.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--green-ink)' }}>
              <Gauge size={10} />
              <span>personalized for you</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
