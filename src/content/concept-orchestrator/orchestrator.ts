/**
 * orchestrator.ts — ConceptGenerationOrchestrator (v1).
 *
 * Given a concept_id (and optional learning objective), produces a coherent
 * draft set across the configured atom_types in one batch. The cascade per
 * atom_type:
 *
 *   1. Look up per-topic-family template (E6 YAML)
 *   2. Pull PYQ grounding when atom_type is exam-relevant (E3)
 *   3. Wolfram-ground when math is involved (existing kag-generator pattern)
 *   4. Generate via LLM (Claude default) — for math atoms, generate a second
 *      version via Gemini and run consensus (E2)
 *   5. LLM-judge eval gate (E1) — score < 7 auto-rejects with "why"
 *   6. Track per-concept cost (E8) — hard-stop at monthly cap
 *   7. Append to atom_versions as inactive (admin reviews + activates)
 *
 * Drafts are also written into content-studio's existing JSONL log so the
 * existing approve/reject flow surfaces them. Wiring into content-studio
 * keeps the audit trail single-sourced.
 */

import type { AtomType, BloomLevel } from '../content-types';
import { loadInteractiveSpecParser } from '../interactive-spec-loader';
import type {
  ConceptDraft,
  GeneratedAtom,
  GenerationMeta,
  GenerationSource,
  OrchestratorOptions,
} from './types';
import { getTemplate } from './template-loader';
import { groundForLO, groundForLOWithEmbedding, formatPyqContext } from './pyq-grounding';
import { canSpend, recordSpend, DEFAULT_MONTHLY_CAP_USD } from './concept-cost';
import { scoreAtom, passesGate } from './llm-judge';
import { compareMathAtoms, requiresConsensus } from './multi-llm-consensus';
import { resolveModelForAtom, type TierModels } from './model-tiers';
import { casPreVerify } from './cas-pre-verifier';
import { appendVersion } from './atom-versions';
import { writeArtifact, markFailed as markMediaFailed } from './media-artifacts';
import { renderScene, isKnownSceneType, type SceneDescription } from './gif-generator';
// Phase B of personalization plan — see buildPrompt() for usage.
// Decoupled via a single-function import so the orchestrator stays
// generic; if the personalization module is removed, the orchestrator
// silently falls back to today's generic prompts.
import { toPromptText as _toPromptTextRef } from '../../personalization/student-context';
import { generateNarration, shouldNarrate } from './tts-generator';
// E1 Pain-Point Registry — cohort-level prompt steering from reviewed modules.
// Falls back silently (empty string) when no reviewed entry exists.
import { buildPainPointPromptBlock } from '../../registry/pain-points';
import { buildPatternPromptBlock } from '../../registry/pedagogy-patterns';
// Resonance plan §W4 — per-topic attention strategy, joined from the
// founder's content-generation spec via the hand-verified concept crosswalk.
// Pure, memoized, read-only — see resonance-strategy.ts's own header for the
// N:1 merge rule (eigenvalues ← LA-06+LA-07).
import { resonanceStrategyFor, type ResonanceStrategy } from '../resonance-strategy';

export const ALL_ATOM_TYPES: AtomType[] = [
  'hook', 'intuition', 'formal_definition', 'visual_analogy',
  'worked_example', 'micro_exercise', 'common_traps',
  'retrieval_prompt', 'interleaved_drill', 'mnemonic', 'exam_pattern',
];

// Default Bloom level + difficulty per atom_type when the template doesn't
// override. Mirrors the existing seed-content patterns.
const ATOM_TYPE_DEFAULTS: Record<AtomType, { bloom: BloomLevel; difficulty: number }> = {
  hook:               { bloom: 1, difficulty: 0.0 },
  intuition:          { bloom: 2, difficulty: 0.1 },
  formal_definition:  { bloom: 3, difficulty: 0.3 },
  visual_analogy:     { bloom: 2, difficulty: 0.2 },
  worked_example:     { bloom: 3, difficulty: 0.5 },
  micro_exercise:     { bloom: 3, difficulty: 0.4 },
  common_traps:       { bloom: 4, difficulty: 0.4 },
  retrieval_prompt:   { bloom: 2, difficulty: 0.3 },
  interleaved_drill:  { bloom: 4, difficulty: 0.6 },
  mnemonic:           { bloom: 2, difficulty: 0.2 },
  exam_pattern:       { bloom: 3, difficulty: 0.4 },
};

// Cost estimate per atom_type — tuned to typical Claude/Gemini latency
// + Wolfram calls. Refined as actual telemetry comes in.
const ESTIMATED_COST_USD: Record<AtomType, number> = {
  hook: 0.005,
  intuition: 0.010,
  formal_definition: 0.025,    // x2 due to consensus
  visual_analogy: 0.010,
  worked_example: 0.030,        // x2 due to consensus + Wolfram verify
  micro_exercise: 0.010,
  common_traps: 0.015,
  retrieval_prompt: 0.005,
  interleaved_drill: 0.020,
  mnemonic: 0.005,
  exam_pattern: 0.015,
};

