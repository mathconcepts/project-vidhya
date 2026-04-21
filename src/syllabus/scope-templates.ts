// @ts-nocheck
/**
 * Scope Objective Templates
 *
 * The meat of "learning objectives change with scope": this file encodes
 * which cognitive depths are prioritized for each exam scope, and how to
 * synthesize the concrete objective statement from a concept.
 *
 * Example: concept 'eigenvalues' under scope 'mcq-fast' generates a
 * recognition-priority objective "identify the eigenvalue pattern of common
 * 2x2 matrices" with a shortcut-formula strategy hint. The same concept
 * under 'subjective-long' generates an analyze-depth objective "derive
 * eigenvalues from the characteristic polynomial with full justification".
 */

import type {
  ExamScope,
  CognitiveDepth,
  LearningObjective,
  StrategyHint,
} from './types';
import type { ConceptNode } from '../constants/concept-graph';

// ============================================================================
// Scope → depth priority bands
// ============================================================================

/**
 * Each scope weights cognitive depths differently. A higher number means
 * objectives at that depth are more important for the scope.
 *
 * Think of this as: "if I spend 100 hours preparing for scope X, how should
 * it be allocated across depths?"
 */
const SCOPE_DEPTH_WEIGHTS: Record<ExamScope, Record<CognitiveDepth, number>> = {
  'mcq-fast': {
    recognize: 40,  // pattern-match answers fast
    recall:    25,  // formula sheet memory
    apply:     20,  // plug and compute under time pressure
    analyze:    8,
    evaluate:   5,  // eliminate wrong options, pick fastest path
    create:     2,
  },
  'mcq-rigorous': {
    recognize: 20,
    recall:    20,
    apply:     30,  // must execute the procedure
    analyze:   20,
    evaluate:   8,
    create:     2,
  },
  'subjective-short': {
    recognize: 10,
    recall:    15,
    apply:     30,
    analyze:   25,  // show reasoning
    evaluate:  15,
    create:     5,
  },
  'subjective-long': {
    recognize:  5,
    recall:    10,
    apply:     20,
    analyze:   25,
    evaluate:  20,
    create:    20,  // novel proofs, full derivations
  },
  'oral-viva': {
    recognize:  5,
    recall:    15,
    apply:     15,
    analyze:   25,  // explain the "why"
    evaluate:  25,  // compare approaches verbally
    create:    15,
  },
  'practical': {
    recognize: 10,
    recall:    10,
    apply:     35,  // use the tools
    analyze:   20,
    evaluate:  15,
    create:    10,
  },
};

// ============================================================================
// Depth → priority tier within a scope
// ============================================================================

/**
 * Given a scope and a depth, return the priority tier for objectives at that
 * depth. Top-band depths are priority 1 (must master), middle 2, bottom 3.
 */
function priorityForDepth(scope: ExamScope, depth: CognitiveDepth): 1 | 2 | 3 {
  const weights = SCOPE_DEPTH_WEIGHTS[scope];
  const sorted = Object.entries(weights).sort(([, a], [, b]) => b - a);
  const idx = sorted.findIndex(([d]) => d === depth);
  if (idx < 2) return 1;
  if (idx < 4) return 2;
  return 3;
}

// ============================================================================
// Objective statement templates
// ============================================================================

/**
 * Map (depth, scope) → action verb + phrasing template.
 * Plug the concept label into these to produce a concrete objective.
 */
const STATEMENT_TEMPLATES: Record<CognitiveDepth, (conceptLabel: string, scope: ExamScope) => string> = {
  recognize: (c, s) => {
    if (s === 'mcq-fast' || s === 'mcq-rigorous') {
      return `Recognize ${c} problems by their telltale features (variable pattern, keywords, answer shape) within 10 seconds of reading.`;
    }
    return `Identify problem types involving ${c} from common problem statements and textbook framings.`;
  },

  recall: (c, s) => {
    if (s === 'mcq-fast') {
      return `Recite the key formulas, special cases, and standard values for ${c} from memory (no lookup).`;
    }
    if (s === 'oral-viva') {
      return `State the definition and key theorems related to ${c} aloud, precisely.`;
    }
    return `Reproduce the standard formulas, definitions, and canonical results for ${c}.`;
  },

  apply: (c, s) => {
    if (s === 'mcq-fast') {
      return `Apply ${c} to reach the correct answer under time pressure (<90s per problem), using shortcut methods where available.`;
    }
    if (s === 'subjective-short' || s === 'subjective-long') {
      return `Apply ${c} with clearly labeled steps, correct notation, and enough justification for full partial credit.`;
    }
    if (s === 'practical') {
      return `Apply ${c} using appropriate tools (calculator, software, tables), with sanity-check of results.`;
    }
    return `Correctly apply ${c} to standard problems.`;
  },

  analyze: (c, s) => {
    if (s === 'subjective-long' || s === 'oral-viva') {
      return `Decompose ${c} problems into sub-components, identify which theorems apply, and explain the reasoning chain.`;
    }
    return `Analyze when ${c} techniques are the right choice vs alternative methods.`;
  },

  evaluate: (c, s) => {
    if (s === 'mcq-fast' || s === 'mcq-rigorous') {
      return `Evaluate answer choices for ${c} problems by elimination, dimensional checks, and edge-case testing.`;
    }
    if (s === 'subjective-long' || s === 'oral-viva') {
      return `Compare alternative approaches to ${c} problems and justify the chosen method on grounds of efficiency, generality, or clarity.`;
    }
    return `Assess whether a solution involving ${c} is correct, efficient, and complete.`;
  },

  create: (c, s) => {
    if (s === 'subjective-long') {
      return `Construct novel proofs or derivations that use ${c} as a core tool, presenting them in publication-quality form.`;
    }
    if (s === 'oral-viva') {
      return `Generate original examples and counterexamples to probe understanding of ${c}.`;
    }
    return `Design problems or demonstrations that showcase the power of ${c}.`;
  },
};

