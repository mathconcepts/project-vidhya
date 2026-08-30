/**
 * AtomCardRenderer — ContentAtom v2 card stack for LessonPage.
 *
 * Renders an array of ContentAtom into a swipe-through card sequence with:
 *   - ATOM_PRESENTATION_MAP per atom_type (label/icon/animation/figure
 *     placement in one row — declarative, not hardcoded per concept)
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
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

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

// ─── ATOM_PRESENTATION_MAP — one row per atom type, every field consumed ──
//
// Was three parallel tables (ATOM_ANIMATION_MAP / ATOM_ICON / ATOM_LABEL)
// keyed by the same 11 AtomTypes, which is the drift shape this repo has
// been bitten by before (see the v4.25.0 note on four copies of the model-id
// list disagreeing). One row per type now, and every field below is read at
// render time — nothing here is aspirational.
//
// `stage` is the new one, and it is a pedagogical call, not a layout
// preference: it decides whether an atom's figure renders BEFORE its prose
// or after.
//
// The old behaviour was "always after", because MediaSidecar was appended
// below the body for every type. On a `visual_analogy` — an atom type whose
// entire job is to be looked at — that put ~200 words of prose in front of
// the picture the words exist to caption. Apple's product pages, the
// reference the brief named, never do this: the object leads and the copy
// captions it.
//
//   'above' — the figure IS the idea; prose captions it. Hook, intuition,
//             visual_analogy, worked_example, micro_exercise,
//             interleaved_drill, mnemonic.
//   'below' — the prose IS the idea; a figure annotates it afterwards.
//             formal_definition (the words are the content), common_traps
//             and exam_pattern (both are lists of prose), and
//             retrieval_prompt.
//
// retrieval_prompt is 'below' for a reason worth stating: a figure shown
// above a recall prompt cues the answer the prompt is trying to make the
// student retrieve unaided. Sequencing it after the prose is the weakest
// form of that protection — properly the figure belongs INSIDE the
// AnswerReveal disclosure, but media is a server-side sidecar rather than
// part of the markdown body, so it cannot be folded into the disclosure
// without moving media resolution into the content pipeline. Tracked in the
// design doc rather than silently shipped as if solved.

interface AtomPresentation {
  label: string;
  icon: any;
  animation: AnimationPreset;
  stage: 'above' | 'below';
}

const ATOM_PRESENTATION_MAP: Record<AtomType, AtomPresentation> = {
  hook:               { label: 'Hook',           icon: Sparkles,      animation: 'bounce-alert',      stage: 'above' },
  intuition:          { label: 'Intuition',      icon: Lightbulb,     animation: 'fade-in',           stage: 'above' },
  formal_definition:  { label: 'Definition',     icon: BookOpen,      animation: 'slide-up',          stage: 'below' },
  visual_analogy:     { label: 'Visual',         icon: Eye,           animation: 'scale-in',          stage: 'above' },
  worked_example:     { label: 'Worked Example', icon: Target,        animation: 'step-unfold',       stage: 'above' },
  micro_exercise:     { label: 'Quick Check',    icon: Target,        animation: 'reveal-highlight',  stage: 'above' },
  common_traps:       { label: 'Common Traps',   icon: AlertTriangle, animation: 'shake-then-settle', stage: 'below' },
  retrieval_prompt:   { label: 'Recall',         icon: Eye,           animation: 'flip-reveal',       stage: 'below' },
  interleaved_drill:  { label: 'Drill',          icon: Target,        animation: 'slide-up',          stage: 'above' },
  mnemonic:           { label: 'Mnemonic',       icon: Sparkles,      animation: 'scale-in',          stage: 'above' },
  exam_pattern:       { label: 'Exam Pattern',   icon: BookOpen,      animation: 'reveal-highlight',  stage: 'below' },
};

const PRESET_VARIANTS: Record<AnimationPreset, any> = {
  'fade-in':           { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } },
  'slide-up':          { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.35 } },
  // Neutral surface flash, not indigo: used by micro_exercise and exam_pattern
  // (ATOM_PRESENTATION_MAP), neither an AI/tutor surface, so indigo isn't the
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

// ─── Helpers ──────────────────────────────────────────────────────────────

function getPreset(atom: ContentAtom): AnimationPreset {
  return atom.animation_preset ?? ATOM_PRESENTATION_MAP[atom.atom_type].animation;
}

/**
 * ContentAtom's `atom_type` (11 values, rendering-oriented) → the
 * blueprint's `StageKind` (6 values, src/blueprints/types.ts — pedagogical
 * sequencing) used by the intent-driven content restructure's
 * `INTENT_STAGE_SEQUENCES` (T4, see docs/designs/2026-08-25-intent-driven-
 * content-restructure.md §5). No 1:1 mapping exists between the two
 * vocabularies, so this is a best-effort correspondence, not a generated
 * table: `hook`/`intuition`/`visual_analogy` open a concept the way the
 * blueprint's `intuition` stage does; `formal_definition` reads as
 * `formalism`; `micro_exercise`/`retrieval_prompt`/`interleaved_drill` are
 * all retrieval-at-scale, i.e. `practice`; `exam_pattern` is exam-anchored,
 * i.e. `pyq_anchor`. `common_traps` and `mnemonic` have no corresponding
 * stage — they intentionally stay unmapped (see applyIntentStageOrder).
 */