/**
 * Generate a concept's atom draft set.
 *
 * The function is structured so that the caller can run it dry-run-first
 * to preview cost/quality, then run it again with `dry_run: false` to
 * persist to atom_versions.
 */
export async function generateConcept(
  opts: OrchestratorOptions,
): Promise<ConceptDraft> {
  const atom_types = opts.atom_types ?? ALL_ATOM_TYPES;
  const cap = opts.cost_cap_usd ?? DEFAULT_MONTHLY_CAP_USD;

  // Pre-flight cost gate. We check before each atom too, but failing fast
  // here means we don't pay any LLM tokens when the concept is over cap.
  const preflight = await canSpend(opts.concept_id, cap);
  if (!preflight.allowed && !opts.dry_run) {
    return {
      concept_id: opts.concept_id,
      lo_id: opts.lo_id,
      topic_family: opts.topic_family,
      generated_at: new Date().toISOString(),
      total_cost_usd: 0,
      atoms: [],
      rejected_atoms: atom_types.map((t) => ({
        atom_id: `${opts.concept_id}.${t}`,
        concept_id: opts.concept_id,
        atom_type: t,
        bloom_level: ATOM_TYPE_DEFAULTS[t].bloom,
        difficulty: ATOM_TYPE_DEFAULTS[t].difficulty,
        exam_ids: ['*'],
        content: '',
        meta: emptyMeta({
          auto_rejected: {
            score: 0,
            reason: `Concept budget exhausted: $${preflight.state.spent_usd.toFixed(2)} / $${cap}/month`,
          },
        }),
      })),
    };
  }

  const accepted: GeneratedAtom[] = [];
  const rejected: GeneratedAtom[] = [];
  let total_cost = 0;
  const total_steps = atom_types.length;

  opts.on_progress?.({ type: 'start', step_index: 0, total_steps });

  for (const [idx, atom_type] of atom_types.entries()) {
    opts.on_progress?.({
      type: 'atom_started',
      step_index: idx,
      total_steps,
      atom_type,
    });
    // Re-check cost before every atom — multi-LLM consensus on math atoms
    // can blow the cap mid-batch.
    const state = await canSpend(opts.concept_id, cap);
    if (!state.allowed && !opts.dry_run) {
      rejected.push({
        atom_id: `${opts.concept_id}.${atom_type}`,
        concept_id: opts.concept_id,
        atom_type,
        bloom_level: ATOM_TYPE_DEFAULTS[atom_type].bloom,
        difficulty: ATOM_TYPE_DEFAULTS[atom_type].difficulty,
        exam_ids: ['*'],
        content: '',
        meta: emptyMeta({
          auto_rejected: {
            score: 0,
            reason: 'Mid-batch cost cap exceeded — partial draft set returned',
          },
        }),
      });
      continue;
    }

    const generated = await generateOne({
      concept_id: opts.concept_id,
      lo_id: opts.lo_id,
      topic_family: opts.topic_family,
      atom_type,
      student_context: opts.student_context,
      model_id: opts.model_id,
      tier_models: opts.tier_models,
      // Resonance plan §W4 — defaults to 'batch' inside generateOne/buildPrompt
      // when opts carries nothing (every pre-existing caller), so this wiring
      // is a no-op for them.
      generation_context: opts.generation_context,
    });

    total_cost += generated.meta.cost_usd;

    // Run LLM-judge gate.
    const judge = await scoreAtom(generated);
    generated.meta.llm_judge_score = judge.score;

    if (!passesGate(judge)) {
      generated.meta.auto_rejected = {
        score: judge.score,
        reason: judge.reason,
      };
      rejected.push(generated);
      opts.on_progress?.({
        type: 'atom_rejected',
        step_index: idx,
        total_steps,
        atom_type,
        atom_id: generated.atom_id,
        judge_score: judge.score,
        reason: judge.reason,
      });
      continue;
    }

    // CAS pre-verification gate (VIDHYA_CAS_PREFLIGHT: off|shadow|on).
    // Runs after LLM judge so we don't spend Wolfram calls on atoms that
    // would be rejected on quality anyway. Never throws — all cascade
    // failures surface as skipped=true.
    const casResult = await casPreVerify(generated, opts.topic_family);
    if (!casResult.skipped) {
      generated.meta.cas_pre_verified = casResult.verified;
      // Fix wolfram_grounded: only true when Wolfram actually ran
      if (casResult.verified) generated.meta.wolfram_grounded = true;
    } else {
      generated.meta.cas_pre_verified = null;
    }
    if (!casResult.skipped && !casResult.verified &&
        process.env.VIDHYA_CAS_PREFLIGHT === 'on') {
      generated.meta.auto_rejected = {
        score: generated.meta.llm_judge_score ?? 0,
        reason: casResult.reason ?? 'CAS pre-verification: Wolfram disagreed with stated answer',
      };
      rejected.push(generated);
      opts.on_progress?.({
        type: 'atom_rejected',
        step_index: idx,
        total_steps,
        atom_type,
        atom_id: generated.atom_id,
        judge_score: generated.meta.llm_judge_score,
        reason: generated.meta.auto_rejected.reason,
      });
      continue;
    }

    accepted.push(generated);
    opts.on_progress?.({
      type: 'atom_finished',
      step_index: idx,
      total_steps,
      atom_type,
      atom_id: generated.atom_id,
      sources: generated.meta.source_cascade,
      judge_score: judge.score,
    });

    if (!opts.dry_run) {
      const cost_meta = atom_type === 'worked_example' || atom_type === 'formal_definition'
        ? { llm_tokens: 4000, wolfram_calls: 1 }
        : { llm_tokens: 2000, wolfram_calls: 0 };
      await recordSpend(opts.concept_id, generated.meta.cost_usd, cost_meta);
      const versionRow = await appendVersion(
        generated.atom_id,
        generated.content,
        generated.meta,
        undefined,
        opts.generation_run_id,
      );
      // §4.15 multi-modal: generate media sidecars after the version is
      // committed. Best-effort — failure here doesn't undo the atom.
      if (versionRow) {
        await maybeGenerateMedia(generated, versionRow.version_n).catch((err) => {
          console.warn(`[orchestrator] media generation failed for ${generated.atom_id}: ${(err as Error).message}`);
        });
      }
    }
  }

  opts.on_progress?.({
    type: 'done',
    step_index: total_steps,
    total_steps,
    total_cost_usd: total_cost,
    total_accepted: accepted.length,
    total_rejected: rejected.length,
  });

  return {
    concept_id: opts.concept_id,
    lo_id: opts.lo_id,
    topic_family: opts.topic_family,
    generated_at: new Date().toISOString(),
    total_cost_usd: total_cost,
    atoms: accepted,
    rejected_atoms: rejected,
  };
}

