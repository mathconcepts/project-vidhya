import { describe, it, expect } from 'vitest';
import { suggestForExperiment, type ExperimentSummary } from '../ledger-suggestions';

const base = (over: Partial<ExperimentSummary> = {}): ExperimentSummary => ({
  id: 'exp-1',
  status: 'active',
  hypothesis: 'Geometric framing for limits beats algebraic',
  lift_v1: null,
  lift_n: null,
  lift_p: null,
  variant_kind: 'gen_run',
  ended_at: null,
  ...over,
});

describe('suggestForExperiment — won', () => {
  it('returns bake_in_winner with rulesets CTA', () => {
    const s = suggestForExperiment(base({ status: 'won', lift_v1: 0.08, lift_p: 0.001, lift_n: 45 }));
    expect(s.kind).toBe('bake_in_winner');
    expect(s.message).toContain('+0.080');
    expect(s.cta?.href).toBe('/admin/rulesets');
    expect(s.cta?.prefill?.source_experiment_id).toBe('exp-1');
  });
});

describe('suggestForExperiment — lost', () => {
  it('flags arbitrator-created losers for investigation', () => {
    const s = suggestForExperiment(base({ status: 'lost', variant_kind: 'gen_run', lift_v1: -0.05, lift_p: 0.01, lift_n: 40 }));
    expect(s.kind).toBe('investigate_loser');
    expect(s.message).toContain('arbitrator');
    expect(s.cta?.href).toBe('/admin/decisions');
  });

  it('does not flag template-only losers (no CTA)', () => {
    const s = suggestForExperiment(base({ status: 'lost', variant_kind: 'flag', lift_v1: -0.05, lift_p: 0.01, lift_n: 40 }));
    expect(s.kind).toBe('investigate_loser');
    expect(s.message).toContain('Auto-demoted');
    expect(s.cta).toBeUndefined();
  });
});

describe('suggestForExperiment — inconclusive', () => {
  it('says wait when n < threshold and recent', () => {
    const s = suggestForExperiment(base({ status: 'inconclusive', lift_n: 12, lift_v1: 0.01, lift_p: 0.4, ended_at: new Date().toISOString() }));
    expect(s.kind).toBe('wait_for_signal');
  });

  it('says expand when stale (>14d) and still under threshold', () => {
    const oldEnded = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    const s = suggestForExperiment(base({ status: 'inconclusive', lift_n: 8, lift_v1: 0.0, lift_p: 0.5, ended_at: oldEnded }));
    expect(s.kind).toBe('expand_run_count');
    expect(s.message).toMatch(/n=8/);
  });

  it('says no_action when n large but signal genuinely flat', () => {
    const s = suggestForExperiment(base({ status: 'inconclusive', lift_n: 80, lift_v1: 0.005, lift_p: 0.7 }));
    expect(s.kind).toBe('no_action');
    expect(s.message).toContain('Genuinely');
  });
});

describe('suggestForExperiment — aborted', () => {
  it('returns fund_resume', () => {
    const s = suggestForExperiment(base({ status: 'aborted' }));
    expect(s.kind).toBe('fund_resume');
    expect(s.cta?.href).toBe('/admin/content-rd');
  });
});

describe('suggestForExperiment — active', () => {
  it('celebrate when trending win with sufficient n', () => {
    const s = suggestForExperiment(base({ status: 'active', lift_v1: 0.07, lift_n: 35 }));
    expect(s.kind).toBe('celebrate');
  });

  it('warn when trending loss with sufficient n', () => {
    const s = suggestForExperiment(base({ status: 'active', lift_v1: -0.04, lift_n: 35 }));
    expect(s.kind).toBe('investigate_loser');
  });

  it('no_action while still small-n', () => {
    const s = suggestForExperiment(base({ status: 'active', lift_v1: 0.1, lift_n: 5 }));
    expect(s.kind).toBe('no_action');
  });
});

describe('suggestForExperiment — determinism', () => {
  it('same input → same output', () => {
    const inp = base({ status: 'won', lift_v1: 0.08, lift_p: 0.001, lift_n: 45 });
    const a = suggestForExperiment(inp);
    const b = suggestForExperiment(inp);
    expect(a).toEqual(b);
  });
});
