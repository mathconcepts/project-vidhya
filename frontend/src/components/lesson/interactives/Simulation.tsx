/**
 * Simulation.tsx
 *
 * Parameterized animation. Plays a (x(t), y(t)) trace over a small SVG
 * canvas; play/pause via a single button. Honors prefers-reduced-motion
 * (renders the static endpoint instead of animating).
 *
 * No D3 / canvas — plain SVG path with a moving circle. Light and good
 * enough for v1 of "watch the eigenvector trace stay parallel".
 *
 * Extended for "resonance beats" (plan §W1, 2026-08-30): a scene whose
 * `narration_steps` are present is no longer a passive figure with a
 * caption underneath — it autoplays into the first beat on mount, the
 * caption is the primary sentence of the experience (17px, through the
 * markdown pipeline), a beat can carry a per-scene "trap" that reveals a
 * dashed ghost path for the wrong turn, and a segmented beat bar lets the
 * student seek/step through the moments. See the plan's "design contract"
 * for the pixel-level decisions this file implements.
 *
 * Student-paced beats (/investigate, 2026-09-03): a scene no longer plays
 * straight through every beat on one fixed timer — arrival at EACH beat
 * holds playback (indefinitely, not a timed pause) until the student taps
 * Continue. "Grasping" isn't uniform across students or across beats of
 * the same scene, so the pace is now a tap, not a clock; the arc WITHIN a
 * beat still autoplays (the motion is still the delight), only the
 * transition INTO the next beat waits for the reader.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, ChevronRight } from 'lucide-react';
import { evalFormula, type SimulationSpec, type LinearMapSceneSpec, type Mat2 } from './types';
import { MarkdownAtomRenderer } from '../MarkdownAtomRenderer';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { EASE_STANDARD, DUR_INSTANT_S, framerDuration } from '@/lib/motion-tokens';

const SVG_W = 320;
const SVG_H = 200;
const PADDING = 16;

type Stance = 'shaken' | 'assured' | undefined;
type Beat = NonNullable<SimulationSpec['narration_steps']>[number];

interface Props {
  spec: SimulationSpec;
  /** Stable id used for per-beat markdown memoization keys. Defaults to a
   *  title slug when the caller (today: `InteractiveSidecar`) doesn't have
   *  a real atom id to thread through — W2 passes the real one. */
  atomId?: string;
  /** The atom's served stance, threaded down for per-beat text resolution.
   *  Undefined → every beat renders its base `text`. */
  servedStance?: 'shaken' | 'assured';
}

// ============================================================================
// Pure helpers — exported for unit tests, no timers/DOM involved.
// ============================================================================

/**
 * Per-stance beat text: the matching override when present, else the base
 * `text` (design contract — base is the fallback for every register,
 * including a stale/expired stance pin, so register never mixes mid-render).
 */
export function resolveBeatText(step: Beat, servedStance: Stance): string {
  if (servedStance === 'shaken' && step.text_shaken) return step.text_shaken;
  if (servedStance === 'assured' && step.text_assured) return step.text_assured;
  return step.text;
}

/**
 * The narration beat active at a given progress: the LAST step whose
 * `at_progress` is <= progress, so the sentence a student reads always
 * describes what the trace has ALREADY drawn, never something ahead of
 * it. Steps are sorted defensively — authors write them in reading order,
 * but nothing enforces that at the content layer.
 *
 * Kept as the original text-returning shape for backward compatibility;
 * the component itself now works off `activeBeatIndex` (index, not text)
 * so `AnimatePresence` can key on position rather than resolved content —
 * two beats with identical text must not collide.
 */
export function activeNarrationStep(
  steps: SimulationSpec['narration_steps'],
  progress: number,
): string | null {
  if (!steps || steps.length === 0) return null;
  const sorted = [...steps].sort((a, b) => a.at_progress - b.at_progress);
  const idx = activeBeatIndex(sorted, progress);
  return idx === null ? null : sorted[idx].text;
}

/**
 * Index (into an ALREADY at_progress-sorted array) of the active beat at a
 * given progress — the same "last beat whose at_progress <= progress" rule
 * as `activeNarrationStep`, but returning position instead of content so
 * duplicate resolved texts across beats never collide as React keys.
 */
export function activeBeatIndex(
  sortedSteps: SimulationSpec['narration_steps'],
  progress: number,
): number | null {
  if (!sortedSteps || sortedSteps.length === 0) return null;
  let active = 0;
  for (let i = 0; i < sortedSteps.length; i++) {
    if (sortedSteps[i].at_progress <= progress) active = i;
    else break;
  }
  return active;
}

/**
 * Decides whether NATURAL playback crossing `trapAtProgress` between two
 * successive ticks should trigger the trap hold. Pure — no refs, no
 * clock — so the boundary rules are unit-testable without fake timers:
 *
 *   - a seek is never a hold trigger, even landing exactly on the trap's
 *     at_progress (the strict `<` on `prevProgress` already excludes a
 *     seek that lands ON the point from counting as a "crossing" on the
 *     very next natural tick, but `isSeek` makes the rule explicit rather
 *     than relying on that as an accident of the inequality)
 *   - reduced motion never holds
 *   - the hold fires at most once per mount (`alreadyHeld`)
 */
export function shouldHoldForTrap(params: {
  prevProgress: number;
  nextProgress: number;
  trapAtProgress: number | null;
  isSeek: boolean;
  reducedMotion: boolean;
  alreadyHeld: boolean;
}): boolean {
  const { prevProgress, nextProgress, trapAtProgress, isSeek, reducedMotion, alreadyHeld } = params;
  if (trapAtProgress === null || isSeek || reducedMotion || alreadyHeld) return false;
  return prevProgress < trapAtProgress && nextProgress >= trapAtProgress;
}

