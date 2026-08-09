/**
 * src/content/modality-orchestrator.ts
 *
 * Modality Orchestrator (Track E6).
 *
 * Deterministic rule engine that maps (atom_type, topic_family, context)
 * to a display modality with a provenance rationale_id.
 *
 * Four modalities:
 *   STATIC   — plain markdown + LaTeX (always safe, no interactives required)
 *   DYNAMIC  — animated GIF sidecar (gif-generator.ts, gifenc)
 *   MANIM    — manim-rendered scene (challenge C1 from 100x-blueprint, gated)
 *   MATHBOX  — MathBox WebGL 3-D (bundled lazy ESM, no CDN)
 *
 * This module is PURE — no DB, no LLM, no network. All I/O is caller-side.
 * Rule precedence (first match wins):
 *   1. Capability gate (interactives_enabled on exam pack)
 *   2. Atom type overrides
 *   3. Topic-family rules
 *   4. Session-mode rules
 *   5. Default fallback → STATIC
 *
 * rationale_id is a closed enum so the lift-ledger can groupby later.
 * Future rule changes ship as new rationale_ids — never mutate existing ones.
 */

export type Modality = 'STATIC' | 'DYNAMIC' | 'MANIM' | 'MATHBOX';

export type ModalityRationaleId =
  | 'atom_type_visual_analogy'    // visual_analogy → always DYNAMIC
  | 'atom_type_simulation'        // simulation kind → MANIM when gated
  | 'atom_type_manipulable'       // manipulable kind → MATHBOX when gated
  | 'topic_3d_geometry'           // 3-D geometry topics → MATHBOX when gated
  | 'topic_function_trace'        // single-variable calculus → DYNAMIC
  | 'topic_parametric'            // parametric curves → DYNAMIC
  | 'session_micro_sprint'        // micro_sprint mode → STATIC (speed over fidelity)
  | 'session_exam_prep'           // exam-prep mode → STATIC (no distraction)
  | 'interactives_disabled'       // exam pack has interactives_enabled=false
  | 'default_static';             // no rule matched

export interface ModalityDecision {
  modality: Modality;
  rationale_id: ModalityRationaleId;
  /** Human-readable explanation for the admin dashboard / ledger. */
  rationale: string;
}

export interface ModalityContext {
  /** From exam_packs.interactives_enabled (false = canonical-pack-only cap). */
  interactives_enabled: boolean;
  /** Current session mode (knowledge | exam-prep | revision | micro_sprint). */
  session_mode?: string;
  /** Atom type being rendered. */
  atom_type: string;
  /** Topic family (module): 'linear-algebra', 'calculus', 'probability', etc. */
  topic_family: string;
  /** Optional hint from the pedagogy pattern's modality_bias. */
  pattern_modality_bias?: string;
}

// ---------------------------------------------------------------------------
// Topic-family → modality rules
// ---------------------------------------------------------------------------

const DYNAMIC_TOPIC_FAMILIES: ReadonlySet<string> = new Set([
  'calculus',
  'complex-analysis',
  'sequences-and-series',
  'differential-equations',
]);

const MATHBOX_TOPIC_FAMILIES: ReadonlySet<string> = new Set([
  'linear-algebra',          // 3-D vector-space visualisations
  'vector-calculus',         // gradient/curl/divergence fields
  'geometry',
]);

// ---------------------------------------------------------------------------
// Core rule engine
// ---------------------------------------------------------------------------

/**
 * Deterministically select a display modality for an atom.
 * Returns the modality and a stable rationale_id for lift-ledger attribution.
 */
export function selectModality(ctx: ModalityContext): ModalityDecision {
  // Rule 1: capability gate — always STATIC when interactives are off.
  if (!ctx.interactives_enabled) {
    return {
      modality: 'STATIC',
      rationale_id: 'interactives_disabled',
      rationale: 'exam pack has interactives_enabled=false — STATIC only',
    };
  }

  // Rule 2: session-mode overrides (speed / cognitive-load concerns).
  if (ctx.session_mode === 'micro_sprint' || ctx.session_mode === 'exam-prep') {
    return {
      modality: 'STATIC',
      rationale_id: ctx.session_mode === 'micro_sprint'
        ? 'session_micro_sprint'
        : 'session_exam_prep',
      rationale: `session_mode=${ctx.session_mode} — STATIC for speed`,
    };
  }

  // Rule 3: atom-type hard overrides.
  if (ctx.atom_type === 'visual_analogy') {
    return {
      modality: 'DYNAMIC',
      rationale_id: 'atom_type_visual_analogy',
      rationale: 'visual_analogy atoms always render as animated GIF (gif-generator)',
    };
  }
  if (ctx.atom_type === 'simulation') {
    return {
      modality: 'MANIM',
      rationale_id: 'atom_type_simulation',
      rationale: 'simulation kind maps to manim scene (challenge C1)',
    };
  }
  if (ctx.atom_type === 'manipulable') {
    return {
      modality: 'MATHBOX',
      rationale_id: 'atom_type_manipulable',
      rationale: 'manipulable kind maps to MathBox WebGL (bundled ESM)',
    };
  }

  // Rule 4: topic-family rules.
  if (MATHBOX_TOPIC_FAMILIES.has(ctx.topic_family)) {
    return {
      modality: 'MATHBOX',
      rationale_id: 'topic_3d_geometry',
      rationale: `topic_family=${ctx.topic_family} — MathBox 3-D visual`,
    };
  }

  if (DYNAMIC_TOPIC_FAMILIES.has(ctx.topic_family)) {
    // Function-trace vs parametric within dynamic-capable topics.
    const isParametric =
      ctx.topic_family === 'complex-analysis' ||
      ctx.topic_family === 'differential-equations';
    return {
      modality: 'DYNAMIC',
      rationale_id: isParametric ? 'topic_parametric' : 'topic_function_trace',
      rationale: `topic_family=${ctx.topic_family} — animated GIF (${isParametric ? 'parametric' : 'function-trace'} scene)`,
    };
  }

  // Rule 5: default.
  return {
    modality: 'STATIC',
    rationale_id: 'default_static',
    rationale: 'no rule matched — fallback STATIC',
  };
}

// ---------------------------------------------------------------------------
// Modality → scene-type hint for gif-generator
// ---------------------------------------------------------------------------

export type SceneHint = 'parametric' | 'function-trace' | null;

/** Hint for gif-generator.ts scene type selection when modality=DYNAMIC. */
export function sceneHintForTopic(topicFamily: string): SceneHint {
  if (topicFamily === 'complex-analysis' || topicFamily === 'differential-equations') {
    return 'parametric';
  }
  if (DYNAMIC_TOPIC_FAMILIES.has(topicFamily)) {
    return 'function-trace';
  }
  return null;
}
