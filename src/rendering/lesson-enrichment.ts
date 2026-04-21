// @ts-nocheck
/**
 * Lesson Enrichment — deterministic decision logic for adding
 * interactive blocks to canonical lesson components.
 *
 * The rule: each canonical component type has a designated enrichment
 * strategy. This is the "framework" the user asked for — all
 * decisions live here, applied uniformly, channel-agnostic.
 *
 *   hook              → CalloutBlock (insight mood)
 *   definition        → (no enrichment — reads cleanly as prose)
 *   intuition         → CalloutBlock (tip mood) + optional animated visual
 *   worked-example    → StepRevealBlock (each step revealable)
 *   micro-exercise    → QuickCheckBlock (tap to answer)
 *   common-traps      → FlipCardBlock (flip for explanation)
 *   formal-statement  → (no enrichment — rigor reads as plain)
 *   connections       → DragMatchBlock (when 3+ connections exist)
 *
 * Pure functions. No side effects. Same Lesson → same enrichment
 * every time. Caching-safe.
 *
 * Additions to the vocabulary happen by:
 *   1. Adding a new block type to rendering/types.ts
 *   2. Adding the enrichment rule here
 *   3. Adding the channel renderer for the new block
 *   4. Adding the web component to render it
 */

import type {
  InteractiveBlock,
  StepRevealBlock,
  FlipCardBlock,
  QuickCheckBlock,
  CalloutBlock,
  DragMatchBlock,
  EnrichmentMap,
  EnrichedLesson,
} from './types';

// ============================================================================
// Per-component strategies
// ============================================================================

/**
 * Hook component → a CalloutBlock with insight mood. The hook is the
 * "why does this matter" sentence — rendering it as a callout gives
 * it visual weight across channels.
 */
function enrichHook(component: any): InteractiveBlock[] {
  if (!component || !component.content) return [];
  return [{
    kind: 'callout',
    id: `${component.id}:callout`,
    mood: 'insight',
    content_md: component.content,
  }];
}

/**
 * Intuition component → a CalloutBlock with tip mood. The intuition
 * is the mental picture — the callout framing says "this is the
 * version you should actually remember."
 */
function enrichIntuition(component: any): InteractiveBlock[] {
  if (!component || !component.content) return [];
  return [{
    kind: 'callout',
    id: `${component.id}:callout`,
    mood: 'tip',
    content_md: component.content,
  }];
}

/**
 * Worked example → StepRevealBlock. Each step in the worked example
 * becomes a RevealFragment. The "aha moment" step (if marked) becomes
 * the key_step_index.
 *
 * If the worked example has fewer than 2 steps, no enrichment — it's
 * too short to benefit from progressive reveal.
 */
function enrichWorkedExample(component: any): InteractiveBlock[] {
  if (!component || !component.steps || component.steps.length < 2) return [];

  const block: StepRevealBlock = {
    kind: 'step-reveal',
    id: `${component.id}:reveal`,
    title: component.problem_statement || 'Worked example',
    steps: component.steps.map((s: any, idx: number) => ({
      id: `${component.id}:step-${idx}`,
      label: s.label || `Step ${idx + 1}`,
      content_md: s.content || s.explanation || '',
      latex: s.latex,
      voice_narration: s.voice_narration || s.content,
    })),
    key_step_index: component.steps.findIndex((s: any) => s.is_key_step),
  };

  return [block];
}

/**
 * Micro-exercise → QuickCheckBlock. The exercise already has a
 * question + options + correct answer; we just wrap it in the block.
 */
function enrichMicroExercise(component: any): InteractiveBlock[] {
  if (!component || !component.options || component.options.length < 2) return [];

  const block: QuickCheckBlock = {
    kind: 'quick-check',
    id: `${component.id}:check`,
    prompt_md: component.prompt || component.question || '',
    options: component.options.map((opt: any, idx: number) => ({
      id: `${component.id}:opt-${idx}`,
      text: opt.text || opt.content || String(opt),
      latex: opt.latex,
      is_correct: Boolean(opt.is_correct || opt.correct),
      feedback_if_wrong_md: opt.feedback_if_wrong || opt.why_wrong,
    })),
    correct_feedback_md: component.correct_feedback || 'Correct — well spotted.',
  };

  return [block];
}