export const ATOM_TYPE_TO_STAGE_KIND: Partial<Record<AtomType, string>> = {
  hook: 'intuition',
  intuition: 'intuition',
  visual_analogy: 'intuition',
  formal_definition: 'formalism',
  worked_example: 'worked_example',
  micro_exercise: 'practice',
  retrieval_prompt: 'practice',
  interleaved_drill: 'practice',
  exam_pattern: 'pyq_anchor',
};

/**
 * Intent-ordered default sequence (T4, decision 6 — DPS + intent-ORDERED
 * sequence first, no chips/router). A stable sort of `atoms` by the rank
 * of each atom's mapped stage-kind within `stageOrder` (the concept's
 * dominant intent's stage sequence, e.g. `['pyq_anchor', 'practice']` for
 * a practice-dominant concept). Atoms whose atom_type has no stage-kind
 * mapping, or whose mapped stage-kind isn't part of THIS concept's
 * stageOrder, are unranked and sort after every ranked atom, keeping
 * their original relative order (an explicit decorate-sort-undecorate
 * pass, so stability never depends on the engine's Array.sort guarantee).
 * `stageOrder` empty/undefined is a no-op — returns `atoms` unchanged, so
 * flag-off and unmapped concepts render byte-identical to today.
 */
export function applyIntentStageOrder(atoms: ContentAtom[], stageOrder?: string[]): ContentAtom[] {
  if (!stageOrder || stageOrder.length === 0) return atoms;
  const rank = new Map<string, number>();
  stageOrder.forEach((stage, i) => {
    if (!rank.has(stage)) rank.set(stage, i);
  });
  const rankOf = (atom: ContentAtom): number => {
    const stageKind = ATOM_TYPE_TO_STAGE_KIND[atom.atom_type];
    return stageKind !== undefined ? rank.get(stageKind) ?? Infinity : Infinity;
  };
  return atoms
    .map((atom, originalIndex) => ({ atom, originalIndex }))
    .sort((a, b) => {
      const diff = rankOf(a.atom) - rankOf(b.atom);
      return diff !== 0 ? diff : a.originalIndex - b.originalIndex;
    })
    .map((entry) => entry.atom);
}

/**
 * Strips a fenced ` ```gif-scene\n{...}\n``` ` block from prose. The block
 * is authoring metadata a GIF was already rendered from server-side (see
 * MediaSidecar below, which renders atom.media.gif_url) — the student is
 * meant to see the rendered animation, never the raw scene JSON as text.
 * Mirrors parseInteractiveSpec's body_without_spec handling of the sibling
 * `interactive-spec` fence and readingTime.ts's fenced-block treatment,
 * which already documents this same "never read as text" intent — this was
 * the one call site that hadn't caught up, so every visual_analogy atom's
 * gif-scene JSON rendered as a literal code block instead of prose.
 */
