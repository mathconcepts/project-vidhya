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
  countFilesRecursive,
  type MaturityFacts,
  type MaturitySignal,
  type StanceFigureConcept,
} from '../admin-content-maturity-routes';
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
