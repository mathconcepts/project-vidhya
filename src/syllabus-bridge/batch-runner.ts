/**
 * Syllabus Bridge — Batch Runner
 *
 * Takes a BatchRequest (list of unit_ids to generate) and processes it.
 * Tries to use the real LLM router; falls back to mock generation when no
 * provider key is available. Runs units sequentially (not parallel) so we
 * don't blow rate limits and the user can watch progress build up.
 *
 * The function returns immediately with the queued batch and the work
 * happens in the background (fire-and-forget). The caller polls
 * GET /api/syllabus-bridge/batches/:id to see progress.
 */

import type {
  BatchRequest, BatchResult, ContentUnit, GeneratedContent,
  Curriculum, BridgeMappingEntry, BridgeMapping,
} from './types';
import { saveBatch, saveGeneratedContent } from './store';
import { getMapping, getConcept } from './registry';
import { CostMeter, RunBudgetExceeded } from '../generation/cost-meter';

/**
 * Ceiling for one batch, in USD.
 *
 * The regenerate-flagged endpoint resubmits every unit students have marked
 * wrong three times, so batch size is set by accumulated feedback rather
 * than by an operator choosing a number. Before this existed the loop had no
 * ceiling at all — it accumulated `total_cost_estimate_usd` and never read it.
 * That was survivable only because generation was broken and every unit cost
 * exactly zero.
 */
export const DEFAULT_BATCH_CAP_USD = Number(process.env.VIDHYA_BRIDGE_BATCH_CAP_USD ?? 2);

/** Worst-case spend for one unit, used for the pre-call check. */
function estimateUnitCost(unit: ContentUnit): number {
  const maxTokens = Math.min(2000, unit.estimated_tokens * 2);
  // Priced against the most expensive provider the router might pick, so the
  // estimate is a ceiling rather than a hopeful average.
  return estimateCost('anthropic', maxTokens);
}

/**
 * Record actual spend for accounting.
 *
 * `CostMeter.add()` throws once the cap is breached. Here that throw would be
 * wrong: the pre-call check already decided this unit was affordable, and the
 * unit has already succeeded. Letting it propagate would mark completed work
 * as failed. The cap is enforced before the call; this call only accounts.
 */
function recordSpend(meter: CostMeter, generated: GeneratedContent): void {
  try {
    meter.add({ model: generated.model ?? 'unknown', flat_usd: generated.cost_usd ?? 0 });
  } catch (err) {
    if (!(err instanceof RunBudgetExceeded)) throw err;
  }
}

// ============================================================================
// Public entry point
// ============================================================================

/**
 * Process the batch in the background. Caller can return immediately.
 *
 * We deliberately do NOT throw on individual failures — one bad unit
 * shouldn't poison the whole batch. Errors are recorded per-result.
 */
export async function runBatch(
  batch: BatchRequest,
  planUnits: ContentUnit[],
  opts: { maxCostUsd?: number; llm?: LLMDeps } = {},
): Promise<void> {
  const mapping = getMapping(batch.mapping_id);
  if (!mapping) {
    batch.status = 'failed';
    batch.error = `Unknown mapping_id: ${batch.mapping_id}`;
    batch.completed_at = new Date().toISOString();
    saveBatch(batch);
    return;
  }

  const cap = opts.maxCostUsd ?? DEFAULT_BATCH_CAP_USD;
  const meter = new CostMeter({ max_cost_usd: cap });

  batch.status = 'running';
  batch.started_at = new Date().toISOString();
  saveBatch(batch);

  for (const unit of planUnits) {
    if (!batch.unit_ids.includes(unit.unit_id)) continue;

    // ── The cap is enforced HERE, before the call, and outside the try ──
    //
    // Not by letting CostMeter.add() throw. A RunBudgetExceeded raised
    // inside generateUnit would have to survive two catches to stop
    // anything: the `.catch(() => null)` on tryRealLLM, and the per-unit
    // catch below that marks one unit failed and continues the loop. It
    // survives neither, so a throw-based cap would spend the whole batch
    // and report nothing unusual.
    //
    // Refusing to make the call needs no exception to survive anything.
    if (estimateUnitCost(unit) > meter.remaining()) {
      batch.status = 'aborted';
      batch.error =
        `cost cap reached: $${meter.totalUsd().toFixed(4)} of $${cap.toFixed(2)} spent, ` +
        `next unit needs ~$${estimateUnitCost(unit).toFixed(4)}`;
      batch.completed_at = new Date().toISOString();
      saveBatch(batch);
      return;
    }

    // Find or create a result row for this unit
    let result = batch.results.find(r => r.unit_id === unit.unit_id);
    if (!result) {
      result = { unit_id: unit.unit_id, status: 'pending' };
      batch.results.push(result);
    }

    try {
      const generated = await generateUnit(unit, mapping, batch.for_student_id, opts.llm);
      recordSpend(meter, generated);
      saveGeneratedContent(generated);

      result.status = 'success';
      result.content_id = generated.content_id;
      result.tokens_used = generated.tokens_used;
      result.cost_usd = generated.cost_usd;
      result.generated_at = generated.generated_at;

      batch.completed_units += 1;
      batch.total_cost_estimate_usd += generated.cost_usd ?? 0;
    } catch (err: any) {
      result.status = 'failed';
      result.error = err?.message ?? String(err);
      batch.failed_units += 1;
    }

    // Persist after each unit so the UI can stream progress
    saveBatch(batch);
  }

  batch.status = batch.failed_units === batch.total_units ? 'failed' : 'completed';
  batch.completed_at = new Date().toISOString();
  saveBatch(batch);
}

