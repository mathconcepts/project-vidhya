/**
 * The content-maturity report exists to tell an operator the truth about
 * whether students are getting personalised content. A report that flatters
 * is worse than no report, so most of these tests are about what it must
 * REFUSE to claim.
 */
import { describe, it, expect } from 'vitest';
import {
  buildReport,
  worstSeverity,
  computeStanceFigures,
  computeResonanceFigures,
  countFilesRecursive,
  type MaturityFacts,
  type MaturitySignal,
  type StanceFigureConcept,
  type ResonanceFigureConcept,
  type ResonanceFigures,
} from '../admin-content-maturity-routes';
import type { ParseInteractiveSpecFn, ParseInteractiveSpecResult } from '../../content/interactive-spec-loader';
import fs from 'fs';
import os from 'os';
import path from 'path';

const NOW = '2026-08-16T00:00:00.000Z';

const HEALTHY: MaturityFacts = {
  database_configured: true,
  selector_gate_present: true,
  thinking_gap_total: 100,
  thinking_gap_generic: 10,
  thinking_gap_distinct_framings: 12,
  active_atom_overrides: 4,
  stance_rollout_total: 10,
  stance_rollout_covered: 10,
  stance_course_total: 10,
  stance_course_covered: 10,
  stance_rejected_drafts: 0,
  resonance: {
    by_topic: [
      { topic: 'linear-algebra', concepts_with_hook: 26, concepts_with_beats: 26, concepts_with_trap_beat: 26, concepts_with_stance_beats: 26 },
    ],
    concepts_with_hook: 26,
    concepts_with_beats: 26,
    concepts_with_trap_beat: 26,
    concepts_with_stance_beats: 26,
  },
};

const NOT_MEASURABLE_RESONANCE: ResonanceFigures = {
  by_topic: null,
  concepts_with_hook: null,
  concepts_with_beats: null,
  concepts_with_trap_beat: null,
  concepts_with_stance_beats: null,
};

function signal(report: ReturnType<typeof buildReport>, id: string): MaturitySignal {
  const s = report.signals.find((x) => x.id === id);
  if (!s) throw new Error(`no signal ${id}`);
  return s;
}

describe('worstSeverity', () => {
  it('ranks blocked above partial above unknown above healthy', () => {
    const mk = (severity: any): MaturitySignal => ({ id: 'x', label: '', severity, remedy: null });
    expect(worstSeverity([mk('healthy'), mk('unknown')])).toBe('unknown');
    expect(worstSeverity([mk('unknown'), mk('partial')])).toBe('partial');
    expect(worstSeverity([mk('partial'), mk('blocked')])).toBe('blocked');
    expect(worstSeverity([mk('healthy')])).toBe('healthy');
    expect(worstSeverity([])).toBe('healthy');
  });
});

