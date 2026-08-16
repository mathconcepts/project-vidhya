/**
 * The walkthrough cursor.
 *
 * The one behaviour worth pinning hardest: position is an INDEX, not a route.
 * The itinerary deliberately opens the same lesson twice as two different
 * personas, and the demo rail's route-matched cursor resolves both visits to
 * the first entry and never advances. That is why this is a separate mechanism
 * rather than a reuse.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyStop,
  advance,
  getWalkthrough,
  endWalkthrough,
  walkableStops,
  type WalkthroughStop,
} from './walkthrough';
import { getDemoPersona } from './demoPersona';

function stop(id: string, route: string, persona: WalkthroughStop['persona'] = null): WalkthroughStop {
  return { id, title: id, look_for: 'look', proves: 'proves', route, persona, available: true };
}

const MEERA = {
  id: 'meera',
  display_name: 'Meera',
  mastery_by_concept: { eigenvalues: 0.22 },
  recent_errors: [],
  motivation_state: 'anxious',
  representation_mode: 'geometric',
};
const RAHUL = { ...MEERA, id: 'rahul', display_name: 'Rahul', motivation_state: 'driven', representation_mode: 'algebraic' };

beforeEach(() => {
  sessionStorage.clear();
});

describe('walkthrough cursor', () => {
  it('advances through two visits to the SAME route as different personas', () => {
    const stops = [
      stop('a', '/lesson/eigenvalues', MEERA),
      stop('b', '/lesson/eigenvalues', RAHUL),
    ];
    applyStop(stops, 0);
    expect(getWalkthrough()!.index).toBe(0);
    expect(getDemoPersona()!.id).toBe('meera');

    const next = advance(1)!;
    expect(next.route).toBe('/lesson/eigenvalues');
    expect(getWalkthrough()!.index).toBe(1);
    expect(getDemoPersona()!.id).toBe('rahul');
  });

  it('clears a stale persona when a stop is neutral', () => {
    // Otherwise the previous stop's persona silently personalises a screen the
    // tour is presenting as neutral.
    const stops = [stop('a', '/lesson/x', MEERA), stop('b', '/admin', null)];
    applyStop(stops, 0);
    expect(getDemoPersona()).not.toBeNull();
    advance(1);
    expect(getDemoPersona()).toBeNull();
  });

  it('goes backwards', () => {
    const stops = [stop('a', '/one'), stop('b', '/two')];
    applyStop(stops, 1);
    expect(advance(-1)!.route).toBe('/one');
    expect(getWalkthrough()!.index).toBe(0);
  });

  it('refuses to advance past the end', () => {
    applyStop([stop('a', '/one')], 0);
    expect(advance(1)).toBeNull();
    expect(getWalkthrough()!.index).toBe(0);
  });

  it('normalises an unrecognised representation mode instead of passing it through', () => {
    applyStop([stop('a', '/x', { ...MEERA, representation_mode: 'interpretive-dance' })], 0);
    expect(getDemoPersona()!.representation_mode).toBeUndefined();
  });

  it('returns null rather than a bogus position for a corrupt cursor', () => {
    // A bar claiming a position it does not have would send an operator to the
    // wrong screen mid-demo.
    sessionStorage.setItem('vidhya.admin.walkthrough.cursor', '{"index":9,"stops":[]}');
    expect(getWalkthrough()).toBeNull();
    sessionStorage.setItem('vidhya.admin.walkthrough.cursor', 'not json');
    expect(getWalkthrough()).toBeNull();
  });

  it('ending clears both the cursor and the persona', () => {
    applyStop([stop('a', '/x', MEERA)], 0);
    endWalkthrough();
    expect(getWalkthrough()).toBeNull();
    expect(getDemoPersona()).toBeNull();
  });

  it('walkableStops drops the unavailable ones', () => {
    const itinerary = {
      stops: [stop('a', '/one'), { ...stop('b', '/two'), available: false }],
      coverage: {
        widget_kinds_in_corpus: [],
        widget_kinds_covered: [],
        stances_covered: [],
        available_stops: 1,
        total_stops: 2,
      },
      generated_at: 'x',
    };
    expect(walkableStops(itinerary).map((s) => s.id)).toEqual(['a']);
  });
});
