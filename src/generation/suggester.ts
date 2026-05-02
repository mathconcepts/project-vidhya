/**
 * src/generation/suggester.ts
 *
 * Pure-logic rules that turn a list of recently-evaluated experiments into
 * a list of suggested follow-up runs. The learnings-ledger job persists
 * these into `run_suggestions`; the admin UI shows them as an inbox; the
 * operator clicks "Launch" to promote one into a real GenerationRun.
 *
 * Why pure-logic + persisted: separation of concerns. The math + heuristics
 * live here (testable in isolation, no DB), the persistence is in the
 * caller. Same pattern as src/experiments/lift.ts.
 *
 * Sprint C v1 rules (ranked by how leveraged each is):
 *
 *   1. CONFIRM_WIN: an experiment showed lift > 0.05 AND p < 0.10 AND
 *      n in [10, 30) — promising but n too small to declare win. Suggest
 *      the same config at 3× the original count to reach n ≥ 30 confidently.
 *
 *   2. RIDE_WIN: an experiment crossed n ≥ 30 + p < 0.05 + lift > 0.05.
 *      Suggest a follow-up run targeting the SAME variant at higher count
 *      (5× original) to keep generating canonical content.
 *
 *   3. RECOVER_LOSS: an experiment lost (lift < -0.02, p < 0.05, n ≥ 30).
 *      Suggest a revert run with the OPPOSITE flag setting (e.g. if
 *      narration_enabled=true lost, suggest narration_enabled=false).
 *
 * Future v2 additions (not in this PR): concept-level lift trends, exam-pack
 * weight rebalancing, pyq-grounding/no-pyq-grounding A/B suggestions.
 */

import type { ExperimentRow, GenerationRunConfig } from '../experiments/types';

// ============================================================================
// Public API
// ============================================================================

export interface RunSuggestion {
  /** Stable id derived from the source experiment, so re-runs idempotent. */
  id: string;
  exam_pack_id: string;
  source_experiment_id: string;
  hypothesis: string;
  config: GenerationRunConfig;
  reason: string;
  expected_lift: number | null;
  expected_n: number | null;
}

export interface SuggesterOptions {
  /** Treat lift values as "win" when above this. Default 0.05. */
  win_lift_threshold?: number;
  /** Treat lift values as "loss" when below this. Default -0.02. */
  loss_lift_threshold?: number;
  /** P-value cutoff for confident decisions. Default 0.05. */
  p_threshold?: number;
  /** Loose p-value cutoff for "suggestive" lift. Default 0.10. */
  p_threshold_loose?: number;
  /** Minimum sample size for confident decisions. Default 30. */
  n_threshold?: number;
}

/**
 * Given a list of experiments, return the suggestions that should appear
 * in the admin's run-suggestion inbox. Pure function — no I/O.
 */
export function suggestRuns(
  experiments: ExperimentRow[],
  baseConfigs: Map<string, GenerationRunConfig>,
  options: SuggesterOptions = {},
): RunSuggestion[] {
  const winLift = options.win_lift_threshold ?? 0.05;
  const lossLift = options.loss_lift_threshold ?? -0.02;
  const p = options.p_threshold ?? 0.05;
  const pLoose = options.p_threshold_loose ?? 0.10;
  const nMin = options.n_threshold ?? 30;

  const out: RunSuggestion[] = [];

  for (const exp of experiments) {
    const lift = numOrNull(exp.lift_v1);
    const n = numOrNull(exp.lift_n);
    const pv = numOrNull(exp.lift_p);
    if (lift == null || n == null || pv == null) continue;

    const baseConfig = baseConfigs.get(exp.id);
    if (!baseConfig) continue;

    // RULE 1: confirm-win on a promising small-n experiment
    if (lift >= winLift && pv <= pLoose && n >= 10 && n < nMin) {
      out.push({
        id: `sugg_confirm_${exp.id}`,
        exam_pack_id: exp.exam_pack_id,
        source_experiment_id: exp.id,
        hypothesis: `Confirm: ${exp.hypothesis ?? exp.name} (n=${n} → ${n * 3})`,
        config: scaleConfig(baseConfig, 3),
        reason:
          `Lift +${lift.toFixed(3)} at n=${n} (p=${pv.toFixed(3)}). Promising but n < ${nMin}; ` +
          `3× the cohort to reach a confident decision.`,
        expected_lift: lift,
        expected_n: n,
      });
      continue;
    }

    // RULE 2: ride-win on a fully-confirmed winner
    if (lift >= winLift && pv <= p && n >= nMin && exp.status !== 'aborted') {
      out.push({
        id: `sugg_ride_${exp.id}`,
        exam_pack_id: exp.exam_pack_id,
        source_experiment_id: exp.id,
        hypothesis: `Scale: ${exp.hypothesis ?? exp.name} (5× volume)`,
        config: scaleConfig(baseConfig, 5),
        reason:
          `Confirmed winner (lift +${lift.toFixed(3)}, p=${pv.toFixed(3)}, n=${n}). ` +
          `Run 5× the volume to keep generating canonical content under the same config.`,
        expected_lift: lift,
        expected_n: n,
      });
      continue;
    }

    // RULE 3: recover-loss with the opposite flag
    if (lift <= lossLift && pv <= p && n >= nMin) {
      const reverted = invertFlags(baseConfig);
      if (reverted) {
        out.push({
          id: `sugg_revert_${exp.id}`,
          exam_pack_id: exp.exam_pack_id,
          source_experiment_id: exp.id,
          hypothesis: `Revert: opposite of ${exp.hypothesis ?? exp.name}`,
          config: reverted,
          reason:
            `Lost (lift ${lift.toFixed(3)}, p=${pv.toFixed(3)}, n=${n}). ` +
            `Try the opposite flag setting to recover the lost lift.`,
          expected_lift: -lift,
          expected_n: n,
        });
      }
    }
  }

  return out;
}

// ============================================================================
// Helpers
// ============================================================================

function numOrNull(x: unknown): number | null {
  if (x == null) return null;
  const n = typeof x === 'number' ? x : Number(x);
  return Number.isFinite(n) ? n : null;
}

function scaleConfig(base: GenerationRunConfig, factor: number): GenerationRunConfig {
  return {
    ...base,
    quota: {
      ...base.quota,
      count: Math.max(1, Math.floor(base.quota.count * factor)),
      max_cost_usd: Math.max(0.5, base.quota.max_cost_usd * factor),
    },
  };
}

/**
 * Best-effort flag inversion for revert suggestions. Inverts the most
 * commonly-tuned flags. Returns null when there's nothing inverted (e.g.
 * the base config has no toggleable knobs we recognize), which causes the
 * caller to skip the revert suggestion.
 */
function invertFlags(base: GenerationRunConfig): GenerationRunConfig | null {
  let mutated = false;
  const next: GenerationRunConfig = {
    ...base,
    pipeline: { ...base.pipeline },
    verification: { ...base.verification },
  };

  if (typeof base.pipeline.pyq_grounding === 'boolean') {
    next.pipeline.pyq_grounding = !base.pipeline.pyq_grounding;
    mutated = true;
  }
  if (typeof base.pipeline.multi_llm_consensus === 'boolean') {
    next.pipeline.multi_llm_consensus = !base.pipeline.multi_llm_consensus;
    mutated = true;
  }
  if (typeof base.verification.gemini_dual_solve === 'boolean') {
    next.verification.gemini_dual_solve = !base.verification.gemini_dual_solve;
    mutated = true;
  }

  return mutated ? next : null;
}

// Exported for tests
export const __testing = { scaleConfig, invertFlags };
