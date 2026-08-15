/**
 * demoPersona — carries the chosen demo persona's learning signal for one visit.
 *
 * The demo has to show a lesson composed FOR someone. The two systems that
 * could supply that were disconnected: `demo/seed.ts` gives a real login with
 * plan history but never writes `student_model`, so mastery-driven surfaces
 * cold-start empty; `src/scenarios/persona-seeder.ts` writes a real mastery
 * vector but to its own namespaced ids with no login attached.
 *
 * Rather than bridge them by writing persona mastery onto a real user's row —
 * which is exactly the boundary the plan's item 7 says demo sessions must not
 * cross — this rides the input path `POST /api/lesson/compose` already
 * supports: `student.mastery_by_concept` and `student.recent_errors` are
 * client-supplied (`src/api/lesson-routes.ts` reads them straight off the
 * body). So the persona's signal reaches the composer without a single write.
 *
 * Consequences that fall out for free, rather than needing a guard:
 *   - demo attempts cannot reach real student-data tables, because nothing is
 *     written anywhere
 *   - isolation is per-tab, because sessionStorage is per-tab — two visitors on
 *     two devices, or two tabs, walk independent instances
 *   - the reset button already in DemoRoleSwitcher clears it, because it clears
 *     sessionStorage
 *
 * The signal is a fixture, and the surfaces that show it must say so. See
 * `SampleDataChip`.
 */

const KEY = 'vidhya.demo.persona';
const CAPTIONS_KEY = 'vidhya.demo.captions';
const RAIL_KEY = 'vidhya.demo.rail';
const OUTCOME_KEY = 'vidhya.demo.outcome';

export interface DemoPersonaSignal {
  /** Persona slug, for display and for the sample-data disclosure. */
  id: string;
  /** Human-readable name shown to the visitor. */
  display_name: string;
  /** concept_id → 0..1, fed to the lesson composer. */
  mastery_by_concept: Record<string, number>;
  /** Misconception tags the composer uses to pick traps. */
  recent_errors: string[];
}

function readRaw(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** The persona this tab is walking as, or null when not in a demo journey. */
export function getDemoPersona(): DemoPersonaSignal | null {
  const raw = readRaw();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // A malformed value must not fabricate a signal — an empty mastery map
    // would silently compose a generic lesson while the UI claimed a persona.
    if (!parsed?.id || typeof parsed.mastery_by_concept !== 'object') return null;
    return parsed as DemoPersonaSignal;
  } catch {
    return null;
  }
}

export function setDemoPersona(signal: DemoPersonaSignal): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(signal));
  } catch {
    // Private-browsing / storage-disabled. The rail still walks, just without
    // the persona signal — a generic lesson, which is honest, not a crash.
  }
}