/**
 * Common traps → FlipCardBlock. Each trap becomes a card with
 * prompt (the mistake) + explanation (why + how to avoid).
 *
 * If the trap component has a student_quote (e.g., "I used to always
 * forget to..."), it humanizes the card — the front shows the quote,
 * not just the abstract mistake.
 */
function enrichCommonTraps(component: any): InteractiveBlock[] {
  if (!component || !component.traps || component.traps.length === 0) return [];

  const block: FlipCardBlock = {
    kind: 'flip-card',
    id: `${component.id}:cards`,
    title: 'Common mistakes students make',
    cards: component.traps.map((trap: any, idx: number) => ({
      id: `${component.id}:card-${idx}`,
      prompt: {
        id: `${component.id}:card-${idx}-front`,
        content_md: trap.mistake_description || trap.front || trap.prompt || '',
      },
      explanation: {
        id: `${component.id}:card-${idx}-back`,
        content_md: trap.why_and_fix || trap.back || trap.explanation || '',
      },
      student_quote: trap.student_quote,
    })),
  };

  return [block];
}

/**
 * Connections → DragMatchBlock if enough connections exist to make
 * matching meaningful. Fewer than 3 → no enrichment, just let the
 * prose render.
 */
function enrichConnections(component: any): InteractiveBlock[] {
  if (!component || !component.connections || component.connections.length < 3) return [];

  const block: DragMatchBlock = {
    kind: 'drag-match',
    id: `${component.id}:match`,
    title: 'Match each concept to its connection',
    pairs: component.connections.map((conn: any, idx: number) => ({
      id: `${component.id}:pair-${idx}`,
      left: {
        id: `${component.id}:left-${idx}`,
        content_md: conn.concept || conn.source || '',
      },
      right: {
        id: `${component.id}:right-${idx}`,
        content_md: conn.relation || conn.target || '',
      },
    })),
  };

  return [block];
}

// ============================================================================
// Main entry — apply enrichment to a full Lesson
// ============================================================================

/**
 * Strategy dispatch: which enrichment function handles which component kind.
 * New component kinds added to the lesson framework need a new row here.
 */
const ENRICHMENT_STRATEGIES: Record<string, (c: any) => InteractiveBlock[]> = {
  'hook':             enrichHook,
  'intuition':        enrichIntuition,
  'worked-example':   enrichWorkedExample,
  'micro-exercise':   enrichMicroExercise,
  'common-traps':     enrichCommonTraps,
  'connections':      enrichConnections,
  // 'definition' and 'formal-statement' intentionally absent —
  // they read well as plain prose.
};

/**
 * Enrich a canonical Lesson. Returns an EnrichedLesson — the base
 * Lesson unchanged, plus an EnrichmentMap keyed by component id.
 *
 * Pure function. Same Lesson → same enrichment always. Safe to cache
 * alongside the base Lesson.
 */
export function enrichLesson(lesson: any, channel_hints: string[] = ['web', 'telegram']): EnrichedLesson {
  const enrichments: EnrichmentMap = {};

  for (const component of lesson.components || []) {
    if (!component || !component.id || !component.kind) continue;
    const strategy = ENRICHMENT_STRATEGIES[component.kind];
    if (!strategy) continue;
    const blocks = strategy(component);
    if (blocks.length > 0) {
      enrichments[component.id] = blocks;
    }
  }

  return { lesson, enrichments, channel_hints };
}

// ============================================================================
// Introspection — useful for /api/lesson/:id/enrichment-audit
// ============================================================================

/**
 * Returns a summary of what enrichments would be applied to a given
 * lesson. Used by admin tooling to audit enrichment coverage.
 */
export function auditEnrichment(lesson: any): {
  total_components: number;
  enriched_components: number;
  by_kind: Record<string, { count: number; blocks: number }>;
} {
  const by_kind: Record<string, { count: number; blocks: number }> = {};
  let enriched = 0;

  for (const component of lesson.components || []) {
    if (!component || !component.kind) continue;
    const strategy = ENRICHMENT_STRATEGIES[component.kind];
    by_kind[component.kind] = by_kind[component.kind] || { count: 0, blocks: 0 };
    by_kind[component.kind].count++;
    if (strategy) {
      const blocks = strategy(component);
      by_kind[component.kind].blocks += blocks.length;
      if (blocks.length > 0) enriched++;
    }
  }

  return {
    total_components: lesson.components?.length || 0,
    enriched_components: enriched,
    by_kind,
  };
}