const GIF_SCENE_FENCE_RE = /```gif-scene\s*[\s\S]*?```/g;
function stripGifSceneBlock(content: string): string {
  return content.replace(GIF_SCENE_FENCE_RE, '').trim();
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
      <MarkdownAtomRenderer content={stripGifSceneBlock(atom.content)} atomId={atom.id} structured />
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
  const prose = stripGifSceneBlock(parsed.ok ? parsed.body_without_spec : atom.content);
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
  const prose = stripGifSceneBlock(parsed.ok ? parsed.body_without_spec : atom.content);
  return <MarkdownAtomRenderer content={prose} atomId={atom.id} structured={atom.atom_type === 'exam_pattern'} />;
}

/**
 * §4.15 multi-modal sidecars: GIF (visual_analogy) + audio narration (intuition).
 * Renders nothing when atom has no media. Honors prefers-reduced-motion for the GIF.
 *
 * Bug #2 (live QA): a `visual_analogy` atom authored with a `gif-scene` block
 * rendered as bare static text on a freshly-woken demo instance, with no
 * indication anything was missing. Root cause (background investigation):
 * the demo boots seed-then-serve fire-and-forget — `demo:seed-media`
 * renders ~70 GIFs to disk in a background subshell while the HTTP server
 * is already accepting traffic, so there's a real window after every cold
 * start where a `visual_analogy` atom's `gif-scene` block is authored but
 * its `.gif` file doesn't exist on disk yet. That's a deploy-ordering
 * tradeoff (blocking first-request on ~70 renders would itself risk
 * Render's own port-detection timeout — see demo/Dockerfile's CMD comment),
 * not something to fix here. What belongs here is honesty: an atom that
 * carries an authored `gif-scene` block but has no `gif_url` yet must say
 * so, never silently render as if no visual was ever intended.
 */
export function MediaSidecar({ atom }: { atom: ContentAtom }) {
  const reduceMotion = usePrefersReducedMotion();
  const media = atom.media;
  const awaitingGif = !media?.gif_url && GIF_SCENE_FENCE_RE.test(atom.content);
  // .test() on a global regex advances lastIndex on its own instance —
  // GIF_SCENE_FENCE_RE is shared with stripGifSceneBlock's .replace() calls
  // elsewhere, so reset it to avoid a stateful false negative on reuse.
  GIF_SCENE_FENCE_RE.lastIndex = 0;
  if (!media && !awaitingGif) return null;
  if (!media?.gif_url && !media?.audio_url && !awaitingGif) return null;
  if (awaitingGif) {
    return (
      <div className="mt-4 space-y-3">
        <figure
          className="rounded-lg overflow-hidden border flex items-center justify-center"
          style={{ borderColor: 'var(--separator)', background: 'var(--surface-fill)', minHeight: 96 }}
        >
          <figcaption className="px-3 py-4 text-center" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-footnote)' }}>
            Animation still generating — check back in a moment.
          </figcaption>
        </figure>
        {media?.audio_url && (
          <audio
            controls
            preload="none"
            src={media.audio_url}
            aria-label="Read this concept aloud"
            className="w-full h-10"
          />
        )}
      </div>
    );
  }
  // Unreachable in practice — every path above that leaves `media` unset
  // already returned. Narrows the type for TS, which can't otherwise see
  // that guarantee across the awaitingGif branch.
  if (!media) return null;
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
  /**
   * External jump request — when this changes to an atom id present in
   * `atoms`, the carousel snaps to that card. Used by the lesson
   * walkthrough rail's Interactive leg ("jump to the first interactive
   * atom"). A null/undefined value, or an id not found in `atoms`, is a
   * no-op — every existing call site that omits this prop is unaffected.
   */
  jumpToAtomId?: string | null;
  /**
   * T4 — intent-ordered default sequence. The mapped concept's dominant
   * intent's stage_order (from frontend/src/generated/intent-slices.gen.ts),
   * only when VIDHYA_INTENT_LANES is on and the concept has a slice. Absent
   * (the default) means no reorder — identical to pre-T4 behavior.
   */
  intentStageOrder?: string[];
}

