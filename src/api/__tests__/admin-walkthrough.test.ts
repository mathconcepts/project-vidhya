/**
 * The admin demo walkthrough itinerary.
 *
 * The rule this exists to hold: a tour may not advertise a stop the instance
 * cannot deliver. A hand-maintained list of demo steps rots silently, and the
 * failure lands in front of whoever the demo was for. So the itinerary is
 * derived from the artefacts, and a stop whose dependency is missing is marked
 * unavailable WITH the reason rather than dropped or shown as fine.
 */
import { describe, it, expect } from 'vitest';
import { buildItinerary, widgetKindOf, railAtomKey } from '../admin-walkthrough-routes';

const NOW = '2026-08-16T00:00:00.000Z';

const MEERA = {
  id: 'meera',
  display_name: 'Meera — anxious',
  mastery_by_concept: { eigenvalues: 0.22 },
  recent_errors: [],
  motivation_state: 'anxious',
  representation_mode: 'geometric',
};
const RAHUL = {
  id: 'rahul',
  display_name: 'Rahul — driven',
  mastery_by_concept: { eigenvalues: 0.81 },
  recent_errors: [],
  motivation_state: 'driven',
  representation_mode: 'algebraic',
};

function base(overrides: Partial<Parameters<typeof buildItinerary>[0]> = {}) {
  return {
    conceptWidgets: {
      eigenvalues: {
        hook: 'simulation',
        intuition: 'manipulable',
        'worked-example': 'guided_walkthrough',
      },
    },
    conceptStances: {
      eigenvalues: { hook: ['shaken', 'assured'], intuition: ['shaken', 'assured'] },
    },
    rails: [
      {
        id: 'card-1',
        title: 'Three weeks to GATE',
        persona: 'meera',
        rail: {
          kind: 'atoms',
          concept_id: 'eigenvalues',
          atoms: ['hook', 'intuition', 'worked-example'],
          practice_item_id: 'la-eigen-001',
          invite_doubt: true,
        },
      },
    ],
    personas: { meera: MEERA, rahul: RAHUL },
    now: NOW,
    ...overrides,
  };
}

describe('railAtomKey', () => {
  it('strips a dot-joined concept prefix', () => {
    expect(railAtomKey('eigenvalues', 'eigenvalues.hook')).toBe('hook');
  });

  it('strips a HYPHEN-joined prefix — the legacy drift that hid a widget', () => {
    // orthogonality-worked-example is a real id in the corpus. Splitting on '.'
    // alone returned the whole string, so its guided_walkthrough went uncounted
    // and the tour under-reported that lesson as having one widget, not two.
    expect(railAtomKey('orthogonality', 'orthogonality-worked-example')).toBe('worked-example');
  });

  it('normalises the underscore variant', () => {
    expect(railAtomKey('determinants', 'determinants.worked_example')).toBe('worked-example');
  });

  it('leaves an id with no recognisable prefix alone', () => {
    expect(railAtomKey('eigenvalues', 'something-else')).toBe('something-else');
  });
});

describe('widgetKindOf', () => {
  it('reads the kind out of an interactive-spec block', () => {
    expect(widgetKindOf('text\n```interactive-spec\n{"v":1,"kind":"manipulable"}\n```')).toBe(
      'manipulable',
    );
  });

  it('returns null for prose', () => {
    expect(widgetKindOf('just words')).toBeNull();
  });

  it('treats an unparseable block as no widget', () => {
    // It renders as nothing, so counting it would have an operator presenting
    // a blank rectangle while the tour claims a widget.
    expect(widgetKindOf('```interactive-spec\n{not json\n```')).toBeNull();
  });
});