// ============================================================================
// Generation — one unit at a time
// ============================================================================

async function generateUnit(
  unit: ContentUnit,
  mapping: BridgeMapping,
  for_student_id?: string,
  llm?: LLMDeps,
): Promise<GeneratedContent> {
  // Look up the mapping entry + the underlying curriculum concepts
  const entry = mapping.entries.find(e => e.id === unit.mapping_entry_id);
  if (!entry) throw new Error(`Mapping entry not found for unit ${unit.unit_id}`);

  const conceptDetails = entry.source_concept_ids
    .map(id => getConcept(id))
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (conceptDetails.length === 0) {
    throw new Error(`No concepts found for entry ${entry.id}`);
  }

  // Build the base prompt, then enrich with GBrain student context if we
  // have a target student. Same template, calibrated body.
  let prompt = buildPrompt(unit, entry, conceptDetails);
  if (for_student_id) {
    const { personalizePromptForStudent } = await import('./gbrain-integration');
    prompt = await personalizePromptForStudent(prompt, for_student_id, {
      mapping_target_exam_id: mapping.target_exam_id,
    });
  }

  // Try real LLM first; fall back to mock on any error. The mock body is
  // never served — syllabus-bridge-routes.ts refuses to hand out a unit whose
  // source is 'mock'. It exists so a failed generation is recorded and
  // retryable rather than lost.
  const llmResult = await tryRealLLM(prompt, unit, llm).catch(() => null);
  const final = llmResult ?? generateMock(unit, entry, conceptDetails);

  return {
    content_id: `CNT-${unit.unit_id}-${Date.now().toString(36)}`,
    unit_id: unit.unit_id,
    unit_type: unit.unit_type,
    mapping_id: mapping.id,
    mapping_entry_id: entry.id,
    title: buildTitle(unit, entry, conceptDetails),
    body_markdown: final.body,
    source: final.source,
    model: final.model,
    tokens_used: final.tokens_used,
    cost_usd: final.cost_usd,
    generated_at: new Date().toISOString(),
  };
}

// ============================================================================
// Prompt construction
// ============================================================================

function buildPrompt(
  unit: ContentUnit,
  entry: BridgeMappingEntry,
  concepts: ReturnType<typeof getConcept>[],
): string {
  const conceptList = concepts
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map(c => `- ${c.concept.name} (TN ref ${c.concept.source_ref ?? '—'}, difficulty ${c.concept.difficulty})`)
    .join('\n');

  const baseContext = `You are a content author creating bridge material that helps a Tamil Nadu State Board Class 12 student
deepen their math from school level toward IIT JEE Main level.

Source curriculum (what the student already knows from TN textbook):
${conceptList}

Target exam: IIT JEE Main Mathematics
Gap class: ${entry.gap_class}
Difficulty jump (1-5): ${entry.difficulty_jump}

Author guidance:
${entry.bridge_note}
`;

  const unitInstructions: Record<typeof unit.unit_type, string> = {
    'foundation-explainer':
      `Write a ~400-word foundation explainer that re-teaches the concept(s) at the TN textbook level. Use intuitive analogies (real-world hooks). Include 1 clean worked example. Use LaTeX for math.`,

    'worked-example':
      `Write a single worked example at TN textbook difficulty. Show the problem, then 4-6 numbered steps with clear reasoning. End with the answer. LaTeX for math.`,

    'bridge-explainer':
      `Write a ~500-word bridge explainer connecting the TN concept to the JEE Main technique. Start with one sentence on what the student already knows from TN, then show what JEE adds (the depth or breadth gap). Include exactly one bridge example that uses both. LaTeX for math.`,

    'stretch-problem':
      `Write a single JEE Main level problem on this concept. Show the problem, then the full solution (6-10 steps). Highlight the JEE-specific trick or insight in a separate "Key insight" sentence at the end.`,

    'practice-set':
      `Write a graduated practice set of 4 problems:
  1. TN textbook level (warm-up)
  2. Slightly harder (still TN-adjacent)
  3. Bridge problem (TN concept, JEE wording)
  4. Full JEE Main level
For each: problem statement, then concise solution. LaTeX for math.`,
  };

  return `${baseContext}\n\nTASK: ${unitInstructions[unit.unit_type]}\n\nFormat: markdown with LaTeX. No preamble. Begin directly.`;
}

