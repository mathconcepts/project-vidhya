import { describe, it, expect } from 'vitest';
import {
  estimatePracticeItemCostUsd,
  estimatePracticeItemCostBreakdownUsd,
  estimatePracticeItemBatchCostUsd,
  estimatePracticeItemBatchBreakdownUsd,
} from '../cost';

describe('estimatePracticeItemCostBreakdownUsd', () => {
  it('is positive for every format', () => {
    for (const format of ['mcq', 'msq', 'nat'] as const) {
      expect(estimatePracticeItemCostUsd(format)).toBeGreaterThan(0);
    }
  });

  it('nat prices in a Wolfram call, not a second LLM generation call', () => {
    const nat = estimatePracticeItemCostBreakdownUsd('nat');
    const mcq = estimatePracticeItemCostBreakdownUsd('mcq');
    // Same generation cost (same model, same token budget); verification differs.
    expect(nat.generation_usd).toBeCloseTo(mcq.generation_usd, 10);
    expect(nat.verification_usd).not.toBeCloseTo(mcq.verification_usd, 6);
  });

  it('mcq and msq price identically (both go through dual-model consensus)', () => {
    expect(estimatePracticeItemCostUsd('mcq')).toBe(estimatePracticeItemCostUsd('msq'));
  });

  it('total_usd is generation + verification', () => {
    const b = estimatePracticeItemCostBreakdownUsd('mcq');
    expect(b.total_usd).toBeCloseTo(b.generation_usd + b.verification_usd, 10);
  });

  it('an unrecognized model id prices at $0 (unknown-model fallback), never throws', () => {
    expect(() => estimatePracticeItemCostUsd('mcq', 'not-a-real-model')).not.toThrow();
    expect(estimatePracticeItemCostUsd('mcq', 'not-a-real-model')).toBe(0);
  });
});

describe('estimatePracticeItemBatchCostUsd / estimatePracticeItemBatchBreakdownUsd', () => {
  it('sums per-item costs across a mixed mode mix', () => {
    const specs = [{ format: 'mcq' as const }, { format: 'nat' as const }, { format: 'msq' as const }];
    const total = estimatePracticeItemBatchCostUsd(specs);
    const expected =
      estimatePracticeItemCostUsd('mcq') + estimatePracticeItemCostUsd('nat') + estimatePracticeItemCostUsd('msq');
    expect(total).toBeCloseTo(expected, 10);
  });

  it('is 0 for an empty spec list', () => {
    expect(estimatePracticeItemBatchCostUsd([])).toBe(0);
  });

  it('breakdown totals match the summed total', () => {
    const specs = [{ format: 'mcq' as const }, { format: 'nat' as const }];
    const breakdown = estimatePracticeItemBatchBreakdownUsd(specs);
    expect(breakdown.total_usd).toBeCloseTo(estimatePracticeItemBatchCostUsd(specs), 10);
    expect(breakdown.generation_usd + breakdown.verification_usd).toBeCloseTo(breakdown.total_usd, 10);
  });

  it('scales roughly linearly with item count (order-of-magnitude sanity, per cost-meter.ts\'s own bar)', () => {
    const ten = estimatePracticeItemBatchCostUsd(Array.from({ length: 10 }, () => ({ format: 'mcq' as const })));
    const fifty = estimatePracticeItemBatchCostUsd(Array.from({ length: 50 }, () => ({ format: 'mcq' as const })));
    expect(fifty).toBeCloseTo(ten * 5, 6);
  });
});
