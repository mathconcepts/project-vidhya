/**
 * Content Plan Generator
 *
 * Given a BridgeMapping, decide what content units to generate for each
 * entry based on its gap classification. The default plan is conservative
 * — admin can preview and prune before submitting the batch.
 *
 * Default content plan per gap class:
 *   aligned     -> [worked-example, stretch-problem]            (2 units)
 *   depth-gap   -> [worked-example, bridge-explainer,
 *                   stretch-problem, practice-set]              (4 units)
 *   breadth-gap -> [foundation-explainer, bridge-explainer,
 *                   stretch-problem]                            (3 units)
 *   foundation  -> [foundation-explainer, worked-example,
 *                   bridge-explainer, stretch-problem,
 *                   practice-set]                               (5 units)
 *
 * Token estimates per unit type:
 *   foundation-explainer ~800   (re-teaches the concept)
 *   worked-example       ~600   (1 problem with steps)
 *   bridge-explainer     ~900   (most important — connects TN -> JEE)
 *   stretch-problem      ~500   (1 JEE-level problem)
 *   practice-set         ~1200  (3-5 graduated problems)
 */

import type {
  BridgeMapping, BridgeMappingEntry, ContentPlan, ContentUnit, ContentUnitType,
} from './types';
import { estimateCost, BRIDGE_PROVIDER } from './pricing';

const TOKENS_PER_UNIT: Record<ContentUnitType, number> = {
  'foundation-explainer': 800,
  'worked-example':       600,
  'bridge-explainer':     900,
  'stretch-problem':      500,
  'practice-set':        1200,
};

const UNITS_BY_GAP: Record<BridgeMappingEntry['gap_class'], ContentUnitType[]> = {
  'aligned':     ['worked-example', 'stretch-problem'],
  'depth-gap':   ['worked-example', 'bridge-explainer', 'stretch-problem', 'practice-set'],
  'breadth-gap': ['foundation-explainer', 'bridge-explainer', 'stretch-problem'],
  'foundation':  ['foundation-explainer', 'worked-example', 'bridge-explainer', 'stretch-problem', 'practice-set'],
};

export function buildContentPlan(mapping: BridgeMapping): ContentPlan {
  const units: ContentUnit[] = [];

  for (const entry of mapping.entries) {
    // Skip entries that explicitly have no target — they're for completeness only
    if (entry.target_topic_ids.length === 0 && entry.difficulty_jump === 1) continue;

    const unitTypes = UNITS_BY_GAP[entry.gap_class];
    for (const unit_type of unitTypes) {
      const unit_id = `${mapping.id}--${entry.id}--${unit_type}`;
      units.push({
        unit_id,
        mapping_entry_id: entry.id,
        unit_type,
        difficulty: clampDifficulty(entry.difficulty_jump, unit_type),
        estimated_tokens: TOKENS_PER_UNIT[unit_type],
      });
    }
  }

  const total = units.reduce((s, u) => s + u.estimated_tokens, 0);
  return {
    mapping_id: mapping.id,
    units,
    total_estimated_tokens: total,
  };
}

/**
 * The same gap should produce content that ramps from gentle to JEE-level.
 * Foundation explainers start one notch easier; stretch problems use the
 * full jump. Practice sets sit in the middle to bridge the two.
 */
function clampDifficulty(jump: number, unitType: ContentUnitType): 1 | 2 | 3 | 4 | 5 {
  const base = jump as 1 | 2 | 3 | 4 | 5;
  let adjusted = base;
  if (unitType === 'foundation-explainer') adjusted = Math.max(1, base - 1) as any;
  else if (unitType === 'worked-example')  adjusted = Math.max(1, base - 1) as any;
  else if (unitType === 'practice-set')     adjusted = base;
  else if (unitType === 'bridge-explainer') adjusted = base;
  else if (unitType === 'stretch-problem')  adjusted = Math.min(5, base) as any;
  return adjusted;
}

/**
 * What this batch will cost, quoted at the rate the cap actually enforces.
 *
 * This used to hardcode $0.30/1M (Gemini Flash) while the cap charged
 * Anthropic rates, so the operator approved a number ten times smaller than
 * the one that would stop their run. Both sides now read `pricing.ts`.
 */
export function estimateCostUsd(plan: ContentPlan): number {
  return Number(estimateCost(BRIDGE_PROVIDER, plan.total_estimated_tokens).toFixed(4));
}
