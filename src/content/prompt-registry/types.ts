/**
 * src/content/prompt-registry/types.ts
 *
 * Wolfram Prompt Repository-inspired typed resource registry (plan:
 * docs/designs/2026-09-02-wolfram-prompt-resource-registry.md). Turns the
 * content pipeline's prompt-shaping code — today four hardcoded function
 * calls inside orchestrator.ts's buildPrompt() — into a catalog of named,
 * versioned, governed resources.
 *
 * Locked v1 discipline, same as blueprints/types.ts: this shape is
 * permanent. A future incompatible change ships as a parallel `V2` type,
 * never a mutation in place.
 *
 * Two axes this registry deliberately does NOT own:
 *   - Content-item quality gating stays content_gate_ledger's job
 *     (scope/mathematics/assessment_contract/misconception_coverage/
 *     provenance — migration 055). approval_state below governs whether a
 *     PROMPT RESOURCE is safe to use; content_gate_ledger governs whether
 *     a GENERATED ITEM is safe to serve. Conflating the two would
 *     duplicate an existing, already-adequate system.
 *   - Answer/content correctness verification stays AnswerVerifier
 *     (src/verification/verifiers/types.ts) and ContentVerifier
 *     (src/content/verifiers/types.ts). The 'verifier' category below
 *     REGISTERS those existing implementations under one typed catalog;
 *     it does not reimplement verification logic.
 */

export const RESOURCE_CATEGORIES = [
  'persona',
  'research_function',
  'teaching_function',
  'assessment_function',
  'diagnosis_function',
  'modifier',
  'verifier',
  'renderer',
  'governance',
] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const APPROVAL_STATES = [
  'draft',
  'benchmarked',
  'pilot',
  'released',
  'deprecated',
  'blocked',
] as const;
export type ApprovalState = (typeof APPROVAL_STATES)[number];

/**
 * Only these two states are ever returned by resolvePromptResources() —
 * a resource in any other state is invisible to prompt composition, the
 * same "unreviewed content never reaches a prompt" discipline
 * src/registry/pain-points.ts already enforces for pain-point modules.
 */
export const RESOLVABLE_APPROVAL_STATES: ReadonlySet<ApprovalState> = new Set(['released', 'pilot']);

/**
 * Subset of orchestrator.ts's GenerateOneArgs — reused, not reinvented, so
 * resource authors never see a shape that drifts from what buildPrompt()
 * actually has in hand. Extend this (additively) rather than have
 * resources reach into orchestrator-internal types directly.
 */
export interface PromptResourceBuildArgs {
  concept_id: string;
  topic_family: string;
  atom_type: string;
  generation_context?: 'batch' | 'personalized';
  student_context?: unknown;
}

/**
 * A named, versioned, governed unit of prompt-shaping behavior.
 *
 * build() returns '' when the resource doesn't apply to this call — a
 * no-op, not a disagreement. This mirrors ContentVerifier's "never throw
 * for inapplicable" discipline, not AnswerVerifier's (which always
 * returns a verdict): a prompt block that has nothing to say for this
 * atom_type/topic is silence, not an error.
 */
export interface PromptResource {
  readonly resource_id: string;
  readonly version: string;
  readonly category: ResourceCategory;
  /** Topic-family or concept_id patterns this resource applies to. `['*']` = all. */
  readonly topics: readonly string[];
  readonly required_inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly approval_state: ApprovalState;
  readonly evidence_requirements: readonly string[];
  /** resource_ids this resource requires or conflicts with. Advisory today — not yet enforced by the registry. */
  readonly compatibility: readonly string[];
  /** resource_id (optionally "@version") to fall back to if this resource is deprecated/blocked. */
  readonly rollback_target: string | null;
  /** Names of fixtures in this resource's own test file — required non-empty before 'released'. */
  readonly test_fixtures: readonly string[];
  build(args: PromptResourceBuildArgs): string;
}

/**
 * Modifiers are delivery-only controls (Wolfram registry's own framing):
 * they may change HOW content is presented, never WHAT it mathematically
 * claims. allowed_changes/forbidden_changes make that boundary an
 * inspectable fact about the resource, not a comment someone has to trust.
 */
export interface Modifier extends PromptResource {
  readonly category: 'modifier';
  readonly allowed_changes: readonly string[];
  readonly forbidden_changes: readonly string[];
}

export function isModifier(resource: PromptResource): resource is Modifier {
  return resource.category === 'modifier';
}