describe('buildItinerary', () => {
  it('covers every widget kind present in the corpus', () => {
    const it = buildItinerary(base());
    expect(it.coverage.widget_kinds_covered).toEqual(it.coverage.widget_kinds_in_corpus);
    expect(it.coverage.widget_kinds_in_corpus).toEqual([
      'guided_walkthrough',
      'manipulable',
      'simulation',
    ]);
  });

  it('visits the same lesson twice as two different personas', () => {
    // The reason the walkthrough tracks position by index and not by route.
    const it = buildItinerary(base());
    const lessons = it.stops.filter((s) => s.route === '/lesson/eigenvalues');
    expect(lessons.length).toBeGreaterThanOrEqual(3);
    const personas = lessons.map((s) => s.persona?.id);
    expect(personas).toContain('meera');
    expect(personas).toContain('rahul');
  });

  it('orders the richest lesson first', () => {
    const it = buildItinerary(
      base({
        conceptWidgets: {
          thin: { hook: 'simulation' },
          rich: { hook: 'simulation', intuition: 'manipulable', 'worked-example': 'guided_walkthrough' },
        },
        conceptStances: { rich: { hook: ['shaken', 'assured'] }, thin: {} },
        rails: [
          { id: 'thin', title: 'Thin', persona: 'meera', rail: { kind: 'atoms', concept_id: 'thin', atoms: ['hook'] } },
          { id: 'rich', title: 'Rich', persona: 'meera', rail: { kind: 'atoms', concept_id: 'rich', atoms: ['hook', 'intuition', 'worked-example'] } },
        ],
      }),
    );
    const lessonStops = it.stops.filter((s) => s.route.startsWith('/lesson/'));
    expect(lessonStops[0].route).toBe('/lesson/rich');
  });

  it('marks a rail with no widgets unavailable and says why', () => {
    const it = buildItinerary(
      base({
        conceptWidgets: { eigenvalues: { hook: null, intuition: null, 'worked-example': null } },
      }),
    );
    const lesson = it.stops.find((s) => s.route === '/lesson/eigenvalues')!;
    expect(lesson.available).toBe(false);
    expect(lesson.unavailable_reason).toContain('interactive block');
  });

  it('marks the stance pair unavailable when only one stance is authored', () => {
    const it = buildItinerary(
      base({ conceptStances: { eigenvalues: { hook: ['shaken'] } } }),
    );
    const stance = it.stops.filter((s) => s.id.startsWith('stance:'));
    expect(stance).toHaveLength(2);
    for (const s of stance) {
      expect(s.available).toBe(false);
      expect(s.unavailable_reason).toContain('both stances');
    }
    expect(it.coverage.stances_covered).toEqual([]);
  });

  it('marks the stance pair unavailable when no persona has that motivation', () => {
    const it = buildItinerary(base({ personas: { meera: MEERA } }));
    const assured = it.stops.find((s) => s.id === 'stance:confident')!;
    expect(assured.available).toBe(false);
    expect(assured.unavailable_reason).toContain('confident');
    // The unconfident half is still walkable — one missing persona must not
    // take down the half that works.
    expect(it.stops.find((s) => s.id === 'stance:unconfident')!.available).toBe(true);
  });

  it('never drops an unavailable stop from the list', () => {
    // The operator has to see what is missing BEFORE walking, not discover it
    // when a screen comes up empty.
    const withAll = buildItinerary(base());
    const degraded = buildItinerary(base({ conceptStances: { eigenvalues: {} } }));
    expect(degraded.stops).toHaveLength(withAll.stops.length);
    expect(degraded.coverage.available_stops).toBeLessThan(withAll.coverage.available_stops);
  });

  it('says the deck is unavailable when there are no cards', () => {
    const it = buildItinerary(base({ rails: [] }));
    const deck = it.stops.find((s) => s.id === 'deck')!;
    expect(deck.available).toBe(false);
    expect(deck.unavailable_reason).toContain('no cards');
  });

  it('every unavailable stop carries a reason', () => {
    const it = buildItinerary(
      base({ rails: [], conceptWidgets: {}, conceptStances: {}, personas: {} }),
    );
    for (const s of it.stops) {
      if (!s.available) expect(s.unavailable_reason, `${s.id} has no reason`).toBeTruthy();
    }
  });

  it('includes the graded and doubt steps only when the rail declares them', () => {
    const withThem = buildItinerary(base());
    expect(withThem.stops.some((s) => s.route.startsWith('/attempt/'))).toBe(true);
    expect(withThem.stops.some((s) => s.route === '/demo/doubt')).toBe(true);

    const without = buildItinerary(
      base({
        rails: [
          {
            id: 'card-1',
            title: 'No practice',
            persona: 'meera',
            rail: { kind: 'atoms', concept_id: 'eigenvalues', atoms: ['hook'] },
          },
        ],
      }),
    );
    expect(without.stops.some((s) => s.route.startsWith('/attempt/'))).toBe(false);
    expect(without.stops.some((s) => s.route === '/demo/doubt')).toBe(false);
  });
});
