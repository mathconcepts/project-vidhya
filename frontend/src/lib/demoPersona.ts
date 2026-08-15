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
