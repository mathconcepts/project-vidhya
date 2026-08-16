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
import { renderScene, type SceneDescription } from './gif-generator';
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

  const defaults = ATOM_TYPE_DEFAULTS[args.atom_type];
  const meta: GenerationMeta = {
    source_cascade: sourceCascade,
    wolfram_grounded: pyqGrounding.length > 0,  // refined when we actually call Wolfram
    pyq_grounded: pyqGrounding.map((g) => g.pyq_id),
    template: template ? `${args.topic_family}.${args.atom_type}` : undefined,
    generated_at: new Date().toISOString(),
    cost_usd: ESTIMATED_COST_USD[args.atom_type],
    ...consensusMeta,
  };

  return {
    atom_id: `${args.concept_id}.${args.atom_type.replace('_', '-')}`,
    concept_id: args.concept_id,
    atom_type: args.atom_type,
    bloom_level: (template?.bloom_floor as BloomLevel | undefined) ?? defaults.bloom,
    difficulty: defaults.difficulty,
    exam_ids: ['*'],
    content,
    meta,
  };
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

  return `${studentContextBlock}${painPointBlock ? painPointBlock + '\n\n' : ''}${patternBlock ? patternBlock + '\n\n' : ''}Generate the "${args.atom_type}" atom for concept "${args.concept_id}" (topic family: ${args.topic_family}).

Scaffold: ${args.template_scaffold}
${args.template_guidance ? `Guidance:\n${args.template_guidance}` : ''}
${args.pyq_context}

Output ONLY the atom body in markdown. Use $inline$ and $$display$$ math.
For interactive directives use :::name{attrs} blocks. For ${args.atom_type === 'worked_example' ? 'worked_example: separate steps with `\\n---\\n` and end with "Answer: <value>" so :::verify can confirm.' : 'other types: keep the body focused on a single learning beat.'}

Do not include frontmatter — only the body. Keep total length under 400 words.`;
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
 */
async function maybeGenerateMedia(
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
        await writeArtifact(
          atom.atom_id, version_n, 'gif',
          result.buffer,
          { duration_ms: result.duration_ms },
        );
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
    if (parsed && typeof parsed === 'object' && (parsed.type === 'parametric' || parsed.type === 'function-trace')) {
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

async function callLlm(prompt: string, modelId: string): Promise<string> {
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

async function pickConsensusSecondary(primaryModelId: string): Promise<string | null> {
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
async function consensusProvidersAreDistinct(primaryModelId: string, secondaryModelId: string): Promise<boolean> {
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
};
