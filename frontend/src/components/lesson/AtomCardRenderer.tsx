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
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { MarkdownAtomRenderer } from './MarkdownAtomRenderer';
import { estimateReadingTime, formatReadingTime } from '@/lib/readingTime';
import { ImprovedBadge } from './ImprovedBadge';
import { InteractiveSidecar } from './interactives/InteractiveSidecar';
import { parseInteractiveSpec } from './interactives/types';
import {
  ChevronLeft, ChevronRight, Lightbulb, BookOpen, Target,
  AlertTriangle, Sparkles, Eye, Clock, EyeOff,
} from 'lucide-react';

const VISUAL_PREF_KEY = 'vidhya.show_visually';

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
  modality?: 'visual' | 'text' | 'mnemonic' | 'drill';
  tested_by_atom?: string;
  engagement_count?: number;
  last_recall_correct?: boolean | null;
  cohort_error_pct?: number;
  cohort_n_seen?: number;
  /** Strategy callout (E5) — present after engagement enrichment when an atom
   * is mastered or has high cohort error. Server may return; client may also derive. */
  strategy_hint?: {
    exam_emphasis?: 'skip' | 'light' | 'standard' | 'deep';
    exam_weight_pct?: number;
    trap?: string;
  };
  // ── Concept-orchestrator v1 enrichment ────────────────────────────────
  /** ISO timestamp from atom_versions.generated_at. The Improved badge
   * shows when this is newer than the student's last_seen for the atom. */
  improved_since?: string;
  /** Plain-English reason for the Improved tooltip. */
  improvement_reason?: string | null;
  /** True when content is a per-student variant (E5). */
  is_student_override?: boolean;
  /**
   * Set server-side (`src/content/stance-variants.ts:applyStanceVariants`)
   * when the body actually served to this student is a stance-authored
   * alternative. Absent means the base text was served. `applyScaffoldingFade`
   * (T20) reads this to skip fading the 'shaken' variant — see comment there.
   */
  served_stance?: 'shaken' | 'assured';
  /** ISO timestamp from atom_engagements.last_seen for this student.
   * Used by the Improved badge to detect "newer than last view". */
  last_seen_at?: string;
  /** §4.15 multi-modal sidecars. Server-generated GIF (visual_analogy) +
   * TTS narration (intuition). URLs are versioned via /api/lesson/media. */
  media?: {
    gif_url?: string;
    audio_url?: string;
  };
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
  // Neutral surface flash, not indigo: used by micro_exercise and exam_pattern
  // (ATOM_ANIMATION_MAP), neither an AI/tutor surface, so indigo isn't the
  // right semantic here — DESIGN-SYSTEM.md reserves indigo for AI/tutor/study
  // plan only. The rgb triplet mirrors --surface-fill-strong's (120,120,128)
  // as a literal because framer-motion's colour interpolation animates
  // between concrete rgba values, not CSS custom properties (a var() string
  // can't be tweened frame-to-frame), so the token can't be referenced
  // directly here — keep this value in sync with --surface-fill-strong by hand.
  'reveal-highlight':  { initial: { backgroundColor: 'rgba(120,120,128,0.2)' }, animate: { backgroundColor: 'rgba(120,120,128,0)' }, transition: { duration: 1.2 } },
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

/** Splits worked_example prose on `---` step delimiters. */
function splitSteps(content: string): string[] {
  return content
    .split(/\n---\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Scaffolding fade — takes already-de-specced prose (T19a: caller strips the
 * fenced interactive-spec block first, same as DefaultAtomCard, so the raw
 * JSON never leaks into a step box or into the `---` split) and blanks the
 * last min(engagement_count, steps.length-1) steps. First step always stays
 * visible.
 */
function applyScaffoldingFade(atom: ContentAtom, content: string): { steps: string[]; blanked: number } {
  const parts = splitSteps(content);
  const steps = parts.length > 0 ? parts : [content];
  if (atom.atom_type !== 'worked_example' || !atom.scaffold_fade || steps.length <= 1) {
    return { steps, blanked: 0 };
  }
  // T20: the 'shaken' stance variant is authored for a student who is
  // revisiting precisely because the base explanation didn't land — its
  // trailing step is typically the verification / answer-check (see
  // eigenvalues/worked-example-shaken.md). Blanking trailing steps here would
  // hide the answer from the one student who most needs it, inverting the
  // fade's intent (scaffolding should build independence on material that
  // landed, not withhold help on material that didn't). So shaken bodies are
  // always served whole, regardless of engagement_count.
  if (atom.served_stance === 'shaken') {
    return { steps, blanked: 0 };
  }
  const count = atom.engagement_count ?? 0;
  const blanked = Math.min(count, steps.length - 1);
  return { steps, blanked };
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
        <div
          className="px-3 py-2 rounded-lg border text-xs"
          style={{ background: 'rgba(255,159,10,.08)', borderColor: 'rgba(255,159,10,.3)', color: 'var(--orange)' }}
        >
          {Math.round((atom.cohort_error_pct ?? 0) * 100)}% of students at your level miss this on the practice problem.
        </div>
      )}
      <MarkdownAtomRenderer content={atom.content} atomId={atom.id} />
    </div>
  );
}

