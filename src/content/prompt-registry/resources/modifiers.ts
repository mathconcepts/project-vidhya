/**
 * src/content/prompt-registry/resources/modifiers.ts
 *
 * Modifiers are delivery-only controls: they may change HOW content reads
 * (tone, register, visual leadership, time framing, glossary, bridging)
 * but never WHAT it claims mathematically (canonical formula, scope,
 * marking rule, answer key). `allowed_changes`/`forbidden_changes` make
 * that boundary an inspectable fact about each modifier rather than a
 * comment someone has to trust.
 *
 * `toneRegisterModifier` is the one UNCONDITIONAL modifier — it fires on
 * every call regardless of `active_modifiers`, matching its pre-registry
 * always-on behavior in orchestrator.ts.
 *
 * The other five (originally named by the uploaded Wolfram-inspired
 * registry, shipped 2026-09-02 as 'draft' stubs with no implementation)
 * are now real, OPT-IN modifiers: each checks
 * `args.active_modifiers?.includes(its own resource_id)` and returns ''
 * otherwise. Opt-in, not unconditional, because unlike tone (which every
 * anxious exam student benefits from by default) these five are
 * situational — a student who is NOT time-pressured doesn't need
 * exam_timed framing forced into their material, and a student who reads
 * English confidently doesn't need Hindi glosses. Registered at
 * approval_state 'pilot' (implemented, real, but not yet exercised by a
 * live generation run against real student outcomes — 'released' is
 * earned by usage evidence, not claimed on day one).
 */

import type { Modifier, PromptResourceBuildArgs } from '../types';
import { registerPromptResource } from '../registry';
import { formatHindiGloss, LINEAR_ALGEBRA_HINDI_GLOSSARY } from '../data/hindi-math-glossary';

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

function isActive(args: PromptResourceBuildArgs, resourceId: string): boolean {
  return !!args.active_modifiers?.includes(resourceId);
}

/**
 * visual_first — lead with a visual/geometric representation before
 * symbolic notation. Resonance beats (src/content/resonance-strategy.ts)
 * already do this for hook/intuition atoms on the ~26 concepts they cover;
 * this modifier extends the same instruction to atom types resonance
 * beats never touch (formal_definition, worked_example, common_traps) and
 * to concepts outside the resonance-beat set.
 */
export const visualFirstModifier: Modifier = {
  resource_id: 'modifier.visual_first',
  version: '1.0.0',
  category: 'modifier',
  topics: ['*'],
  required_inputs: ['active_modifiers'],
  outputs: ['visual_first_block'],
  approval_state: 'pilot',
  evidence_requirements: ['design hypothesis — not yet measured against a bounded experiment (immediate accuracy / delayed retrieval / transfer)'],
  compatibility: [],
  rollback_target: null,
  allowed_changes: ['representation_order', 'asset_choice', 'example_surface'],
  forbidden_changes: ['canonical_formula', 'scope', 'marking_rule', 'answer_key'],
  test_fixtures: [
    'returns "" when not in active_modifiers',
    'returns the visual-first directive when active_modifiers includes modifier.visual_first',
  ],
  build(args: PromptResourceBuildArgs): string {
    if (!isActive(args, 'modifier.visual_first')) return '';
    return `Modifier: visual-first. Before introducing symbolic notation, describe what is geometrically or visually happening — a picture, a plot, a spatial or physical description. Establish the visual first; introduce formal notation and equations only once the visual picture is in place. Do not change the underlying formula, scope, marking rule, or answer — only the ORDER and framing of the explanation.\n\n`;
  },
};

/**
 * simple_words — an escalation beyond the baseline tone_register, for a
 * student flagged as needing MORE simplification than the default ELI5
 * register already gives (e.g. via student_context.representation_mode).
 * Deliberately narrower than tone_register: it strips remaining jargon
 * tone_register still allows when glossed, rather than re-stating the
 * same ELI5 instruction twice.
 */
