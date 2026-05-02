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
import type { GenerationRunConfig } from '../experiments/types';

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
}

export function estimateRunCost(config: GenerationRunConfig): CostEstimate {
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

// ============================================================================
// Internals
// ============================================================================

function pickGenerationModel(config: GenerationRunConfig): string {
  const list = config.pipeline.llm_models;
  if (list && list.length > 0) return list[0];
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