export function clearDemoPersona(): void {
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(CAPTIONS_KEY);
    sessionStorage.removeItem(RAIL_KEY);
    sessionStorage.removeItem(OUTCOME_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * Merge the persona's signal into a compose payload's `student` object.
 *
 * Persona values take precedence over locally-gathered ones: on a demo device
 * the local GBrain stores hold whatever the previous visitor did, and letting
 * that leak into this visitor's lesson is both wrong and the kind of thing a
 * skeptic would notice. Returns the input untouched when no persona is active,
 * so the normal student path is byte-identical.
 */
export function applyDemoPersona(student: Record<string, unknown>): Record<string, unknown> {
  const persona = getDemoPersona();
  if (!persona) return student;
  return {
    ...student,
    mastery_by_concept: {
      ...(student.mastery_by_concept as Record<string, number> | undefined),
      ...persona.mastery_by_concept,
    },
    recent_errors: persona.recent_errors?.length
      ? persona.recent_errors
      : (student.recent_errors as unknown),
  };
}

export interface DemoCaptionScript {
  at: string;
  text: string;
}

/**
 * The active journey's caption script. Same per-tab lifetime as the persona,
 * for the same reasons: two visitors on two devices narrate independently, and
 * the existing reset button clears both because it clears sessionStorage.
 */
export function getDemoCaptions(): DemoCaptionScript[] | undefined {
  try {
    const raw = sessionStorage.getItem(CAPTIONS_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function setDemoCaptions(captions: DemoCaptionScript[] | undefined): void {
  try {
    if (!captions?.length) sessionStorage.removeItem(CAPTIONS_KEY);
    else sessionStorage.setItem(CAPTIONS_KEY, JSON.stringify(captions));
  } catch {
    /* storage disabled — the rail still walks, just silently */
  }
}

export interface DemoRailStep {
  at: string;
  route: string;
  label: string;
}

/**
 * The ordered surfaces of a `surfaces` rail — the principal's drill-down from a
 * batch aggregate to one student's one attempt.
 *
 * Stored per-tab like the persona and the caption script, so all three are
 * cleared by the same reset and two devices walk independently.
 */
export function getDemoRail(): DemoRailStep[] | undefined {
  try {
    const raw = sessionStorage.getItem(RAIL_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((s) => s?.route && s?.at) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function setDemoRail(steps: DemoRailStep[] | undefined): void {
  try {
    if (!steps?.length) sessionStorage.removeItem(RAIL_KEY);
    else sessionStorage.setItem(RAIL_KEY, JSON.stringify(steps));
  } catch {
    /* storage disabled — the rail still walks, just without a next affordance */
  }
}

/**
 * Which step of the rail the given path is on, and what follows it.
 *
 * Matched on the route rather than an index held in state: a visitor who taps
 * the browser back button, or lands mid-rail from a bookmark, still gets a
 * correct "next" instead of an off-by-one.
 */
export function railPosition(pathname: string): {
  current: DemoRailStep | null;
  next: DemoRailStep | null;
  index: number;
  total: number;
} {
  const steps = getDemoRail() ?? [];
  const index = steps.findIndex((s) => s.route === pathname);
  return {
    current: index >= 0 ? steps[index] : null,
    next: index >= 0 && index + 1 < steps.length ? steps[index + 1] : null,
    index,
    total: steps.length,
  };
}

export interface DemoOutcome {
  objectId: string;
  correct: boolean;
}

/**
 * The result of the rail's graded step — the hinge of the miss choreography.
 *
 * The plan's D3.3 is explicit that for this audience the miss is the LIKELY
 * case, and that it should become the demo rather than a dead moment: the
 * caption reframes, the product responds visibly, and the rail re-targets its
 * ending peak onto the thing just missed. All three need to know what actually
 * happened, so the outcome is recorded here when the server grades it.
 *
 * Recorded, never inferred. A demo that guesses the visitor got it right —
 * or wrong — would be faking the one moment that has to be real.
 */
export function getDemoOutcome(): DemoOutcome | null {
  try {
    const raw = sessionStorage.getItem(OUTCOME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.objectId === 'string' && typeof parsed?.correct === 'boolean'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/** Fired when the outcome changes, so mounted rail UI can react. */
export const DEMO_OUTCOME_EVENT = 'vidhya:demo-outcome';

export function setDemoOutcome(outcome: DemoOutcome | null): void {
  try {
    if (!outcome) sessionStorage.removeItem(OUTCOME_KEY);
    else sessionStorage.setItem(OUTCOME_KEY, JSON.stringify(outcome));
  } catch {
    /* storage disabled — the rail still walks, just without the reframe */
  }
  // React does not observe sessionStorage, and DemoRailNav is mounted up in
  // AppLayout — it had already rendered by the time the answer was graded, so
  // the reframe and the re-targeted ending silently never fired. Every unit
  // test passed because they set the outcome BEFORE rendering; only walking the
  // miss in a browser showed it. This is the notification that was missing.
  try {
    window.dispatchEvent(new CustomEvent(DEMO_OUTCOME_EVENT));
  } catch {
    /* non-browser context */
  }
}

/** Subscribe to outcome changes. Returns an unsubscribe function. */
export function onDemoOutcomeChange(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(DEMO_OUTCOME_EVENT, fn);
  return () => window.removeEventListener(DEMO_OUTCOME_EVENT, fn);
}