describe('buildReport', () => {
  it('reports a healthy deploy as active', () => {
    const r = buildReport(HEALTHY, NOW);
    expect(r.personalization_active).toBe(true);
    expect(r.overall).toBe('healthy');
  });

  it('calls a missing database a blocker, not a warning', () => {
    // This is the demo instance's actual state, and the reason every student
    // sees identical content there.
    const r = buildReport(
      {
        database_configured: false,
        selector_gate_present: null,
        thinking_gap_total: null,
        thinking_gap_generic: null,
        thinking_gap_distinct_framings: null,
        active_atom_overrides: null,
        stance_rollout_total: 10,
        stance_rollout_covered: 10,
        stance_course_total: 40,
        stance_course_covered: 8,
        stance_rejected_drafts: 0,
        resonance: NOT_MEASURABLE_RESONANCE,
      },
      NOW,
    );
    expect(r.overall).toBe('blocked');
    expect(r.personalization_active).toBe(false);
    expect(signal(r, 'database').severity).toBe('blocked');
    expect(signal(r, 'database').remedy).toContain('DATABASE_URL');
  });

  it('calls the selector being switched off a blocker', () => {
    const r = buildReport({ ...HEALTHY, selector_gate_present: false }, NOW);
    expect(r.personalization_active).toBe(false);
    expect(signal(r, 'selector_gate').severity).toBe('blocked');
    // The remedy has to name the out-of-band row, because that is the single
    // least discoverable thing about this system.
    expect(signal(r, 'selector_gate').remedy).toContain('personalized_selector_v1_gate_ma');
  });

  it('never reports an unmeasurable quantity as zero', () => {
    const r = buildReport(
      { ...HEALTHY, thinking_gap_total: null, thinking_gap_generic: null, thinking_gap_distinct_framings: null },
      NOW,
    );
    const s = signal(r, 'thinking_gap');
    expect(s.severity).toBe('unknown');
    expect(s.detail?.rows).toBeUndefined();
    expect(s.label).not.toContain('0 ');
  });

  it('distinguishes "nothing generated yet" from "all of it is generic"', () => {
    const empty = signal(buildReport({ ...HEALTHY, thinking_gap_total: 0, thinking_gap_generic: 0, thinking_gap_distinct_framings: 0 }, NOW), 'thinking_gap');
    expect(empty.severity).toBe('unknown'); // no evidence, not a finding

    const allGeneric = signal(buildReport({ ...HEALTHY, thinking_gap_total: 40, thinking_gap_generic: 40, thinking_gap_distinct_framings: 0 }, NOW), 'thinking_gap');
    expect(allGeneric.severity).toBe('blocked');
    expect(allGeneric.label).toContain('generic');
  });

  it('reports a majority-generic cache as partial rather than healthy', () => {
    const s = signal(buildReport({ ...HEALTHY, thinking_gap_total: 100, thinking_gap_generic: 80 }, NOW), 'thinking_gap');
    expect(s.severity).toBe('partial');
    expect(s.label).toContain('80 of 100');
  });

  it('does not call zero per-student rewrites healthy, but does not call it broken either', () => {
    // Zero is genuinely expected on low traffic. It still means every student
    // reads the same lesson body, which the operator should know.
    const s = signal(buildReport({ ...HEALTHY, active_atom_overrides: 0 }, NOW), 'atom_overrides');
    expect(s.severity).toBe('partial');
    expect(s.remedy).toContain('not a fault');
  });

  it('pluralises the rewrite count correctly', () => {
    expect(signal(buildReport({ ...HEALTHY, active_atom_overrides: 1 }, NOW), 'atom_overrides').label)
      .toContain('1 lesson has');
    expect(signal(buildReport({ ...HEALTHY, active_atom_overrides: 3 }, NOW), 'atom_overrides').label)
      .toContain('3 lessons have');
  });

  it('marks personalization inactive whenever any signal is blocked', () => {
    for (const facts of [
      { ...HEALTHY, database_configured: false },
      { ...HEALTHY, selector_gate_present: false },
      { ...HEALTHY, thinking_gap_total: 5, thinking_gap_generic: 5 },
    ] as MaturityFacts[]) {
      expect(buildReport(facts, NOW).personalization_active).toBe(false);
    }
  });

  it('emits no student-identifying field anywhere in the payload', () => {
    // Surveillance invariant: counts only.
    const serialized = JSON.stringify(buildReport(HEALTHY, NOW));
    for (const banned of ['student_id', 'session_id', 'user_id', 'email', 'display_name', 'full_name']) {
      expect(serialized).not.toContain(banned);
    }
  });

  it('always names a remedy for anything that is not healthy', () => {
    const r = buildReport(
      {
        database_configured: false,
        selector_gate_present: false,
        thinking_gap_total: 10,
        thinking_gap_generic: 10,
        thinking_gap_distinct_framings: 0,
        active_atom_overrides: 0,
        stance_rollout_total: 0,
        stance_rollout_covered: 0,
        stance_course_total: 0,
        stance_course_covered: 0,
        stance_rejected_drafts: 3,
        resonance: NOT_MEASURABLE_RESONANCE,
      },
      NOW,
    );
    for (const s of r.signals) {
      if (s.severity !== 'healthy') {
        expect(s.remedy, `signal ${s.id} has no remedy`).toBeTruthy();
      }
    }
  });

  describe('stance_rollout — figure 1, "is anything actually in rollout"', () => {
    it('renders 0-of-0 as "not started", never 100% and never a crash', () => {
      const s = signal(buildReport({ ...HEALTHY, stance_rollout_total: 0, stance_rollout_covered: 0 }, NOW), 'stance_rollout');
      expect(s.severity).toBe('unknown');
      expect(s.label).toContain('not started');
      expect(s.label).not.toContain('100');
      expect(Number.isFinite(s.detail?.concepts_in_rollout)).toBe(true);
    });

    it('reports a fully-covered rollout as healthy', () => {
      const s = signal(buildReport({ ...HEALTHY, stance_rollout_total: 5, stance_rollout_covered: 5 }, NOW), 'stance_rollout');
      expect(s.severity).toBe('healthy');
      expect(s.label).toContain('5 of 5');
    });

    it('reports a partially-covered rollout as partial, with a remedy', () => {
      const s = signal(buildReport({ ...HEALTHY, stance_rollout_total: 5, stance_rollout_covered: 2 }, NOW), 'stance_rollout');
      expect(s.severity).toBe('partial');
      expect(s.label).toContain('2 of 5');
      expect(s.remedy).toBeTruthy();
    });
  });

  describe('stance_course_wide — figure 2, the denominator that cannot lie', () => {
    it('differs from the rollout figure during a partial topic-by-topic rollout', () => {
      // The whole point of splitting this into two figures: a rollout that
      // looks "done" (5 of 5 opted-in concepts) must not imply the course is
      // done (40 concepts total, most untouched).
      const r = buildReport(
        { ...HEALTHY, stance_rollout_total: 5, stance_rollout_covered: 5, stance_course_total: 40, stance_course_covered: 5 },
        NOW,
      );
      const rollout = signal(r, 'stance_rollout');
      const course = signal(r, 'stance_course_wide');
      expect(rollout.severity).toBe('healthy');
      expect(rollout.label).toContain('5 of 5');
      expect(course.severity).toBe('partial');
      expect(course.label).toContain('5 of 40');
      expect(rollout.label).not.toEqual(course.label);
    });

    it('never reports the course-wide denominator as just the variant-carrying subset', () => {
      // Old behaviour: scoping the denominator to concepts that already had
      // variants. New behaviour: the denominator is every authored concept.
      const s = signal(buildReport({ ...HEALTHY, stance_course_total: 777, stance_course_covered: 3 }, NOW), 'stance_course_wide');
      expect(s.label).toContain('3 of 777');
      expect(s.severity).toBe('partial');
    });
  });

  describe('stance_rejected — figure 3, drafts the equivalence judge refused', () => {
    it('surfaces a nonzero rejected count with a remedy pointing at the drafts directory', () => {
      const s = signal(buildReport({ ...HEALTHY, stance_rejected_drafts: 4 }, NOW), 'stance_rejected');
      expect(s.severity).toBe('partial');
      expect(s.label).toContain('4');
      expect(s.remedy).toContain('.data/variant-drafts');
    });

    it('reports zero rejected drafts as healthy, not as unmeasurable', () => {
      const s = signal(buildReport({ ...HEALTHY, stance_rejected_drafts: 0 }, NOW), 'stance_rejected');
      expect(s.severity).toBe('healthy');
      expect(s.detail?.rejected_drafts).toBe(0);
    });

    it('singularises a count of one', () => {
      const s = signal(buildReport({ ...HEALTHY, stance_rejected_drafts: 1 }, NOW), 'stance_rejected');
      expect(s.label).toContain('1 authored draft ');
      expect(s.label).not.toContain('1 authored drafts');
    });
  });

  describe('resonance_coverage — plan §W5, fused hook scenes', () => {
    it('reports "not measurable" when the validator could not be loaded, never zero', () => {
      const s = signal(buildReport({ ...HEALTHY, resonance: NOT_MEASURABLE_RESONANCE }, NOW), 'resonance_coverage');
      expect(s.severity).toBe('unknown');
      expect(s.label).not.toContain('0 of');
      expect(s.detail).toBeUndefined();
    });

    it('reports zero hook atoms as unknown, not as a finding', () => {
      const s = signal(
        buildReport(
          {
            ...HEALTHY,
            resonance: { by_topic: [], concepts_with_hook: 0, concepts_with_beats: 0, concepts_with_trap_beat: 0, concepts_with_stance_beats: 0 },
          },
          NOW,
        ),
        'resonance_coverage',
      );
      expect(s.severity).toBe('unknown');
      expect(s.label).toContain('No hook atoms');
    });

    it('reports full coverage of authored hooks as healthy', () => {
      const s = signal(buildReport(HEALTHY, NOW), 'resonance_coverage'); // 26 of 26 in the fixture
      expect(s.severity).toBe('healthy');
      expect(s.label).toContain('26 of 26');
      expect(s.remedy).toBeNull();
    });

    it('reports partial coverage as partial, with numbers in detail and a remedy', () => {
      const partial: ResonanceFigures = {
        by_topic: [{ topic: 'linear-algebra', concepts_with_hook: 26, concepts_with_beats: 24, concepts_with_trap_beat: 24, concepts_with_stance_beats: 24 }],
        concepts_with_hook: 26,
        concepts_with_beats: 24,
        concepts_with_trap_beat: 24,
        concepts_with_stance_beats: 24,
      };
      const s = signal(buildReport({ ...HEALTHY, resonance: partial }, NOW), 'resonance_coverage');
      expect(s.severity).toBe('partial');
      expect(s.label).toContain('24 of 26');
      expect(s.remedy).toBeTruthy();
      expect(s.detail).toEqual({
        concepts_with_hook: 26,
        concepts_with_beats: 24,
        concepts_with_trap_beat: 24,
        concepts_with_stance_beats: 24,
      });
    });

    it('does not affect personalization_active — resonance is not a personalisation blocker', () => {
      const r = buildReport({ ...HEALTHY, resonance: NOT_MEASURABLE_RESONANCE }, NOW);
      expect(r.personalization_active).toBe(true);
    });

    it('surfaces the full by_topic figures on the report, additively, next to the signal', () => {
      const r = buildReport(HEALTHY, NOW);
      expect(r.resonance).toEqual(HEALTHY.resonance);
      expect(r.resonance.by_topic).toEqual([
        { topic: 'linear-algebra', concepts_with_hook: 26, concepts_with_beats: 26, concepts_with_trap_beat: 26, concepts_with_stance_beats: 26 },
      ]);
    });
  });
});