export const simpleWordsModifier: Modifier = {
  resource_id: 'modifier.simple_words',
  version: '1.0.0',
  category: 'modifier',
  topics: ['*'],
  required_inputs: ['active_modifiers'],
  outputs: ['simple_words_block'],
  approval_state: 'pilot',
  evidence_requirements: ['design hypothesis — not yet measured against a bounded experiment'],
  compatibility: ['modifier.tone_register'],
  rollback_target: null,
  allowed_changes: ['lexical_complexity', 'sentence_length', 'glossary'],
  forbidden_changes: ['mathematical_precision', 'conditions'],
  test_fixtures: [
    'returns "" when not in active_modifiers',
    'returns the simple-words directive when active_modifiers includes modifier.simple_words',
  ],
  build(args: PromptResourceBuildArgs): string {
    if (!isActive(args, 'modifier.simple_words')) return '';
    return `Modifier: simple words (escalated beyond the default register). This student needs MORE simplification than usual. Use the shortest word that is still correct — "add" not "combine", "swap" not "interchange". Cap sentences at roughly 15 words. Where the base register would gloss a term once and move on, here restate the gloss again the next time the term appears, as if the student is reading this for the first time each time. Do not soften or drop any mathematical condition — simplify the WORDS, never the precision of WHEN a rule applies.\n\n`;
  },
};

/**
 * exam_timed — time-budget and checkpoint framing for a student under
 * exam time pressure. `exam_pattern` atoms already carry GATE exam-craft
 * notes (NAT vs MCQ patterns, time budgets); this modifier extends the
 * same time-budget discipline to atom types that don't otherwise carry it
 * (worked_example, common_traps) when a run is explicitly generating for
 * a time-pressured student.
 */
export const examTimedModifier: Modifier = {
  resource_id: 'modifier.exam_timed',
  version: '1.0.0',
  category: 'modifier',
  topics: ['*'],
  required_inputs: ['active_modifiers'],
  outputs: ['exam_timed_block'],
  approval_state: 'pilot',
  evidence_requirements: ['design hypothesis — not yet measured against a bounded experiment'],
  compatibility: [],
  rollback_target: null,
  allowed_changes: ['sequence_compression', 'time_budget', 'checkpoint_frequency'],
  forbidden_changes: ['omit_required_conditions', 'suppress_uncertainty'],
  test_fixtures: [
    'returns "" when not in active_modifiers',
    'returns the exam-timed directive when active_modifiers includes modifier.exam_timed',
  ],
  build(args: PromptResourceBuildArgs): string {
    if (!isActive(args, 'modifier.exam_timed')) return '';
    return `Modifier: exam-timed. This student is preparing under time pressure. After the explanation, add one line naming a realistic target time (in seconds) to execute this under real GATE exam conditions, and one line on what can be safely shortcut once the method is understood — WITHOUT ever telling the student to skip a required condition or hide genuine uncertainty about when a shortcut applies. If no honest shortcut exists, say so rather than inventing one.\n\n`;
  },
};

/**
 * prerequisite_repair — attaches a bridging note when a diagnostic signal
 * (diagnose.prerequisite_probe / src/gbrain/diagnostic-probe.ts) has
 * flagged a SPECIFIC upstream concept as weak. Requires BOTH the modifier
 * to be active AND a real prerequisite_gap in args — a bridge with no
 * named gap would invent a weakness the evidence doesn't support, which
 * is exactly what DeltaKind.prerequisite_repair's own contract forbids
 * (src/content/delta-kinds.ts).
 */