/**
 * /investigate (2026-09-03, live-QA on the hook card): a fixed-duration
 * autoplay races through every beat at one author-time pace regardless of
 * how long a given student needs to actually read one — "grasping" isn't
 * uniform across students OR across beats of the same scene. Generalizes
 * the trap's own crossing-detection (`shouldHoldForTrap`, kept as-is and
 * still separately tested — this is the same boundary math, just checked
 * against ANY beat's `at_progress`, not only the trap's) so EVERY beat now
 * holds when natural playback arrives at it. Unlike the trap's old
 * `DUR_SLOW_S` timed hold, this hold is indefinite — pacing becomes
 * genuinely student-paced (tap Continue when ready) rather than a longer
 * fixed wait. A seek never holds (design contract item 10, unchanged);
 * reduced motion never holds (nothing is playing to interrupt).
 */
export function shouldHoldAtBeatArrival(params: {
  prevProgress: number;
  nextProgress: number;
  beatAtProgress: number;
  isSeek: boolean;
  reducedMotion: boolean;
}): boolean {
  const { prevProgress, nextProgress, beatAtProgress, isSeek, reducedMotion } = params;
  if (isSeek || reducedMotion) return false;
  return prevProgress < beatAtProgress && nextProgress >= beatAtProgress;
}

/**
 * Autoplay pace multiplier by served stance (/investigate, 2026-09-03:
 * "hook transition is faster — needs to adapt to different students'
 * grasping and attention level"). Root cause: `duration_sec` was a single
 * author-time constant applied identically to every student, even though
 * `servedStance` was already threaded into this component and used for
 * per-beat TEXT (`resolveBeatText`) — the pacing never got the same
 * treatment. Mirrors the philosophy `framingInstructions()`
 * (`src/sessions/learner-framing.ts`) already codifies for register: a
 * shaken student gets a smaller, slower first step and no rush; an assured
 * student gets the sharper, faster form because padding wastes their time.
 * `steady`/undefined plays at the authored pace, unchanged. A value > 1
 * SLOWS playback (more wall-clock time per beat); < 1 speeds it up.
 */
export const STANCE_PACE_MULTIPLIER: Record<'shaken' | 'assured', number> = {
  shaken: 1.35,
  assured: 0.75,
};

export function paceMultiplierForStance(stance: Stance): number {
  if (stance === 'shaken' || stance === 'assured') return STANCE_PACE_MULTIPLIER[stance];
  return 1;
}

/**
 * Fill fraction [0,1] for beat `index`'s segment of the beat bar, given the
 * current progress. A segment spans [this beat's at_progress, the next
 * beat's at_progress, or 1 for the last beat) — fully filled once progress
 * passes it, empty before it, proportional while it is the active beat.
 */
