/**
 * Unit tests for the suggester. Pure function over experiment rows + base
 * configs; no DB needed.
 */

import { describe, it, expect } from 'vitest';
import { suggestRuns, __testing } from '../suggester';
import type { ExperimentRow, GenerationRunConfig } from '../../experiments/types';

const { scaleConfig, invertFlags } = __testing;

function exp(over: Partial<ExperimentRow>): ExperimentRow {
  return {
    id: 'exp_x',
    name: 'X',
    exam_pack_id: 'gate-ma',
    git_sha: 'abc',
    hypothesis: null,
    variant_kind: null,
    started_at: '2026-04-25T00:00:00Z',
    ended_at: null,
    status: 'active',
    lift_v1: null,
    lift_n: null,
    lift_p: null,
    lift_updated_at: null,
    metadata: {},
    ...over,
  };
}

const baseCfg: GenerationRunConfig = {
  target: { topic_id: 'linear-algebra' },
  pipeline: {
    llm_models: ['gemini-2.5-flash'],
    pyq_grounding: true,
    multi_llm_consensus: false,
  },
  verification: { tier_ceiling: 'wolfram', gemini_dual_solve: true },
  quota: { count: 50, max_cost_usd: 5 },
};

describe('suggester.scaleConfig', () => {
  it('multiplies count + max_cost_usd by factor', () => {
    const next = scaleConfig(baseCfg, 3);
    expect(next.quota.count).toBe(150);
    expect(next.quota.max_cost_usd).toBe(15);
  });

  it('floors fractional counts and never returns < 1', () => {
    const next = scaleConfig({ ...baseCfg, quota: { count: 1, max_cost_usd: 0.1 } }, 0.4);
    expect(next.quota.count).toBeGreaterThanOrEqual(1);
  });
});

describe('suggester.invertFlags', () => {
  it('flips pyq_grounding + multi_llm_consensus + gemini_dual_solve', () => {
    const next = invertFlags(baseCfg)!;
    expect(next.pipeline.pyq_grounding).toBe(false);
    expect(next.pipeline.multi_llm_consensus).toBe(true);
    expect(next.verification.gemini_dual_solve).toBe(false);
  });

  it('returns null when no toggleable knobs are set', () => {
    const stripped: GenerationRunConfig = {
      target: {},
      pipeline: {},
      verification: { tier_ceiling: 'rag' },
      quota: { count: 1, max_cost_usd: 1 },
    };
    expect(invertFlags(stripped)).toBeNull();
  });
});

describe('suggester.suggestRuns', () => {
  const baseConfigs = new Map([['exp_x', baseCfg]]);

  it('emits CONFIRM_WIN for promising small-n experiments', () => {
    const out = suggestRuns([exp({ id: 'exp_x', lift_v1: 0.08, lift_n: 18, lift_p: 0.07 })], baseConfigs);
    expect(out.length).toBe(1);
    expect(out[0].id).toBe('sugg_confirm_exp_x');
    expect(out[0].config.quota.count).toBe(150); // 50 × 3
  });

  it('emits RIDE_WIN for confirmed winners', () => {
    const out = suggestRuns([exp({ id: 'exp_x', lift_v1: 0.10, lift_n: 60, lift_p: 0.01 })], baseConfigs);
    expect(out.length).toBe(1);
    expect(out[0].id).toBe('sugg_ride_exp_x');
    expect(out[0].config.quota.count).toBe(250); // 50 × 5
  });

  it('emits RECOVER_LOSS for confirmed losers', () => {
    const out = suggestRuns([exp({ id: 'exp_x', lift_v1: -0.05, lift_n: 60, lift_p: 0.01 })], baseConfigs);
    expect(out.length).toBe(1);
    expect(out[0].id).toBe('sugg_revert_exp_x');
    expect(out[0].config.pipeline.pyq_grounding).toBe(false); // inverted
  });

  it('emits NOTHING for inconclusive experiments (lift in deadband)', () => {
    const out = suggestRuns([exp({ id: 'exp_x', lift_v1: 0.01, lift_n: 60, lift_p: 0.40 })], baseConfigs);
    expect(out).toEqual([]);
  });

  it('skips experiments without a base config', () => {
    const out = suggestRuns(
      [exp({ id: 'exp_y', lift_v1: 0.10, lift_n: 60, lift_p: 0.01 })],
      new Map(), // no base config for exp_y
    );
    expect(out).toEqual([]);
  });

  it('skips experiments with missing lift / n / p', () => {
    const out = suggestRuns(
      [exp({ id: 'exp_x', lift_v1: null, lift_n: 60, lift_p: 0.01 })],
      baseConfigs,
    );
    expect(out).toEqual([]);
  });
});