function WorkedExampleCard({ atom }: { atom: ContentAtom }) {
  // T19a: strip the fenced interactive-spec block BEFORE splitting on `---`
  // step delimiters. Without this, a spec-carrying worked_example (96/97
  // concepts) renders the raw JSON as literal text inside the last step box,
  // and InteractiveSidecar renders the widget a second time below it.
  // Mirrors DefaultAtomCard's handling of the same fenced block.
  const parsed = parseInteractiveSpec(atom.content);
  const prose = parsed.ok ? parsed.body_without_spec : atom.content;
  const { steps, blanked } = applyScaffoldingFade(atom, prose);
  const visibleCount = steps.length - blanked;
  return (
    <div>
      {blanked > 0 && (
        <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          You've seen this {atom.engagement_count} time(s). Try the last {blanked} step{blanked === 1 ? '' : 's'} yourself.
        </div>
      )}
      {/*
        T19b: DESIGN-SYSTEM.md "Layout & density" — one focal block per
        screen, everything else plain text or hairline-separated rows on the
        canvas, not boxes. The outer card (in the main renderer) is already
        that one focal block, so every step here is a plain row separated by
        a hairline top border rather than its own filled/bordered box —
        holds whether a worked example has 2 steps or 8.
      */}
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="py-3 text-sm leading-relaxed"
          style={{
            borderTop: i === 0 ? 'none' : 'var(--hairline) solid var(--separator)',
            color: i < visibleCount ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontStyle: i < visibleCount ? 'normal' : 'italic',
          }}
        >
          {i < visibleCount ? (
            <MarkdownAtomRenderer content={step} atomId={`${atom.id}.step.${i}`} />
          ) : (
            '(work this step out yourself)'
          )}
        </motion.div>
      ))}
    </div>
  );
}

function DefaultAtomCard({ atom }: { atom: ContentAtom }) {
  // Strip the interactive-spec fenced block from the prose — InteractiveSidecar
  // renders the widget; MarkdownAtomRenderer must not also render it as raw JSON.
  const parsed = parseInteractiveSpec(atom.content);
  const prose = parsed.ok ? parsed.body_without_spec : atom.content;
  return <MarkdownAtomRenderer content={prose} atomId={atom.id} />;
}

/**
 * §4.15 multi-modal sidecars: GIF (visual_analogy) + audio narration (intuition).
 * Renders nothing when atom has no media. Honors prefers-reduced-motion for the GIF.
 */
