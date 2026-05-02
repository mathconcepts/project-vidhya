/**
 * Unit tests for the cost meter. No DB needed.
 */

import { describe, it, expect } from 'vitest';
import { CostMeter, RunBudgetExceeded, priceForCall, PRICING_VERSION } from '../cost-meter';

describe('priceForCall', () => {
  it('prices Gemini 2.5 Flash correctly', () => {
    // 1M input + 1M output of gemini-2.5-flash
    const cost = priceForCall({
      model: 'gemini-2.5-flash',
      input_tokens: 1_000_000,
      output_tokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(0.075 + 0.3, 4);
  });

  it('returns 0 for unknown models (no double-billing)', () => {
    expect(priceForCall({ model: 'gpt-99-turbo', input_tokens: 1_000_000 })).toBe(0);
  });

  it('honors flat_usd override', () => {
    expect(priceForCall({ model: 'whatever', flat_usd: 0.42 })).toBe(0.42);
  });

  it('charges Wolfram a flat per-call rate', () => {
    expect(priceForCall({ model: 'wolfram' })).toBeGreaterThan(0);
  });
});

describe('CostMeter', () => {
  it('accumulates total cost across calls', () => {
    const meter = new CostMeter({ max_cost_usd: 100 });
    meter.add({ model: 'gemini-2.5-flash', input_tokens: 1000, output_tokens: 500 });
    meter.add({ model: 'gemini-2.5-flash', input_tokens: 2000, output_tokens: 1000 });
    expect(meter.callCount()).toBe(2);
    expect(meter.totalUsd()).toBeGreaterThan(0);
  });

  it('throws RunBudgetExceeded when cap is breached', () => {
    const meter = new CostMeter({ max_cost_usd: 0.0001 });
    expect(() =>
      meter.add({ model: 'claude-opus-4-7', input_tokens: 1_000_000, output_tokens: 1_000_000 }),
    ).toThrow(RunBudgetExceeded);
  });

  it('exposes per-model breakdown', () => {
    const meter = new CostMeter({ max_cost_usd: 100 });
    meter.add({ model: 'gemini-2.5-flash', input_tokens: 1000 });
    meter.add({ model: 'gpt-4o', input_tokens: 1000 });
    const breakdown = meter.breakdown();
    expect(breakdown['gemini-2.5-flash']).toBeGreaterThan(0);
    expect(breakdown['gpt-4o']).toBeGreaterThan(0);
  });

  it('reports remaining budget', () => {
    const meter = new CostMeter({ max_cost_usd: 1 });
    meter.add({ model: 'gemini-2.5-flash', input_tokens: 1000, output_tokens: 1000 });
    expect(meter.remaining()).toBeGreaterThan(0);
    expect(meter.remaining()).toBeLessThanOrEqual(1);
  });
});

describe('PRICING_VERSION', () => {
  it('is a non-empty string', () => {
    expect(typeof PRICING_VERSION).toBe('string');
    expect(PRICING_VERSION.length).toBeGreaterThan(0);
  });
});
