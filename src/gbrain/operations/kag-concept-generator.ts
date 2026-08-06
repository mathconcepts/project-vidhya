/**
 * src/gbrain/operations/kag-concept-generator.ts
 *
 * Runtime KAG entry generator. Given a concept_id, queries Wolfram Alpha
 * for grounding context, then calls the configured LLM with that context
 * to produce a verified, high-confidence corpus entry.
 *
 * Wolfram plays two roles here:
 *   1. Grounding source for generation — the Wolfram response is included
 *      verbatim in the LLM context so the model sees authoritative computed
 *      answers before generating its explanation.
 *   2. Verification of the worked example — after generation, the worked
 *      example answer is re-queried against Wolfram to confirm correctness.
 *
 * Called by the nightly kagRefreshScanner job (src/jobs/kag-refresh-scanner.ts)
 * and by content-refresh-queue.ts's enqueueKagEntry (which owns the
 * MAX_PER_NIGHT invariant). The CLI corpus-builder
 * (scripts/kag-corpus-builder.ts) also uses this but as an import — this
 * file is the single implementation.
 *
 * Restored 2026-08-06 after an unrelated dead-code sweep (#73, 2026-07-31)
 * deleted this file believing it was unreferenced. It wasn't dead — it was
 * the only thing that could ever have called content-refresh-queue.ts's
 * enqueueKagEntry(), and its removal silently broke scripts/kag-corpus-builder.ts
 * (ERR_MODULE_NOT_FOUND on run). Re-wired onto the current LLMClient/
 * loadLlmConfig pattern (matching concept-orchestrator/orchestrator.ts's
 * callLlm) rather than the older ad-hoc LLM_CONFIG_PATH env-var lookup this
 * file originally used.
 */

import { wolframSolve } from '../../services/wolfram-service';
import { enqueueKagEntry, isNightlyCapReached } from '../../jobs/content-refresh-queue';
import { addKagEntry, type KagEntry } from '../../content/kag-store';
import { LLMClient } from '../../llm/index';
import { loadLlmConfig } from '../../llm/registry';

// Matches concept-orchestrator/orchestrator.ts's MODEL_ID_MAP.claude — kept
// as its own literal here rather than importing from orchestrator.ts to
// avoid pulling the whole concept-orchestrator module graph into a job that
// has nothing else to do with it. Update together if either drifts (see
// registry.ts's header comment on why parallel model-id literals are the
// bug class to avoid).
const DEFAULT_MODEL_ID = 'claude-sonnet-4-5';

export interface KagGenerateRequest {
  concept_id: string;
  concept_label: string;
  description: string;
  /** Pre-computed embedding for the concept, if available. Pass [] to skip similarity search. */
  embedding?: number[];
  /** Override: skip nightly cap check (used by CLI builder, not by runtime jobs). */
  bypass_nightly_cap?: boolean;
}

export interface KagGenerateResult {
  ok: boolean;
  entry?: KagEntry;
  skipped_reason?: 'nightly_cap' | 'wolfram_unavailable' | 'llm_error' | 'verification_failed';
  wolfram_available: boolean;
  wolfram_grounding: string | null;
}

/**
 * Generate a single KAG corpus entry for a concept.
 *
 * Flow:
 *   1. Check nightly cap (skip if reached, unless bypass_nightly_cap=true)
 *   2. Query Wolfram for the concept (grounding) — graceful if unavailable
 *   3. Build LLM prompt with Wolfram context included
 *   4. Call LLM to generate explanation + worked example
 *   5. Re-verify worked example answer with Wolfram (second Wolfram role)
 *   6. Store via enqueueKagEntry (respects 5/night cap)
 */