interface GenerateOneArgs {
  concept_id: string;
  lo_id?: string;
  topic_family: string;
  atom_type: AtomType;
  /**
   * Phase B — opaque student-context payload. When present, the prompt
   * formatter (toPromptText) renders it as a verbose prefix that steers
   * tone/level/misconception-targeting. Defaults to absent → today's
   * generic prompt is unchanged for anonymous and uncalled paths.
   */
  student_context?: unknown;
  /**
   * Operator-selected primary generation model id (e.g. from an admin-
   * launched GenerationRun's config.pipeline.llm_models[0]). Defaults to
   * DEFAULT_MODEL_ID (Claude) when absent, preserving pre-multi-provider
   * behavior for callers that don't surface a model choice.
   */
  model_id?: string;
  /**
   * Operator-selected model per cognitive tier. Used when `model_id` is
   * absent: a reasoning atom goes to the thinking model, a formatting atom to
   * the cheaper one. See model-tiers.ts for which atom types are which and
   * why that classification is not itself operator-editable.
   */
  tier_models?: TierModels;
  /**
   * Resonance plan §W4 — see OrchestratorOptions.generation_context (types.ts)
   * for the full contract. Defaults to 'batch'; threaded straight through
   * from generateConcept's opts.
   */
  generation_context?: 'batch' | 'personalized';
}

async function generateOne(args: GenerateOneArgs): Promise<GeneratedAtom> {
  const template = getTemplate(args.topic_family, args.atom_type);
  // Try semantic vector search first when the corpus has embeddings (4.11),
  // fall back to topic-keyword lookup. The grounding module handles the
  // cascade internally — caller just supplies an optional embedding.
  const queryEmbedding = await maybeEmbedQuery(args);
  const pyqGrounding = queryEmbedding
    ? await groundForLOWithEmbedding(args.concept_id, args.atom_type, queryEmbedding)
    : await groundForLO(args.concept_id, args.atom_type);

  const prompt = buildPrompt({
    ...args,
    template_scaffold: template?.scaffold ?? 'generic',
    template_guidance: template?.guidance ?? '',
    pyq_context: formatPyqContext(pyqGrounding),
  });

  const { content: rawContent, sourceCascade, consensusMeta } = await generateAtomContent(args, prompt);

  const atomId = `${args.concept_id}.${args.atom_type.replace('_', '-')}`;
  // Resonance plan §W4 — post-generation interactive-spec fence validation.
  // Runs unconditionally for EVERY caller (batch and personalized alike);
  // see enforceInteractiveSpecPolicy's own doc comment for the two things
  // it does (regen-once-then-strip on invalid shape; unconditional strip of
  // any simulation fence on the personalized path).
  const { content, regenCalls } = await enforceInteractiveSpecPolicy(atomId, args, prompt, rawContent);

  const defaults = ATOM_TYPE_DEFAULTS[args.atom_type];
  const meta: GenerationMeta = {
    source_cascade: sourceCascade,
    wolfram_grounded: pyqGrounding.length > 0,  // refined when we actually call Wolfram
    pyq_grounded: pyqGrounding.map((g) => g.pyq_id),
    template: template ? `${args.topic_family}.${args.atom_type}` : undefined,
    generated_at: new Date().toISOString(),
    // A fence-validation regeneration is a second full LLM call — it must
    // reach recordSpend/canSpend, not ride free on the single-call estimate
    // (adversarial + red-team confirmed finding, 2026-08-30).
    cost_usd: ESTIMATED_COST_USD[args.atom_type] * (1 + regenCalls),
    ...consensusMeta,
  };

  return {
    atom_id: atomId,
    concept_id: args.concept_id,
    atom_type: args.atom_type,
    bloom_level: (template?.bloom_floor as BloomLevel | undefined) ?? defaults.bloom,
    difficulty: defaults.difficulty,
    exam_ids: ['*'],
    content,
    meta,
  };
}