export const prerequisiteRepairModifier: Modifier = {
  resource_id: 'modifier.prerequisite_repair',
  version: '1.0.0',
  category: 'modifier',
  topics: ['*'],
  required_inputs: ['active_modifiers', 'prerequisite_gap'],
  outputs: ['prerequisite_repair_block'],
  approval_state: 'pilot',
  evidence_requirements: ['requires a real diagnostic signal (diagnose.prerequisite_probe) naming the weak upstream concept — never fabricated'],
  compatibility: [],
  rollback_target: null,
  allowed_changes: ['attach_bridge', 'add_probe', 'reorder_scaffold'],
  forbidden_changes: ['rewrite_graph_edge_automatically'],
  test_fixtures: [
    'returns "" when not in active_modifiers',
    'returns "" when active but no prerequisite_gap is supplied (never fabricates a gap)',
    'returns the bridge directive naming the real gap concept when both are present',
  ],
  build(args: PromptResourceBuildArgs): string {
    if (!isActive(args, 'modifier.prerequisite_repair')) return '';
    if (!args.prerequisite_gap?.concept_id) return '';
    const label = args.prerequisite_gap.label ?? args.prerequisite_gap.concept_id;
    return `Modifier: prerequisite repair. A diagnostic signal flagged this student as shaky on the prerequisite concept "${label}" (${args.prerequisite_gap.concept_id}). Before the main explanation, add ONE short bridging sentence that explicitly names "${label}" and connects it to today's concept — what piece of it this concept reuses. Do not re-teach "${label}" in full; one sentence of connective tissue, then continue with today's concept as normal.\n\n`;
  },
};

/**
 * hindi_glossary — appends a Hindi gloss (NCERT-standard vocabulary,
 * see data/hindi-math-glossary.ts) the first time a term in the glossary
 * is introduced. Linear Algebra terms only today (matches the "check
 * Linear Algebra first" rollout plan) — the glossary itself is where
 * other topics' terms get added later, not a second mechanism.
 */
export const hindiGlossaryModifier: Modifier = {
  resource_id: 'modifier.hindi_glossary',
  version: '1.0.0',
  category: 'modifier',
  topics: ['*'],
  required_inputs: ['active_modifiers'],
  outputs: ['hindi_glossary_block'],
  approval_state: 'pilot',
  evidence_requirements: [
    'glossary terms are NCERT-standard Hindi-medium vocabulary but have NOT been reviewed by a native Hindi-medium mathematics educator — see data/hindi-math-glossary.ts header',
  ],
  compatibility: [],
  rollback_target: null,
  allowed_changes: ['translation', 'glossary', 'examples'],
  forbidden_changes: ['change_symbolic_notation_or_answer'],
  test_fixtures: [
    'returns "" when not in active_modifiers',
    'returns the glossary directive with real glossed terms for a Linear Algebra topic_family',
    'never invents a Hindi term for a word not in the curated glossary',
  ],
  build(args: PromptResourceBuildArgs): string {
    if (!isActive(args, 'modifier.hindi_glossary')) return '';
    // The FULL curated table, not a sample — a generator shown only a few
    // example terms (e.g. "eigenvalue" but not "eigenvector") has been
    // observed guessing the nearest shown gloss by analogy, which is
    // exactly the wrong-translation failure this modifier exists to
    // prevent (see docs/designs/2026-09-02-modifier-demonstration-samples.md
    // row 5: "eigenvalue"'s gloss misapplied to "eigenvectors"). Giving the
    // real lookup table removes the need to guess at all — every term this
    // modifier is allowed to gloss is listed here with its real, distinct
    // entry.
    const table = LINEAR_ALGEBRA_HINDI_GLOSSARY.map((e) => `"${e.english}" -> ${formatHindiGloss(e)}`).join('; ');
    return `Modifier: Hindi glossary. The first time you introduce a technical term that has a standard Hindi-medium equivalent, add it in parentheses right after the English term, using ONLY this exact curated table — never a lookalike or a gloss borrowed from a similarly-named term (e.g. "eigenvalue" and "eigenvector" are DIFFERENT words with DIFFERENT glosses; match the exact term you are glossing, not the nearest one in the list):\n${table}\nA term not in this table has no gloss — leave it in plain English rather than guessing a translation. Never translate the surrounding sentence into Hindi — the base language stays English (per the default Indian-English register); this modifier adds bridging glosses only, it does not change the language of instruction.\n\n`;
  },
};

export function registerModifierResources(): void {
  registerPromptResource(toneRegisterModifier);
  registerPromptResource(visualFirstModifier);
  registerPromptResource(simpleWordsModifier);
  registerPromptResource(examTimedModifier);
  registerPromptResource(prerequisiteRepairModifier);
  registerPromptResource(hindiGlossaryModifier);
}