describe('computeStanceFigures — pure figure computation', () => {
  const narrativeAtoms = (variants: { shaken?: boolean; assured?: boolean } = {}) => [
    { atom_type: 'hook', stance_variants: variants.shaken || variants.assured ? {
      ...(variants.shaken ? { shaken: 'body' } : {}),
      ...(variants.assured ? { assured: 'body' } : {}),
    } : undefined },
  ];

  it('is 0-of-0 when no topic has opted in, even with a large corpus', () => {
    const concepts: StanceFigureConcept[] = [
      { id: 'a', topic: 'calculus', atoms: narrativeAtoms({ shaken: true, assured: true }) },
      { id: 'b', topic: 'linear-algebra', atoms: narrativeAtoms() },
    ];
    const out = computeStanceFigures({ concepts, topicsWithStances: new Set() });
    expect(out.stance_rollout_total).toBe(0);
    expect(out.stance_rollout_covered).toBe(0);
    expect(out.stance_course_total).toBe(2);
    expect(out.stance_course_covered).toBe(1);
  });

  it('rollout is a subset of course-wide and can differ from it during a partial rollout', () => {
    const concepts: StanceFigureConcept[] = [
      { id: 'a', topic: 'calculus', atoms: narrativeAtoms({ shaken: true, assured: true }) },
      { id: 'b', topic: 'calculus', atoms: narrativeAtoms() }, // opted in, not yet covered
      { id: 'c', topic: 'linear-algebra', atoms: narrativeAtoms({ shaken: true, assured: true }) }, // not opted in
    ];
    const out = computeStanceFigures({ concepts, topicsWithStances: new Set(['calculus']) });
    expect(out.stance_rollout_total).toBe(2); // a, b — calculus only
    expect(out.stance_rollout_covered).toBe(1); // a only
    expect(out.stance_course_total).toBe(3); // a, b, c
    expect(out.stance_course_covered).toBe(2); // a, c
  });

  it('excludes concepts with no authored atoms from both denominators', () => {
    const concepts: StanceFigureConcept[] = [{ id: 'empty', topic: 'calculus', atoms: [] }];
    const out = computeStanceFigures({ concepts, topicsWithStances: new Set(['calculus']) });
    expect(out.stance_course_total).toBe(0);
    expect(out.stance_rollout_total).toBe(0);
  });

  it('does not count a concept as covered when only one stance is authored', () => {
    const concepts: StanceFigureConcept[] = [
      { id: 'half', topic: 'calculus', atoms: narrativeAtoms({ shaken: true }) },
    ];
    const out = computeStanceFigures({ concepts, topicsWithStances: new Set(['calculus']) });
    expect(out.stance_rollout_covered).toBe(0);
    expect(out.stance_course_covered).toBe(0);
  });

  it('a concept with no topic mapping never counts toward rollout', () => {
    const concepts: StanceFigureConcept[] = [
      { id: 'orphan', topic: undefined, atoms: narrativeAtoms({ shaken: true, assured: true }) },
    ];
    const out = computeStanceFigures({ concepts, topicsWithStances: new Set(['calculus']) });
    expect(out.stance_rollout_total).toBe(0);
    expect(out.stance_course_total).toBe(1);
    expect(out.stance_course_covered).toBe(1);
  });
});