// ============================================================================
// Success criteria — how GBrain decides an objective is mastered
// ============================================================================

const SUCCESS_CRITERIA: Record<CognitiveDepth, (scope: ExamScope) => string> = {
  recognize: (s) => s === 'mcq-fast'
    ? 'Correctly classifies ≥ 90% of problem statements in < 15s each'
    : 'Correctly identifies problem type on first reading, ≥ 80% accuracy',
  recall:   () => 'Produces correct formulas/definitions without reference material, ≥ 90% accuracy',
  apply:    (s) => s === 'mcq-fast'
    ? 'Solves ≥ 80% of standard problems within the time budget'
    : 'Solves ≥ 70% of problems with full working shown',
  analyze:  () => 'Correctly decomposes ≥ 70% of multi-step problems into sub-goals with valid justification',
  evaluate: (s) => s === 'mcq-fast' || s === 'mcq-rigorous'
    ? 'Uses elimination/dimensional reasoning to select correct option ≥ 80%'
    : 'Explains trade-offs of ≥ 2 approaches on ≥ 70% of problems',
  create:   () => 'Produces an original, correct derivation or proof of medium complexity',
};

// ============================================================================
// Time estimates (minutes) per depth — rough defaults
// ============================================================================

const DEPTH_BASE_MINUTES: Record<CognitiveDepth, number> = {
  recognize: 10,
  recall:    15,
  apply:     30,
  analyze:   45,
  evaluate:  30,
  create:    60,
};

// ============================================================================
// Strategy hints library — scope-specific
// ============================================================================