/**
 * The model-calling half of generateOne, factored out so
 * `enforceInteractiveSpecPolicy`'s one-time regeneration attempt can invoke
 * exactly the same cascade (single call, or dual-model consensus) a second
 * time against the same prompt without duplicating either branch. Behavior
 * unchanged from the pre-resonance-plan generateOne — this is a pure
 * extraction, not a logic change.
 */
async function generateAtomContent(
  args: GenerateOneArgs,
  prompt: string,
): Promise<{
  content: string;
  sourceCascade: GenerationSource[];
  consensusMeta?: { llm_consensus: boolean; consensus_disagreement?: any };
}> {
  const sourceCascade: GenerationSource[] = [];
  let content = '';
  let consensusMeta: { llm_consensus: boolean; consensus_disagreement?: any } | undefined;

  // Math atoms go through dual-model consensus.
  if (requiresConsensus(args.atom_type)) {
    // Consensus atoms are thinking atoms by construction (model-tiers.ts
    // enforces it), so this resolves to the thinking model unless the run
    // pinned one explicitly.
    const primaryModelId = resolveModelForAtom(args.atom_type, {
      tierModels: args.tier_models,
      explicitModelId: args.model_id,
    });
    const secondaryModelId = await pickConsensusSecondary(primaryModelId);
    // Labels are historical — 'llm-claude'/'llm-gemini' now mean "primary
    // leg" / "secondary consensus leg" rather than literally Claude/Gemini,
    // since either can be any configured provider's model. See
    // GenerationSource's doc comment.
    sourceCascade.push('llm-claude', 'llm-gemini');
    const distinctProviders = secondaryModelId
      ? await consensusProvidersAreDistinct(primaryModelId, secondaryModelId)
      : false;
    const [primary, secondary] = distinctProviders && secondaryModelId
      ? await Promise.all([
          callLlm(prompt, primaryModelId),
          callLlm(prompt, secondaryModelId),
        ])
      // No credentialed second provider available (or both legs would hit
      // the same provider) — treat as "one leg unavailable" (the existing
      // degraded-consensus path below) rather than firing a call we
      // already know can't authenticate. Use the operator's actual
      // primary choice for the one call we do make.
      : [await callLlm(prompt, primaryModelId), ''];
    if (!primary && !secondary) {
      content = '';
    } else if (!secondary) {
      content = primary;
      consensusMeta = { llm_consensus: false, consensus_disagreement: { models: [secondaryModelId ?? 'none'], reason: !secondaryModelId ? 'no credentialed second provider configured — consensus skipped' : distinctProviders ? `${secondaryModelId} call failed` : `${primaryModelId} and ${secondaryModelId} resolve to the same provider — consensus refused` } };
    } else if (!primary) {
      content = secondary;
      consensusMeta = { llm_consensus: false, consensus_disagreement: { models: [primaryModelId], reason: `${primaryModelId} call failed` } };
    } else {
      const cmp = compareMathAtoms(args.atom_type, primary, secondary);
      content = primary;
      consensusMeta = { llm_consensus: cmp.agreed };
      if (!cmp.agreed) {
        consensusMeta.consensus_disagreement = { models: [primaryModelId, secondaryModelId], reason: cmp.reason };
      }
    }
  } else {
    sourceCascade.push('llm-claude');
    content =
      (await callLlm(
        prompt,
        resolveModelForAtom(args.atom_type, {
          tierModels: args.tier_models,
          explicitModelId: args.model_id,
        }),
      )) || '';
  }

  return { content, sourceCascade, consensusMeta };
}

// ─── Resonance plan §W4 — post-generation interactive-spec fence policy ───
//
// The dynamic-import loader for the renderer's real parser now lives in the
// shared `src/content/interactive-spec-loader.ts` (resonance plan §W5) so
// this orchestrator and `admin-content-maturity-routes.ts` share exactly one
// loading/degradation implementation instead of two copies that could drift.

const INTERACTIVE_SPEC_FENCE_RE = /```interactive-spec\s*[\s\S]*?```/m;

/** Strip a fenced ```interactive-spec``` block, keeping the surrounding prose. */
function stripInteractiveSpecFence(content: string): string {
  return content.replace(INTERACTIVE_SPEC_FENCE_RE, '').trim();
}

