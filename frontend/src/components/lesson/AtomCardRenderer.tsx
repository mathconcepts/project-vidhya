/**
 * AtomCardRenderer — ContentAtom v2 card stack for LessonPage.
 *
 * Renders an array of ContentAtom into a swipe-through card sequence with:
 *   - ATOM_ANIMATION_MAP per atom_type (declarative, not hardcoded per concept)
 *   - Scaffolding fade on worked_example atoms (E4): blank trailing steps on revisit
 *   - Cohort callout on common_traps cards (E7): "X% miss this on the practice problem"
 *   - Engagement debounce: POST fires on card-leave, not card-mount
 *
 * Used by LessonPage when the v2 lesson response includes `atoms[]`.
 * Falls back to the legacy `components[]` path when atoms is empty.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Lightbulb, BookOpen, Target,
  AlertTriangle, Sparkles, Eye,
} from 'lucide-react';
import { clsx } from 'clsx';

// ─── Type mirror (server is source of truth) ──────────────────────────────

export type AtomType =
  | 'hook' | 'intuition' | 'formal_definition' | 'visual_analogy'
  | 'worked_example' | 'micro_exercise' | 'common_traps'
  | 'retrieval_prompt' | 'interleaved_drill' | 'mnemonic' | 'exam_pattern';

export type AnimationPreset =
  | 'fade-in' | 'slide-up' | 'reveal-highlight' | 'step-unfold'
  | 'scale-in' | 'bounce-alert' | 'shake-then-settle' | 'flip-reveal';

export interface ContentAtom {
  id: string;
  concept_id: string;
  atom_type: AtomType;
  bloom_level: 1 | 2 | 3 | 4 | 5 | 6;
  difficulty: number;
  exam_ids: string[];
  content: string;
  scaffold_fade?: boolean;
  animation_preset?: AnimationPreset;
  tested_by_atom?: string;
  engagement_count?: number;
  last_recall_correct?: boolean | null;
  cohort_error_pct?: number;
  cohort_n_seen?: number;
}

// ─── ATOM_ANIMATION_MAP — declarative, single source of truth ─────────────

const ATOM_ANIMATION_MAP: Record<AtomType, AnimationPreset> = {
  hook:               'bounce-alert',
  intuition:          'fade-in',
  formal_definition:  'slide-up',
  visual_analogy:     'scale-in',
  worked_example:     'step-unfold',
  micro_exercise:     'reveal-highlight',
  common_traps:       'shake-then-settle',
  retrieval_prompt:   'flip-reveal',
  interleaved_drill:  'slide-up',
  mnemonic:           'scale-in',
  exam_pattern:       'reveal-highlight',
};

const PRESET_VARIANTS: Record<AnimationPreset, any> = {
  'fade-in':           { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } },
  'slide-up':          { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.35 } },
  'reveal-highlight':  { initial: { backgroundColor: 'rgba(139,92,246,0.2)' }, animate: { backgroundColor: 'rgba(139,92,246,0)' }, transition: { duration: 1.2 } },
  'step-unfold':       { initial: { y: 12, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.3, staggerChildren: 0.15 } },
  'scale-in':          { initial: { scale: 0.92, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.35 } },
  'bounce-alert':      { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 260, damping: 18 } },
  'shake-then-settle': { initial: { x: 0 }, animate: { x: [0, -8, 8, -4, 4, 0] }, transition: { duration: 0.5 } },
  'flip-reveal':       { initial: { rotateY: 90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 }, transition: { duration: 0.4 } },
};

const ATOM_ICON: Record<AtomType, any> = {
  hook:               Sparkles,
  intuition:          Lightbulb,
  formal_definition:  BookOpen,
  visual_analogy:     Eye,
  worked_example:     Target,
  micro_exercise:     Target,
  common_traps:       AlertTriangle,
  retrieval_prompt:   Eye,
  interleaved_drill:  Target,
  mnemonic:           Sparkles,
  exam_pattern:       BookOpen,
};

const ATOM_LABEL: Record<AtomType, string> = {
  hook: 'Hook',
  intuition: 'Intuition',
  formal_definition: 'Definition',
  visual_analogy: 'Visual',
  worked_example: 'Worked Example',
  micro_exercise: 'Quick Check',
  common_traps: 'Common Traps',
  retrieval_prompt: 'Recall',
  interleaved_drill: 'Drill',
  mnemonic: 'Mnemonic',
  exam_pattern: 'Exam Pattern',
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function getPreset(atom: ContentAtom): AnimationPreset {
  return atom.animation_preset ?? ATOM_ANIMATION_MAP[atom.atom_type];
}

/**
 * Scaffolding fade — splits worked_example content on `---` step delimiters
 * and blanks the last min(engagement_count, steps.length-1) steps.
 * First step always stays visible.
 */
