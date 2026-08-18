/**
 * frontend/src/lib/warmup-logic.ts — pure derivation helpers for the T8
 * warmup onboarding flow (WarmupPage.tsx + its sub-components). Kept
 * side-effect-free and exported so the state-machine branches are unit
 * testable without mounting React or mocking fetch (repo convention —
 * see RunConsolePage.test.ts / WelcomeBackCard.test.tsx).
 */

export interface SpineConcept {
  id: string;
  label: string;
}

/** localStorage flag set once the warmup flow completes (or is stopped
 *  and persisted) — WarmupEntryCard reads this to stop offering the
 *  warmup again this browser, without waiting on a server round-trip. */
export const WARMUP_COMPLETED_KEY = 'vidhya.warmup.completed';

/** Sentinel object id for the "I haven't learned this yet" answer option —
 *  never a real catalog item id, so it can't collide with a probe's id. */
export const HAVENT_LEARNED_SENTINEL = '__havent_learned_yet__';

export type SegmentState = 'done' | 'now' | 'todo';

export interface SegmentProgress {
  segments: SegmentState[];
  /** "Concept 2 of 5 · Determinants" — DR-2's locked per-CONCEPT format. */
  label: string;
}

/** DR-2: "per-CONCEPT progress: a 5-segment bar + 'Concept 2 of 5 ·
 *  Determinants' (never a 25-dot row)." */
export function buildSegmentProgress(conceptIndex: number, spine: readonly SpineConcept[]): SegmentProgress {
  const segments: SegmentState[] = spine.map((_, i) =>
    i < conceptIndex ? 'done' : i === conceptIndex ? 'now' : 'todo',
  );
  const current = spine[conceptIndex];
  const label = current
    ? `Concept ${conceptIndex + 1} of ${spine.length} · ${current.label}`
    : `Concept ${Math.min(conceptIndex + 1, spine.length)} of ${spine.length}`;
  return { segments, label };
}

/** DR-2 verbatim framing copy, shown once — before the very first probe of
 *  the whole flow, never repeated per concept. */
export const WARMUP_FRAMING_COPY =
  "This isn't a test. We expect you to miss some — that's how we find your starting line. Nothing here is graded.";

export const WARMUP_STOP_HERE_LABEL = 'Stop here — use what you\'ve learned so far';
export const WARMUP_NOT_GRADED_LABEL = 'not graded';
export const WARMUP_SKIP_LANDING_COPY = "We'll start at the beginning.";
export const WARMUP_RESULT_FOOTNOTE =
  'Placement is a starting point, not a grade. It adjusts as you work.';
export const WARMUP_SAVE_ERROR_COPY =
  "Couldn't save your placement — your answers are kept, tap to retry.";
export const WARMUP_LOAD_ERROR_COPY = "Couldn't load your next question — tap to retry.";
export const WARMUP_EARLY_READY_COPY = 'Your starting line is ready.';

export type PlacementDot = 'placed' | 'frontier' | 'later';

export interface PlacementRow {
  id: string;
  label: string;
  dot: PlacementDot;
}

export interface ResultCopy {
  /** true when NOTHING was placed (empty band on the very first probe, or
   *  a Stop-here before answering anything) — the honest "we never even
   *  got a read" state, distinct from "we read you and you're a beginner". */
  earlyReady: boolean;
  headline: string;
  placementLine: string;
  rows: PlacementRow[];
}

/**
 * DR-2's result screen: "leads with competence: headline 'You're solid
 * through {concept}', one placement line ('We'll start you at {concept} —
 * the interesting part.'), row list with placed-vs-start-here dots."
 *
 * `placed` and `frontier` come straight from the server's
 * POST /api/readiness/warmup/persist response — this function never
 * recomputes placement itself, only renders it (single source of truth
 * stays server-side, src/readiness/warmup-onboarding.ts).
 */
export function buildResultCopy(
  spine: readonly SpineConcept[],
  placed: readonly string[],
  frontier: string | null,
  probedAnyProbe: boolean,
): ResultCopy {
  const labelOf = (id: string) => spine.find((c) => c.id === id)?.label ?? id;
  const rows: PlacementRow[] = spine.map((c) => ({
    id: c.id,
    label: c.label,
    dot: placed.includes(c.id) ? 'placed' : c.id === frontier ? 'frontier' : 'later',
  }));

  if (!probedAnyProbe) {
    return {
      earlyReady: true,
      headline: WARMUP_EARLY_READY_COPY,
      placementLine: WARMUP_SKIP_LANDING_COPY,
      rows,
    };
  }

  if (placed.length === 0) {
    return {
      earlyReady: false,
      headline: WARMUP_SKIP_LANDING_COPY,
      placementLine: frontier
        ? `We'll start you at ${labelOf(frontier)} — the interesting part.`
        : '',
      rows,
    };
  }

  const lastPlaced = labelOf(placed[placed.length - 1]);
  const placementLine = frontier
    ? `We'll start you at ${labelOf(frontier)} — the interesting part.`
    : "You've placed through the whole warm-up — practice will pick up from here.";

  return {
    earlyReady: false,
    headline: `You're solid through ${lastPlaced}.`,
    placementLine,
    rows,
  };
}

/** Whether the selected answer counts as correct for applyWarmupOutcome —
 *  "I haven't learned this yet" is always an honest miss, never scored as
 *  a random guess. */
export function isSelectionCorrect(selectedIndex: number, answerIndex: number | null | undefined): boolean {
  if (selectedIndex === -1) return false; // HAVENT_LEARNED_SENTINEL slot
  if (typeof answerIndex !== 'number') return false;
  return selectedIndex === answerIndex;
}
