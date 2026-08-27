/**
 * src/generation/dry-run.ts
 *
 * Predicts the cost + duration of a GenerationRun without spending tokens.
 * Surfaced in the admin RunLauncher UI so the operator can see "this run
 * will cost ~$3.40 over ~12 minutes" before clicking Launch.
 *
 * Estimates use:
 *   1. Average tokens per generation call from prompt_pattern_stats
 *      (migration 017) when available.
 *   2. Conservative defaults otherwise.
 *
 * The estimate is intentionally rough — within 30% is good enough. Its
 * job is to catch order-of-magnitude blunders (operator typed 10000 atoms
 * instead of 100), not to replace actual cost tracking.
 */

import { priceForCall } from './cost-meter';
import { estimatePracticeItemBatchBreakdownUsd } from './practice-item-factory/cost';
import type { GenerationRunConfig } from '../experiments/types';
import { loadLlmConfig } from '../llm/registry';

// Heuristic averages for one atom + one verification pass.
// Refined automatically if prompt_pattern_stats is queryable later.
const DEFAULT_TOKENS_PER_GENERATION = {
  input: 1500, // problem prompt + template
  output: 800, // problem + 4 distractors + solution steps
};
const DEFAULT_TOKENS_PER_VERIFICATION = {
  input: 1200,
  output: 400,
};

const DEFAULT_LATENCY_MS = {
  generation: 8000, // single LLM call
  verification_gemini: 6000,
  verification_wolfram: 1500,
  verification_rag: 50,
};

export interface CostEstimate {
  estimated_cost_usd: number;
  estimated_duration_minutes: number;
  per_artifact_usd: number;
  call_count: number;
  breakdown: {
    generation_usd: number;
    verification_usd: number;
  };
  warnings: string[];
  /** Whether the estimate is from heuristics (no historical data). */
  from_heuristics: boolean;
  /** practice-item runs only: item count per format, for the RunLauncher's estimate panel. */
  mode_mix?: Record<'mcq' | 'msq' | 'nat', number>;
}

export function estimateRunCost(config: GenerationRunConfig): CostEstimate {
  const specs = config.target.practice_item_specs;
  if (specs && specs.length > 0) {
    return estimatePracticeItemRunCost(config, specs);
  }

  const warnings: string[] = [];
  const count = Math.max(1, config.quota.count);

  const genModel = pickGenerationModel(config);
  const verificationCost = perArtifactVerificationUsd(config);
  const generationCost = priceForCall({
    model: genModel,
    input_tokens: DEFAULT_TOKENS_PER_GENERATION.input,
    output_tokens: DEFAULT_TOKENS_PER_GENERATION.output,
  });

  const perArtifact = generationCost + verificationCost;
  const totalUsd = perArtifact * count;

  // Latency: rough wall-clock with parallelism cap of 5
  const perArtifactMs =
    DEFAULT_LATENCY_MS.generation + perArtifactVerificationLatencyMs(config);
  const wallMs = (count / 5) * perArtifactMs;
  const minutes = wallMs / 60000;

  // Warnings
  if (totalUsd > config.quota.max_cost_usd) {
    warnings.push(
      `Estimated cost ($${totalUsd.toFixed(2)}) exceeds the $${config.quota.max_cost_usd.toFixed(2)} cap. ` +
        `Run will abort partway. Reduce count or raise cap.`,
    );
  }
  if (count > 200) {
    warnings.push(
      `${count} artifacts is a large batch. Consider splitting across multiple runs to gather lift signal at smaller n.`,
    );
  }
  if (config.verification.tier_ceiling === 'rag') {
    warnings.push(
      `RAG-only verification: ~30% of generated problems will be unverified and skipped.`,
    );
  }

  return {
    estimated_cost_usd: totalUsd,
    estimated_duration_minutes: minutes,
    per_artifact_usd: perArtifact,
    call_count: count * (1 + verificationCallCount(config)),
    breakdown: {
      generation_usd: generationCost * count,
      verification_usd: verificationCost * count,
    },
    warnings,
    from_heuristics: true,
  };
}

/**
 * Practice-item runs (config.target.practice_item_specs[]) cost differently
 * per item than an atom run: mode mix (mcq/msq/nat) determines whether the
 * per-item verification leg is a second LLM call (dual-model consensus) or
 * a Wolfram call, and the spec count — not quota.count, which is a separate,
 * looser cap — is the actual number of items requested. Reuses
 * estimatePracticeItemCostUsd (practice-item-factory/cost.ts) so this number
 * never drifts from the one src/generation/batch/poller.ts's orchestrator
 * uses for its own prepare()-time budget check.
 */