/**
 * Post-generation interactive-spec fence policy (resonance plan §W4). Runs
 * unconditionally for every generateOne caller, regardless of atom_type or
 * generation_context:
 *
 *   1. No fence in the body → no-op, return content unchanged.
 *   2. Fence present, validator unavailable (see loadInteractiveSpecParser)
 *      → logged, content shipped unvalidated (today an invalid generated
 *      fence would otherwise silently render nothing on the student
 *      surface — `InteractiveSidecar` swallows parse errors — so even this
 *      degraded path is strictly better than doing nothing).
 *   3. Fence present, invalid shape → ONE regeneration attempt against the
 *      identical prompt. Still invalid (or the regeneration produced no
 *      content) → strip the fence, keep the prose, log a warning naming
 *      the atom id and the reason.
 *   4. `generation_context === 'personalized'` AND the (possibly
 *      regenerated) fence is valid AND its kind is `simulation` → stripped
 *      unconditionally, logged. This is layer 2 of the P0 eng-review fix:
 *      layer 1 is buildPrompt never asking for a scene on this path in the
 *      first place; this layer defends against the model emitting one
 *      anyway, or shape validation passing on well-formed but WRONG
 *      mathematics that schema validation cannot catch. The
 *      personalized-regen path writes straight into student_atom_overrides
 *      with no CI gate, no Wolfram check, no human pedagogy review, so an
 *      unreviewed scene must never reach a struggling student — full stop.
 */
async function enforceInteractiveSpecPolicy(
  atomId: string,
  args: GenerateOneArgs,
  prompt: string,
  content: string,
): Promise<{ content: string; regenCalls: 0 | 1 }> {
  if (!content.includes('```interactive-spec')) return { content, regenCalls: 0 };

  const parseSpec = await loadInteractiveSpecParser();
  if (!parseSpec) {
    console.warn(`[orchestrator] ${atomId}: interactive-spec fence present but the validator is unavailable in this process — shipping unvalidated`);
    return { content, regenCalls: 0 };
  }

  let check = parseSpec(content);
  let finalContent = content;
  let regenCalls: 0 | 1 = 0;

  if (!check.ok) {
    console.warn(`[orchestrator] ${atomId}: invalid interactive-spec fence (${check.reason}) — regenerating once`);
    regenCalls = 1;
    const regen = await generateAtomContent(args, prompt);
    if (regen.content) {
      const recheck = parseSpec(regen.content);
      if (recheck.ok) {
        finalContent = regen.content;
        check = recheck;
      } else {
        console.warn(`[orchestrator] ${atomId}: regeneration still invalid (${recheck.reason}) — stripping fence, keeping prose`);
        return { content: stripInteractiveSpecFence(regen.content), regenCalls };
      }
    } else {
      console.warn(`[orchestrator] ${atomId}: regeneration produced no content — stripping fence, keeping prose`);
      return { content: stripInteractiveSpecFence(content), regenCalls };
    }
  }

  if (args.generation_context === 'personalized' && check.ok && check.spec?.kind === 'simulation') {
    console.warn(`[orchestrator] ${atomId}: stripped simulation fence on personalized-regen path — unreviewed scenes never reach student_atom_overrides`);
    return { content: stripInteractiveSpecFence(finalContent), regenCalls };
  }

  return { content: finalContent, regenCalls };
}

/**
 * Resonance plan §W4 — the fifth prompt block for hook/intuition atoms in
 * BATCH generation only (see buildPrompt's generationContext gate). Two
 * independent pieces:
 *   1. The founder's per-topic strategy (resonanceStrategyFor) when one
 *      resolves for this concept — omitted entirely on null, never
 *      fabricated (mirrors resonance-strategy.ts's own discipline).
 *   2. The beat-scripting instruction, which applies whether or not a
 *      per-topic strategy exists for this concept — it's the mechanism
 *      (schema + trap + stance text), not the strategy data.
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

function buildPrompt(args: GenerateOneArgs & {
  template_scaffold: string;
  template_guidance: string;
  pyq_context: string;
}): string {
  // Phase B of personalization plan — when a student_context is threaded
  // through, render a verbose prefix that steers tone/level/misconception-
  // targeting. The formatter is the SOLE boundary where context fields
  // become prompt bytes; absent context → identical prompt to pre-Phase-B.
  const studentContextBlock = args.student_context
    ? renderStudentContextBlock(args.student_context)
    : '';

  // E1 Pain-Point Registry — inject cohort-level pain steering for reviewed modules.
  // topic_family maps to module name (e.g. 'linear-algebra', 'calculus').
  const painPointBlock = buildPainPointPromptBlock(args.topic_family, args.concept_id);

  // E4 Pedagogy Pattern Library — inject active prompt directives for the module.
  const patternBlock = buildPatternPromptBlock(args.topic_family);

  // Resonance plan §W4 — batch generation ONLY. NEVER personalized-regen:
  // an LLM-authored ghost path or trap "avoid" line reaching a struggling
  // student unreviewed is exactly the harm this gate exists to prevent (the
  // P0 eng-review finding on this plan). Hook/intuition are the fusion
  // surface (plan §1/§2) — every other atom type is unaffected either way.
  const generationContext = args.generation_context ?? 'batch';
  const isBeatAtom = args.atom_type === 'hook' || args.atom_type === 'intuition';
  const resonanceEligible = isBeatAtom && generationContext === 'batch';
  const resonanceBlock = resonanceEligible
    ? buildResonanceBlock(resonanceStrategyFor(args.concept_id))
    : '';

  const closingInstruction = args.atom_type === 'worked_example'
    ? 'worked_example: separate steps with `\\n---\\n` and end with "Answer: <value>" so :::verify can confirm.'
    : resonanceEligible
      ? 'hook/intuition: script the beats — motion, caption, emphasis and exactly one trap, together (see the beat-scripting instructions above). Do not just keep the body to a single static learning beat.'
      : 'other types: keep the body focused on a single learning beat.';

  return `${studentContextBlock}${painPointBlock ? painPointBlock + '\n\n' : ''}${patternBlock ? patternBlock + '\n\n' : ''}${resonanceBlock}Generate the "${args.atom_type}" atom for concept "${args.concept_id}" (topic family: ${args.topic_family}).

Scaffold: ${args.template_scaffold}
${args.template_guidance ? `Guidance:\n${args.template_guidance}` : ''}
${args.pyq_context}

Output ONLY the atom body in markdown. Use $inline$ and $$display$$ math.
For interactive directives use :::name{attrs} blocks. For ${closingInstruction}

Do not include frontmatter — only the body. Prose is capped at 400 words; a fenced \`\`\`interactive-spec\`\`\` JSON block does NOT count toward that cap.`;
}

/**
 * Lazy-imports the personalization formatter so the orchestrator stays
 * decoupled from the personalization module. If the import path doesn't
 * resolve (older deploys, bundler quirks), returns empty string —
 * generation proceeds with the generic prompt.
 *
 * Synchronous re-import via require-style would be cleaner but we're
 * in ESM-only territory; cache the result in module scope so we pay the
 * import cost at most once per process.
 */
