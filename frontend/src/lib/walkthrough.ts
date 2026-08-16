/**
 * The admin demo walkthrough's position, and the state each stop needs.
 *
 * ── Why this is not DemoRailNav ─────────────────────────────────────────
 *
 * The demo deck's rail tracks position with `railPosition(pathname)`, matching
 * the current route against the step list. That is the right design there: a
 * visitor who hits browser-back or lands mid-rail from a bookmark still gets a
 * correct "next" instead of an off-by-one.
 *
 * It cannot carry this itinerary. The whole point of the walkthrough is to open
 * `/lesson/<concept>` twice — once as the unconfident student, once as the
 * confident one — and a route-matched cursor resolves both visits to the first
 * entry and never advances past it. So position here is an INDEX.
 *
 * The codebase has a documented preference against growing a second navigation
 * mechanism, so this is deliberate rather than accidental: the two have
 * genuinely different requirements, and bending the shared one to index
 * matching would break the bookmark-resilience the demo rail depends on.
 *
 * Per-tab, like every other demo signal here: sessionStorage means two
 * operators on two machines walk independently, and the existing reset clears
 * this too.
 */

import { setDemoPersona, clearDemoPersona } from './demoPersona';

const CURSOR_KEY = 'vidhya.admin.walkthrough.cursor';

export interface WalkthroughStop {
  id: string;
  title: string;
  look_for: string;
  proves: string;
  route: string;
  persona: {
    id: string;
    display_name: string;
    mastery_by_concept: Record<string, number>;
    recent_errors: string[];
    motivation_state?: string;
    representation_mode?: string;
  } | null;
  available: boolean;
  unavailable_reason?: string;
}

export interface WalkthroughItinerary {
  stops: WalkthroughStop[];
  coverage: {
    widget_kinds_in_corpus: string[];
    widget_kinds_covered: string[];
    stances_covered: string[];
    available_stops: number;
    total_stops: number;
  };
  generated_at: string;
}

/** What the persistent bar needs to render, held across navigations. */
export interface WalkthroughCursor {
  index: number;
  stops: WalkthroughStop[];
}

export function getWalkthrough(): WalkthroughCursor | null {
  try {
    const raw = sessionStorage.getItem(CURSOR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // A malformed cursor must not render a bar claiming a position it does not
    // have — an operator mid-demo following a wrong "next" is worse than no bar.
    if (typeof parsed?.index !== 'number' || !Array.isArray(parsed?.stops)) return null;
    if (parsed.index < 0 || parsed.index >= parsed.stops.length) return null;
    return parsed as WalkthroughCursor;
  } catch {
    return null;
  }
}

function write(cursor: WalkthroughCursor | null): void {
  try {
    if (!cursor) sessionStorage.removeItem(CURSOR_KEY);
    else sessionStorage.setItem(CURSOR_KEY, JSON.stringify(cursor));
  } catch {
    /* storage disabled — the operator can still navigate by hand */
  }
}

/**
 * Apply a stop: set (or clear) the persona so the next page composes as that
 * student, and record the position.
 *
 * Returns the route to navigate to. Clearing on a null persona matters — a
 * stale persona from the previous stop would silently personalise a screen the
 * tour is presenting as neutral.
 */
const REPRESENTATION_MODES = ['geometric', 'algebraic', 'balanced'] as const;
type RepresentationMode = (typeof REPRESENTATION_MODES)[number];

/**
 * Narrow the server's free-form `representation_mode` to the values the
 * persona signal accepts. Validated rather than cast: an unrecognised value
 * should fall back to the neutral mode, not be forced through the type system
 * and reappear as an unexplained miss downstream.
 */
function asRepresentationMode(v: string | undefined): RepresentationMode | undefined {
  return (REPRESENTATION_MODES as readonly string[]).includes(v ?? '')
    ? (v as RepresentationMode)
    : undefined;
}

export function applyStop(stops: WalkthroughStop[], index: number): string | null {
  const stop = stops[index];
  if (!stop) return null;
  if (stop.persona) {
    setDemoPersona({
      ...stop.persona,
      representation_mode: asRepresentationMode(stop.persona.representation_mode),
    });
  } else clearDemoPersona();
  write({ index, stops });
  return stop.route;
}

/** Only stops that can actually be walked. Unavailable ones are never entered. */
export function walkableStops(itinerary: WalkthroughItinerary): WalkthroughStop[] {
  return itinerary.stops.filter((s) => s.available);
}

export function advance(delta: number): { stop: WalkthroughStop; route: string } | null {
  const cursor = getWalkthrough();
  if (!cursor) return null;
  const next = cursor.index + delta;
  const stop = cursor.stops[next];
  if (!stop) return null;
  const route = applyStop(cursor.stops, next);
  return route ? { stop, route } : null;
}

export function endWalkthrough(): void {
  write(null);
  clearDemoPersona();
}
