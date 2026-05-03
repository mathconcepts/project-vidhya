/**
 * src/blueprints/arbitrator.ts
 *
 * Proposes a ContentBlueprint for a (concept, exam_pack, target_difficulty)
 * input. Two layers, in order:
 *
 *   1. Deterministic template engine (always runs; cheap, predictable)
 *   2. Optional LLM judge that may OVERRIDE specific stages (gated by
 *      VIDHYA_BLUEPRINT_LLM_JUDGE=on; falls back to template on failure)
 *
 * The arbitrator never bypasses the validator — anything it produces
 * must pass `validateDecisions`, otherwise the template baseline ships
 * unchanged with confidence reduced.
 *
 * Confidence:
 *   - template-only:   0.6 (predictable but un-tuned)
 *   - llm overlay ok:  0.85 (adaptive; LLM agreed or improved)
 *   - llm overlay bad: 0.6 (we fell back; same shape as template)
 *
 * `requires_review` is set when confidence < threshold (default 0.7;
 *  configurable via VIDHYA_BLUEPRINT_REVIEW_THRESHOLD).
 */

import type {
  BlueprintDecisionsV1,
  BlueprintStage,
} from './types';
import { buildTemplateBlueprint, TEMPLATE_VERSION, type TemplateInput } from './template-engine';
import { validateDecisions } from './validator';

export const ARBITRATOR_VERSION = 'v1.0';

const TEMPLATE_CONFIDENCE = 0.6;
const LLM_CONFIDENCE = 0.85;

export type LlmJudgeFn = (input: LlmJudgeInput) => Promise<LlmJudgeOutput | null>;

export interface LlmJudgeInput {
  concept_id: string;
  exam_pack_id: string;
  target_difficulty: 'easy' | 'medium' | 'hard';
  topic_family: string | undefined;
  template_blueprint: BlueprintDecisionsV1;
}

/**
 * Subset the LLM is allowed to influence. Operators can edit the full
 * blueprint later; the LLM may only OVERRIDE specific stages or add a
 * note — it cannot invent new structure.
 */
export interface LlmJudgeOutput {
  /** Per-stage overrides keyed by StageKind. Missing keys → keep template's. */
  stage_overrides?: Record<string, Partial<Pick<BlueprintStage, 'atom_kind' | 'rationale_id' | 'rationale_note'>>>;
  /** Free-form note attached to the FIRST stage as rationale_note (visible in UI). */
  override_summary?: string;
}

export interface ArbitratorInput extends TemplateInput {
  /** Pass an injected LLM judge for tests; default = real Gemini call when gate is on. */
  llmJudge?: LlmJudgeFn;
  /** Optional inline rulesets for tests; default = DB lookup via applicableRulesets. */
  rulesets?: import('./types').BlueprintConstraint[];
}

export interface ArbitratorResult {
  decisions: BlueprintDecisionsV1;
  template_version: string;
  arbitrator_version: string;
  confidence: number;
  requires_review: boolean;
  /** Diagnostic — was the LLM judge invoked + did it succeed? */
  llm_judge_status: 'disabled' | 'invoked_ok' | 'invoked_failed' | 'invoked_invalid' | 'no_change';
}

export async function proposeBlueprint(input: ArbitratorInput): Promise<ArbitratorResult> {
  let baseline = buildTemplateBlueprint(input);

  // Layer in operator rulesets BEFORE the LLM judge runs. Rulesets
  // surface as constraints so the judge can read them in the prompt
  // and respect them in its overrides.
  baseline = await overlayRulesets(baseline, input);

  const judgeEnabled = process.env.VIDHYA_BLUEPRINT_LLM_JUDGE === 'on';
  const judge = input.llmJudge ?? (judgeEnabled ? defaultGeminiJudge : null);

  if (!judge) {
    return finalize(baseline, TEMPLATE_CONFIDENCE, 'disabled');
  }

  let overlayResult: LlmJudgeOutput | null = null;
  try {
    overlayResult = await judge({
      concept_id: input.concept_id,
      exam_pack_id: input.exam_pack_id,
      target_difficulty: input.target_difficulty,
      topic_family: input.topic_family,
      template_blueprint: baseline,
    });
  } catch (err) {
    console.warn(`[arbitrator] llm judge threw: ${(err as Error).message}`);
    return finalize(baseline, TEMPLATE_CONFIDENCE, 'invoked_failed');
  }

  if (!overlayResult) {
    return finalize(baseline, TEMPLATE_CONFIDENCE, 'no_change');
  }

  const overlaid = applyOverlay(baseline, overlayResult);
  const v = validateDecisions(overlaid);
  if (!v.ok) {
    console.warn(
      `[arbitrator] llm overlay produced invalid decisions: ${v.errors.map((e) => e.path).join(', ')}`,
    );
    return finalize(baseline, TEMPLATE_CONFIDENCE, 'invoked_invalid');
  }

  return finalize(overlaid, LLM_CONFIDENCE, 'invoked_ok');
}

// ----------------------------------------------------------------------------

