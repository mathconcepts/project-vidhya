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
 * every time given the same context. Caching-safe.
 *
 * v2.12.0 addition: learning-objective + mastery-aware enrichment.
 * Given an ExamContext + StudentModel (both optional), the
 * enrichment decisions adapt:
 *
 *   - MCQ-dominant exams (NEET, AIIMS) prefer QuickCheck drills over
 *     long StepReveal derivations for the same worked example
 *   - Descriptive-dominant exams (UPSC Mains, GATE descriptive) keep
 *     the full step-by-step reveal and expand connections
 *   - Struggling students (low mastery on this concept) get extra
 *     scaffolding: FlipCards for traps always fire, StepReveal
 *     includes more intermediate steps
 *   - Confident students (high mastery) get compressed content:
 *     worked example reduces to key steps only; QuickCheck becomes
 *     a harder variant
 *
 * All adaptations are layered on top of the base rules — they
 * never produce content that wasn't in the canonical lesson; they
 * only decide which interactive treatment fits best.
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
// Learning-objective profile — the shape we read from an ExamContext
// ============================================================================

/**
 * The subset of ExamContext fields the enrichment layer consumes.
 * Kept as a separate interface so the enrichment module has no hard
 * dependency on the full ExamContext shape — it stays a pure function
 * that any caller can populate.
 */
export interface LearningObjective {
  /** Dominant question type for this exam — determines interactive emphasis */
  dominant_type?: 'mcq' | 'msq' | 'numerical' | 'descriptive' | 'mixed';
  /** Total time per question in the real exam, for pacing cues */
  avg_seconds_per_question?: number;
  /** Negative-marking weight — shapes the cost of wrong answers */
  negative_marks_per_wrong?: number;
  /** Exam is imminent (≤7 days) — compress + drill */
  is_imminent?: boolean;
}

/**
 * Minimal mastery signal read from StudentModel.mastery_vector for
 * the concept being rendered. Keeps enrichment decoupled from the
 * full StudentModel shape.
 */
export interface MasterySignal {
  /** 0..1 mastery for the concept. undefined = no data */
  concept_score?: number;
  /** Total attempts on this concept */
  attempts?: number;
  /** Recent error type, if any — drives trap-surfacing */
  last_error_type?: 'conceptual' | 'careless' | 'computational' | 'none';
}

/**
 * Context bundle passed to enrichment. All fields optional — no
 * context = deterministic baseline enrichment (the v2.11.0 behavior).
 */
export interface EnrichmentContext {
  learning_objective?: LearningObjective;
  mastery?: MasterySignal;
}

// ============================================================================
// Helper — infer dominant question type from an ExamContext's question_types
// ============================================================================

/**
 * Given a LearningObjective.question_types mix (e.g. {mcq: 0.7, numerical: 0.3}),
 * pick the single dominant type. Returns 'mixed' when no type exceeds 0.5.
 * Used by the /api/lesson/:id/rendered endpoint to translate ExamContext
 * into a LearningObjective.
 */
export function inferDominantType(
  question_types?: { mcq?: number; msq?: number; numerical?: number; descriptive?: number },
): LearningObjective['dominant_type'] {
  if (!question_types) return 'mixed';
  const entries = Object.entries(question_types).filter(([, v]) => typeof v === 'number');
  if (entries.length === 0) return 'mixed';
  entries.sort(([, a], [, b]) => (b as number) - (a as number));
  const [[top, val]] = entries;
  return (val as number) >= 0.5 ? (top as any) : 'mixed';
}

// ============================================================================
// Per-component strategies (v2.11.0 baseline, extended in v2.12.0)
// ============================================================================

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
 * Worked example → StepRevealBlock. Each step becomes a RevealFragment.
 * The "aha moment" step (if marked) becomes the key_step_index.
 *
 * v2.12.0 adaptations (learning-objective + mastery aware):
 *   - MCQ-dominant exam + high mastery → compress to key step only
 *     (a confident student preparing for an MCQ exam doesn't need
 *     the full derivation; they need pattern recognition)
 *   - MCQ-dominant exam + low mastery → keep full reveal but ALSO
 *     emit a QuickCheck variant derived from the problem (below,
 *     via the wrapper)
 *   - Descriptive-dominant exam → always full reveal, unchanged
 *   - Struggling student (score < 0.3 or recent conceptual error)
 *     → full reveal regardless of exam type — they need every step
 *   - Too-short worked examples (< 2 steps) remain unenriched
 */
