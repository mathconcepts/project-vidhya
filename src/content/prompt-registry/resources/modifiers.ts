/**
 * src/content/prompt-registry/resources/modifiers.ts
 *
 * Modifiers are delivery-only controls: they may change HOW content reads
 * (tone, register, sentence length, glossary) but never WHAT it claims
 * mathematically (canonical formula, scope, marking rule, answer key).
 * `allowed_changes`/`forbidden_changes` make that boundary an inspectable
 * fact about each modifier rather than a comment someone has to trust.
 *
 * `toneRegisterModifier` wraps the tone/register directive
 * (/investigate, 2026-09-02) verbatim — moved out of orchestrator.ts, not
 * rewritten. The uploaded Wolfram-inspired registry additionally names
 * five modifiers (visual_first, simple_words, exam_timed,
 * prerequisite_repair, hindi_glossary) that Vidhya has no dedicated
 * implementation for today — registering them at approval_state 'draft'
 * makes the gap visible and queryable (npm run content:registry-audit)
 * instead of silently absent. A 'draft' resource never resolves into a
 * live prompt (registry.ts's RESOLVABLE_APPROVAL_STATES), so this is
 * honest inventory, not a fabricated five-for-one.
 */

import type { Modifier } from '../types';
import { registerPromptResource } from '../registry';

const TONE_REGISTER_BLOCK = `Register: write for a student who gets anxious about this exam and needs the plainest possible path in. ELI5 the reasoning — explain WHY a step happens, not just that it happens. The first time you use a technical term (e.g. "Hermitian", "eigenbasis", "orthonormal"), gloss it in plain words in the same sentence before using it bare again; never introduce two new terms back to back without grounding the first one. Default to Indian English: familiar Indian-classroom phrasing and idiom (e.g. "sums" for practice problems is fine), not translated-from-American phrasing. Short sentences. No word the student would have to look up.

`;

export const toneRegisterModifier: Modifier = {
  resource_id: 'modifier.tone_register',
  version: '1.0.0',
  category: 'modifier',
  topics: ['*'],
  required_inputs: [],
  outputs: ['tone_register_block'],
  approval_state: 'released',
  evidence_requirements: [],
  compatibility: [],
  rollback_target: null,
  allowed_changes: ['lexical_complexity', 'sentence_length', 'glossary', 'register'],
  forbidden_changes: ['canonical_formula', 'scope', 'marking_rule', 'answer_key'],
  test_fixtures: ['unconditional block, identical text for every atom_type/topic_family'],
  build(): string {
    return TONE_REGISTER_BLOCK;
  },
};

/**
 * A stub modifier factory for the 5 uploaded-YAML modifiers with no
 * Vidhya implementation yet. Registered at 'draft' — build() throws if
 * ever called, since RESOLVABLE_APPROVAL_STATES already keeps draft
 * resources out of resolvePromptResources(); the throw is a second,
 * defensive line so a future bug that resolves a draft resource anyway
 * fails loudly instead of silently shipping empty/wrong prompt text.
 */
function draftModifier(
  resource_id: string,
  allowed_changes: string[],
  forbidden_changes: string[],
): Modifier {
  return {
    resource_id,
    version: '0.0.0-draft',
    category: 'modifier',
    topics: ['*'],
    required_inputs: [],
    outputs: [],
    approval_state: 'draft',
    evidence_requirements: ['named by the uploaded Wolfram-inspired registry; no Vidhya implementation yet'],
    compatibility: [],
    rollback_target: null,
    allowed_changes,
    forbidden_changes,
    test_fixtures: [],
    build(): string {
      throw new Error(`${resource_id}: draft modifier has no implementation — must not be resolved`);
    },
  };
}

export function registerModifierResources(): void {
  registerPromptResource(toneRegisterModifier);
  registerPromptResource(draftModifier('modifier.visual_first', ['representation_order', 'asset_choice', 'example_surface'], ['canonical_formula', 'scope', 'marking_rule', 'answer_key']));
  registerPromptResource(draftModifier('modifier.simple_words', ['lexical_complexity', 'sentence_length', 'glossary'], ['mathematical_precision', 'conditions']));
  registerPromptResource(draftModifier('modifier.exam_timed', ['sequence_compression', 'time_budget', 'checkpoint_frequency'], ['omit_required_conditions', 'suppress_uncertainty']));
  registerPromptResource(draftModifier('modifier.prerequisite_repair', ['attach_bridge', 'add_probe', 'reorder_scaffold'], ['rewrite_graph_edge_automatically']));
  registerPromptResource(draftModifier('modifier.hindi_glossary', ['translation', 'glossary', 'examples'], ['change_symbolic_notation_or_answer']));
}