let _ctxFormatter: ((ctx: any) => string) | null | undefined = undefined;
function renderStudentContextBlock(ctx: unknown): string {
  if (_ctxFormatter === null) return '';
  if (_ctxFormatter === undefined) {
    try {
      // dynamic import is async; but we can use require-equivalent via
      // a sync module-cache hit since ESM modules resolve eagerly at
      // top-level import. We declare the import below at module scope.
      _ctxFormatter = _toPromptTextRef ?? null;
    } catch {
      _ctxFormatter = null;
    }
  }
  if (!_ctxFormatter) return '';
  try {
    const text = _ctxFormatter(ctx);
    return text ? `${text}\n\n---\n\n` : '';
  } catch {
    return '';
  }
}

/**
 * Multi-modal hook (§4.15). Generates GIF + audio sidecars based on
 * atom_type. Each path is gated:
 *
 *   - GIF: only for visual_analogy atoms. The LLM optionally emits a
 *     `gif_scene_description` in a fenced JSON block; if present, render
 *     it. Otherwise skip — no auto-derived scene in v1 (avoids generating
 *     misleading visuals from prose-only hints).
 *
 *   - Audio: only for `intuition` atoms. Gated behind TTS_PROVIDER env.
 *     Strips markdown to a narration script and POSTs to the provider.
 *
 * Both paths are best-effort: failure leaves the atom shipping text-only.
 * A GIF that renders but hard-fails media QA (§4.15 W3.6/E9 — label
 * overlap or a near-blank final frame, see gif-generator.ts's
 * evaluateSceneQa) is routed through markMediaFailed exactly like a render
 * exception, so applyMediaUrls' existing skip machinery keeps it off the
 * page rather than shipping an illegible sidecar.
 *
 * Exported for unit testing; production callers reach it via generateConcept.
 */
export async function maybeGenerateMedia(
  atom: GeneratedAtom,
  version_n: number,
): Promise<void> {
  // Audio narration for eligible atoms.
  if (shouldNarrate(atom.atom_type)) {
    const tts = await generateNarration(atom.atom_type, atom.content);
    if (tts) {
      await writeArtifact(
        atom.atom_id, version_n, 'audio_narration',
        tts.buffer,
        { duration_ms: tts.duration_ms },
      );
    }
  }

  // GIF rendering for visual_analogy atoms when scene_description present.
  if (atom.atom_type === 'visual_analogy') {
    const scene = extractGifSceneDescription(atom.content);
    if (scene) {
      try {
        const result = renderScene(scene);
        // W3.6/E9 media QA: a hard QA failure (label overlap or a
        // near-blank frame on the FINAL frame — see gif-generator.ts's
        // evaluateSceneQa) never ships a broken sidecar. Route it through
        // the existing failed-artifact machinery so applyMediaUrls skips
        // it, same as a render exception.
        if (result.qa.hard_fail) {
          await markMediaFailed(
            atom.atom_id, version_n, 'gif',
            `media QA failed: ${result.qa.hard_fail_reasons.join('; ')}`,
          );
        } else {
          await writeArtifact(
            atom.atom_id, version_n, 'gif',
            result.buffer,
            { duration_ms: result.duration_ms },
          );
        }
      } catch (err) {
        await markMediaFailed(atom.atom_id, version_n, 'gif', (err as Error).message);
      }
    }
  }
}