function estimatePracticeItemRunCost(
  config: GenerationRunConfig,
  specs: NonNullable<GenerationRunConfig['target']['practice_item_specs']>,
): CostEstimate {
  const warnings: string[] = [];
  const genModel = pickGenerationModel(config);
  const breakdown = estimatePracticeItemBatchBreakdownUsd(specs, genModel);
  const totalUsd = breakdown.total_usd;
  const perArtifact = specs.length > 0 ? totalUsd / specs.length : 0;

  // Batch generation is async (up to a 24h provider SLA) rather than the
  // synchronous per-item wall-clock the atom estimate uses — duration here
  // is deliberately not modeled as "minutes"; the operator watches
  // Active runs / the batch_state column instead.
  const minutes = 0;

  if (totalUsd > config.quota.max_cost_usd) {
    warnings.push(
      `Estimated cost ($${totalUsd.toFixed(2)}) exceeds the $${config.quota.max_cost_usd.toFixed(2)} cap. ` +
        `The batch will refuse at launch (budget_exceeded) rather than partially spend. Reduce specs or raise the cap.`,
    );
  }
  if (specs.length !== Math.max(1, config.quota.count)) {
    warnings.push(
      `quota.count (${config.quota.count}) does not match practice_item_specs.length (${specs.length}) — ` +
        `the spec count is what actually gets generated.`,
    );
  }
  if (specs.length > 200) {
    warnings.push(
      `${specs.length} items is a large batch. Consider a smaller pilot to measure verification throughput first.`,
    );
  }

  const modeCounts = { mcq: 0, msq: 0, nat: 0 };
  for (const s of specs) modeCounts[s.format] = (modeCounts[s.format] ?? 0) + 1;

  return {
    estimated_cost_usd: totalUsd,
    estimated_duration_minutes: minutes,
    per_artifact_usd: perArtifact,
    call_count: specs.length * 2, // one generation + one verification leg per item
    breakdown: {
      generation_usd: breakdown.generation_usd,
      verification_usd: breakdown.verification_usd,
    },
    warnings,
    from_heuristics: true,
    mode_mix: modeCounts,
  };
}

// ============================================================================
// Internals
// ============================================================================

function pickGenerationModel(config: GenerationRunConfig): string {
  const list = config.pipeline.llm_models;
  if (list && list.length > 0) return list[0];
  const cfg = loadLlmConfig();
  const provider = cfg.providers[cfg.defaultProvider];
  if (provider?.fallbackOrder?.[0]) {
    const model = provider.models[provider.fallbackOrder[0]];
    if (model?.id) return model.id;
  }
  return 'gemini-2.5-flash';
}

function perArtifactVerificationUsd(config: GenerationRunConfig): number {
  const tier = config.verification.tier_ceiling;
  const dual = config.verification.gemini_dual_solve ?? false;

  if (tier === 'rag') return 0;

  let usd = 0;

  // Tier 2: Gemini dual-solve
  if (tier === 'gemini' || tier === 'wolfram') {
    const calls = dual ? 2 : 1;
    usd +=
      calls *
      priceForCall({
        model: 'gemini-2.5-flash',
        input_tokens: DEFAULT_TOKENS_PER_VERIFICATION.input,
        output_tokens: DEFAULT_TOKENS_PER_VERIFICATION.output,
      });
  }

  // Tier 3: Wolfram
  if (tier === 'wolfram') {
    usd += priceForCall({ model: 'wolfram' });
  }

  return usd;
}

function perArtifactVerificationLatencyMs(config: GenerationRunConfig): number {
  const tier = config.verification.tier_ceiling;
  const dual = config.verification.gemini_dual_solve ?? false;
  let ms = DEFAULT_LATENCY_MS.verification_rag;
  if (tier === 'gemini' || tier === 'wolfram') {
    ms += DEFAULT_LATENCY_MS.verification_gemini * (dual ? 2 : 1);
  }
  if (tier === 'wolfram') {
    ms += DEFAULT_LATENCY_MS.verification_wolfram;
  }
  return ms;
}

function verificationCallCount(config: GenerationRunConfig): number {
  const tier = config.verification.tier_ceiling;
  const dual = config.verification.gemini_dual_solve ?? false;
  let n = 0;
  if (tier === 'rag') return 0;
  if (tier === 'gemini' || tier === 'wolfram') n += dual ? 2 : 1;
  if (tier === 'wolfram') n += 1;
  return n;
}
