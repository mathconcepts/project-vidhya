// @ts-nocheck
/**
 * src/content-studio/sources/llm.ts
 *
 * Source adapter: LLM (Gemini).
 *
 * Last-resort generation. Lowest trust of the four sources because
 * the LLM has no source-of-truth. Drafts produced via this path
 * SHOULD be marked source='llm' on promotion (the route handler
 * does this automatically).
 *
 * Mirrors the pattern used in src/api/chat-routes.ts:
 *   - Reads GEMINI_API_KEY from env
 *   - Returns null if not configured (graceful degrade — orchestrator
 *     falls through to the next source, or fails if this was last)
 *   - Uses the @google/generative-ai SDK directly
 *   - Goes through the same rate-limit + budget-cap protections
 *     so studio generation can't bypass the LLM-cost protections
 *     the chat path enforces
 *
 * The prompt is structured to produce a self-contained explainer,
 * with optional admin steering via GenerationRequest.llm_extra_prompt.
 *
 * I deliberately did NOT route through src/llm/ (the bigger LLM
 * abstraction layer) because:
 *   - The runtime hot paths use the direct SDK
 *   - The abstraction layer requires a config file at boot
 *   - Mirroring chat-routes keeps two places consistent and easy
 *     to debug
 *
 * If a deployment wants Anthropic / OpenAI instead of Gemini, that
 * would mean either swapping this file or routing through src/llm/.
 * Today: Gemini-only. Documented as a follow-up.
 */

import type { GenerationRequest } from '../types';
import type { AdapterResult } from './uploads';
import { checkRateLimit } from '../../lib/rate-limit';
import { tryReserveTokens, recordUsage, cancelReservation } from '../../lib/llm-budget';

let _model: any = null;

function getModel() {
  if (_model) return _model;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(key);
    _model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    return _model;
  } catch (e: any) {
    return null;
  }
}

/**
 * Outcome details surface to the orchestrator's SourceAttempt log
 * so an admin reviewing a failed studio generation can see exactly
 * why the LLM source returned null.
 */
export interface LlmSourceFailureReason {
  kind: 'no-key' | 'rate-limited' | 'budget-exceeded' | 'empty-response' | 'sdk-error';
  detail: string;
}

export async function tryLlmSource(
  req: GenerationRequest,
  actor_id: string = 'studio-anonymous',
): Promise<AdapterResult | null> {
  const model = getModel();
  if (!model) return null;

  // Rate limit check — separate bucket per content-studio LLM caller
  // so a runaway studio script doesn't drain a different endpoint's
  // budget. We use a manual override since 'content-studio.llm' isn't
  // in DEFAULT_LIMITS — keeps the limits table chat-focused. 5/hour
  // is generous for legitimate authoring; admins won't hit it.
  const rl = checkRateLimit(
    'content-studio.llm',
    actor_id,
    { capacity: 5, refill_per_sec: 5 / 3600 },
  );
  if (!rl.allowed) {
    // Returning null means the orchestrator records this as 'empty';
    // the source_empty_reason in store.ts will say why. The admin
    // sees the rate-limit message in the SourceAttempt detail.
    return null;
  }

  // Budget cap. Studio generation typically uses more tokens than a
  // chat turn — the prompt asks for a full explainer. Estimate
  // accordingly: input ~3000 tokens (system prompt + the full
  // GenerationRequest context), output ~3000 tokens (a thorough
  // explainer with worked examples).
  const _est_total_tokens = 6000;
  const budget = tryReserveTokens(actor_id, _est_total_tokens);
  if (!budget.allowed) {
    return null;
  }

  const prompt = buildPrompt(req);

  try {
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.();
    if (!text || !text.trim()) {
      // Free the reservation; no tokens were actually consumed
      cancelReservation(actor_id, _est_total_tokens);
      return null;
    }

    // Reconcile actual token usage. ~1 token per 4 chars of English.
    // Add the prompt length too — both sides count toward the budget.
    const _actual_tokens = Math.ceil((text.length + prompt.length) / 4);
    recordUsage(actor_id, _actual_tokens, _est_total_tokens);

    return {
      body: text.trim(),
      detail: `LLM-generated explainer for "${req.concept_id}" (~${text.length} chars, ~${_actual_tokens} tokens)`,
    };
  } catch (e: any) {
    // SDK error before tokens were consumed — free the reservation.
    cancelReservation(actor_id, _est_total_tokens);
    return null;
  }
}

function buildPrompt(req: GenerationRequest): string {
  const exam_context = req.exams && req.exams.length > 0
    ? `\nThis content is for students preparing for: ${req.exams.join(', ')}.`
    : '';
  const tag_context = req.tags && req.tags.length > 0
    ? `\nRelevant topics/tags: ${req.tags.join(', ')}.`
    : '';
  const difficulty_guidance = ({
    intro:        'Use intuitive language. Avoid jargon when possible. Build from concrete examples to abstract principles.',
    intermediate: 'Assume the student knows prerequisites and standard notation. Move briskly through definitions to applications.',
    advanced:     'Engage the topic at the level of a strong undergraduate. Include subtle edge cases and connections to related concepts.',
  })[req.difficulty] ?? '';

  const extra = req.llm_extra_prompt
    ? `\n\nAdditional steering from the admin:\n${req.llm_extra_prompt}`
    : '';

  return `You are writing teaching material for an educational platform. Write a self-contained explainer in markdown for the concept "${req.title}" (concept_id: ${req.concept_id}).

Difficulty level: ${req.difficulty}.
${difficulty_guidance}
${exam_context}
${tag_context}

Structure:
- Begin with a level-1 heading containing the concept title
- Follow with an "Intuition" section that builds physical/visual understanding
- Then a "Formal definition" or equivalent precise statement
- Include at least one fully worked example
- Conclude with common pitfalls or things to watch out for

Use LaTeX delimited by $ for inline math and $$ for display math. Do not include any preamble like "Here is the explainer" — output only the markdown body itself.${extra}`;
}
