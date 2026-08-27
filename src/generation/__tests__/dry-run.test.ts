/**
 * dry-run.ts's practice-item branch (config.target.practice_item_specs[]).
 * Pins that POST /api/admin/runs/dry-run returns a real, mode-mix-aware
 * cost estimate for a practice-item run instead of the generic
 * atom-count * per-artifact heuristic, and that the run's cost cap
 * (quota.max_cost_usd) is checked against it.
 */
import { describe, it, expect } from 'vitest';
import { estimateRunCost } from '../dry-run';
import { estimatePracticeItemCostUsd } from '../practice-item-factory/cost';
import type { GenerationRunConfig } from '../../experiments/types';

function practiceItemConfig(overrides: Partial<GenerationRunConfig> = {}): GenerationRunConfig {
  return {
    target: {
      practice_item_specs: [
        { concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.5, topic: 'linear-algebra', require_failure_tags: true },
        { concept_id: 'determinants', format: 'mcq', difficulty: 0.5, topic: 'linear-algebra', require_failure_tags: true },
        { concept_id: 'rank', format: 'msq', difficulty: 0.5, topic: 'linear-algebra', require_failure_tags: true },
        { concept_id: 'trace', format: 'nat', difficulty: 0.5, topic: 'linear-algebra', require_failure_tags: true },
        { concept_id: 'inverse', format: 'nat', difficulty: 0.5, topic: 'linear-algebra', require_failure_tags: true },
      ],
    },
    pipeline: { llm_models: ['gemini-2.5-flash'] },
    verification: { tier_ceiling: 'wolfram', wolfram_required: true },
    quota: { count: 5, max_cost_usd: 5 },
    ...overrides,
  } as GenerationRunConfig;
}

describe('estimateRunCost — practice-item runs', () => {
  it('returns a positive cost derived from the actual mode mix (3 mcq/msq, 2 nat)', () => {
    const estimate = estimateRunCost(practiceItemConfig());
    expect(estimate.estimated_cost_usd).toBeGreaterThan(0);
    const expected =
      2 * estimatePracticeItemCostUsd('mcq', 'gemini-2.5-flash') +
      1 * estimatePracticeItemCostUsd('msq', 'gemini-2.5-flash') +
      2 * estimatePracticeItemCostUsd('nat', 'gemini-2.5-flash');
    expect(estimate.estimated_cost_usd).toBeCloseTo(expected, 10);
  });

  it('reports the mode_mix breakdown for the RunLauncher panel', () => {
    const estimate = estimateRunCost(practiceItemConfig());
    expect(estimate.mode_mix).toEqual({ mcq: 2, msq: 1, nat: 2 });
  });

  it('warns when the estimate exceeds quota.max_cost_usd (the cap the batch will actually enforce)', () => {
    const estimate = estimateRunCost(practiceItemConfig({ quota: { count: 5, max_cost_usd: 0.00001 } }));
    expect(estimate.warnings.some((w) => w.includes('exceeds'))).toBe(true);
    expect(estimate.warnings.some((w) => w.includes('budget_exceeded'))).toBe(true);
  });

  it('does not warn when the estimate is comfortably under the cap', () => {
    const estimate = estimateRunCost(practiceItemConfig({ quota: { count: 5, max_cost_usd: 5 } }));
    expect(estimate.warnings.some((w) => w.includes('exceeds'))).toBe(false);
  });

  it('is unaffected by verification.tier_ceiling — practice-item cost is entirely mode-mix-driven', () => {
    const wolfram = estimateRunCost(practiceItemConfig({ verification: { tier_ceiling: 'wolfram' } }));
    const rag = estimateRunCost(practiceItemConfig({ verification: { tier_ceiling: 'rag' } }));
    expect(wolfram.estimated_cost_usd).toBeCloseTo(rag.estimated_cost_usd, 10);
  });

  it('falls through to the generic atom estimator when practice_item_specs is absent', () => {
    const config: GenerationRunConfig = {
      target: { concept_ids: ['eigenvalues'] },
      pipeline: {},
      verification: { tier_ceiling: 'rag' },
      quota: { count: 10, max_cost_usd: 5 },
    };
    const estimate = estimateRunCost(config);
    expect(estimate.mode_mix).toBeUndefined();
    expect(estimate.estimated_cost_usd).toBeGreaterThan(0);
  });
});