function buildTitle(
  unit: ContentUnit,
  entry: BridgeMappingEntry,
  concepts: ReturnType<typeof getConcept>[],
): string {
  const c = concepts[0];
  if (!c) return `${unit.unit_type} • ${entry.id}`;
  const typeLabel: Record<typeof unit.unit_type, string> = {
    'foundation-explainer': 'Foundation',
    'worked-example':       'Worked example',
    'bridge-explainer':     'TN → JEE bridge',
    'stretch-problem':      'JEE-level stretch',
    'practice-set':         'Practice set',
  };
  return `${typeLabel[unit.unit_type]}: ${c.concept.name}`;
}

// ============================================================================
// Real LLM (graceful failure to mock)
// ============================================================================

/**
 * Model this pipeline generates with. Must be an id `config/providers.yaml`
 * declares — `resolveProviderForModel` does a literal string match, so a
 * near-miss id throws instead of falling back.
 */
export const BRIDGE_MODEL_ID = 'claude-sonnet-4-5';

/** Injected for tests. Production passes nothing and the real client is used. */
export interface LLMDeps {
  generate(prompt: string, maxTokens: number): Promise<{
    text: string; model: string; tokens_used: number;
  } | null>;
}

/**
 * Call the real model.
 *
 * ── This used to be structurally dead ───────────────────────────────────
 *
 * It built the client as `new LLMClient({})`. The constructor iterates
 * `Object.entries(this.config.providers || {})` to create adapters, so an
 * empty config created ZERO of them; `generate()` then found no adapter for
 * any route and threw, every time, and the catch below turned that into a
 * mock body. Adding an API key did not help, because the key was never the
 * thing that was missing.
 *
 * It also passed `provider`, which `generate()` never reads — routing is by
 * `model` / `taskType`. `kag-concept-generator.ts` has always called this
 * correctly; this now matches it.
 */
async function tryRealLLM(
  prompt: string,
  unit: ContentUnit,
  deps?: LLMDeps,
): Promise<{
  body: string; source: 'gemini' | 'anthropic' | 'openai'; model: string;
  tokens_used: number; cost_usd: number;
} | null> {
  const maxTokens = Math.min(2000, unit.estimated_tokens * 2);

  // Which provider actually served the call is decided by the router, not
  // here. This only decides whether it is worth trying at all.
  const hasGemini    = !!process.env.GEMINI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI    = !!process.env.OPENAI_API_KEY;
  if (!deps && !hasGemini && !hasAnthropic && !hasOpenAI) return null;

  try {
    let out: { text: string; model: string; tokens_used: number } | null;

    if (deps) {
      out = await deps.generate(prompt, maxTokens);
    } else {
      const { LLMClient } = await import('../llm/index');
      const { loadLlmConfig } = await import('../llm/registry');
      // loadLlmConfig() reads config/providers.yaml and returns a populated
      // provider set, which is what makes adapters exist.
      const client: any = new LLMClient(loadLlmConfig());
      const resp: any = await client.generate({
        messages: [{ role: 'user', content: prompt }],
        taskType: 'content-generation',
        model: BRIDGE_MODEL_ID,
        maxTokens,
        maxRetries: 0,
      });
      const text = (resp?.content ?? resp?.text ?? '').trim();
      out = text
        ? {
            text,
            model: resp?.servedModel ?? resp?.model ?? BRIDGE_MODEL_ID,
            tokens_used:
              resp?.usage?.outputTokens ?? resp?.tokensUsed ?? Math.ceil(text.length / 4),
          }
        : null;
    }

    if (!out?.text) return null;
    const provider: 'gemini' | 'anthropic' | 'openai' =
      hasAnthropic ? 'anthropic' : hasGemini ? 'gemini' : 'openai';
    return {
      body: out.text,
      source: provider,
      model: out.model,
      tokens_used: out.tokens_used,
      cost_usd: estimateCost(provider, out.tokens_used),
    };
  } catch {
    return null; // fall through to mock
  }
}