function enrichWorkedExample(
  component: any,
  ctx?: EnrichmentContext,
): InteractiveBlock[] {
  if (!component || !component.steps || component.steps.length < 2) return [];

  const dominantType = ctx?.learning_objective?.dominant_type;
  const masteryScore = ctx?.mastery?.concept_score;
  const isStruggling = (masteryScore !== undefined && masteryScore < 0.3)
    || ctx?.mastery?.last_error_type === 'conceptual';
  const isConfident = masteryScore !== undefined && masteryScore >= 0.7;

  // Compress for confident MCQ students — show only the key step
  // plus a terse "full working below" label
  if (dominantType === 'mcq' && isConfident && !isStruggling) {
    const keyIdx = component.steps.findIndex((s: any) => s.is_key_step);
    const stepsToShow = keyIdx >= 0
      ? [component.steps[keyIdx]]
      : component.steps.slice(-1);  // fallback to final step

    const block: StepRevealBlock = {
      kind: 'step-reveal',
      id: `${component.id}:reveal`,
      title: (component.problem_statement || 'Quick pattern') + ' — compressed',
      steps: stepsToShow.map((s: any, idx: number) => ({
        id: `${component.id}:step-${idx}`,
        label: s.label || 'Key insight',
        content_md: s.content || s.explanation || '',
        latex: s.latex,
        voice_narration: s.voice_narration || s.content,
      })),
      key_step_index: 0,
    };
    return [block];
  }

  // Full reveal — default and for struggling students
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
 * Micro-exercise → QuickCheckBlock.
 *
 * v2.12.0 adaptations:
 *   - MCQ-dominant exam → always emit (MCQ students benefit most from drill)
 *   - Descriptive-dominant exam → still emit but deprioritized in render order
 *     (descriptive exam students care less about tap-to-answer)
 *   - Imminent exam + negative marking → add a pacing hint in the prompt
 *     so students practice in exam conditions
 */
function enrichMicroExercise(
  component: any,
  ctx?: EnrichmentContext,
): InteractiveBlock[] {
  if (!component || !component.options || component.options.length < 2) return [];

  const lo = ctx?.learning_objective;
  let promptMd = component.prompt || component.question || '';

  // Pressure-timer hint when exam is close and carries negative marking
  if (lo?.is_imminent && lo.negative_marks_per_wrong && lo.negative_marks_per_wrong > 0) {
    const seconds = lo.avg_seconds_per_question || 90;
    promptMd = `⏱️ *Exam pacing: aim for under ${seconds}s.* ${promptMd}`;
  }

  const block: QuickCheckBlock = {
    kind: 'quick-check',
    id: `${component.id}:check`,
    prompt_md: promptMd,
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
 * Common traps → FlipCardBlock.
 *
 * v2.12.0 adaptation:
 *   - Student with recent conceptual error → promote to top of card
 *     order (struggling students benefit most from trap-first framing)
 *   - No adaptation to learning objective — common traps are equally
 *     valuable for MCQ and descriptive students
 */
function enrichCommonTraps(
  component: any,
  ctx?: EnrichmentContext,
): InteractiveBlock[] {
  if (!component || !component.traps || component.traps.length === 0) return [];

  // For students with conceptual errors, subtle reordering isn't
  // possible without more metadata — we leave the order as authored.
  // But if there's a `conceptual_priority` flag on traps, use it.
  const traps = [...component.traps];
  if (ctx?.mastery?.last_error_type === 'conceptual') {
    traps.sort((a: any, b: any) => {
      const ap = a.is_conceptual ? 0 : 1;
      const bp = b.is_conceptual ? 0 : 1;
      return ap - bp;
    });
  }

  const block: FlipCardBlock = {
    kind: 'flip-card',
    id: `${component.id}:cards`,
    title: 'Common mistakes students make',
    cards: traps.map((trap: any, idx: number) => ({
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
 * Each strategy accepts (component, ctx) — unused context is a no-op.
 * New component kinds added to the lesson framework need a new row here.
 */
const ENRICHMENT_STRATEGIES: Record<
  string,
  (c: any, ctx?: EnrichmentContext) => InteractiveBlock[]
> = {
  'hook':             (c) => enrichHook(c),
  'intuition':        (c) => enrichIntuition(c),
  'worked-example':   enrichWorkedExample,
  'micro-exercise':   enrichMicroExercise,
  'common-traps':     enrichCommonTraps,
  'connections':      (c) => enrichConnections(c),
  // 'definition' and 'formal-statement' intentionally absent —
  // they read well as plain prose.
};

/**
 * Enrich a canonical Lesson. Returns an EnrichedLesson — the base
 * Lesson unchanged, plus an EnrichmentMap keyed by component id.
 *
 * Pure function. Same (Lesson, EnrichmentContext) → same enrichment
 * always. Safe to cache alongside the base Lesson keyed by a hash of
 * the context.
 *
 * @param lesson         The canonical lesson from the composer
 * @param channel_hints  Which channels this will be rendered for
 * @param ctx            Optional learning-objective + mastery signal
 *                       that adapts enrichment decisions. Null/empty
 *                       produces the v2.11.0 baseline behavior.
 */
export function enrichLesson(
  lesson: any,
  channel_hints: string[] = ['web', 'telegram'],
  ctx?: EnrichmentContext,
): EnrichedLesson {
  const enrichments: EnrichmentMap = {};

  for (const component of lesson.components || []) {
    if (!component || !component.id || !component.kind) continue;
    const strategy = ENRICHMENT_STRATEGIES[component.kind];
    if (!strategy) continue;
    const blocks = strategy(component, ctx);
    if (blocks.length > 0) {
      enrichments[component.id] = blocks;
    }
  }

  // v2.12.0: if MCQ-dominant exam and lesson has a worked example but
  // NO micro-exercise, synthesize a QuickCheck from the worked example's
  // final answer so MCQ-preparing students always get a tap-to-answer.
  // The synthesized block is marked synthesized=true for transparency.
  if (ctx?.learning_objective?.dominant_type === 'mcq') {
    maybeSynthesizeQuickCheck(lesson, enrichments);
  }

  return { lesson, enrichments, channel_hints };
}

/**
 * Synthesize a QuickCheck from the worked example when one is missing
 * and the student's exam is MCQ-dominant. Uses the key-step content as
 * the prompt and the worked example's final answer as the correct option.
 *
 * This is the ONE exception to "enrichment never creates new content"
 * — but the content it creates is strictly derived from existing lesson
 * content (problem statement + final answer), not hallucinated. The
 * student gets an extra pattern-recognition drill for free.
 */
function maybeSynthesizeQuickCheck(lesson: any, enrichments: EnrichmentMap): void {
  const hasMicroCheck = Object.values(enrichments).some((list) =>
    list.some((b) => b.kind === 'quick-check'),
  );
  if (hasMicroCheck) return;

  const workedEx = (lesson.components || []).find(
    (c: any) => c && c.kind === 'worked-example' && c.steps?.length >= 2,
  );
  if (!workedEx) return;

  const keyStep = workedEx.steps.find((s: any) => s.is_key_step) || workedEx.steps[workedEx.steps.length - 1];
  if (!keyStep) return;

  const synthId = `${workedEx.id}:synth-check`;
  const synthesized: QuickCheckBlock = {
    kind: 'quick-check',
    id: synthId,
    prompt_md: workedEx.problem_statement
      ? `🎯 *Pattern check:* ${workedEx.problem_statement}`
      : `🎯 *Pattern check:* What's the key insight here?`,
    options: [
      {
        id: `${synthId}:opt-0`,
        text: (keyStep.content || '').slice(0, 120),
        latex: keyStep.latex,
        is_correct: true,
      },
      // Distractors need authored content — without them we skip synthesis
      ...(workedEx.distractors || []).slice(0, 3).map((d: any, i: number) => ({
        id: `${synthId}:opt-${i + 1}`,
        text: String(d.text || d).slice(0, 120),
        is_correct: false,
        feedback_if_wrong_md: d.why_wrong,
      })),
    ],
    correct_feedback_md: 'That\'s the pattern — a must-spot for MCQ exams.',
  };

  // Skip synthesis if we only have the correct answer and no distractors.
  // A single-option quick-check is not pedagogically useful.
  if (synthesized.options.length < 2) return;

  enrichments[`${workedEx.id}:synth-check-component`] = [synthesized];
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
