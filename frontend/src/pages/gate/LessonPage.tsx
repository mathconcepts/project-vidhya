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

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle, Eye,
  Lightbulb, BookOpen, Target, Zap, AlertTriangle, Hash, GitBranch,
  Sparkles, ExternalLink, RotateCcw, Gauge,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useSession } from '@/hooks/useSession';

// ============================================================================
// Minimal type mirrors (the server is the source of truth)
// ============================================================================

interface Attribution {
  kind: 'user-material' | 'bundle-canon' | 'wolfram-computed' | 'concept-graph' | 'generated';
  title?: string;
  url?: string;
  license?: string;
  author?: string;
}

type ComponentKind =
  | 'hook' | 'definition' | 'intuition' | 'worked_example'
  | 'micro_exercise' | 'common_traps' | 'formal_statement' | 'connections';

interface Lesson {
  concept_id: string;
  concept_label: string;
  topic: string;
  components: any[];
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
  hook:             { icon: Lightbulb,    color: 'text-amber-400',   title: 'Why care' },
  definition:       { icon: BookOpen,     color: 'text-violet-400',     title: 'Definition' },
  intuition:        { icon: Eye,          color: 'text-emerald-400', title: 'Intuition' },
  worked_example:   { icon: Target,       color: 'text-purple-400',  title: 'Worked example' },
  micro_exercise:   { icon: Zap,          color: 'text-orange-400',  title: 'Quick check' },
  common_traps:     { icon: AlertTriangle,color: 'text-rose-400',    title: 'Watch for' },
  formal_statement: { icon: Hash,         color: 'text-indigo-400',  title: 'Formal' },
  connections:      { icon: GitBranch,    color: 'text-cyan-400',    title: 'Connections' },
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
  const kindTone: Record<Attribution['kind'], string> = {
    'user-material':    'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    'bundle-canon':     'bg-violet-500/10 text-violet-300 border-violet-500/25',
    'wolfram-computed': 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    'concept-graph':    'bg-surface-800/60 text-surface-400 border-surface-700',
    'generated':        'bg-purple-500/10 text-purple-300 border-purface-500/25',
  };
  return (
    <div className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border',
      kindTone[a.kind]
    )}>
      <span>{a.title || a.kind}</span>
      {a.url && (
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100">
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
  const meta = KIND_META[component.kind as ComponentKind];
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Icon size={16} className={meta.color} />
        <h2 className={clsx('text-sm font-semibold uppercase tracking-wide', meta.color)}>
          {meta.title}
        </h2>
      </div>

      {component.kind === 'hook' && <HookBody c={component} />}
      {component.kind === 'definition' && <DefinitionBody c={component} />}
      {component.kind === 'intuition' && <IntuitionBody c={component} />}
      {component.kind === 'worked_example' && <WorkedExampleBody c={component} onReveal={onReveal} />}
      {component.kind === 'micro_exercise' && <MicroExerciseBody c={component} onComplete={onComplete} />}
      {component.kind === 'common_traps' && <CommonTrapsBody c={component} />}
      {component.kind === 'formal_statement' && <FormalStatementBody c={component} />}
      {component.kind === 'connections' && <ConnectionsBody c={component} />}

      <AttributionBadge a={component.attribution} />

      {component.kind !== 'micro_exercise' && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onComplete()}
            className="flex-1 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-sm text-violet-300 hover:bg-violet-500/25"
          >
            Got it
          </button>
          <button
            onClick={onSkip}
            className="px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-400 hover:text-surface-200"
          >
            Skip
          </button>
        </div>
      )}
    </motion.div>
  );
}

function HookBody({ c }: { c: any }) {
  return <p className="text-sm text-surface-200 leading-relaxed">{c.text}</p>;
}

function DefinitionBody({ c }: { c: any }) {
  return (
    <div className="space-y-2">
      <div className="p-3 rounded-xl bg-surface-900 border border-surface-800">
        <p className="text-[10px] text-surface-500 uppercase tracking-wide mb-1">Canonical</p>
        <p className="text-sm text-surface-200">{c.canonical}</p>
      </div>
      {c.plain_english && c.plain_english !== c.canonical && (
        <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
          <p className="text-[10px] text-violet-300 uppercase tracking-wide mb-1">In plain English</p>
          <p className="text-sm text-violet-100/90">{c.plain_english}</p>
        </div>
      )}
    </div>
  );
}

function IntuitionBody({ c }: { c: any }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-surface-200 leading-relaxed">{c.text}</p>
      {c.analogy && (
        <p className="text-sm italic text-emerald-300/90 pl-3 border-l-2 border-emerald-500/50">
          {c.analogy}
        </p>
      )}
    </div>
  );
}