export function AtomCardRenderer({ atoms: rawAtoms, conceptId, studentId, onComplete, onStepChange, jumpToAtomId, intentStageOrder }: AtomCardRendererProps) {
  const [index, setIndex] = useState(0);
  const [errorStreak, setErrorStreak] = useState(0);
  const [completedIdx, setCompletedIdx] = useState<Set<number>>(() => new Set());
  const [showVisually, setShowVisually] = useState<boolean>(() => {
    try { return localStorage.getItem(VISUAL_PREF_KEY) === '1'; } catch { return false; }
  });

  // T4: intent-ordered default sequence, applied BEFORE show-me-visually
  // below — a stable sort by stage-kind rank, the concept's own catalogue
  // slice deciding the rank order. No-op (returns rawAtoms unchanged) when
  // intentStageOrder is absent, which is the flag-off / unmapped-concept
  // case, so this is a strict no-op addition to the pre-T4 behavior.
  const intentOrderedAtoms = useMemo(
    () => applyIntentStageOrder(rawAtoms, intentStageOrder),
    [rawAtoms, intentStageOrder],
  );

  // Show-me-visually (B4): when ON, reorder so visual-modality atoms come
  // first, preserving relative order within each group. The original
  // atoms[] is preserved in props — this is a view-time projection only.
  const atoms = useMemo(() => {
    if (!showVisually) return intentOrderedAtoms;
    const visual = intentOrderedAtoms.filter((a) => a.modality === 'visual' || a.atom_type === 'visual_analogy');
    const rest = intentOrderedAtoms.filter((a) => !(a.modality === 'visual' || a.atom_type === 'visual_analogy'));
    return visual.length === 0 ? intentOrderedAtoms : [...visual, ...rest];
  }, [intentOrderedAtoms, showVisually]);

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

  // Walkthrough rail's Interactive leg: snap the carousel to a requested
  // atom id. Runs whenever the requested id (or the atom list) changes;
  // re-requesting the same id while already parked there is a no-op via
  // React's normal setState bail-out.
  useEffect(() => {
    if (!jumpToAtomId) return;
    const idx = atoms.findIndex((a) => a.id === jumpToAtomId);
    if (idx >= 0) setIndex(idx);
  }, [jumpToAtomId, atoms]);

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
  const presentation = ATOM_PRESENTATION_MAP[current.atom_type];
  const Icon = presentation.icon;

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
            // common_traps is the one exception, and not a new color: orange
            // is already Clarity's approved warning token (used today only in
            // the cohort-stat callout below, which needs >=10 students of
            // data and so is invisible on any new/low-traffic concept). This
            // makes the AlertTriangle icon's own warning honest at zero data,
            // permanently rather than only when cohort telemetry exists.
            style={{ color: current.atom_type === 'common_traps' ? 'var(--orange)' : 'var(--text-secondary)' }}
          >
            <Icon size={14} />
            <span>{presentation.label}</span>
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

          {/*
            Figure + prose. `.vidhya-atom-stage` is a plain block on a phone
            (the figure simply leads or trails per `stage`) and becomes a
            two-column grid at >=720px, where the figure sits beside the prose
            it explains rather than a screen away from it — the literal
            "explanation and visual side by side" that a 390px viewport
            cannot honestly provide. The figure column is `position: sticky`,
            so on a long atom it stays put while the prose scrolls past it.

            `data-stage` drives the source order via `order` in CSS, so the
            DOM order stays prose-then-figure for a screen reader (the prose
            is the accessible content; the figure carries an alt string) while
            the visual order follows the pedagogy.
          */}
          <div className="vidhya-atom-stage" data-stage={presentation.stage}>
            <div className="vidhya-atom-stage__prose">
              {current.atom_type === 'worked_example' ? (
                <WorkedExampleCard atom={current} />
              ) : current.atom_type === 'common_traps' ? (
                <CommonTrapsCard atom={current} />
              ) : (
                <DefaultAtomCard atom={current} />
              )}
            </div>
            <div className="vidhya-atom-stage__figure">
              <MediaSidecar atom={current} />
            </div>
          </div>

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
                // Green, not indigo: this confirms the student got the
                // answer right — mastery/correctness, not an AI/tutor
                // surface. DESIGN-SYSTEM.md reserves indigo for AI, tutor,
                // and study plan only; green is mastery/correct/primary
                // action, which is exactly what this button means.
                style={{ background: 'var(--green)', color: 'var(--text-on-accent)' }}
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