async function overlayRulesets(
  baseline: BlueprintDecisionsV1,
  input: ArbitratorInput,
): Promise<BlueprintDecisionsV1> {
  // Test seam: callers can pass a synchronous ruleset list to bypass DB.
  let constraints: import('./types').BlueprintConstraint[] = [];
  if (input.rulesets) {
    constraints = input.rulesets;
  } else {
    try {
      const { applicableRulesets, rulesetsToConstraints } = await import('./rulesets');
      const rs = await applicableRulesets(input.exam_pack_id, input.concept_id);
      constraints = rulesetsToConstraints(rs);
    } catch (err) {
      console.warn(`[arbitrator] ruleset lookup failed: ${(err as Error).message}`);
      return baseline;
    }
  }
  if (constraints.length === 0) return baseline;
  return {
    ...baseline,
    constraints: [...baseline.constraints, ...constraints],
  };
}

function finalize(
  decisions: BlueprintDecisionsV1,
  confidence: number,
  status: ArbitratorResult['llm_judge_status'],
): ArbitratorResult {
  return {
    decisions,
    template_version: TEMPLATE_VERSION,
    arbitrator_version: ARBITRATOR_VERSION,
    confidence,
    requires_review: confidence < reviewThreshold(),
    llm_judge_status: status,
  };
}

function reviewThreshold(): number {
  const raw = process.env.VIDHYA_BLUEPRINT_REVIEW_THRESHOLD;
  if (!raw) return 0.7;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 && n < 1 ? n : 0.7;
}

/**
 * Apply the LLM's per-stage overrides to the baseline. Pure function;
 * does not mutate baseline.
 */
export function applyOverlay(
  baseline: BlueprintDecisionsV1,
  overlay: LlmJudgeOutput,
): BlueprintDecisionsV1 {
  const stages = baseline.stages.map((stage, idx) => {
    const override = overlay.stage_overrides?.[stage.id];
    if (!override) return stage;
    return {
      ...stage,
      ...(override.atom_kind && { atom_kind: override.atom_kind }),
      ...(override.rationale_id && { rationale_id: override.rationale_id }),
      ...(override.rationale_note !== undefined && { rationale_note: override.rationale_note }),
      ...(idx === 0 && overlay.override_summary && !override.rationale_note
        ? { rationale_note: overlay.override_summary }
        : {}),
    };
  });

  // If override_summary is provided but no per-stage note absorbed it,
  // attach it to the first stage anyway.
  if (overlay.override_summary && !stages[0].rationale_note) {
    stages[0] = { ...stages[0], rationale_note: overlay.override_summary };
  }

  return { ...baseline, stages };
}

// ----------------------------------------------------------------------------
// Default Gemini judge (lazy-loaded so test paths don't need GEMINI_API_KEY)
// ----------------------------------------------------------------------------

const defaultGeminiJudge: LlmJudgeFn = async (input) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[arbitrator] GEMINI_API_KEY unset; skipping LLM judge');
    return null;
  }
  // Use the existing sync callChat plumbing — no need to drag the batch
  // adapter into the path (this is a single short call).
  const { callChat } = await import('../api/llm-config-routes');

  const prompt = buildJudgePrompt(input);
  let raw: string;
  try {
    raw = await callChat({
      provider_id: 'gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta',
      key: process.env.GEMINI_API_KEY,
      model_id: 'gemini-2.5-flash',
      prompt,
      max_tokens: 600,
    });
  } catch (err) {
    console.warn(`[arbitrator] gemini call failed: ${(err as Error).message}`);
    return null;
  }

  return parseJudgeOutput(raw);
};

export function buildJudgePrompt(input: LlmJudgeInput): string {
  return [
    'You are reviewing a content-generation BLUEPRINT for a single concept of an exam-prep platform.',
    'A blueprint specifies which atom kinds (visual_analogy / manipulable / mcq / etc.) to generate at which stage (intuition / discovery / formalism / practice / pyq_anchor).',
    '',
    `Concept: ${input.concept_id}`,
    `Exam pack: ${input.exam_pack_id}`,
    `Target difficulty: ${input.target_difficulty}`,
    input.topic_family ? `Topic family: ${input.topic_family}` : '',
    '',
    'Template baseline:',
    JSON.stringify(input.template_blueprint, null, 2),
    '',
    'Your job: decide whether to override any STAGE atom_kind based on the concept\'s pedagogical fit.',
    'Rules:',
    '- You can ONLY change atom_kind / rationale_id / rationale_note on existing stages.',
    '- You CANNOT add or remove stages.',
    '- atom_kind must be one of: visual_analogy, manipulable, simulation, guided_walkthrough, mcq, free_text, worked_example, pyq_anchor.',
    '- If the template is fine, return {} for stage_overrides.',
    '- Be conservative: only override if you have a strong pedagogical reason.',
    '',
    'Respond with ONLY a JSON object of this shape:',
    '{ "stage_overrides": { "<stage_id>": { "atom_kind": "...", "rationale_id": "...", "rationale_note": "..." } }, "override_summary": "<short rationale>" }',
  ].filter(Boolean).join('\n');
}

export function parseJudgeOutput(raw: string): LlmJudgeOutput | null {
  // Tolerate code-fenced JSON, prose preamble, etc.
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as LlmJudgeOutput;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const __testing = { defaultGeminiJudge, reviewThreshold };