function WorkedExampleBody({ c, onReveal }: { c: any; onReveal: () => void }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-surface-900 border border-surface-800">
        <p className="text-[10px] text-surface-500 uppercase tracking-wide mb-1">Problem</p>
        <p className="text-sm text-surface-200">{c.problem}</p>
      </div>
      <div className="space-y-2">
        {c.steps?.map((step: any) => {
          const isRevealed = !!revealed[step.step_number];
          return (
            <div key={step.step_number} className="p-3 rounded-xl bg-surface-900/60 border border-surface-800">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-semibold flex items-center justify-center">
                  {step.step_number}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-200">{step.action}</p>
                  {isRevealed ? (
                    <>
                      <p className="text-xs text-surface-400 mt-1.5 leading-relaxed">{step.explanation}</p>
                      {step.self_check_prompt && (
                        <p className="text-xs text-emerald-300 mt-2 italic">{step.self_check_prompt}</p>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => { setRevealed(p => ({ ...p, [step.step_number]: true })); onReveal(); }}
                      className="mt-1.5 text-xs text-violet-400 hover:text-violet-300"
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
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
        <p className="text-[10px] text-emerald-300 uppercase tracking-wide mb-1">Final answer</p>
        <p className="text-sm text-emerald-100 font-mono">{c.final_answer}</p>
        {c.wolfram_verified && (
          <p className="text-[10px] text-emerald-400 mt-1">✓ Wolfram-verified</p>
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
    // Simple string-equivalence check (case/whitespace insensitive) for instant feedback
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[,;]/g, '');
    const correct = normalize(answer) === normalize(c.expected_answer);
    setSubmitted({ correct });
    onComplete({
      micro_exercise_correct: correct,
      micro_exercise_duration_ms: Date.now() - startTime.current,
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-surface-200">{c.question}</p>
      {!submitted ? (
        <>
          <input
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Your answer"
            className="w-full px-3 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-200 focus:outline-none focus:border-violet-500/50"
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!answer.trim()}
              className="flex-1 py-2.5 rounded-xl bg-violet-500/20 border border-violet-500/40 text-sm text-violet-200 font-medium disabled:opacity-50"
            >
              Check my answer
            </button>
            <button
              onClick={() => onComplete({ skipped: true })}
              className="px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-400"
            >
              Skip
            </button>
          </div>
        </>
      ) : (
        <div className={clsx(
          'p-3 rounded-xl border space-y-2',
          submitted.correct
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-rose-500/10 border-rose-500/30'
        )}>
          <div className="flex items-center gap-2">
            {submitted.correct
              ? <CheckCircle2 size={16} className="text-emerald-400" />
              : <XCircle size={16} className="text-rose-400" />}
            <span className={clsx(
              'text-sm font-semibold',
              submitted.correct ? 'text-emerald-300' : 'text-rose-300'
            )}>
              {submitted.correct ? 'Correct' : 'Not quite'}
            </span>
          </div>
          <p className="text-xs text-surface-400">
            Expected: <span className="font-mono text-surface-200">{c.expected_answer}</span>
          </p>
          {c.answer_explanation && (
            <p className="text-xs text-surface-400 leading-relaxed">{c.answer_explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

function CommonTrapsBody({ c }: { c: any }) {
  return (
    <div className="space-y-2">
      {c.traps?.map((t: any, i: number) => (
        <div key={i} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <p className="text-sm text-rose-100 font-medium">{t.description}</p>
          {t.why_it_happens && (
            <p className="text-xs text-rose-200/70 mt-1 italic">Why: {t.why_it_happens}</p>
          )}
          {t.correction && (
            <p className="text-xs text-emerald-300 mt-1">Fix: {t.correction}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function FormalStatementBody({ c }: { c: any }) {
  return (
    <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
      <p className="text-sm text-indigo-100 font-mono whitespace-pre-wrap">{c.statement}</p>
      {c.assumptions && c.assumptions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-indigo-500/20">
          <p className="text-[10px] text-indigo-300 uppercase tracking-wide">Assumptions</p>
          <ul className="text-xs text-indigo-200/80 space-y-0.5 mt-1">
            {c.assumptions.map((a: string, i: number) => <li key={i}>• {a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConnectionsBody({ c }: { c: any }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      {c.prerequisites?.length > 0 && (
        <div>
          <p className="text-[10px] text-surface-500 uppercase tracking-wide mb-1.5">Requires</p>
          <div className="flex flex-wrap gap-1.5">
            {c.prerequisites.map((p: any) => (
              <button
                key={p.concept_id}
                onClick={() => navigate(`/lesson/${p.concept_id}`)}
                className="text-xs px-2 py-1 rounded-lg bg-surface-900 border border-surface-800 text-surface-300 hover:border-violet-500/30"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {c.leads_to?.length > 0 && (
        <div>
          <p className="text-[10px] text-surface-500 uppercase tracking-wide mb-1.5">Unlocks</p>
          <div className="flex flex-wrap gap-1.5">
            {c.leads_to.slice(0, 6).map((p: any) => (
              <button
                key={p.concept_id}
                onClick={() => navigate(`/lesson/${p.concept_id}`)}
                className="text-xs px-2 py-1 rounded-lg bg-violet-500/5 border border-violet-500/20 text-violet-300 hover:bg-violet-500/15"
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

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [engagement, setEngagement] = useState<{ completed: number; skipped: number; reveals: number; micro?: any }>({
    completed: 0, skipped: 0, reveals: 0,
  });
  const [doneState, setDoneState] = useState<null | { quality: number; interval_days: number }>(null);
  const visitsRef = useRef<Record<string, StoredVisit>>({});

  // Load lesson
  useEffect(() => {
    if (!concept_id) return;
    setLoading(true);
    const visits = loadVisits();
    visitsRef.current = visits;
    const lastVisit = visits[concept_id];

    fetch('/api/lesson/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concept_id,
        session_id: sessionId,
        student: lastVisit ? {
          session_id: sessionId,
          last_lesson_visit: { [concept_id]: lastVisit },
        } : { session_id: sessionId },
      }),
    })
      .then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error); }))
      .then((data: Lesson) => { setLesson(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [concept_id, sessionId]);

  const currentComponent = lesson?.components[index];
  const totalComponents = lesson?.components.length ?? 0;
  const progress = totalComponents > 0 ? (index + 1) / totalComponents : 0;

  const advance = useCallback(() => {
    if (index < totalComponents - 1) {
      setIndex(i => i + 1);
    } else {
      // End of lesson — compute SM-2 advance
      finalizeLesson();
    }
  }, [index, totalComponents, engagement]);

  const onComplete = useCallback((extra?: any) => {
    setEngagement(e => ({
      ...e,
      completed: e.completed + 1,
      micro: extra?.micro_exercise_correct !== undefined ? extra : e.micro,
    }));
    // Fire-and-forget engagement log
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
      <div className="flex items-center gap-2 text-surface-400 text-sm py-10 justify-center">
        <Loader2 size={14} className="animate-spin" /> Building your lesson...
      </div>
    );
  }
  if (error || !lesson) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-300">
        {error || 'Could not load lesson.'}
      </div>
    );
  }

  // Lesson header (concept name, metadata, progress)
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <button onClick={() => navigate(-1)} className="text-xs text-surface-500 hover:text-surface-300 mb-1">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-surface-100">{lesson.concept_label}</h1>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-surface-500 mt-1">
            <span>{lesson.topic.replace(/-/g, ' ')}</span>
            <span>~{lesson.estimated_minutes}min</span>
            <span>quality {(lesson.quality_score * 100).toFixed(0)}%</span>
            {lesson.is_revisit && <span className="text-emerald-400">revisit</span>}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!doneState && (
        <div className="h-1 rounded-full bg-surface-800 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-400 to-emerald-400"
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/15 to-emerald-500/15 border border-violet-500/25">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-violet-400" />
              <h2 className="text-base font-semibold text-surface-100">Lesson complete</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-xl font-bold text-emerald-400">{engagement.completed}</p>
                <p className="text-[10px] text-surface-500">completed</p>
              </div>
              <div>
                <p className="text-xl font-bold text-surface-400">{engagement.skipped}</p>
                <p className="text-[10px] text-surface-500">skipped</p>
              </div>
              <div>
                <p className="text-xl font-bold text-violet-400">{engagement.reveals}</p>
                <p className="text-[10px] text-surface-500">explanations</p>
              </div>
            </div>
            <p className="text-xs text-surface-300 mt-3 leading-relaxed">
              {doneState.interval_days === 1
                ? "Bring this back tomorrow for a quick retrieval check."
                : `I'll suggest this again in ${doneState.interval_days} days — proven to cement it.`}
            </p>
          </div>

          {/* Related problems */}
          {lesson.related_problems && lesson.related_problems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target size={13} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-surface-200">Try these next</h3>
              </div>
              {lesson.related_problems.map(p => (
                <div key={p.id} className="p-3 rounded-xl bg-surface-900 border border-surface-800 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-surface-500">
                    <span>{p.relationship.replace(/-/g, ' ')}</span>
                    {p.wolfram_verified && <span className="text-emerald-400">Wolfram ✓</span>}
                  </div>
                  <p className="text-sm text-surface-200">{p.question_text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/smart-practice')}
              className="flex-1 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-sm text-violet-300 hover:bg-violet-500/25"
            >
              Practice more
            </button>
            <button
              onClick={() => { setIndex(0); setEngagement({ completed: 0, skipped: 0, reveals: 0 }); setDoneState(null); }}
              className="px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-400"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Lesson-level sources footer */}
      {!doneState && lesson.sources.length > 0 && (
        <div className="pt-4 mt-4 border-t border-surface-800">
          <p className="text-[10px] text-surface-500 uppercase tracking-wide mb-1.5">Sources cited</p>
          <div className="flex flex-wrap gap-1.5">
            {lesson.sources.map((s, i) => <AttributionBadge key={i} a={s} />)}
          </div>
          {lesson.personalization_applied.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <Gauge size={10} />
              <span>personalized for you</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