function estimateCost(provider: 'gemini' | 'anthropic' | 'openai', tokens: number): number {
  // Rough per-million-token output prices (mid-tier models)
  const rate: Record<typeof provider, number> = {
    'gemini':    0.30,
    'anthropic': 3.00,
    'openai':    2.50,
  };
  return Number(((tokens / 1_000_000) * rate[provider]).toFixed(5));
}

// ============================================================================
// Mock generation — deterministic, useful for dev
// ============================================================================

function generateMock(
  unit: ContentUnit,
  entry: BridgeMappingEntry,
  concepts: ReturnType<typeof getConcept>[],
): { body: string; source: 'mock'; model: string; tokens_used: number; cost_usd: number } {
  const c = concepts.filter((x): x is NonNullable<typeof x> => !!x)[0];
  if (!c) {
    return {
      body: '_(empty mock)_', source: 'mock', model: 'mock-1.0',
      tokens_used: 0, cost_usd: 0,
    };
  }

  const conceptName = c.concept.name;
  let body: string;

  switch (unit.unit_type) {
    case 'foundation-explainer':
      body = `## Foundation: ${conceptName}\n\nThis is the foundation explainer that a Tamil Nadu Class 12 student would recognise from their textbook (chapter ${c.topic.chapter_number}, section ${c.concept.source_ref ?? '—'}).\n\nThink of ${conceptName} this way: _[intuitive analogy]_.\n\n**Worked example.** Suppose we have a typical TN-textbook problem. The standard approach in your textbook is:\n\n1. Set up the equation.\n2. Apply the standard formula.\n3. Simplify.\n4. Verify the answer matches the back of the book.\n\n_(This is a mock body — connect a Gemini/Anthropic key in your env to generate the real content.)_`;
      break;
    case 'worked-example':
      body = `## Worked example: ${conceptName}\n\n**Problem.** A standard TN-style problem on ${conceptName.toLowerCase()}.\n\n**Solution.**\n\n1. Identify what we need to find.\n2. Recall the formula from chapter ${c.topic.chapter_number}.\n3. Substitute the given values.\n4. Simplify carefully.\n5. State the final answer with units.\n\n**Answer.** _[result]_\n\n_(Mock — real content requires GEMINI_API_KEY / ANTHROPIC_API_KEY.)_`;
      break;
    case 'bridge-explainer':
      body = `## TN → JEE bridge: ${conceptName}\n\nFrom your TN textbook you already know **${conceptName.toLowerCase()}** at the level needed for the board exam. JEE Main pushes the same concept further:\n\n${entry.bridge_note}\n\n**Bridge example.**\n\nStart with the kind of problem you'd see in TN:\n\n> [TN-style problem]\n\nNow add the JEE twist:\n\n> [JEE-style framing using the same concept]\n\nThe trick: the underlying maths is identical — the JEE version just buries it inside extra setup. Strip the setup back to the TN form, solve, then re-interpret.\n\n_(Mock content — wire a real LLM provider key for production output.)_`;
      break;
    case 'stretch-problem':
      body = `## JEE-level stretch: ${conceptName}\n\n**Problem.** A representative JEE Main problem on ${conceptName.toLowerCase()} (difficulty ${unit.difficulty}/5).\n\n**Solution.**\n\n1-8. _[detailed JEE-style solution]_\n\n**Key insight.** The JEE version of ${conceptName.toLowerCase()} hides the standard formula inside extra structure — recognising that structure is the entire battle.\n\n_(Mock — real generation needs an LLM key.)_`;
      break;
    case 'practice-set':
      body = `## Practice set: ${conceptName}\n\nFour problems, graduated from TN to JEE.\n\n**1. (TN warm-up)** _[problem]_  →  Solution: _[outline]_\n\n**2. (TN+)** _[harder TN-style problem]_  →  Solution: _[outline]_\n\n**3. (Bridge)** _[TN concept dressed in JEE wording]_  →  Solution: _[outline]_\n\n**4. (JEE Main)** _[full JEE problem]_  →  Solution: _[outline]_\n\n_(Mock — real practice problems require an LLM key.)_`;
      break;
  }

  return {
    body,
    source: 'mock',
    model: 'mock-1.0',
    tokens_used: Math.ceil(body.length / 4),
    cost_usd: 0,
  };
}
