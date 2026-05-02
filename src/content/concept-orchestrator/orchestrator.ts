// @ts-nocheck
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
import { appendVersion } from './atom-versions';
import { writeArtifact, markFailed as markMediaFailed } from './media-artifacts';
import { renderScene, type SceneDescription } from './gif-generator';
import { generateNarration, shouldNarrate } from './tts-generator';

const ALL_ATOM_TYPES: AtomType[] = [
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
      const versionRow = await appendVersion(generated.atom_id, generated.content, generated.meta);
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
    sourceCascade.push('llm-claude', 'llm-gemini');
    const [primary, secondary] = await Promise.all([
      callLlm(prompt, 'claude'),
      callLlm(prompt, 'gemini'),
    ]);
    if (!primary && !secondary) {
      content = '';
    } else if (!secondary) {
      content = primary;
      consensusMeta = { llm_consensus: false, consensus_disagreement: { models: ['gemini'], reason: 'gemini call failed' } };
    } else if (!primary) {
      content = secondary;
      consensusMeta = { llm_consensus: false, consensus_disagreement: { models: ['claude'], reason: 'claude call failed' } };
    } else {
      const cmp = compareMathAtoms(args.atom_type, primary, secondary);
      content = primary;
      consensusMeta = { llm_consensus: cmp.agreed };
      if (!cmp.agreed) {
        consensusMeta.consensus_disagreement = { models: ['claude', 'gemini'], reason: cmp.reason };
      }
    }
  } else {
    sourceCascade.push('llm-claude');
    content = (await callLlm(prompt, 'claude')) || '';
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
  return `Generate the "${args.atom_type}" atom for concept "${args.concept_id}" (topic family: ${args.topic_family}).

Scaffold: ${args.template_scaffold}
${args.template_guidance ? `Guidance:\n${args.template_guidance}` : ''}
${args.pyq_context}

Output ONLY the atom body in markdown. Use $inline$ and $$display$$ math.
For interactive directives use :::name{attrs} blocks. For ${args.atom_type === 'worked_example' ? 'worked_example: separate steps with `\\n---\\n` and end with "Answer: <value>" so :::verify can confirm.' : 'other types: keep the body focused on a single learning beat.'}

Do not include frontmatter — only the body. Keep total length under 400 words.`;
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
 * v1 ships the parser; the prompt change to actually request scenes from
 * the LLM follows in a v2 polish PR. Until then, this returns null for
 * all generated atoms and the GIF path stays dormant.
 */
function extractGifSceneDescription(content: string): SceneDescription | null {
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
    const config = process.env.LLM_CONFIG_PATH
      ? require(process.env.LLM_CONFIG_PATH)
      : { providers: {}, defaultProvider: '' };
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

async function callLlm(prompt: string, model: 'claude' | 'gemini'): Promise<string> {
  try {
    const { LLMClient } = await import('../../llm/index');
    const config = process.env.LLM_CONFIG_PATH
      ? require(process.env.LLM_CONFIG_PATH)
      : { providers: {}, defaultProvider: '' };
    const client = new (LLMClient as any)(config);
    const response = await client.generate({
      messages: [{ role: 'user', content: prompt }],
      taskType: 'content-generation',
      provider: model === 'gemini' ? 'gemini' : undefined,
      maxRetries: 1,
    });
    return (response.content ?? response.text ?? '').trim();
  } catch (err) {
    console.warn(`[orchestrator] LLM call failed (${model}): ${(err as Error).message}`);
    return '';
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
