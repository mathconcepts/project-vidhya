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
  type MaturityFacts,
  type MaturitySignal,
} from '../admin-content-maturity-routes';

const NOW = '2026-08-16T00:00:00.000Z';

const HEALTHY: MaturityFacts = {
  database_configured: true,
  selector_gate_present: true,
  thinking_gap_total: 100,
  thinking_gap_generic: 10,
  thinking_gap_distinct_framings: 12,
  active_atom_overrides: 4,
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
      },
      NOW,
    );
    for (const s of r.signals) {
      if (s.severity !== 'healthy') {
        expect(s.remedy, `signal ${s.id} has no remedy`).toBeTruthy();
      }
    }
  });
});
