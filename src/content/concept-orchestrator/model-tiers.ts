/**
 * Which model generates which atom.
 *
 * Generation used one model for every atom type. That is wasteful in both
 * directions: a retrieval prompt is a formatting job that does not need a
 * reasoning model, and a worked example is a reasoning job that should not be
 * done by the cheapest thing available.
 *
 * Two tiers, assigned by what the atom actually demands:
 *
 *   **thinking**    — the maths has to be right, and being wrong is expensive.
 *                     Definitions, worked solutions, exercises with answers.
 *   **formatting**  — the shape matters more than the reasoning. Hooks,
 *                     mnemonics, retrieval prompts, trap lists.
 *
 * ── The dividing line ───────────────────────────────────────────────────
 *
 * The classification is not a guess. `requiresConsensus()` already names
 * `formal_definition` and `worked_example` as the atoms worth spending a
 * second model on to cross-check, which is the codebase's existing statement
 * about where correctness is load-bearing. Every consensus atom is a thinking
 * atom here, and a test enforces that so the two cannot drift apart.
 *
 * `micro_exercise` is thinking without being a consensus atom: it ships an
 * expected answer a student is marked against, so a wrong one is a wrong mark.
 * `intuition` and `visual_analogy` are thinking too — an analogy that is
 * subtly wrong teaches a misconception that is harder to remove than absence.
 *
 * ── Operator control ────────────────────────────────────────────────────
 *
 * The tier→model mapping is per-run, chosen in the RunLauncher, so changing it
 * needs no redeploy and no config edit. The defaults below are the fallback
 * when a run says nothing.
 *
 * Deliberately NOT operator-editable: which TIER an atom type belongs to.
 * That is a correctness judgement, and letting a run put `worked_example` on
 * the cheap tier to save a few cents is exactly the saving that shows up later
 * as a wrong answer in front of a student.
 */

import type { AtomType } from '../content-types';
import { requiresConsensus } from './multi-llm-consensus';

export type ModelTier = 'thinking' | 'formatting';

/**
 * Atom type → tier. Exhaustive over AtomType by construction: the Record type
 * makes a new atom type a compile error rather than a silent default, because
 * silently defaulting a new reasoning atom to the cheap tier is the failure
 * this map exists to prevent.
 */
export const TIER_BY_ATOM_TYPE: Record<AtomType, ModelTier> = {
  // Correctness is load-bearing.
  formal_definition: 'thinking',
  worked_example: 'thinking',
  micro_exercise: 'thinking',
  interleaved_drill: 'thinking',
  intuition: 'thinking',
  visual_analogy: 'thinking',
  // Shape and phrasing carry these.
  hook: 'formatting',
  common_traps: 'formatting',
  retrieval_prompt: 'formatting',
  mnemonic: 'formatting',
  exam_pattern: 'formatting',
};

/**
 * Defaults when a run does not specify.
 *
 * Sonnet, not Opus: no Opus model is configured in config/providers.yaml
 * (Anthropic there is claude-sonnet-4-5 and claude-haiku-4-5), and naming one
 * that the provider registry cannot resolve throws ModelRetiredError at
 * generation time. When an Opus id is added to providers.yaml this becomes a
 * one-line change, or a per-run selection with no change at all.
 */
export const DEFAULT_TIER_MODELS: Record<ModelTier, string> = {
  thinking: 'claude-sonnet-4-5',
  formatting: 'claude-haiku-4-5',
};

export type TierModels = Partial<Record<ModelTier, string>>;

export function tierFor(atomType: AtomType): ModelTier {
  // A type the map has not been updated for is treated as thinking. Falling
  // back to the cheaper tier would be the wrong direction to be wrong in.
  return TIER_BY_ATOM_TYPE[atomType] ?? 'thinking';
}

/**
 * The model that should generate this atom.
 *
 * `explicitModelId` is the legacy single-model override. When a caller names
 * one model it still wins for everything — that is the pre-tier behaviour, and
 * a run that pins a model is making a deliberate statement about the whole
 * batch.
 */
export function resolveModelForAtom(
  atomType: AtomType,
  opts: { tierModels?: TierModels; explicitModelId?: string } = {},
): string {
  if (opts.explicitModelId) return opts.explicitModelId;
  const tier = tierFor(atomType);
  return opts.tierModels?.[tier] ?? DEFAULT_TIER_MODELS[tier];
}

/**
 * Validate an operator-supplied mapping.
 *
 * Unknown tiers are dropped rather than passed through: an unrecognised key
 * would silently do nothing, and a run that believes it selected a model but
 * did not is worse than one that is told its input was ignored.
 */
export function sanitiseTierModels(input: unknown): { models: TierModels; warnings: string[] } {
  const models: TierModels = {};
  const warnings: string[] = [];
  if (!input || typeof input !== 'object') return { models, warnings };
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (k !== 'thinking' && k !== 'formatting') {
      warnings.push(`unknown model tier "${k}" ignored`);
      continue;
    }
    if (typeof v !== 'string' || !v.trim()) {
      warnings.push(`tier "${k}" has no usable model id; falling back to the default`);
      continue;
    }
    models[k] = v.trim();
  }
  return { models, warnings };
}

/** Every consensus atom must be a thinking atom. Exported for the test. */
export function consensusAtomsAreThinking(types: AtomType[]): boolean {
  return types.filter(requiresConsensus).every((t) => tierFor(t) === 'thinking');
}