export function beatSegmentFill(sortedSteps: SimulationSpec['narration_steps'], progress: number, index: number): number {
  if (!sortedSteps || sortedSteps.length === 0 || !sortedSteps[index]) return 0;
  const start = sortedSteps[index].at_progress;
  const end = index + 1 < sortedSteps.length ? sortedSteps[index + 1].at_progress : 1;
  if (end <= start) return progress >= start ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

// ---------------------------------------------------------------------------
// Linear-map scene helpers (pure, exported for tests)
// ---------------------------------------------------------------------------

/** The morph holds still while beat 1 introduces the arrows… */
export const MORPH_START_PROGRESS = 0.15;
/** …and settles before the trap/payoff beats, so they land on a still frame. */
export const MORPH_END_PROGRESS = 0.72;

/**
 * Playback progress → morph parameter s ∈ [0, 1]: flat until
 * MORPH_START_PROGRESS, smoothstep to 1 by MORPH_END_PROGRESS, flat after.
 * Smoothstep (not linear) so arrows visibly accelerate then settle — the
 * "push" reads as a push, not a conveyor belt.
 */
export function morphFraction(progress: number): number {
  const raw = (progress - MORPH_START_PROGRESS) / (MORPH_END_PROGRESS - MORPH_START_PROGRESS);
  const c = Math.min(1, Math.max(0, raw));
  return c * c * (3 - 2 * c);
}

/**
 * M(s)·v for M(s) = I + s·(A − I): identity at s=0, the full matrix at s=1.
 * Every unit vector rides a straight chord from v to A·v; eigen-directions'
 * chords lie ON their own line, which is exactly the visual claim the scene
 * makes ("these arrows never turn").
 */
export function applyLerpedMat2(matrix: Mat2, v: [number, number], s: number): [number, number] {
  const a = 1 + s * (matrix[0][0] - 1);
  const b = s * matrix[0][1];
  const c = s * matrix[1][0];
  const d = 1 + s * (matrix[1][1] - 1);
  return [a * v[0] + b * v[1], c * v[0] + d * v[1]];
}

/**
 * Equal-scale view box for a linear-map scene. Angles are the scene's whole
 * argument ("this arrow did not turn"), so x and y MUST share one scale —
 * the generic auto-fit stretches axes independently and would tilt every
 * angle it draws. Fits the unit circle and its image under the matrix (an
 * intermediate M(s)·v is a convex combination of v and A·v, so it can never
 * exceed the endpoints' extent), padded, at the SVG's inner aspect ratio.
 */
export function linearMapViewBox(matrix: Mat2): NonNullable<SimulationSpec['view_box']> {
  let maxX = 1;
  let maxY = 1;
  const n = 64;
  for (let i = 0; i < n; i++) {
    const th = (2 * Math.PI * i) / n;
    const [x, y] = applyLerpedMat2(matrix, [Math.cos(th), Math.sin(th)], 1);
    if (Math.abs(x) > maxX) maxX = Math.abs(x);
    if (Math.abs(y) > maxY) maxY = Math.abs(y);
  }
  const innerAspect = (SVG_W - PADDING * 2) / (SVG_H - PADDING * 2);
  const halfH = Math.max(maxY * 1.14, (maxX * 1.14) / innerAspect);
  const halfW = halfH * innerAspect;
  return { x_min: -halfW, x_max: halfW, y_min: -halfH, y_max: halfH };
}

/** Corners of the unit square, in matrix-application order (adjacent
 *  corners, so the polygon traces the square's boundary, not a diagonal). */
const UNIT_SQUARE_CORNERS: Array<[number, number]> = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

/**
 * Formats a number to at most `sigFigs` significant digits, trimming
 * trailing zeros (and a bare trailing decimal point) — e.g. 3 → "3",
 * 3.6180339887 → "3.618". Used only for the area label, which is computed
 * from the matrix at render time (never authored) so it cannot lie.
 */
export function formatSignificant(value: number, sigFigs = 4): string {
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return '0';
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const decimals = Math.max(0, sigFigs - 1 - magnitude);
  let s = value.toFixed(decimals);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

/** Strips the light markdown beats use (bold/italic/inline math/code) down
 *  to plain words for an aria-label — assistive tech reads the sentence,
 *  not the syntax. */
export function stripMarkdownForAria(text: string): string {
  return text
    .replace(/\$\$?([^$]*)\$\$?/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .trim();
}

export function Simulation({ spec, atomId, servedStance }: Props) {
  const linearMap = spec.linear_map ?? null;
  const samples = useMemo(
    () => (linearMap ? { points: [], error: null } : sampleCurve(spec)),
    [spec, linearMap],
  );
  const viewBox = useMemo(
    () => spec.view_box ?? (linearMap ? linearMapViewBox(linearMap.matrix) : autoViewBox(samples.points)),
    [spec.view_box, linearMap, samples.points],
  );
  const projector = useMemo(() => makeProjector(viewBox), [viewBox]);
  const ghostPoints = useMemo(() => (linearMap ? null : sampleGhost(spec)), [spec, linearMap]);

  const reducedMotion = usePrefersReducedMotion();

  const sortedSteps = useMemo(
    () => (spec.narration_steps ? [...spec.narration_steps].sort((a, b) => a.at_progress - b.at_progress) : []),
    [spec.narration_steps],
  );
  const hasBeats = sortedSteps.length > 0;
  const trapStep = useMemo(() => sortedSteps.find((s) => s.trap) ?? null, [sortedSteps]);

  // Design contract item 1: a scene WITH beats autoplays into its first
  // beat on mount (progress=0, playing=true), then holds there for the
  // student to tap Continue once that beat's own arc finishes — see the
  // tick loop below; without beats, today's tap-to-play stays (progress=1,
  // playing=false — a finished static trace). Reduced motion never
  // autoplays either way. Computed once in the initializer so there is no
  // flash of the wrong state — `usePrefersReducedMotion` resolves its own
  // initial value synchronously the same way.
  const [playing, setPlaying] = useState(() => hasBeats && !reducedMotion);
  const [progress, setProgress] = useState(() => (hasBeats && !reducedMotion ? 0 : 1));
  // Sticky once true — "Once the trap beat is reached (by play or seek),
  // the trap row ... PERSISTS for the rest of playback" (reset clears it).
  const [trapRevealed, setTrapRevealed] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  // Mirror of `progress` so the tick loop never mutates refs inside a
  // setProgress functional updater — StrictMode double-invokes updaters, and
  // an impure one silently defeated the once-per-mount trap hold in dev.
  const progressRef = useRef(hasBeats && !reducedMotion ? 0 : 1);

  // Beats-only: a linear (non-beat) scene has no stance-driven register
  // difference to begin with, so its pace stays exactly as authored.
  const duration = (spec.duration_sec ?? 4) * 1000 * (hasBeats ? paceMultiplierForStance(servedStance) : 1);

  function applyProgress(v: number) {
    progressRef.current = v;
    setProgress(v);
  }

  // Tick loop. Holds indefinitely (playing → false) the first time playback
  // arrives at any beat boundary ahead of the current progress — the student
  // taps Continue to advance, rather than a fixed-duration timer deciding
  // for them. Progress is monotonic during normal playback (only reset()
  // sets it back to 0), so a given boundary can only be crossed once per
  // run — no extra "already held" bookkeeping needed the way the trap's old
  // timed hold required.
  useEffect(() => {
    if (!playing) return;
    function tick(now: number) {
      const dt = lastTickRef.current ? now - lastTickRef.current : 0;
      lastTickRef.current = now;

      // All side effects live in the tick body, not a setProgress updater —
      // updaters must stay pure (StrictMode double-invokes them).
      const p = progressRef.current;
      const next = p + dt / duration;
      const upcomingBeat = sortedSteps.find((s) => s.at_progress > p);
      if (
        upcomingBeat &&
        shouldHoldAtBeatArrival({
          prevProgress: p,
          nextProgress: next,
          beatAtProgress: upcomingBeat.at_progress,
          isSeek: false,
          reducedMotion,
        })
      ) {
        applyProgress(upcomingBeat.at_progress);
        setPlaying(false);
        return;
      } else if (next >= 1) {
        applyProgress(1);
        setPlaying(false);
      } else {
        applyProgress(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    lastTickRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, duration, sortedSteps, reducedMotion]);

  // Trap reveal is a function of progress alone — fires from natural
  // playback OR a seek, and (being state, not a derived value) stays true
  // once set even if the student seeks back before the trap afterward.
  useEffect(() => {
    if (trapStep && progress >= trapStep.at_progress) setTrapRevealed(true);
  }, [progress, trapStep]);

  function play() {
    if (progressRef.current >= 1) applyProgress(0);
    setPlaying(true);
  }
  function reset() {
    setPlaying(false);
    applyProgress(reducedMotion ? 1 : 0);
    setTrapRevealed(false);
  }
  /** Seek — design contract item 10: playing stays playing, paused stays
   *  paused; never triggers a beat hold (that only fires from the tick
   *  loop's own natural-crossing check above). */
  function seekTo(atProgress: number) {
    lastTickRef.current = 0;
    applyProgress(atProgress);
  }

  /**
   * Manual-scrub input (/investigate, 2026-09-01: "manual progression/
   * manual slider as an option for student to resonate better"). Autoplay
   * is a fixed pace picked for the average viewer; a student who wants to
   * sit on one moment, re-drag past a confusing beat, or move faster than
   * the authored duration has no way to do that with play/pause alone —
   * BeatBar (above) only jumps beat-to-beat. This is continuous, so it
   * pauses playback on grab (design contract item 10's "seek never fights
   * the tick loop" rule, extended: a drag IS a seek, held for its duration).
   */
  function scrub(atProgress: number) {
    setPlaying(false);
    seekTo(atProgress);
  }

  if (samples.error) {
    return (
      <div
        className="rounded-xl border p-3 text-xs"
        style={{ borderColor: 'rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', color: 'var(--red)' }}
      >
        Simulation error: {samples.error}
      </div>
    );
  }

  const effectiveProgress = reducedMotion ? 1 : progress;
  const cutoff = Math.max(1, Math.round(samples.points.length * effectiveProgress));
  const visiblePoints = samples.points.slice(0, cutoff);
  const head = visiblePoints[visiblePoints.length - 1];
  const activeIdx = hasBeats ? activeBeatIndex(sortedSteps, effectiveProgress) : null;
  const segments = linearMap
    ? []
    : buildTraceSegments(samples.points, projector, sortedSteps, effectiveProgress, activeIdx);
  const resolvedId = atomId ?? spec.title;
  const showStoryboard = hasBeats && reducedMotion;
  const showLiveBeatUI = hasBeats && !reducedMotion;
  // Linear-map payoff styling turns on the moment the first emphasized beat
  // is reached — that beat IS the reveal ("these two never turn"). A scene
  // with no emphasized beat has no reveal moment, so the styling is on from
  // the start. Derived from progress, so seeking back re-hides it — the
  // reveal replays honestly rather than spoiling a rewind.
  const emphasizeBeatAt = useMemo(() => {
    const step = sortedSteps.find((s) => s.emphasize);
    return step ? step.at_progress : null;
  }, [sortedSteps]);
  const eigenRevealed = emphasizeBeatAt === null || effectiveProgress >= emphasizeBeatAt;
  const emphasizeActive = activeIdx !== null && sortedSteps[activeIdx]?.emphasize === true;

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: 'var(--separator)', background: 'var(--surface-fill)' }}
    >
      {!hasBeats && (
        <header className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{spec.title}</h4>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => (playing ? setPlaying(false) : play())}
              disabled={reducedMotion}
              className="p-1.5 rounded-md border disabled:opacity-50"
              style={{ background: 'var(--surface-card)', borderColor: 'var(--separator)', color: 'var(--text-secondary)' }}
              aria-label={playing ? 'Pause simulation' : 'Play simulation'}
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={reducedMotion}
              className="p-1.5 rounded-md border disabled:opacity-50"
              style={{ background: 'var(--surface-card)', borderColor: 'var(--separator)', color: 'var(--text-secondary)' }}
              aria-label="Reset simulation"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </header>
      )}

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        className="rounded-md border"
        style={{ background: 'var(--surface-fill)', borderColor: 'var(--separator)' }}
        preserveAspectRatio="xMidYMid meet"
        aria-label={hasBeats ? spec.title : `Animated trace: ${spec.title}`}
      >
        <Axes viewBox={viewBox} projector={projector} />
        {linearMap && (
          <LinearMapScene
            lm={linearMap}
            projector={projector}
            viewBox={viewBox}
            progress={effectiveProgress}
            eigenRevealed={eigenRevealed}
            emphasizeActive={emphasizeActive}
            trapRevealed={trapRevealed}
          />
        )}
        {trapRevealed && ghostPoints && (
          <path
            d={pathD(ghostPoints, projector)}
            stroke="var(--grey-6)"
            strokeWidth={2}
            strokeDasharray="4 4"
            fill="none"
          />
        )}
        {segments.map((seg) => (
          <path key={seg.key} d={seg.d} stroke="var(--ink)" strokeWidth={seg.strokeWidth} fill="none" />
        ))}
        {head && (
          <circle
            cx={projector(head.x, head.y)[0]}
            cy={projector(head.x, head.y)[1]}
            r={4}
            fill="var(--green)"
          />
        )}
      </svg>

      {/* Controls sit directly under the SVG, before any text — a
          /design-review finding (2026-09-02): "the control must be near
          the image." The beat bar + play/pause/reset + scrub slider used
          to be pushed down below the narration caption and the trap row,
          so a student's hand had to travel past a paragraph of text to
          reach the thing that changes what the image shows. Moving them
          up makes control-then-image-then-text one visual unit instead of
          a scrubber stranded at the bottom of the card. */}
      {!hasBeats && !reducedMotion && (
        <ScrubSlider progress={effectiveProgress} onScrub={scrub} label="Drag to move through the trace manually" />
      )}

      {showLiveBeatUI && (
        <div className="flex items-center gap-2">
          {sortedSteps.length > 1 && (
            <BeatBar sortedSteps={sortedSteps} progress={effectiveProgress} servedStance={servedStance} onSeek={seekTo} />
          )}
          <div className="flex items-center flex-shrink-0">
            {/* 44px tap zones (design-system floor) around visually compact controls */}
            <button
              type="button"
              onClick={() => (playing ? setPlaying(false) : play())}
              className="flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label={playing ? 'Pause simulation' : 'Play simulation'}
            >
              <span
                className="p-1.5 rounded-md border inline-flex"
                style={{ background: 'var(--surface-card)', borderColor: 'var(--separator)', color: 'var(--text-secondary)' }}
              >
                {playing ? <Pause size={12} /> : <Play size={12} />}
              </span>
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="Reset simulation"
            >
              <span
                className="p-1.5 rounded-md border inline-flex"
                style={{ background: 'var(--surface-card)', borderColor: 'var(--separator)', color: 'var(--text-secondary)' }}
              >
                <RotateCcw size={12} />
              </span>
            </button>
          </div>
        </div>
      )}

      {showLiveBeatUI && !reducedMotion && (
        <ScrubSlider progress={effectiveProgress} onScrub={scrub} label="Drag to move through the scene at your own pace" />
      )}

      {!hasBeats && reducedMotion && (
        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          Reduced-motion enabled — showing the final trace instead of animation.
        </p>
      )}

      {!hasBeats && spec.caption && (
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{spec.caption}</p>
      )}

      {showStoryboard && (
        <ReducedMotionStoryboard atomId={resolvedId} spec={spec} sortedSteps={sortedSteps} servedStance={servedStance} />
      )}

      {/* Caption text below the controls, not above them — the sentence
          describes what the trace HAS drawn (activeBeatIndex's "last beat
          whose at_progress <= progress" rule), so it reads as a live
          caption for the control the student just touched, in sync with
          the transition, rather than a paragraph to read before touching
          anything. */}
      {showLiveBeatUI && (
        <div aria-live="polite">
          {/* No `mode="wait"` — matches GuidedWalkthrough's AnimatePresence
              convention. `mode="wait"` would hold the OLD beat mounted
              until its exit transition finishes before mounting the new
              one, so a seek's DOM update would lag its own animation
              rather than reflecting the state change immediately. */}
          <AnimatePresence initial={false}>
            <motion.div
              key={activeIdx ?? 'none'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: framerDuration(DUR_INSTANT_S, reducedMotion), ease: EASE_STANDARD }}
            >
              <MarkdownAtomRenderer
                atomId={`${resolvedId}::beat-${activeIdx ?? 0}`}
                content={activeIdx != null ? resolveBeatText(sortedSteps[activeIdx], servedStance) : ''}
                className="vidhya-atom-body--beat-caption"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {showLiveBeatUI && trapRevealed && trapStep && <TrapRow trap={trapStep.trap!} atomId={`${resolvedId}::trap`} />}

      {/* Primary "keep going" action once a beat holds — reuses
          GuidedWalkthrough's own advance-button convention (same colors,
          44px height, trailing chevron) rather than inventing a second
          button language for the same "tap when you're ready" gesture
          elsewhere in the app. Only the caption's own icon Play/Pause stays
          reversible mid-scene; this one is the unmissable next step. */}
      {showLiveBeatUI && !playing && progress < 1 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={play}
            className="inline-flex items-center justify-center gap-1.5 rounded-md font-medium"
            style={{
              background: 'var(--surface-fill-strong)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-body)',
              minHeight: 44,
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            Continue
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Continuous manual-progression control — a plain HTML range input, not a
 * custom draggable (native inputs come with keyboard support, touch
 * dragging, and a11y semantics for free, and DESIGN-SYSTEM.md's motion
 * budget doesn't cover a bespoke slider). Ink accent, not indigo/green:
 * scrubbing a scene is neither an AI/tutor action nor a mastery signal.
 * Rendered only when NOT reduced-motion — under reduced motion the scene is
 * already a static final frame (or the full storyboard), so there is
 * nothing to scrub through.
 */
function ScrubSlider({
  progress,
  onScrub,
  label,
}: {
  progress: number;
  onScrub: (atProgress: number) => void;
  label: string;
}) {
  // No visible caption row here (matches the play/pause buttons above,
  // which are icon-only with an aria-label, not a labeled row) — the
  // no-beats path has a locked contract that it renders no <p> at all when
  // there's nothing to caption (Simulation.test.tsx: "renders no caption/
  // narration row when neither is present"). The label is still real for
  // assistive tech via aria-label on the input itself.
  //
  // step=0.02 (red-team finding, /ship 2026-09-01): 0.001 made a native
  // range input's arrow-key increment — which IS the step value — nearly
  // useless for a keyboard-only user (~1000 presses to traverse a scene).
  // 0.02 is still fine-grained for pointer dragging (50 steps across the
  // full duration reads as smooth) while keeping keyboard scrubbing
  // actually usable (~50 presses end to end, Home/End jump the extremes).
  return (
    <input
      type="range"
      min={0}
      max={1}
      step={0.02}
      value={progress}
      onChange={(e) => onScrub(parseFloat(e.target.value))}
      aria-label={label}
      className="w-full"
      style={{ accentColor: 'var(--ink)' }}
    />
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * The morphing-vector-field figure (wow-pass): `num_vectors` unit arrows,
 * every one pushed through M(s) = I + s·(A − I) as playback runs, while the
 * unit circle deforms into the matrix's image ellipse. Arrows collinear
 * with a declared eigen-direction are the payoff: they visibly refuse to
 * turn, go accent-green once the reveal beat is reached (heavier while that
 * beat is active — the emphasize contract), and pick up a "×λ" label. When
 * the trap beat reveals, dashed grey arrows show where the mistaken reading
 * (`ghost_matrix`) would have put them.
 */
/**
 * Directions the ghost arrows are drawn along. A scene that declares eigen
 * directions draws its ghosts there (the mistaken prediction for the very
 * arrows the reveal highlighted); a scene with none (matrix-operations'
 * AB-vs-BA, matrix-inverse's det-0 collapse) gets the four cardinal unit
 * directions — enough dashed arrows to read as "where things would land"
 * without burying the solid figure. Exported for tests.
 */
export function ghostArrowDirs(
  eigen: Array<{ u: [number, number]; value: number }>,
): Array<{ u: [number, number] }> {
  if (eigen.length > 0) return eigen;
  return [
    { u: [1, 0] },
    { u: [0, 1] },
    { u: [-1, 0] },
    { u: [0, -1] },
  ];
}

function LinearMapScene({
  lm,
  projector,
  viewBox,
  progress,
  eigenRevealed,
  emphasizeActive,
  trapRevealed,
}: {
  lm: LinearMapSceneSpec;
  projector: (x: number, y: number) => [number, number];
  viewBox: NonNullable<SimulationSpec['view_box']>;
  progress: number;
  eigenRevealed: boolean;
  emphasizeActive: boolean;
  trapRevealed: boolean;
}) {
  const s = morphFraction(progress);
  const n = lm.num_vectors ?? 16;
  const eigen = (lm.eigen ?? []).map((e) => {
    const norm = Math.hypot(e.dir[0], e.dir[1]);
    return { u: [e.dir[0] / norm, e.dir[1] / norm] as [number, number], value: e.value };
  });
  const origin = projector(0, 0);

  const circlePath = (transform: (v: [number, number]) => [number, number], samplesN = 64): string => {
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= samplesN; i++) {
      const th = (2 * Math.PI * i) / samplesN;
      const [x, y] = transform([Math.cos(th), Math.sin(th)]);
      pts.push({ x, y });
    }
    return pathD(pts, projector);
  };

  const arrows: Array<{ tip: [number, number]; eigenIdx: number }> = [];
  for (let i = 0; i < n; i++) {
    const th = (2 * Math.PI * i) / n;
    const u: [number, number] = [Math.cos(th), Math.sin(th)];
    const eigenIdx = eigen.findIndex((e) => Math.abs(u[0] * e.u[1] - u[1] * e.u[0]) < 1e-3);
    arrows.push({ tip: applyLerpedMat2(lm.matrix, u, s), eigenIdx });
  }

  // Full-span rails through the origin along each eigen line, clipped to the
  // view box — the "tracks" the stubborn arrows are locked to.
  const rails = eigen.map((e) => {
    const sx = e.u[0] === 0 ? Infinity : Math.abs(viewBox.x_max / e.u[0]);
    const sy = e.u[1] === 0 ? Infinity : Math.abs(viewBox.y_max / e.u[1]);
    const span = Math.min(sx, sy) * 0.97;
    return {
      a: projector(-span * e.u[0], -span * e.u[1]),
      b: projector(span * e.u[0], span * e.u[1]),
    };
  });

  return (
    <g>
      {eigenRevealed &&
        rails.map((r, i) => (
          <line
            key={`rail-${i}`}
            x1={r.a[0]} y1={r.a[1]} x2={r.b[0]} y2={r.b[1]}
            stroke="var(--separator)" strokeWidth={1} strokeDasharray="2 3"
          />
        ))}
      {/* Where the arrows started: the unit circle, kept as a dotted reference. */}
      <path d={circlePath((v) => v)} stroke="var(--separator)" strokeWidth={1} strokeDasharray="2 2" fill="none" />
      {/* Where the tips are now: the circle mid-deformation into A's ellipse. */}
      <path
        d={circlePath((v) => applyLerpedMat2(lm.matrix, v, s))}
        stroke="var(--grey-6)" strokeWidth={1.25} fill="none"
      />
      {/* The mistaken reading's full image: where the unit circle WOULD land
          under ghost_matrix, dashed grey. This is the ghost's one guaranteed
          rendering — per-eigen dashed arrows below only exist when the scene
          declares eigen directions, and a scene like matrix-operations
          (AB vs BA) has none, so without this outline its trap would reveal
          nothing at all. */}
      {trapRevealed && lm.ghost_matrix && (
        <path
          d={circlePath((v) => applyLerpedMat2(lm.ghost_matrix!, v, 1))}
          stroke="var(--grey-6)" strokeWidth={1.5} strokeDasharray="4 4" fill="none"
        />
      )}
      {lm.unit_square && (
        <>
          {/* The original unit square — a dotted separator-colored reference. */}
          <polygon
            points={UNIT_SQUARE_CORNERS.map(([x, y]) => projector(x, y).join(',')).join(' ')}
            fill="none"
            stroke="var(--separator)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
          {/* Its image under M(s) — the area-multiplier payoff, green-as-payoff. */}
          <polygon
            points={UNIT_SQUARE_CORNERS.map(([x, y]) => {
              const [ix, iy] = applyLerpedMat2(lm.matrix, [x, y], s);
              return projector(ix, iy).join(',');
            }).join(' ')}
            fill="var(--green)"
            fillOpacity={0.1}
            stroke="var(--ink)"
            strokeWidth={1.5}
          />
        </>
      )}
      {lm.unit_square && lm.area_label && eigenRevealed && (() => {
        const imageCorners = UNIT_SQUARE_CORNERS.map(([x, y]) => applyLerpedMat2(lm.matrix, [x, y], s));
        const cx = imageCorners.reduce((sum, [ix]) => sum + ix, 0) / imageCorners.length;
        const cy = imageCorners.reduce((sum, [, iy]) => sum + iy, 0) / imageCorners.length;
        const [px, py] = projector(cx, cy);
        const det = lm.matrix[0][0] * lm.matrix[1][1] - lm.matrix[0][1] * lm.matrix[1][0];
        return (
          <text
            x={px} y={py}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={12} fill="var(--text-secondary)"
          >
            {`area ×${formatSignificant(Math.abs(det))}`}
          </text>
        );
      })()}
      {trapRevealed && lm.ghost_matrix &&
        ghostArrowDirs(eigen).map((e, i) => {
          const g = lm.ghost_matrix!;
          const tip: [number, number] = [
            g[0][0] * e.u[0] + g[0][1] * e.u[1],
            g[1][0] * e.u[0] + g[1][1] * e.u[1],
          ];
          return (
            <ArrowGlyph
              key={`ghost-${i}`}
              from={origin}
              to={projector(tip[0], tip[1])}
              stroke="var(--grey-6)"
              strokeWidth={2}
              dash="4 4"
            />
          );
        })}
      {arrows
        .filter((a) => a.eigenIdx === -1)
        .map((a, i) => (
          <ArrowGlyph
            key={`v-${i}`}
            from={origin}
            to={projector(a.tip[0], a.tip[1])}
            stroke="var(--ink)"
            strokeWidth={1.5}
            opacity={0.55}
          />
        ))}
      {arrows
        .filter((a) => a.eigenIdx !== -1)
        .map((a, i) => (
          <ArrowGlyph
            key={`e-${i}`}
            from={origin}
            to={projector(a.tip[0], a.tip[1])}
            stroke={eigenRevealed ? 'var(--green)' : 'var(--ink)'}
            strokeWidth={emphasizeActive ? 3.5 : 2.5}
          />
        ))}
      {eigenRevealed &&
        eigen.map((e, i) => {
          const tip = applyLerpedMat2(lm.matrix, e.u, s);
          const [px, py] = projector(tip[0], tip[1]);
          const len = Math.hypot(px - origin[0], py - origin[1]) || 1;
          const ox = ((px - origin[0]) / len) * 16;
          const oy = ((py - origin[1]) / len) * 16;
          return (
            <text
              key={`lbl-${i}`}
              x={px + ox} y={py + oy}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={12} fontWeight={600} fill="var(--text-secondary)"
            >
              {`×${e.value}`}
            </text>
          );
        })}
    </g>
  );
}

/** One arrow: shaft + solid head, all in screen coordinates. */
function ArrowGlyph({
  from,
  to,
  stroke,
  strokeWidth,
  dash,
  opacity,
}: {
  from: [number, number];
  to: [number, number];
  stroke: string;
  strokeWidth: number;
  dash?: string;
  opacity?: number;
}) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
  const ux = dx / len;
  const uy = dy / len;
  const headLen = Math.min(8, len * 0.4);
  const headHalf = headLen * 0.45;
  const bx = to[0] - ux * headLen;
  const by = to[1] - uy * headLen;
  return (
    <g opacity={opacity ?? 1}>
      <line
        x1={from[0]} y1={from[1]} x2={bx} y2={by}
        stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} strokeLinecap="round"
      />
      <polygon
        points={`${to[0]},${to[1]} ${bx - uy * headHalf},${by + ux * headHalf} ${bx + uy * headHalf},${by - ux * headHalf}`}
        fill={stroke}
      />
    </g>
  );
}

/**
 * Design contract item 6: "Where marks are lost" label, trap text +
 * Avoid line, hairline above, no icon, ink/grey only.
 *
 * `trap.text`/`trap.avoid` now route through `MarkdownAtomRenderer` rather
 * than raw string interpolation — root-caused by /investigate (2026-09-03):
 * a trap authored with inline math (e.g. "Check $\text{rank}(A)$ once...")
 * rendered the literal `$\text{rank}(A)$` source to students, since plain
 * JSX text interpolation never reaches KaTeX. "Avoid: " stays a plain-text
 * prefix folded into the SAME markdown string (not a separate element) so
 * the label and the (possibly math-bearing) reason read as one sentence,
 * exactly as before.
 */
function TrapRow({ trap, atomId }: { trap: NonNullable<Beat['trap']>; atomId: string }) {
  return (
    <div className="vidhya-resonance-trap">
      <p className="vidhya-resonance-trap__label">Where marks are lost</p>
      <MarkdownAtomRenderer atomId={`${atomId}::text`} content={trap.text} className="vidhya-atom-body--trap" />
      <MarkdownAtomRenderer atomId={`${atomId}::avoid`} content={`Avoid: ${trap.avoid}`} className="vidhya-atom-body--trap" />
    </div>
  );
}

/**
 * Design contract item 4/9: renders only when there is more than one beat
 * (a one-segment scrubber is chrome with no function). Ink fill, separator
 * hairline — no accent color, this is neither mastery nor AI/tutor.
 * Keyboard: each segment is a focusable button; ArrowLeft/ArrowRight step
 * to the adjacent beat and move focus with it.
 */
function BeatBar({
  sortedSteps,
  progress,
  servedStance,
  onSeek,
}: {
  sortedSteps: NonNullable<SimulationSpec['narration_steps']>;
  progress: number;
  servedStance: Stance;
  onSeek: (atProgress: number) => void;
}) {
  return (
    <div role="group" aria-label="Scene beats" className="vidhya-resonance-beatbar" style={{ flex: 1 }}>
      {sortedSteps.map((step, i) => {
        const fill = beatSegmentFill(sortedSteps, progress, i);
        return (
          <button
            key={i}
            type="button"
            className="vidhya-resonance-beatbar__segment"
            onClick={() => onSeek(step.at_progress)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                const next = sortedSteps[Math.min(i + 1, sortedSteps.length - 1)];
                onSeek(next.at_progress);
                (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev = sortedSteps[Math.max(i - 1, 0)];
                onSeek(prev.at_progress);
                (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
              }
            }}
            aria-label={`Beat ${i + 1} of ${sortedSteps.length}: ${stripMarkdownForAria(resolveBeatText(step, servedStance))}`}
          >
            <span className="vidhya-resonance-beatbar__track">
              <span className="vidhya-resonance-beatbar__fill" style={{ width: `${fill * 100}%` }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Design contract item 11: the reduced-motion argument, in full, with zero
 * motion — final-frame SVG (rendered by the caller) then this ordered
 * list. Each row: a 13px index label + the beat's 17px text through
 * `MarkdownAtomRenderer`; the trap beat's row additionally keeps the
 * hairline + Avoid line; one closing 15px line names the ghost, when one
 * exists. Nothing here is gated on `trapRevealed` — under reduced motion
 * the whole argument is visible at once, there is no "moment" to wait for.
 */
function ReducedMotionStoryboard({
  atomId,
  spec,
  sortedSteps,
  servedStance,
}: {
  atomId: string;
  spec: SimulationSpec;
  sortedSteps: NonNullable<SimulationSpec['narration_steps']>;
  servedStance: Stance;
}) {
  return (
    <ol className="space-y-3" aria-label="Scene beats (reduced motion)">
      {sortedSteps.map((step, i) => (
        <li key={i}>
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)', margin: 0 }}>
            Beat {i + 1} of {sortedSteps.length}
          </p>
          <MarkdownAtomRenderer
            atomId={`${atomId}::beat-${i}`}
            content={resolveBeatText(step, servedStance)}
            className="vidhya-atom-body--beat-caption"
          />
          {step.trap && <TrapRow trap={step.trap} atomId={`${atomId}::beat-${i}::trap`} />}
        </li>
      ))}
      {spec.ghost && (
        <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
          The dashed grey path is the common wrong turn.
        </p>
      )}
      {spec.linear_map?.ghost_matrix && (
        <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
          The dashed grey arrows show where the common wrong reading would land.
        </p>
      )}
    </ol>
  );
}

// ============================================================================
// Sampling + projection helpers
// ============================================================================

function sampleCurve(spec: SimulationSpec): { points: Array<{ x: number; y: number }>; error: string | null } {
  // The validator guarantees these on a non-linear_map spec; the guard keeps
  // the narrowing honest for TypeScript and for any unvalidated caller.
  if (typeof spec.x_expr !== 'string' || typeof spec.y_expr !== 'string' ||
      typeof spec.t_min !== 'number' || typeof spec.t_max !== 'number') {
    return { points: [], error: 'missing parametric expressions' };
  }
  const { x_expr, y_expr, t_min, t_max } = spec;
  const n = 80;
  const points: Array<{ x: number; y: number }> = [];
  const span = t_max - t_min;
  for (let i = 0; i <= n; i++) {
    const t = t_min + (span * i) / n;
    let x: number, y: number;
    try {
      x = evalFormula(x_expr, { t });
      y = evalFormula(y_expr, { t });
    } catch (e) {
      return { points: [], error: (e as Error).message };
    }
    if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
  }
  if (points.length === 0) return { points, error: 'no finite samples' };
  return { points, error: null };
}

/**
 * Samples the ghost's (x_expr, y_expr) across the same [t_min, t_max] as
 * the main trace. Any thrown or non-finite sample omits the ghost entirely
 * — a partially-drawn wrong path would itself be a misleading scene, which
 * the content discipline this feature leans on explicitly forbids.
 */
function sampleGhost(spec: SimulationSpec): Array<{ x: number; y: number }> | null {
  if (!spec.ghost) return null;
  if (typeof spec.t_min !== 'number' || typeof spec.t_max !== 'number') return null;
  const { t_min, t_max } = spec;
  const { x_expr, y_expr } = spec.ghost;
  const n = 80;
  const points: Array<{ x: number; y: number }> = [];
  const span = t_max - t_min;
  try {
    for (let i = 0; i <= n; i++) {
      const t = t_min + (span * i) / n;
      const x = evalFormula(x_expr, { t });
      const y = evalFormula(y_expr, { t });
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      points.push({ x, y });
    }
  } catch {
    return null;
  }
  return points.length > 0 ? points : null;
}

function pathD(points: Array<{ x: number; y: number }>, projector: (x: number, y: number) => [number, number]): string {
  return points
    .map((p, i) => {
      const [x, y] = projector(p.x, p.y);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

/**
 * Splits the visible trace into one `<path>` per beat's arc so `emphasize`
 * can heavy-up exactly one segment (design contract item 5) without
 * touching the rest. With no beats this degenerates to the original
 * single-path behavior.
 */
function buildTraceSegments(
  points: Array<{ x: number; y: number }>,
  projector: (x: number, y: number) => [number, number],
  sortedSteps: SimulationSpec['narration_steps'],
  progress: number,
  activeIdx: number | null,
): Array<{ d: string; strokeWidth: number; key: string }> {
  const visibleCutoff = Math.max(1, Math.round(points.length * progress));
  if (!sortedSteps || sortedSteps.length === 0) {
    const visible = points.slice(0, visibleCutoff);
    const d = pathD(visible, projector);
    return d ? [{ d, strokeWidth: 2, key: 'trace' }] : [];
  }
  const segments: Array<{ d: string; strokeWidth: number; key: string }> = [];
  for (let i = 0; i < sortedSteps.length; i++) {
    const startProgress = sortedSteps[i].at_progress;
    const endProgress = i + 1 < sortedSteps.length ? sortedSteps[i + 1].at_progress : 1;
    const segStartIdx = Math.round(points.length * startProgress);
    const segEndFullIdx = Math.round(points.length * endProgress);
    const segEndIdx = Math.min(segEndFullIdx, visibleCutoff);
    // Share the boundary point with the previous segment so the drawn
    // path reads as one continuous line, not visibly-gapped pieces.
    const fromIdx = Math.max(0, segStartIdx - (i === 0 ? 0 : 1));
    if (segEndIdx <= fromIdx) continue;
    const slice = points.slice(fromIdx, segEndIdx + 1);
    if (slice.length < 2) continue;
    const strokeWidth = i === activeIdx && sortedSteps[i].emphasize ? 3.5 : 2;
    segments.push({ d: pathD(slice, projector), strokeWidth, key: `seg-${i}` });
  }
  return segments;
}

function autoViewBox(points: Array<{ x: number; y: number }>): NonNullable<SimulationSpec['view_box']> {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const p of points) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  const padX = (xMax - xMin) * 0.1 || 1;
  const padY = (yMax - yMin) * 0.1 || 1;
  return { x_min: xMin - padX, x_max: xMax + padX, y_min: yMin - padY, y_max: yMax + padY };
}

function makeProjector(view_box: SimulationSpec['view_box']) {
  const v = view_box ?? { x_min: -1, x_max: 1, y_min: -1, y_max: 1 };
  const innerW = SVG_W - PADDING * 2;
  const innerH = SVG_H - PADDING * 2;
  return (x: number, y: number): [number, number] => {
    const px = PADDING + ((x - v.x_min) / (v.x_max - v.x_min)) * innerW;
    const py = PADDING + ((v.y_max - y) / (v.y_max - v.y_min)) * innerH;
    return [px, py];
  };
}

// ============================================================================
// Axes (light grid lines through origin if visible)
// ============================================================================

function Axes({
  viewBox,
  projector,
}: {
  viewBox: SimulationSpec['view_box'];
  projector: (x: number, y: number) => [number, number];
}) {
  const v = viewBox ?? { x_min: -1, x_max: 1, y_min: -1, y_max: 1 };
  const showX = v.y_min < 0 && v.y_max > 0;
  const showY = v.x_min < 0 && v.x_max > 0;
  return (
    <g stroke="var(--separator)" strokeWidth={1} fill="none">
      <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="transparent" />
      {showX && (() => {
        const [x1, y1] = projector(v.x_min, 0);
        const [x2, y2] = projector(v.x_max, 0);
        return <line x1={x1} y1={y1} x2={x2} y2={y2} />;
      })()}
      {showY && (() => {
        const [x1, y1] = projector(0, v.y_min);
        const [x2, y2] = projector(0, v.y_max);
        return <line x1={x1} y1={y1} x2={x2} y2={y2} />;
      })()}
    </g>
  );
}