function applyScaffoldingFade(atom: ContentAtom): { steps: string[]; blanked: number } {
  if (atom.atom_type !== 'worked_example' || !atom.scaffold_fade) {
    return { steps: [atom.content], blanked: 0 };
  }
  const parts = atom.content
    .split(/\n---\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length <= 1) return { steps: [atom.content], blanked: 0 };
  const count = atom.engagement_count ?? 0;
  const blanked = Math.min(count, parts.length - 1);
  return { steps: parts, blanked };
}

// ─── Engagement debounce hook ─────────────────────────────────────────────

interface EngagementHook {
  onCardEnter: (atom: ContentAtom) => void;
  onCardLeave: (atom: ContentAtom, recallCorrect?: boolean) => void;
}

function useEngagement(
  conceptId: string,
  studentId: string | null,
  onError?: (atomType: AtomType) => void,
  onCorrect?: () => void,
): EngagementHook {
  const enterTimes = useRef<Map<string, number>>(new Map());

  const onCardEnter = (atom: ContentAtom) => {
    enterTimes.current.set(atom.id, Date.now());
  };

  const onCardLeave = async (atom: ContentAtom, recallCorrect?: boolean) => {
    const start = enterTimes.current.get(atom.id);
    enterTimes.current.delete(atom.id);
    const time_ms = start ? Date.now() - start : 0;
    const skipped = time_ms < 1500 && recallCorrect === undefined;
    if (recallCorrect === false) onError?.(atom.atom_type);
    if (recallCorrect === true) onCorrect?.();
    if (!studentId) return;
    try {
      await fetch(`/api/lesson/${encodeURIComponent(conceptId)}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atom_id: atom.id,
          time_ms,
          skipped,
          recall_correct: recallCorrect,
          student_id: studentId,
        }),
      });
    } catch { /* engagement is fire-and-forget */ }
  };

  return { onCardEnter, onCardLeave };
}

// ─── Per-atom card renderers ──────────────────────────────────────────────

function CommonTrapsCard({ atom }: { atom: ContentAtom }) {
  const showCallout =
    atom.cohort_n_seen != null &&
    atom.cohort_n_seen >= 10 &&
    atom.cohort_error_pct != null &&
    atom.cohort_error_pct >= 0.5;
  return (
    <div className="space-y-3">
      {showCallout && (
        <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          {Math.round((atom.cohort_error_pct ?? 0) * 100)}% of students at your level miss this on the practice problem.
        </div>
      )}
      <div className="prose prose-invert max-w-none text-surface-100 text-sm leading-relaxed whitespace-pre-wrap">
        {atom.content}
      </div>
    </div>
  );
}

function WorkedExampleCard({ atom }: { atom: ContentAtom }) {
  const { steps, blanked } = applyScaffoldingFade(atom);
  const visibleCount = steps.length - blanked;
  return (
    <div className="space-y-3">
      {atom.scaffold_fade && (atom.engagement_count ?? 0) > 0 && (
        <div className="text-xs text-violet-300/70">
          You've seen this {atom.engagement_count} time(s). Try the last {blanked} step{blanked === 1 ? '' : 's'} yourself.
        </div>
      )}
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={clsx(
            'p-3 rounded-lg border whitespace-pre-wrap text-sm leading-relaxed',
            i < visibleCount
              ? 'bg-surface-800 border-surface-700 text-surface-100'
              : 'bg-surface-900 border-dashed border-surface-700 text-surface-500 italic',
          )}
        >
          {i < visibleCount ? step : '(work this step out yourself)'}
        </motion.div>
      ))}
    </div>
  );
}

function DefaultAtomCard({ atom }: { atom: ContentAtom }) {
  return (
    <div className="prose prose-invert max-w-none text-surface-100 text-sm leading-relaxed whitespace-pre-wrap">
      {atom.content}
    </div>
  );
}

// ─── Main renderer ────────────────────────────────────────────────────────

export interface AtomCardRendererProps {
  atoms: ContentAtom[];
  conceptId: string;
  studentId: string | null;
  onComplete?: () => void;
}

export function AtomCardRenderer({ atoms, conceptId, studentId, onComplete }: AtomCardRendererProps) {
  const [index, setIndex] = useState(0);
  const [errorStreak, setErrorStreak] = useState(0);

  const engagement = useEngagement(
    conceptId,
    studentId,
    () => setErrorStreak((s) => s + 1),
    () => setErrorStreak(0),
  );

  const current = atoms[index];

  useEffect(() => {
    if (!current) return;
    engagement.onCardEnter(current);
    return () => {
      engagement.onCardLeave(current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?.id]);

  const next = (recallCorrect?: boolean) => {
    if (current) engagement.onCardLeave(current, recallCorrect);
    if (index >= atoms.length - 1) {
      onComplete?.();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const prev = () => setIndex((i) => Math.max(0, i - 1));

  if (!current) {
    return (
      <div className="text-center text-surface-500 text-sm py-8">No atoms to display.</div>
    );
  }

  const preset = getPreset(current);
  const variants = PRESET_VARIANTS[preset];
  const Icon = ATOM_ICON[current.atom_type];

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {atoms.map((_, i) => (
          <div
            key={i}
            className={clsx(
              'h-1.5 rounded-full transition-all',
              i === index ? 'w-6 bg-violet-500' : i < index ? 'w-1.5 bg-violet-500/40' : 'w-1.5 bg-surface-700',
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          {...variants}
          exit={{ opacity: 0, y: -10 }}
          className="p-5 rounded-xl bg-surface-900 border border-surface-800"
        >
          <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider text-violet-300/80">
            <Icon size={14} />
            <span>{ATOM_LABEL[current.atom_type]}</span>
            {current.engagement_count != null && current.engagement_count > 0 && (
              <span className="text-surface-500">· revisit #{current.engagement_count + 1}</span>
            )}
          </div>

          {current.atom_type === 'worked_example' ? (
            <WorkedExampleCard atom={current} />
          ) : current.atom_type === 'common_traps' ? (
            <CommonTrapsCard atom={current} />
          ) : (
            <DefaultAtomCard atom={current} />
          )}

          {/* Recall buttons for retrieval-style atoms */}
          {(current.atom_type === 'micro_exercise' || current.atom_type === 'retrieval_prompt') && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-surface-800">
              <button
                onClick={() => next(false)}
                className="flex-1 px-3 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm"
              >
                Not yet
              </button>
              <button
                onClick={() => next(true)}
                className="flex-1 px-3 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold"
              >
                Got it
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={prev}
          disabled={index === 0}
          className="p-2 rounded-lg text-surface-400 hover:text-surface-200 disabled:opacity-30"
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-xs text-surface-500">
          {index + 1} of {atoms.length}
          {errorStreak >= 3 && (
            <span className="ml-2 text-amber-400">· streak switched modality</span>
          )}
        </div>
        <button
          onClick={() => next()}
          className="p-2 rounded-lg text-surface-400 hover:text-surface-200"
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