/**
 * Pull a fenced JSON block from atom body. The orchestrator's prompt for
 * visual_analogy atoms (extension in v2) instructs the LLM to emit:
 *
 *   ```gif-scene
 *   {"type": "parametric", "expression": "sin(x + t)", ...}
 *   ```
 *
 * v1 ships the parser; the v4.11.0 template update wires the LLM to
 * actually emit `gif-scene` blocks for plot-friendly topics (calculus,
 * complex-numbers, linear-algebra). Diagram-heavy topics (algorithms,
 * discrete-math, probability) keep their text-only visuals.
 *
 * Exported for unit testing; production callers reach it via maybeGenerateMedia.
 */
export function extractGifSceneDescription(content: string): SceneDescription | null {
  const m = content.match(/```gif-scene\s*\n([\s\S]*?)\n```/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1]);
    if (parsed && typeof parsed === 'object' && isKnownSceneType(parsed.type)) {
      return parsed as SceneDescription;
    }
  } catch { /* malformed — skip */ }
  return null;
}

/**
 * Best-effort embedding generation for the LO + atom_type pair. Used by
 * the vector PYQ grounding path (4.11). When no embedding model is
 * configured or the call fails, returns null and the orchestrator falls
 * back to keyword grounding — never blocks generation on embed failure.
 *
 * Cost: one ~$0.00002 call per atom (text-embedding-3-small). Negligible.
 *
 * Disabled by default; opt-in via VIDHYA_ORCHESTRATOR_VECTOR_GROUNDING=on
 * so existing deploys keep the keyword path until the operator backfills
 * pyq_questions.embedding (no point paying for embeddings on the query
 * side if there's nothing to search against).
 */
async function maybeEmbedQuery(args: GenerateOneArgs): Promise<number[] | null> {
  if (process.env.VIDHYA_ORCHESTRATOR_VECTOR_GROUNDING !== 'on') return null;
  const text = `${args.concept_id} ${args.atom_type} ${args.topic_family}`;
  try {
    const { LLMClient } = await import('../../llm/index');
    const { loadLlmConfig } = await import('../../llm/registry');
    const config = loadLlmConfig();
    const client = new (LLMClient as any)(config);
    const r = await client.embed({
      model: process.env.VIDHYA_PYQ_EMBED_MODEL || 'text-embedding-3-small',
      input: text,
    });
    // Adapter response shape varies; normalise.
    const vec = r?.embedding ?? r?.data?.[0]?.embedding ?? r?.vector;
    if (Array.isArray(vec) && vec.length > 0) return vec;
    return null;
  } catch (err) {
    console.warn(`[orchestrator] embed query failed: ${(err as Error).message}`);
    return null;
  }
}

// LLMClient.generate() only routes on request.model/request.taskType — it
// never reads request.provider, so the old `provider: 'gemini' | undefined`
// field was silently ignored and every call fell through to whatever
// task-based routing picked (often the same provider for both 'claude' and
// 'gemini' requests). That both masked which provider actually failed and
// undermined multi-llm-consensus's independence guarantee (two "different"
// models silently resolving to the same adapter). Target explicitly by
// model id instead, and use maxRetries: 0 so a failure is never masked by
// a same-request fallback to a different provider.
//
// Multi-provider support (v4.26.0): callers may now pass ANY model id
// present in config/providers.yaml, not just this fixed claude/gemini
// pair — see OrchestratorOptions.model_id. MODEL_ID_MAP survives as the
// DEFAULT primary/secondary pair for callers that don't surface a model
// choice (unchanged behavior). Kept in sync with config/providers.yaml's
// anthropic.sonnet / gemini.flash model ids by hand (resolveProviderForModel()
// below does an exact-string match against the registry, so drift here
// silently breaks routing — see registry.ts's header comment on why
// "parallel truths" are the bug class to avoid).
const MODEL_ID_MAP: Record<'claude' | 'gemini', string> = {
  claude: 'claude-sonnet-4-5',
  gemini: 'gemini-2.5-flash',
};

const DEFAULT_MODEL_ID: string = MODEL_ID_MAP.claude;

/**
 * Which registry provider actually serves a given model id, per the
 * currently loaded config — or null if no configured provider serves it
 * (ModelRetiredError territory). Used by the consensus guard below to
 * refuse a consensus pair BEFORE spending, rather than discovering after
 * the fact that both legs silently hit the same provider.
 */
function resolveProviderForModel(config: { providers: Record<string, { models: Record<string, { id: string }> }> }, modelId: string): string | null {
  for (const [providerId, pconfig] of Object.entries(config.providers)) {
    for (const mdef of Object.values(pconfig.models)) {
      if (mdef.id === modelId) return providerId;
    }
  }
  return null;
}