export function MediaSidecar({ atom }: { atom: ContentAtom }) {
  const media = atom.media;
  if (!media || (!media.gif_url && !media.audio_url)) return null;
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <div className="mt-4 space-y-3">
      {media.gif_url && (
        <figure
          className="rounded-lg overflow-hidden border"
          style={{ borderColor: 'var(--separator)', background: 'var(--canvas)' }}
        >
          <img
            src={media.gif_url}
            alt="Animated visualization for this concept"
            loading="lazy"
            className="w-full h-auto"
            style={reduceMotion ? { filter: 'none', animationPlayState: 'paused' } : undefined}
          />
          {reduceMotion && (
            <figcaption className="px-2 py-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Motion reduced — first frame only.
            </figcaption>
          )}
        </figure>
      )}
      {media.audio_url && (
        <div className="flex items-center gap-2">
          <audio
            controls
            preload="none"
            src={media.audio_url}
            aria-label="Read this concept aloud"
            className="w-full h-10"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Strategy callout (E5) — small, blue-tinted card shown above the atom body
 * when an atom is mastered or has high cohort error. Surfaces exam emphasis
 * + the canonical trap so the student walks away with one concrete takeaway.
 */
function StrategyCallout({ hint }: { hint: NonNullable<ContentAtom['strategy_hint']> }) {
  const emphasisLabel: Record<NonNullable<typeof hint.exam_emphasis>, string> = {
    skip: 'Not on this exam',
    light: 'Lightly tested',
    standard: 'Standard weight',
    deep: 'Deep coverage expected',
  };
  return (
    <div
      className="mb-3 px-3 py-2 rounded-lg border text-xs space-y-1"
      // Indigo kept deliberately: "Strategy" surfaces exam-emphasis / study-plan
      // guidance, which DESIGN-SYSTEM.md's colour reservation explicitly names
      // alongside AI/tutor ("AI, tutor, study plan, and nothing else"). Tokenized
      // via --indigo-tint for the fill; the border derives its alpha from the
      // --indigo token itself (via color-mix) rather than a hardcoded rgba.
      style={{ background: 'var(--indigo-tint)', borderColor: 'color-mix(in srgb, var(--indigo) 30%, transparent)', color: 'var(--indigo-ink)' }}
    >
      <div
        className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-semibold"
        style={{ color: 'var(--indigo-ink)' }}
      >
        <Sparkles size={11} />
        <span>Strategy</span>
      </div>
      {hint.exam_emphasis && (
        <div>
          <span style={{ color: 'var(--indigo-ink)' }}>Exam:</span> {emphasisLabel[hint.exam_emphasis]}
          {hint.exam_weight_pct != null && (
            <span style={{ color: 'var(--indigo-ink)', opacity: 0.7 }}> · {Math.round(hint.exam_weight_pct)}% weight</span>
          )}
        </div>
      )}
      {hint.trap && (
        <div>
          <span style={{ color: 'var(--indigo-ink)' }}>Watch:</span> {hint.trap}
        </div>
      )}
    </div>
  );
}

/**
 * Derive a strategy hint client-side from existing enrichment fields when
 * the server hasn't precomputed one. Cheap, deterministic, no extra fetch.
 */
function deriveStrategyHint(atom: ContentAtom): ContentAtom['strategy_hint'] | undefined {
  if (atom.strategy_hint) return atom.strategy_hint;
  const mastered = (atom.engagement_count ?? 0) >= 2 && atom.last_recall_correct === true;
  const trapWorthy = atom.cohort_n_seen != null && atom.cohort_n_seen >= 10 && (atom.cohort_error_pct ?? 0) >= 0.4;
  if (!mastered && !trapWorthy) return undefined;
  const out: NonNullable<ContentAtom['strategy_hint']> = {};
  if (trapWorthy) {
    out.trap = `${Math.round((atom.cohort_error_pct ?? 0) * 100)}% of students at your level miss this.`;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

// ─── Main renderer ────────────────────────────────────────────────────────

export interface AtomCardRendererProps {
  atoms: ContentAtom[];
  conceptId: string;
  studentId: string | null;
  onComplete?: () => void;
  /** Fires with the atom currently on screen. Used by the demo caption layer. */
  onStepChange?: (atom: ContentAtom | null) => void;
}

export function AtomCardRenderer({ atoms: rawAtoms, conceptId, studentId, onComplete, onStepChange }: AtomCardRendererProps) {
  const [index, setIndex] = useState(0);
  const [errorStreak, setErrorStreak] = useState(0);
  const [completedIdx, setCompletedIdx] = useState<Set<number>>(() => new Set());
  const [showVisually, setShowVisually] = useState<boolean>(() => {
    try { return localStorage.getItem(VISUAL_PREF_KEY) === '1'; } catch { return false; }
  });

  // Show-me-visually (B4): when ON, reorder so visual-modality atoms come
  // first, preserving relative order within each group. The original
  // atoms[] is preserved in props — this is a view-time projection only.
  const atoms = useMemo(() => {
    if (!showVisually) return rawAtoms;
    const visual = rawAtoms.filter((a) => a.modality === 'visual' || a.atom_type === 'visual_analogy');
    const rest = rawAtoms.filter((a) => !(a.modality === 'visual' || a.atom_type === 'visual_analogy'));
    return visual.length === 0 ? rawAtoms : [...visual, ...rest];
  }, [rawAtoms, showVisually]);

  const toggleVisual = () => {
    setShowVisually((prev) => {
      const next = !prev;
      try { next ? localStorage.setItem(VISUAL_PREF_KEY, '1') : localStorage.removeItem(VISUAL_PREF_KEY); } catch { /* ignore */ }
      return next;
    });
    setIndex(0); // Jump to the new front so the change is visible.
  };

  const engagement = useEngagement(
    conceptId,
    studentId,
    () => setErrorStreak((s) => s + 1),
    () => setErrorStreak(0),
  );

  const current = atoms[index];

  // Report the atom on screen so the demo caption layer can follow the rail.
  // Optional and side-effect free outside a demo journey.
  useEffect(() => {
    onStepChange?.(atoms[index] ?? null);
  }, [index, atoms, onStepChange]);
  const readingSeconds = useMemo(
    () => (current ? estimateReadingTime(current.content) : 0),
    [current?.id, current?.content],
  );

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
    setCompletedIdx((prev) => {
      const n = new Set(prev);
      n.add(index);
      return n;
    });
    if (index >= atoms.length - 1) {
      onComplete?.();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const prev = () => setIndex((i) => Math.max(0, i - 1));

  // Swipe gestures (E3): left = next, right = prev, down = exit (back nav).
  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    const SWIPE_THRESHOLD = 60;
    const VELOCITY_THRESHOLD = 400;
    const horizontalDominant = Math.abs(offset.x) > Math.abs(offset.y);
    if (horizontalDominant) {
      if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) next();
      else if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) prev();
    } else if (offset.y > SWIPE_THRESHOLD * 1.5 && index === atoms.length - 1) {
      // Down swipe on the last atom signals "I'm done with this concept."
      onComplete?.();
    }
  };

  if (!current) {
    return (
      <div className="text-center text-sm py-8" style={{ color: 'var(--text-tertiary)' }}>No atoms to display.</div>
    );
  }

  const preset = getPreset(current);
  const variants = PRESET_VARIANTS[preset];
  const Icon = ATOM_ICON[current.atom_type];

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Mastery dots + show-me-visually toggle (E2 + B4). */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="w-9" /> {/* spacer to balance the toggle on the right */}
        <div className="flex items-center justify-center gap-1.5">
          {atoms.map((_, i) => {
            const isActive = i === index;
            const isComplete = completedIdx.has(i) || i < index;
            return (
              <motion.div
                key={i}
                layout
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: isActive ? 24 : 6,
                  background: isActive ? 'var(--indigo)' : isComplete ? 'var(--green)' : 'var(--separator)',
                }}
              />
            );
          })}
        </div>
        <button
          onClick={toggleVisual}
          aria-label={showVisually ? 'Show all atoms' : 'Show visual atoms first'}
          aria-pressed={showVisually}
          className="flex items-center justify-center w-9 h-9 rounded-full border transition-colors"
          style={showVisually
            ? { background: 'rgba(52,199,89,.12)', borderColor: 'rgba(52,199,89,.4)', color: 'var(--green-ink)' }
            : { background: 'var(--surface-card)', borderColor: 'var(--separator)', color: 'var(--text-tertiary)' }
          }
          title={showVisually ? 'Visual mode on' : 'Show me visually'}
        >
          {showVisually ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          {...variants}
          exit={{ opacity: 0, y: -10 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="p-5 rounded-xl border touch-pan-y"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--separator)' }}
        >
          <div
            className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider"
            // Not indigo: this eyebrow label is generic card chrome shown for
            // EVERY atom type (hook, intuition, common_traps, ...), not an
            // AI/tutor/study-plan surface, so the reserved accent doesn't apply.
            style={{ color: 'var(--text-secondary)' }}
          >
            <Icon size={14} />
            <span>{ATOM_LABEL[current.atom_type]}</span>
            {current.engagement_count != null && current.engagement_count > 0 && (
              <span style={{ color: 'var(--text-tertiary)' }}>· revisit #{current.engagement_count + 1}</span>
            )}
            <ImprovedBadge
              improvedSince={current.improved_since}
              lastSeenAt={current.last_seen_at}
              reason={current.improvement_reason}
            />
            <span
              className="ml-auto flex items-center gap-1 normal-case tracking-normal"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <Clock size={12} />
              {formatReadingTime(readingSeconds)}
            </span>
          </div>

          {(() => { const sh = deriveStrategyHint(current); return sh ? <StrategyCallout hint={sh} /> : null; })()}

          {current.atom_type === 'worked_example' ? (
            <WorkedExampleCard atom={current} />
          ) : current.atom_type === 'common_traps' ? (
            <CommonTrapsCard atom={current} />
          ) : (
            <DefaultAtomCard atom={current} />
          )}

          <MediaSidecar atom={current} />

          {/* Phase 3 of Curriculum R&D — interactive widgets parsed from
              the atom body's ```interactive-spec``` fenced block. Renders
              nothing when no spec is present. Mirrors the MediaSidecar
              authoring pattern (§4.15). */}
          <InteractiveSidecar body={current.content} />

          {/* Recall buttons for retrieval-style atoms */}
          {(current.atom_type === 'micro_exercise' || current.atom_type === 'retrieval_prompt') && (
            <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--separator)' }}>
              <button
                onClick={() => next(false)}
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--surface-fill)', color: 'var(--text-secondary)' }}
              >
                Not yet
              </button>
              <button
                onClick={() => next(true)}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--indigo)', color: 'var(--text-on-accent)' }}
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
          className="p-2 rounded-lg disabled:opacity-30"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {index + 1} of {atoms.length}
          {errorStreak >= 3 && (
            <span className="ml-2" style={{ color: 'var(--orange)' }}>· streak switched modality</span>
          )}
        </div>
        <button
          onClick={() => next()}
          className="p-2 rounded-lg"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
