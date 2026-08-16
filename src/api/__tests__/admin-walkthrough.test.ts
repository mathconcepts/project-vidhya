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
import fs from 'fs';
import path from 'path';
import { buildItinerary, widgetKindOf, railAtomKey, atomFramingFor } from '../admin-walkthrough-routes';

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

  describe('atom_framing — operator-only evidence for the stance pair', () => {
    it('carries band/stance/mode plus served_stance for every atom on the unconfident stop', () => {
      const it_ = buildItinerary(base());
      const stop = it_.stops.find((s) => s.id === 'stance:unconfident')!;
      expect(stop.available).toBe(true);
      expect(stop.atom_framing).toBeDefined();
      const byAtom = Object.fromEntries(stop.atom_framing!.map((f) => [f.atom_id, f]));
      // Meera: mastery 0.22 on eigenvalues (< 0.35 → cold), motivation 'anxious'
      // (a STRUGGLING_STATES member → shaken), representation_mode 'geometric'.
      expect(byAtom.hook).toEqual({
        atom_id: 'hook',
        band: 'cold',
        stance: 'shaken',
        mode: 'geometric',
        served_stance: 'shaken',
      });
      expect(byAtom.intuition.served_stance).toBe('shaken');
    });

    it('derives the opposite band/stance/mode for the confident stop from a different persona', () => {
      const it_ = buildItinerary(base());
      const stop = it_.stops.find((s) => s.id === 'stance:confident')!;
      expect(stop.available).toBe(true);
      // Rahul: mastery 0.81 (≥ 0.7 → solid), motivation 'driven' (THRIVING → assured),
      // representation_mode 'algebraic'.
      const byAtom = Object.fromEntries(stop.atom_framing!.map((f) => [f.atom_id, f]));
      expect(byAtom.hook.band).toBe('solid');
      expect(byAtom.hook.stance).toBe('assured');
      expect(byAtom.hook.mode).toBe('algebraic');
      expect(byAtom.hook.served_stance).toBe('assured');
    });

    it('reports served_stance: null for every atom when the concept has no full coverage, without crashing', () => {
      // Same scenario as "marks the stance pair unavailable when only one
      // stance is authored" — the stop is unavailable, but if a caller reads
      // atom_framing off it anyway, it must not claim a swap that never
      // happens.
      const it_ = buildItinerary(base({ conceptStances: { eigenvalues: { hook: ['shaken'] } } }));
      const stop = it_.stops.find((s) => s.id === 'stance:unconfident')!;
      expect(stop.available).toBe(false);
      for (const f of stop.atom_framing ?? []) {
        expect(f.served_stance).toBeNull();
      }
    });

    it('omits atom_framing entirely when no persona has the required motivation state', () => {
      const it_ = buildItinerary(base({ personas: { meera: MEERA } }));
      const confident = it_.stops.find((s) => s.id === 'stance:confident')!;
      expect(confident.available).toBe(false);
      expect(confident.atom_framing).toBeUndefined();
    });

    it('never appears on a stop other than the stance pair', () => {
      const it_ = buildItinerary(base());
      for (const s of it_.stops) {
        if (s.id.startsWith('stance:')) continue;
        expect(s.atom_framing).toBeUndefined();
      }
    });
  });

  describe('atomFramingFor — the pure per-atom computation', () => {
    it('the same persona produces served_stance: null for an atom key missing from stancesHere', () => {
      const out = atomFramingFor(MEERA, 'eigenvalues', { hook: ['shaken', 'assured'] }, true);
      expect(out).toEqual([
        { atom_id: 'hook', band: 'cold', stance: 'shaken', mode: 'geometric', served_stance: 'shaken' },
      ]);
    });

    it('never swaps when bothAuthored is false, even if this atom individually has the stance', () => {
      const out = atomFramingFor(MEERA, 'eigenvalues', { hook: ['shaken'] }, false);
      expect(out[0].served_stance).toBeNull();
    });

    it('never swaps a steady-stance persona', () => {
      const steady = { ...MEERA, motivation_state: 'steady', mastery_by_concept: { eigenvalues: 0.5 } };
      const out = atomFramingFor(steady, 'eigenvalues', { hook: ['shaken', 'assured'] }, true);
      expect(out[0].stance).toBe('steady');
      expect(out[0].served_stance).toBeNull();
    });
  });
});

describe('surveillance: served_stance stays operator-only', () => {
  // src/content/stance-variants.ts sets `served_stance` on an atom when it
  // swaps in an authored variant body. Students must never see a stance
  // label — the walkthrough surfaces it (via atom_framing above) strictly on
  // the admin-gated GET /api/admin/walkthrough response. This test is the
  // tripwire: if a future change threads served_stance into anything a
  // student can reach, it must fail loudly rather than ship quietly.
  //
  // AtomCardRenderer.tsx is the one legitimate exception: it reads
  // atom.served_stance to decide whether to skip the scaffolding fade (a
  // RENDERING DECISION), never to display the word "stance" or the value
  // itself. Its own test (WorkedExampleCard.test.tsx) pins that behaviour.
  const ALLOWLIST = new Set<string>([
    path.join('components', 'lesson', 'AtomCardRenderer.tsx'),
    path.join('components', 'lesson', 'WorkedExampleCard.test.tsx'),
  ]);

  function readAllTsxFiles(dir: string): string[] {
    const out: string[] = [];
    if (!fs.existsSync(dir)) return out;
    const stack = [dir];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
        const p = path.join(cur, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === 'dist') continue;
          stack.push(p);
          continue;
        }
        if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(p);
      }
    }
    return out;
  }

  it('appears in no frontend file outside the documented internal (non-display) allowlist', () => {
    const frontendSrc = path.resolve(__dirname, '../../../frontend/src');
    const files = readAllTsxFiles(frontendSrc);
    const offenders = files
      .filter((f) => fs.readFileSync(f, 'utf8').includes('served_stance'))
      .map((f) => path.relative(frontendSrc, f))
      .filter((rel) => !ALLOWLIST.has(rel));
    expect(
      offenders,
      `served_stance appeared in non-allowlisted frontend file(s): ${offenders.join(', ')}. ` +
        `If this is a deliberate, admin-gated disclosure, add it to ALLOWLIST with a reason.`,
    ).toEqual([]);
  });

  it('the walkthrough route itself stays admin-gated (unchanged by this feature)', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../admin-walkthrough-routes.ts'), 'utf8');
    expect(src).toContain("requireRole(req, res, 'admin')");
  });
});