// Exported (T4a) so other callers that need "just call this model id with a
// prompt" reuse the SAME client-construction path — rather than a second,
// slightly-different copy — see answer-check.ts's buildSolveSecondaryFn.
export async function callLlm(prompt: string, modelId: string): Promise<string> {
  try {
    const { LLMClient } = await import('../../llm/index');
    const { loadLlmConfig } = await import('../../llm/registry');
    const config = loadLlmConfig();
    const client = new (LLMClient as any)(config);
    const response = await client.generate({
      messages: [{ role: 'user', content: prompt }],
      taskType: 'content-generation',
      model: modelId,
      maxTokens: 4096,
      maxRetries: 0,
    });
    return (response.content ?? response.text ?? '').trim();
  } catch (err) {
    console.warn(`[orchestrator] LLM call failed (${modelId}): ${(err as Error).message}`);
    return '';
  }
}

/**
 * Exported (not just via __testing) so other consensus-needing callers can
 * reuse the SAME provider-routing decision rather than re-deriving it —
 * e.g. the practice-item factory's answer-check module (T7 / E9,
 * docs/designs/linear-algebra-realtime-and-math-academy-plan.md, ENG-D4
 * item 8: "A7 writes its own dual-model answer-key check... Reuse
 * pickConsensusSecondary/consensusProvidersAreDistinct").
 */
export async function pickConsensusSecondary(primaryModelId: string): Promise<string | null> {
  try {
    const { loadLlmConfig } = await import('../../llm/registry');
    // loadLlmConfig already filters to providers that are enabled AND have a
    // live credential — no need to re-check either here.
    const config = loadLlmConfig();
    const primaryProvider = resolveProviderForModel(config, primaryModelId);

    // Preserve the historical Claude↔Gemini consensus pair: prefer Gemini as
    // the secondary unless the primary is already on the Gemini provider, in
    // which case prefer Claude. This keeps the "two independent opinions"
    // guarantee across different platforms without hardcoding a fixed pair.
    const geminiProvider = resolveProviderForModel(config, MODEL_ID_MAP.gemini);
    const preferredSecondary =
      primaryProvider !== null && primaryProvider === geminiProvider
        ? MODEL_ID_MAP.claude
        : MODEL_ID_MAP.gemini;
    const preferredProvider = resolveProviderForModel(config, preferredSecondary);
    if (preferredProvider && preferredProvider !== primaryProvider && config.providers[preferredProvider]) {
      return preferredSecondary;
    }

    // Fall through: first available provider different from the primary.
    for (const [pid, pconfig] of Object.entries<any>(config.providers || {})) {
      if (pid === primaryProvider) continue;
      const modelKey = (pconfig as any).fallbackOrder?.[0];
      const modelId = modelKey ? pconfig.models?.[modelKey]?.id : (Object.values(pconfig.models || {})[0] as any)?.id;
      if (modelId) return modelId;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Consensus independence guard (CEO plan §8.5 — ConsensusRoutingError).
 * Runs before the two consensus calls fire: if both legs would resolve
 * to the same provider (e.g. only one provider's key is configured, or
 * a future model-id change accidentally aliases both legs to one
 * provider), refuse up front instead of silently paying for "two
 * independent opinions" that are really one opinion twice.
 *
 * Returns true when a consensus pair is safe to dispatch, false when the
 * caller should treat this the same as "one leg unavailable" (existing
 * degraded-consensus handling in generateOne already covers that path —
 * this just makes sure it's never invisible-same-provider degradation).
 */
export async function consensusProvidersAreDistinct(primaryModelId: string, secondaryModelId: string): Promise<boolean> {
  try {
    const { loadLlmConfig } = await import('../../llm/registry');
    const config = loadLlmConfig();
    const providerA = resolveProviderForModel(config, primaryModelId);
    const providerB = resolveProviderForModel(config, secondaryModelId);
    if (providerA && providerB && providerA === providerB) {
      const { ConsensusRoutingError } = await import('../../llm/errors');
      console.warn(`[orchestrator] ${new ConsensusRoutingError(providerA, providerB).message}`);
      return false;
    }
    return true;
  } catch {
    // Config load failure — let the individual callLlm() calls surface
    // their own (equally honest) failures rather than blocking here.
    return true;
  }
}

function emptyMeta(extra: Partial<GenerationMeta> = {}): GenerationMeta {
  return {
    source_cascade: [],
    wolfram_grounded: false,
    pyq_grounded: [],
    generated_at: new Date().toISOString(),
    cost_usd: 0,
    ...extra,
  };
}

// Exported for tests only — the v4.26.0 model-routing generalization
// (pickConsensusSecondary / resolveProviderForModel / consensusProvidersAreDistinct)
// is easiest to pin directly rather than through generateConcept's full
// pipeline, where the two consensus legs fire concurrently via
// Promise.all and are awkward to assert on independently.
export const __testing = {
  MODEL_ID_MAP,
  DEFAULT_MODEL_ID,
  resolveProviderForModel,
  pickConsensusSecondary,
  consensusProvidersAreDistinct,
  // Resonance plan §W4 — buildPrompt is otherwise private; fixture tests
  // assert on its exact output (the carve-out sentence, the batch-only
  // beat instructions) without going through the full generateConcept
  // pipeline (which needs an LLM to have anything to assert on).
  buildPrompt,
};
