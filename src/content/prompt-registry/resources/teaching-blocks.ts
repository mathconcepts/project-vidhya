/**
 * src/content/prompt-registry/resources/teaching-blocks.ts
 *
 * Registers Vidhya's existing 'teaching_function'-shaped prompt blocks —
 * pain-point steering, pedagogy-pattern directives, and resonance-beat
 * scripting — as PromptResources. Each wraps an existing function
 * unchanged; nothing here reimplements generation logic.
 */

import { buildPainPointPromptBlock } from '../../../registry/pain-points';
import { buildPatternPromptBlock } from '../../../registry/pedagogy-patterns';
import { resonanceStrategyFor, type ResonanceStrategy } from '../../resonance-strategy';
import type { PromptResource, PromptResourceBuildArgs } from '../types';
import { registerPromptResource } from '../registry';

export const painPointResource: PromptResource = {
  resource_id: 'teach.pain_point_block',
  version: '1.0.0',
  category: 'teaching_function',
  topics: ['*'],
  required_inputs: ['topic_family', 'concept_id'],
  outputs: ['pain_point_steering_block'],
  approval_state: 'released',
  evidence_requirements: ['reviewed pain-point registry entry (data/registry/pain-points/<module>.yml)'],
  compatibility: [],
  rollback_target: null,
  test_fixtures: ['returns "" for an unmapped module', 'returns the top-severity pain points for a reviewed concept'],
  build(args: PromptResourceBuildArgs): string {
    return buildPainPointPromptBlock(args.topic_family, args.concept_id);
  },
};

export const pedagogyPatternResource: PromptResource = {
  resource_id: 'teach.pedagogy_pattern_block',
  version: '1.0.0',
  category: 'teaching_function',
  topics: ['*'],
  required_inputs: ['topic_family'],
  outputs: ['pedagogy_pattern_directives_block'],
  approval_state: 'released',
  evidence_requirements: ['active pattern in data/registry/pedagogy-patterns.yml'],
  compatibility: [],
  rollback_target: null,
  test_fixtures: ['returns "" for a module with no active patterns', 'returns directives for ped_method_selector on its applicable modules'],
  build(args: PromptResourceBuildArgs): string {
    return buildPatternPromptBlock(args.topic_family);
  },
};

/**
 * Beat-scripting instruction, unchanged from orchestrator.ts's prior
 * inline buildResonanceBlock() — moved here verbatim, not rewritten.
 */
function buildResonanceBlock(strategy: ResonanceStrategy | null): string {
  const strategyLines = strategy
    ? `Per-topic attention strategy (founder's content-generation spec, ${strategy.atomic_ids.join('+')}): recommended hooks — ${strategy.recommended_hooks.join('; ')}. Attention-design hypothesis: ${strategy.attention_design_hypothesis}\n\n`
    : '';

  return `${strategyLines}Fuse this into one experience instead of a static learning beat: emit a fenced \`\`\`interactive-spec\`\`\` block with a "simulation" spec carrying 3-5 narration_steps beats synced to at_progress (0..1). Exactly ONE beat must carry a "trap" woven from this concept's top pain point (see the pain-point block above — cite it, do not invent a new mistake): {"text": "what students get wrong", "avoid": "the one-line fix"}. Give per-stance beat text where it earns its keep (text_shaken / text_assured; base text is the fallback for a steady reader) and an optional top-level "ghost" parametric path for the mistaken route. Third person only in the trap ("students read the 2 as…"), never "you might…". Schema example:

\`\`\`interactive-spec
{"v":1,"kind":"simulation","title":"...","x_expr":"...","y_expr":"...","t_min":0,"t_max":1,"narration_steps":[{"at_progress":0,"text":"..."},{"at_progress":0.5,"text":"...","text_shaken":"...","text_assured":"...","trap":{"text":"Students read the 2 as scaling both axes.","avoid":"Match each diagonal entry to its own axis before writing anything."}}],"ghost":{"x_expr":"...","y_expr":"..."}}
\`\`\`

`;
}

/**
 * Resonance-eligible atom types + generation context — batch-only gate
 * preserved exactly (P0 eng-review finding: an unreviewed trap/ghost path
 * reaching a struggling student via personalized-regen is the harm this
 * gate exists to prevent).
 */
export const resonanceResource: PromptResource = {
  resource_id: 'teach.resonance_beat_block',
  version: '1.0.0',
  category: 'teaching_function',
  topics: ['*'],
  required_inputs: ['concept_id', 'atom_type', 'generation_context'],
  outputs: ['resonance_beat_scripting_block'],
  approval_state: 'released',
  evidence_requirements: ['atomic-concept-map.ts crosswalk resolves an atomic_id for the concept (optional — strategy block is additive, not required)'],
  compatibility: [],
  rollback_target: null,
  test_fixtures: [
    'a hook/intuition atom in batch context gets the beat-scripting instruction',
    'a hook/intuition atom in personalized context gets nothing (P0 eng-review guard)',
    'a non-beat atom type gets nothing regardless of context',
  ],
  build(args: PromptResourceBuildArgs): string {
    const isBeatAtom = args.atom_type === 'hook' || args.atom_type === 'intuition';
    const eligible = isBeatAtom && (args.generation_context ?? 'batch') === 'batch';
    if (!eligible) return '';
    return buildResonanceBlock(resonanceStrategyFor(args.concept_id));
  },
};

export function registerTeachingBlockResources(): void {
  registerPromptResource(painPointResource);
  registerPromptResource(pedagogyPatternResource);
  registerPromptResource(resonanceResource);
}