describe('computeResonanceFigures — pure figure computation (plan §W5)', () => {
  /** A parseSpec test double. Returns ok:true for `simulation` fixtures matching FIXTURE, else 'no fence'. */
  function fakeParser(specsByContent: Map<string, ParseInteractiveSpecResult>): ParseInteractiveSpecFn {
    return (body: string) => specsByContent.get(body) ?? { ok: false, reason: 'no interactive-spec block' };
  }

  const hookAtom = (content: string) => [{ atom_type: 'hook', content }];

  const BEATS_WITH_TRAP_AND_STANCE = 'BEATS_WITH_TRAP_AND_STANCE';
  const BEATS_NO_TRAP_NO_STANCE = 'BEATS_NO_TRAP_NO_STANCE';
  const NO_FENCE = 'NO_FENCE';
  const MANIPULABLE_FENCE = 'MANIPULABLE_FENCE';

  const specs = new Map<string, ParseInteractiveSpecResult>([
    [
      BEATS_WITH_TRAP_AND_STANCE,
      {
        ok: true,
        body_without_spec: '',
        spec: {
          kind: 'simulation',
          narration_steps: [
            { at_progress: 0, text: 'Start.' },
            {
              at_progress: 0.5,
              text: 'Watch it scale.',
              text_shaken: 'Watch the arrow grow.',
              text_assured: 'This is where the condition stops being sufficient.',
              trap: { text: 'Students read the 2 as scaling both axes.', avoid: 'Match each entry to its own axis.' },
            },
          ],
        },
      },
    ],
    [
      BEATS_NO_TRAP_NO_STANCE,
      {
        ok: true,
        body_without_spec: '',
        spec: {
          kind: 'simulation',
          narration_steps: [{ at_progress: 0, text: 'Start.' }, { at_progress: 1, text: 'Done.' }],
        },
      },
    ],
    [
      MANIPULABLE_FENCE,
      { ok: true, body_without_spec: '', spec: { kind: 'manipulable', inputs: [], outputs: [] } },
    ],
  ]);

  it('counts a hook with a beats simulation, its trap beat, and its per-stance text', () => {
    const concepts: ResonanceFigureConcept[] = [
      { id: 'eigenvalues', topic: 'linear-algebra', atoms: hookAtom(BEATS_WITH_TRAP_AND_STANCE) },
    ];
    const out = computeResonanceFigures({ concepts, parseSpec: fakeParser(specs) });
    expect(out.concepts_with_hook).toBe(1);
    expect(out.concepts_with_beats).toBe(1);
    expect(out.concepts_with_trap_beat).toBe(1);
    expect(out.concepts_with_stance_beats).toBe(1);
    expect(out.by_topic).toEqual([
      { topic: 'linear-algebra', concepts_with_hook: 1, concepts_with_beats: 1, concepts_with_trap_beat: 1, concepts_with_stance_beats: 1 },
    ]);
  });

  it('counts a beats hook with neither trap nor stance text as beats-only', () => {
    const concepts: ResonanceFigureConcept[] = [
      { id: 'limits', topic: 'calculus', atoms: hookAtom(BEATS_NO_TRAP_NO_STANCE) },
    ];
    const out = computeResonanceFigures({ concepts, parseSpec: fakeParser(specs) });
    expect(out.concepts_with_beats).toBe(1);
    expect(out.concepts_with_trap_beat).toBe(0);
    expect(out.concepts_with_stance_beats).toBe(0);
  });

  it('counts a concept with a hook but no fence toward the denominator only', () => {
    const concepts: ResonanceFigureConcept[] = [
      { id: 'vector-spaces', topic: 'linear-algebra', atoms: hookAtom(NO_FENCE) },
    ];
    const out = computeResonanceFigures({ concepts, parseSpec: fakeParser(specs) });
    expect(out.concepts_with_hook).toBe(1);
    expect(out.concepts_with_beats).toBe(0);
  });

  it('a non-simulation interactive-spec (manipulable) never counts as beats', () => {
    const concepts: ResonanceFigureConcept[] = [
      { id: 'x', topic: 'linear-algebra', atoms: hookAtom(MANIPULABLE_FENCE) },
    ];
    const out = computeResonanceFigures({ concepts, parseSpec: fakeParser(specs) });
    expect(out.concepts_with_beats).toBe(0);
  });

  it('excludes concepts with no authored hook atom from every count', () => {
    const concepts: ResonanceFigureConcept[] = [{ id: 'no-hook', topic: 'linear-algebra', atoms: [] }];
    const out = computeResonanceFigures({ concepts, parseSpec: fakeParser(specs) });
    expect(out.concepts_with_hook).toBe(0);
    expect(out.by_topic).toEqual([]);
  });

  it('a concept with no topic mapping is counted overall but never in by_topic', () => {
    const concepts: ResonanceFigureConcept[] = [
      { id: 'orphan', topic: undefined, atoms: hookAtom(BEATS_WITH_TRAP_AND_STANCE) },
    ];
    const out = computeResonanceFigures({ concepts, parseSpec: fakeParser(specs) });
    expect(out.concepts_with_hook).toBe(1);
    expect(out.concepts_with_beats).toBe(1);
    expect(out.by_topic).toEqual([]);
  });

  it('sorts by_topic by topic slug', () => {
    const concepts: ResonanceFigureConcept[] = [
      { id: 'a', topic: 'z-topic', atoms: hookAtom(NO_FENCE) },
      { id: 'b', topic: 'a-topic', atoms: hookAtom(NO_FENCE) },
    ];
    const out = computeResonanceFigures({ concepts, parseSpec: fakeParser(specs) });
    expect(out.by_topic!.map((t) => t.topic)).toEqual(['a-topic', 'z-topic']);
  });

  it('aggregates multiple concepts on the same topic', () => {
    const concepts: ResonanceFigureConcept[] = [
      { id: 'a', topic: 'linear-algebra', atoms: hookAtom(BEATS_WITH_TRAP_AND_STANCE) },
      { id: 'b', topic: 'linear-algebra', atoms: hookAtom(NO_FENCE) },
    ];
    const out = computeResonanceFigures({ concepts, parseSpec: fakeParser(specs) });
    expect(out.by_topic).toEqual([
      { topic: 'linear-algebra', concepts_with_hook: 2, concepts_with_beats: 1, concepts_with_trap_beat: 1, concepts_with_stance_beats: 1 },
    ]);
  });
});

describe('countFilesRecursive — the rejected-drafts count', () => {
  it('returns 0 for a directory that does not exist, not an error', () => {
    expect(countFilesRecursive(path.join(os.tmpdir(), 'vidhya-test-does-not-exist-' + Date.now()))).toBe(0);
  });

  it('counts files recursively, ignoring directories themselves', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vidhya-variant-drafts-'));
    try {
      fs.writeFileSync(path.join(dir, 'a.md'), 'x');
      const sub = path.join(dir, 'eigenvalues');
      fs.mkdirSync(sub);
      fs.writeFileSync(path.join(sub, 'b.md'), 'x');
      fs.writeFileSync(path.join(sub, 'c.md'), 'x');
      expect(countFilesRecursive(dir)).toBe(3);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