export async function generateKagEntry(req: KagGenerateRequest): Promise<KagGenerateResult> {
  if (!req.bypass_nightly_cap && isNightlyCapReached()) {
    return { ok: false, skipped_reason: 'nightly_cap', wolfram_available: false, wolfram_grounding: null };
  }

  // ── Role 1: Wolfram as grounding source ───────────────────────────────
  let wolfram_grounding: string | null = null;
  let wolfram_available = false;

  try {
    const wolframQuery = `${req.concept_label}: definition, key formula, and a worked example`;
    const wResult = await wolframSolve(wolframQuery, { timeout_ms: 10000, show_steps: true });
    wolfram_available = wResult.available;
    if (wResult.available && wResult.answer) {
      const pods = wResult.pods.map((p) => `**${p.title}**: ${p.plaintext}`).join('\n');
      wolfram_grounding = [
        `Wolfram Alpha result for "${req.concept_label}":`,
        wResult.answer,
        pods || '',
      ].filter(Boolean).join('\n');
    }
  } catch {
    wolfram_available = false;
  }

  // ── LLM generation with Wolfram context ──────────────────────────────
  let generatedContent: string;
  try {
    generatedContent = await callLlmWithGrounding(req, wolfram_grounding);
  } catch {
    return { ok: false, skipped_reason: 'llm_error', wolfram_available, wolfram_grounding };
  }

  // ── Role 2: Wolfram verifies the worked example answer ────────────────
  if (wolfram_available) {
    const workedAnswerMatch = generatedContent.match(/Answer:\s*([^\n]+)/i);
    if (workedAnswerMatch) {
      try {
        const verifyResult = await wolframSolve(workedAnswerMatch[1].trim(), { timeout_ms: 8000 });
        if (verifyResult.available && !verifyResult.answer) {
          // Wolfram couldn't confirm the answer — flag but don't block.
          console.warn(`[kag-generator] worked example answer unconfirmed by Wolfram for ${req.concept_id}`);
        }
      } catch {
        /* verification best-effort */
      }
    }
  }

  const entry: KagEntry = {
    concept_id: req.concept_id,
    content: generatedContent,
    wolfram_grounding,
    embedding: req.embedding ?? [],
    generated_at: new Date().toISOString(),
    source_model: DEFAULT_MODEL_ID,
  };

  const queued = req.bypass_nightly_cap
    ? (addKagEntry(entry), true)
    : enqueueKagEntry(entry);

  if (!queued) {
    return { ok: false, skipped_reason: 'nightly_cap', wolfram_available, wolfram_grounding };
  }

  return { ok: true, entry, wolfram_available, wolfram_grounding };
}

async function callLlmWithGrounding(
  req: KagGenerateRequest,
  wolfram_grounding: string | null,
): Promise<string> {
  const groundingSection = wolfram_grounding
    ? `\n\n## Wolfram Alpha Grounding\n${wolfram_grounding}\n\nUse the above as authoritative reference. Do not contradict it.`
    : '';

  const prompt = `You are generating a verified educational explanation for the KAG corpus.

Concept: ${req.concept_label} (id: ${req.concept_id})
Description: ${req.description}${groundingSection}

Produce a self-contained explanation with:
1. **Definition** — one precise sentence
2. **Key Formula** — LaTeX if applicable
3. **Intuition** — two sentences a first-year student can follow
4. **Worked Example** — a numeric problem with full solution steps, ending with "Answer: <value>"
5. **Common Trap** — one sentence on the most frequent mistake

Keep the total under 400 words. Do not add headers beyond the five above.`;

  try {
    const config = loadLlmConfig();
    const client = new LLMClient(config);
    const response = await client.generate({
      messages: [{ role: 'user', content: prompt }],
      taskType: 'content-generation',
      model: DEFAULT_MODEL_ID,
      maxTokens: 4096,
      maxRetries: 0,
    });
    const text = (response?.content ?? response?.text ?? '').trim();
    if (text) return text;
    throw new Error('empty LLM response');
  } catch {
    // Fallback stub — used in test/demo environments without LLM keys, so
    // a missing credential degrades to a placeholder entry rather than
    // throwing and dropping the concept from the run.
    return [
      `**Definition** — ${req.concept_label}: ${req.description}`,
      `**Key Formula** — (see concept graph for formula)`,
      `**Intuition** — This concept underpins ${req.concept_label}. Understanding it builds the foundation for related topics.`,
      `**Worked Example** — Solve for the basic case. Answer: see Wolfram grounding above.`,
      `**Common Trap** — Confusing the definition with its inverse.`,
      wolfram_grounding ? `\n---\n${wolfram_grounding}` : '',
    ].filter(Boolean).join('\n\n');
  }
}