const STRATEGY_HINTS: Record<ExamScope, StrategyHint[]> = {
  'mcq-fast': [
    { scope: 'mcq-fast', category: 'shortcut',
      advice: 'Memorize shortcut formulas for the top 20 high-frequency concepts — e.g. quadratic root sum/product, standard integral templates, common eigenvalue patterns.' },
    { scope: 'mcq-fast', category: 'elimination',
      advice: 'Before computing, eliminate options by checking units, sign, parity, order of magnitude, and limit behavior. Often two options die immediately.' },
    { scope: 'mcq-fast', category: 'time-budget',
      advice: 'Allocate no more than 90s per 1-mark and 180s per 2-mark. If stuck, flag and move. Return with fresh eyes.' },
    { scope: 'mcq-fast', category: 'common-trap',
      advice: 'MCQ distractors are engineered from common errors — sign flips, off-by-one indices, formula confusions. Recognize the trap before you compute.' },
    { scope: 'mcq-fast', category: 'memorization-aid',
      advice: 'Keep a one-page formula sheet and review it 3× daily in the last two weeks. Active recall > passive reading.' },
  ],

  'mcq-rigorous': [
    { scope: 'mcq-rigorous', category: 'shortcut',
      advice: 'Shortcuts help, but verify the answer with a quick sanity check — substitution, dimensional analysis, edge case.' },
    { scope: 'mcq-rigorous', category: 'time-budget',
      advice: 'Numerical-answer-type questions need ~3 minutes each. Don\'t rush the computation; one wrong digit costs full marks.' },
    { scope: 'mcq-rigorous', category: 'common-trap',
      advice: 'Watch units, rounding, and off-by-one errors. Many wrong answers result from forgetting to apply the last step (e.g., take absolute value, convert to requested units).' },
    { scope: 'mcq-rigorous', category: 'elimination',
      advice: 'For MCQ-numerical, estimate the magnitude first. If it\'s off by 10×, recheck your setup.' },
  ],

  'subjective-short': [
    { scope: 'subjective-short', category: 'notation',
      advice: 'Define every variable on first use. State the theorem you invoke by name. Notation clarity is worth 20-30% of the grade.' },
    { scope: 'subjective-short', category: 'derivation-template',
      advice: 'Standard template: (1) state goal, (2) invoke theorem/formula, (3) substitute, (4) simplify, (5) box the final answer.' },
    { scope: 'subjective-short', category: 'time-budget',
      advice: 'Short-answer problems are 5-8 minutes each. If you can\'t finish, write the setup — partial credit for correct approach is substantial.' },
  ],

  'subjective-long': [
    { scope: 'subjective-long', category: 'derivation-template',
      advice: 'For proof-style problems: (1) state hypotheses and goal, (2) outline the proof strategy, (3) present lemmas as needed, (4) main argument, (5) concluding "QED" with what was proved.' },
    { scope: 'subjective-long', category: 'notation',
      advice: 'Pick one notation system and stick with it. Changing conventions mid-solution loses marks and confuses the grader.' },
    { scope: 'subjective-long', category: 'common-trap',
      advice: 'Don\'t skip steps that seem obvious to you — the grader needs to see the reasoning. A two-line "it\'s obvious that X" loses marks versus a four-line derivation.' },
    { scope: 'subjective-long', category: 'time-budget',
      advice: 'Budget 20-30 minutes per long problem. Spend the first 3 minutes planning; the plan is cheaper to fix than a half-written proof.' },
  ],

  'oral-viva': [
    { scope: 'oral-viva', category: 'derivation-template',
      advice: 'Answer in layers: (1) definition + canonical example, (2) why it matters, (3) how it connects to adjacent topics. Let the examiner dig deeper if interested.' },
    { scope: 'oral-viva', category: 'notation',
      advice: 'Verbal clarity > written precision. Practice saying "the limit as x approaches zero of the quantity sin x over x" — notation gets ambiguous when spoken.' },
    { scope: 'oral-viva', category: 'common-trap',
      advice: 'Don\'t bluff. If you don\'t know, say "I\'d need to think about that" or "I recall the statement but not the proof" — examiners respect honesty.' },
  ],

  'practical': [
    { scope: 'practical', category: 'notation',
      advice: 'Document your code and assumptions. Graders evaluate reproducibility as heavily as correctness.' },
    { scope: 'practical', category: 'common-trap',
      advice: 'Numerical precision and edge cases kill more marks than conceptual errors. Test boundary inputs first.' },
    { scope: 'practical', category: 'time-budget',
      advice: 'Half your time is debugging. Plan for it. An elegant half-working solution beats a sloppy almost-complete one.' },
  ],
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate the prioritized learning objectives for a concept under a scope.
 * Returns ordered by priority (1 first).
 */
export function generateObjectivesForConcept(
  concept: ConceptNode,
  scope: ExamScope,
): LearningObjective[] {
  const depthWeights = SCOPE_DEPTH_WEIGHTS[scope];
  // Consider the top-4 depths by weight for this scope
  const relevantDepths = Object.entries(depthWeights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .filter(([, w]) => w >= 10)      // skip near-zero weights
    .map(([d]) => d as CognitiveDepth);

  return relevantDepths.map((depth, idx) => ({
    id: `${concept.id}--${depth}--${scope}`,
    concept_id: concept.id,
    depth,
    statement: STATEMENT_TEMPLATES[depth](concept.label, scope),
    success_criterion: SUCCESS_CRITERIA[depth](scope),
    estimated_time_minutes: Math.round(DEPTH_BASE_MINUTES[depth] * (1 + concept.difficulty_base)),
    priority: priorityForDepth(scope, depth),
    applies_to_scopes: [scope],
  }));
}

/**
 * Return the strategy hints for a scope. Applied at syllabus-wide level
 * and potentially duplicated in each node for visibility.
 */
export function getStrategyHints(scope: ExamScope): StrategyHint[] {
  return STRATEGY_HINTS[scope] || [];
}

/**
 * Pick 2-3 most-applicable strategy hints for a specific concept + scope.
 * Heuristic: high-frequency concepts get elimination/shortcut tips in MCQ
 * scopes; high-difficulty concepts get derivation-template tips in
 * subjective scopes.
 */
export function pickHintsForConcept(
  concept: ConceptNode,
  scope: ExamScope,
): StrategyHint[] {
  const all = STRATEGY_HINTS[scope] || [];
  if (scope === 'mcq-fast' || scope === 'mcq-rigorous') {
    return all.filter(h =>
      h.category === 'shortcut' ||
      h.category === 'elimination' ||
      (concept.gate_frequency === 'high' && h.category === 'common-trap')
    ).slice(0, 3);
  }
  if (scope === 'subjective-long' || scope === 'subjective-short') {
    return all.filter(h =>
      h.category === 'derivation-template' ||
      h.category === 'notation' ||
      (concept.difficulty_base >= 0.5 && h.category === 'common-trap')
    ).slice(0, 3);
  }
  return all.slice(0, 2);
}
